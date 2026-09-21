import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PaymentMethod = 'Credit Card' | 'eWallet' | 'Bank Transfer' | 'Cash (Counter)';

interface Payment {
  id: string;
  bookingId: string;
  customer: string;
  method: PaymentMethod;
  amount: string;
  date: string;
  time: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

type FilterKey = 'All' | 'Completed' | 'Pending' | 'Failed';

interface Stat {
  label: string;
  value: string;
  icon: string;
  delta?: string;
  deltaUp?: boolean;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent {
  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');
  readonly methodFilter = signal<'All' | PaymentMethod>('All');
  readonly statusFilter = signal<'All' | 'Completed' | 'Pending' | 'Failed'>('All');

  readonly methodOptions: ('All' | PaymentMethod)[] = ['All', 'Credit Card', 'eWallet', 'Bank Transfer', 'Cash (Counter)'];
  readonly statusOptions: ('All' | 'Completed' | 'Pending' | 'Failed')[] = ['All', 'Completed', 'Pending', 'Failed'];

  readonly stats: Stat[] = [
    { label: 'Total Revenue', value: 'LKR 1,284,000', icon: 'account_balance_wallet', delta: '12.5%', deltaUp: true },
    { label: 'Payments Today', value: 'LKR 86,000', icon: 'payments', delta: '4.2%', deltaUp: true },
    { label: 'Pending Payments', value: 'LKR 24,000', icon: 'schedule' },
    { label: 'Total Transactions', value: '137', icon: 'receipt_long' },
  ];

  readonly payments: Payment[] = [
    { id: 'PAY-2025-001', bookingId: 'STB2025-001', customer: 'Nimal Perera', method: 'Credit Card', amount: 'LKR 4,000', date: '24 May 2025', time: '10:24 AM', status: 'Completed' },
    { id: 'PAY-2025-002', bookingId: 'STB2025-002', customer: 'Kavindi Silva', method: 'eWallet', amount: 'LKR 6,000', date: '24 May 2025', time: '11:02 AM', status: 'Pending' },
    { id: 'PAY-2025-003', bookingId: 'STB2025-003', customer: 'Ruwan Jayasuriya', method: 'Bank Transfer', amount: 'LKR 2,000', date: '24 May 2025', time: '11:45 AM', status: 'Completed' },
    { id: 'PAY-2025-004', bookingId: 'STB2025-004', customer: 'Tharindu Fernando', method: 'Credit Card', amount: 'LKR 4,000', date: '24 May 2025', time: '1:10 PM', status: 'Failed' },
    { id: 'PAY-2025-005', bookingId: 'STB2025-006', customer: 'Kasun De Silva', method: 'Cash (Counter)', amount: 'LKR 5,000', date: '25 May 2025', time: '9:15 AM', status: 'Completed' },
    { id: 'PAY-2025-006', bookingId: 'STB2025-007', customer: 'Sithumi Perera', method: 'eWallet', amount: 'LKR 4,000', date: '25 May 2025', time: '10:40 AM', status: 'Pending' },
    { id: 'PAY-2025-007', bookingId: 'STB2025-008', customer: 'Dinesh Mendis', method: 'Credit Card', amount: 'LKR 4,000', date: '25 May 2025', time: '12:05 PM', status: 'Completed' },
    { id: 'PAY-2025-008', bookingId: 'STB2025-010', customer: 'Isuru Perera', method: 'eWallet', amount: 'LKR 6,000', date: '26 May 2025', time: '9:50 AM', status: 'Completed' },
  ];

  readonly methodIcons: Record<PaymentMethod, string> = {
    'Credit Card': 'credit_card',
    eWallet: 'account_balance_wallet',
    'Bank Transfer': 'account_balance',
    'Cash (Counter)': 'payments',
  };

  readonly filters = computed<{ key: FilterKey; label: string; count: number }[]>(() => {
    const all = this.payments;
    return [
      { key: 'All', label: 'All', count: all.length },
      { key: 'Completed', label: 'Completed', count: all.filter((p) => p.status === 'Completed').length },
      { key: 'Pending', label: 'Pending', count: all.filter((p) => p.status === 'Pending').length },
      { key: 'Failed', label: 'Failed', count: all.filter((p) => p.status === 'Failed').length },
    ];
  });

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    const method = this.methodFilter();
    const statusDrop = this.statusFilter();
    return this.payments.filter((p) => {
      const matchesTab = f === 'All' || p.status === f;
      const matchesMethod = method === 'All' || p.method === method;
      const matchesStatusDrop = statusDrop === 'All' || p.status === statusDrop;
      const matchesSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.bookingId.toLowerCase().includes(q) ||
        p.customer.toLowerCase().includes(q);
      return matchesTab && matchesMethod && matchesStatusDrop && matchesSearch;
    });
  });

  resetFilters() {
    this.filter.set('All');
    this.methodFilter.set('All');
    this.statusFilter.set('All');
    this.search.set('');
  }

  statusClass(s: string): string {
    switch (s) {
      case 'Completed':
        return 'pill--success';
      case 'Pending':
        return 'pill--warning';
      case 'Failed':
        return 'pill--danger';
      default:
        return 'pill--muted';
    }
  }

  onSearch(value: string) {
    this.search.set(value);
  }

  /**
   * Build a branded PDF of the current (filtered) payments list and download it
   * immediately using jsPDF — no print dialog.
   */
  exportPdf() {
    const rows = this.filtered();
    const generatedAt = new Date().toLocaleString();

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const maroon: [number, number, number] = [90, 15, 24];
    const muted: [number, number, number] = [107, 107, 107];

    // Header
    doc.setTextColor(...maroon);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SAPUMAL THEATRE', 40, 42);
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.text('ART BRINGS US TOGETHER', 40, 56);

    // Meta (right aligned)
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text('Payments Report', pageWidth - 40, 40, { align: 'right' });
    doc.text(`Generated: ${generatedAt}`, pageWidth - 40, 52, { align: 'right' });
    doc.text(`${rows.length} transaction(s)`, pageWidth - 40, 64, { align: 'right' });

    // Divider
    doc.setDrawColor(...maroon);
    doc.setLineWidth(2);
    doc.line(40, 72, pageWidth - 40, 72);

    // Table
    autoTable(doc, {
      startY: 86,
      head: [['Payment ID', 'Booking ID', 'Customer', 'Method', 'Amount', 'Date & Time', 'Status']],
      body: rows.map((p) => [p.id, p.bookingId, p.customer, p.method, p.amount, `${p.date} ${p.time}`, p.status]),
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: maroon, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 247, 240] },
      margin: { left: 40, right: 40 },
    });

    // Footer note
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(
      'Sapumal Theatre — Confidential financial report. Generated from the Admin Portal.',
      pageWidth / 2,
      finalY + 24,
      { align: 'center' },
    );

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`sapumal-payments-${stamp}.pdf`);
  }
}
