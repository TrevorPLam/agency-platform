# Client Onboarding Guide

Complete guide for onboarding new clients to the agency platform. Covers the end-to-end process from scaffolding to deployment, with templates, checklists, and strategic context.

---

## Overview

The agency platform supports two types of clients:
- **Prospective clients** (`apps/prospective-clients/`) - Demo/test sites for validation
- **Production clients** (`apps/clients/`) - Live client sites (empty until first go-live)

The current template is **Riley Day Care** at `apps/prospective-clients/riley-day-care`, which serves as the reference implementation for day-care-style clients.

---

## Quick Start: Scaffold New Client

### Automated Scaffolding

From the repo root, run the interactive scaffold:

```bash
pnpm scaffold
```

**When prompted, provide:**
- **Client display name**: e.g. "Sunshine Day Care"
- **Client slug**: e.g. `sunshine-day-care` (kebab-case)
- **Industry**: e.g. `general` or a future "daycare" option
- **Production domain**: e.g. `sunshinedaycare.com`
- **Client type**: `p` for prospective (demo) or `r` for real (production)

### What the Scaffold Does

1. **Creates the app** under the appropriate directory:
   - `apps/prospective-clients/[slug]/` for demo clients
   - `apps/clients/[slug]/` for production clients
2. **Copies from template** (`apps/prospective-clients/riley-day-care/`)
3. **Substitutes slug and name** in `package.json`, layout, and token references
4. **Creates token stub** in `packages/design-tokens/tokens/clients/[slug].json`
5. **Updates references** in root `tsconfig.json`
6. **Runs dependencies** and builds tokens

### Post-Scaffold Steps

1. **Design tokens**: Edit `packages/design-tokens/tokens/clients/[slug].json` with a distinct brand palette
2. **Build tokens**: `pnpm tokens:build`
3. **Database tenant**: Add tenant row to `tenants` table
4. **Admin user**: Create admin user for the tenant
5. **Deployment**: Set up Vercel project and environment variables

---

## Complete Onboarding Checklist

### Phase 1: Technical Setup (Agent Steps)

#### 1.1 Scaffold the App
```bash
pnpm scaffold
```
- Choose prospective (demo) or real (production)
- Enter display name, slug (kebab-case), industry, domain
- Script creates app skeleton, token file, and tokens output directory

#### 1.2 Design Tokens (Distinct Branding)
- Edit `packages/design-tokens/tokens/clients/[slug].json`
- Use visually distinct palette from existing clients
- Include brand colors, typography, spacing tokens
- Build client tokens:
```bash
pnpm tokens:build
```

#### 1.3 HIPAA Isolation (Documentation)
- **Prospective/demo clients**: Share platform for validation only; no PHI
- **Healthcare clients with PHI**: Require dedicated Supabase project and BAA before go-live

#### 1.4 Tenant Row in Database
Add to `supabase/seed.sql`:
```sql
INSERT INTO public.tenants (slug, domain, name, industry)
VALUES ('your-slug', 'yourdomain.com', 'Your Client Name', 'general')
ON CONFLICT (slug) DO NOTHING;
```
Then run `npx supabase db reset`.

#### 1.5 Admin User for Tenant
```bash
TENANT_SLUG=the-barber-cave pnpm exec tsx scripts/create-test-user.ts
# Optional: custom email/password
TENANT_SLUG=the-barber-cave pnpm exec tsx scripts/create-test-user.ts admin@thebarbercave.com YourPassword123!
```

#### 1.6 RLS Tests (Two Tenants)
```bash
npx supabase test db
```
All tests must pass with both tenants in seed data.

#### 1.7 Affected Build
```bash
pnpm turbo run build --affected
```
Only new app and changed packages should rebuild.

### Phase 2: Deployment (Human Steps)

#### 2.1 Vercel Project Setup
- Create Vercel project for the new app
- **Root Directory**: `apps/prospective-clients/[slug]` or `apps/clients/[slug]`
- **Build Command**: `pnpm turbo run build --filter=@agency/[slug]`
- **Environment Variables**: Set all from `.env.local.example`

#### 2.2 Domain Configuration
- Add custom domain (optional)
- Configure DNS records
- Set up SSL certificates

#### 2.3 Cross-Tenant Isolation Test
- Log in as different tenant users in separate browsers
- Verify neither can see the other's data

#### 2.4 Timing and Bottlenecks
- Record wall-clock time for full onboarding
- Target: under 2 hours
- Document any bottlenecks for future optimization

---

## Template Structure: Riley Day Care

### Current Template Features

The Riley Day Care template (`apps/prospective-clients/riley-day-care/`) includes:

#### Pages
- **Home** - Landing page with hero section
- **About** - Company information
- **Programs** - Service offerings
- **Contact** - Contact form with email integration
- **Blog** - List and detail pages
- **Auth** - Login, signup, callback, dashboard (protected)

#### Technical Features
- **Authentication**: Full auth flow with tenant resolution
- **Middleware**: Tenant resolution and auth redirects
- **Design Tokens**: Client-specific CSS integration
- **Analytics**: PostHog integration with tenant tracking
- **Forms**: Contact form with server actions
- **Database**: RLS-protected data access

