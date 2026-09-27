import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PatronService } from '../../../core/services/patron.service';
import { PatronSummary } from '../../../core/models/auth.models';
import { BookingService } from '../../../core/services/booking.service';
import { BookingItem } from '../../../core/models/booking.models';

/** View-model the template renders. */
interface CustomerView {
  id: string;
  name: string;
  abbr: string;
  email: string;
  phone: string;
  nic: string;
  birthday: string;
  memberSince: string;
  verified: boolean;
  loyaltyMember: boolean;
  loyaltyCardNo: string;
}

interface BookingHistory {
  /** Display reference (bookingRef, falling back to id). */
  id: string;
  /** Raw booking UUID — required by the cancel endpoint. */
  bookingId: string;
  date: string;
  seats: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Refunded' | 'Expired';
  /** Whether this booking can still be cancelled. */
  cancellable: boolean;
}

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './customer-view.component.html',
  styleUrl: './customer-view.component.scss',
})
export class CustomerViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly patrons = inject(PatronService);
  private readonly bookingApi = inject(BookingService);

  private readonly patronId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly customer = signal<CustomerView | null>(null);

  /** Whether the account is currently locked (Identity status 9). */
  readonly locked = signal(false);
  readonly unlocking = signal(false);

  readonly initials = computed(() => this.customer()?.abbr ?? '');

  // Booking history from GET /patrons/{id}/bookings.
  readonly bookings = signal<BookingHistory[]>([]);
  readonly bookingsLoading = signal(true);
  readonly bookingsError = signal<string | null>(null);

  // ── Cancel-booking confirmation ──────────────────────────────────────────
  readonly cancelTarget = signal<BookingHistory | null>(null);
  readonly cancelling = signal(false);
  readonly cancelError = signal<string | null>(null);

  constructor() {
    this.load();
    this.loadBookings();
  }

  /** Load this patron's booking history. */
  loadBookings(): void {
    if (!this.patronId) {
      this.bookingsLoading.set(false);
      return;
    }
    this.bookingsLoading.set(true);
    this.bookingsError.set(null);
    this.bookingApi.getBookingsByPatronId(this.patronId).subscribe({
      next: (res) => {
        this.bookings.set((res.bookings ?? []).map(bookingToView));
        this.bookingsLoading.set(false);
      },
      error: () => {
        this.bookingsError.set('Could not load booking history.');
        this.bookingsLoading.set(false);
      },
    });
  }

  // ── Cancel a booking ──────────────────────────────────────────────────────

  /** Open the cancel-confirmation dialog for a booking. */
  askCancel(b: BookingHistory): void {
    this.cancelError.set(null);
    this.cancelTarget.set(b);
  }

  /** Close the dialog (ignored while a cancel is in flight). */
  dismissCancel(): void {
    if (this.cancelling()) return;
    this.cancelTarget.set(null);
  }

  /** Confirm and PUT /bookings/{id}/cancel, then mark the row cancelled. */
  confirmCancel(): void {
    const target = this.cancelTarget();
    if (!target || this.cancelling()) return;
    this.cancelling.set(true);
    this.cancelError.set(null);
    this.bookingApi.cancelBooking(target.bookingId).subscribe({
      next: () => {
        this.bookings.update((list) =>
          list.map((b) =>
            b.bookingId === target.bookingId
              ? { ...b, status: 'Cancelled', cancellable: false }
              : b,
          ),
        );
        this.cancelling.set(false);
        this.cancelTarget.set(null);
      },
      error: (err) => {
        this.cancelError.set(
          err?.status === 409
            ? 'This booking can no longer be cancelled.'
            : 'Could not cancel this booking. Please try again.',
        );
        this.cancelling.set(false);
      },
    });
  }

  load(): void {
    if (!this.patronId) {
      this.error.set('No customer id provided.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.patrons.getPatron(this.patronId).subscribe({
      next: (res) => {
        const p = res.patron;
        if (!p) {
          this.error.set('Customer not found.');
          this.loading.set(false);
          return;
        }
        this.customer.set(toView(p));
        this.locked.set(p.status === 9);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this customer. Please try again.');
        this.loading.set(false);
      },
    });
  }

  unlock(): void {
    if (!this.patronId) return;
    this.unlocking.set(true);
    this.patrons.unlockPatron(this.patronId).subscribe({
      next: () => {
        this.locked.set(false);
        this.unlocking.set(false);
      },
      error: () => {
        this.error.set('Could not unlock this account. Please try again.');
        this.unlocking.set(false);
      },
    });
  }

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

/** Map an Identity PatronSummary to the view-model. */
function toView(p: PatronSummary): CustomerView {
  const name = p.name || 'Unknown';
  return {
    id: p.patronId,
    name,
    abbr: initials(name),
    email: p.email || '—',
    phone: p.contactNo || '—',
    nic: p.nicPassportNo || '—',
    birthday: formatDate(p.dateOfBirth),
    memberSince: formatDate(p.addedDate),
    verified: !!p.verified,
    loyaltyMember: !!p.loyaltyHolder,
    loyaltyCardNo: p.loyaltyCardNo || '—',
  };
}

const BOOKING_STATUS_LABEL: Record<string, BookingHistory['status']> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED_PATRON: 'Cancelled',
  CANCELLED_ADMIN: 'Cancelled',
  EXPIRED: 'Expired',
};

/** Map a BookingItem to the booking-history row. */
function bookingToView(b: BookingItem): BookingHistory {
  const seats = (b.seats ?? [])
    .map((s) => s.seatRef)
    .filter(Boolean)
    .join(', ');
  // Only PENDING / CONFIRMED bookings can be cancelled (not already
  // cancelled/expired).
  const cancellable = b.status === 'PENDING' || b.status === 'CONFIRMED';
  return {
    id: b.bookingRef || b.bookingId,
    bookingId: b.bookingId,
    date: formatDate(b.createdAt),
    seats: seats || '—',
    amount: b.totalLkr != null ? `LKR ${b.totalLkr.toLocaleString('en-LK')}` : '—',
    status: (b.status && BOOKING_STATUS_LABEL[b.status]) || 'Pending',
    cancellable,
  };
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
