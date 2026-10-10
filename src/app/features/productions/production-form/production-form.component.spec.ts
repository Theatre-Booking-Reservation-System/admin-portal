import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NgForm } from '@angular/forms';
import { ProductionFormComponent } from './production-form.component';
import { CatalogueService } from '../../../core/services/catalogue.service';

function validForm(): NgForm {
  return { invalid: false, control: { markAllAsTouched: vi.fn() } } as unknown as NgForm;
}

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('ProductionFormComponent', () => {
  let fixture: ComponentFixture<ProductionFormComponent>;
  let component: ProductionFormComponent;
  let catalogue: {
    getProductionById: ReturnType<typeof vi.fn>;
    createProduction: ReturnType<typeof vi.fn>;
    updateProduction: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  async function build(paramId: string | null = null) {
    catalogue = {
      getProductionById: vi.fn(() => of({ title: 'Loaded' })),
      createProduction: vi.fn(() => of({ statusCode: '000' })),
      updateProduction: vi.fn(() => of({ statusCode: '000' })),
    };
    router = { navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductionFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CatalogueService, useValue: catalogue },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => paramId } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductionFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  function fillRequired() {
    component.title = 'Macbeth';
    component.language = 'English';
    component.genre = 'Drama';
    component.description = 'A tragedy.';
    component.ageRestriction = '12+';
    component.duration = 120;
    component.baseTicketCost = 1500;
    component.startDate = '2026-06-01';
    component.endDate = '2026-06-30';
  }

  // ── Date validation ────────────────────────────────────────────────────
  it('should flag an end date earlier than the start date', async () => {
    await build();
    component.startDate = '2026-06-10';
    component.endDate = '2026-06-01';

    expect(component.validateDates()).toBe(false);
    expect(component.dateError()).toContain('on or after');
  });

  it('should accept an end date on or after the start date', async () => {
    await build();
    component.startDate = '2026-06-01';
    component.endDate = '2026-06-01';

    expect(component.validateDates()).toBe(true);
    expect(component.dateError()).toBeNull();
  });

  it('should block save when dates are invalid', async () => {
    await build();
    fillRequired();
    component.endDate = '2026-05-01'; // before start

    component.save(new Event('submit'), validForm());

    expect(catalogue.createProduction).not.toHaveBeenCalled();
    expect(component.dateError()).not.toBeNull();
  });

  // ── Description counter ──────────────────────────────────────────────────
  it('should track the description length', async () => {
    await build();
    component.onDescInput('hello');
    expect(component.descLength()).toBe(5);
  });

  // ── Cast & crew buttons ──────────────────────────────────────────────────
  it('should start with a single blank cast/crew row', async () => {
    await build();
    expect(component.castCrew.length).toBe(1);
  });

  it('should add a cast/crew row', async () => {
    await build();
    component.addMember();
    expect(component.castCrew.length).toBe(2);
  });

  it('should remove a cast/crew row but always keep at least one', async () => {
    await build();
    component.addMember();
    component.removeMember(0);
    expect(component.castCrew.length).toBe(1);

    component.removeMember(0);
    expect(component.castCrew.length).toBe(1); // never drops to zero
  });

  // ── Poster validation ────────────────────────────────────────────────────
  it('should reject a poster with an unsupported type', async () => {
    await build();
    component.onPosterSelected({
      target: { files: [makeFile('poster.gif', 'image/gif', 10)], value: '' },
    } as unknown as Event);

    expect(component.posterError()).toContain('PNG or JPG');
    expect(component.posterFile).toBeNull();
  });

  it('should reject a poster larger than 5MB', async () => {
    await build();
    const tooBig = makeFile('poster.png', 'image/png', 5 * 1024 * 1024 + 1);
    component.onPosterSelected({
      target: { files: [tooBig], value: '' },
    } as unknown as Event);

    expect(component.posterError()).toContain('too large');
    expect(component.posterFile).toBeNull();
  });

  it('should clear the poster on removePoster', async () => {
    await build();
    component.posterFile = makeFile('poster.png', 'image/png', 10);
    component.posterPreview.set('data:image/png;base64,AAA');
    component.posterError.set('x');

    component.removePoster();

    expect(component.posterFile).toBeNull();
    expect(component.posterPreview()).toBeNull();
    expect(component.posterError()).toBeNull();
  });

  it('should expose the raw base64 payload without the data-url prefix', async () => {
    await build();
    component.posterPreview.set('data:image/png;base64,SGVsbG8=');
    expect(component.posterBase64Raw).toBe('SGVsbG8=');
  });

  // ── Save flow ────────────────────────────────────────────────────────────
  it('should create a production on a valid save and show success', async () => {
    await build();
    fillRequired();

    component.save(new Event('submit'), validForm());

    expect(catalogue.createProduction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Macbeth',
        language: 'ENGLISH',
        status: 1,
      }),
    );
    expect(component.showSuccess()).toBe(true);
  });

  it('should drop blank cast/crew rows from the payload', async () => {
    await build();
    fillRequired();
    component.castCrew = [
      { name: 'Jane Doe', position: 'Director' },
      { name: '', position: '' },
    ];

    component.save(new Event('submit'), validForm());

    const payload = catalogue.createProduction.mock.calls[0][0];
    expect(payload.castCrew).toEqual([{ key: 'Director', value: 'Jane Doe' }]);
  });

  it('should show an error when the create request fails', async () => {
    await build();
    catalogue.createProduction.mockReturnValueOnce(throwError(() => new Error('boom')));
    fillRequired();

    component.save(new Event('submit'), validForm());

    expect(component.saveError()).toContain('Could not create');
    expect(component.saving()).toBe(false);
  });

  it('should load and update in edit mode', async () => {
    await build('prod-5');
    expect(component.isEdit()).toBe(true);
    expect(catalogue.getProductionById).toHaveBeenCalledWith('prod-5');
    expect(component.title).toBe('Loaded');

    fillRequired();
    component.save(new Event('submit'), validForm());

    expect(catalogue.updateProduction).toHaveBeenCalledWith('prod-5', expect.any(Object));
  });

  it('should navigate back on dismissSuccess', async () => {
    await build();
    component.dismissSuccess();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/productions');
  });
});
