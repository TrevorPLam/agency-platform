import { z } from 'zod'

/**
 * Zod schema for validating booking widget configuration.
 * @agency/booking
 */
export const bookingConfigSchema = z.object({
  tenantId: z.string().uuid(),
  serviceSlug: z.string().optional(),
  minAdvanceHours: z.number().int().min(0).optional(),
  maxDaysAhead: z.number().int().min(1).max(365).optional(),
  locale: z.string().length(2).optional(),
})

export type BookingConfigSchema = z.infer<typeof bookingConfigSchema>
