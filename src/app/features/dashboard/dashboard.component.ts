import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { CatalogueService } from '../../core/services/catalogue.service';
import { BookingService } from '../../core/services/booking.service';
import { PatronService } from '../../core/services/patron.service';
import { PerformanceItem, ProductionItem } from '../../core/models/catalogue.models';
import {
  BookingStatus,
  MonthlyBookingPoint,
  RecentBookingItem,
} from '../../core/models/booking.models';

interface StatCard {
  label: string;
  value: string;
  note?: string;
  icon: string;
}

interface TodayShow {
  title: string;
  time: string;
  session: 'Matinee' | 'Evening';
  abbr: string;
}

interface RecentBookingRow {
  id: string;
  customer: string;
  show: string;
  dateTime: string;
  amount: string;
  statusLabel: string;
  statusClass: string;
}

interface ChartPoint {
  label: string;
  bookings: number; // 0..1 (bar height fraction)
  revenue: number; // 0..1 (line height fraction)
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly catalogue = inject(CatalogueService);
  private readonly bookingApi = inject(BookingService);
  private readonly patrons = inject(PatronService);

  private readonly now = new Date();
  readonly today = this.now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // KPI values (filled from the APIs; '—' until loaded).
  private readonly totalBookings = signal<string>('—');
  private readonly totalRevenue = signal<string>('—');
  private readonly totalCustomers = signal<string>('—');
  private readonly activeProductions = signal<string>('—');

  readonly stats = computed<StatCard[]>(() => [
    { label: 'Total Bookings', value: this.totalBookings(), icon: 'confirmation_number' },
    { label: 'Total Revenue', value: this.totalRevenue(), icon: 'payments' },
    { label: 'Total Customers', value: this.totalCustomers(), icon: 'group' },
    { label: 'Active Productions', value: this.activeProductions(), icon: 'theaters' },
  ]);

  // Today's shows from /performances/search (dateFrom=dateTo=today).
  readonly todayShows = signal<TodayShow[]>([]);
  readonly todayShowsLoading = signal(true);
  readonly todayShowsError = signal<string | null>(null);

  // Booking-overview chart (from GET /bookings/summary).
  readonly chart = signal<ChartPoint[]>([]);

  // Recent bookings table (from GET /bookings/recent).
  readonly recentBookings = signal<RecentBookingRow[]>([]);
  readonly recentLoading = signal(true);
  readonly recentError = signal<string | null>(null);

  constructor() {
    this.loadTodayShows();
    this.loadBookingSummary();
    this.loadRecentBookings();
    this.loadCustomerCount();
  }

  // ── Today's shows + active productions count ──────────────────────────────
  private loadTodayShows(): void {
    const iso = localIso(this.now);
    this.todayShowsLoading.set(true);
    this.todayShowsError.set(null);
    forkJoin({
      productions: this.catalogue.searchProductions({ size: 200 }),
      performances: this.catalogue.searchPerformances({
        dateFrom: iso,
        dateTo: iso,
        sort: 'time,asc',
        size: 100,
      }),
    }).subscribe({
      next: ({ productions, performances }) => {
        const list = productions.content ?? [];
        this.activeProductions.set(String(productions.totalElements ?? list.length));

        const byId = new Map<string, ProductionItem>();
        for (const p of list) byId.set(p.productionId, p);
        this.todayShows.set(
          (performances.content ?? []).map((pf) => showToView(pf, byId.get(pf.productionId))),
        );
        this.todayShowsLoading.set(false);
      },
      error: () => {
        this.todayShowsError.set('Could not load today\u2019s shows.');
        this.todayShowsLoading.set(false);
      },
    });
  }

  // ── Total bookings, revenue + chart ───────────────────────────────────────
  private loadBookingSummary(): void {
    this.bookingApi.getBookingSummary().subscribe({
      next: (res) => {
        this.totalBookings.set(formatCount(res.totalBookings));
        this.totalRevenue.set(formatLkr(res.totalRevenue));
        this.chart.set(toChart(res.bookingOverview ?? []));
      },
      error: () => {
        // Leave KPI placeholders; interceptor surfaces the error.
      },
    });
  }

