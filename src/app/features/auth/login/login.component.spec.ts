import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: { login: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  function compiled(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    auth = { login: vi.fn(() => of({ accessToken: 'x', role: 'ADMIN' })) };
    router = { navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the current year in the footer', async () => {
    await fixture.whenStable();
    expect(compiled().textContent).toContain(String(new Date().getFullYear()));
  });

  it('should keep the submit button enabled while not loading', async () => {
    await fixture.whenStable();
    const submit = compiled().querySelector<HTMLButtonElement>('button.login__submit');
    expect(submit).not.toBeNull();
    expect(submit!.disabled).toBe(false);
  });

  it('should toggle password visibility when the eye button is clicked', async () => {
    await fixture.whenStable();
    const toggle = compiled().querySelector<HTMLButtonElement>('button.field__toggle')!;
    const passwordInput = compiled().querySelector<HTMLInputElement>('input[name="password"]')!;

    expect(passwordInput.type).toBe('password');

    toggle.click();
    await fixture.whenStable();
    expect(component.showPassword()).toBe(true);
    expect(passwordInput.type).toBe('text');

    toggle.click();
    await fixture.whenStable();
    expect(passwordInput.type).toBe('password');
  });

  it('should trim the email and call AuthService.login on submit', () => {
    component.username = '  ada@theatre.test  ';
    component.password = 'secret';

    component.onSubmit(new Event('submit'));

    expect(auth.login).toHaveBeenCalledWith({
      email: 'ada@theatre.test',
      password: 'secret',
    });
  });

  it('should navigate to /dashboard on a successful login', () => {
    component.username = 'ada@theatre.test';
    component.password = 'secret';

    component.onSubmit(new Event('submit'));

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should show a mapped message for a 401 error', () => {
    auth.login.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })));
    component.username = 'ada@theatre.test';
    component.password = 'wrong';

    component.onSubmit(new Event('submit'));

    expect(component.error()).toBe('Invalid email or password.');
    expect(component.loading()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should prefer the backend status description when present', () => {
    auth.login.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { statusDescription: 'Account not verified.' },
          }),
      ),
    );
    component.onSubmit(new Event('submit'));

    expect(component.error()).toBe('Account not verified.');
  });

  it('should surface a thrown Error message that has no HTTP status', () => {
    auth.login.mockReturnValueOnce(throwError(() => new Error('Invalid credentials')));
    component.onSubmit(new Event('submit'));

    expect(component.error()).toBe('Invalid credentials');
  });

  it('should map a 423 locked-account status', () => {
    auth.login.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 423 })));
    component.onSubmit(new Event('submit'));

    expect(component.error()).toContain('locked');
  });

  it('should render an error banner once an error is set', async () => {
    auth.login.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })));
    component.onSubmit(new Event('submit'));
    await fixture.whenStable();

    const banner = compiled().querySelector('.login__error');
    expect(banner?.textContent).toContain('Invalid email or password.');
  });
});
