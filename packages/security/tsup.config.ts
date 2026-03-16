import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    sbom: 'src/sbom/index.ts',
    integrity: 'src/integrity/index.ts',
    provenance: 'src/provenance/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['@agency/database'],
  sourcemap: true,
  minify: false,
})
