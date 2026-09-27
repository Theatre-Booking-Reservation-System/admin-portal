import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './error-modal.component.html',
  styleUrl: './error-modal.component.scss',
})
export class ErrorModalComponent {
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = this.notifications.error;

  close(): void {
    // A 403 means the session is no longer authorised — dismissing sends the
    // user back to login so they can re-authenticate.
    const wasForbidden = this.error()?.status === 403;
    this.notifications.clear();
    if (wasForbidden) {
      this.auth.logout();
      this.router.navigateByUrl('/login');
    }
  }
}
