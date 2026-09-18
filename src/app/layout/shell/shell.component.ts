import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, FooterComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  /**
   * Desktop rail toggle
   */
  readonly collapsed = signal(false);

  /** Mobile only: whether the off-canvas drawer is open. */
  readonly drawerOpen = signal(false);

  /**  On desktop CSS uses `collapsed`; on mobile it uses `drawerOpen`. */
  toggleSidebar() {
    this.collapsed.update((v) => !v);
    this.drawerOpen.update((v) => !v);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }
}
