import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppError, NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), NotificationService],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should start with no active error', () => {
    expect(service.error()).toBeNull();
  });

  it('should store the error passed to showError', () => {
    const err: AppError = {
      title: 'Access denied',
      message: "You don't have permission.",
      code: 'ATH_07',
      status: 403,
    };

    service.showError(err);

    expect(service.error()).toEqual(err);
  });

  it('should replace a previous error when showError is called again', () => {
    service.showError({ title: 'First', message: 'one' });
    service.showError({ title: 'Second', message: 'two' });

    expect(service.error()?.title).toBe('Second');
  });

  it('should reset the error to null on clear', () => {
    service.showError({ title: 'Boom', message: 'bang' });
    service.clear();

    expect(service.error()).toBeNull();
  });
});
