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
  birthday: string;
  nic: string;
  joined: string;
  status: 'Active' | 'Inactive';
  locked: boolean;
  abbr: string;
}

type FilterKey = 'All' | 'Loyalty' | 'Regular' | 'Locked';

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
    { id: 'c1', name: 'Nimal Perera', email: 'nimal.perera@email.com', phone: '+94 77 123 4567', type: 'Loyalty', totalBookings: 12, totalSpend: 48000, birthday: '14 Feb 1990', nic: '901234567V', joined: '12 Jan 2024', status: 'Active', locked: true, abbr: 'NP' },
    { id: 'c2', name: 'Kavindi Silva', email: 'kavindi.silva@email.com', phone: '+94 71 234 5678', type: 'Regular', totalBookings: 4, totalSpend: 14500, birthday: '3 Aug 1995', nic: '957654321V', joined: '3 Mar 2024', status: 'Active', locked: false, abbr: 'KS' },
    { id: 'c3', name: 'Ruwan Jayasuriya', email: 'ruwan.j@email.com', phone: '+94 76 345 6789', type: 'Loyalty', totalBookings: 20, totalSpend: 92000, birthday: '22 Nov 1988', nic: '882345678V', joined: '18 Nov 2023', status: 'Active', locked: false, abbr: 'RJ' },
    { id: 'c4', name: 'Tharindu Fernando', email: 'tharindu.f@email.com', phone: '+94 70 456 7890', type: 'Regular', totalBookings: 2, totalSpend: 6000, birthday: '9 May 1998', nic: '199845600123', joined: '5 Jun 2024', status: 'Active', locked: true, abbr: 'TF' },
    { id: 'c5', name: 'Anjali Fernando', email: 'anjali.f@email.com', phone: '+94 75 567 8901', type: 'Regular', totalBookings: 7, totalSpend: 21000, birthday: '17 Jul 1992', nic: '925678901V', joined: '22 Feb 2024', status: 'Inactive', locked: false, abbr: 'AF' },
    { id: 'c6', name: 'Kasun De Silva', email: 'kasun.desilva@email.com', phone: '+94 77 678 9012', type: 'Loyalty', totalBookings: 15, totalSpend: 63500, birthday: '30 Jan 1985', nic: '851122334V', joined: '9 Dec 2023', status: 'Active', locked: false, abbr: 'KD' },
    { id: 'c7', name: 'Sithumi Perera', email: 'sithumi.p@email.com', phone: '+94 71 789 0123', type: 'Regular', totalBookings: 3, totalSpend: 9000, birthday: '12 Dec 2000', nic: '200034500789', joined: '14 Apr 2024', status: 'Active', locked: false, abbr: 'SP' },
    { id: 'c8', name: 'Dinesh Mendis', email: 'dinesh.m@email.com', phone: '+94 76 890 1234', type: 'Loyalty', totalBookings: 9, totalSpend: 37500, birthday: '5 Sep 1991', nic: '913344556V', joined: '30 Jan 2024', status: 'Active', locked: false, abbr: 'DM' },
  ];

  readonly filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: this.customers.length },
    { key: 'Loyalty', label: 'Loyalty', count: this.customers.filter((c) => c.type === 'Loyalty').length },
    { key: 'Regular', label: 'Regular', count: this.customers.filter((c) => c.type === 'Regular').length },
    { key: 'Locked', label: 'Locked', count: this.customers.filter((c) => c.locked).length },
  ];

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.customers.filter((c) => {
      const matchesFilter =
        f === 'All' ||
        (f === 'Locked' ? c.locked : c.type === (f as 'Loyalty' | 'Regular'));
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.nic.toLowerCase().includes(q);
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
