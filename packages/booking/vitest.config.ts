import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'], // Only include TS tests for now
    exclude: ['src/**/*.test.tsx', 'src/**/*.tsx'], // Exclude all JSX files
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.config.*', '**/dist/**', '**/node_modules/**', 'src/**/*.test.tsx', 'src/**/*.tsx'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
