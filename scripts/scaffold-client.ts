/**
 * Client scaffolding script — TASK-004.
 * Sources from apps/__template__ (industry-neutral).
 * Usage: pnpm scaffold
 * Or non-interactive: SCAFFOLD_SLUG=my-client SCAFFOLD_NAME="My Client" [SCAFFOLD_PROSPECTIVE=true] pnpm scaffold
 */
import { execSync } from 'child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  copyFileSync,
  statSync,
  writeFileSync,
} from 'fs'
import { join, dirname } from 'path'
import { createInterface } from 'readline'

const rl = createInterface({ input: process.stdin, output: process.stdout })

const ask = (question: string) =>
  new Promise<string>((resolve) => rl.question(question, resolve))

/** Slug must be kebab-case: lowercase letters/digits, single hyphens, no leading/trailing/consecutive hyphens */
const KEBAB_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

function validateSlug(slug: string): boolean {
  return KEBAB_REGEX.test(slug) && slug.length > 0
}

/**
 * Recursively copy a directory, applying token replacements to all file contents.
 */
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.css', '.md', '.txt', '.env', '.mdc',
  '.html', '.xml', '.yaml', '.yml',
])

function isTextFile(filePath: string): boolean {
  const lastDot = filePath.lastIndexOf('.')
  if (lastDot === -1) return false
  return TEXT_EXTENSIONS.has(filePath.slice(lastDot))
}

function applyTokens(content: string, slug: string, name: string, port: number): string {
  return content
    .replaceAll('TEMPLATE_SLUG', slug)
    .replaceAll('TEMPLATE_NAME', name)
    .replaceAll('TEMPLATE_PORT', String(port))
}

function copyDirRecursive(
  srcDir: string,
  destDir: string,
  slug: string,
  name: string,
  port: number
): void {
  mkdirSync(destDir, { recursive: true })

  for (const entry of readdirSync(srcDir)) {
    const srcPath = join(srcDir, entry)
    // Translate TEMPLATE_SLUG in directory/file names
    const destEntry = entry.replaceAll('TEMPLATE_SLUG', slug)
    const destPath = join(destDir, destEntry)

    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath, slug, name, port)
    } else {
      mkdirSync(dirname(destPath), { recursive: true })
      if (isTextFile(srcPath)) {
        const content = readFileSync(srcPath, 'utf-8')
        writeFileSync(destPath, applyTokens(content, slug, name, port), 'utf-8')
      } else {
        copyFileSync(srcPath, destPath)
      }
    }
  }
}

/**
 * Scan all app package.json files for existing dev ports.
 * Returns the next available port starting from 3002.
 */
function assignNextPort(root: string): number {
  const searchDirs = [
    join(root, 'apps', 'prospective-clients'),
    join(root, 'apps', 'clients'),
  ]

  const usedPorts = new Set<number>()

  for (const dir of searchDirs) {
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir)) {
      const pkgPath = join(dir, entry, 'package.json')
      if (!existsSync(pkgPath)) continue
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
          scripts?: Record<string, string>
        }
        const devScript = pkg.scripts?.dev ?? ''
        const match = devScript.match(/-p\s+(\d+)/)
        if (match) usedPorts.add(Number(match[1]))
      } catch {
        // ignore malformed package.json
      }
    }
  }

  // firm = 3000, agency-admin = 3001; client ports start at 3002
  let port = 3002
  while (usedPorts.has(port)) port++
  return port
}

/** Dry-run flag: set SCAFFOLD_DRY_RUN=true to log operations without writing files. */
const DRY_RUN =
  process.env.SCAFFOLD_DRY_RUN === 'true' || process.env.SCAFFOLD_DRY_RUN === '1'

