import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    registry: 'src/registry.ts',
    promotion: 'src/promotion.ts',
    policies: 'src/policies.ts',
    retention: 'src/retention.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['@agency/database', '@agency/governance', '@agency/security', '@supabase/supabase-js'],
  splitting: false,
  sourcemap: true,
  minify: false,
});
