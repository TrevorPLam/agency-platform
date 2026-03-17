import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges classes and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4', 'font-bold')).toBe('px-4 font-bold')
  })
})
