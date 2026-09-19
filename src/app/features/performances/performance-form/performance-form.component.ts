import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-performance-form',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
  templateUrl: './performance-form.component.html',
  styleUrl: './performance-form.component.scss',
})
export class PerformanceFormComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));

  production = '';
  showTitle = '';
  description = '';
  date = '';
  time = '';
  venue = '';
  duration: number | null = null;
  language = '';
  totalSeats: number | null = 200;
  allowOnlineBooking = true;
  visibleToPublic = true;

  readonly productions = ['Sanda Katha', 'Yathra Oruwa', 'The Merchant of Venice', 'Dharma Patha', 'Ahas Maliga'];
  readonly venues = ['Main Theatre', 'Studio Theatre'];
  readonly languages = ['Sinhala', 'Tamil', 'English'];

  readonly descLength = signal(0);

  constructor() {
    if (this.isEdit()) {
      this.production = 'Sanda Katha';
      this.showTitle = 'Sanda Katha';
      this.date = '2025-05-24';
      this.time = '18:30';
      this.venue = 'Main Theatre';
      this.duration = 120;
      this.language = 'Sinhala';
      this.totalSeats = 200;
    }
  }

  onDescInput(value: string) {
    this.description = value;
    this.descLength.set(value.length);
  }

  save(event: Event) {
    event.preventDefault();
    this.router.navigateByUrl('/performances');
  }
}
