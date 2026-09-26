import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HolidayService } from '../../../core/services/holiday.service';

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
  private readonly holidays = inject(HolidayService);

  readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));

  production = '';
  date = '';
  time = '';
  sessionType = '';

  readonly productions = ['Sanda Katha', 'Yathra Oruwa', 'The Merchant of Venice', 'Dharma Patha', 'Ahas Maliga'];
  readonly sessionTypes = ['Matinee', 'Evening'];

  /** Earliest selectable date — no scheduling in the past. */
  readonly minDate = new Date().toISOString().slice(0, 10);

  /** Set when the chosen date falls on a poya day (blocks save). */
  readonly poyaError = signal<string | null>(null);

  constructor() {
    // Load poya days (from catalogue API, with a built-in fallback).
    this.holidays.load();

    if (this.isEdit()) {
      this.production = 'Sanda Katha';
      this.date = '2025-05-24';
      this.time = '18:30';
      this.sessionType = 'Evening';
      this.validateDate(this.date);
    }
  }

  /** Called when the date changes; blocks poya days with an inline message. */
  onDateChange(value: string) {
    this.date = value;
    this.validateDate(value);
  }

  private validateDate(value: string) {
    if (value && this.holidays.isPoya(value)) {
      const name = this.holidays.nameFor(value);
      this.poyaError.set(
        `${name} is a poya day — performances cannot be scheduled on poya days. Please choose another date.`,
      );
      // Clear the invalid date so it can't be submitted.
      this.date = '';
    } else {
      this.poyaError.set(null);
    }
  }

  save(event: Event) {
    event.preventDefault();
    // Guard again in case the field was set programmatically.
    if (this.holidays.isPoya(this.date)) {
      this.validateDate(this.date);
      return;
    }
    this.router.navigateByUrl('/performances');
  }
}
