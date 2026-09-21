import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Regular' | 'Loyalty';
  totalBookings: number;
  totalSpend: number;
  joined: string;
  status: 'Active' | 'Inactive';
  locked: boolean;
  abbr: string;
}

type FilterKey = 'All' | 'Loyalty' | 'Regular' | 'Inactive' | 'Locked';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
})
export class CustomersComponent {
  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');

  readonly customers: Customer[] = [
    { id: 'c1', name: 'Nimal Perera', email: 'nimal.perera@email.com', phone: '+94 77 123 4567', type: 'Loyalty', totalBookings: 12, totalSpend: 48000, joined: '12 Jan 2024', status: 'Active', locked: true, abbr: 'NP' },
    { id: 'c2', name: 'Kavindi Silva', email: 'kavindi.silva@email.com', phone: '+94 71 234 5678', type: 'Regular', totalBookings: 4, totalSpend: 14500, joined: '3 Mar 2024', status: 'Active', locked: false, abbr: 'KS' },
    { id: 'c3', name: 'Ruwan Jayasuriya', email: 'ruwan.j@email.com', phone: '+94 76 345 6789', type: 'Loyalty', totalBookings: 20, totalSpend: 92000, joined: '18 Nov 2023', status: 'Active', locked: false, abbr: 'RJ' },
    { id: 'c4', name: 'Tharindu Fernando', email: 'tharindu.f@email.com', phone: '+94 70 456 7890', type: 'Regular', totalBookings: 2, totalSpend: 6000, joined: '5 Jun 2024', status: 'Active', locked: true, abbr: 'TF' },
    { id: 'c5', name: 'Anjali Fernando', email: 'anjali.f@email.com', phone: '+94 75 567 8901', type: 'Regular', totalBookings: 7, totalSpend: 21000, joined: '22 Feb 2024', status: 'Inactive', locked: false, abbr: 'AF' },
    { id: 'c6', name: 'Kasun De Silva', email: 'kasun.desilva@email.com', phone: '+94 77 678 9012', type: 'Loyalty', totalBookings: 15, totalSpend: 63500, joined: '9 Dec 2023', status: 'Active', locked: false, abbr: 'KD' },
    { id: 'c7', name: 'Sithumi Perera', email: 'sithumi.p@email.com', phone: '+94 71 789 0123', type: 'Regular', totalBookings: 3, totalSpend: 9000, joined: '14 Apr 2024', status: 'Active', locked: false, abbr: 'SP' },
    { id: 'c8', name: 'Dinesh Mendis', email: 'dinesh.m@email.com', phone: '+94 76 890 1234', type: 'Loyalty', totalBookings: 9, totalSpend: 37500, joined: '30 Jan 2024', status: 'Active', locked: false, abbr: 'DM' },
  ];

  readonly filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: this.customers.length },
    { key: 'Loyalty', label: 'Loyalty', count: this.customers.filter((c) => c.type === 'Loyalty').length },
    { key: 'Regular', label: 'Regular', count: this.customers.filter((c) => c.type === 'Regular').length },
    { key: 'Locked', label: 'Locked', count: this.customers.filter((c) => c.locked).length },
    { key: 'Inactive', label: 'Inactive', count: this.customers.filter((c) => c.status === 'Inactive').length },
  ];

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.customers.filter((c) => {
      const matchesFilter =
        f === 'All' ||
        (f === 'Inactive' ? c.status === 'Inactive' :
         f === 'Locked' ? c.locked :
         c.type === (f as 'Loyalty' | 'Regular'));
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  unlock(customer: Customer): void {
    // UI-only: clears the lock. Wires to the Identity Service later.
    customer.locked = false;
  }

  money(n: number): string {
    return `LKR ${n.toLocaleString('en-LK')}`;
  }

  onSearch(value: string) {
    this.search.set(value);
  }
}
