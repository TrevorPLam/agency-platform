/**
 * @agency/booking — Embeddable booking widget and configuration.
 */

export type { BookingConfig } from './types/config'
export { bookingConfigSchema, type BookingConfigSchema } from './schema/config.schema'

// Note: BookingWidget is exported from index.tsx to avoid JSX parsing in tests
// Import BookingWidget separately: import { BookingWidget } from '@agency/booking/widget'
