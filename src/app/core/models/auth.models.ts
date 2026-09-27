// ─────────────────────────────────────────────────────────────────────────────
// Identity Service API models (mirrors the OpenAPI spec at /v3/api-docs).
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  statusCode: string;
  statusDescription: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface PatronRegisterRequest {
  name: string;
  email: string;
  contactNo?: string;
  dateOfBirth: string; // YYYY-MM-DD
  nicPassportNo: string;
  password: string;
}

export interface PatronRegisterResponse {
  statusCode: string;
  statusDescription: string;
  patronId: string;
  email: string;
}

/** The authenticated user profile we keep in memory / storage. */
export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: string;
}

// ── Patron management (admin portal) ─────────────────────────────────────────

/** Generic status-only envelope (e.g. unlock). */
export interface CommonResponse {
  statusCode: string;
  statusDescription: string;
}

/** Read-only patron summary returned by list / search / detail. */
export interface PatronSummary {
  patronId: string;
  name?: string;
  email?: string;
  contactNo?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  nicPassportNo?: string;
  verified?: boolean;
  loyaltyCardNo?: string;
  loyaltyHolder?: boolean;
  /** Account status flag (integer). */
  status?: number;
  addedDate?: string; // date-time
}

export interface PatronListResponse {
  statusCode: string;
  statusDescription: string;
  totalCount?: number;
  patrons: PatronSummary[];
}

export interface PatronDetailResponse {
  statusCode: string;
  statusDescription: string;
  patron?: PatronSummary;
}

export interface LoyaltyEnrollResponse {
  statusCode: string;
  statusDescription: string;
  patronId?: string;
  loyaltyCardNo?: string;
}

/** Optional filters for GET /patron/search. */
export interface PatronSearchParams {
  name?: string;
  email?: string;
  loyaltyHolder?: boolean;
  status?: number;
}
