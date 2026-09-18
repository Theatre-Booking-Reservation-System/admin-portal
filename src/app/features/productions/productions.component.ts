import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface Production {
  id: string;
  title: string;
  language: 'Sinhala' | 'Tamil' | 'English';
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
  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');

  readonly productions: Production[] = [
    { id: 'p1', title: 'Sanda Katha', language: 'Sinhala', genre: 'Drama', startDate: '24 May 2025', endDate: '2 Jun 2025', status: 'Active', abbr: 'SK' },
    { id: 'p2', title: 'Yathra Oruwa', language: 'Tamil', genre: 'Drama', startDate: '25 May 2025', endDate: '3 Jun 2025', status: 'Active', abbr: 'YO' },
    { id: 'p3', title: 'The Merchant of Venice', language: 'English', genre: 'Drama', startDate: '28 May 2025', endDate: '6 Jun 2025', status: 'Active', abbr: 'MV' },
    { id: 'p4', title: 'Dharma Patha', language: 'Sinhala', genre: 'Drama', startDate: '28 May 2025', endDate: '6 Jun 2025', status: 'Active', abbr: 'DP' },
    { id: 'p5', title: 'Ahas Maliga', language: 'Sinhala', genre: 'Drama', startDate: '30 May 2025', endDate: '7 Jun 2025', status: 'Inactive', abbr: 'AM' },
    { id: 'p6', title: 'Maanavan', language: 'Tamil', genre: 'Drama', startDate: '31 May 2025', endDate: '8 Jun 2025', status: 'Active', abbr: 'MN' },
    { id: 'p7', title: 'Rathu Pata', language: 'Sinhala', genre: 'Musical', startDate: '10 Jun 2025', endDate: '15 Jun 2025', status: 'Upcoming', abbr: 'RP' },
  ];

  readonly filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: this.productions.length },
    { key: 'Active', label: 'Active', count: this.productions.filter((p) => p.status === 'Active').length },
    { key: 'Inactive', label: 'Inactive', count: this.productions.filter((p) => p.status === 'Inactive').length },
    { key: 'Upcoming', label: 'Upcoming', count: this.productions.filter((p) => p.status === 'Upcoming').length },
    { key: 'Archived', label: 'Archived', count: this.productions.filter((p) => p.status === 'Archived').length },
  ];

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.productions.filter((p) => {
      const matchesFilter = f === 'All' || p.status === f;
      const matchesSearch = !q || p.title.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

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
