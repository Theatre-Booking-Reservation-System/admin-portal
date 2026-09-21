import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-payment-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './payment-view.component.html',
  styleUrl: './payment-view.component.scss',
})
export class PaymentViewComponent {
  readonly payment = {
    id: 'PAY-2025-001',
    status: 'Completed',
    createdAt: '24 May 2025, 10:24 AM',
    bookingId: 'STB2025-001',
    customerName: 'Nimal Perera',
    email: 'nimal.perera@email.com',
    phone: '+94 77 123 4567',
    production: 'Sanda Katha',
    performance: '24 May 2025, 6:30 PM',
    seats: 'A12, A13',
    method: 'Credit Card',
    cardLast4: '4242',
    gatewayRef: 'ch_3PqL9x2eZvKYlo2C',
    amount: 'LKR 4,000',
  };

  readonly breakdown = [
    { label: 'Tickets (2 × LKR 2,000)', amount: 'LKR 4,000' },
    { label: 'Concession Discount', amount: '− LKR 0' },
    { label: 'Booking Fee', amount: 'LKR 0' },
  ];
  readonly total = 'LKR 4,000';

  readonly timeline = [
    { label: 'Payment Initiated', time: '24 May 2025, 10:23 AM', done: true },
    { label: 'Payment Authorized', time: '24 May 2025, 10:24 AM', done: true },
    { label: 'Payment Captured', time: '24 May 2025, 10:24 AM', done: true },
    { label: 'Receipt Sent', time: '24 May 2025, 10:25 AM', done: true },
  ];

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

  /** Build a branded A5 receipt PDF and download it immediately (no print dialog). */
  downloadReceipt() {
    const p = this.payment;
    const maroon: [number, number, number] = [90, 15, 24];
    const gold: [number, number, number] = [212, 167, 44];
    const muted: [number, number, number] = [107, 107, 107];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a5' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 36;
    const right = pageWidth - 36;

    // Logo tile
    doc.setFillColor(...maroon);
    doc.roundedRect(left, 36, 36, 36, 6, 6, 'F');
    doc.setTextColor(...gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('ST', left + 18, 60, { align: 'center' });

    // Brand
    doc.setTextColor(...maroon);
    doc.setFontSize(13);
    doc.text('SAPUMAL THEATRE', left + 46, 52);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Payment Receipt', left + 46, 64);

    // Divider
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(left, 82, right, 82);
    doc.setLineDashPattern([], 0);

    // Meta key/value rows
    const meta: [string, string][] = [
      ['Receipt No', p.id],
      ['Booking ID', p.bookingId],
      ['Customer', p.customerName],
      ['Date', p.createdAt],
      ['Method', `${p.method} •••• ${p.cardLast4}`],
      ['Production', p.production],
      ['Seats', p.seats],
    ];
    let y = 100;
    doc.setFontSize(10);
    meta.forEach(([k, v]) => {
      doc.setTextColor(...muted);
      doc.text(k, left, y);
      doc.setTextColor(34, 34, 34);
      doc.setFont('helvetica', 'bold');
      doc.text(v, right, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 18;
    });

    // Breakdown table
    autoTable(doc, {
      startY: y + 8,
      body: [
        ...this.breakdown.map((r) => [r.label, r.amount]),
        [{ content: 'Total Paid', styles: { fontStyle: 'bold', textColor: maroon } },
         { content: this.total, styles: { fontStyle: 'bold', textColor: maroon, halign: 'right' } }],
      ],
      columnStyles: { 1: { halign: 'right' } },
      styles: { fontSize: 10, cellPadding: 5 },
      theme: 'plain',
      margin: { left, right: 36 },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(left, finalY + 12, right, finalY + 12);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(...muted);
    doc.setFontSize(8);
    doc.text('Thank you for supporting the arts! · Art brings us together.', pageWidth / 2, finalY + 28, {
      align: 'center',
    });

    doc.save(`sapumal-receipt-${p.id}.pdf`);
  }
}
