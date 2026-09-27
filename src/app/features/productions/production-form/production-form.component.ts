import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CatalogueService } from '../../../core/services/catalogue.service';
import {
  ProductionItem,
  ProductionLanguage,
  ProductionRequest,
} from '../../../core/models/catalogue.models';

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
  templateUrl: './production-form.component.html',
  styleUrl: './production-form.component.scss',
})
export class ProductionFormComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly catalogue = inject(CatalogueService);

  private readonly productionId = this.route.snapshot.paramMap.get('id');

  /** Edit mode when the route has an :id param. */
  readonly isEdit = signal(!!this.productionId);

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly showSuccess = signal(false);

  /** True while the existing production is being fetched (edit mode). */
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  title = '';
  language = '';
  genre = '';
  description = '';
  status: 'Active' | 'Inactive' = 'Active';
  ageRestriction = '';
  duration: number | null = null;
  intermission: number | null = null;
  baseTicketCost: number | null = null;
  startDate = '';
  endDate = '';

  /** Cast & crew entries — each has a name and a position/role. */
  castCrew: { name: string; position: string }[] = [{ name: '', position: '' }];

  readonly languages = ['Sinhala', 'Tamil', 'English'];
  readonly genres = ['Drama', 'Musical', 'Comedy', 'Dance', 'Opera', 'Children'];
  readonly ageRestrictions = ['All Ages', '7+', '12+', '16+', '18+'];

  readonly descLength = signal(0);
  readonly dateError = signal<string | null>(null);

  // ── Poster image upload ─────────────────────────────────────────────────
  /** Data-URL preview of the selected/existing poster, if any. */
  readonly posterPreview = signal<string | null>(null);
  /** The selected File, ready to upload once the backend endpoint exists. */
  posterFile: File | null = null;
  readonly posterError = signal<string | null>(null);
  readonly posterDragging = signal(false);

  private static readonly MAX_POSTER_BYTES = 5 * 1024 * 1024; // 5 MB
  private static readonly ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

  constructor() {
    if (this.isEdit() && this.productionId) {
      this.loadProduction(this.productionId);
    }
  }

  /** Fetch the production and populate the form fields (edit mode). */
  private loadProduction(id: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.catalogue.getProductionById(id).subscribe({
      next: (res) => {
        this.applyProduction(res);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load this production. Please try again.');
        this.loading.set(false);
      },
    });
  }

  /** Map an API ProductionItem/Response onto the form's fields. */
  private applyProduction(p: ProductionItem): void {
    this.title = p.title ?? '';
    this.language = p.language ? (LANGUAGE_LABEL[p.language] ?? '') : '';
    this.genre = p.genre ?? '';
    this.description = p.description ?? '';
    this.status = p.status === 9 ? 'Inactive' : 'Active';
    this.ageRestriction = p.ageRestriction ?? '';
    this.duration = p.duration != null && p.duration !== '' ? Number(p.duration) : null;
    this.baseTicketCost = p.baseTicketCost ?? null;
    this.startDate = isoDate(p.releaseDate);
    this.endDate = isoDate(p.endDate);
    const crew = (p.castCrew ?? [])
      .filter((m) => (m.value ?? '').trim() || (m.key ?? '').trim())
      .map((m) => ({ name: m.value ?? '', position: m.key ?? '' }));
    this.castCrew = crew.length ? crew : [{ name: '', position: '' }];
    if (p.posterImageUrl) {
      this.posterPreview.set(posterSrc(p.posterImageUrl));
    }
    this.descLength.set(this.description.length);
  }

  onDescInput(value: string) {
    this.description = value;
    this.descLength.set(value.length);
  }

  /** File picker change handler. */
  onPosterSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.handlePosterFile(file);
    // Reset the input so selecting the same file again re-triggers change.
    input.value = '';
  }

  onPosterDragOver(event: DragEvent) {
    event.preventDefault();
    this.posterDragging.set(true);
  }

  onPosterDragLeave(event: DragEvent) {
    event.preventDefault();
    this.posterDragging.set(false);
  }

  onPosterDrop(event: DragEvent) {
    event.preventDefault();
    this.posterDragging.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.handlePosterFile(file);
  }

  removePoster() {
    this.posterFile = null;
    this.posterPreview.set(null);
    this.posterError.set(null);
  }

  /**
   * The poster encoded as base64 for the API's `posterImageUrl` field.
   * `posterPreview()` already holds the full data URL produced by
   * FileReader.readAsDataURL (e.g. "data:image/png;base64,iVBOR...").
   * Returns the full data URL, or null when no image is selected.
   */
  get posterBase64(): string | null {
    return this.posterPreview();
  }

  /** Just the raw base64 payload, without the "data:*;base64," prefix. */
  get posterBase64Raw(): string | null {
    const dataUrl = this.posterPreview();
    if (!dataUrl) return null;
    const comma = dataUrl.indexOf(',');
    return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  }

  private handlePosterFile(file: File | null) {
    if (!file) return;
    if (!ProductionFormComponent.ACCEPTED_TYPES.includes(file.type)) {
      this.posterError.set('Please choose a PNG or JPG image.');
      return;
    }
    if (file.size > ProductionFormComponent.MAX_POSTER_BYTES) {
      this.posterError.set('Image is too large. Maximum size is 5MB.');
      return;
    }
    this.posterError.set(null);
    this.posterFile = file;
    const reader = new FileReader();
    reader.onload = () => this.posterPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  /** Add a blank cast/crew row. */
  addMember() {
    this.castCrew = [...this.castCrew, { name: '', position: '' }];
  }

  /** Remove the cast/crew row at the given index (always keep at least one). */
  removeMember(index: number) {
    this.castCrew = this.castCrew.filter((_, i) => i !== index);
    if (this.castCrew.length === 0) {
      this.castCrew = [{ name: '', position: '' }];
    }
  }

  /** Re-validate the date range whenever either date changes. */
  validateDates(): boolean {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      this.dateError.set('End date must be on or after the release date.');
      return false;
    }
    this.dateError.set(null);
    return true;
  }

  save(event: Event, form: NgForm) {
    event.preventDefault();
    if (this.saving()) return;

    const datesValid = this.validateDates();

    // Surface every field's error state and block submission if invalid.
    if (form.invalid || !datesValid) {
      form.control.markAllAsTouched();
      return;
    }

    // Payload mirrors the catalogue ProductionRequest. The poster is sent as a
    // base64 data URL in posterImageUrl.
    const payload: ProductionRequest = {
      title: this.title.trim(),
      language: this.language.toUpperCase() as ProductionLanguage,
      genre: this.genre,
      description: this.description,
      baseTicketCost: this.baseTicketCost ?? undefined,
      duration: this.duration != null ? String(this.duration) : undefined,
      ageRestriction: this.ageRestriction || undefined,
      // Map the form's { name, position } rows to the spec's { key, value },
      // dropping any blank rows.
      castCrew: this.castCrew
        .filter((m) => m.name.trim() || m.position.trim())
        .map((m) => ({ key: m.position.trim(), value: m.name.trim() })),
      releaseDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      status: this.status === 'Active' ? 1 : 9,
      posterImageUrl: this.posterBase64 ?? undefined,
    };

    this.saving.set(true);
    this.saveError.set(null);

    const request$ =
      this.isEdit() && this.productionId
        ? this.catalogue.updateProduction(this.productionId, payload)
        : this.catalogue.createProduction(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess.set(true);
      },
      error: () => {
        this.saveError.set(
          this.isEdit()
            ? 'Could not update the production. Please try again.'
            : 'Could not create the production. Please try again.',
        );
        this.saving.set(false);
      },
    });
  }

  /** Close the success modal and return to the productions list. */
  dismissSuccess(): void {
    this.showSuccess.set(false);
    this.router.navigateByUrl('/productions');
  }
}

/** API language enum → the select's option label. */
const LANGUAGE_LABEL: Record<string, string> = {
  SINHALA: 'Sinhala',
  TAMIL: 'Tamil',
  ENGLISH: 'English',
};

/** Normalise an API date/datetime to "YYYY-MM-DD" for a date input. */
function isoDate(value?: string): string {
  if (!value) return '';
  return value.length > 10 ? value.slice(0, 10) : value;
}

/**
 * Normalise posterImageUrl into an <img src>: full data URL, http(s)/relative
 * URL used as-is; otherwise treated as raw base64 image data.
 */
function posterSrc(value?: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) {
    return v;
  }
  const mime = v.startsWith('/9j') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${v}`;
}
