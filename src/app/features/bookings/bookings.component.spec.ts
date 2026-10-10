import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { BookingsComponent } from './bookings.component';
import { BookingService } from '../../core/services/booking.service';

describe('BookingsComponent (sorting)', () => {
  function build(bookings: unknown[]) {
    const bookingApi = {
      getRecentBookings: vi.fn(() => of({ bookings })),
      getBookingByRef: vi.fn(() => of({ seats: [] })),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: BookingService, useValue: bookingApi },
      ],
    });
    return TestBed.createComponent(BookingsComponent).componentInstance;
  }

  it('should order bookings newest-first by createdAt', () => {
    const component = build([
      { bookingRef: 'B-OLD', createdAt: '2026-01-01T09:00:00Z' },
      { bookingRef: 'B-NEW', createdAt: '2026-03-01T09:00:00Z' },
      { bookingRef: 'B-MID', createdAt: '2026-02-01T09:00:00Z' },
    ]);

    expect(component.rows().map((r) => r.ref)).toEqual(['B-NEW', 'B-MID', 'B-OLD']);
  });
});
