import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

type Tab = 'overview' | 'cast' | 'performances' | 'pricing' | 'media';

interface CastMember {
  name: string;
  role: string;
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

@Component({
  selector: 'app-production-view',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
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
    { key: 'media', label: 'Media' },
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

  readonly cast = signal<CastMember[]>([
    { name: 'Nimal Perera', role: 'Lead Actor' },
    { name: 'Kavindi Silva', role: 'Lead Actress' },
    { name: 'Ruwan Jayasinghe', role: 'Director' },
    { name: 'Tharindu Fernando', role: 'Producer' },
    { name: 'Anjali Fernando', role: 'Stage Manager' },
  ]);

  /** Inline "add cast/crew" row state. */
  readonly showAddCast = signal(false);
  newCastName = '';
  newCastRole = '';

  openAddCast() {
    this.newCastName = '';
    this.newCastRole = '';
    this.showAddCast.set(true);
  }

  cancelAddCast() {
    this.showAddCast.set(false);
  }

  saveCast() {
    const name = this.newCastName.trim();
    const role = this.newCastRole.trim();
    if (!name || !role) return;
    this.cast.update((list) => [...list, { name, role }]);
    this.showAddCast.set(false);
  }

  removeCast(index: number) {
    this.cast.update((list) => list.filter((_, i) => i !== index));
  }

  readonly performances: PerformanceRow[] = [
    { date: '24 May 2025', time: '10:00 AM', show: 'Sanda Katha - Matinee', venue: 'Main Theatre', status: 'Upcoming' },
    { date: '24 May 2025', time: '6:30 PM', show: 'Sanda Katha - Evening', venue: 'Main Theatre', status: 'Upcoming' },
    { date: '25 May 2025', time: '3:00 PM', show: 'Sanda Katha', venue: 'Main Theatre', status: 'Upcoming' },
    { date: '6 Jun 2025', time: '6:30 PM', show: 'Sanda Katha - Final Show', venue: 'Main Theatre', status: 'Upcoming' },
  ];

  // ── Ticket pricing (from the Scenario 2 brief) ──────────────────────────
  readonly basePrice = signal('LKR 1,000');
  readonly stalls = signal<PriceTier[]>([
    { seats: 'AA – DD', matinee: '+200%', evening: '+250%' },
    { seats: 'A – M', matinee: '+150%', evening: '+175%' },
    { seats: 'P – V', matinee: '+100%', evening: '+150%' },
  ]);
  readonly circle = signal<PriceTier[]>([
    { seats: 'Sides', matinee: '+150%', evening: '+175%' },
    { seats: 'Outer', matinee: '+125%', evening: '+150%' },
    { seats: 'Centre (A–E)', matinee: '+210%', evening: '+220%' },
  ]);
  readonly upperCircle = signal<PriceTier[]>([
    { seats: 'Sides', matinee: '+80%', evening: '+100%' },
    { seats: 'Outer', matinee: '+50%', evening: '+70%' },
    { seats: 'Centre', matinee: '+75%', evening: '+100%' },
    { seats: 'Other', matinee: 'Base', evening: 'Base' },
  ]);
  readonly concessions = signal<ConcessionRow[]>([
    { type: 'Under 16s', discount: 'As per theatre policy' },
    { type: 'Over 70s', discount: 'As per theatre policy' },
    { type: 'Group Booking (10+)', discount: 'As per theatre policy' },
    { type: 'Loyalty Card', discount: '10% per ticket (best concession applied)' },
  ]);

  // ── Edit-pricing mode ───────────────────────────────────────────────────
  readonly editingPricing = signal(false);
  /** Working copies edited in the form; committed on Save. */
  draftBasePrice = '';
  draftStalls: PriceTier[] = [];
  draftCircle: PriceTier[] = [];
  draftUpperCircle: PriceTier[] = [];
  draftConcessions: ConcessionRow[] = [];

  startEditPricing() {
    this.draftBasePrice = this.basePrice();
    this.draftStalls = this.stalls().map((r) => ({ ...r }));
    this.draftCircle = this.circle().map((r) => ({ ...r }));
    this.draftUpperCircle = this.upperCircle().map((r) => ({ ...r }));
    this.draftConcessions = this.concessions().map((r) => ({ ...r }));
    this.editingPricing.set(true);
  }

  cancelPricing() {
    this.editingPricing.set(false);
  }

  savePricing() {
    this.basePrice.set(this.draftBasePrice);
    this.stalls.set(this.draftStalls.map((r) => ({ ...r })));
    this.circle.set(this.draftCircle.map((r) => ({ ...r })));
    this.upperCircle.set(this.draftUpperCircle.map((r) => ({ ...r })));
    this.concessions.set(this.draftConcessions.map((r) => ({ ...r })));
    this.editingPricing.set(false);
  }

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
