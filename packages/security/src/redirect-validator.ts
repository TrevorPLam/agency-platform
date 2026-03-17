import { z } from 'zod'

/**
 * Configuration options for redirect validation
 */
export interface RedirectValidatorOptions {
  /** Allow relative URLs (paths starting with '/') */
  allowRelative?: boolean
  /** Default URL to use when validation fails */
  defaultUrl?: string
  /** Maximum number of decode iterations to prevent bypass attempts */
  maxDecodeIterations?: number
}

/**
 * Validation result for redirect URLs
 */
export interface RedirectValidationResult {
  /** Whether the URL passed validation */
  valid: boolean
  /** The safe redirect URL (may be the default) */
  safeUrl: string
  /** Reason for validation failure (for logging) */
  reason?: string
}

/**
 * Comprehensive redirect URL validator for authentication flows
 * 
 * Prevents open-redirect vulnerabilities by implementing multiple layers of validation:
 * - Input validation and type checking
 * - Full URL decoding with iteration limits
 * - Protocol-relative URL blocking
 * - Dangerous scheme detection
 * - Relative path validation
 * - Safe default fallbacks
 */
export class RedirectValidator {
  private readonly options: Required<RedirectValidatorOptions>

  constructor(options: RedirectValidatorOptions = {}) {
    this.options = {
      allowRelative: options.allowRelative ?? true,
      defaultUrl: options.defaultUrl ?? '/',
      maxDecodeIterations: options.maxDecodeIterations ?? 10,
    }
  }

  /**
   * Validate a redirect URL according to security best practices
   * 
   * @param url - The URL to validate
   * @returns Validation result with safe URL
   */
  validate(url: unknown): RedirectValidationResult {
    // Step 1: Input validation
    if (!url || typeof url !== 'string') {
      return {
        valid: false,
        safeUrl: this.options.defaultUrl,
        reason: 'Invalid input type',
      }
    }

    // Step 2: Full URL decoding with iteration limits
    const decoded = this.fullyDecode(url.trim())
    
    // Step 3: Block protocol-relative URLs
    if (decoded.startsWith('//')) {
      return {
        valid: false,
        safeUrl: this.options.defaultUrl,
        reason: 'Protocol-relative URL not allowed',
      }
    }

    // Step 4: Handle relative URLs
    if (decoded.startsWith('/')) {
      return this.validateRelativeUrl(decoded)
    }

    // Step 5: Reject absolute URLs for auth flows
    return {
      valid: false,
      safeUrl: this.options.defaultUrl,
      reason: 'Absolute URLs not allowed in auth flows',
    }
  }

  /**
   * Validate a relative URL path
   */
  private validateRelativeUrl(path: string): RedirectValidationResult {
    if (!this.options.allowRelative) {
      return {
        valid: false,
        safeUrl: this.options.defaultUrl,
        reason: 'Relative URLs not allowed',
      }
    }

    // Ensure it's truly relative (no double slashes after decoding)
    if (path.startsWith('//')) {
      return {
        valid: false,
        safeUrl: this.options.defaultUrl,
        reason: 'Protocol-relative URL detected after decoding',
      }
    }

    // Block dangerous schemes hidden in paths
    if (/^\/[a-z]+:/i.test(path)) {
      return {
        valid: false,
        safeUrl: this.options.defaultUrl,
        reason: 'Dangerous scheme detected in path',
      }
    }

    // Validate path structure
    try {
      // Use the path directly without URL parsing to preserve Unicode characters
      // Just validate it doesn't contain suspicious patterns
      if (this.hasSuspiciousPatterns(path)) {
        return {
          valid: false,
          safeUrl: this.options.defaultUrl,
          reason: 'Suspicious path pattern detected',
        }
      }

      // Extract pathname, query, and hash manually to preserve Unicode
      const questionMarkIndex = path.indexOf('?')
      const hashIndex = path.indexOf('#')
      
      let pathname = path
      let search = ''
      let hash = ''
      
      if (hashIndex > -1) {
        pathname = path.substring(0, hashIndex)
        hash = path.substring(hashIndex)
      } else if (questionMarkIndex > -1) {
        pathname = path.substring(0, questionMarkIndex)
        search = path.substring(questionMarkIndex)
      }
      
      // Validate just the pathname part
      if (this.hasSuspiciousPatterns(pathname)) {
        return {
          valid: false,
          safeUrl: this.options.defaultUrl,
          reason: 'Suspicious path pattern detected',
        }
      }

      // Return the original path to preserve Unicode characters
      return {
        valid: true,
        safeUrl: path,
      }
    } catch (error) {
      return {
        valid: false,
        safeUrl: this.options.defaultUrl,
        reason: 'Invalid URL structure',
      }
    }
  }

  /**
   * Fully decode a URL string with iteration limits to prevent bypass attempts
   */
  private fullyDecode(url: string): string {
    let decoded = url
    let previous = ''
    let iterations = 0

    while (decoded !== previous && iterations < this.options.maxDecodeIterations) {
      previous = decoded
      try {
        decoded = decodeURIComponent(decoded)
      } catch (error) {
        // Invalid encoding, stop decoding
        break
      }
      iterations++
    }

    return decoded
  }

  /**
   * Check for suspicious patterns in URL paths
   */
  private hasSuspiciousPatterns(pathname: string): boolean {
    const suspiciousPatterns = [
      /\.\.\//,  // Directory traversal
      /%2e%2e\//i,  // URL-encoded directory traversal
      /\/\.\./,  // Traversal at end
      /\/%2e%2e/i,  // URL-encoded traversal at end
      /\0/,  // Null bytes
      /[\r\n]/,  // Newline characters
      /<script/i,  // Script injection attempts
      /javascript:/i,  // JavaScript protocol
      /data:/i,  // Data protocol
      /vbscript:/i,  // VBScript protocol
      /[\[\]]/,  // Brackets that can cause URL parsing issues
      /\\/,  // Backslashes for protocol smuggling
      /%5c/i,  // URL-encoded backslashes
      /%2f%2f/i,  // Double-encoded forward slashes (protocol smuggling)
    ]

    return suspiciousPatterns.some(pattern => pattern.test(pathname))
  }
}

/**
 * Zod schema for redirect URL validation
 */
export const redirectUrlSchema = z.string().transform((url, ctx) => {
  const validator = new RedirectValidator()
  const result = validator.validate(url)
  
  if (!result.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid redirect URL: ${result.reason}`,
    })
  }
  
  return result.safeUrl
})

/**
 * Default validator instance for common use cases
 */
export const defaultRedirectValidator = new RedirectValidator({
  allowRelative: true,
  defaultUrl: '/',
})

/**
 * Convenience function for quick redirect validation
 */
export function validateRedirectUrl(url: unknown, defaultUrl?: string): string {
  const validator = new RedirectValidator({ defaultUrl })
  const result = validator.validate(url)
  return result.safeUrl
}
