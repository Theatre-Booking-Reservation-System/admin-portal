import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NgForm } from '@angular/forms';
import { PerformanceFormComponent } from './performance-form.component';
import { HolidayService } from '../../../core/services/holiday.service';
import { CatalogueService } from '../../../core/services/catalogue.service';

/** A production whose run window is wide so range checks pass by default. */
const PRODUCTION = {
  productionId: 'prod-1',
  title: 'Hamlet',
  releaseDate: '2026-06-01',
  endDate: '2026-06-30',
};

function validForm(): NgForm {
  return { invalid: false, control: { markAllAsTouched: vi.fn() } } as unknown as NgForm;
}

describe('PerformanceFormComponent', () => {
  let fixture: ComponentFixture<PerformanceFormComponent>;
  let component: PerformanceFormComponent;
  let catalogue: {
    getAllProductions: ReturnType<typeof vi.fn>;
    getPerformanceById: ReturnType<typeof vi.fn>;
    createPerformance: ReturnType<typeof vi.fn>;
    updatePerformance: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  async function build(paramId: string | null = null) {
    catalogue = {
      getAllProductions: vi.fn(() => of({ productions: [PRODUCTION] })),
      getPerformanceById: vi.fn(() => of(null)),
      createPerformance: vi.fn(() => of({ statusCode: '000' })),
      updatePerformance: vi.fn(() => of({ statusCode: '000' })),
    };
    router = { navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PerformanceFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CatalogueService, useValue: catalogue },
        HolidayService,
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => paramId } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerformanceFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('should load productions into the dropdown on init', async () => {
    await build();
    expect(catalogue.getAllProductions).toHaveBeenCalled();
    expect(component.productions().length).toBe(1);
    expect(component.productions()[0].title).toBe('Hamlet');
  });

  it('should expose today as the minimum date before a production is chosen', async () => {
    await build();
    const today = new Date().toISOString().slice(0, 10);
    expect(component.dateMin()).toBe(today);
    expect(component.dateMax()).toBe('');
  });

  it('should cap the maximum date at the production end date', async () => {
    await build();
    component.onProductionChange('prod-1');
    expect(component.dateMax()).toBe('2026-06-30');
  });

  it('should use the later of today and the release date as the minimum', async () => {
    await build();
    const today = new Date().toISOString().slice(0, 10);
    component.onProductionChange('prod-1');
    // dateMin = release date only when the release date is still in the future;
    // otherwise it falls back to today so you can't schedule in the past.
    const expected = PRODUCTION.releaseDate > today ? PRODUCTION.releaseDate : today;
    expect(component.dateMin()).toBe(expected);
  });

  it('should block a poya day, clear the date, and set poyaError', async () => {
    await build();
    component.onProductionChange('prod-1');

    // 2026-05-31 is Poson Poya — but it's before the run window; use an in-window
    // poya day instead: 2026-06-29 (Esala Poya).
    component.onDateChange('2026-06-29');

    expect(component.poyaError()).toContain('Esala Poya');
    expect(component.date).toBe('');
    expect(component.rangeError()).toBeNull();
  });

  it('should block a date before the production release date', async () => {
    await build();
    component.onProductionChange('prod-1');
    component.onDateChange('2026-05-15');

    expect(component.rangeError()).toContain('release date');
    expect(component.date).toBe('');
  });

  it('should block a date after the production end date', async () => {
    await build();
    component.onProductionChange('prod-1');
    component.onDateChange('2026-07-15');

    expect(component.rangeError()).toContain('end date');
    expect(component.date).toBe('');
  });

  it('should accept a valid, in-window, non-poya date', async () => {
    await build();
    component.onProductionChange('prod-1');
    component.onDateChange('2026-06-15');

    expect(component.poyaError()).toBeNull();
    expect(component.rangeError()).toBeNull();
    expect(component.date).toBe('2026-06-15');
  });

  it('should not submit when the date is missing', async () => {
    await build();
    component.onProductionChange('prod-1');
    component.date = '';

    component.save(new Event('submit'), validForm());

    expect(catalogue.createPerformance).not.toHaveBeenCalled();
  });

  it('should create a performance with a normalised time on a valid save', async () => {
    await build();
    component.onProductionChange('prod-1');
    component.onDateChange('2026-06-15');
    component.time = '19:30';
    component.sessionType = 'Evening';

    component.save(new Event('submit'), validForm());

    expect(catalogue.createPerformance).toHaveBeenCalledWith({
      productionId: 'prod-1',
      date: '2026-06-15',
      time: '19:30:00',
      sessionType: 'EVENING',
      status: 1,
    });
    expect(component.showSuccess()).toBe(true);
    expect(component.saving()).toBe(false);
  });

  it('should show a save error when the create request fails', async () => {
    await build();
    catalogue.createPerformance.mockReturnValueOnce(throwError(() => new Error('boom')));
    component.onProductionChange('prod-1');
    component.onDateChange('2026-06-15');
    component.time = '19:30';
    component.sessionType = 'Evening';

    component.save(new Event('submit'), validForm());

    expect(component.saveError()).toContain('Could not create');
    expect(component.saving()).toBe(false);
    expect(component.showSuccess()).toBe(false);
  });

  it('should update rather than create in edit mode', async () => {
    await build('perf-99');
    expect(component.isEdit()).toBe(true);
    component.onProductionChange('prod-1');
    component.onDateChange('2026-06-15');
    component.time = '14:00';
    component.sessionType = 'Matinee';

    component.save(new Event('submit'), validForm());

    expect(catalogue.updatePerformance).toHaveBeenCalledWith('perf-99', expect.objectContaining({
      productionId: 'prod-1',
      sessionType: 'MATINEE',
    }));
  });

  it('should close the success modal and navigate back on dismiss', async () => {
    await build();
    component.dismissSuccess();

    expect(component.showSuccess()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/performances');
  });
});