async function main() {
  console.log('\n🏗  Agency Platform — Client Scaffolder\n')
  if (DRY_RUN) console.log('⚠️  DRY RUN — no files will be written\n')

  let name: string
  let slug: string
  let isProspective: boolean

  if (process.env.SCAFFOLD_SLUG) {
    name = process.env.SCAFFOLD_NAME ?? process.env.SCAFFOLD_SLUG
    slug = process.env.SCAFFOLD_SLUG.trim()
    isProspective =
      process.env.SCAFFOLD_PROSPECTIVE === 'true' || process.env.SCAFFOLD_PROSPECTIVE === '1'
  } else {
    name = await ask('Client display name (e.g. Acme Plumbing): ')
    slug = (await ask('Client slug (e.g. acme-plumbing): ')).trim()
    const prospectAnswer = (await ask('Prospective (demo) or real client? (p/r): '))
      .trim()
      .toLowerCase()
    isProspective = prospectAnswer === 'p' || prospectAnswer === 'prospective'
  }

  rl.close()

  if (!validateSlug(slug)) {
    console.error(
      '\n❌ Invalid slug. Use kebab-case only: lowercase letters, digits, single hyphens (e.g. acme-plumbing). No spaces or special characters.\n'
    )
    process.exit(1)
  }

  const root = process.cwd()
  const templateRoot = join(root, 'apps', '__template__')
  const appSubdir = isProspective ? 'prospective-clients' : 'clients'
  const appDir = join(root, 'apps', appSubdir, slug)
  const tokenDir = join(root, 'packages', 'design-tokens', 'tokens', 'clients')
  const templateTokenPath = join(tokenDir, '__template__.json')

  if (!existsSync(templateRoot)) {
    console.error(
      `\n❌ Template directory not found: apps/__template__/\n   This directory is the scaffold source. Ensure it exists before running this script.\n`
    )
    process.exit(1)
  }

  if (existsSync(appDir)) {
    console.error(
      `\n❌ Directory already exists: apps/${appSubdir}/${slug}. Aborting to avoid overwriting.\n`
    )
    process.exit(1)
  }

  const port = assignNextPort(root)

  console.log(`\nScaffolding @agency/${slug}`)
  console.log(`  Display name : ${name}`)
  console.log(`  Subdirectory : apps/${appSubdir}/${slug}`)
  console.log(`  Dev port     : ${port}`)
  console.log(`  Template     : apps/__template__\n`)

  if (DRY_RUN) {
    console.log('DRY RUN complete — no files were written.')
    return
  }

  // Recursively copy template with token replacement
  copyDirRecursive(templateRoot, appDir, slug, name, port)

  // Copy design token placeholder
  if (existsSync(templateTokenPath)) {
    writeFileSync(join(tokenDir, `${slug}.json`), readFileSync(templateTokenPath, 'utf-8'))
  }

  // Add new app to root tsconfig.json references
  const rootTsconfigPath = join(root, 'tsconfig.json')
  const rootTsconfig = JSON.parse(readFileSync(rootTsconfigPath, 'utf-8')) as {
    references?: Array<{ path: string }>
  }
  const refPath = `./apps/${appSubdir}/${slug}`
  if (!rootTsconfig.references) rootTsconfig.references = []
  if (!rootTsconfig.references.some((r) => r.path === refPath)) {
    rootTsconfig.references.push({ path: refPath })
    rootTsconfig.references.sort((a, b) => a.path.localeCompare(b.path))
    writeFileSync(rootTsconfigPath, JSON.stringify(rootTsconfig, null, 2))
  }

  console.log('Installing dependencies…')
  execSync('pnpm install', { cwd: root, stdio: 'pipe', encoding: 'utf-8' })

  console.log('Building design tokens…')
  execSync('pnpm tokens:build', { cwd: root, stdio: 'pipe', encoding: 'utf-8' })

  console.log('Running post-scaffold type-check…')
  try {
    execSync('pnpm exec tsc --noEmit', {
      cwd: appDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    console.log('✅ Type-check passed.')
  } catch (err) {
    const stderr =
      err && typeof err === 'object' && 'stderr' in err
        ? String((err as { stderr?: unknown }).stderr)
        : err instanceof Error
          ? err.message
          : String(err)
    console.error('\n❌ Post-scaffold type-check failed. Fix template or dependencies.\n')
    console.error(stderr)
    process.exit(1)
  }

  console.log(`\n✅ Scaffolded @agency/${slug} under apps/${appSubdir}/`)
  console.log('\nNext steps:')
  console.log(`  1. Edit packages/design-tokens/tokens/clients/${slug}.json with brand colours`)
  console.log(`  2. Run: pnpm tokens:build`)
  console.log(`  3. Add row to Supabase tenants table with slug "${slug}"`)
  console.log(`  4. Create Vercel project pointing to apps/${appSubdir}/${slug}`)
  console.log(`  5. Set environment variables (e.g. NEXT_PUBLIC_TENANT_SLUG=${slug})`)
}

main().catch(console.error)
