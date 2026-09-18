import { Component, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly themeService = inject(ThemeService);

  /** Emitted when the hamburger/menu button is clicked. */
  readonly menuClick = output<void>();

  /** Current theme mode, used to flip the toggle icon/label. */
  readonly theme = this.themeService.theme;

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
