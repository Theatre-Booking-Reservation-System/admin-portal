import { Injectable, signal } from '@angular/core';

export interface AppError {
  title: string;
  message: string;
  code?: string;
  /** HTTP status the error came from, if any (e.g. 403). */
  status?: number;
}

/// Holds a single active error to display in the global error modal.
 
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly error = signal<AppError | null>(null);

  showError(error: AppError): void {
    this.error.set(error);
  }

  clear(): void {
    this.error.set(null);
  }
}
