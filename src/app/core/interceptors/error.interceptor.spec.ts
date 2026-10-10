import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { ConnectionService } from '../services/connection.service';

describe('errorInterceptor', () => {
  let auth: { logout: ReturnType<typeof vi.fn> };
  let notifications: { showError: ReturnType<typeof vi.fn> };
  let connection: { markOffline: ReturnType<typeof vi.fn> };
  let router: { url: string; navigateByUrl: ReturnType<typeof vi.fn> };

  function runSuccess(body: unknown, url = '/api/catalogue/x') {
    const next: HttpHandlerFn = () => of(new HttpResponse({ status: 200, body }));
    TestBed.runInInjectionContext(() =>
      errorInterceptor(new HttpRequest('GET', url), next).subscribe(),
    );
  }

  function runError(err: HttpErrorResponse, url = '/api/catalogue/x') {
    const next: HttpHandlerFn = () => throwError(() => err);
    let caught: unknown;
    TestBed.runInInjectionContext(() =>
      errorInterceptor(new HttpRequest('GET', url), next).subscribe({
        error: (e) => (caught = e),
      }),
    );
    return caught;
  }

  beforeEach(() => {
    auth = { logout: vi.fn() };
    notifications = { showError: vi.fn() };
    connection = { markOffline: vi.fn() };
    router = { url: '/dashboard', navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notifications },
        { provide: ConnectionService, useValue: connection },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should force logout when a 200 body carries the auth-required code', () => {
    runSuccess({ statusCode: 'ATH_04' });

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should force logout when an error body carries the auth-required code', () => {
    runError(new HttpErrorResponse({ status: 400, error: { statusCode: 'ATH_04' } }));

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(notifications.showError).not.toHaveBeenCalled();
  });

  it('should force logout on a 440 session-expired response', () => {
    runError(new HttpErrorResponse({ status: 440 }));

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should route to the connection-error page on a connection-class status', () => {
    router.url = '/bookings';
    runError(new HttpErrorResponse({ status: 503 }));

    expect(connection.markOffline).toHaveBeenCalledWith('/bookings');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/connection-error');
    expect(notifications.showError).not.toHaveBeenCalled();
  });

  it('should show the global modal for a generic error', () => {
    runError(
      new HttpErrorResponse({
        status: 403,
        error: { statusCode: 'ATH_07', statusDescription: 'Forbidden here' },
      }),
    );

    expect(notifications.showError).toHaveBeenCalledWith({
      title: 'Access denied',
      message: 'Forbidden here',
      code: 'ATH_07',
      status: 403,
    });
  });

  it('should suppress the modal for the silent login path', () => {
    runError(new HttpErrorResponse({ status: 401 }), '/api/identity/auth/login');

    expect(notifications.showError).not.toHaveBeenCalled();
  });

  it('should re-throw the error to the caller', () => {
    const err = new HttpErrorResponse({ status: 500 });
    const caught = runError(err);

    expect(caught).toBe(err);
  });
});
