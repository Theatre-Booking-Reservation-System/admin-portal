import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

type Tab = 'overview' | 'cast' | 'performances' | 'pricing' | 'media';

interface CastMember {
  name: string;
  role: string;
  type: 'Lead Actor' | 'Lead Actress' | 'Director' | 'Producer' | 'Stage Manager';
  note: string;
}

interface PerformanceRow {
  date: string;
  time: string;
  show: string;
  venue: string;
  status: 'Upcoming' | 'Active' | 'Completed';
}

interface PriceTier {
  seats: string;
  matinee: string;
  evening: string;
}

interface ConcessionRow {
  type: string;
  discount: string;
}

interface DocRow {
  name: string;
  type: string;
  uploaded: string;
}

@Component({
  selector: 'app-production-view',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './production-view.component.html',
  styleUrl: './production-view.component.scss',
})
export class ProductionViewComponent {
  readonly tab = signal<Tab>('overview');

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'cast', label: 'Cast & Crew' },
    { key: 'performances', label: 'Performances' },
    { key: 'pricing', label: 'Ticket Pricing' },
    { key: 'media', label: 'Media & Documents' },
  ];

  // ── Header / overview data (hardcoded) ──────────────────────────────────
  readonly production = {
    title: 'Sanda Katha',
    status: 'Active',
    dates: '24 May 2025 – 6 Jun 2025',
    venue: 'Main Theatre',
    language: 'Sinhala',
    genre: 'Drama',
    abbr: 'SK',
    synopsis:
      'Sanda Katha is a captivating drama that brings together tradition and modern storytelling. Sinhala. A journey of love, heritage and identity.',
    createdBy: 'Admin User',
    createdDate: '10 May 2025',
    lastUpdated: '15 May 2025',
    ageRestriction: 'All Ages',
    duration: '120 minutes',
    basePrice: 'LKR 1,000',
  };

  readonly cast: CastMember[] = [
    { name: 'Nimal Perera', role: 'Lead Actor', type: 'Lead Actor', note: 'Award-winning actor with over 15 years in theatre and cinema.' },
    { name: 'Kavindi Silva', role: 'Lead Actress', type: 'Lead Actress', note: 'Known for powerful performances in teledramas.' },
    { name: 'Ruwan Jayasinghe', role: 'Director', type: 'Director', note: 'Renowned theatre director focusing on contemporary Sri Lankan drama.' },
    { name: 'Tharindu Fernando', role: 'Producer', type: 'Producer', note: 'Producer with a passion for promoting local arts and culture.' },
    { name: 'Anjali Fernando', role: 'Stage Manager', type: 'Stage Manager', note: 'Experienced stage manager with expertise in live productions.' },
  ];

  readonly performances: PerformanceRow[] = [
    { date: '24 May 2025', time: '10:00 AM', show: 'Sanda Katha - Matinee', venue: 'Main Theatre', status: 'Upcoming' },
    { date: '24 May 2025', time: '6:30 PM', show: 'Sanda Katha - Evening', venue: 'Main Theatre', status: 'Upcoming' },
    { date: '25 May 2025', time: '3:00 PM', show: 'Sanda Katha', venue: 'Main Theatre', status: 'Upcoming' },
    { date: '6 Jun 2025', time: '6:30 PM', show: 'Sanda Katha - Final Show', venue: 'Main Theatre', status: 'Upcoming' },
  ];

  // ── Ticket pricing (from the Scenario 2 brief) ──────────────────────────
  readonly stalls: PriceTier[] = [
    { seats: 'AA – DD', matinee: '+200%', evening: '+250%' },
    { seats: 'A – M', matinee: '+150%', evening: '+175%' },
    { seats: 'P – V', matinee: '+100%', evening: '+150%' },
  ];
  readonly circle: PriceTier[] = [
    { seats: 'Sides', matinee: '+150%', evening: '+175%' },
    { seats: 'Outer', matinee: '+125%', evening: '+150%' },
    { seats: 'Centre (A–E)', matinee: '+210%', evening: '+220%' },
  ];
  readonly upperCircle: PriceTier[] = [
    { seats: 'Sides', matinee: '+80%', evening: '+100%' },
    { seats: 'Outer', matinee: '+50%', evening: '+70%' },
    { seats: 'Centre', matinee: '+75%', evening: '+100%' },
    { seats: 'Other', matinee: 'Base', evening: 'Base' },
  ];
  readonly concessions: ConcessionRow[] = [
    { type: 'Under 16s', discount: 'As per theatre policy' },
    { type: 'Over 70s', discount: 'As per theatre policy' },
    { type: 'Group Booking (10+)', discount: 'As per theatre policy' },
    { type: 'Loyalty Card', discount: '10% per ticket (best concession applied)' },
  ];

  readonly documents: DocRow[] = [
    { name: 'Sanda Katha - Synopsis.pdf', type: 'PDF', uploaded: '10 May 2025' },
    { name: 'Production Notes.docx', type: 'DOCX', uploaded: '12 May 2025' },
    { name: 'Set Design Plan.pdf', type: 'PDF', uploaded: '14 May 2025' },
  ];

  statusClass(s: string): string {
    switch (s) {
      case 'Active':
        return 'pill--success';
      case 'Upcoming':
        return 'pill--warning';
      case 'Completed':
        return 'pill--muted';
      default:
        return 'pill--info';
    }
  }
}
