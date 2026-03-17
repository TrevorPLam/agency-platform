import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSupabaseServerClient, createSupabaseBrowserClient } from './client'

describe('Database Client', () => {
  beforeEach(() => {
    // Set up test environment variables
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('createSupabaseServerClient', () => {
    it('should create server client with cookie store', () => {
      const mockCookieStore = {
        getAll: () => [{ name: 'session', value: 'abc123' }],
        setAll: () => {},
      }

      const client = createSupabaseServerClient(mockCookieStore)

      expect(client).toBeDefined()
      expect(typeof client.from).toBe('function')
      expect(typeof client.auth).toBe('object')
      expect(typeof client.storage).toBe('object')
    })

    it('should handle empty cookie store', () => {
      const mockCookieStore = {
        getAll: () => [],
        setAll: () => {},
      }

      const client = createSupabaseServerClient(mockCookieStore)

      expect(client).toBeDefined()
      expect(typeof client.from).toBe('function')
    })
  })

  describe('createSupabaseBrowserClient', () => {
    it('should throw error in non-browser environment', () => {
      // Test in Node.js environment (no window)
      expect(() => createSupabaseBrowserClient()).toThrow(
        'createSupabaseBrowserClient can only be called in browser environment'
      )
    })
  })

  describe('Client Interface', () => {
    it('should provide consistent client interface', () => {
      const mockCookieStore = {
        getAll: () => [],
        setAll: () => {},
      }

      const serverClient = createSupabaseServerClient(mockCookieStore)

      // Verify the client has expected Supabase methods
      expect(typeof serverClient.from).toBe('function')
      expect(typeof serverClient.auth).toBe('object')
      expect(typeof serverClient.storage).toBe('object')
      expect(typeof serverClient.realtime).toBe('object')
    })
  })
})
