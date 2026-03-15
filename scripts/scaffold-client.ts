/**
 * Client scaffolding script (GUIDE §5).
 * Run with: pnpm scaffold
 * Prompts for name, slug, industry, domain; creates app dir, package.json, tsconfig, next.config, token file.
 */
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createInterface } from 'readline'

const rl = createInterface({ input: process.stdin, output: process.stdout })

const ask = (question: string) =>
  new Promise<string>((resolve) => rl.question(question, resolve))

async function main() {
  console.log('\n🏗  Agency Platform — Client Scaffolder\n')

  const name = await ask('Client display name (e.g. Riverside Hotel): ')
  const slug = await ask('Client slug (e.g. riverside-hotel): ')
  const industry = await ask('Industry (healthcare/ecommerce/hospitality/general): ')
  const domain = await ask('Production domain (e.g. riverside-hotel.com): ')

  rl.close()

  const root = process.cwd()
  const appDir = join(root, 'apps', 'clients', slug)
  const tokenDir = join(root, 'packages', 'design-tokens', 'tokens', 'clients')

  mkdirSync(join(appDir, 'src', 'app'), { recursive: true })
  mkdirSync(join(appDir, 'src', 'components'), { recursive: true })
  mkdirSync(join(appDir, 'tokens'), { recursive: true })

  writeFileSync(
    join(appDir, 'package.json'),
    JSON.stringify(
      {
        name: `@agency/${slug}`,
        version: '0.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'eslint . --max-warnings 0',
          'type-check': 'tsc --noEmit',
        },
        dependencies: {
          '@agency/ui': 'workspace:*',
          '@agency/database': 'workspace:*',
          '@agency/analytics': 'workspace:*',
          next: 'catalog:',
          react: 'catalog:',
          'react-dom': 'catalog:',
        },
        devDependencies: {
          '@agency/eslint-config': 'workspace:*',
          '@agency/typescript-config': 'workspace:*',
          '@types/node': 'catalog:',
          '@types/react': 'catalog:',
          '@types/react-dom': 'catalog:',
          eslint: 'catalog:',
          typescript: 'catalog:',
          '@tailwindcss/postcss': 'catalog:',
          postcss: 'catalog:',
          tailwindcss: 'catalog:',
          'tw-animate-css': 'catalog:',
        },
      },
      null,
      2
    )
  )

  writeFileSync(
    join(appDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '@agency/typescript-config/nextjs.json',
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules'],
      },
      null,
      2
    )
  )

  writeFileSync(
    join(appDir, 'next.config.ts'),
    `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@agency/ui', '@agency/database', '@agency/analytics'],
}

export default nextConfig
`
  )

  writeFileSync(
    join(appDir, 'eslint.config.mjs'),
    `import agencyFlat from '@agency/eslint-config/flat';

const config = [...agencyFlat];
export default config;
`
  )

  writeFileSync(
    join(appDir, 'postcss.config.mjs'),
    `const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
`
  )

  writeFileSync(
    join(appDir, 'src', 'app', 'globals.css'),
    `@import 'tailwindcss';

@theme inline {
  --font-sans: "Inter", system-ui, sans-serif;
}
`
  )

  writeFileSync(
    join(appDir, 'src', 'app', 'layout.tsx'),
    `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${name.replace(/'/g, "\\'")}',
  description: '${name.replace(/'/g, "\\'")}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
  )

  writeFileSync(
    join(appDir, 'src', 'app', 'page.tsx'),
    `export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">${name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
    </div>
  )
}
`
  )

  writeFileSync(
    join(tokenDir, `${slug}.json`),
    JSON.stringify(
      {
        brand: {
          primary: { $type: 'color', $value: '#000000' },
          secondary: { $type: 'color', $value: '#666666' },
          accent: { $type: 'color', $value: '#2563eb' },
        },
        font: {
          primary: { $type: 'fontFamily', $value: ['Inter', 'system-ui', 'sans-serif'] },
          secondary: { $type: 'fontFamily', $value: ['Georgia', 'serif'] },
          mono: { $type: 'fontFamily', $value: ['Consolas', 'monospace'] },
        },
        color: {
          semantic: {
            background: {
              primary: { $type: 'color', $value: '{brand.primary}' },
              secondary: { $type: 'color', $value: '#f9fafb' },
              accent: { $type: 'color', $value: '{brand.accent}' },
            },
            text: {
              primary: { $type: 'color', $value: '#1a1a1a' },
              secondary: { $type: 'color', $value: '#6b7280' },
              inverse: { $type: 'color', $value: '#ffffff' },
              accent: { $type: 'color', $value: '{brand.accent}' },
            },
            interactive: {
              primary: {
                default: { $type: 'color', $value: '{brand.primary}' },
                hover: { $type: 'color', $value: '#333333' },
                active: { $type: 'color', $value: '#000000' },
                disabled: { $type: 'color', $value: '#9ca3af' },
              },
            },
          },
        },
      },
      null,
      2
    )
  )

  console.log(`\n✅ Scaffolded @agency/${slug}`)
  console.log(`\nNext steps:`)
  console.log(`  1. Edit packages/design-tokens/tokens/clients/${slug}.json with brand colours`)
  console.log(`  2. Run: pnpm tokens:build`)
  console.log(`  3. Add row to Supabase tenants table with slug "${slug}"`)
  console.log(`  4. Create Vercel project pointing to apps/clients/${slug}`)
}

main().catch(console.error)
