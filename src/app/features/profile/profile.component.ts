import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;

  // Only the fields the Identity login API actually returns.
  readonly name = computed(() => this.user()?.name ?? 'Admin User');
  readonly email = computed(() => this.user()?.email ?? 'admin@sapumal.lk');
  readonly role = computed(() => this.user()?.role ?? 'Administrator');
  readonly userId = computed(() => this.user()?.userId ?? '—');

  readonly initials = computed(() =>
    this.name()
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}
