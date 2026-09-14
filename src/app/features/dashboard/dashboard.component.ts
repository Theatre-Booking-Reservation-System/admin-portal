import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <header class="page-head">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="muted">Welcome back, Admin — here's what's happening today.</p>
      </div>
    </header>

    <div class="card" style="margin-top:1rem">Dashboard content coming next.</div>
  `,
  styles: [
    `
      .page-head p {
        margin: 0.25rem 0 0;
      }
    `,
  ],
})
export class DashboardComponent {}
