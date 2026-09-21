import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SeatPickerComponent, SeatSelection } from '../../../shared/seat-picker/seat-picker.component';

const TICKET_PRICE = 1800; // LKR per seat (demo)
const BOOKING_FEE = 200; // LKR flat (demo)

interface ConcessionOption {
  value: string;
  label: string;
  discountPct: number;
  requiresId: boolean;
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, SeatPickerComponent],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.scss',
})
export class BookingFormComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));

  // Customer entered manually (walk-in / phone booking at the box office).
  customerName = '';
  email = '';
  phone = '';

  production = '';
  performance = '';
  paymentMethod = '';
  markAsPaid = false;
  notes = '';

  // Scenario 2 concessions. When a concession is claimed we must capture an
  // NIC/passport and flag the booking for box-office verification on the day.
  concession = 'None';
  idDocument = '';

  readonly concessionOptions: ConcessionOption[] = [
    { value: 'None', label: 'No concession', discountPct: 0, requiresId: false },
    { value: 'Under16', label: 'Under 16', discountPct: 25, requiresId: true },
    { value: 'Over70', label: 'Over 70', discountPct: 30, requiresId: true },
    { value: 'LargeParty', label: 'Large party (10+)', discountPct: 15, requiresId: true },
  ];

  readonly productions = ['Sanda Katha', 'Yathra Oruwa', 'The Merchant of Venice', 'Dharma Patha'];
  readonly performances = ['24 May 2025 - 10:00 AM (Main Theatre)', '24 May 2025 - 6:30 PM (Main Theatre)', '25 May 2025 - 3:00 PM (Main Theatre)'];
  readonly paymentMethods = ['Card Payment', 'Mobile Payment', 'Internet Banking', 'Cash'];

  /** Chosen seat ids; drives the Booking Summary. */
  readonly seats = signal<string[]>([]);
  readonly pickerOpen = signal(false);

  get selectedConcession(): ConcessionOption {
    return this.concessionOptions.find((c) => c.value === this.concession) ?? this.concessionOptions[0];
  }

  /** True when the chosen concession requires an ID and the booking is flagged. */
  get requiresVerification(): boolean {
    return this.selectedConcession.requiresId;
  }

  private get subtotal(): number {
    return this.seats().length * TICKET_PRICE;
  }
  private get concessionDiscount(): number {
    return Math.round((this.subtotal * this.selectedConcession.discountPct) / 100);
  }

  readonly seatsSelected = () => this.seats().length;
  readonly ticketPrice = () => this.money(this.subtotal);
  readonly bookingFee = () => this.money(this.seats().length ? BOOKING_FEE : 0);
  readonly concessionLabel = () => this.selectedConcession.label;
  readonly concessionAmount = () => this.money(this.concessionDiscount);
  readonly total = () =>
    this.money(
      this.seats().length ? this.subtotal - this.concessionDiscount + BOOKING_FEE : 0,
    );
  readonly selectedSeats = () =>
    this.seats().length ? `${this.seats().join(', ')} (${this.seats().length} seats)` : 'No seats selected';

  constructor() {
    if (this.isEdit()) {
      this.customerName = 'Nimal Perera';
      this.email = 'nimal.perera@email.com';
      this.phone = '+94 77 123 4567';
      this.production = 'Sanda Katha';
      this.performance = '24 May 2025 - 10:00 AM (Main Theatre)';
      this.paymentMethod = 'Card Payment';
      this.markAsPaid = true;
      this.notes = 'Customer requested seats together.';
      this.seats.set(['A12', 'A13']);
    }
  }

  onConcessionChange() {
    // Clear the ID field when switching back to no concession.
    if (!this.requiresVerification) {
      this.idDocument = '';
    }
  }

  openPicker() {
    this.pickerOpen.set(true);
  }

  onSeatsConfirmed(selection: SeatSelection) {
    this.seats.set(selection.ids);
    this.pickerOpen.set(false);
  }

  onPickerCancelled() {
    this.pickerOpen.set(false);
  }

  save(event: Event) {
    event.preventDefault();
    this.router.navigateByUrl('/bookings');
  }

  private money(n: number): string {
    return `LKR ${n.toLocaleString('en-LK')}`;
  }
}
