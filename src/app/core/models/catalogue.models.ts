// ─────────────────────────────────────────────────────────────────────────────
// Catalogue Service API models (mirrors the OpenAPI spec at /v3/api-docs).
// Manages theatre productions and their performances.
// ─────────────────────────────────────────────────────────────────────────────

export type ProductionLanguage = 'SINHALA' | 'TAMIL' | 'ENGLISH';
export type SessionType = 'MATINEE' | 'EVENING';

/** status: 1 = Active, 9 = Inactive/Archived. */
export type CatalogueStatus = number;

/** A single cast/crew entry, e.g. { key: 'Director', value: 'Jane Doe' }. */
export interface CastCrewMember {
  key?: string;
  value?: string;
}

// ── Productions ──────────────────────────────────────────────────────────────

export interface ProductionRequest {
  title?: string;
  language?: ProductionLanguage;
  genre?: string;
  description?: string;
  baseTicketCost?: number;
  duration?: string;
  ageRestriction?: string;
  castCrew?: CastCrewMember[];
  releaseDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  posterImageUrl?: string;
  status?: CatalogueStatus;
}

export interface ProductionItem {
  productionId: string;
  title?: string;
  language?: ProductionLanguage;
  genre?: string;
  description?: string;
  baseTicketCost?: number;
  duration?: string;
  ageRestriction?: string;
  castCrew?: CastCrewMember[];
  releaseDate?: string;
  endDate?: string;
  posterImageUrl?: string;
  status?: CatalogueStatus;
}

export interface ProductionResponse extends ProductionItem {
  statusCode: string;
  statusDescription: string;
}

export interface ProductionListResponse {
  statusCode: string;
  statusDescription: string;
  productions: ProductionItem[];
}

export interface ProductionSummaryResponse {
  statusCode: string;
  statusDescription: string;
  active: number;
  upcoming: number;
  inactive: number;
  total: number;
}

export interface ProductionSearchResponse {
  statusCode: string;
  statusDescription: string;
  content: ProductionItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ── Performances ─────────────────────────────────────────────────────────────

export interface PerformanceRequest {
  productionId?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm[:ss]
  sessionType?: SessionType;
  status?: CatalogueStatus;
}

export interface PerformanceItem {
  performanceId: string;
  productionId: string;
  date?: string;
  time?: string;
  sessionType?: SessionType;
  status?: CatalogueStatus;
}

export interface PerformanceResponse extends PerformanceItem {
  statusCode: string;
  statusDescription: string;
}

export interface PerformanceListResponse {
  statusCode: string;
  statusDescription: string;
  performances: PerformanceItem[];
}

export interface PerformanceSearchResponse {
  statusCode: string;
  statusDescription: string;
  content: PerformanceItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ── Query params ─────────────────────────────────────────────────────────────

export interface ProductionSearchParams {
  title?: string;
  status?: CatalogueStatus;
  genre?: string;
  language?: ProductionLanguage;
  releaseDate?: string; // on or after (YYYY-MM-DD)
  endDate?: string; // on or before (YYYY-MM-DD)
  page?: number;
  size?: number;
  sort?: string; // e.g. "releaseDate,desc"
}

export interface PerformanceSearchParams {
  productionId?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
  sessionType?: SessionType;
  status?: CatalogueStatus;
  page?: number;
  size?: number;
  sort?: string;
}
