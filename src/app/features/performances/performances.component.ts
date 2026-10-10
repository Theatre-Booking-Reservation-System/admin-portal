import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { CatalogueService } from '../../core/services/catalogue.service';
import { PerformanceItem, ProductionItem } from '../../core/models/catalogue.models';

/** View-model shape the template renders. */
interface Performance {
  id: string;
  date: string;
  time: string;
  /** Raw "YYYY-MM-DDTHH:mm:ss" sort key for newest-first ordering. */
  sortKey: string;
  production: string;
  showTitle: string;
  venue: string;
  language: 'Sinhala' | 'Tamil' | 'English' | '—';
  status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';
  ticketsSold: number;
  capacity: number;
}

type FilterKey = 'All' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

@Component({
  selector: 'app-performances',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './performances.component.html',
  styleUrl: './performances.component.scss',
})
export class PerformancesComponent {
  private readonly catalogue = inject(CatalogueService);

  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Server-side filters passed to /performances/search.
  readonly productionFilter = signal(''); // productionId, '' = all
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly performances = signal<Performance[]>([]);
  /** Productions for the filter dropdown + title/language lookup. */
  readonly productionOptions = signal<{ id: string; title: string }[]>([]);
  private productionsById = new Map<string, ProductionItem>();

  // ── Delete confirmation ──────────────────────────────────────────────────
  readonly deleteTarget = signal<Performance | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly filters = computed<{ key: FilterKey; label: string; count: number }[]>(() => {
    const list = this.performances();
    return [
      { key: 'All', label: 'All', count: list.length },
      { key: 'Upcoming', label: 'Upcoming', count: list.filter((p) => p.status === 'Upcoming').length },
      { key: 'Ongoing', label: 'Ongoing', count: list.filter((p) => p.status === 'Active').length },
      { key: 'Completed', label: 'Completed', count: list.filter((p) => p.status === 'Completed').length },
      { key: 'Cancelled', label: 'Cancelled', count: list.filter((p) => p.status === 'Cancelled').length },
    ];
  });

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.performances().filter((p) => {
      const matchesFilter =
        f === 'All' ||
        (f === 'Ongoing' ? p.status === 'Active' : p.status === (f as Performance['status']));
      const matchesSearch =
        !q || p.production.toLowerCase().includes(q) || p.showTitle.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    // Load productions (for titles/language + the filter dropdown) via
    // /productions/search, and the performances via /performances/search.
    forkJoin({
      productions: this.catalogue.searchProductions({ size: 200, sort: 'releaseDate,asc' }),
      performances: this.catalogue.searchPerformances(this.buildParams()),
    }).subscribe({
      next: ({ productions, performances }) => {
        this.productionsById = new Map<string, ProductionItem>();
        for (const prod of productions.content ?? []) {
          this.productionsById.set(prod.productionId, prod);
        }
        this.productionOptions.set(
          (productions.content ?? []).map((p) => ({ id: p.productionId, title: p.title || 'Untitled' })),
        );
        this.setRows(performances.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load performances. Please try again.');
        this.loading.set(false);
      },
    });
  }

  /** Re-run only the performance search (filters changed); productions are cached. */
  searchPerformances(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalogue.searchPerformances(this.buildParams()).subscribe({
      next: (res) => {
        this.setRows(res.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load performances. Please try again.');
        this.loading.set(false);
      },
    });
  }

  /** Build the /performances/search query from the active server-side filters. */
  private buildParams() {
    return {
      productionId: this.productionFilter() || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      size: 200,
      sort: 'date,desc',
    };
  }

  private setRows(items: PerformanceItem[]): void {
    const rows = items.map((pf) => toView(pf, this.productionsById.get(pf.productionId)));
    // Newest-first by performance date+time, regardless of server ordering.
    rows.sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));
    this.performances.set(rows);
  }

  // Filter change handlers — each re-queries /performances/search.
  onProductionFilter(id: string): void {
    this.productionFilter.set(id);
    this.searchPerformances();
  }

  onDateFrom(value: string): void {
    this.dateFrom.set(value);
    this.searchPerformances();
  }

  onDateTo(value: string): void {
    this.dateTo.set(value);
    this.searchPerformances();
  }

  statusClass(s: Performance['status']): string {
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

  // ── Delete flow ───────────────────────────────────────────────────────────

  /** Open the confirmation dialog for a performance. */
  askDelete(p: Performance): void {
    this.deleteError.set(null);
    this.deleteTarget.set(p);
  }

  /** Close the dialog without deleting (ignored while a delete is in flight). */
  cancelDelete(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
  }

  /** Confirm and DELETE /performances/{id}, then drop the row on success. */
  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    this.catalogue.deletePerformance(target.id).subscribe({
      next: () => {
        this.performances.update((list) => list.filter((p) => p.id !== target.id));
        this.deleting.set(false);
        this.deleteTarget.set(null);
      },
      error: () => {
        this.deleteError.set('Could not delete this performance. Please try again.');
        this.deleting.set(false);
      },
    });
  }

  onSearch(value: string) {
    this.search.set(value);
  }
}

const LANGUAGE_LABEL: Record<string, Performance['language']> = {
  SINHALA: 'Sinhala',
  TAMIL: 'Tamil',
  ENGLISH: 'English',
};

/** Map a PerformanceItem (+ its production) to the template's view-model. */
function toView(pf: PerformanceItem, prod?: ProductionItem): Performance {
  const title = prod?.title || 'Untitled';
  const session = pf.sessionType === 'MATINEE' ? 'Matinee' : 'Evening';
  return {
    id: pf.performanceId,
    date: formatDate(pf.date),
    time: formatTime(pf.time),
    sortKey: `${isoDate(pf.date)}T${normalizeTime(pf.time)}`,
    production: title,
    // "Show Title" column shows the session type (Matinee / Evening).
    showTitle: session,
    venue: 'Main Theatre',
    language: (prod?.language && LANGUAGE_LABEL[prod.language]) || '—',
    status: deriveStatus(pf),
    ticketsSold: 0,
    capacity: 0,
  };
}

/**
 * status 9 = Cancelled/Inactive. Otherwise use the full date+time:
 *  - date+time already passed → Completed
 *  - same day, not yet passed  → Active (showing today)
 *  - future                    → Upcoming
 */
function deriveStatus(pf: PerformanceItem): Performance['status'] {
  if (pf.status === 9) return 'Cancelled';
  const when = combineDateTime(pf.date, pf.time);
  if (when === null) return 'Upcoming';
  const now = Date.now();
  if (when.getTime() <= now) return 'Completed';
  if (isSameDay(when, new Date())) return 'Active';
  return 'Upcoming';
}

/** Build a local Date from a "YYYY-MM-DD" date and an "HH:mm[:ss]" time. */
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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Normalise an API date/datetime to "YYYY-MM-DD" for sorting. */
function isoDate(value?: string): string {
  if (!value) return '';
  return value.length > 10 ? value.slice(0, 10) : value;
}

/** Normalise a time to zero-padded "HH:mm:ss" for lexical sorting. */
function normalizeTime(value?: string): string {
  if (!value) return '00:00:00';
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  if (!m) return '00:00:00';
  const [, h, mm, ss] = m;
  return `${h.padStart(2, '0')}:${mm}:${ss ?? '00'}`;
}

/** "18:30:00" / "18:30" -> "6:30 PM". */
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
