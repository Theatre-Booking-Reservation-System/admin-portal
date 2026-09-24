import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** A poya (full-moon) public holiday. Dates are ISO "YYYY-MM-DD". */
export interface PoyaDay {
  date: string;
  name: string;
}

/**
 * Provides poya (full-moon) days used to block performance scheduling.
 *
 * Poya days are reference data, so they're fetched from the catalogue service.
 * The exact endpoint may still change on the backend, so we degrade gracefully:
 * on any failure we fall back to a built-in list and the UI still blocks those
 * dates. Swap FALLBACK_POYA / the endpoint once the API is confirmed.
 */
@Injectable({ providedIn: 'root' })
export class HolidayService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.services.catalogue}/poya-days`;

  /** Set of ISO date strings that are poya days. */
  readonly poyaDates = signal<Set<string>>(new Set(FALLBACK_POYA.map((p) => p.date)));
  readonly loaded = signal(false);

  /** Fetch poya days from the API; keep the fallback on failure. */
  load(): void {
    if (this.loaded()) return;

    this.http
      .get<PoyaDay[]>(this.endpoint)
      .pipe(
        map((days) => days.map((d) => normalize(d.date)).filter(Boolean) as string[]),
        tap((dates) => {
          if (dates.length) this.poyaDates.set(new Set(dates));
          this.loaded.set(true);
        }),
        catchError(() => {
          // Keep the fallback set; mark as loaded so we don't spin on errors.
          this.loaded.set(true);
          return of<string[]>([]);
        }),
      )
      .subscribe();
  }

  /** True if the given ISO date ("YYYY-MM-DD") is a poya day. */
  isPoya(dateStr: string | null | undefined): boolean {
    const iso = normalize(dateStr);
    return !!iso && this.poyaDates().has(iso);
  }

  /** Human-friendly poya name, if known. */
  nameFor(dateStr: string | null | undefined): string | null {
    const iso = normalize(dateStr);
    if (!iso) return null;
    const match = FALLBACK_POYA.find((p) => p.date === iso);
    return match?.name ?? 'Poya day';
  }
}

/** Normalize a date value to "YYYY-MM-DD" (handles ISO datetime strings too). */
function normalize(value: string | null | undefined): string {
  if (!value) return '';
  return value.length > 10 ? value.slice(0, 10) : value;
}

/**
 * Built-in poya days (Sri Lanka). Used until the catalogue API endpoint is
 * confirmed, and as a fallback if the request fails. Covers 2025–2026.
 */
const FALLBACK_POYA: PoyaDay[] = [
  { date: '2025-01-13', name: 'Duruthu Poya' },
  { date: '2025-02-12', name: 'Navam Poya' },
  { date: '2025-03-13', name: 'Medin Poya' },
  { date: '2025-04-12', name: 'Bak Poya' },
  { date: '2025-05-12', name: 'Vesak Poya' },
  { date: '2025-06-10', name: 'Poson Poya' },
  { date: '2025-07-10', name: 'Esala Poya' },
  { date: '2025-08-08', name: 'Nikini Poya' },
  { date: '2025-09-07', name: 'Binara Poya' },
  { date: '2025-10-06', name: 'Vap Poya' },
  { date: '2025-11-05', name: 'Il Poya' },
  { date: '2025-12-04', name: 'Unduvap Poya' },
  { date: '2026-01-03', name: 'Duruthu Poya' },
  { date: '2026-02-01', name: 'Navam Poya' },
  { date: '2026-03-03', name: 'Medin Poya' },
  { date: '2026-04-01', name: 'Bak Poya' },
  { date: '2026-05-01', name: 'Vesak Poya' },
  { date: '2026-05-31', name: 'Poson Poya' },
  { date: '2026-06-29', name: 'Esala Poya' },
  { date: '2026-07-29', name: 'Nikini Poya' },
  { date: '2026-08-27', name: 'Binara Poya' },
  { date: '2026-09-26', name: 'Vap Poya' },
  { date: '2026-10-25', name: 'Il Poya' },
  { date: '2026-11-24', name: 'Unduvap Poya' },
  { date: '2026-12-23', name: 'Duruthu Poya' },
];
