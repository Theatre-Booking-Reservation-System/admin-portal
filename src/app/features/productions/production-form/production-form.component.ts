import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { ProductionLanguage, ProductionRequest } from '../../../core/models/catalogue.models';

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
    if (this.isEdit()) {
      // Pre-fill with hardcoded sample data for the edit demo.
      this.title = 'Sanda Katha';
      this.language = 'Sinhala';
      this.genre = 'Drama';
      this.description =
        'Sanda Katha is a captivating drama that brings together tradition and modern storytelling, performed in Sinhala. A journey of love, heritage and identity.';
      this.status = 'Active';
      this.ageRestriction = 'All Ages';
      this.duration = 120;
      this.intermission = 15;
      this.baseTicketCost = 2000;
      this.startDate = '2025-05-24';
      this.endDate = '2025-06-06';
      this.castCrew = [
        { name: 'Nimal Perera', position: 'Lead Actor' },
        { name: 'Kavindi Silva', position: 'Director' },
      ];
      this.descLength.set(this.description.length);
    }
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
