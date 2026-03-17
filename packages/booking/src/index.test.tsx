import { describe, expect, it } from 'vitest'
import * as booking from './index'

describe('booking public API', () => {
  it('exports the widget component and schema', () => {
    expect(booking.BookingWidget).toBeTypeOf('function')
    expect(booking.bookingConfigSchema).toBeDefined()
  })
})
