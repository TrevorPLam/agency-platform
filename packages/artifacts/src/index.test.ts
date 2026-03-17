import { describe, expect, it } from 'vitest'
import * as artifacts from './index'

describe('artifacts public API', () => {
  it('exports registry and policy services', () => {
    expect(artifacts.ArtifactRegistry).toBeTypeOf('function')
    expect(artifacts.ArtifactPromotion).toBeTypeOf('function')
    expect(artifacts.PolicyManager).toBeTypeOf('function')
    expect(artifacts.RetentionManager).toBeTypeOf('function')
  })
})
