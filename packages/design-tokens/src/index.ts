/**
 * Design Tokens Package
 * 
 * This package provides design tokens for the agency platform.
 * It uses Style Dictionary to generate CSS variables for different clients.
 * 
 * Main exports:
 * - Token utilities and helpers
 * - Style Dictionary configuration
 */

// Re-export Style Dictionary for advanced usage
export { default as StyleDictionary } from 'style-dictionary'

// Export token utilities
export const TOKEN_VERSION = '1.0.0'

// Export common token interfaces
export interface DesignToken {
  value: string | number
  type?: string
  description?: string
}

export interface ClientTokens {
  [key: string]: DesignToken
}
