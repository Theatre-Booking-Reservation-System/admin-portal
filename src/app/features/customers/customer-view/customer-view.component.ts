import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface BookingHistory {
  id: string;
  production: string;
  date: string;
  seats: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Refunded';
}

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './customer-view.component.html',
  styleUrl: './customer-view.component.scss',
})
export class CustomerViewComponent {
  readonly customer = {
    id: 'c1',
    name: 'Nimal Perera',
    email: 'nimal.perera@email.com',
    phone: '+94 77 123 4567',
    abbr: 'NP',
    status: 'Active',
    memberSince: '12 Jan 2024',
    // Loyalty
    loyaltyMember: true,
    loyaltyCardNo: 'SL-2024-00187',
    // Stats
    totalBookings: 12,
    upcomingBookings: 2,
    totalSpend: 'LKR 48,000',
    // Account lock (set after 3 failed login attempts by the Identity Service)
    failedAttempts: 3,
  };

  /** Whether the account is currently locked. */
  readonly locked = signal(true);

  unlock(): void {
    // UI-only: clears the lock. Wires to the Identity Service unlock endpoint later.
    this.locked.set(false);
  }

  readonly bookings: BookingHistory[] = [
    { id: 'STB2025-001', production: 'Sanda Katha', date: '24 May 2025, 6:30 PM', seats: 'A12, A13', amount: 'LKR 4,000', status: 'Confirmed' },
    { id: 'STB2025-018', production: 'Dharma Patha', date: '18 Apr 2025, 3:00 PM', seats: 'C10', amount: 'LKR 2,500', status: 'Confirmed' },
    { id: 'STB2025-042', production: 'The Merchant of Venice', date: '2 Mar 2025, 6:30 PM', seats: 'B5, B6', amount: 'LKR 5,000', status: 'Confirmed' },
    { id: 'STB2025-061', production: 'Yathra Oruwa', date: '10 Feb 2025, 3:00 PM', seats: 'D2', amount: 'LKR 2,000', status: 'Cancelled' },
    { id: 'STB2025-088', production: 'Ahas Maliga', date: '5 Jan 2025, 6:30 PM', seats: 'AA1, AA2', amount: 'LKR 5,000', status: 'Confirmed' },
  ];

  statusClass(s: string): string {
    switch (s) {
      case 'Confirmed':
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
}
