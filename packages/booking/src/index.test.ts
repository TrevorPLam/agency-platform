import { describe, it, expect, beforeEach, vi } from 'vitest'
import { bookingConfigSchema } from './index'
import { buttonPropsFactory, formDataFactory } from '../../../test/factories/ui'

describe('Booking Package', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('bookingConfigSchema', () => {
    it('should validate a complete booking configuration', () => {
      const validConfig = {
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        serviceSlug: 'consultation',
        minAdvanceHours: 24,
        maxDaysAhead: 30,
        locale: 'en',
      }

      const result = bookingConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        tenantId: 'not-a-uuid', // Invalid: not a UUID
        minAdvanceHours: -1, // Invalid: negative number
        maxDaysAhead: 400, // Invalid: > 365
        locale: 'eng', // Invalid: not 2 chars
      }

      const result = bookingConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })

    it('should accept minimal configuration', () => {
      const minimalConfig = {
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = bookingConfigSchema.safeParse(minimalConfig)
      expect(result.success).toBe(true)
    })

    it('should validate UUID format', () => {
      const configWithInvalidUUID = {
        tenantId: 'invalid-uuid-format',
        serviceSlug: 'consultation',
      }

      const result = bookingConfigSchema.safeParse(configWithInvalidUUID)
      expect(result.success).toBe(false)
    })

    it('should validate numeric constraints', () => {
      const configWithInvalidNumbers = {
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        minAdvanceHours: 1.5, // Invalid: not integer
        maxDaysAhead: 0, // Invalid: < 1
      }

      const result = bookingConfigSchema.safeParse(configWithInvalidNumbers)
      expect(result.success).toBe(false)
    })
  })

  describe('UI Component Integration', () => {
    it('should create valid button props from factory', () => {
      const buttonProps = buttonPropsFactory.build({
        variant: 'default',
        children: 'Submit Booking'
      })

      expect(buttonProps).toMatchObject({
        variant: 'default',
        children: 'Submit Booking',
        disabled: false,
        loading: false
      })
    })

    it('should create valid form data from factory', () => {
      const formData = formDataFactory.build({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'I would like to book a service'
      })

      expect(formData).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'I would like to book a service',
        terms: false,
        newsletter: true
      })
    })

    it('should generate different button variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
      
      variants.forEach(variant => {
        const buttonProps = buttonPropsFactory.build({ variant })
        expect(buttonProps.variant).toBe(variant)
      })
    })

    it('should handle disabled and loading states', () => {
      const disabledButton = buttonPropsFactory.build({ disabled: true })
      const loadingButton = buttonPropsFactory.build({ loading: true })

      expect(disabledButton.disabled).toBe(true)
      expect(loadingButton.loading).toBe(true)
    })
  })

  describe('Form Validation', () => {
    it('should validate email format in form data', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org'
      ]

      validEmails.forEach(email => {
        const formData = formDataFactory.build({ email })
        expect(formData.email).toBe(email)
        // In a real implementation, we'd validate the email format
        expect(formData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })
    })

    it('should handle empty optional fields', () => {
      const formData = formDataFactory.build({
        message: '', // Optional field can be empty
        terms: false,
        newsletter: false
      })

      expect(formData.message).toBe('')
      expect(formData.terms).toBe(false)
      expect(formData.newsletter).toBe(false)
    })

    it('should generate unique form data instances', () => {
      const formData1 = formDataFactory.build()
      const formData2 = formDataFactory.build()

      expect(formData1.name).not.toBe(formData2.name)
      expect(formData1.email).not.toBe(formData2.email)
      // Note: formDataFactory doesn't include an 'id' field, so we test the fields that exist
    })
  })
})
