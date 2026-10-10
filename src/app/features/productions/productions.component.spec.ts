import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProductionsComponent } from './productions.component';
import { CatalogueService } from '../../core/services/catalogue.service';

describe('ProductionsComponent (sorting)', () => {
  function build(productions: unknown[]) {
    const catalogue = {
      getAllProductions: vi.fn(() => of({ productions })),
      deleteProduction: vi.fn(() => of(void 0)),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CatalogueService, useValue: catalogue },
      ],
    });
    const component = TestBed.createComponent(ProductionsComponent).componentInstance;
    return { component, catalogue };
  }

  it('should surface the most recently added production first', () => {
    // API returns insertion order: oldest first, newest (just created) last.
    const { component } = build([
      { productionId: 'p1', title: 'First Created', releaseDate: '2026-01-01' },
      { productionId: 'p2', title: 'Second Created', releaseDate: '2026-02-01' },
      { productionId: 'p3', title: 'Just Created', releaseDate: '2025-06-01' },
    ]);

    const ids = component.productions().map((p) => p.id);
    expect(ids).toEqual(['p3', 'p2', 'p1']);
  });

  it('should keep newest-first even when the newest has an older release date', () => {
    const { component } = build([
      { productionId: 'old', title: 'Old', releaseDate: '2026-12-31' },
      { productionId: 'new', title: 'New', releaseDate: '2020-01-01' },
    ]);

    // "new" was appended last by the API, so it leads despite the earlier date.
    expect(component.productions()[0].id).toBe('new');
  });
});
