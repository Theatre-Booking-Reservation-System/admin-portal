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

  readonly performances = signal<Performance[]>([]);

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
    // Load productions (for titles/language) and all performances together.
    forkJoin({
      productions: this.catalogue.getAllProductions(),
      performances: this.catalogue.searchPerformances({ size: 200, sort: 'date,asc' }),
    }).subscribe({
      next: ({ productions, performances }) => {
        const byId = new Map<string, ProductionItem>();
        for (const prod of productions.productions ?? []) {
          byId.set(prod.productionId, prod);
        }
        const items = performances.content ?? [];
        this.performances.set(items.map((pf) => toView(pf, byId.get(pf.productionId))));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load performances. Please try again.');
        this.loading.set(false);
      },
    });
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
  const title = prod?.titleEn || prod?.titleSi || prod?.titleTa || 'Untitled';
  const session = pf.sessionType === 'MATINEE' ? 'Matinee' : 'Evening';
  return {
    id: pf.performanceId,
    date: formatDate(pf.date),
    time: formatTime(pf.time),
    production: title,
    showTitle: `${title} — ${session}`,
    venue: 'Main Theatre',
    language: (prod?.language && LANGUAGE_LABEL[prod.language]) || '—',
    status: deriveStatus(pf),
    ticketsSold: 0,
    capacity: 0,
  };
}

/** status 9 = Cancelled/Inactive; past date = Completed; future = Upcoming. */
function deriveStatus(pf: PerformanceItem): Performance['status'] {
  if (pf.status === 9) return 'Cancelled';
  const cmp = compareToToday(pf.date);
  if (cmp === null) return 'Upcoming';
  if (cmp < 0) return 'Completed';
  if (cmp === 0) return 'Active';
  return 'Upcoming';
}

/** -1 past, 0 today, 1 future, null unknown. */
function compareToToday(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.sign(d.getTime() - today.getTime());
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
