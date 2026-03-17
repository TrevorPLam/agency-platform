import { describe, it, expect } from 'vitest'
import { 
  RedirectValidator, 
  defaultRedirectValidator, 
  validateRedirectUrl,
  redirectUrlSchema 
} from './redirect-validator'

describe('RedirectValidator', () => {
  describe('basic validation', () => {
    it('should reject null/undefined inputs', () => {
      const validator = new RedirectValidator()
      
      expect(validator.validate(null).valid).toBe(false)
      expect(validator.validate(undefined).valid).toBe(false)
    })

    it('should reject non-string inputs', () => {
      const validator = new RedirectValidator()
      
      expect(validator.validate(123).valid).toBe(false)
      expect(validator.validate({}).valid).toBe(false)
      expect(validator.validate([]).valid).toBe(false)
    })

    it('should reject empty strings', () => {
      const validator = new RedirectValidator()
      
      expect(validator.validate('').valid).toBe(false)
      expect(validator.validate('   ').valid).toBe(false)
    })
  })

  describe('relative URL validation', () => {
    it('should allow simple relative URLs', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/dashboard')
      expect(result.valid).toBe(true)
      expect(result.safeUrl).toBe('/dashboard')
    })

    it('should allow relative URLs with query parameters', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/dashboard?tab=settings')
      expect(result.valid).toBe(true)
      expect(result.safeUrl).toBe('/dashboard?tab=settings')
    })

    it('should allow relative URLs with hash fragments', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/dashboard#section')
      expect(result.valid).toBe(true)
      expect(result.safeUrl).toBe('/dashboard#section')
    })

    it('should allow root path', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/')
      expect(result.valid).toBe(true)
      expect(result.safeUrl).toBe('/')
    })

    it('should reject protocol-relative URLs', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('//evil.com/phishing')
      expect(result.valid).toBe(false)
      expect(result.safeUrl).toBe('/')
      expect(result.reason).toContain('Protocol-relative')
    })
  })

  describe('absolute URL rejection', () => {
    it('should reject HTTP URLs', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('http://evil.com')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Absolute URLs')
    })

    it('should reject HTTPS URLs', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('https://evil.com')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Absolute URLs')
    })

    it('should reject JavaScript URLs', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('javascript:alert(1)')
      expect(result.valid).toBe(false)
    })
  })

  describe('URL decoding bypass prevention', () => {
    it('should handle URL-encoded characters', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/dashboard%2Fsettings')
      expect(result.valid).toBe(true)
      expect(result.safeUrl).toBe('/dashboard/settings')
    })

    it('should prevent multiple encoding bypass attempts', () => {
      const validator = new RedirectValidator()
      
      // Double-encoded protocol-relative URL
      const result = validator.validate('%2F%2Fevil.com')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Protocol-relative')
    })

    it('should limit decode iterations', () => {
      const validator = new RedirectValidator({ maxDecodeIterations: 2 })
      
      // This would normally decode to //evil.com but should be limited
      const result = validator.validate('%252F%252Fevil.com')
      expect(result.valid).toBe(false)
    })
  })

  describe('suspicious pattern detection', () => {
    it('should reject directory traversal attempts', () => {
      const validator = new RedirectValidator()
      
      const result1 = validator.validate('/../admin')
      expect(result1.valid).toBe(false)
      
      const result2 = validator.validate('/%2e%2e/admin')
      expect(result2.valid).toBe(false)
    })

    it('should reject null bytes', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/dashboard\0malicious')
      expect(result.valid).toBe(false)
    })

    it('should reject newline characters', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/dashboard\r\nmalicious')
      expect(result.valid).toBe(false)
    })

    it('should reject script injection attempts', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/dashboard<script>alert(1)</script>')
      expect(result.valid).toBe(false)
    })
  })

  describe('dangerous scheme detection in paths', () => {
    it('should reject JavaScript scheme in path', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/javascript:alert(1)')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('scheme detected')
    })

    it('should reject data scheme in path', () => {
      const validator = new RedirectValidator()
      
      const result = validator.validate('/data:text/html,<script>alert(1)</script>')
      expect(result.valid).toBe(false)
    })
  })

  describe('configuration options', () => {
    it('should use custom default URL', () => {
      const validator = new RedirectValidator({ defaultUrl: '/safe-default' })
      
      const result = validator.validate('http://evil.com')
      expect(result.valid).toBe(false)
      expect(result.safeUrl).toBe('/safe-default')
    })

    it('should disallow relative URLs when configured', () => {
      const validator = new RedirectValidator({ allowRelative: false })
      
      const result = validator.validate('/dashboard')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Relative URLs not allowed')
    })
  })

  describe('real-world attack scenarios', () => {
    it('should prevent phishing attacks with external URLs', () => {
      const validator = new RedirectValidator()
      
      const attacks = [
        'https://your-bank.com.phishing.site.com',
        '//your-bank.com.phishing.site.com',
        'https://evil.com/redirect?to=real-bank.com',
      ]
      
      attacks.forEach(attack => {
        const result = validator.validate(attack)
        expect(result.valid).toBe(false)
        expect(result.safeUrl).toBe('/')
      })
    })

    it('should prevent protocol smuggling', () => {
      const validator = new RedirectValidator()
      
      const attacks = [
        '/\\evil.com',
        '/%5Cevil.com',
        '/%2f%2fevil.com',
      ]
      
      attacks.forEach(attack => {
        const result = validator.validate(attack)
        expect(result.valid).toBe(false)
      })
    })
  })
})

describe('defaultRedirectValidator', () => {
  it('should use default configuration', () => {
    const result = defaultRedirectValidator.validate('/dashboard')
    expect(result.valid).toBe(true)
    expect(result.safeUrl).toBe('/dashboard')
  })

  it('should default to "/" for invalid URLs', () => {
    const result = defaultRedirectValidator.validate('http://evil.com')
    expect(result.valid).toBe(false)
    expect(result.safeUrl).toBe('/')
  })
})

describe('validateRedirectUrl convenience function', () => {
  it('should return safe URL directly', () => {
    const result = validateRedirectUrl('/dashboard')
    expect(result).toBe('/dashboard')
  })

  it('should return default URL for invalid input', () => {
    const result = validateRedirectUrl('http://evil.com', '/safe')
    expect(result).toBe('/safe')
  })
})

describe('redirectUrlSchema', () => {
  it('should validate valid URLs', () => {
    const result = redirectUrlSchema.safeParse('/dashboard')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('/dashboard')
    }
  })

  it('should reject invalid URLs', () => {
    const result = redirectUrlSchema.safeParse('http://evil.com')
    expect(result.success).toBe(false)
  })
})

describe('edge cases', () => {
  it('should handle very long URLs', () => {
    const validator = new RedirectValidator()
    const longUrl = '/' + 'a'.repeat(10000)
    
    const result = validator.validate(longUrl)
    expect(result.valid).toBe(true)
    expect(result.safeUrl).toBe(longUrl)
  })

  it('should handle Unicode characters in paths', () => {
    const validator = new RedirectValidator()
    
    const result = validator.validate('/dashboard/设置')
    expect(result.valid).toBe(true)
    expect(result.safeUrl).toBe('/dashboard/设置')
  })

  it('should handle malformed URLs gracefully', () => {
    const validator = new RedirectValidator()
    
    const result = validator.validate('/dashboard[')
    expect(result.valid).toBe(false)
  })
})
