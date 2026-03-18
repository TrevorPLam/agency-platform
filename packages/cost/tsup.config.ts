import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    monitoring: 'src/monitoring.ts',
    optimization: 'src/optimization.ts',
    budget: 'src/budget.ts'
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@agency/*'],
  sourcemap: true,
  minify: false,
  target: 'es2020'
})
