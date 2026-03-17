import { describe, expect, it } from 'vitest'
import { KNOWLEDGE_VERSION, KnowledgeAuditor, KnowledgeCaptureEngine } from './index'

describe('knowledge public API', () => {
  it('exports the semantic version', () => {
    expect(KNOWLEDGE_VERSION).toBe('1.0.0')
  })

  it('exports key classes', () => {
    expect(KnowledgeCaptureEngine).toBeTypeOf('function')
    expect(KnowledgeAuditor).toBeTypeOf('function')
  })
})
