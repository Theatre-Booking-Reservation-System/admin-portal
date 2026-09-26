import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../core/services/booking.service';
import { BookingResponse } from '../../core/models/booking.models';

/** View-model shape the template renders. */
interface Booking {
  id: string;
  customer: string;
  production: string;
  performanceDate: string;
  performanceTime: string;
  seats: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Refunded' | 'Expired';
  payment: 'Paid' | 'Pending' | 'Refunded' | 'Failed';
}

type FilterKey = 'All' | 'Confirmed' | 'Pending' | 'Cancelled' | 'Refunded';

/**
 * Bookings list.
 *
 * The Booking Service exposes lookup-by-reference and per-patron listing, but
 * no "list every booking" endpoint. So the search box looks a booking up by
 * its reference (e.g. STB-20260913-00847) and shows the match here.
 */
@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
})
export class BookingsComponent {
  private readonly bookingApi = inject(BookingService);

  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly bookings = signal<Booking[]>([]);

  readonly filters = computed<{ key: FilterKey; label: string; count: number }[]>(() => {
    const list = this.bookings();
    return [
      { key: 'All', label: 'All', count: list.length },
      { key: 'Confirmed', label: 'Confirmed', count: list.filter((b) => b.status === 'Confirmed').length },
      { key: 'Pending', label: 'Pending', count: list.filter((b) => b.status === 'Pending').length },
      { key: 'Cancelled', label: 'Cancelled', count: list.filter((b) => b.status === 'Cancelled').length },
      { key: 'Refunded', label: 'Refunded', count: list.filter((b) => b.payment === 'Refunded').length },
    ];
  });

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.bookings().filter((b) => {
      const matchesFilter = f === 'All' || b.status === f || (f === 'Refunded' && b.payment === 'Refunded');
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
      case 'Failed':
      case 'Expired':
        return 'pill--danger';
      case 'Refunded':
        return 'pill--info';
      default:
        return 'pill--muted';
    }
  }

  onSearch(value: string) {
    this.search.set(value);
    const ref = value.trim();
    // Look up by full booking reference (STB-YYYYMMDD-NNNNN).
    if (/^STB-\d{8}-\d+$/i.test(ref)) {
      this.lookupByRef(ref);
    }
  }

  private lookupByRef(ref: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.bookingApi.getBookingByRef(ref).subscribe({
      next: (res) => {
        this.bookings.set(res.bookingId ? [toView(res)] : []);
        this.loading.set(false);
      },
      error: () => {
        this.bookings.set([]);
        this.error.set(`No booking found for reference "${ref}".`);
        this.loading.set(false);
      },
    });
  }
}

const STATUS_LABEL: Record<string, Booking['status']> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED_PATRON: 'Cancelled',
  CANCELLED_ADMIN: 'Cancelled',
  EXPIRED: 'Expired',
};

const PAYMENT_LABEL: Record<string, Booking['payment']> = {
  UNPAID: 'Pending',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
};

/** Map a BookingResponse to the template's view-model. */
function toView(b: BookingResponse): Booking {
  const seats = (b.lines ?? [])
    .map((l) => l.seatRef)
    .filter(Boolean)
    .join(', ');
  return {
    id: b.bookingRef || b.bookingId,
    customer: b.guestEmail || '—',
    production: '—',
    performanceDate: formatDate(b.createdAt),
    performanceTime: '',
    seats: seats || '—',
    amount: formatLkr(b.totalLkr),
    status: (b.status && STATUS_LABEL[b.status]) || 'Pending',
    payment: (b.paymentStatus && PAYMENT_LABEL[b.paymentStatus]) || 'Pending',
  };
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatLkr(amount?: number): string {
  if (amount === null || amount === undefined) return '—';
  return `LKR ${amount.toLocaleString('en-LK')}`;
}
