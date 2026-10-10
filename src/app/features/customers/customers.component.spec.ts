import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { CustomersComponent } from './customers.component';
import { PatronService } from '../../core/services/patron.service';

describe('CustomersComponent (sorting)', () => {
  function build(patrons: unknown[]) {
    const service = {
      listPatrons: vi.fn(() => of({ patrons })),
      unlockPatron: vi.fn(() => of({})),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PatronService, useValue: service },
      ],
    });
    return TestBed.createComponent(CustomersComponent).componentInstance;
  }

  it('should order customers newest-first by addedDate', () => {
    const component = build([
      { patronId: 'c-old', name: 'Old', addedDate: '2024-05-01T10:00:00Z' },
      { patronId: 'c-new', name: 'New', addedDate: '2026-05-01T10:00:00Z' },
      { patronId: 'c-mid', name: 'Mid', addedDate: '2025-05-01T10:00:00Z' },
    ]);

    expect(component.customers().map((c) => c.id)).toEqual(['c-new', 'c-mid', 'c-old']);
  });
});
