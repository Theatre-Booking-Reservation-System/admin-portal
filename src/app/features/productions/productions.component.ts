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
  status: 'Active' | 'Inactive' | 'Upcoming' | 'Archived';
  abbr: string;
}

type FilterKey = 'All' | 'Active' | 'Inactive' | 'Upcoming' | 'Archived';

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

  readonly productions = signal<Production[]>([]);

  readonly filters = computed<{ key: FilterKey; label: string; count: number }[]>(() => {
    const list = this.productions();
    return [
      { key: 'All', label: 'All', count: list.length },
      { key: 'Active', label: 'Active', count: list.filter((p) => p.status === 'Active').length },
      { key: 'Inactive', label: 'Inactive', count: list.filter((p) => p.status === 'Inactive').length },
      { key: 'Upcoming', label: 'Upcoming', count: list.filter((p) => p.status === 'Upcoming').length },
      { key: 'Archived', label: 'Archived', count: list.filter((p) => p.status === 'Archived').length },
    ];
  });

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.productions().filter((p) => {
      const matchesFilter = f === 'All' || p.status === f;
      const matchesSearch = !q || p.title.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
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

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
