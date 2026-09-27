// ─────────────────────────────────────────────────────────────────────────────
// Seat Service API models (mirrors the OpenAPI spec at /v3/api-docs).
// Seat-zone catalogue and per-performance seat availability.
// ─────────────────────────────────────────────────────────────────────────────

export type SeatSection = 'STALLS' | 'CIRCLE' | 'UPPER_CIRCLE';
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';

export interface SeatZoneItem {
  zoneId: string;
  section?: SeatSection;
  zoneName?: string;
  matineePct?: number;
  eveningPct?: number;
}

export interface SeatZoneListResponse {
  statusCode: string;
  statusDescription: string;
  seatZones: SeatZoneItem[];
}

export interface PerformanceSeatItem {
  seatId: string;
  zoneId: string;
  section?: SeatSection;
  zoneName?: string;
  rowLabel?: string;
  seatNumber?: number;
  wheelchairSpace?: boolean;
  status?: SeatStatus;
}

export interface PerformanceSeatListResponse {
  statusCode: string;
  statusDescription: string;
  performanceId: string;
  seats: PerformanceSeatItem[];
}

export interface SeatCountResponse {
  statusCode: string;
  statusDescription: string;
  total: number;
}
