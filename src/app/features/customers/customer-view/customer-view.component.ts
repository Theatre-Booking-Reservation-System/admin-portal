import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PatronService } from '../../../core/services/patron.service';
import { PatronSummary } from '../../../core/models/auth.models';

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
  private readonly route = inject(ActivatedRoute);
  private readonly patrons = inject(PatronService);

  private readonly patronId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly customer = signal<CustomerView | null>(null);

  /** Whether the account is currently locked (Identity status 9). */
  readonly locked = signal(false);
  readonly unlocking = signal(false);

  readonly initials = computed(() => this.customer()?.abbr ?? '');

  // Booking history comes from the Booking Service — not wired yet.
  readonly bookings: BookingHistory[] = [];

  constructor() {
    this.load();
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
