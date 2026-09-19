import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

type Tab = 'booking' | 'seatmap' | 'sales' | 'notes';
type SeatState = 'available' | 'selected' | 'booked' | 'unavailable';

interface Seat {
  id: string;
  state: SeatState;
}
interface SeatRow {
  label: string;
  seats: Seat[];
}
interface SeatZone {
  name: string;
  rows: SeatRow[];
}

interface BookingRow {
  id: string;
  customer: string;
  seats: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  bookedOn: string;
}

@Component({
  selector: 'app-performance-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './performance-view.component.html',
  styleUrl: './performance-view.component.scss',
})
export class PerformanceViewComponent {
  readonly tab = signal<Tab>('booking');
  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'booking', label: 'Booking List (76)' },
    { key: 'seatmap', label: 'Seat Map' },
    { key: 'sales', label: 'Sales Report' },
    { key: 'notes', label: 'Notes' },
  ];

  readonly performance = {
    title: 'Sanda Katha',
    status: 'Upcoming',
    dateTime: '24 May 2025, 6:30 PM',
    production: 'Sanda Katha',
    showTitle: 'Sanda Katha',
    venue: 'Main Theatre',
    language: 'Sinhala',
    duration: '120 minutes',
    totalSeats: 200,
    ticketsSold: 76,
    abbr: 'SK',
  };

  get soldPct(): number {
    return Math.round((this.performance.ticketsSold / this.performance.totalSeats) * 100);
  }

  readonly bookings: BookingRow[] = [
    { id: 'BK207245', customer: 'Nimal Perera', seats: 'A12, A13', amount: '5,000', status: 'Confirmed', bookedOn: '20 May 2025' },
    { id: 'BK207246', customer: 'Sahan Dias', seats: 'B5, B6, B7', amount: '7,500', status: 'Confirmed', bookedOn: '20 May 2025' },
    { id: 'BK207247', customer: 'Kavindi Silva', seats: 'C10', amount: '2,500', status: 'Confirmed', bookedOn: '21 May 2025' },
    { id: 'BK207248', customer: 'School of Colombo', seats: 'D1 – D20', amount: '50,000', status: 'Pending', bookedOn: '21 May 2025' },
    { id: 'BK207249', customer: 'Ishara Fernando', seats: 'AA3', amount: '3,500', status: 'Confirmed', bookedOn: '22 May 2025' },
  ];

  // ── Seat map (representative Scenario 2 layout) ─────────────────────────
  readonly zones: SeatZone[] = [
    this.buildZone('Stalls', ['AA', 'BB', 'A', 'B', 'C', 'D', 'P', 'Q'], 16),
    this.buildZone('Circle', ['A', 'B', 'C', 'D', 'E'], 16),
    this.buildZone('Upper Circle', ['A', 'B', 'C'], 16),
  ];

  statusClass(s: string): string {
    switch (s) {
      case 'Confirmed':
        return 'pill--success';
      case 'Pending':
        return 'pill--warning';
      case 'Cancelled':
        return 'pill--danger';
      default:
        return 'pill--muted';
    }
  }

  private buildZone(name: string, rowLabels: string[], perRow: number): SeatZone {
    const rows: SeatRow[] = rowLabels.map((label, ri) => {
      const seats: Seat[] = [];
      for (let i = 1; i <= perRow; i++) {
        // Deterministic mix of states for a realistic-looking map.
        const seed = (ri * 7 + i * 3) % 11;
        let state: SeatState = 'available';
        if (seed === 0 || seed === 5) state = 'booked';
        else if (seed === 8) state = 'unavailable';
        seats.push({ id: `${label}${i}`, state });
      }
      return { label, seats };
    });
    return { name, rows };
  }
}
