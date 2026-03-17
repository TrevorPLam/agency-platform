import { describe, expect, it } from 'vitest'
import { TOKEN_VERSION, StyleDictionary } from './index'

describe('design-tokens public API', () => {
  it('exposes package version constant', () => {
    expect(TOKEN_VERSION).toBe('1.0.0')
  })

  it('re-exports style dictionary constructor', () => {
    expect(StyleDictionary).toBeDefined()
  })
})
