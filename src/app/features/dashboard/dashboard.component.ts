import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { CatalogueService } from '../../core/services/catalogue.service';
import { PerformanceItem, ProductionItem } from '../../core/models/catalogue.models';

interface StatCard {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  note?: string;
  icon: string;
}

interface TodayShow {
  title: string;
  time: string;
  session: 'Matinee' | 'Evening';
  abbr: string;
}

interface RecentBooking {
  id: string;
  customer: string;
  show: string;
  dateTime: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
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

  private readonly now = new Date();
  readonly today = this.now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  readonly stats: StatCard[] = [
    { label: 'Total Bookings', value: '287', delta: '12% from last week', deltaUp: true, icon: 'confirmation_number' },
    { label: 'Total Revenue', value: 'LKR 742,800', delta: '18% from last week', deltaUp: true, icon: 'payments' },
    { label: 'Total Customers', value: '1,256', delta: '9% from last week', deltaUp: true, icon: 'group' },
    { label: 'Active Productions', value: '6', note: '2 upcoming', icon: 'theaters' },
  ];

  // Today's shows from /performances/search (dateFrom=dateTo=today).
  readonly todayShows = signal<TodayShow[]>([]);
  readonly todayShowsLoading = signal(true);
  readonly todayShowsError = signal<string | null>(null);

  constructor() {
    this.loadTodayShows();
  }

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
        const byId = new Map<string, ProductionItem>();
        for (const p of productions.content ?? []) byId.set(p.productionId, p);
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

  readonly recentBookings: RecentBooking[] = [
    { id: 'ST250915-001', customer: 'Nimal Perera', show: 'Sanda Katha', dateTime: '15 Sep, 10:00 AM', amount: 'LKR 2,700', status: 'Confirmed' },
    { id: 'ST250915-002', customer: 'Kasun Silva', show: 'Dharma Patha', dateTime: '15 Sep, 6:30 PM', amount: 'LKR 4,050', status: 'Pending' },
    { id: 'ST250915-003', customer: 'Tharaka J.', show: 'The Merchant of Venice', dateTime: '16 Sep, 6:30 PM', amount: 'LKR 3,000', status: 'Confirmed' },
    { id: 'ST250915-004', customer: 'Sanduni Silva', show: 'Ahas Maliga', dateTime: '16 Sep, 10:00 AM', amount: 'LKR 2,500', status: 'Cancelled' },
    { id: 'ST250915-005', customer: 'Mohamed Nizar', show: 'Maanavan', dateTime: '17 Sep, 6:30 PM', amount: 'LKR 3,500', status: 'Confirmed' },
  ];

  readonly chart: ChartPoint[] = [
    { label: 'Jan', bookings: 0.28, revenue: 0.3 },
    { label: 'Feb', bookings: 0.38, revenue: 0.45 },
    { label: 'Mar', bookings: 0.46, revenue: 0.55 },
    { label: 'Apr', bookings: 0.55, revenue: 0.62 },
    { label: 'May', bookings: 0.7, revenue: 0.78 },
    { label: 'Jun', bookings: 0.9, revenue: 0.92 },
  ];

  /** Build the SVG polyline points for the revenue trend line. */
  get revenueLine(): string {
    const w = 100;
    const h = 100;
    const n = this.chart.length;
    return this.chart
      .map((p, i) => {
        const x = (i / (n - 1)) * w;
        const y = h - p.revenue * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  statusClass(s: RecentBooking['status']): string {
    return s === 'Confirmed' ? 'pill--success' : s === 'Pending' ? 'pill--warning' : 'pill--danger';
  }
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

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
