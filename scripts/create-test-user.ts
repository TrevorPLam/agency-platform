/**
 * T-15.05: Create a test admin user for riverside-hotel.
 * Uses createUserForTenant from @agency/database (sets app_metadata.tenant_id and customer_auth_mappings).
 *
 * Run from repo root with Supabase env vars set (e.g. from apps/clients/riverside-hotel/.env.local):
 *   pnpm exec tsx scripts/create-test-user.ts
 *
 * Or: cd apps/clients/riverside-hotel && pnpm exec dotenv -e .env.local -- tsx ../../scripts/create-test-user.ts
 * (if dotenv-cli is available)
 */
import { getAdminClient } from '@agency/database/admin'
import { createUserForTenant } from '@agency/database'

const TENANT_SLUG = 'riverside-hotel'
const DEFAULT_EMAIL = 'admin@riverside-hotel.example'
const DEFAULT_PASSWORD = 'TestPassword123!'

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. from apps/clients/riverside-hotel/.env.local)')
    process.exit(1)
  }

  const admin = getAdminClient()
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single()

  if (tenantError || !tenant) {
    console.error('Tenant not found:', TENANT_SLUG, tenantError?.message)
    process.exit(1)
  }

  const email = process.argv[2] ?? DEFAULT_EMAIL
  const password = process.argv[3] ?? DEFAULT_PASSWORD

  try {
    const result = await createUserForTenant({
      email,
      password,
      tenantId: tenant.id,
      emailConfirm: true,
    })
    console.log('Test user created:')
    console.log('  User ID:', result.user.id)
    console.log('  Display email:', result.user.email)
    console.log('  Tenant ID (app_metadata):', result.user.tenantId)
    console.log('  Log in at riverside-hotel with email:', email, 'and your password.')
  } catch (err) {
    console.error('Failed to create user:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
