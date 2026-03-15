import { describe, it, expect } from 'vitest'
import { generateTenantSpecificEmail, extractOriginalEmail } from './auth'

describe('generateTenantSpecificEmail', () => {
  it('applies +tenant-{id} to local part', () => {
    expect(generateTenantSpecificEmail('user@example.com', 'tenant-123')).toBe(
      'user+tenant-tenant-123@example.com'
    )
  })

  it('preserves domain', () => {
    expect(generateTenantSpecificEmail('a@b.co', 't1')).toBe('a+tenant-t1@b.co')
  })
})

describe('extractOriginalEmail', () => {
  it('strips +tenant-xxx suffix', () => {
    expect(extractOriginalEmail('user+tenant-tenant-123@example.com')).toBe('user@example.com')
  })

  it('returns unchanged email when no suffix', () => {
    expect(extractOriginalEmail('user@example.com')).toBe('user@example.com')
  })
})
