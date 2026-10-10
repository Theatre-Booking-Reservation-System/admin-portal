import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginResponse } from '../models/auth.models';

const TOKEN_KEY = 'sapumal-admin-token';
const USER_KEY = 'sapumal-admin-user';

/**
 * The test runner's jsdom exposes a non-functional `localStorage` stub, so we
 * install a small in-memory implementation that AuthService can read/write
 * deterministically.
 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
  } as Storage;
}

let memoryStorage: Storage;

function clearStoredSession(): void {
  memoryStorage.removeItem(TOKEN_KEY);
  memoryStorage.removeItem(USER_KEY);
}

function adminLoginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    statusCode: '000',
    statusDescription: 'Success',
    accessToken: 'jwt-token-123',
    tokenType: 'Bearer',
    expiresIn: 3600,
    userId: 'u-1',
    name: 'Ada Admin',
    email: 'ada@theatre.test',
    role: 'ADMIN',
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeAll(() => {
    memoryStorage = createMemoryStorage();
    vi.stubGlobal('localStorage', memoryStorage);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    clearStoredSession();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    clearStoredSession();
  });

  it('should start signed out', () => {
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBeNull();
  });

  it('should persist the session on a successful admin login', () => {
    const res = adminLoginResponse();
    let emitted: LoginResponse | undefined;

    service.login({ email: 'ada@theatre.test', password: 'secret' }).subscribe((r) => {
      emitted = r;
    });

    const req = httpMock.expectOne('/api/identity/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ada@theatre.test', password: 'secret' });
    req.flush(res);

    expect(emitted).toEqual(res);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual({
      userId: 'u-1',
      name: 'Ada Admin',
      email: 'ada@theatre.test',
      role: 'ADMIN',
    });
    expect(service.role()).toBe('ADMIN');
    expect(service.token).toBe('jwt-token-123');
    expect(localStorage.getItem(USER_KEY)).toContain('ada@theatre.test');
  });

  it('should reject a login response with no access token', () => {
    let error: Error | undefined;

    service.login({ email: 'x@y.z', password: 'bad' }).subscribe({
      error: (e: Error) => (error = e),
    });

    httpMock
      .expectOne('/api/identity/auth/login')
      .flush(adminLoginResponse({ accessToken: '', statusDescription: 'Invalid credentials' }));

    expect(error?.message).toBe('Invalid credentials');
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token).toBeNull();
  });

  it('should reject patrons and never persist their session', () => {
    let error: Error | undefined;

    service.login({ email: 'patron@y.z', password: 'ok' }).subscribe({
      error: (e: Error) => (error = e),
    });

    httpMock
      .expectOne('/api/identity/auth/login')
      .flush(adminLoginResponse({ role: 'PATRON' }));

    expect(error?.message).toContain('does not have permission');
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('should clear the session on logout', () => {
    service.login({ email: 'ada@theatre.test', password: 'secret' }).subscribe();
    httpMock.expectOne('/api/identity/auth/login').flush(adminLoginResponse());
    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('should restore a stored user when a new instance is created', () => {
    const user = { userId: 'u-9', name: 'Returning', email: 'r@t.test', role: 'ADMIN' };
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    });
    const fresh = TestBed.inject(AuthService);

    expect(fresh.user()).toEqual(user);
    expect(fresh.isAuthenticated()).toBe(true);
  });

  it('should POST patron registrations to the register endpoint', () => {
    const payload = {
      name: 'Pat',
      email: 'pat@t.test',
      dateOfBirth: '1990-01-01',
      nicPassportNo: 'N123',
      password: 'pw',
    };
    let done = false;

    service.register(payload).subscribe(() => (done = true));

    const req = httpMock.expectOne('/api/identity/patron/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ statusCode: '000', statusDescription: 'ok', patronId: 'p-1', email: 'pat@t.test' });

    expect(done).toBe(true);
  });
});
