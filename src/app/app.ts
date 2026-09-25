import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorModalComponent } from './shared/error-modal/error-modal.component';
import { ConnectionService } from './core/services/connection.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorModalComponent],
  template: `
    <router-outlet />
    <app-error-modal />
  `,
})
export class App {
  private readonly connection = inject(ConnectionService);

  constructor() {
    // Start listening for browser online/offline events.
    this.connection.init();
  }
}
