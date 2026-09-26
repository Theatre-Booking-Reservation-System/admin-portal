import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BookingListResponse,
  BookingRequest,
  BookingResponse,
} from '../models/booking.models';

/**
 * Booking Service client — create, look up and cancel bookings.
 * Mirrors the OpenAPI spec served at `${booking}/v3/api-docs`.
 * The auth interceptor attaches the Bearer token automatically.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.services.booking;

  /** Create a new booking (PENDING / UNPAID). */
  createBooking(body: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/bookings`, body);
  }

  /** Look up a booking by its human-readable reference (e.g. STB-20260913-00847). */
  getBookingByRef(ref: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/bookings/${ref}`);
  }

  /** Cancel a booking by its UUID. */
  cancelBooking(id: string): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/bookings/${id}/cancel`, {});
  }

  /** List all bookings placed by a patron, most recent first. */
  getBookingsByPatronId(patronId: string): Observable<BookingListResponse> {
    return this.http.get<BookingListResponse>(`${this.baseUrl}/patrons/${patronId}/bookings`);
  }
}
