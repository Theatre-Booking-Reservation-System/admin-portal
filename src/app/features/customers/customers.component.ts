import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PatronService } from '../../core/services/patron.service';
import { PatronSummary } from '../../core/models/auth.models';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Regular' | 'Loyalty';
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
  private readonly patrons = inject(PatronService);

  readonly search = signal('');
  readonly filter = signal<FilterKey>('All');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly customers = signal<Customer[]>([]);

  readonly filters = computed<{ key: FilterKey; label: string; count: number }[]>(() => {
    const list = this.customers();
    return [
      { key: 'All', label: 'All', count: list.length },
      { key: 'Loyalty', label: 'Loyalty', count: list.filter((c) => c.type === 'Loyalty').length },
      { key: 'Regular', label: 'Regular', count: list.filter((c) => c.type === 'Regular').length },
      { key: 'Locked', label: 'Locked', count: list.filter((c) => c.locked).length },
    ];
  });

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filter();
    return this.customers().filter((c) => {
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

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.patrons.listPatrons().subscribe({
      next: (res) => {
        const items = res.patrons ?? [];
        this.customers.set(items.map((p) => toView(p)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load customers. Please try again.');
        this.loading.set(false);
      },
    });
  }

  unlock(customer: Customer): void {
    this.patrons.unlockPatron(customer.id).subscribe({
      next: () => {
        customer.locked = false;
        // Refresh the signal so filters/counts recompute.
        this.customers.set([...this.customers()]);
      },
      error: () => {
        this.error.set('Could not unlock this account. Please try again.');
      },
    });
  }

  onSearch(value: string) {
    this.search.set(value);
  }
}

/** Map an Identity PatronSummary to the template's view-model. */
function toView(p: PatronSummary): Customer {
  const name = p.name || 'Unknown';
  return {
    id: p.patronId,
    name,
    email: p.email || '—',
    phone: p.contactNo || '—',
    type: p.loyaltyHolder ? 'Loyalty' : 'Regular',
    birthday: formatDate(p.dateOfBirth),
    nic: p.nicPassportNo || '—',
    joined: formatDate(p.addedDate),
    // status 9 = locked account (too many failed sign-ins).
    status: 'Active',
    locked: p.status === 9,
    abbr: initials(name),
  };
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
