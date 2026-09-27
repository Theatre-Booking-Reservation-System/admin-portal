import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, of } from 'rxjs';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { PerformanceResponse, ProductionResponse } from '../../../core/models/catalogue.models';
import { SeatService } from '../../../core/services/seat.service';
import { PerformanceSeatItem } from '../../../core/models/seat.models';

type Tab = 'seatmap';
type SeatState = 'available' | 'selected' | 'booked' | 'unavailable';

interface Seat {
  id: string;
  state: SeatState;
  seatNumber: number;
}
interface SeatRow {
  label: string;
  seats: Seat[];
}
interface SeatZone {
  name: string;
  rows: SeatRow[];
}

/** Header / details view-model, populated from the catalogue API. */
interface PerformanceView {
  id: string;
  title: string;
  status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';
  dateTime: string;
  production: string;
  showTitle: string;
  venue: string;
  language: string;
  duration: string;
  abbr: string;
  /** Production poster as a usable <img src>, or null. */
  poster: string | null;
}

@Component({
  selector: 'app-performance-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './performance-view.component.html',
  styleUrl: './performance-view.component.scss',
})
export class PerformanceViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogue = inject(CatalogueService);
  private readonly seats = inject(SeatService);

  private readonly performanceId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly performance = signal<PerformanceView | null>(null);

  // Seat map loaded from GET /performances/{id}/seats.
  readonly zones = signal<SeatZone[]>([]);
  readonly seatsLoading = signal(true);
  readonly seatsError = signal<string | null>(null);

  readonly tab = signal<Tab>('seatmap');
  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'seatmap', label: 'Seat Map' },
  ];

  constructor() {
    this.load();
    this.loadSeats();
  }

  /** Load the seat map for this performance. */
  loadSeats(): void {
    if (!this.performanceId) {
      this.seatsError.set('No performance id provided.');
      this.seatsLoading.set(false);
      return;
    }
    this.seatsLoading.set(true);
    this.seatsError.set(null);
    this.seats.getSeatsByPerformanceId(this.performanceId).subscribe({
      next: (res) => {
        this.zones.set(buildZones(res.seats ?? []));
        this.seatsLoading.set(false);
      },
      error: () => {
        this.seatsError.set('Could not load the seat map.');
        this.seatsLoading.set(false);
      },
    });
  }

  load(): void {
    if (!this.performanceId) {
      this.error.set('No performance id provided.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.catalogue
      .getPerformanceById(this.performanceId)
      .pipe(
        switchMap((perf) => {
          // Fetch the parent production for its title / language.
          if (perf.productionId) {
            return this.catalogue.getProductionById(perf.productionId).pipe(
              switchMap((prod) => of({ perf, prod })),
            );
          }
          return of({ perf, prod: undefined as ProductionResponse | undefined });
        }),
      )
      .subscribe({
        next: ({ perf, prod }) => {
          this.performance.set(toView(perf, prod));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load this performance. Please try again.');
          this.loading.set(false);
        },
      });
  }

  statusPill(s: PerformanceView['status']): string {
    switch (s) {
      case 'Active':
        return 'pill--success';
      case 'Upcoming':
        return 'pill--warning';
      case 'Cancelled':
        return 'pill--danger';
      default:
        return 'pill--muted';
    }
  }
}

const SEAT_STATE: Record<string, SeatState> = {
  AVAILABLE: 'available',
  HELD: 'unavailable',
  BOOKED: 'booked',
  BLOCKED: 'unavailable',
};

const SECTION_LABEL: Record<string, string> = {
  STALLS: 'Stalls',
  CIRCLE: 'Circle',
  UPPER_CIRCLE: 'Upper Circle',
};

const SECTION_ORDER = ['STALLS', 'CIRCLE', 'UPPER_CIRCLE'];

/**
 * Group API seats into zones → rows → seats for the seat-map UI.
 * Zones are ordered by section (stalls first), then by zone name; rows are
 * ordered by row label and seats by seat number.
 */
function buildZones(items: PerformanceSeatItem[]): SeatZone[] {
  // zoneKey -> { section, zoneName, rows: rowLabel -> seats[] }
  const zoneMap = new Map<
    string,
    { section: string; zoneName: string; rows: Map<string, Seat[]> }
  >();

  for (const s of items) {
    const section = s.section ?? '';
    const zoneName = s.zoneName || SECTION_LABEL[section] || 'Zone';
    const zoneKey = `${section}|${zoneName}`;
    let zone = zoneMap.get(zoneKey);
    if (!zone) {
      zone = { section, zoneName, rows: new Map() };
      zoneMap.set(zoneKey, zone);
    }
    const rowLabel = s.rowLabel || '—';
    const rowSeats = zone.rows.get(rowLabel) ?? [];
    rowSeats.push({
      id: `${rowLabel}${s.seatNumber ?? ''}`,
      state: SEAT_STATE[s.status ?? ''] ?? 'available',
      seatNumber: s.seatNumber ?? 0,
    });
    zone.rows.set(rowLabel, rowSeats);
  }

  return [...zoneMap.values()]
    .sort((a, b) => {
      const si = SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section);
      return si !== 0 ? si : a.zoneName.localeCompare(b.zoneName);
    })
    .map((zone) => ({
      name: zone.zoneName,
      rows: [...zone.rows.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, seats]) => ({
          label,
          seats: seats.sort((x, y) => x.seatNumber - y.seatNumber),
        })),
    }));
}