  // ── Recent bookings table ─────────────────────────────────────────────────
  private loadRecentBookings(): void {
    this.recentLoading.set(true);
    this.recentError.set(null);
    this.bookingApi.getRecentBookings(4).subscribe({
      next: (res) => {
        this.recentBookings.set((res.bookings ?? []).map(toRecentRow));
        this.recentLoading.set(false);
      },
      error: () => {
        this.recentError.set('Could not load recent bookings.');
        this.recentLoading.set(false);
      },
    });
  }

  // ── Total customers ───────────────────────────────────────────────────────
  private loadCustomerCount(): void {
    this.patrons.listPatrons().subscribe({
      next: (res) => {
        const count = res.totalCount ?? res.patrons?.length ?? 0;
        this.totalCustomers.set(formatCount(count));
      },
      error: () => {
        // Leave placeholder.
      },
    });
  }

  /** Build the SVG polyline points for the revenue trend line. */
  readonly revenueLine = computed(() => {
    const pts = this.chart();
    const w = 100;
    const h = 100;
    const n = pts.length;
    if (n < 2) return '';
    return pts
      .map((p, i) => {
        const x = (i / (n - 1)) * w;
        const y = h - p.revenue * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });
}

/** Local "YYYY-MM-DD" for a Date (avoids UTC shift from toISOString). */
function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Map a performance (+ its production) to a Today's Shows row. */
function showToView(pf: PerformanceItem, prod?: ProductionItem): TodayShow {
  const title = prod?.title || 'Untitled';
  const session: TodayShow['session'] = pf.sessionType === 'MATINEE' ? 'Matinee' : 'Evening';
  const time = formatTime(pf.time);
  return {
    title,
    session,
    time: time ? `${session} | ${time}` : session,
    abbr: initials(title),
  };
}

/** Normalize the API's monthly overview into 0..1 bar/line fractions. */
function toChart(points: MonthlyBookingPoint[]): ChartPoint[] {
  if (!points.length) return [];
  const maxB = Math.max(1, ...points.map((p) => p.bookings ?? 0));
  const maxR = Math.max(1, ...points.map((p) => p.revenue ?? 0));
  return points.map((p) => ({
    label: p.label || p.month || '',
    bookings: (p.bookings ?? 0) / maxB,
    revenue: (p.revenue ?? 0) / maxR,
  }));
}

/** Map a recent-booking API item to a table row. */
function toRecentRow(b: RecentBookingItem): RecentBookingRow {
  const { label, cssClass } = statusView(b.status);
  return {
    id: b.bookingRef || b.bookingId || '—',
    customer: b.customerName || '—',
    show: b.showName || '—',
    dateTime: formatDateTime(b.performanceDate, b.performanceTime, b.createdAt),
    amount: formatLkr(b.totalLkr),
    statusLabel: label,
    statusClass: cssClass,
  };
}

/** Map a booking status to a display label + pill class. */
function statusView(s?: BookingStatus): { label: string; cssClass: string } {
  switch (s) {
    case 'CONFIRMED':
      return { label: 'Confirmed', cssClass: 'pill--success' };
    case 'PENDING':
      return { label: 'Pending', cssClass: 'pill--warning' };
    case 'CANCELLED_PATRON':
    case 'CANCELLED_ADMIN':
      return { label: 'Cancelled', cssClass: 'pill--danger' };
    case 'EXPIRED':
      return { label: 'Expired', cssClass: 'pill--muted' };
    default:
      return { label: s || '—', cssClass: 'pill--muted' };
  }
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

/** Prefer performance date+time; fall back to the booking's createdAt. */
function formatDateTime(date?: string, time?: string, createdAt?: string): string {
  if (date) {
    const d = new Date(date);
    const datePart = isNaN(d.getTime())
      ? date
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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

function formatCount(n?: number): string {
  return n == null ? '—' : n.toLocaleString('en-US');
}

function formatLkr(n?: number): string {
  return n == null ? '—' : `LKR ${Math.round(n).toLocaleString('en-US')}`;
}

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
