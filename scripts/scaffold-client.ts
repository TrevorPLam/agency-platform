/**
 * Client scaffolding script (T-19). Run with: pnpm scaffold
 * Uses apps/clients/riverside-hotel as the exact template.
 */
import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createInterface } from 'readline'

const rl = createInterface({ input: process.stdin, output: process.stdout })

const ask = (question: string) =>
  new Promise<string>((resolve) => rl.question(question, resolve))

/** Slug must be kebab-case: lowercase letters/digits, single hyphens, no leading/trailing/consecutive hyphens */
const KEBAB_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

function validateSlug(slug: string): boolean {
  return KEBAB_REGEX.test(slug) && slug.length > 0
}

function readTemplate(root: string, ...pathSegments: string[]): string {
  const filePath = join(root, ...pathSegments)
  if (!existsSync(filePath)) {
    throw new Error(`Template missing: ${filePath}`)
  }
  return readFileSync(filePath, 'utf-8')
}

async function main() {
  console.log('\n🏗  Agency Platform — Client Scaffolder\n')

  let name: string
  let slug: string
  let industry: string
  let domain: string

  if (process.env.SCAFFOLD_SLUG) {
    name = process.env.SCAFFOLD_NAME ?? process.env.SCAFFOLD_SLUG
    slug = process.env.SCAFFOLD_SLUG.trim()
    industry = process.env.SCAFFOLD_INDUSTRY ?? 'general'
    domain = process.env.SCAFFOLD_DOMAIN ?? ''
  } else {
    name = await ask('Client display name (e.g. Riverside Hotel): ')
    slug = (await ask('Client slug (e.g. riverside-hotel): ')).trim()
    industry = await ask('Industry (healthcare/ecommerce/hospitality/general): ')
    domain = await ask('Production domain (e.g. riverside-hotel.com): ')
  }

  if (!validateSlug(slug)) {
    console.error(
      '\n❌ Invalid slug. Use kebab-case only: lowercase letters, digits, single hyphens (e.g. acme-health). No spaces or special characters.\n'
    )
    process.exit(1)
  }

  const root = process.cwd()
  const appDir = join(root, 'apps', 'clients', slug)
  const tokenDir = join(root, 'packages', 'design-tokens', 'tokens', 'clients')
  const templateRoot = join(root, 'apps', 'clients', 'riverside-hotel')

  if (existsSync(appDir)) {
    console.error(`\n❌ Directory already exists: apps/clients/${slug}. Aborting to avoid overwriting.\n`)
    process.exit(1)
  }

  rl.close()

  mkdirSync(join(appDir, 'src', 'app'), { recursive: true })
  mkdirSync(join(appDir, 'src', 'components'), { recursive: true })
  mkdirSync(join(appDir, 'tokens'), { recursive: true })

  const packageJson = JSON.parse(readTemplate(templateRoot, 'package.json'))
  packageJson.name = `@agency/${slug}`
  writeFileSync(join(appDir, 'package.json'), JSON.stringify(packageJson, null, 2))

  writeFileSync(
    join(appDir, 'tsconfig.json'),
    readTemplate(templateRoot, 'tsconfig.json')
  )
  writeFileSync(
    join(appDir, 'next.config.ts'),
    readTemplate(templateRoot, 'next.config.ts')
  )
  writeFileSync(
    join(appDir, 'postcss.config.mjs'),
    readTemplate(templateRoot, 'postcss.config.mjs')
  )
  writeFileSync(
    join(appDir, 'eslint.config.mjs'),
    readTemplate(templateRoot, 'eslint.config.mjs')
  )

  const globalsCss = readTemplate(templateRoot, 'src', 'app', 'globals.css')
    .replace(/riverside-hotel\.css/, `${slug}.css`)
  writeFileSync(join(appDir, 'src', 'app', 'globals.css'), globalsCss)

  const layoutContent = readTemplate(templateRoot, 'src', 'app', 'layout.tsx')
    .replace(/Riverside Hotel/g, name.replace(/'/g, "\\'"))
    .replace(/Luxury hospitality experience/g, `${name} — client portal`.replace(/'/g, "\\'"))
  writeFileSync(join(appDir, 'src', 'app', 'layout.tsx'), layoutContent)

  const safeName = name.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const pageContent = readTemplate(templateRoot, 'src', 'app', 'page.tsx')
    .replace(/Riverside Hotel/g, safeName)
    .replace(/Experience luxury hospitality at its finest/g, 'Your experience starts here')
  writeFileSync(join(appDir, 'src', 'app', 'page.tsx'), pageContent)

  writeFileSync(
    join(appDir, 'src', 'middleware.ts'),
    readTemplate(templateRoot, 'src', 'middleware.ts')
  )

  const providersContent = readTemplate(templateRoot, 'src', 'components', 'providers.tsx')
    .replace(/riverside-hotel/g, slug)
  writeFileSync(join(appDir, 'src', 'components', 'providers.tsx'), providersContent)

  writeFileSync(
    join(appDir, 'src', 'components', 'auth-analytics.tsx'),
    readTemplate(templateRoot, 'src', 'components', 'auth-analytics.tsx')
  )

  const riverToken = JSON.parse(
    readTemplate(root, 'packages', 'design-tokens', 'tokens', 'clients', 'riverside-hotel.json')
  )
  const placeholderTokens = {
    ...riverToken,
    brand: {
      primary: { $type: 'color', $value: '#000000' },
      secondary: { $type: 'color', $value: '#666666' },
      accent: { $type: 'color', $value: '#000000' },
    },
    color: {
      ...riverToken.color,
      semantic: {
        ...riverToken.color.semantic,
        background: {
          primary: { $type: 'color', $value: '{brand.primary}' },
          secondary: { $type: 'color', $value: 'oklch(0.98 0.02 198.41)' },
          accent: { $type: 'color', $value: '{brand.accent}' },
        },
        text: {
          primary: { $type: 'color', $value: 'oklch(0.15 0.02 198.41)' },
          secondary: { $type: 'color', $value: 'oklch(0.89 0.02 198.41)' },
          inverse: { $type: 'color', $value: 'oklch(0.15 0.02 198.41)' },
          accent: { $type: 'color', $value: '{brand.accent}' },
        },
        interactive: {
          primary: {
            default: { $type: 'color', $value: '{brand.primary}' },
            hover: { $type: 'color', $value: 'oklch(0.25 0.02 198.41)' },
            active: { $type: 'color', $value: 'oklch(0.20 0.02 198.41)' },
            disabled: { $type: 'color', $value: 'oklch(0.89 0.02 198.41)' },
          },
        },
      },
    },
  }
  writeFileSync(
    join(tokenDir, `${slug}.json`),
    JSON.stringify(placeholderTokens, null, 2)
  )

  execSync('pnpm install', { cwd: root, stdio: 'pipe', encoding: 'utf-8' })

  execSync('pnpm tokens:build', { cwd: root, stdio: 'pipe', encoding: 'utf-8' })

  try {
    execSync('pnpm exec tsc --noEmit', {
      cwd: appDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stderr = err && typeof err === 'object' && 'stderr' in err ? String((err as { stderr?: unknown }).stderr) : ''
    console.error('\n❌ Post-scaffold type-check failed. Fix template or dependencies.\n')
    if (stderr) console.error(stderr)
    else console.error(msg)
    process.exit(1)
  }

  console.log(`\n✅ Scaffolded @agency/${slug}`)
  console.log('\nNext steps:')
  console.log(`  1. Edit packages/design-tokens/tokens/clients/${slug}.json with brand colours`)
  console.log(`  2. Run: pnpm tokens:build`)
  console.log(`  3. Add row to Supabase tenants table with slug "${slug}"`)
  console.log(`  4. Create Vercel project pointing to apps/clients/${slug}`)
  console.log(`  5. Set environment variables (e.g. NEXT_PUBLIC_TENANT_SLUG=${slug})`)
}

main().catch(console.error)
