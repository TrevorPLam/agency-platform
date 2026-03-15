# Agency Platform — Toolchain Documentation

**Last Updated:** 2026-03-14  
**Purpose:** Records development tool version requirements and verification commands for reproducible builds.

**Multiple development environments:** This repo is intended for use across multiple machines (e.g. desktop, laptop, CI). Run the verification checklist below **on each environment** where you develop. Installed versions may differ per machine as long as they meet the required version range. Each machine has its own `.env.local` (never committed); sync secrets via a password manager or team vault, not via git.

## Core Development Tools

| Tool | Required Version | Example / Verified | Verification Command |
|------|------------------|--------------------|----------------------|
| Node.js | 22.x or newer | v22.x / v25.x | `node --version` |
| pnpm | 10.x.x | 10.32.1 | `pnpm --version` |
| Turborepo | 2.7.x or newer | 2.8.17 | `turbo --version` or `pnpm exec turbo --version` |
| Supabase CLI | Latest | 2.78.1 | `npx supabase --version` |

## Per-Environment Checklist

On **each** machine (PC, laptop, etc.) where you code, ensure:

| Item | Notes |
|------|-------|
| Docker Desktop | Required for local Supabase (`supabase start`). Start Docker on that machine before running Supabase. |
| Git Identity | Configure once per machine: `git config --global user.name` / `user.email` |
| IDE | Cursor, Windsurf, or VS Code — install on each environment as needed. |

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

## Verification Checklist (run on each dev machine)

- [ ] `node --version` returns 22.x or newer
- [ ] `pnpm --version` returns 10.x.x
- [ ] `turbo --version` or `pnpm exec turbo --version` returns 2.7.x or newer
- [ ] `npx supabase --version` returns a valid version
- [ ] Docker Desktop is running (when using local Supabase on this machine)
- [ ] Git identity configured: `git config --global user.name` and `user.email`
- [ ] `.env.local` created from `.env.local.example` (per machine; not in git)
- [ ] All SaaS accounts accessible when needed (see setup instructions above)
- [ ] This file exists and is committed to git

---
*Run this checklist on every new environment (new PC, laptop, CI agent). Keep this file in version control.*
