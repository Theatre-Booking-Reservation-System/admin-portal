import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface Performance {
  id: string;
  date: string;
  time: string;
  production: string;
  showTitle: string;
  venue: string;
  language: 'Sinhala' | 'Tamil' | 'English';
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
  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');

  readonly performances: Performance[] = [
    { id: 'pf1', date: '24 May 2025', time: '10:00 AM', production: 'Sanda Katha', showTitle: 'Sanda Katha - Matinee', venue: 'Main Theatre', language: 'Sinhala', status: 'Upcoming', ticketsSold: 124, capacity: 200 },
    { id: 'pf2', date: '24 May 2025', time: '6:30 PM', production: 'Sanda Katha', showTitle: 'Sanda Katha', venue: 'Main Theatre', language: 'Sinhala', status: 'Upcoming', ticketsSold: 76, capacity: 200 },
    { id: 'pf3', date: '25 May 2025', time: '3:00 PM', production: 'Yathra Oruwa', showTitle: 'Yathra Oruwa', venue: 'Main Theatre', language: 'Tamil', status: 'Active', ticketsSold: 112, capacity: 200 },
    { id: 'pf4', date: '28 May 2025', time: '6:30 PM', production: 'The Merchant of Venice', showTitle: 'The Merchant of Venice', venue: 'Main Theatre', language: 'English', status: 'Upcoming', ticketsSold: 158, capacity: 200 },
    { id: 'pf5', date: '30 May 2025', time: '10:00 AM', production: 'Ahas Maliga', showTitle: 'Ahas Maliga - School Show', venue: 'Studio Theatre', language: 'Sinhala', status: 'Upcoming', ticketsSold: 270, capacity: 270 },
  ];

  readonly filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: 24 },
    { key: 'Upcoming', label: 'Upcoming', count: 8 },
    { key: 'Ongoing', label: 'Ongoing', count: 0 },
    { key: 'Completed', label: 'Completed', count: 12 },
    { key: 'Cancelled', label: 'Cancelled', count: 0 },
  ];

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.performances.filter((p) => {
      const matchesFilter =
        f === 'All' ||
        (f === 'Ongoing' ? p.status === 'Active' : p.status === (f as Performance['status']));
      const matchesSearch =
        !q || p.production.toLowerCase().includes(q) || p.showTitle.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

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
