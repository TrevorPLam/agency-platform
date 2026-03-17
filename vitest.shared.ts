import { defineConfig } from 'vitest/config'

export const createStrictCoverageConfig = (include: string[]) =>
  defineConfig({
    test: {
      globals: true,
      environment: 'node',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        reportsDirectory: './coverage',
        include,
        exclude: ['**/*.d.ts', '**/*.config.*', '**/dist/**', '**/node_modules/**'],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  })
