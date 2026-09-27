import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { ProductionItem } from '../../../core/models/catalogue.models';
import { SeatService } from '../../../core/services/seat.service';
import { SeatSection, SeatZoneItem } from '../../../core/models/seat.models';

type Tab = 'overview' | 'cast' | 'performances' | 'pricing';

interface CastMember {
  name: string;
  role: string;
}

interface PerformanceRow {
  date: string;
  time: string;
  show: string;
  venue: string;
  status: 'Upcoming' | 'Active' | 'Completed';
}

/** A zone's computed matinee/evening price for this production. */
interface ZonePrice {
  zoneName: string;
  section: SeatSection;
  matinee: string;
  evening: string;
}

/** A section group for the pricing tables + seat map. */
interface SectionGroup {
  section: SeatSection;
  label: string;
  zones: ZonePrice[];
}

/** Header / overview view-model, populated from the catalogue API. */
interface ProductionView {
  id: string;
  title: string;
  status: 'Now Showing' | 'Upcoming' | 'Expired' | 'Inactive';
  dates: string;
  venue: string;
  language: string;
  genre: string;
  abbr: string;
  poster: string | null;
  synopsis: string;
  ageRestriction: string;
  duration: string;
  basePrice: string;
}

@Component({
  selector: 'app-production-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './production-view.component.html',
  styleUrl: './production-view.component.scss',
})
export class ProductionViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogue = inject(CatalogueService);
  private readonly seats = inject(SeatService);

  private readonly productionId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly tab = signal<Tab>('overview');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'cast', label: 'Cast & Crew' },
    // Performances tab hidden for now — not wired to the performances API yet.
    // { key: 'performances', label: 'Performances' },
    { key: 'pricing', label: 'Ticket Pricing' },
  ];

  /** The production loaded from GET /productions/{id}. */
  readonly production = signal<ProductionView | null>(null);

  /** Read-only cast/crew list from the production. */
  readonly cast = signal<CastMember[]>([]);

  // ── Ticket pricing: real seat zones × the production's base ticket cost ──
  private readonly zones = signal<SeatZoneItem[]>([]);
  private readonly baseCost = signal<number | null>(null);
  readonly zonesLoading = signal(true);
  readonly zonesError = signal<string | null>(null);

  /** Zones grouped by section, each priced from the base ticket cost. */
  readonly sections = computed<SectionGroup[]>(() => {
    const base = this.baseCost();
    const order: SeatSection[] = ['STALLS', 'CIRCLE', 'UPPER_CIRCLE'];
    return order
      .map((section) => ({
        section,
        label: SECTION_LABEL[section],
        zones: this.zones()
          .filter((z) => z.section === section)
          .map((z) => ({
            zoneName: z.zoneName || '—',
            section,
            matinee: price(base, z.matineePct),
            evening: price(base, z.eveningPct),
          })),
      }))
      .filter((g) => g.zones.length > 0);
  });

  constructor() {
    this.load();
    this.loadZones();
  }

  load(): void {
    if (!this.productionId) {
      this.error.set('No production id provided.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.catalogue.getProductionById(this.productionId).subscribe({
      next: (res) => {
        this.production.set(toView(res));
        this.baseCost.set(res.baseTicketCost ?? null);
        this.cast.set(
          (res.castCrew ?? [])
            .filter((m) => (m.value ?? '').trim() || (m.key ?? '').trim())
            .map((m) => ({ name: m.value ?? '', role: m.key ?? '' })),
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this production. Please try again.');
        this.loading.set(false);
      },
    });
  }

  readonly performances: PerformanceRow[] = [];

  /** Load the theatre's seat zones (used for the pricing tab + seat map). */
  loadZones(): void {
    this.zonesLoading.set(true);
    this.zonesError.set(null);
    this.seats.getAllSeatZones().subscribe({
      next: (res) => {
        this.zones.set(res.seatZones ?? []);
        this.zonesLoading.set(false);
      },
      error: () => {
        this.zonesError.set('Could not load seat zones.');
        this.zonesLoading.set(false);
      },
    });
  }

  statusClass(s: string): string {
    switch (s) {
      case 'Now Showing':
      case 'Active':
        return 'pill--success';
      case 'Upcoming':
        return 'pill--warning';
      case 'Expired':
        return 'pill--info';
      case 'Completed':
      case 'Inactive':
        return 'pill--muted';
      default:
        return 'pill--info';
    }
  }
}

const LANGUAGE_LABEL: Record<string, string> = {
  SINHALA: 'Sinhala',
  TAMIL: 'Tamil',
  ENGLISH: 'English',
};

const SECTION_LABEL: Record<SeatSection, string> = {
  STALLS: 'Stalls',
  CIRCLE: 'Circle',
  UPPER_CIRCLE: 'Upper Circle',
};

/**
 * Price a zone as baseCost × (1 + pct/100). `matineePct`/`eveningPct` are
 * percentage uplifts over the base ticket cost. Returns "—" if unknown.
 */
function price(base: number | null, pct?: number): string {
  if (base == null || pct == null) return '—';
  const value = base * (1 + pct / 100);
  return `LKR ${Math.round(value).toLocaleString('en-LK')}`;
}

/** Map a catalogue ProductionItem/Response to the view-model. */
function toView(p: ProductionItem): ProductionView {
  const title = p.title || 'Untitled';
  const release = formatDate(p.releaseDate);
  const end = formatDate(p.endDate);
  const dates = release === '—' && end === '—' ? '—' : `${release} – ${end}`;
  return {
    id: p.productionId,
    title,
    status: deriveStatus(p),
    dates,
    venue: 'Main Theatre',
    language: (p.language && LANGUAGE_LABEL[p.language]) || '—',
    genre: p.genre || '—',
    abbr: initials(title),
    poster: posterSrc(p.posterImageUrl),
    synopsis: p.description || 'No synopsis provided.',
    ageRestriction: p.ageRestriction || '—',
    duration: p.duration ? `${p.duration} minutes` : '—',
    basePrice: p.baseTicketCost != null ? `LKR ${p.baseTicketCost.toLocaleString('en-LK')}` : '—',
  };
}

/**
 * status !== 1 → Inactive; future release → Upcoming; past end → Expired;
 * otherwise Now Showing. Mirrors the productions list derivation.
 */
function deriveStatus(p: ProductionItem): ProductionView['status'] {
  if (p.status !== 1) return 'Inactive';
  if (isFuture(p.releaseDate)) return 'Upcoming';
  if (isPast(p.endDate)) return 'Expired';
  return 'Now Showing';
}

function isFuture(dateStr?: string): boolean {
  const t = startOfDay(dateStr);
  return t !== null && t > todayStart();
}

function isPast(dateStr?: string): boolean {
  const t = startOfDay(dateStr);
  return t !== null && t < todayStart();
}

function startOfDay(dateStr?: string): number | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (m) {
    const [, y, mo, day] = m;
    return new Date(Number(y), Number(mo) - 1, Number(day)).getTime();
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function todayStart(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function posterSrc(value?: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) {
    return v;
  }
  const mime = v.startsWith('/9j') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${v}`;
}

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
