import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('auth guards', () => {
  let isAuthenticated: ReturnType<typeof signal<boolean>>;
  let loginTree: UrlTree;
  let dashboardTree: UrlTree;
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    isAuthenticated = signal(false);
    loginTree = new UrlTree();
    dashboardTree = new UrlTree();

    router = {
      createUrlTree: vi.fn((commands: string[]) =>
        commands[0] === '/login' ? loginTree : dashboardTree,
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: { isAuthenticated } },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow activation when authenticated', () => {
      isAuthenticated.set(true);
      const result = TestBed.runInInjectionContext(() => authGuard(route, state));
      expect(result).toBe(true);
    });

    it('should redirect to /login when not authenticated', () => {
      const result = TestBed.runInInjectionContext(() => authGuard(route, state));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).toBe(loginTree);
    });
  });

  describe('guestGuard', () => {
    it('should allow activation when signed out', () => {
      const result = TestBed.runInInjectionContext(() => guestGuard(route, state));
      expect(result).toBe(true);
    });

    it('should redirect signed-in users to /dashboard', () => {
      isAuthenticated.set(true);
      const result = TestBed.runInInjectionContext(() => guestGuard(route, state));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      expect(result).toBe(dashboardTree);
    });
  });
});
