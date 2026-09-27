import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { HolidayService } from '../../../core/services/holiday.service';
import { CatalogueService } from '../../../core/services/catalogue.service';
import {
  PerformanceRequest,
  PerformanceResponse,
  SessionType,
} from '../../../core/models/catalogue.models';

/** Minimal shape the production dropdown needs. */
interface ProductionOption {
  id: string;
  title: string;
  /** Run window (YYYY-MM-DD); performances must fall within it. */
  releaseDate: string;
  endDate: string;
}

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
  private readonly catalogue = inject(CatalogueService);

  private readonly performanceId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = signal(!!this.performanceId);

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly showSuccess = signal(false);

  /** True while fetching the existing performance (edit mode). */
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  /** Selected production id (signal so the date range can react to it). */
  readonly production = signal('');
  date = '';
  time = '';
  sessionType = '';

  /** Productions loaded from the catalogue API for the dropdown. */
  readonly productions = signal<ProductionOption[]>([]);
  readonly productionsLoading = signal(true);
  readonly productionsError = signal<string | null>(null);

  readonly sessionTypes = ['Matinee', 'Evening'];

  /** Today (YYYY-MM-DD) — no scheduling in the past. */
  readonly today = new Date().toISOString().slice(0, 10);

  /** The currently selected production (drives the allowed date range). */
  readonly selectedProduction = computed<ProductionOption | null>(
    () => this.productions().find((p) => p.id === this.production()) ?? null,
  );

  /**
   * Earliest selectable date: the production's release date, but never in the
   * past (so you can't schedule before today either).
   */
  readonly dateMin = computed<string>(() => {
    const release = this.selectedProduction()?.releaseDate ?? '';
    return release && release > this.today ? release : this.today;
  });

  /** Latest selectable date: the production's end date (empty = no upper bound). */
  readonly dateMax = computed<string>(() => this.selectedProduction()?.endDate ?? '');

  /** Set when the chosen date falls on a poya day (blocks save). */
  readonly poyaError = signal<string | null>(null);
  /** Set when the chosen date falls outside the production's run window. */
  readonly rangeError = signal<string | null>(null);

  constructor() {
    // Load poya days (from catalogue API, with a built-in fallback).
    this.holidays.load();

    // Load productions for the dropdown, and (edit mode) the performance too.
    // Fetching together means the run-window is known when we set the fields.
    this.productionsLoading.set(true);
    if (this.isEdit()) this.loading.set(true);

    forkJoin({
      productions: this.catalogue.getAllProductions(),
      performance:
        this.isEdit() && this.performanceId
          ? this.catalogue.getPerformanceById(this.performanceId)
          : of(null),
    }).subscribe({
      next: ({ productions, performance }) => {
        this.productions.set(
          (productions.productions ?? []).map((p) => ({
            id: p.productionId,
            title: p.title || 'Untitled',
            releaseDate: isoDate(p.releaseDate),
            endDate: isoDate(p.endDate),
          })),
        );
        this.productionsLoading.set(false);

        if (performance) {
          this.applyPerformance(performance);
        }
        this.loading.set(false);
      },
      error: () => {
        this.productionsError.set('Could not load productions.');
        this.productionsLoading.set(false);
        if (this.isEdit()) {
          this.loadError.set('Could not load this performance. Please try again.');
        }
        this.loading.set(false);
      },
    });
  }

  /** Populate the form fields from an API performance (edit mode). */
  private applyPerformance(p: PerformanceResponse): void {
    this.production.set(p.productionId ?? '');
    this.date = isoDate(p.date);
    this.time = normalizeTime(p.time);
    this.sessionType = p.sessionType === 'MATINEE' ? 'Matinee' : p.sessionType === 'EVENING' ? 'Evening' : '';
    if (this.date) this.validateDate(this.date);
  }

  /** Called when the production changes; re-checks the date against the new range. */
  onProductionChange(id: string) {
    this.production.set(id);
    if (this.date) this.validateDate(this.date);
  }

  /** Called when the date changes; blocks poya days and out-of-range dates. */
  onDateChange(value: string) {
    this.date = value;
    this.validateDate(value);
  }

  private validateDate(value: string) {
    // Poya-day check first.
    if (value && this.holidays.isPoya(value)) {
      const name = this.holidays.nameFor(value);
      this.poyaError.set(
        `${name} is a poya day — performances cannot be scheduled on poya days. Please choose another date.`,
      );
      this.rangeError.set(null);
      this.date = '';
      return;
    }
    this.poyaError.set(null);

    // Range check against the selected production's run window.
    const prod = this.selectedProduction();
    if (value && prod) {
      if (prod.releaseDate && value < prod.releaseDate) {
        this.rangeError.set(
          `Date must be on or after the production's release date (${prod.releaseDate}).`,
        );
        this.date = '';
        return;
      }
      if (prod.endDate && value > prod.endDate) {
        this.rangeError.set(
          `Date must be on or before the production's end date (${prod.endDate}).`,
        );
        this.date = '';
        return;
      }
    }
    this.rangeError.set(null);
  }

  save(event: Event, form: NgForm) {
    event.preventDefault();
    if (this.saving()) return;

    // Re-validate (poya + range) in case a field was set programmatically.
    this.validateDate(this.date);

    // Block submission if required fields are missing or the date is invalid.
    if (form.invalid || !this.date || this.poyaError() || this.rangeError()) {
      form.control.markAllAsTouched();
      return;
    }

    const payload: PerformanceRequest = {
      productionId: this.production(),
      date: this.date,
      time: this.time.length === 5 ? `${this.time}:00` : this.time, // HH:mm → HH:mm:ss
      sessionType: this.sessionType.toUpperCase() as SessionType,
      status: 1,
    };

    this.saving.set(true);
    this.saveError.set(null);

    const request$ =
      this.isEdit() && this.performanceId
        ? this.catalogue.updatePerformance(this.performanceId, payload)
        : this.catalogue.createPerformance(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess.set(true);
      },
      error: () => {
        this.saveError.set(
          this.isEdit()
            ? 'Could not update the performance. Please try again.'
            : 'Could not create the performance. Please try again.',
        );
        this.saving.set(false);
      },
    });
  }

  /** Close the success modal and return to the performances list. */
  dismissSuccess(): void {
    this.showSuccess.set(false);
    this.router.navigateByUrl('/performances');
  }
}

/** Normalise an API date/datetime to "YYYY-MM-DD". */
function isoDate(value?: string): string {
  if (!value) return '';
  return value.length > 10 ? value.slice(0, 10) : value;
}

/** Normalise an API time ("HH:mm:ss" / "HH:mm") to "HH:mm" for a time input. */
function normalizeTime(value?: string): string {
  if (!value) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!m) return value;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}
