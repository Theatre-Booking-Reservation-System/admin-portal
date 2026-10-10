import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HolidayService } from './holiday.service';

describe('HolidayService', () => {
  let service: HolidayService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), HolidayService],
    });
    service = TestBed.inject(HolidayService);
  });

  it('should be marked loaded (poya data is hardcoded)', () => {
    expect(service.loaded()).toBe(true);
  });

  it('should recognise a known poya day', () => {
    // 2025-05-12 is Vesak Poya in the built-in list.
    expect(service.isPoya('2025-05-12')).toBe(true);
  });

  it('should treat an ordinary day as not a poya day', () => {
    expect(service.isPoya('2025-05-13')).toBe(false);
  });

  it('should normalise an ISO datetime string before matching', () => {
    expect(service.isPoya('2025-06-10T18:30:00')).toBe(true);
  });

  it('should return false for null/empty/undefined dates', () => {
    expect(service.isPoya(null)).toBe(false);
    expect(service.isPoya(undefined)).toBe(false);
    expect(service.isPoya('')).toBe(false);
  });

  it('should return the poya name for a known date', () => {
    expect(service.nameFor('2026-05-01')).toBe('Vesak Poya');
  });

  it('should return a generic label for an unknown date', () => {
    expect(service.nameFor('2025-05-13')).toBe('Poya day');
  });

  it('should return null when asked to name an empty date', () => {
    expect(service.nameFor('')).toBeNull();
  });
});
