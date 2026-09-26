import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PerformanceListResponse,
  PerformanceRequest,
  PerformanceResponse,
  PerformanceSearchParams,
  PerformanceSearchResponse,
  ProductionListResponse,
  ProductionRequest,
  ProductionResponse,
  ProductionSearchParams,
  ProductionSearchResponse,
  ProductionSummaryResponse,
} from '../models/catalogue.models';

/**
 * Catalogue Service client — productions and performances.
 * Mirrors the OpenAPI spec served at `${catalogue}/v3/api-docs`.
 * The auth interceptor attaches the Bearer token automatically.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.services.catalogue;

  // ── Productions ────────────────────────────────────────────────────────────

  getAllProductions(): Observable<ProductionListResponse> {
    return this.http.get<ProductionListResponse>(`${this.baseUrl}/productions`);
  }

  getProductionById(id: string): Observable<ProductionResponse> {
    return this.http.get<ProductionResponse>(`${this.baseUrl}/productions/${id}`);
  }

  createProduction(body: ProductionRequest): Observable<ProductionResponse> {
    return this.http.post<ProductionResponse>(`${this.baseUrl}/productions`, body);
  }

  updateProduction(id: string, body: ProductionRequest): Observable<ProductionResponse> {
    return this.http.put<ProductionResponse>(`${this.baseUrl}/productions/${id}`, body);
  }

  deleteProduction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/productions/${id}`);
  }

  getProductionSummary(): Observable<ProductionSummaryResponse> {
    return this.http.get<ProductionSummaryResponse>(`${this.baseUrl}/productions/summary`);
  }

  searchProductions(params: ProductionSearchParams = {}): Observable<ProductionSearchResponse> {
    return this.http.get<ProductionSearchResponse>(`${this.baseUrl}/productions/search`, {
      params: toHttpParams(params),
    });
  }

  getPerformancesByProductionId(productionId: string): Observable<PerformanceListResponse> {
    return this.http.get<PerformanceListResponse>(
      `${this.baseUrl}/productions/${productionId}/performances`,
    );
  }

  // ── Performances ───────────────────────────────────────────────────────────

  getPerformanceById(id: string): Observable<PerformanceResponse> {
    return this.http.get<PerformanceResponse>(`${this.baseUrl}/performances/${id}`);
  }

  createPerformance(body: PerformanceRequest): Observable<PerformanceResponse> {
    return this.http.post<PerformanceResponse>(`${this.baseUrl}/performances`, body);
  }

  updatePerformance(id: string, body: PerformanceRequest): Observable<PerformanceResponse> {
    return this.http.put<PerformanceResponse>(`${this.baseUrl}/performances/${id}`, body);
  }

  deletePerformance(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/performances/${id}`);
  }

  searchPerformances(params: PerformanceSearchParams = {}): Observable<PerformanceSearchResponse> {
    return this.http.get<PerformanceSearchResponse>(`${this.baseUrl}/performances/search`, {
      params: toHttpParams(params),
    });
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
