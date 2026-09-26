// ─────────────────────────────────────────────────────────────────────────────
// Catalogue Service API models (mirrors the OpenAPI spec at /v3/api-docs).
// Manages theatre productions and their performances.
// ─────────────────────────────────────────────────────────────────────────────

export type ProductionLanguage = 'SINHALA' | 'TAMIL' | 'ENGLISH';
export type SessionType = 'MATINEE' | 'EVENING';

/** status: 1 = Active, 9 = Inactive/Archived. */
export type CatalogueStatus = number;

// ── Productions ──────────────────────────────────────────────────────────────

export interface ProductionRequest {
  titleEn?: string;
  titleSi?: string;
  titleTa?: string;
  language?: ProductionLanguage;
  genre?: string;
  descriptionEn?: string;
  descriptionSi?: string;
  descriptionTa?: string;
  baseTicketCost?: number;
  releaseDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  posterImageUrl?: string;
  status?: CatalogueStatus;
}

export interface ProductionItem {
  productionId: string;
  titleEn?: string;
  titleSi?: string;
  titleTa?: string;
  language?: ProductionLanguage;
  genre?: string;
  descriptionEn?: string;
  descriptionSi?: string;
  descriptionTa?: string;
  baseTicketCost?: number;
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
  releaseDate?: string;
  earlyAccessOpensAt?: string;
  isEarlyAccessActive?: boolean;
  status?: CatalogueStatus;
}

export interface PerformanceItem {
  performanceId: string;
  productionId: string;
  date?: string;
  time?: string;
  sessionType?: SessionType;
  releaseDate?: string;
  earlyAccessOpensAt?: string;
  isEarlyAccessActive?: boolean;
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
  q?: string;
  status?: CatalogueStatus;
  upcoming?: boolean;
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
