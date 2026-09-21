import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './terms.component.html',
  styleUrl: './doc-page.scss',
})
export class TermsComponent {
  readonly updated = 'Updated 15 September 2026';
}
