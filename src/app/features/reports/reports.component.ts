import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Kpi {
  label: string;
  value: string;
  icon: string;
  delta?: string;
  deltaUp?: boolean;
}

interface ChartPoint {
  label: string;
  bookings: number; // 0..1 (bar height fraction)
  revenue: number; // 0..1 (line height fraction)
}

interface TopProduction {
  name: string;
  tickets: number;
  revenue: string;
  share: number; // 0..100
}

interface ZoneOccupancy {
  zone: string;
  sold: number;
  capacity: number;
}

type RangeKey = 'This Week' | 'This Month' | 'This Quarter' | 'This Year';
type ReportType = 'Sales' | 'Bookings' | 'Occupancy';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  readonly range = signal<RangeKey>('This Month');
  readonly reportType = signal<ReportType>('Sales');

  readonly ranges: RangeKey[] = ['This Week', 'This Month', 'This Quarter', 'This Year'];
  readonly reportTypes: ReportType[] = ['Sales', 'Bookings', 'Occupancy'];

  readonly kpis: Kpi[] = [
    { label: 'Total Revenue', value: 'LKR 1,284,000', icon: 'payments', delta: '18.2%', deltaUp: true },
    { label: 'Tickets Sold', value: '3,642', icon: 'confirmation_number', delta: '12.4%', deltaUp: true },
    { label: 'Avg. Occupancy', value: '78%', icon: 'event_seat', delta: '4.1%', deltaUp: true },
    { label: 'Avg. Ticket Price', value: 'LKR 2,350', icon: 'sell', delta: '1.8%', deltaUp: false },
  ];

  readonly chart: ChartPoint[] = [
    { label: 'Jan', bookings: 0.3, revenue: 0.32 },
    { label: 'Feb', bookings: 0.4, revenue: 0.44 },
    { label: 'Mar', bookings: 0.5, revenue: 0.56 },
    { label: 'Apr', bookings: 0.58, revenue: 0.6 },
    { label: 'May', bookings: 0.72, revenue: 0.8 },
    { label: 'Jun', bookings: 0.86, revenue: 0.9 },
    { label: 'Jul', bookings: 0.94, revenue: 0.96 },
  ];

  readonly topProductions: TopProduction[] = [
    { name: 'Sanda Katha', tickets: 1240, revenue: 'LKR 496,000', share: 100 },
    { name: 'Dharma Patha', tickets: 980, revenue: 'LKR 392,000', share: 79 },
    { name: 'Ahas Maliga', tickets: 760, revenue: 'LKR 304,000', share: 61 },
    { name: 'Yathra Oruwa', tickets: 540, revenue: 'LKR 216,000', share: 44 },
    { name: 'The Merchant of Venice', tickets: 420, revenue: 'LKR 168,000', share: 34 },
  ];

  readonly zones: ZoneOccupancy[] = [
    { zone: 'Stalls', sold: 168, capacity: 200 },
    { zone: 'Circle', sold: 96, capacity: 150 },
    { zone: 'Upper Circle', sold: 62, capacity: 100 },
  ];

  readonly paymentMethods = [
    { method: 'Credit Card', share: 52 },
    { method: 'eWallet', share: 28 },
    { method: 'Cash (Counter)', share: 14 },
    { method: 'Bank Transfer', share: 6 },
  ];

  /** SVG polyline points for the revenue trend line. */
  readonly revenueLine = computed(() => {
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
  });

  pct(z: ZoneOccupancy): number {
    return Math.round((z.sold / z.capacity) * 100);
  }

  /** Export the report summary as a downloaded PDF. */
  exportPdf() {
    const maroon: [number, number, number] = [90, 15, 24];
    const muted: [number, number, number] = [107, 107, 107];
    const generatedAt = new Date().toLocaleString();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setTextColor(...maroon);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SAPUMAL THEATRE', 40, 46);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    doc.text('ART BRINGS US TOGETHER', 40, 60);
    doc.text(`${this.reportType()} Report`, pageWidth - 40, 42, { align: 'right' });
    doc.text(`Period: ${this.range()}`, pageWidth - 40, 54, { align: 'right' });
    doc.text(`Generated: ${generatedAt}`, pageWidth - 40, 66, { align: 'right' });

    doc.setDrawColor(...maroon);
    doc.setLineWidth(2);
    doc.line(40, 76, pageWidth - 40, 76);

    // KPI summary
    autoTable(doc, {
      startY: 90,
      head: [['Key Metric', 'Value']],
      body: this.kpis.map((k) => [k.label, k.value]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: maroon, textColor: [255, 255, 255] },
      margin: { left: 40, right: 40 },
    });

    let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
    doc.setTextColor(...maroon);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Top Productions', 40, y);

    autoTable(doc, {
      startY: y + 8,
      head: [['Production', 'Tickets Sold', 'Revenue']],
      body: this.topProductions.map((p) => [p.name, String(p.tickets), p.revenue]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: maroon, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 247, 240] },
      margin: { left: 40, right: 40 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
    doc.setTextColor(...maroon);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Occupancy by Zone', 40, y);

    autoTable(doc, {
      startY: y + 8,
      head: [['Zone', 'Seats Sold', 'Capacity', 'Occupancy']],
      body: this.zones.map((z) => [z.zone, String(z.sold), String(z.capacity), `${this.pct(z)}%`]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: maroon, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 247, 240] },
      margin: { left: 40, right: 40 },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    doc.text(
      'Sapumal Theatre — Confidential analytics report. Generated from the Admin Portal.',
      pageWidth / 2,
      finalY + 24,
      { align: 'center' },
    );

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`sapumal-${this.reportType().toLowerCase()}-report-${stamp}.pdf`);
  }
}
