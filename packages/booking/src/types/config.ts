/**
 * Configuration types for the embeddable booking widget.
 * @agency/booking
 */

export interface BookingConfig {
  /** Tenant or client identifier for the booking context */
  tenantId: string
  /** Optional service type or category to preselect */
  serviceSlug?: string
  /** Optional minimum advance booking (hours) */
  minAdvanceHours?: number
  /** Optional maximum days ahead for booking */
  maxDaysAhead?: number
  /** Optional locale for date/time formatting */
  locale?: string
}
