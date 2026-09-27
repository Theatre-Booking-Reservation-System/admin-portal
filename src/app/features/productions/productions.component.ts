import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ProductionItem } from '../../core/models/catalogue.models';

/** View-model shape the template renders. */
interface Production {
  id: string;
  title: string;
  language: 'Sinhala' | 'Tamil' | 'English' | '—';
  genre: string;
  startDate: string;
  endDate: string;
  /** Raw ISO "YYYY-MM-DD" dates kept for range filtering. */
  releaseIso: string;
  endIso: string;
  status: 'Now Showing' | 'Inactive' | 'Upcoming' | 'Expired';
  abbr: string;
  /** Ready-to-use <img src>, or null to fall back to initials. */
  poster: string | null;
}

type FilterKey = 'All' | 'Now Showing' | 'Inactive' | 'Upcoming' | 'Expired';

@Component({
  selector: 'app-productions',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './productions.component.html',
  styleUrl: './productions.component.scss',
})
export class ProductionsComponent {
  private readonly catalogue = inject(CatalogueService);

  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Extra filters: category (genre), language, and a start-date range.
  readonly categoryFilter = signal('');
  readonly languageFilter = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly productions = signal<Production[]>([]);

  readonly languages = ['Sinhala', 'Tamil', 'English'];
  readonly categories = ['Drama', 'Musical', 'Comedy', 'Dance', 'Opera', 'Children'];

  readonly filters = computed<{ key: FilterKey; label: string; count: number }[]>(() => {
    const list = this.productions();
    return [
      { key: 'All', label: 'All', count: list.length },
      { key: 'Now Showing', label: 'Now Showing', count: list.filter((p) => p.status === 'Now Showing').length },
      { key: 'Upcoming', label: 'Upcoming', count: list.filter((p) => p.status === 'Upcoming').length },
      { key: 'Expired', label: 'Expired', count: list.filter((p) => p.status === 'Expired').length },
      { key: 'Inactive', label: 'Inactive', count: list.filter((p) => p.status === 'Inactive').length },
    ];
  });

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    const cat = this.categoryFilter().toLowerCase();
    const lang = this.languageFilter().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();
    return this.productions().filter((p) => {
      const matchesFilter = f === 'All' || p.status === f;
      const matchesSearch = !q || p.title.toLowerCase().includes(q);
      const matchesCategory = !cat || p.genre.toLowerCase() === cat;
      const matchesLanguage = !lang || p.language.toLowerCase() === lang;
      // Range test against the production's start (release) date.
      const matchesFrom = !from || (p.releaseIso !== '' && p.releaseIso >= from);
      const matchesTo = !to || (p.releaseIso !== '' && p.releaseIso <= to);
      return (
        matchesFilter &&
        matchesSearch &&
        matchesCategory &&
        matchesLanguage &&
        matchesFrom &&
        matchesTo
      );
    });
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalogue.getAllProductions().subscribe({
      next: (res) => {
        const items = res.productions ?? [];
        this.productions.set(items.map((p) => toView(p)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load productions. Please try again.');
        this.loading.set(false);
      },
    });
  }

  statusClass(s: Production['status']): string {
    switch (s) {
      case 'Now Showing':
        return 'pill--success';
      case 'Upcoming':
        return 'pill--warning';
      case 'Expired':
        return 'pill--info';
      case 'Inactive':
        return 'pill--muted';
      default:
        return 'pill--muted';
    }
  }

  onSearch(value: string) {
    this.search.set(value);
  }

  resetFilters() {
    this.search.set('');
    this.filter.set('All');
    this.categoryFilter.set('');
    this.languageFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
  }
}

const LANGUAGE_LABEL: Record<string, Production['language']> = {
  SINHALA: 'Sinhala',
  TAMIL: 'Tamil',
  ENGLISH: 'English',
};

/** Map a catalogue ProductionItem to the template's view-model. */
function toView(p: ProductionItem): Production {
  const title = p.title || 'Untitled';
  return {
    id: p.productionId,
    title,
    language: (p.language && LANGUAGE_LABEL[p.language]) || '—',
    genre: p.genre || '—',
    startDate: formatDate(p.releaseDate),
    endDate: formatDate(p.endDate),
    releaseIso: isoDate(p.releaseDate),
    endIso: isoDate(p.endDate),
    status: deriveStatus(p),
    abbr: initials(title),
    poster: posterSrc(p.posterImageUrl),
  };
}

/**
 * Normalise the API's posterImageUrl into an <img src>.
 * Accepts a full data URL, a raw base64 string, or a normal http(s) URL.
 * Returns null when there's nothing usable so the UI falls back to initials.
 */
function posterSrc(value?: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  // Already a data URL or an absolute/relative URL — use as-is.
  if (v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) {
    return v;
  }
  // Otherwise treat it as raw base64 image data. JPEG data starts with "/9j".
  const mime = v.startsWith('/9j') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${v}`;
}

/**
 * Derive the display status from the API's `status` flag and dates:
 *  - status !== 1 (e.g. 9)        → Inactive
 *  - releaseDate in the future    → Upcoming
 *  - endDate before today         → Expired (its run has finished)
 *  - otherwise (currently running)→ Now Showing
 */
function deriveStatus(p: ProductionItem): Production['status'] {
  if (p.status !== 1) return 'Inactive';
  if (isFuture(p.releaseDate)) return 'Upcoming';
  if (isPast(p.endDate)) return 'Expired';
  return 'Now Showing';
}

/** True when the date is strictly after today (start of day). */
function isFuture(dateStr?: string): boolean {
  const t = startOfDay(dateStr);
  if (t === null) return false;
  return t > todayStart();
}

/** True when the date is strictly before today (i.e. yesterday or earlier). */
function isPast(dateStr?: string): boolean {
  const t = startOfDay(dateStr);
  if (t === null) return false;
  return t < todayStart();
}

function startOfDay(dateStr?: string): number | null {
  if (!dateStr) return null;
  // Parse a "YYYY-MM-DD" (optionally with a time part) as a LOCAL date.
  // Using `new Date('2026-09-27')` would parse as UTC midnight, which can
  // shift the day across timezones and misclassify a "today" release.
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

/** Normalize to "YYYY-MM-DD" for range comparison (handles datetime strings). */
function isoDate(value?: string): string {
  if (!value) return '';
  return value.length > 10 ? value.slice(0, 10) : value;
}

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
