import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

type Tab = 'types' | 'verifications';

interface ConcessionType {
  id: string;
  name: string;
  eligibility: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: string;
  status: 'Active' | 'Inactive';
}

interface ConcessionClaim {
  id: string;
  bookingId: string;
  customer: string;
  concessionType: string;
  document: string;
  performance: string;
  status: 'Pending' | 'Verified' | 'Rejected';
}

type VerifyFilter = 'Pending' | 'Verified' | 'Rejected' | 'All';

@Component({
  selector: 'app-concessions',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './concessions.component.html',
  styleUrl: './concessions.component.scss',
})
export class ConcessionsComponent {
  readonly tab = signal<Tab>('types');

  // ── Concession Types (CRUD) — seeded from the Scenario 2 fixed concessions ──
  readonly types = signal<ConcessionType[]>([
    { id: 'CON-001', name: 'Under 16', eligibility: 'Age 16 and below', discountType: 'Percentage', discountValue: '25%', status: 'Active' },
    { id: 'CON-002', name: 'Over 70', eligibility: 'Age 70 and above', discountType: 'Percentage', discountValue: '30%', status: 'Active' },
    { id: 'CON-003', name: 'Large Party', eligibility: 'More than 10 people', discountType: 'Percentage', discountValue: '15%', status: 'Active' },
    { id: 'CON-004', name: 'Loyalty Card', eligibility: 'Valid loyalty card holder', discountType: 'Percentage', discountValue: '10%', status: 'Active' },
  ]);
  readonly typeSearch = signal('');
  readonly filteredTypes = computed(() => {
    const q = this.typeSearch().toLowerCase().trim();
    return this.types().filter((t) => !q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  });

  deleteType(id: string): void {
    this.types.update((list) => list.filter((t) => t.id !== id));
  }

  // ── Verifications queue ─────────────────────────────────────────────────────
  readonly claims = signal<ConcessionClaim[]>([
    { id: 'cc1', bookingId: 'STB2025-001', customer: 'Tharaka Jayasinghe', concessionType: 'Large Party', document: 'NIC ******5678', performance: 'Sanda Katha · 24 May, 6:30 PM', status: 'Pending' },
    { id: 'cc2', bookingId: 'STB2025-014', customer: 'Nimal Fernando', concessionType: 'Over 70', document: 'NIC ******1234', performance: 'Dharma Patha · 25 May, 3:00 PM', status: 'Pending' },
    { id: 'cc3', bookingId: 'STB2025-021', customer: 'Aloka Perera', concessionType: 'Under 16', document: 'Passport ****4821', performance: 'Ahas Maliga · 26 May, 10:00 AM', status: 'Pending' },
    { id: 'cc4', bookingId: 'STB2025-028', customer: 'Lasitha Mendis', concessionType: 'Large Party', document: 'NIC ******7890', performance: 'Yathra Oruwa · 27 May, 6:30 PM', status: 'Pending' },
    { id: 'cc6', bookingId: 'STB2025-009', customer: 'Kasun Rajapaksa', concessionType: 'Over 70', document: 'NIC ******3344', performance: 'Sanda Katha · 20 May, 6:30 PM', status: 'Verified' },
    { id: 'cc8', bookingId: 'STB2025-005', customer: 'Ishara Gunathilake', concessionType: 'Under 16', document: 'Passport ****1180', performance: 'Ahas Maliga · 18 May, 10:00 AM', status: 'Rejected' },
  ]);
  readonly verifyFilter = signal<VerifyFilter>('Pending');
  readonly verifySearch = signal('');

  readonly verifyFilters = computed<{ key: VerifyFilter; label: string; count: number }[]>(() => {
    const all = this.claims();
    return [
      { key: 'Pending', label: 'Pending', count: all.filter((c) => c.status === 'Pending').length },
      { key: 'Verified', label: 'Verified', count: all.filter((c) => c.status === 'Verified').length },
      { key: 'Rejected', label: 'Rejected', count: all.filter((c) => c.status === 'Rejected').length },
      { key: 'All', label: 'All', count: all.length },
    ];
  });

  readonly filteredClaims = computed(() => {
    const q = this.verifySearch().toLowerCase().trim();
    const f = this.verifyFilter();
    return this.claims().filter((c) => {
      const matchesFilter = f === 'All' || c.status === f;
      const matchesSearch = !q || c.bookingId.toLowerCase().includes(q) || c.customer.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  verify(c: ConcessionClaim): void {
    this.setClaimStatus(c.id, 'Verified');
  }
  reject(c: ConcessionClaim): void {
    this.setClaimStatus(c.id, 'Rejected');
  }
  private setClaimStatus(id: string, status: ConcessionClaim['status']): void {
    this.claims.update((list) => list.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  statusClass(s: string): string {
    switch (s) {
      case 'Active':
      case 'Verified':
        return 'pill--success';
      case 'Pending':
        return 'pill--warning';
      case 'Rejected':
        return 'pill--danger';
      default:
        return 'pill--muted';
    }
  }
}
