// ─────────────────────────────────────────────────────────────────────────────
// Booking Service API models (mirrors the OpenAPI spec at /v3/api-docs).
// Creation, lookup and cancellation of theatre bookings.
// ─────────────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED_PATRON'
  | 'CANCELLED_ADMIN'
  | 'EXPIRED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';

export type ConcessionType = 'UNDER_16' | 'OVER_70' | 'LARGE_PARTY';

export interface BookingLineRequest {
  perfSeatId?: string;
  seatRef?: string;
  zoneName?: string;
  sessionType?: string;
  concessionType?: ConcessionType;
  nicPassport?: string;
  basePriceLkr?: number;
  concessionDiscLkr?: number;
  loyaltyDiscLkr?: number;
  vatLkr?: number;
  finalPriceLkr?: number;
}

export interface BookingRequest {
  patronId?: string;
  guestEmail?: string;
  performanceId?: string;
  paymentToken?: string;
  lines?: BookingLineRequest[];
}

export interface BookingLineItem {
  lineId: string;
  perfSeatId?: string;
  seatRef?: string;
  zoneName?: string;
  sessionType?: string;
  concessionType?: ConcessionType;
  basePriceLkr?: number;
  concessionDiscLkr?: number;
  loyaltyDiscLkr?: number;
  vatLkr?: number;
  finalPriceLkr?: number;
}

export interface BookingResponse {
  statusCode: string;
  statusDescription: string;
  bookingId: string;
  bookingRef: string;
  patronId?: string;
  guestEmail?: string;
  performanceId?: string;
  status?: BookingStatus;
  isFlagged?: boolean;
  subtotalLkr?: number;
  discountLkr?: number;
  vatLkr?: number;
  totalLkr?: number;
  paymentToken?: string;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
  lines?: BookingLineItem[];
}

export interface BookingItem {
  bookingId: string;
  bookingRef: string;
  performanceId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  totalLkr?: number;
  createdAt?: string;
}

export interface BookingListResponse {
  statusCode: string;
  statusDescription: string;
  bookings: BookingItem[];
}
