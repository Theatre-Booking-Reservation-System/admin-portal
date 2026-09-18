import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  username = '';
  password = '';
  remember = false;

  readonly showPassword = signal(false);
  readonly year = new Date().getFullYear();

  constructor(private readonly router: Router) {}

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    // UI-only for now: navigate to the dashboard. Real auth is wired later.
    this.router.navigateByUrl('/dashboard');
  }
}
