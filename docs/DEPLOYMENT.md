# Vercel Deployment

This document covers the project-per-client deployment model, the Vercel Pro to Enterprise cost cliff at 9 clients, middleware routing as a cost mitigation, and operational steps for deploying agency platform apps to Vercel.

## Project-per-Client Model

Each client app has its own Vercel project: its own environment variables, deployment history, and rollback points. We use one project for `@agency/riley-day-care` (or `@agency/the-barber-cave`) and a separate project for `@agency/agency-admin`. Current client apps live under `apps/prospective-clients/`; production clients will use `apps/clients/`.

- **Isolation:** Client data and branding stay separate; no shared env values between Vercel projects. Each client has its own Supabase anon key scope and PostHog key.
- **Build:** Always run the build from the monorepo root via Turborepo so upstream packages are built first. Do not run `cd apps/prospective-clients/[slug] && next build` (or `apps/clients/[slug]` for production) from the app directory alone.

This is the recommended model for a solo developer and for the first 8–9 clients. Switch to the single-project middleware model (or negotiate Vercel Enterprise) when approaching the cost cliff below.

## Vercel Pro → Enterprise Cliff at 9 Clients

Vercel Pro charges **$250/month per project** above the first 2 included projects. That creates a sharp cost jump at client count 9:

| Clients | Calculation                              | Monthly total |
| ------- | ---------------------------------------- | ------------- |
| 8       | $60 seats + (6 × $250) = $1,500 projects | **$1,560**    |
| 9       | $60 seats + (7 × $250) = $1,750 projects | **$1,810**    |

Vercel’s **Enterprise minimum is $1,667/month**. At 9 clients your Pro bill ($1,810) already exceeds that. Every agency using one Vercel project per client is effectively on Enterprise pricing from client #9 onward, whether or not they have an Enterprise contract.

**Action:** Contact Vercel about an Enterprise agreement before you reach 9 clients, or migrate to the single-project middleware architecture described below.

## Middleware Routing as Cost Mitigation

**Single project with middleware routing** uses one Vercel project and a hostname-based `middleware.ts` to serve all tenants. Cost stays at about **3 seats × $20 = $60/month** regardless of client count. At 50 clients this saves roughly **$1,607/month** (~$19,284/year) compared to 50 separate Pro projects.

**Trade-offs:**

- Shared serverless function limits across all clients.
- No per-client deployment isolation; every push to `main` deploys all clients at once.
- No per-client rollback; you roll back the single deployment.

**When to switch:** Consider migrating when approaching 8–9 clients or when you are ready to negotiate an Enterprise contract. For a solo developer starting out, stay on project-per-client until the cliff is relevant.

### Middleware pattern (single-project model)

When you adopt the single-project model, use hostname-based rewriting so one deployment serves multiple domains. Tenant manifest example (at scale, replace the in-code map with a Redis or DB lookup):

```ts
// apps/agency-platform/src/middleware.ts (single-project model only)
import { NextRequest, NextResponse } from 'next/server'

const TENANT_ROUTES: Record<string, string> = {
  'rileydaycare.com': '/tenants/riley-day-care',
  'thebarbercave.com': '/tenants/the-barber-cave',
  // Add each client's domain here
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] ?? ''
  const tenantPath = TENANT_ROUTES[hostname]

  if (tenantPath) {
    return NextResponse.rewrite(new URL(`${tenantPath}${request.nextUrl.pathname}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

See the main Agency Platform Guide §14 for full context and the recommended app layout under this model.

## Operational Details

### Vercel project configuration (project-per-client)

For each app (`riley-day-care`, `the-barber-cave`, `agency-admin`), create a Vercel project linked to the monorepo and set:

| Setting              | Value                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root Directory**   | `apps/prospective-clients/riley-day-care` (or `the-barber-cave`) or `apps/agency-admin`                                                         |
| **Build Command**    | `cd ../../../ && pnpm turbo run build --filter=@agency/riley-day-care` (or `--filter=@agency/the-barber-cave`, `--filter=@agency/agency-admin`) |
| **Output Directory** | `apps/prospective-clients/riley-day-care/.next` (or same for `the-barber-cave`) or `apps/agency-admin/.next`                                    |
| **Install Command**  | `pnpm install`                                                                                                                                  |

### Environment variables per project

Add the variables from `.env.local.example` to each Vercel project. Each project must have its own values; never share env vars between projects. Required set:

- `NEXT_PUBLIC_TENANT_SLUG` — tenant slug for that app (e.g. `riley-day-care`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (or use the Inngest Vercel Marketplace integration to inject these)

### Turborepo remote cache

From the repository root:

```bash
turbo login
turbo link
```

Then set in each Vercel project and in GitHub Actions (for CI):

- `TURBO_TOKEN` — from Vercel → Settings → Tokens
- `TURBO_TEAM` — your Vercel team slug

With remote cache, unchanged packages show as cache hits in the build log and repeated builds are much faster.

### Optional: cache robustness and signing

- **VERCEL_REMOTE_CACHE_TIMEOUT=30** — Reduces the chance that cache lookup timeouts block builds; at high concurrency (e.g. many preview deploys), timeouts are a common cause of slow or failed builds.
- **TURBO_REMOTE_CACHE_SIGNATURE_KEY** — A secret you define to sign cache artifacts and limit risk of cache poisoning if the Turbo token were ever compromised.

Add these in Vercel project environment variables when you want stronger cache reliability and security.

## Inngest integration

Use the Inngest integration in the Vercel Marketplace so that `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY` are injected automatically. After deployment, confirm that `/api/inngest` is reachable and that the Inngest dashboard shows the app as connected.
