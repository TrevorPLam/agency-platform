import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    exclude: ['**/*.d.ts', '**/*.config.*', '**/dist/**', '**/node_modules/**'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/node_modules/**',
        '**/coverage/**',
        '**/*.stories.*',
        '**/*.spec.*',
        '**/test/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@agency/database': resolve(__dirname, 'packages/database/src'),
      '@agency/ui': resolve(__dirname, 'packages/ui/src'),
      '@agency/analytics': resolve(__dirname, 'packages/analytics/src'),
      '@agency/analytics/server': resolve(__dirname, 'packages/analytics/src/server.ts'),
      '@agency/booking': resolve(__dirname, 'packages/booking/src'),
      '@agency/email': resolve(__dirname, 'packages/email/src'),
      '@agency/design-tokens': resolve(__dirname, 'packages/design-tokens/src'),
      '@agency/security': resolve(__dirname, 'packages/security/src'),
      '@agency/governance': resolve(__dirname, 'packages/governance/src'),
      '@agency/metrics': resolve(__dirname, 'packages/metrics/src'),
      '@agency/monitoring': resolve(__dirname, 'packages/monitoring/src'),
      '@agency/artifacts': resolve(__dirname, 'packages/artifacts/src'),
      '@agency/knowledge': resolve(__dirname, 'packages/knowledge/src'),
      '@test/utils': resolve(__dirname, 'test/utils'),
      '@test/fixtures': resolve(__dirname, 'test/fixtures')
    }
  }
})
