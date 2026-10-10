import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let token: string | null;

  function run(req: HttpRequest<unknown>) {
    let forwarded!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (r) => {
      forwarded = r;
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => authInterceptor(req, next).subscribe());
    return forwarded;
  }

  beforeEach(() => {
    token = null;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: { get token() { return token; } } },
      ],
    });
  });

  it('should attach a bearer header when a token exists', () => {
    token = 'jwt-abc';
    const forwarded = run(new HttpRequest('GET', '/api/catalogue/productions'));

    expect(forwarded.headers.get('Authorization')).toBe('Bearer jwt-abc');
  });

  it('should leave the request untouched when there is no token', () => {
    const req = new HttpRequest('GET', '/api/catalogue/productions');
    const forwarded = run(req);

    expect(forwarded.headers.has('Authorization')).toBe(false);
    expect(forwarded).toBe(req);
  });
});
