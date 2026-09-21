import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-concession-form',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
  templateUrl: './concession-form.component.html',
  styleUrl: './concession-form.component.scss',
})
export class ConcessionFormComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));

  name = '';
  discountType = 'Percentage';
  discountValue: number | null = null;
  eligibility = '';
  requiredProof = '';
  applicableTo = 'All';
  description = '';
  terms = '';
  status = 'Active';

  readonly discountTypes = ['Percentage', 'Fixed'];

  constructor() {
    if (this.isEdit()) {
      this.name = 'Under 16';
      this.discountType = 'Percentage';
      this.discountValue = 25;
      this.eligibility = 'Age 16 and below';
      this.requiredProof = 'Valid ID (e.g. Passport, School ID)';
      this.applicableTo = 'All';
      this.description = 'Applicable to customers aged 16 and below. Valid ID must be presented at the theatre.';
      this.terms =
        'Valid ID must be presented upon entry.\nConcession tickets are non-transferable.\nCannot be combined with other promotions.';
      this.status = 'Active';
    }
  }

  save(event: Event) {
    event.preventDefault();
    this.router.navigateByUrl('/concessions');
  }
}
