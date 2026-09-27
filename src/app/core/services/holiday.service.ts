import { Injectable, signal } from '@angular/core';

/** A poya (full-moon) public holiday. Dates are ISO "YYYY-MM-DD". */
export interface PoyaDay {
  date: string;
  name: string;
}

/**
 * Provides poya (full-moon) days used to block performance scheduling.
 *
 * Poya days come from a built-in hardcoded list (POYA_DAYS below) — no API
 * call. Update POYA_DAYS to change the blocked dates.
 */
@Injectable({ providedIn: 'root' })
export class HolidayService {
  /** Set of ISO date strings that are poya days. */
  readonly poyaDates = signal<Set<string>>(new Set(POYA_DAYS.map((p) => p.date)));
  readonly loaded = signal(true);

  /** No-op: poya days are hardcoded, nothing to fetch. */
  load(): void {
    // Intentionally empty — data is sourced from the hardcoded POYA_DAYS list.
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
    const match = POYA_DAYS.find((p) => p.date === iso);
    return match?.name ?? 'Poya day';
  }
}

/** Normalize a date value to "YYYY-MM-DD" (handles ISO datetime strings too). */
function normalize(value: string | null | undefined): string {
  if (!value) return '';
  return value.length > 10 ? value.slice(0, 10) : value;
}

/**
 * Built-in poya days (Sri Lanka), covering 2025–2026. This is the sole source
 * of poya data — update this list to change the blocked dates.
 */
const POYA_DAYS: PoyaDay[] = [
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
