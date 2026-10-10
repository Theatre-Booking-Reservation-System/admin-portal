import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app';
import { ConnectionService } from './core/services/connection.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialise the connection service on construction', () => {
    const connection = TestBed.inject(ConnectionService);
    const initSpy = vi.spyOn(connection, 'init');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(initSpy).toHaveBeenCalled();
  });

  it('should render the router outlet and error modal', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    expect(compiled.querySelector('app-error-modal')).not.toBeNull();
  });
});
