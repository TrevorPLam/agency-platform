import { describe, expect, it } from 'vitest'
import * as governance from './index'

describe('governance public API', () => {
  it('exports core validation helpers', () => {
    expect(governance).toBeDefined()
    expect(Object.keys(governance).length).toBeGreaterThan(0)
  })
})
