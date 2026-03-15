# Agency Platform — Toolchain Documentation

**Last Updated:** 2026-03-14  
**Purpose:** Records all development tool versions and verification commands for reproducible builds.

## Core Development Tools

| Tool | Required Version | Installed Version | Verification Command | Status |
|------|------------------|-------------------|---------------------|--------|
| Node.js | 22.x.x | v25.8.1 | `node --version` | ✅ Installed (newer OK) |
| pnpm | 10.x.x | 10.32.1 | `pnpm --version` | ✅ Installed |
| Turborepo | 2.7.x | 2.8.17 | `turbo --version` | ✅ Installed (newer OK) |
| Supabase CLI | Latest | 2.78.1 | `npx supabase --version` | ✅ Installed (via npx) |

## Development Environment

| Tool | Status | Notes |
|------|--------|-------|
| Docker Desktop | ⚠️ Installed but not running | Docker v29.2.1 - **Action Required**: Start Docker Desktop manually from Start Menu |
| Git Identity | ✅ Configured | trevo <trevo@users.noreply.github.com> |
| Windsurf | ✅ Installed | v1.108.2 - AI IDE for development |

## SaaS Accounts Setup Instructions

### Required Accounts
1. **GitHub** ✅ - Already configured (trevo@users.noreply.github.com)
2. **Supabase** - Visit https://supabase.com/sign-up to create free account
3. **Vercel** - Visit https://vercel.com/signup to create free account  
4. **Inngest** - Visit https://app.inngest.com/signup to create free account
5. **PostHog Cloud** - Visit https://app.posthog.com/signup to create free account

### Account Setup Priority
- **Immediate**: Supabase (required for T-11)
- **Before Deployment**: Vercel (required for T-20)
- **Background Jobs**: Inngest (required for T-16)
- **Analytics**: PostHog (required for T-17)

## SaaS Accounts

| Service | Status | Account Type |
|---------|--------|--------------|
| GitHub | ✅ Configured | trevo@users.noreply.github.com |
| Supabase | ⚠️ Needs setup | Free tier - https://supabase.com/sign-up |
| Vercel | ⚠️ Needs setup | Free tier - https://vercel.com/signup |
| Inngest | ⚠️ Needs setup | Free tier - https://app.inngest.com/signup |
| PostHog Cloud | ⚠️ Needs setup | Free tier - https://app.posthog.com/signup |

## Installation Commands Reference

```bash
# Node.js (via nvm)
nvm install 22 && nvm use 22

# pnpm
npm install -g pnpm@latest

# Turborepo
npm install -g turbo

# Supabase CLI
npm install supabase  # Local install
npx supabase --version  # Verification

# Git Identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Verification Checklist

- [x] `node --version` returns 22.x.x or newer (v25.8.1)
- [x] `pnpm --version` returns 10.x.x (10.32.1)
- [x] `turbo --version` returns 2.7.x or newer (2.8.17)
- [x] `npx supabase --version` returns a valid version (2.78.1)
- [ ] Docker Desktop is running (⚠️ Manual start required)
- [x] Windsurf/Cursor is installed and accessible (v1.108.2)
- [ ] All SaaS accounts are accessible (Setup instructions provided)
- [x] This file exists and is committed to git

---
*This file is automatically updated during T-01 execution. Keep it in version control.*
