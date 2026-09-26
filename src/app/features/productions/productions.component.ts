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
  status: 'Active' | 'Inactive' | 'Upcoming';
  abbr: string;
}

type FilterKey = 'All' | 'Active' | 'Inactive' | 'Upcoming';

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
      { key: 'Active', label: 'Active', count: list.filter((p) => p.status === 'Active').length },
      { key: 'Inactive', label: 'Inactive', count: list.filter((p) => p.status === 'Inactive').length },
      { key: 'Upcoming', label: 'Upcoming', count: list.filter((p) => p.status === 'Upcoming').length },
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
      case 'Active':
        return 'pill--success';
      case 'Inactive':
        return 'pill--muted';
      case 'Upcoming':
        return 'pill--warning';
      default:
        return 'pill--info';
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
  const title = p.titleEn || p.titleSi || p.titleTa || 'Untitled';
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
  };
}

/** status: 1 = Active, 9 = Inactive/Archived; future release date = Upcoming. */
function deriveStatus(p: ProductionItem): Production['status'] {
  if (p.status === 9) return 'Inactive';
  if (isFuture(p.releaseDate)) return 'Upcoming';
  return 'Active';
}

function isFuture(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
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
