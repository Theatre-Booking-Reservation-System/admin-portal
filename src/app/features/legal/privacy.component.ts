import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './privacy.component.html',
  styleUrl: './doc-page.scss',
})
export class PrivacyComponent {
  readonly updated = 'Updated 15 September 2026';
}
