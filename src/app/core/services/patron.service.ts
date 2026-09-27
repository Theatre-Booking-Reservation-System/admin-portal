import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CommonResponse,
  LoyaltyEnrollResponse,
  PatronDetailResponse,
  PatronListResponse,
  PatronSearchParams,
} from '../models/auth.models';

/**
 * Patron Service client — admin-portal patron account management.
 * Backed by the Identity Service; mirrors the OpenAPI spec served at
 * `${identity}/v3/api-docs`. The auth interceptor attaches the Bearer token.
 */
@Injectable({ providedIn: 'root' })
export class PatronService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.services.identity;

  /** List every patron, most recently registered first. */
  listPatrons(): Observable<PatronListResponse> {
    return this.http.get<PatronListResponse>(`${this.baseUrl}/patron/list`);
  }

  /** Search patrons by any combination of optional filters. */
  searchPatrons(params: PatronSearchParams = {}): Observable<PatronListResponse> {
    return this.http.get<PatronListResponse>(`${this.baseUrl}/patron/search`, {
      params: toHttpParams(params),
    });
  }

  /** Get a single patron's details by id. */
  getPatron(patronId: string): Observable<PatronDetailResponse> {
    return this.http.get<PatronDetailResponse>(`${this.baseUrl}/patron/${patronId}`);
  }

  /** Unlock a locked patron account (idempotent, admin only). */
  unlockPatron(patronId: string): Observable<CommonResponse> {
    return this.http.post<CommonResponse>(`${this.baseUrl}/patron/${patronId}/unlock`, {});
  }

  /** Enrol a patron in the loyalty programme. */
  enrollLoyalty(patronId: string): Observable<LoyaltyEnrollResponse> {
    return this.http.post<LoyaltyEnrollResponse>(`${this.baseUrl}/patron/${patronId}/loyalty`, {});
  }
}

/** Build HttpParams from an object, skipping null/undefined/empty values. */
function toHttpParams(obj: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === '') continue;
    params = params.set(key, String(value));
  }
  return params;
}
