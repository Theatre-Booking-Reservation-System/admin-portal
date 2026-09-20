import { Component, computed, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type SeatState = 'available' | 'selected' | 'booked' | 'unavailable';

interface Seat {
  id: string;
  state: SeatState;
}
interface SeatRow {
  label: string;
  seats: Seat[];
}
interface SeatZone {
  name: string;
  rows: SeatRow[];
}

export interface SeatSelection {
  ids: string[];
  count: number;
}

/**
 * Reusable seat-picker modal for Scenario 2 zones (Stalls / Circle / Upper Circle).
 * Emits the chosen seat ids on confirm. UI-only for now; real availability comes
 * from the backend later.
 */
@Component({
  selector: 'app-seat-picker',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './seat-picker.component.html',
  styleUrl: './seat-picker.component.scss',
})
export class SeatPickerComponent {
  /** Seat ids already selected (e.g. when editing an existing booking). */
  readonly preselected = input<string[]>([]);

  readonly confirmed = output<SeatSelection>();
  readonly cancelled = output<void>();

  readonly zones = signal<SeatZone[]>(this.buildZones());

  readonly selectedIds = computed(() =>
    this.zones()
      .flatMap((z) => z.rows)
      .flatMap((r) => r.seats)
      .filter((s) => s.state === 'selected')
      .map((s) => s.id),
  );
  readonly selectedCount = computed(() => this.selectedIds().length);

  toggle(zoneIndex: number, rowIndex: number, seatIndex: number): void {
    this.zones.update((zones) => {
      const seat = zones[zoneIndex].rows[rowIndex].seats[seatIndex];
      if (seat.state === 'booked' || seat.state === 'unavailable') return zones;
      seat.state = seat.state === 'selected' ? 'available' : 'selected';
      return [...zones];
    });
  }

  confirm(): void {
    this.confirmed.emit({ ids: this.selectedIds(), count: this.selectedCount() });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private buildZones(): SeatZone[] {
    const pre = new Set(this.preselected());
    const build = (name: string, rowLabels: string[], perRow: number): SeatZone => ({
      name,
      rows: rowLabels.map((label, ri) => ({
        label,
        seats: Array.from({ length: perRow }, (_, i) => {
          const id = `${label}${i + 1}`;
          let state: SeatState = 'available';
          const seed = (ri * 7 + (i + 1) * 3) % 11;
          if (seed === 0 || seed === 5) state = 'booked';
          else if (seed === 8) state = 'unavailable';
          if (pre.has(id)) state = 'selected';
          return { id, state };
        }),
      })),
    });
    return [
      build('Stalls', ['AA', 'BB', 'A', 'B', 'C', 'D', 'P', 'Q'], 16),
      build('Circle', ['A', 'B', 'C', 'D', 'E'], 16),
      build('Upper Circle', ['A', 'B', 'C'], 16),
    ];
  }
}
