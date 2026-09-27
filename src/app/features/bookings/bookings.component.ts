import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../core/services/booking.service';
import { CatalogueService } from '../../core/services/catalogue.service';

/** Production option for the first dropdown. */
interface ProductionOption {
  id: string;
  title: string;
}

/** Performance option for the second dropdown. */
interface PerformanceOption {
  id: string;
  label: string;
}

/**
 * Bookings.
 *
 * The Booking Service has no "list every booking" endpoint. The only per-set
 * listing is GET /performances/{id}/bookings, which returns the booked seats
 * for one performance. So the flow is: pick a production, then a performance,
 * then we show that performance's booked seats.
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
  private readonly catalogue = inject(CatalogueService);

  // Selections
  readonly productionId = signal('');
  readonly performanceId = signal('');
  readonly search = signal('');

  // Dropdown data
  readonly productions = signal<ProductionOption[]>([]);
  readonly performances = signal<PerformanceOption[]>([]);

  // Loading / error state
  readonly productionsLoading = signal(true);
  readonly performancesLoading = signal(false);
  readonly seatsLoading = signal(false);
  readonly error = signal<string | null>(null);

  /** Booked seat refs for the selected performance. */
  readonly bookedSeats = signal<string[]>([]);

  readonly filteredSeats = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.bookedSeats().filter((s) => !q || s.toLowerCase().includes(q));
  });

  constructor() {
    this.loadProductions();
  }

  private loadProductions(): void {
    this.productionsLoading.set(true);
    this.error.set(null);
    this.catalogue.searchProductions({ size: 200, sort: 'releaseDate,asc' }).subscribe({
      next: (res) => {
        this.productions.set(
          (res.content ?? []).map((p) => ({ id: p.productionId, title: p.title || 'Untitled' })),
        );
        this.productionsLoading.set(false);
      },
      error: () => {
        this.error.set('Could not load productions.');
        this.productionsLoading.set(false);
      },
    });
  }

  /** Production chosen → load its performances, reset downstream state. */
  onProductionChange(id: string): void {
    this.productionId.set(id);
    this.performanceId.set('');
    this.performances.set([]);
    this.bookedSeats.set([]);
    this.error.set(null);
    if (!id) return;

    this.performancesLoading.set(true);
    this.catalogue.getPerformancesByProductionId(id).subscribe({
      next: (res) => {
        this.performances.set(
          (res.performances ?? []).map((pf) => ({
            id: pf.performanceId,
            label: performanceLabel(pf.date, pf.time, pf.sessionType),
          })),
        );
        this.performancesLoading.set(false);
      },
      error: () => {
        this.error.set('Could not load performances for this production.');
        this.performancesLoading.set(false);
      },
    });
  }

  /** Performance chosen → load its booked seats. */
  onPerformanceChange(id: string): void {
    this.performanceId.set(id);
    this.bookedSeats.set([]);
    this.error.set(null);
    if (!id) return;

    this.seatsLoading.set(true);
    this.bookingApi.getBookedSeatsByPerformanceId(id).subscribe({
      next: (res) => {
        // Prefer human-readable seat refs; fall back to ids.
        this.bookedSeats.set(res.bookedSeatRefs?.length ? res.bookedSeatRefs : res.bookedSeatIds ?? []);
        this.seatsLoading.set(false);
      },
      error: () => {
        this.error.set('Could not load bookings for this performance.');
        this.seatsLoading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  reset(): void {
    this.productionId.set('');
    this.performanceId.set('');
    this.performances.set([]);
    this.bookedSeats.set([]);
    this.search.set('');
    this.error.set(null);
  }
}

const SESSION_LABEL: Record<string, string> = { MATINEE: 'Matinee', EVENING: 'Evening' };

function performanceLabel(date?: string, time?: string, session?: string): string {
  const d = formatDate(date);
  const t = formatTime(time);
  const s = session ? SESSION_LABEL[session] ?? session : '';
  return [d, t, s].filter(Boolean).join(' · ') || 'Performance';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
