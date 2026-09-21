import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-concession-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './concession-view.component.html',
  styleUrl: './concession-view.component.scss',
})
export class ConcessionViewComponent {
  readonly concession = {
    id: 'CON-001',
    name: 'Under 16',
    status: 'Active',
    discountType: 'Percentage',
    discountValue: '25%',
    eligibility: 'Age 16 and below',
    requiredProof: 'Valid ID (e.g. Passport, School ID)',
    description: 'Applicable to customers aged 16 and below. Valid ID must be presented at the theatre.',
    applicableTo: 'All Productions',
    createdBy: 'Admin User',
    createdDate: '12 Jan 2024, 10:30 AM',
    lastUpdated: '15 Sep 2025, 2:45 PM',
  };

  readonly terms = [
    'Valid ID must be presented upon entry.',
    'Concession tickets are non-transferable.',
    'Applicable only for regular performances.',
    'Cannot be combined with other promotions unless stated otherwise.',
  ];

  readonly stats = {
    totalBookings: '1,245',
    totalTickets: '2,480',
    totalDiscount: 'LKR 496,000',
  };

  statusClass(s: string): string {
    return s === 'Active' ? 'pill--success' : 'pill--muted';
  }
}
