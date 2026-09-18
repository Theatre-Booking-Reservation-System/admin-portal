import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

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
  seats: string;
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

interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
}

interface ChartPoint {
  label: string;
  bookings: number; // 0..1 (bar height fraction)
  revenue: number; // 0..1 (line height fraction)
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly today = 'Mon, 15 Sep 2025';

  readonly stats: StatCard[] = [
    { label: 'Total Bookings', value: '287', delta: '12% from last week', deltaUp: true, icon: 'confirmation_number' },
    { label: 'Total Revenue', value: 'LKR 742,800', delta: '18% from last week', deltaUp: true, icon: 'payments' },
    { label: 'Total Customers', value: '1,256', delta: '9% from last week', deltaUp: true, icon: 'group' },
    { label: 'Active Productions', value: '6', note: '2 upcoming', icon: 'theaters' },
  ];

  readonly todayShows: TodayShow[] = [
    { title: 'Sanda Katha', time: 'Matinee | 10:00 AM', session: 'Matinee', seats: '76 / 200 seats sold', abbr: 'SK' },
    { title: 'Dharma Patha', time: 'Evening | 6:30 PM', session: 'Evening', seats: '112 / 200 seats sold', abbr: 'DP' },
    { title: 'The Merchant of Venice', time: 'Evening | 6:30 PM', session: 'Evening', seats: '158 / 200 seats sold', abbr: 'MV' },
  ];

  readonly recentBookings: RecentBooking[] = [
    { id: 'ST250915-001', customer: 'Nimal Perera', show: 'Sanda Katha', dateTime: '15 Sep, 10:00 AM', amount: 'LKR 2,700', status: 'Confirmed' },
    { id: 'ST250915-002', customer: 'Kasun Silva', show: 'Dharma Patha', dateTime: '15 Sep, 6:30 PM', amount: 'LKR 4,050', status: 'Pending' },
    { id: 'ST250915-003', customer: 'Tharaka J.', show: 'The Merchant of Venice', dateTime: '16 Sep, 6:30 PM', amount: 'LKR 3,000', status: 'Confirmed' },
    { id: 'ST250915-004', customer: 'Sanduni Silva', show: 'Ahas Maliga', dateTime: '16 Sep, 10:00 AM', amount: 'LKR 2,500', status: 'Cancelled' },
    { id: 'ST250915-005', customer: 'Mohamed Nizar', show: 'Maanavan', dateTime: '17 Sep, 6:30 PM', amount: 'LKR 3,500', status: 'Confirmed' },
  ];

  readonly quickActions: QuickAction[] = [
    { title: 'Add Production', subtitle: 'Create new show', icon: 'add_circle' },
    { title: 'Manage Performances', subtitle: 'View and update', icon: 'event' },
    { title: 'Customer Management', subtitle: 'Manage users', icon: 'group' },
    { title: 'View Reports', subtitle: 'Sales and analytics', icon: 'bar_chart' },
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
