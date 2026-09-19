import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
  templateUrl: './production-form.component.html',
  styleUrl: './production-form.component.scss',
})
export class ProductionFormComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Edit mode when the route has an :id param. */
  readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));

  title = '';
  language = '';
  genre = '';
  description = '';
  status: 'Active' | 'Inactive' = 'Active';
  ageRestriction = '';
  duration: number | null = null;
  intermission: number | null = null;
  startDate = '';
  endDate = '';
  cast = '';
  crew = '';

  readonly languages = ['Sinhala', 'Tamil', 'English'];
  readonly genres = ['Drama', 'Musical', 'Comedy', 'Dance', 'Opera', 'Children'];
  readonly ageRestrictions = ['All Ages', '7+', '12+', '16+', '18+'];

  readonly descLength = signal(0);

  constructor() {
    if (this.isEdit()) {
      // Pre-fill with hardcoded sample data for the edit demo.
      this.title = 'Sanda Katha';
      this.language = 'Sinhala';
      this.genre = 'Drama';
      this.description =
        'Sanda Katha is a captivating drama that brings together tradition and modern storytelling, performed in Sinhala. A journey of love, heritage and identity.';
      this.status = 'Active';
      this.ageRestriction = 'All Ages';
      this.duration = 120;
      this.intermission = 15;
      this.startDate = '2025-05-24';
      this.endDate = '2025-06-06';
      this.descLength.set(this.description.length);
    }
  }

  onDescInput(value: string) {
    this.description = value;
    this.descLength.set(value.length);
  }

  save(event: Event) {
    event.preventDefault();
    this.router.navigateByUrl('/productions');
  }
}