const LANGUAGE_LABEL: Record<string, string> = {
  SINHALA: 'Sinhala',
  TAMIL: 'Tamil',
  ENGLISH: 'English',
};

/** Map the API performance (+ its production) to the view-model. */
function toView(pf: PerformanceResponse, prod?: ProductionResponse): PerformanceView {
  const title = prod?.title || 'Untitled';
  const session = pf.sessionType === 'MATINEE' ? 'Matinee' : 'Evening';
  return {
    id: pf.performanceId,
    title,
    status: deriveStatus(pf),
    dateTime: formatDateTime(pf.date, pf.time),
    production: title,
    showTitle: session,
    venue: 'Main Theatre',
    language: (prod?.language && LANGUAGE_LABEL[prod.language]) || '—',
    duration: prod?.duration ? `${prod.duration} minutes` : '—',
    abbr: initials(title),
    poster: posterSrc(prod?.posterImageUrl),
  };
}

/** Normalise posterImageUrl into an <img src> (data URL / URL / raw base64). */
function posterSrc(value?: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) {
    return v;
  }
  const mime = v.startsWith('/9j') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${v}`;
}

/** Cancelled (status 9); else by date+time: past → Completed, today → Active, future → Upcoming. */
function deriveStatus(pf: PerformanceResponse): PerformanceView['status'] {
  if (pf.status === 9) return 'Cancelled';
  const when = combineDateTime(pf.date, pf.time);
  if (when === null) return 'Upcoming';
  const now = Date.now();
  if (when.getTime() <= now) return 'Completed';
  if (isSameDay(when, new Date())) return 'Active';
  return 'Upcoming';
}

function combineDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  const dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!dm) {
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
  const [, y, mo, day] = dm;
  let hours = 23;
  let minutes = 59;
  let seconds = 59;
  if (timeStr) {
    const tm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(timeStr.trim());
    if (tm) {
      hours = Number(tm[1]);
      minutes = Number(tm[2]);
      seconds = tm[3] ? Number(tm[3]) : 0;
    }
  }
  return new Date(Number(y), Number(mo) - 1, Number(day), hours, minutes, seconds);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const datePart = isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timePart = formatTime(timeStr);
  return timePart ? `${datePart}, ${timePart}` : datePart;
}

function formatTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = Number(h);
  const min = Number(m ?? 0);
  if (isNaN(hour)) return time;
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
