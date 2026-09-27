import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../core/services/booking.service';
import {
  BookingStatus,
  PaymentStatus,
  RecentBookingItem,
} from '../../core/models/booking.models';

/** A recent booking prepared for the table, with lazily-loaded seats. */
interface BookingRow {
  ref: string;
  bookingId: string;
  customer: string;
  show: string;
  dateTime: string;
  amount: string;
  statusLabel: string;
  statusClass: string;
  paymentLabel: string;
  paymentClass: string;
  // Seat panel state (loaded on demand from GET /bookings/{ref}).
  expanded: boolean;
  seatsLoading: boolean;
  seats: string[] | null;
  seatsError: string | null;
}

/**
 * Bookings — lists recent bookings across all patrons (GET /bookings/recent).
 * Seats are not part of the recent-bookings response, so each row can be
 * expanded to fetch that booking's detail (GET /bookings/{ref}) and show the
 * selected seats on demand.
 */
@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
})
export class BookingsComponent {
  private readonly bookingApi = inject(BookingService);

  readonly search = signal('');
  readonly rows = signal<BookingRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.rows();
    return this.rows().filter(
      (r) =>
        r.ref.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        r.show.toLowerCase().includes(q),
    );
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    // Pull a generous window of recent bookings for the admin list.
    this.bookingApi.getRecentBookings(100).subscribe({
      next: (res) => {
        this.rows.set((res.bookings ?? []).map(toRow));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load bookings.');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  /** Toggle a row's seat panel, fetching the booking detail on first open. */
  toggleSeats(row: BookingRow): void {
    const willExpand = !row.expanded;
    this.patch(row.ref, { expanded: willExpand });
    if (!willExpand || row.seats !== null || row.seatsLoading) return;

    this.patch(row.ref, { seatsLoading: true, seatsError: null });
    this.bookingApi.getBookingByRef(row.ref).subscribe({
      next: (res) => {
        const seats = (res.seats ?? [])
          .map((s) => s.seatRef || s.seatId || '')
          .filter(Boolean);
        this.patch(row.ref, { seats, seatsLoading: false });
      },
      error: () => {
        this.patch(row.ref, { seatsError: 'Could not load seats.', seatsLoading: false });
      },
    });
  }

  /** Immutably update one row (matched by its stable ref) in the signal. */
  private patch(ref: string, changes: Partial<BookingRow>): void {
    this.rows.update((list) => list.map((r) => (r.ref === ref ? { ...r, ...changes } : r)));
  }
}

function toRow(b: RecentBookingItem): BookingRow {
  const status = statusView(b.status);
  const payment = paymentView(b.paymentStatus);
  return {
    ref: b.bookingRef || b.bookingId || '—',
    bookingId: b.bookingId || '',
    customer: b.customerName || '—',
    show: b.showName || '—',
    dateTime: formatDateTime(b.performanceDate, b.performanceTime, b.createdAt),
    amount: formatLkr(b.totalLkr),
    statusLabel: status.label,
    statusClass: status.cssClass,
    paymentLabel: payment.label,
    paymentClass: payment.cssClass,
    expanded: false,
    seatsLoading: false,
    seats: null,
    seatsError: null,
  };
}

function statusView(s?: BookingStatus): { label: string; cssClass: string } {
  switch (s) {
    case 'CONFIRMED':
      return { label: 'Confirmed', cssClass: 'pill--success' };
    case 'PENDING':
      return { label: 'Pending', cssClass: 'pill--warning' };
    case 'CANCELLED_PATRON':
      return { label: 'Cancelled', cssClass: 'pill--danger' };
    case 'CANCELLED_ADMIN':
      return { label: 'Cancelled (Admin)', cssClass: 'pill--danger' };
    case 'EXPIRED':
      return { label: 'Expired', cssClass: 'pill--muted' };
    default:
      return { label: s || '—', cssClass: 'pill--muted' };
  }
}

function paymentView(p?: PaymentStatus): { label: string; cssClass: string } {
  switch (p) {
    case 'PAID':
      return { label: 'Paid', cssClass: 'pill--success' };
    case 'UNPAID':
      return { label: 'Unpaid', cssClass: 'pill--warning' };
    case 'REFUNDED':
      return { label: 'Refunded', cssClass: 'pill--info' };
    case 'FAILED':
      return { label: 'Failed', cssClass: 'pill--danger' };
    default:
      return { label: p || '—', cssClass: 'pill--muted' };
  }
}

function formatDateTime(date?: string, time?: string, createdAt?: string): string {
  if (date) {
    const d = new Date(date);
    const datePart = isNaN(d.getTime())
      ? date
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = formatTime(time);
    return timePart ? `${datePart}, ${timePart}` : datePart;
  }
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }
  return '—';
}

/** "18:30:00" / "18:30" -> "6:30 PM". */
function formatTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = Number(h);
  const min = Number(m ?? 0);
  if (isNaN(hour)) return '';
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

function formatLkr(n?: number): string {
  return n == null ? '—' : `LKR ${Math.round(n).toLocaleString('en-US')}`;
}
