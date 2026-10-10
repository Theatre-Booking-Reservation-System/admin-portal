import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PaymentsComponent } from './payments.component';

describe('PaymentsComponent (sorting)', () => {
  let component: PaymentsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    component = TestBed.createComponent(PaymentsComponent).componentInstance;
  });

  it('should list payments newest-first by date and time', () => {
    const dates = component.filtered().map((p) => `${p.date} ${p.time}`);
    const times = dates.map((d) => new Date(d).getTime());

    // Each entry should be the same or older than the one before it.
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }
  });

  it('should put the latest payment date at the top', () => {
    const top = component.filtered()[0];
    // 26 May 2025 is the most recent date in the seeded set.
    expect(top.date).toBe('26 May 2025');
  });
});
