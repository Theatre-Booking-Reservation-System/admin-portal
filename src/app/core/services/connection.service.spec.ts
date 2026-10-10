import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { ConnectionService } from './connection.service';

describe('ConnectionService', () => {
  let service: ConnectionService;
  let router: { url: string; navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { url: '/dashboard', navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ConnectionService,
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(ConnectionService);
  });

  it('should default to online', () => {
    expect(service.offline()).toBe(false);
  });

  it('should default retryUrl to /dashboard', () => {
    expect(service.retryUrl).toBe('/dashboard');
  });

  it('should flag offline and remember the originating url', () => {
    service.markOffline('/bookings');

    expect(service.offline()).toBe(true);
    expect(service.retryUrl).toBe('/bookings');
  });

  it('should not overwrite retryUrl with the connection-error page url', () => {
    service.markOffline('/customers');
    service.markOffline('/connection-error');

    expect(service.retryUrl).toBe('/customers');
  });

  it('should ignore an empty url for retryUrl but still go offline', () => {
    service.markOffline('');

    expect(service.offline()).toBe(true);
    expect(service.retryUrl).toBe('/dashboard');
  });

  it('should clear the offline flag on markOnline', () => {
    service.markOffline('/reports');
    service.markOnline();

    expect(service.offline()).toBe(false);
  });

  it('should navigate to the connection-error page on a browser offline event', () => {
    router.url = '/payments';
    service.init();

    window.dispatchEvent(new Event('offline'));

    expect(service.offline()).toBe(true);
    expect(service.retryUrl).toBe('/payments');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/connection-error');
  });

  it('should return the user to the last url on a browser online event', () => {
    service.markOffline('/settings');
    router.url = '/connection-error';
    service.init();

    window.dispatchEvent(new Event('online'));

    expect(service.offline()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/settings');
  });
});
