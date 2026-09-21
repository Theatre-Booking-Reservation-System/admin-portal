import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface Booking {
  id: string;
  customer: string;
  production: string;
  performanceDate: string;
  performanceTime: string;
  seats: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Refunded';
  payment: 'Paid' | 'Pending' | 'Refunded';
}

type FilterKey = 'All' | 'Confirmed' | 'Pending' | 'Cancelled' | 'Refunded';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
})
export class BookingsComponent {
  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');

  readonly bookings: Booking[] = [
    { id: 'STB2025-001', customer: 'Nimal Perera', production: 'Sanda Katha', performanceDate: '24 May 2025', performanceTime: '6:30 PM', seats: 'A12, A13', amount: 'LKR 4,000', status: 'Confirmed', payment: 'Paid' },
    { id: 'STB2025-002', customer: 'Kavindi Silva', production: 'Dharma Patha', performanceDate: '25 May 2025', performanceTime: '6:30 PM', seats: 'B5, B6, B7', amount: 'LKR 6,000', status: 'Pending', payment: 'Pending' },
    { id: 'STB2025-003', customer: 'Ruwan Jayasuriya', production: 'Yathra Oruwa', performanceDate: '25 May 2025', performanceTime: '3:00 PM', seats: 'C10', amount: 'LKR 2,000', status: 'Confirmed', payment: 'Paid' },
    { id: 'STB2025-004', customer: 'Tharindu Fernando', production: 'Sanda Katha', performanceDate: '26 May 2025', performanceTime: '10:00 AM', seats: 'A5, A6', amount: 'LKR 4,000', status: 'Confirmed', payment: 'Paid' },
    { id: 'STB2025-005', customer: 'Anjali Fernando', production: 'The Merchant of Venice', performanceDate: '26 May 2025', performanceTime: '6:30 PM', seats: 'D1, D2, D3', amount: 'LKR 6,000', status: 'Cancelled', payment: 'Refunded' },
    { id: 'STB2025-006', customer: 'Kasun De Silva', production: 'Sanda Katha', performanceDate: '27 May 2025', performanceTime: '3:00 PM', seats: 'AA1, AA2', amount: 'LKR 5,000', status: 'Confirmed', payment: 'Paid' },
    { id: 'STB2025-007', customer: 'Sithumi Perera', production: 'Dharma Patha', performanceDate: '28 May 2025', performanceTime: '6:30 PM', seats: 'B8, B9', amount: 'LKR 4,000', status: 'Pending', payment: 'Pending' },
    { id: 'STB2025-008', customer: 'Dinesh Mendis', production: 'Ahas Maliga', performanceDate: '29 May 2025', performanceTime: '3:00 PM', seats: 'C15, C16', amount: 'LKR 4,000', status: 'Confirmed', payment: 'Paid' },
    { id: 'STB2025-009', customer: 'Chamila Wijesinghe', production: 'Yathra Oruwa', performanceDate: '30 May 2025', performanceTime: '6:30 PM', seats: 'D4, D5', amount: 'LKR 4,000', status: 'Refunded', payment: 'Refunded' },
    { id: 'STB2025-010', customer: 'Isuru Perera', production: 'Sanda Katha', performanceDate: '31 May 2025', performanceTime: '6:30 PM', seats: 'A8, A9, A10', amount: 'LKR 6,000', status: 'Confirmed', payment: 'Paid' },
  ];

  readonly filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: 137 },
    { key: 'Confirmed', label: 'Confirmed', count: 98 },
    { key: 'Pending', label: 'Pending', count: 12 },
    { key: 'Cancelled', label: 'Cancelled', count: 18 },
    { key: 'Refunded', label: 'Refunded', count: 9 },
  ];

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.bookings.filter((b) => {
      const matchesFilter = f === 'All' || b.status === f;
      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.customer.toLowerCase().includes(q) ||
        b.production.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  statusClass(s: string): string {
    switch (s) {
      case 'Confirmed':
      case 'Paid':
        return 'pill--success';
      case 'Pending':
        return 'pill--warning';
      case 'Cancelled':
        return 'pill--danger';
      case 'Refunded':
        return 'pill--info';
      default:
        return 'pill--muted';
    }
  }

  onSearch(value: string) {
    this.search.set(value);
  }
}
