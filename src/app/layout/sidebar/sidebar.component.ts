import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  /** Collapsed state is owned by the shell and passed in. */
  readonly collapsed = input<boolean>(false);

  /** Emitted when a nav item is clicked (used to close the mobile drawer). */
  readonly navigate = output<void>();

  readonly nav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Productions', icon: 'theaters', route: '/productions' },
    { label: 'Performances', icon: 'event', route: '/performances' },
    { label: 'Bookings', icon: 'confirmation_number', route: '/bookings' },
    { label: 'Customers', icon: 'group', route: '/customers' },
    { label: 'Concessions', icon: 'sell', route: '/concessions' },
    { label: 'Payments', icon: 'payments', route: '/payments' },
    { label: 'Reports', icon: 'bar_chart', route: '/reports' },
  ];
}
