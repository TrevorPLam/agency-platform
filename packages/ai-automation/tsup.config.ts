import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'automation/index': 'src/automation/index.ts',
    'cicd/index': 'src/cicd/index.ts', 
    'review/index': 'src/review/index.ts',
    'orchestration/index': 'src/orchestration/index.ts'
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@agency/database', '@agency/governance', '@agency/security']
})
