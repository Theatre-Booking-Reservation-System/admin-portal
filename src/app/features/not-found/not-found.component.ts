import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);

  /** Send signed-in users to the dashboard, otherwise to login. */
  readonly homeLink = this.auth.isAuthenticated() ? '/dashboard' : '/login';

  goBack(): void {
    this.location.back();
  }
}
