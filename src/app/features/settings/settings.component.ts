import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly themeService = inject(ThemeService);

  readonly theme = this.themeService.theme;

  setTheme(mode: ThemeMode) {
    this.themeService.set(mode);
  }
}