#### Design System Integration
- **Tokens**: `packages/design-tokens/tokens/clients/riley-day-care.json`
- **CSS**: Imports from `tokens/riley-day-care.css`
- **Components**: Uses `@agency/ui` components
- **Styling**: Token-based classes, no hardcoded values

### Using the Template

#### For Day Care Clients
The Riley Day Care template is optimized for:
- Childcare centers
- Early education programs
- Activity-based services
- Parent communication tools

#### For Other Industries
Use the template as a foundation:
1. Scaffold with the template
2. Customize content and branding
3. Adapt components to industry needs
4. Update design tokens for brand alignment

---

## Strategic Context

### Platform Architecture

The agency platform uses a **multi-tenant monorepo** architecture:

#### Isolation Layers
1. **Code boundary** - pnpm workspaces prevent app-to-app imports
2. **Database** - RLS enforces tenant data isolation
3. **Cache** - Tenant-prefixed keys prevent cross-tenant leakage
4. **CI/CD** - Affected builds and RLS tests ensure safety
5. **Deployment** - One Vercel project per app with isolated env vars

#### Scaling Phases
- **Phase 1** (0-50 clients): Single Supabase project, shared schema
- **Phase 2** (50-200 clients): Redis cache, Nx if needed
- **Phase 3** (200+ clients): Schema-per-tenant, dedicated projects

### Business Model

#### Revenue Streams
- **Setup fees**: One-time onboarding cost
- **Monthly hosting**: Per-client SaaS fee
- **Custom development**: Industry-specific features
- **Support packages**: Tiered support levels

#### Value Proposition
- **Fast deployment**: <2 hours from scaffold to live
- **Consistent quality**: Shared components and design system
- **Scalable infrastructure**: Multi-tenant architecture
- **Industry expertise**: Specialized templates and features

---

## Common Onboarding Scenarios

### Scenario 1: First Demo Client
**Steps:**
1. Scaffold as prospective client
2. Use Riley Day Care template as-is
3. Customize branding and content
4. Deploy to subdomain (e.g. `demo.youragency.com`)
5. Use for sales demonstrations

### Scenario 2: Production Go-Live
**Steps:**
1. Scaffold as production client
2. Customize extensively for client needs
3. Set up dedicated domain
4. Configure analytics and monitoring
5. Train client on admin interface

### Scenario 3: Industry Template
**Steps:**
1. Create specialized template from Riley Day Care
2. Add industry-specific components
3. Create reusable token presets
4. Document industry best practices
5. Use for similar clients

---

## Troubleshooting

### Common Issues

#### Scaffold Fails
**Problem**: Script fails with "directory exists" error
**Solution**: Ensure slug is unique and doesn't conflict with existing apps

#### Token Build Errors
**Problem**: `pnpm tokens:build` fails
**Solution**: Check token JSON syntax and ensure client slug is in `PROSPECTIVE_SLUGS`

#### RLS Test Failures
**Problem**: `supabase test db` shows isolation failures
**Solution**: Verify tenant seed data and RLS policies use `public.tenant_id()`

#### Deployment Issues
**Problem**: Vercel build fails
**Solution**: Check environment variables and ensure all dependencies are installed

### Debug Commands

```bash
# Check scaffold output
ls -la apps/prospective-clients/[slug]/

# Verify token build
ls -la apps/prospective-clients/[slug]/tokens/

# Test RLS isolation
npx supabase test db

# Check build
pnpm turbo run build --filter=@agency/[slug]
```

---

## References and Resources

### Internal Documentation
- **AI_DEVELOPMENT_GUIDE.md** - AI agent workflows and prompts
- **MULTI_TENANT_SECURITY.md** - Security implementation and verification
- **ARCHITECTURE.md** - System architecture and scaling
- **DEPLOYMENT.md** - Vercel deployment strategies

### External Tools
- **pnpm** - Package manager and workspace management
- **Turborepo** - Build system and caching
- **Supabase** - Database and authentication
- **Vercel** - Hosting and deployment
- **PostHog** - Analytics and tracking

### Scripts and Automation
- `scripts/scaffold-client.ts` - Client scaffolding automation
- `scripts/create-test-user.ts` - Test user creation
- `pnpm tokens:build` - Design token compilation
- `supabase test db` - RLS verification

---

## Metrics and KPIs

### Onboarding Metrics
- **Time to scaffold**: <5 minutes
- **Time to first deploy**: <2 hours
- **Template customization**: 1-4 hours
- **Client satisfaction**: Track post-launch feedback

### Quality Metrics
- **RLS test pass rate**: 100%
- **Build success rate**: 100%
- **Cross-tenant isolation**: Verified per client
- **Performance scores**: Lighthouse >90

### Business Metrics
- **Client acquisition cost**: Track marketing spend vs conversions
- **Client lifetime value**: Monitor retention and upsells
- **Template reuse rate**: Measure industry-specific template usage
- **Support ticket volume**: Track onboarding-related issues

---

_This consolidated guide replaces ONBOARDING_CHECKLIST.md and DAY_CARE_TEMPLATE.md, with strategic context from PLAN_AGENCY_DIRECTION.md. All content has been organized for complete client onboarding coverage._
