import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    admin: 'src/admin.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  clean: true,
  external: ['@supabase/supabase-js', '@supabase/ssr'],
  splitting: false,
  sourcemap: true,
  minify: false,
})
