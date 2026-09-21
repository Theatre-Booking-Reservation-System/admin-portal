import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface TimelineStep {
  label: string;
  time: string;
  done: boolean;
}

@Component({
  selector: 'app-booking-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './booking-view.component.html',
  styleUrl: './booking-view.component.scss',
})
export class BookingViewComponent {
  readonly booking = {
    id: 'STB2025-001',
    status: 'Confirmed',
    createdAt: '20 May 2025, 2:15 PM',
    // Customer
    customerName: 'Nimal Perera',
    email: 'nimal.perera@email.com',
    phone: '+94 77 123 4567',
    customerType: 'Regular',
    memberSince: '12 Jan 2024',
    // Booking info
    production: 'Sanda Katha',
    performance: '24 May 2025 – 10:00 AM',
    venue: 'Main Theatre',
    seats: 'A12, A13',
    numberOfSeats: 2,
    amount: 'LKR 4,000',
    bookingDate: '20 May 2025, 2:15 PM',
    paymentStatus: 'Paid',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN123456789',
    abbr: 'SK',
  };

  readonly priceBreakdown = [
    { label: 'Ticket Price (Regular)', detail: 'LKR 1,800 × 2', amount: 'LKR 3,600' },
    { label: 'Booking Fee', detail: '', amount: 'LKR 200' },
  ];
  readonly totalAmount = 'LKR 4,000';

  readonly timeline: TimelineStep[] = [
    { label: 'Booking Created', time: '20 May 2025, 2:15 PM', done: true },
    { label: 'Payment Completed', time: '20 May 2025, 2:18 PM', done: true },
    { label: 'Booking Confirmed', time: '20 May 2025, 2:18 PM', done: true },
  ];

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

  print(): void {
    window.print();
  }
}
