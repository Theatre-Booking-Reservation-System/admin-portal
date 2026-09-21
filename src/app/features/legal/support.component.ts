import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './support.component.html',
  styleUrl: './doc-page.scss',
})
export class SupportComponent {
  readonly contacts = [
    { icon: 'mail', label: 'Email', value: 'support@sapumal.lk', href: 'mailto:support@sapumal.lk' },
    { icon: 'call', label: 'Phone', value: '+94 11 234 5678', href: 'tel:+94112345678' },
    { icon: 'schedule', label: 'Box Office Hours', value: 'Mon–Sun, 9:00 AM – 8:00 PM', href: null },
    { icon: 'location_on', label: 'Address', value: '221 Temple Road, Colombo 07', href: null },
  ];

  readonly faqs = [
    {
      q: 'How do I make a booking for a walk-in customer?',
      a: 'Go to Bookings → New Booking, enter the customer details, choose the performance and pick seats from the seat map.',
    },
    {
      q: 'How is a concession discount applied?',
      a: 'Select the concession in the booking, capture proof (NIC or passport) where required, and flag it for verification at the box office.',
    },
    {
      q: 'How do I unlock a customer account?',
      a: 'Open the customer in Customers, and use the Unlock button. Accounts lock automatically after repeated failed sign-in attempts.',
    },
    {
      q: 'How do I export a report?',
      a: 'Open Reports or Payments and use the Export PDF button. The current filtered view is downloaded as a branded PDF.',
    },
  ];
}
