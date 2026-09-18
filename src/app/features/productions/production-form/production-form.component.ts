import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
  templateUrl: './production-form.component.html',
  styleUrl: './production-form.component.scss',
})
export class ProductionFormComponent {
  title = '';
  language = '';
  genre = '';
  description = '';
  status: 'Active' | 'Inactive' = 'Active';
  startDate = '';
  endDate = '';
  cast = '';
  crew = '';

  readonly languages = ['Sinhala', 'Tamil', 'English'];
  readonly genres = ['Drama', 'Musical', 'Comedy', 'Dance', 'Opera', 'Children'];

  readonly descLength = signal(0);

  constructor(private readonly router: Router) {}

  onDescInput(value: string) {
    this.description = value;
    this.descLength.set(value.length);
  }

  save(event: Event) {
    event.preventDefault();
    // UI-only for now: return to the list. Real persistence wired later.
    this.router.navigateByUrl('/productions');
  }
}
