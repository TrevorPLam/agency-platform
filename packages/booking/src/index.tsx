/**
 * @agency/booking — Embeddable booking widget and configuration.
 */

export type { BookingConfig } from './types/config'
export { bookingConfigSchema, type BookingConfigSchema } from './schema/config.schema'
export {
  BookingWidget,
  type BookingWidgetProps,
  type BookingSubmitAction,
} from './widget/booking-widget'
