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

export type TicketType = 'REGULAR' | 'GROUP' | 'LOYALTY';

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'EWALLET' | 'BANK_TRANSFER';

/** A seat chosen when creating a booking. */
export interface SeatSelection {
  seatId?: string;
  seatRef?: string;
  zoneName?: string;
  section?: string;
}

/** A seat as returned on a booking. */
export interface BookingSeatItem {
  seatId?: string;
  seatRef?: string;
  zoneName?: string;
  section?: string;
}

export interface PaymentDetails {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  cardHolderName?: string;
}

export interface BookingRequest {
  patronId?: string;
  performanceId?: string;
  seats?: SeatSelection[];
  ticketType?: TicketType;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
}

export interface BookingResponse {
  statusCode: string;
  statusDescription: string;
  bookingId: string;
  bookingRef: string;
  patronId?: string;
  performanceId?: string;
  productionName?: string;
  performanceDate?: string; // date
  performanceTime?: string; // time-local
  seats?: BookingSeatItem[];
  ticketType?: TicketType;
  totalLkr?: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  cardLast4?: string;
  createdAt?: string; // date-time
  qrCode?: string;
}

export interface BookingItem {
  bookingId: string;
  bookingRef: string;
  performanceId?: string;
  seats?: BookingSeatItem[];
  ticketType?: TicketType;
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

export interface PerformanceBookedSeatsResponse {
  statusCode: string;
  statusDescription: string;
  performanceId: string;
  bookedSeatIds?: string[];
  bookedSeatRefs?: string[];
}

// ── Admin dashboard aggregates ───────────────────────────────────────────────

/** One point in the per-month booking overview chart. */
export interface MonthlyBookingPoint {
  month?: string;
  label?: string;
  bookings?: number;
  revenue?: number;
}

/** GET /bookings/summary — aggregate totals + per-month overview. */
export interface BookingSummaryResponse {
  statusCode: string;
  statusDescription: string;
  totalBookings?: number;
  totalRevenue?: number;
  bookingOverview?: MonthlyBookingPoint[];
}

/** A row in the recent-bookings dashboard list. */
export interface RecentBookingItem {
  bookingId?: string;
  bookingRef?: string;
  patronId?: string;
  customerName?: string;
  performanceId?: string;
  showName?: string;
  performanceDate?: string;
  performanceTime?: string;
  totalLkr?: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
}

/** GET /bookings/recent — recent bookings across all patrons. */
export interface RecentBookingsResponse {
  statusCode: string;
  statusDescription: string;
  bookings?: RecentBookingItem[];
}
