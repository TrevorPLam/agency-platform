# The Marketing-First Repository: The Complete Agency Technical Guide

***

## How to Use This Guide

You are building marketing websites for businesses — sites whose entire purpose is to attract visitors, establish trust, and convert those visitors into paying customers. Every technical decision in this guide traces back to that goal.

This guide assumes **zero prior formal education in software development**. Every technical term is defined when it is first introduced, with plain-English analogies. You will not write code manually — your role is to understand these systems deeply enough to **direct AI agents** (Cursor, Windsurf/Cascade) to build them correctly. Think of yourself as an architect who gives blueprints to a construction crew. You don't swing the hammer, but you absolutely need to understand what load-bearing walls are, and why you cannot remove them.

***

## Glossary: Core Concepts

Read this section before anything else. These definitions are the foundation for everything that follows.

**Repository (Repo)**: The folder that contains your entire project. Git tracks every change ever made to this folder. Think of it as a Google Doc with infinite, named version history.

**API (Application Programming Interface)**: A standardized way for two software systems to talk to each other. When your website asks a CMS "give me the latest blog posts," it is making an API call. Think of it as ordering at a restaurant: the menu is the API (what's available to request), you are the client (the one requesting), and the kitchen is the server (the one fulfilling it).

**Webhook**: The reverse of an API call. Instead of your website asking "has anything changed?", the other system proactively *pushes* a notification to your website the moment something changes. API = you pulling data on demand. Webhook = them pushing data the instant it happens. Signing up for a text alert vs. constantly refreshing a webpage.

**CDN (Content Delivery Network)**: A global network of servers that store copies of your website files. When a visitor in Tokyo visits your site hosted on a US server, a CDN serves them a pre-copied file from a Tokyo-region server instead, cutting load time dramatically. Every hosting platform in this guide operates a CDN.

**SSG / ISR / SSR**: How and *when* a page is built into HTML. Covered fully in Part 7.

**Hydration**: When a browser receives an HTML page from the server, it arrives looking correct — but it's like a high-quality photograph of a calculator. You can see all the buttons, but nothing responds when you click. *Hydration* is the moment React's JavaScript loads and "activates" that photograph, turning it into a real, working calculator. A poorly optimized site shows content quickly but remains unresponsive during hydration — buttons that look clickable do nothing for a second or two, which tanks your INP score.

**Bundle**: The compressed, merged JavaScript file(s) your site sends to the browser. Every package you install potentially adds weight to this bundle. Heavier bundle = slower site. Think of it as luggage on a plane — every item slows takeoff.

**Tree-shaking**: An automatic build optimization that discards JavaScript code you imported but never actually called. If you import a toolkit of 100 functions but use 2, tree-shaking throws away the other 98 from the final bundle.

**TypeScript vs JavaScript**: JavaScript is the language of the web. TypeScript adds a *type system* on top — a set of rules that declares what kind of data every variable must hold. TypeScript is spell-check for logic, not just spelling. It catches errors before your code runs, instead of after a user encounters a broken page.

**Compile Time vs Runtime**: Compile time is when code is being *processed* before it runs — when TypeScript checks types and the bundler assembles files. Runtime is when code is actually executing in a user's browser. Errors caught at compile time are invisible to users. Errors at runtime are exactly what your clients pay you to prevent.

**Monorepo**: One Git repository containing multiple projects — all your client websites and shared code in one folder.

**Node.js**: A runtime environment that lets JavaScript run on a server, outside a browser. Next.js requires Node.js.

**Package**: A reusable piece of code published to the npm registry. When you run `pnpm add react-hook-form`, you are downloading a package.

**Environment Variable**: A configuration value stored outside your code. Used to hold secrets (API keys) and environment-specific settings without putting them in your source code or on GitHub.

**A/B Testing**: A randomized experimentation process where two or more versions of a webpage or feature are shown to different users simultaneously to determine which version performs better. Think of it as a controlled scientific experiment for your website.

**Experiment**: A structured test with a clear hypothesis, defined variants (control and treatment), and measurable outcomes. Uses the PICOT framework: Population, Intervention, Control, Outcome, Time.

**Feature Flag**: A mechanism to toggle features on or off for specific users without deploying new code. Foundation for safe rollouts, A/B testing, and remote configuration.

**Statistical Significance**: The probability that the observed difference between variants is not due to random chance. Typically measured with p-values and confidence intervals.

***

## Part 1: Your Agency's Two Layers

Before writing a single line of code, understand that you operate on **two distinct technical layers**. Confusing them is one of the most expensive mistakes new agency owners make.

**Layer 1 — Agency Operations**: The software *you* use to run your agency — managing clients, collecting payments, sending proposals, nurturing leads, running your own email campaigns. You **subscribe** to this software; you do not build it.

**Layer 2 — Client Delivery**: The custom-coded websites you *build and deploy* for clients using the repository covered in this guide.

Both must exist. This guide covers Layer 2 in exhaustive detail, but Part 2 covers Layer 1 because it determines how your entire agency functions, what data flows where, and directly influences your repository's form-submission architecture.

***

## Part 2: Agency Operations Platform

### GoHighLevel — Your Agency Command Center

**GoHighLevel (GHL)** is a Software-as-a-Service platform built specifically for marketing agencies. It consolidates tools that would otherwise require 6–8 separate subscriptions into one platform.[1][2]

Without GHL, a typical agency pays separately for: a CRM (~$50/mo), an email marketing tool (~$20/mo), an appointment scheduler (~$15/mo), a review management tool (~$50/mo), a client reporting tool (~$50/mo), and a funnel builder (~$97/mo). GHL replaces all of these.[3]

**What GoHighLevel Includes**:[2][4]

- **CRM with Visual Pipelines**: A database of every lead and client, organized into Kanban-style columns: "New Lead → Proposal Sent → Onboarding → Active Client → Completed." Every contact form submission from a client's website can automatically create a record here.
- **Email + SMS Automation**: Build sequences that trigger automatically. Example: lead fills out the contact form on your client's plumbing site → they instantly receive a confirmation text → 2 days later an email with a coupon → 5 days later a follow-up call task is assigned to the owner. All automatic.
- **Appointment Scheduling**: Clients book calls through a Calendly-style calendar link. Syncs with Google Calendar. Zero email back-and-forth.
- **Reputation Management**: Automatically sends review request texts/emails to your clients' customers after jobs are completed. Aggregates Google and Facebook reviews in one dashboard.
- **White-Label Client Reporting**: Branded reports showing each client their SEO rankings, leads, Google Business stats, and social media performance — delivered automatically by email or accessible through a portal with your agency's logo.
- **Funnel & Landing Page Builder**: A drag-and-drop page builder for simple internal campaign pages. *This is not the coded Next.js site you build for clients.* This is for quick internal landing pages or agency marketing pages.
- **White-Label SaaS Resale**: At the SaaS Pro tier, you can brand GHL as your own platform and charge clients a monthly subscription for it. This is a significant recurring revenue stream for agencies.

**GHL Pricing (2026)**:[1][3]

| Plan | Price/mo | Best For |
|---|---|---|
| Starter | $97 | Your own agency (1 location, basic features) |
| Unlimited (Agency) | $297 | Multiple clients; unlimited sub-accounts; white-label app |
| SaaS Pro | $497 | White-label resale to clients; SaaS revenue model |

**Verdict**: Subscribe to the $297 Unlimited plan when you land your first client. It replaces $200–400/month of separate tools and creates a professional, automated client experience immediately.[1]

### Automation Platforms

Both **Make.com** and **Zapier** are no-code workflow automation platforms that connect apps together. You use them when you need data to flow between your client's Next.js site and external tools without writing custom API integrations.

| Feature | Make.com | Zapier |
|---|---|---|
| Free tier | 1,000 operations/mo | 100 tasks/mo |
| Paid starting price | $9/mo | $20/mo |
| Visual builder | Node-graph (powerful) | Linear steps (beginner-friendly) |
| Complexity ceiling | High — routers, iterators, error handling | Medium — linear workflows |
| App integrations | 2,000+ | 7,000+ |
| Best for | Complex, multi-step conditional logic | Simple, quick two-app connections |

**Recommendation**: Start with Zapier's free tier for simple connections. Upgrade to Make.com when you need conditional routing ("if the lead selected 'Emergency Service', assign to this pipeline AND send this SMS immediately").[2]

### Agency Billing with Stripe

Use **Stripe** directly through its dashboard (no coding required) to invoice clients and set up automatic recurring subscriptions. You do not need to code a Stripe integration for your own agency billing — just use Stripe's hosted payment links and billing portal.

You *will* need to code a Stripe integration only when a *client's website* needs to accept payments (service deposits, booking fees, product purchases). That is covered in the integrations section.

***

## Part 3: Domain & DNS Management

### Buying Domains

A **domain name** is the human-readable address for a website (`acmeplumbing.com`). Underneath, the internet routes by numerical **IP addresses**. The **DNS (Domain Name System)** is a global phonebook that translates domain names to IP addresses.

**Domain Registrars** (where you buy domains):

| Registrar | Price/yr (.com) | Privacy | Recommendation |
|---|---|---|---|
| **Namecheap** ✅ | ~$12 | Free included | Best for agencies |
| Cloudflare Registrar | ~$10 (at cost) | Free included | Best price; requires Cloudflare first |
| Google Domains (Squarespace) | ~$14 | Free included | Simple but pricier |
| GoDaddy | ~$12–20 | Paid add-on | Avoid — aggressive upsells |

### The Domain → Cloudflare → Vercel Architecture

Route every client domain through Cloudflare before pointing it to Vercel. This gives you a free security layer, DDoS protection, global caching, and a single dashboard managing all client DNS records:[5]

```
Step 1: Buy domain at Namecheap (~$12/year)
Step 2: Create a free Cloudflare account → Add Site → enter the domain
Step 3: Cloudflare scans existing DNS and gives you two nameserver addresses
         (e.g., bob.ns.cloudflare.com, ada.ns.cloudflare.com)
Step 4: In Namecheap → Domain → Custom DNS → paste Cloudflare's nameservers
Step 5: Wait 1–24 hours for propagation (change spreads across the internet)
Step 6: In Vercel → Project Settings → Domains → Add Domain
Step 7: Vercel shows you a CNAME value (e.g., cname.vercel-dns.com)
Step 8: In Cloudflare → DNS → Add Record:
         Type: CNAME | Name: www | Target: cname.vercel-dns.com
Step 9: Vercel auto-provisions a free SSL certificate (padlock / HTTPS)
Step 10: Add an A record for the root domain:
         Type: A | Name: @ | IP: 76.76.21.21 (Vercel's IP)
```

**DNS Record Types You Will Encounter**:

- **A Record**: Maps a domain name to an IPv4 address. Used for the root domain (`acmeplumbing.com`).
- **CNAME Record**: Maps a subdomain to another domain name. Used for `www.acmeplumbing.com`.
- **MX Record**: Routes email for the domain. Required when the client uses Google Workspace or Microsoft 365. You set these when configuring their business email.
- **TXT Record**: Stores arbitrary text. Used for domain verification (Google Search Console), email authentication (SPF, DKIM records that prevent your client's emails from landing in spam), and ownership verification for various platforms.

***

## Part 4: Environment Setup

### Node.js Version Management

| Tool | Speed | Config File | Recommendation |
|---|---|---|---|
| **fnm** ✅ | Fast (Rust-based) | `.nvmrc` | Best — install this first |
| nvm | Slow (shell script) | `.nvmrc` | Most widely documented |
| Volta | Fast | `package.json` | Good for teams |

```bash
# Install fnm
curl -fsSL https://fnm.vercel.app/install | bash

# Install Node.js LTS
fnm install --lts && fnm use lts-latest

# Confirm version
node --version   # Should show v22.x.x or higher

# Create .nvmrc in every repo root
echo "22" > .nvmrc
```

### Package Manager: pnpm

```bash
npm install -g pnpm     # Install pnpm globally

pnpm install            # Install all dependencies from package.json
pnpm add react-hook-form            # Add a runtime dependency
pnpm add -D @types/node             # Add a dev-only dependency
pnpm add react-hook-form --filter=apps/acme-plumbing  # Add to one app in a monorepo
pnpm dev                # Start development server
pnpm build              # Build for production
pnpm lint               # Run ESLint
```

***

## Part 5: Version Control

### Git — Explained for Non-Developers

Every time you (or an AI agent) makes a meaningful change, you **commit** it. A commit is a labeled snapshot. Your commit history becomes a timeline you can travel through. If an AI agent breaks something, `git revert` takes you back to before the damage.

**Daily workflow:**
```bash
git status                              # See what changed
git add .                               # Stage all changes
git commit -m "feat(homepage): add hero section with Framer Motion"
git push origin main                    # Upload to GitHub
```

**Conventional Commit Types**: `feat` (new feature), `fix` (bug fix), `chore` (maintenance/dependencies), `refactor` (restructuring without behavior change), `style` (formatting only), `docs` (documentation), `perf` (performance improvement).

### GitHub Branching Strategy (GitHub Flow)

```
main ──────────────────────────────────────────── (always live = production)
              ↑                    ↑
  feature/homepage-redesign    fix/form-validation-bug

Workflow:
1. git checkout -b feature/homepage-redesign
2. Work with AI agent on the branch
3. git push origin feature/homepage-redesign
   → Vercel auto-creates a preview URL (e.g., preview-xyz.vercel.app)
4. Review the preview URL. Share with client for approval.
5. Merge to main → Vercel deploys to production automatically.
```

***

## Part 6: Repository Architecture — Monorepo vs. Polyrepo

This is one of the most consequential architectural decisions you will make. Read it carefully before choosing.

### Polyrepo — One Repo Per Client

A **polyrepo** means each client website lives in its own separate Git repository. `github.com/your-agency/acme-plumbing`, `github.com/your-agency/downtown-dental`, etc.

**Advantages:**
- Simpler to set up — just clone a template and you're working
- Problems in one client's repo never affect others
- Easier to hand over a single repo to a client
- Vercel deployment per project is straightforward

**Disadvantages:**
- Shared code (contact forms, navigation components) must be copy-pasted into every repo
- Updating a shared component requires changes in every repo separately
- No cross-project consistency enforcement
- Managing 15+ separate repos in Cursor becomes cumbersome

### Monorepo — All Clients in One Repo

A **monorepo** puts all client websites in one repository, alongside shared packages they all import from.

**Advantages:**
- Update a shared `<ContactForm>` once — every site inherits the fix automatically
- One CI/CD pipeline to maintain
- Shared TypeScript types, ESLint config, Tailwind base config
- AI agents have cross-project context — they understand patterns across all sites

**Disadvantages:**
- Significantly more complex to set up correctly
- Turborepo configuration has a real learning curve
- A misconfigured dependency can affect multiple clients
- Slower initial build times

### ⚠️ Honest Recommendation for Your Stage

**Start with a polyrepo template approach for your first 1–3 clients.** Build one excellent client template repository with all the tooling, components, and patterns described in this guide. When you get a new client, clone the template: `git clone --template=my-agency-template client-name`. This gives you code reuse through copying (not architectural sharing), without the complexity of managing a monorepo while you are still learning Cursor workflows.

Migrate to a Turborepo monorepo when you have 4+ active clients, you are comfortable with Git, and you find yourself making the same change in 3+ repos simultaneously. That is the signal that a monorepo pays off.

| Approach | Setup Complexity | Best When |
|---|---|---|
| **Polyrepo (template clone)** ✅ Start here | Low | Clients 1–3; learning Cursor |
| **Monorepo (Turborepo)** | High | 4+ clients; frequent shared component updates |

### Monorepo Structure (Reference — Implement Later)

```
my-agency/
├── apps/
│   ├── acme-plumbing/          ← Next.js app (Client A)
│   ├── downtown-dental/        ← Next.js app (Client B)
│   └── green-lawn-brochure/    ← Astro app (Client C)
├── packages/
│   ├── ui/                     ← Shared Shadcn/Radix components
│   ├── seo/                    ← Shared metadata generators, JSON-LD helpers
│   ├── analytics/              ← Shared GTM/GA4 initialization
│   ├── forms/                  ← Shared React Hook Form + Zod schemas
│   └── email/                  ← Shared React Email templates
├── tooling/
│   ├── eslint-config/
│   └── tsconfig/
├── pnpm-workspace.yaml
├── turbo.json
└── .cursorrules
```

***

## Part 7: Code Quality

### TypeScript — Always `strict: true`

```json
// tsconfig.json (the configuration file for TypeScript)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

The `"paths"` alias lets you write `import { Button } from '@/components/ui/button'` from anywhere in the project instead of `../../../components/ui/button`. AI agents use this consistently, which prevents broken imports.

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    "next/core-web-vitals",           // React + accessibility + Next.js rules
    "@typescript-eslint/recommended", // TypeScript best practices
    "prettier",                        // Disables formatting rules (Prettier handles those)
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",  // CRITICAL: bans the "any" escape hatch
    "@typescript-eslint/no-unused-vars": "error",   // Catches variables AI agents declare but forget to use
    "no-console": "warn",
    "prefer-const": "error",
  }
};
```

`no-explicit-any` is the most important rule for agentic coding. The TypeScript `any` type is an escape hatch that disables all type checking for a variable — exactly what lazy AI code generation reaches for when it doesn't know the type. Banning `any` forces the agent to define proper types.

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`prettier-plugin-tailwindcss` auto-sorts Tailwind class names into a consistent canonical order. After 50 AI agent sessions without this, your Tailwind class strings become completely inconsistent — some alphabetical, some by category, some random. This plugin enforces one consistent ordering automatically on every save.

### Husky + lint-staged

```bash
# Install
pnpm add -D husky lint-staged
pnpm exec husky init
```

```bash
# .husky/pre-commit (created automatically by husky init)
pnpm lint-staged
```

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yaml,css}": ["prettier --write"]
}
```

Now every `git commit` automatically fixes fixable ESLint issues and formats all changed files. Code that cannot be fixed is rejected before the commit saves. This is your automated quality gate against AI-generated drift.

***

## Part 8: Framework Selection

### All Framework Options

| Framework | Language | Architecture | JS to Browser | Ideal For |
|---|---|---|---|---|
| **Next.js 15** ✅ | React / TSX | Hybrid MPA + SPA | Configurable | Complex marketing sites; dynamic content; app + marketing combined |
| **Astro 5** | Any (React, Vue, Svelte) | MPA | Near zero | Content-heavy blogs, portfolios, brochure sites — maximum Lighthouse scores |
| **Remix 2** | React / TSX | SSR-first SPA | Medium | Heavily dynamic, form-rich apps |
| **SvelteKit** | Svelte / TS | Hybrid MPA | Very low | Performance-critical sites; no React requirement |
| **Nuxt 3** | Vue / TS | Hybrid | Medium | Teams comfortable with Vue instead of React |
| **Gatsby** | React / TSX | SSG-only | High | Largely superseded by Astro; avoid for new projects |

**Recommendation: Next.js 15 (App Router)** for all agency client sites. The reasons:[6]
1. It supports every rendering strategy, configurable per page
2. The App Router uses React Server Components (RSC) by default — components that render only on the server, sending zero JavaScript to the browser
3. The largest ecosystem of marketing integrations, community resources, and hiring pool
4. Vercel — its creator — has purpose-built infrastructure for it
5. AI agents (Cursor, Windsurf, Claude) have been trained on more Next.js code than any other framework

**Choose Astro instead when**: The site is a pure content brochure — no user accounts, no personalized content, no dynamic data, no interactive app features. Law firm, photography portfolio, restaurant menu site. Astro ships zero JavaScript for fully static pages and achieves perfect Lighthouse scores with minimal effort.

### Rendering Strategies

**SSG (Static Site Generation)**: Built once at deploy time. Served instantly from CDN. Best for pages that change once a month or less: homepage, about, services, pricing.

**ISR (Incremental Static Regeneration)** ✅ Agency workhorse: Pre-built like SSG but automatically rebuilds on a schedule or via webhook when the client updates content. Best for blog posts, case studies, team pages.

**SSR (Server-Side Rendering)**: Rebuilt fresh for every visitor. Always current data. Best for personalized pages, real-time content, client portals.

**PPR (Partial Pre-Rendering)** — Next.js 15: A single page with a static shell (nav, hero, footer — served from CDN instantly) plus dynamic islands (personalized offers, live pricing — streamed in milliseconds later). The future of marketing performance.

| Page Type | Strategy | Revalidation |
|---|---|---|
| Homepage, About, Services | SSG | On deploy or CMS webhook |
| Blog posts, Case studies | ISR | `revalidate = 3600` + CMS webhook |
| Testimonials, Team | ISR | `revalidate = 86400` (daily) |
| Pricing (live) | ISR | `revalidate = 60` |
| Personalized landing pages | PPR | Static shell + dynamic segment |
| Client portal / dashboard | SSR | Always fresh |

***

## Part 9: Project Structure

The App Router's file system *is* the routing system. Folder names define URL paths:

```
apps/acme-plumbing/
├── app/
│   ├── layout.tsx               ← Root HTML shell (nav, footer, fonts, scripts)
│   ├── page.tsx                 ← / (Homepage)
│   ├── about/page.tsx           ← /about
│   ├── services/
│   │   ├── page.tsx             ← /services (listing)
│   │   └── [service]/page.tsx   ← /services/drain-cleaning (dynamic — one file, infinite URLs)
│   ├── blog/
│   │   ├── page.tsx             ← /blog (listing page)
│   │   └── [slug]/page.tsx      ← /blog/my-post-title
│   ├── (marketing)/             ← Route group — no URL segment added
│   │   ├── layout.tsx           ← Layout WITH NO header/footer (for ad landing pages)
│   │   └── lp-summer-promo/page.tsx  ← /lp-summer-promo
│   ├── api/
│   │   ├── contact/route.ts     ← POST /api/contact (form handler)
│   │   └── revalidate/route.ts  ← POST /api/revalidate (CMS webhook receiver)
│   ├── sitemap.ts               ← Generates /sitemap.xml automatically
│   ├── robots.ts                ← Generates /robots.txt automatically
│   └── opengraph-image.tsx      ← Generates OG images automatically
├── components/
│   ├── ui/                      ← Shadcn components (owned code)
│   ├── sections/                ← Page sections: Hero, Services, Testimonials, FAQ, CTA
│   └── layout/                  ← Header, Footer, MobileNav
├── lib/
│   ├── cms.ts                   ← All Sanity/CMS query functions
│   ├── metadata.ts              ← Reusable metadata generation helpers
│   ├── validations.ts           ← All Zod schemas (forms + API validation)
│   └── analytics.ts             ← GTM dataLayer event helpers
├── public/                      ← Static files (favicon, default OG image)
├── next.config.ts
├── tailwind.config.ts
└── .env.local                   ← NEVER commit this file
```

**Server vs Client Components**: In App Router, all components are Server Components by default (render only on server, zero browser JS). Add `'use client'` at the top of a file only when you need React hooks (`useState`, `useEffect`) or browser event handlers (`onClick`). Every `'use client'` declaration is a decision to send JavaScript to the browser — use it sparingly.

***

## Part 10: Styling & The Visual Layer

### CSS Architecture — All Options

| Approach | How It Works | AI Friendliness | Performance | Recommendation |
|---|---|---|---|---|
| **Tailwind CSS** ✅ | Utility classes inline in JSX | Excellent — inline, self-documenting | Best — purged at build | **Use this** |
| CSS Modules | Scoped `.module.css` files per component | Good | Very good | Viable for isolated components |
| Styled Components | CSS written inside JS files, applied at runtime | Good | Poor — runtime CSS injection hurts FCP | Avoid for marketing sites |
| Emotion | Same as Styled Components | Good | Poor | Avoid |
| Vanilla Extract | Type-safe CSS-in-TypeScript, zero runtime | Good | Excellent | Viable but niche |
| Plain CSS / SCSS | Global stylesheet with BEM naming | Poor — AI needs to jump between files | Good (if disciplined) | Avoid — AI agents drift badly |
| Bootstrap / Bulma | Pre-designed utility/component classes | Medium | Medium | Avoid — generic look |

**Why Tailwind wins for agentic development**: AI models have been trained on millions of Tailwind examples. More importantly, all styling information lives *inline in the component file* — the AI never needs to jump between a JSX file and a separate CSS file to understand or modify a component. This dramatically reduces hallucination and broken styles.[7]

**CSS-in-JS solutions** (Styled Components, Emotion) inject styles via JavaScript at runtime. This means the browser cannot paint the page until it has executed that JavaScript — directly harming your **First Contentful Paint (FCP)** score, a Core Web Vitals metric. Never use CSS-in-JS on marketing sites.

### Tailwind Design Tokens

```typescript
// tailwind.config.ts — Fill in client brand values
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1E40AF',    // Client's primary brand color
          secondary: '#047857',  // Secondary color
          accent: '#DC2626',     // CTA/button accent (should pop)
          dark: '#0F172A',       // Dark text + dark backgrounds
          light: '#F8FAFC',      // Light backgrounds
          muted: '#64748B',      // Subdued text
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-cabinet)', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),   // Styles for blog post rich text
    require('@tailwindcss/forms'),        // Better default form element styles
  ],
};
```

### Component Libraries — All Options

| Library | Philosophy | Customization | Accessibility | For Agencies |
|---|---|---|---|---|
| **Shadcn/ui** ✅ | Copy-paste ownership; built on Radix | Unlimited — you own the code | Excellent (Radix) | **Best** |
| Radix UI (headless) | Unstyled primitives only | Unlimited | Excellent | More work — pair with Tailwind |
| DaisyUI | Tailwind-based pre-styled | Medium — class overrides | Decent | Good for rapid prototyping |
| Chakra UI | Pre-styled accessible components | Medium | Good | Viable; more opinionated |
| NextUI | Pre-styled; built on React Aria | Limited | Excellent | Viable |
| MUI (Material UI) | Google Material Design | Limited | Good | Avoid — screams "generic app" |
| Ant Design | Enterprise pre-styled | Limited | Good | Avoid |

**Why Shadcn wins**: When you "install" a Shadcn component, it copies the full source code into your `components/ui/` folder. You own every line. Your AI agent can modify `button.tsx` directly in natural language — "make the primary button have a subtle drop shadow and a scale-up hover effect" — without fighting an external library's API or versioning. This is architecturally decisive for agentic development.[8]

### Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import localFont from 'next/font/local'; // For custom/purchased brand fonts

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// For a custom brand font (e.g., purchased from a type foundry)
const brandFont = localFont({
  src: [
    { path: '../public/fonts/BrandFont-Regular.woff2', weight: '400' },
    { path: '../public/fonts/BrandFont-Bold.woff2', weight: '700' },
  ],
  variable: '--font-brand',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${brandFont.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

**Never use a `<link>` tag to load Google Fonts**. It creates a render-blocking network request to an external server, leaks user data to Google, and causes FOUT (Flash of Unstyled Text). `next/font` self-hosts the font at build time, eliminating all three problems.

### Animations

| Library | Best For | JS Weight | Learning Curve |
|---|---|---|---|
| **Framer Motion** ✅ | Scroll reveals, staggered lists, page transitions | Medium | Low |
| GSAP | Cinematic, timeline-based, sequence animations | Medium | High |
| CSS Animations | Simple repeating effects (spinners, pulse, hover) | Zero | Very low |
| `@react-spring/web` | Physics-based gesture-driven interactions | Medium | Medium |
| Auto Animate | One-line list/element transitions | Very low | Minimal |

**Rule**: Only animate `transform` (translate, scale, rotate) and `opacity`. Animating `width`, `height`, `margin`, or `padding` triggers **layout recalculation** on every animation frame, causing visible jank and **CLS (Cumulative Layout Shift)** penalties.[9]

```tsx
'use client'; // Required for Framer Motion
import { motion } from 'framer-motion';

// Scroll-triggered fade-up reveal (the most common agency animation pattern)
export function RevealOnScroll({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }} // Trigger when 80px into view
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

***

## Part 11: Experimentation & A/B Testing

### Why Experimentation Matters for Agencies

**Experimentation is the scientific method for marketing websites.** Instead of guessing what will improve conversion rates, you test hypotheses with real users and make data-driven decisions. This transforms your agency from "we think this looks good" to "we know this converts 23% better."

For agencies, experimentation provides:
- **Measurable ROI**: Show clients exactly how your changes impact their bottom line
- **Risk Reduction**: Test changes with small traffic percentages before full rollout
- **Continuous Improvement**: Build a culture of optimization that retains clients
- **Competitive Advantage**: Most agencies don't experiment systematically

### The PICOT Framework for Experiments

Medical researchers use PICOT to design rigorous studies. We adapt it for web experiments because it forces clarity and prevents vague "let's test something" approaches.

| Component | What it means for web experiments | Example |
|-----------|----------------------------------|---------|
| **P** - Population | Who are you testing with? | "Mobile users on homepage" |
| **I** - Intervention | What are you changing? | "New hero section with video" |
| **C** - Control | What's the baseline? | "Current hero section" |
| **O** - Outcome | What metric matters? | "Button click-through rate" |
| **T** - Time | How long or how many users? | "7 days or 500 visitors" |

**Strong Hypothesis Example**: "Changing the hero section from the current static image to a product video (Intervention) will increase click-through rate (Outcome) by 15% over 7 days (Time) for mobile visitors (Population) compared to the current static image (Control)."

### Experiment Types for Agency Work

#### 1. **A/B Tests** (Most Common)
Two versions: Control vs. One variant. Perfect for:
- Headline testing
- Button color/size changes
- Image vs. video hero sections
- Form field order changes

#### 2. **Multivariate Tests** (Advanced)
Multiple variables tested simultaneously. Use when:
- Testing headline + image + button together
- Complex page redesigns
- High-traffic pages where you can afford more variants

#### 3. **Feature Flags** (Infrastructure)
Toggle features without deployment. Essential for:
- Phased rollouts (5% → 25% → 100%)
- Kill switches for broken features
- Beta programs for select clients
- Remote configuration changes

### Statistical Significance for Non-Statisticians

You don't need a statistics degree, but you need to understand these concepts:

#### **Sample Size**
- **Too small**: Random chance dominates results
- **Rule of thumb**: At least 100 conversions per variant
- **Calculator**: Use online A/B test calculators

#### **Statistical Significance (p-value)**
- **p < 0.05**: Less than 5% chance result is random
- **Translation**: 95% confident the difference is real
- **Practical**: Wait for significance before declaring winners

#### **Confidence Intervals**
- **Range**: "Conversion rate is 2.1% to 2.7%"
- **Meaning**: True value likely falls in this range
- **Use**: Shows precision of your results

### Agency Experimentation Workflow

#### Phase 1: Hypothesis Development
1. **Analyze current performance** using analytics data
2. **Identify optimization opportunity** (low conversion, high bounce)
3. **Formulate PICOT hypothesis** with specific metrics
4. **Get client approval** on hypothesis and success criteria

#### Phase 2: Technical Implementation
1. **Create experiment variants** using feature flags
2. **Implement tracking** for primary and secondary metrics
3. **Set traffic allocation** (start with 10-20% for safety)
4. **Test implementation** with internal users

#### Phase 3: Run Experiment
1. **Launch experiment** with monitoring
2. **Check daily** for technical issues
3. **Wait for significance** or time horizon
4. **Document observations** during testing

#### Phase 4: Analysis & Implementation
1. **Analyze results** with statistical tools
2. **Create client report** with clear recommendations
3. **Implement winning variant** (or keep control if no winner)
4. **Plan next experiment** based on learnings

### Privacy & Compliance Considerations

#### **GDPR Compliance**
- **Anonymize user data** in experiment tracking
- **Get consent** for data collection where required
- **Clear opt-out options** for users
- **Data retention policies** (delete after experiment ends)

#### **Multi-Tenant Isolation**
- **Never mix client data** in experiments
- **Separate experiments per tenant** in database
- **Respect client privacy settings**
- **Clear data ownership** in reporting

### Tools & Integration

#### **PostHog Integration** (Built into this platform)
- **Feature flags** for variant assignment
- **Event tracking** for user behavior
- **Statistical analysis** with confidence intervals
- **Real-time results** dashboard

#### **Database Schema** (Implemented)
- **Experiments table** with PICOT framework
- **Variants table** for test configurations
- **Assignments table** with pseudonymized users
- **Metrics table** for statistical results
- **Row-Level Security** for tenant isolation

#### **Agency Admin Dashboard** (Built-in)
- **Experiment management** interface
- **Real-time results** visualization
- **Statistical significance** indicators
- **Client reporting** exports

### Common Experiment Ideas for Agency Clients

#### **Lead Generation Sites**
- **Hero section**: Image vs. video vs. illustration
- **CTA buttons**: Color, size, text, placement
- **Forms**: Fields order, validation, multi-step vs. single
- **Social proof**: Testimonials, case studies, trust badges

#### **E-commerce Sites**
- **Product images**: Lifestyle vs. product-only vs. video
- **Pricing display**: Strikethrough vs. badge vs. text
- **Add to cart**: Button color, size, placement, urgency
- **Product descriptions**: Long vs. short vs. bullet points

#### **Service Businesses**
- **Contact forms**: Required fields, layout, trust signals
- **Service descriptions**: Technical vs. benefits-focused
- **Pricing tables**: 3-column vs. 2-column vs. accordion
- **Team photos**: Professional vs. casual vs. no photos

### Measuring Success Beyond Conversion

#### **Primary Metrics** (Direct Business Impact)
- **Conversion rate**: Forms completed, purchases, sign-ups
- **Revenue per visitor**: Direct monetary impact
- **Lead quality**: Not just quantity, but qualification

#### **Secondary Metrics** (User Experience)
- **Bounce rate**: Page engagement
- **Time on page**: Content interest
- **Pages per session**: Site exploration
- **Mobile vs. desktop**: Device-specific behavior

#### **Guardrail Metrics** (Nothing Broke)
- **Page load speed**: Performance didn't degrade
- **Error rates**: No increase in 404s or crashes
- **Accessibility**: Screen readers still work
- **Cross-browser**: Consistent experience

### When NOT to Run Experiments

#### **Low Traffic Sites**
- **Less than 1,000 visitors/month**: Insufficient sample size
- **Solution**: Run experiments longer or focus on qualitative feedback

#### **Legal/Compliance Changes**
- **Privacy policy updates**: Not optional
- **Required disclosures**: Must be implemented for everyone
- **Safety-critical information**: No A/B testing

#### **Brand-Critical Elements**
- **Logo changes**: Test with focus groups first
- **Core messaging**: Qualitative research better
- **Legal disclaimers**: Consult lawyers, not A/B tests

### Building an Experimentation Culture

#### **Start Small**
1. **One experiment per month** per client
2. **Simple A/B tests** before multivariate
3. **Document everything** for learning
4. **Share results** across all clients

#### **Scale Up**
1. **Experiment roadmap** aligned with client goals
2. **Dedicated optimization budget** (10% of traffic)
3. **Team training** on statistics and tools
4. **Client quarterly reviews** of experimentation results

#### **Measure Success**
1. **Conversion lift**: Average improvement across experiments
2. **Revenue impact**: Direct monetary value created
3. **Client retention**: Clients who stay because of results
4. **Team capability**: Experiments per team member

### Common Pitfalls to Avoid

#### **Statistical Errors**
- **Peeking at results** before significance: Creates false positives
- **Too many variants**: Dilutes traffic, extends test duration
- **Ignoring seasonality**: Test during comparable time periods
- **Sample size too small**: Inconclusive results

#### **Technical Mistakes**
- **Broken tracking**: Missing data leads to wrong conclusions
- **Cross-contamination**: Users see multiple variants
- **Cache issues**: Old version served to some users
- **Mobile vs. desktop**: Different experiences on different devices

#### **Business Errors**
- **Testing minor changes**: Focus on high-impact hypotheses
- **Ignoring qualitative data**: Numbers don't tell the whole story
- **Not communicating**: Client doesn't understand test value
- **Implementation delays**: Winners not deployed quickly

***

## Part 12: Content Management System (CMS)

### Full CMS Comparison

| CMS | Hosting | Free Tier | Editor UX | Tech Required | Best For |
|---|---|---|---|---|---|
| **Sanity** ✅ | Cloud SaaS | 20 seats, generous API limits | Real-time collaborative; customizable Studio | Low | **Agency default** |
| Contentful | Cloud SaaS | Very limited (5 content types, 25k records) | Clean but dated | Low | Enterprise clients with budget |
| Strapi | Self-hosted | OSS (free to self-host) | Developer-first admin | Medium-High | Full DB control, budget clients |
| Prismic | Cloud SaaS | 1 user | Visual slice builder | Low | Simple brochure sites |
| Hygraph | Cloud SaaS | 1M API ops/mo | GraphQL-centric | Medium | GraphQL-native teams |
| Payload CMS | Self-hosted | OSS (free) | Excellent (React-based) | High | Next.js full-stack apps |
| Directus | Self-hosted | OSS (free) | DB wrapper + media | Medium | DB-centric workflows |
| MDX / Velite | N/A (files in repo) | Free | Code editor / GitHub | Low | Technical clients; <50 pages |

[10][11][12]

**Sanity Pricing (2026)**:[13]
- **Free**: 20 editor seats, 100k API requests/mo, 1M CDN requests/mo, 2 datasets
- **Growth**: $15/seat/mo + usage overages
- **Enterprise**: Custom

**Why Sanity is the agency default**: Its free tier is the most generous in the category, supporting multiple client editors per project. Sanity Studio is a React application — your AI agent can customize the editing interface (add custom previews, validation warnings, conditional fields) that non-technical clients actually find intuitive. GROQ queries read like English.[12]

### Sanity Content Schema Example

```typescript
// schemaTypes/services.ts
import { defineField, defineType } from 'sanity';

export const serviceSchema = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Service Name',
      type: 'string',
      validation: r => r.required().max(60),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 60 },
      description: 'Auto-generated from the name. Do not edit unless you know what a URL is.',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description (for cards)',
      type: 'text', rows: 3,
      validation: r => r.required().max(160),
    }),
    defineField({
      name: 'fullDescription',
      title: 'Full Description',
      type: 'array',
      of: [{ type: 'block' }], // Rich text editor (bold, lists, links)
    }),
    defineField({
      name: 'icon',
      title: 'Service Icon',
      type: 'image',
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        { name: 'title', title: 'Page Title (60 chars max)', type: 'string' },
        { name: 'description', title: 'Meta Description (160 chars max)', type: 'text', rows: 2 },
      ],
    }),
  ],
});
```

### CMS → Next.js Data Flow

```typescript
// lib/cms.ts
import { createClient } from 'next-sanity';

export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

// Fetch all services (SSG + revalidation)
export async function getServices() {
  return sanityClient.fetch(
    `*[_type == "service"] | order(_createdAt asc) {
      _id, name, slug, shortDescription, "iconUrl": icon.asset->url
    }`,
    {},
    // This tag enables targeted cache invalidation via revalidateTag('services')
    { next: { revalidate: 3600, tags: ['services'] } }
  );
}

// CMS webhook receiver — app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { _type } = await request.json();
  // Revalidate the cache tag matching the document type that changed
  revalidateTag(_type);
  return NextResponse.json({ revalidated: true, type: _type });
}
```

### Database: When to Use One (and When Not To)

**Important architecture decision**: Many marketing sites do **not** need a custom database for lead data. If you are already using GoHighLevel, lead form submissions should flow directly to GHL via webhook — not to a custom Supabase database. Building a custom PostgreSQL leads table when you already pay $297/month for GHL is an unnecessary anti-pattern.

**Use a database (Supabase) when**:
- The client needs a custom admin dashboard showing their own data
- You are building booking/appointment functionality beyond GHL's scope
- The site has user accounts and user-generated content
- The client is not using GHL (then storing leads in a DB + emailing them makes sense)

**Do not build a custom database for leads if**: GHL, HubSpot, or another CRM already handles this. Route form submissions directly to that CRM via webhook.

```
CORRECT LEAD FLOW (with GHL):
Form submission → Next.js API route validates with Zod →
  POST to GHL Inbound Webhook URL (server-side, key stays secret) →
    GHL creates contact + triggers automation workflow

CORRECT LEAD FLOW (without GHL):
Form submission → Next.js API route validates with Zod →
  Resend: sends email notification to client →
  Supabase: inserts row into leads table (for client's own dashboard)
```

***

## Part 12: SEO — The Complete System

### Metadata API

```typescript
// app/layout.tsx — Global defaults
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://acmeplumbing.com'), // REQUIRED — base for relative URLs
  title: { default: 'Acme Plumbing', template: '%s | Acme Plumbing' },
  description: 'Licensed plumbers serving Dallas-Fort Worth since 2010. Available 24/7.',
  openGraph: {
    type: 'website',
    siteName: 'Acme Plumbing',
    locale: 'en_US',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  verification: {
    google: 'YOUR_GSC_VERIFICATION_CODE', // From Google Search Console
  },
};

// app/services/[service]/page.tsx — Dynamic page metadata from CMS
export async function generateMetadata({ params }): Promise<Metadata> {
  const service = await getService(params.service);
  return {
    title: service.seo?.title ?? service.name,   // "Drain Cleaning | Acme Plumbing"
    description: service.seo?.description ?? service.shortDescription,
    alternates: { canonical: `https://acmeplumbing.com/services/${params.service}` },
    openGraph: {
      title: service.seo?.title ?? service.name,
      images: [{ url: `/api/og?title=${encodeURIComponent(service.name)}`, width: 1200, height: 630 }],
    },
  };
}
```

### Sitemap, Robots, and OpenGraph Image

```typescript
// app/sitemap.ts — Auto-generates /sitemap.xml
import type { MetadataRoute } from 'next';
import { getServices, getBlogPosts } from '@/lib/cms';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices();
  const posts = await getBlogPosts();
  const baseUrl = 'https://acmeplumbing.com';

  const serviceUrls = services.map(service => ({
    url: `${baseUrl}/services/${service.slug.current}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const postUrls = posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug.current}`,
    lastModified: new Date(post._updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...serviceUrls,
    ...postUrls,
  ];
}
```

```typescript
// app/robots.ts — Auto-generates /robots.txt
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/studio/', '/_next/'],
      },
    ],
    sitemap: 'https://acmeplumbing.com/sitemap.xml',
  };
}
```

```typescript
// app/opengraph-image.tsx — Auto-generates a dynamic OG preview image
import { ImageResponse } from 'next/og';

export const runtime = 'edge'; // Runs on Vercel's Edge network

export default async function OGImage() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #1E40AF, #0F172A)',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', color: 'white' }}>
          <p style={{ fontSize: 32, opacity: 0.8, margin: 0 }}>Acme Plumbing</p>
          <h1 style={{ fontSize: 64, fontWeight: 'bold', margin: '16px 0 0' }}>
            Expert Plumbing in DFW
          </h1>
          <p style={{ fontSize: 28, opacity: 0.7, margin: '16px 0 0' }}>
            Licensed • Insured • Available 24/7
          </p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### JSON-LD Schema Markup

JSON-LD is structured data that tells Google the semantic meaning of your page, enabling **Rich Results** — enhanced search listings with stars, FAQs, and contact info that dramatically improve click-through rates.

```typescript
// components/schema/LocalBusinessSchema.tsx
// Add this component to the homepage layout via next/head or as a script tag

interface LocalBusinessSchemaProps {
  name: string;
  phone: string;
  address: { street: string; city: string; state: string; zip: string; };
  lat: number;
  lng: number;
  url: string;
  description: string;
  services: string[];
}

export function LocalBusinessSchema({ name, phone, address, lat, lng, url, description, services }: LocalBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": name,
    "description": description,
    "url": url,
    "telephone": phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": address.street,
      "addressLocality": address.city,
      "addressRegion": address.state,
      "postalCode": address.zip,
      "addressCountry": "US"
    },
    "geo": { "@type": "GeoCoordinates", "latitude": lat, "longitude": lng },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Services",
      "itemListElement": services.map(s => ({
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": s }
      }))
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      "opens": "00:00", "closes": "23:59" // 24/7
    }
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
```

**Schema types for common marketing site pages**:

| Page Type | Schema | Rich Result |
|---|---|---|
| Homepage (local business) | `LocalBusiness` | Map pack, phone number in SERP |
| Any company site | `Organization` | Knowledge panel, sitelinks |
| Blog post | `BlogPosting` + `Article` | Date, author in SERP |
| FAQ section | `FAQPage` | Expandable Q&A directly in Google |
| Team/staff page | `Person` | Staff knowledge cards |
| Reviews page | `AggregateRating` | Star rating in SERP |
| Any page navigation | `BreadcrumbList` | Path shown in SERP URL |

***

## Part 13: Analytics & Tracking

### The Analytics Stack Architecture

Every marketing site uses a **three-layer analytics architecture**:

1. **Tag Manager (GTM)**: The container. Installs once in code. All other tools are configured inside it — without touching code again.
2. **Analytics Platform (GA4)**: Tracks visitors, sessions, page views, events, conversions.
3. **Ad Tracking Pixels (Meta, Google Ads)**: Tracks which ad campaigns produce conversions for paid advertising clients.

### Google Tag Manager (GTM) — Installation

The official Next.js way uses `@next/third-parties`:

```typescript
// app/layout.tsx
import { GoogleTagManager } from '@next/third-parties/google';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
      {/* GTM loads after the page is interactive — protects LCP score */}
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
    </html>
  );
}
```

`@next/third-parties/google` handles the `<noscript>` iframe tag automatically and uses `afterInteractive` loading strategy, meaning GTM never blocks your page paint.[14]

### GTM Setup Workflow (No Code Required After Installation)

Once GTM is installed in the repo (one time), all future tag management happens in the GTM web interface:

1. **Create a GTM account** → Create a Container → get your `GTM-XXXXXXX` ID
2. **Add GTM ID** to your Vercel environment variables as `NEXT_PUBLIC_GTM_ID`
3. **Inside GTM**, create Tags (the tools you want to fire), Triggers (when to fire them), and Variables (data to pass to them):

```
Tags installed inside GTM (no more code changes needed):
├── GA4 Configuration Tag      → fires on all pages
├── GA4 Event: contact_form_submit  → fires when form submits
├── Meta Pixel Base Code        → fires on all pages
├── Meta Pixel Lead Event       → fires when form submits
├── Google Ads Conversion       → fires on /thank-you page
└── LinkedIn Insight Tag        → fires on all pages
```

### Firing Custom Events from Next.js to GTM

Your Next.js code pushes events to the **dataLayer** — a JavaScript array that GTM reads. GTM then decides which tags to fire based on those events:

```typescript
// lib/analytics.ts — All your custom event functions
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Push an event to GTM's dataLayer
function pushEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event, ...data });
  }
}

// Pre-built marketing events
export const analytics = {
  formSubmit: (formId: string, service?: string) =>
    pushEvent('form_submit', { form_id: formId, service_selected: service }),

  phoneClick: (phone: string) =>
    pushEvent('phone_click', { phone_number: phone }),

  ctaClick: (ctaLabel: string, pageSection: string) =>
    pushEvent('cta_click', { cta_label: ctaLabel, page_section: pageSection }),

  pageView: (pageName: string) =>
    pushEvent('virtual_page_view', { page_name: pageName }),
};

// Usage in any Client Component:
// import { analytics } from '@/lib/analytics';
// <button onClick={() => analytics.ctaClick('Get Free Quote', 'hero')}>Get Free Quote</button>
```

### Analytics Platform Options

| Platform | Type | Cost | Privacy Compliance | Best For |
|---|---|---|---|---|
| **GA4** | Full analytics suite | Free | Requires Consent Mode v2 + CMP | Standard; every client expects it |
| **Plausible** | Simple, privacy-first | $9/mo | GDPR-safe by design | Privacy-focused clients; EU businesses |
| **Fathom** | Simple, privacy-first | $14/mo | GDPR-safe | Similar to Plausible |
| **PostHog** | Product analytics + recordings | Free tier | Self-hostable | CRO work; user behavior analysis |
| **Mixpanel** | Event-based user analytics | Free tier | Medium | Conversion funnel analysis |
| **Vercel Analytics** | Web Vitals + visitor counts | Included in Vercel | GDPR-safe | Quick performance insights |
| **Microsoft Clarity** | Heatmaps + session recordings | Free | Good | Understanding user behavior; free Hotjar alternative |

### Meta Pixel — GTM Installation

Meta Pixel tracks which Facebook/Instagram ad campaigns convert into leads or purchases. Install it through GTM (not in code) so it respects consent settings:

1. In GTM → New Tag → Custom HTML → paste Meta Pixel base code
2. Create a **Constant Variable** named `FB Pixel ID` with your Pixel ID value
3. Create a **Custom HTML Tag** for the Lead event, triggered on your `form_submit` dataLayer event
4. All Meta Pixel tracking now controlled from GTM — no code changes needed when the Pixel ID changes[15][16]

***

## Part 14: Lead Capture, Forms, and CRM

### React Hook Form + Zod

**React Hook Form** manages form state using native browser input references (not React state), meaning forms don't re-render on every keystroke — critical for performance on form-heavy landing pages.

**Zod** validates data against a declared schema — both client-side (instant user feedback) and server-side (security). Define schemas in `lib/validations.ts` and share them between your form component and your API route.

```typescript
// lib/validations.ts
import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  service: z.enum(['plumbing', 'drain-cleaning', 'water-heater', 'emergency'], {
    errorMap: () => ({ message: 'Please select a service' }),
  }),
  message: z.string().min(10, 'Please describe your issue (minimum 10 characters)').max(1000),
  honeypot: z.string().max(0), // Bot trap — humans leave this blank; bots fill it in
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
```

```typescript
// components/sections/ContactForm.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, ContactFormValues } from '@/lib/validations';
import { analytics } from '@/lib/analytics';

export function ContactForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema), // Validates against Zod schema automatically
  });

  async function onSubmit( ContactFormValues) {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      analytics.formSubmit('contact', data.service); // Fire GTM event
      reset();
      // Show success state (Shadcn Toast or redirect to /thank-you)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input type="text" {...register('honeypot')} style={{ display: 'none' }} tabIndex={-1} />
      {/* Form fields */}
      <input type="text" placeholder="Your Name" {...register('name')} />
      {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      {/* ...remaining fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Get a Free Quote'}
      </button>
    </form>
  );
}
```

### Form Submission API Route — GHL Integration

```typescript
// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 1. Validate with Zod server-side (never trust client data)
  const result = contactFormSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  // 2. Reject bot submissions (honeypot check)
  if (result.data.honeypot) {
    return NextResponse.json({ success: true }); // Fake success to confuse bots
  }

  const { name, email, phone, service, message } = result.data;

  // 3A. Send to GoHighLevel via their Inbound Webhook
  // Get this URL from GHL: Automation > Webhooks > Create Inbound Webhook
  await fetch(process.env.GHL_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || '',
      email,
      phone: phone || '',
      customField: { service_requested: service, message },
      tags: ['website-lead', service],
    }),
  });

  // 3B. Send email notification via Resend (instant inbox notification)
  await resend.emails.send({
    from: 'leads@youragencydomain.com',
    to: process.env.CLIENT_NOTIFICATION_EMAIL!,
    subject: `New Lead: ${name} — ${service}`,
    html: `
      <h2>New Website Lead</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  });

  return NextResponse.json({ success: true });
}
```

### Email Delivery Options

| Service | Use Case | Free Tier | Next.js Support |
|---|---|---|---|
| **Resend** ✅ | Transactional email (form notifications, confirmations) | 3,000 emails/mo | Excellent — React Email templates |
| SendGrid | High-volume transactional + marketing | 100 emails/day | Good |
| AWS SES | Very high volume; lowest cost per email | No free tier | Good (complex setup) |
| Postmark | Transactional only; excellent deliverability | No free tier | Good |
| Mailgun | Transactional + API-driven | 100 emails/day | Good |

### React Email — Branded Templates

```tsx
// packages/email/src/lead-notification.tsx
import { Html, Head, Body, Container, Text, Heading, Hr } from '@react-email/components';

interface LeadNotificationProps {
  clientName: string; name: string; email: string; service: string; message: string;
}

export function LeadNotificationEmail({ clientName, name, email, service, message }: LeadNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ color: '#1e40af' }}>🔔 New Lead — {clientName}</Heading>
          <Hr />
          <Text><strong>Name:</strong> {name}</Text>
          <Text><strong>Email:</strong> {email}</Text>
          <Text><strong>Service:</strong> {service}</Text>
          <Text><strong>Message:</strong> {message}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```


***

### Email Marketing Platform Integrations

When a client runs email marketing (newsletters, promotions, drip campaigns), your site's newsletter signup forms need to push new subscribers directly into their email platform via API.

| Platform | Best For | Free Tier | API |
|---|---|---|---|
| **Mailchimp** | SMBs with newsletters | 500 contacts, 1,000 sends/mo | REST API |
| **Kit (ConvertKit)** | Creators, coaches, course sellers | 10,000 subscribers | REST API |
| **Klaviyo** | E-commerce clients | 250 contacts | REST API + Events |
| **Brevo (ex-Sendinblue)** | Budget-conscious clients; EU GDPR-friendly | 300 emails/day | REST API |
| **ActiveCampaign** | Automation-heavy SMBs | None | REST API |
| **Beehiiv** | Newsletter-focused clients | 2,500 subscribers | REST API |

```typescript
// Example: Subscribe to Mailchimp from a Next.js API route
// app/api/subscribe/route.ts

export async function POST(request: Request) {
  const { email, firstName } = await request.json();

  // Mailchimp uses MD5 hash of lowercased email as subscriber ID
  const subscriberHash = crypto
    .createHash('md5')
    .update(email.toLowerCase())
    .digest('hex');

  const response = await fetch(
    `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`,
    {
      method: 'PUT', // PUT upserts — adds new or updates existing subscriber
      headers: {
        Authorization: `Bearer ${process.env.MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: 'subscribed', // Or 'pending' for double opt-in (GDPR compliant)
        merge_fields: { FNAME: firstName },
        tags: ['website-signup'],
      }),
    }
  );

  if (!response.ok) {
    return Response.json({ error: 'Subscription failed' }, { status: 500 });
  }
  return Response.json({ success: true });
}
```

**Double opt-in vs single opt-in**: For EU clients, use `status_if_new: 'pending'` — this sends a confirmation email before adding the subscriber. This is required for GDPR compliance in Europe. US clients can use `'subscribed'` for immediate enrollment.

***

## Part 15: Live Chat

A live chat widget lets website visitors start a conversation with the business in real time. For local service businesses (plumbers, dentists, law firms), chat converts significantly better than contact forms because it feels immediate — the visitor gets an answer in minutes instead of waiting for an email callback.

### Live Chat Platform Comparison

| Platform | Free Plan | Paid Starting Price | AI Chatbot | GHL Integration | Best For |
|---|---|---|---|---|---|
| **Crisp** ✅ | 2 agents, unlimited conversations | $45/mo (4 agents) | Yes (paid) | Via webhook | **Agency default — best free tier** |
| **Tidio** | 50 conversations/mo, 10 agents | ~$29/mo (100 conversations) | Yes (Lyro AI) | Yes | E-commerce + service sites |
| **Intercom** | None (trial only) | $39/seat/mo | Yes (Fin AI) | Yes | Enterprise / SaaS products |
| **Tawk.to** | Completely free (forever) | $19/mo to remove branding | Basic | Via webhook | Zero-budget clients |
| **HubSpot Chat** | Free with HubSpot CRM | Included in HubSpot tiers | Yes | Via HubSpot | Clients already using HubSpot |
| **Drift** | None | $2,500/mo (enterprise) | Yes | Yes | Enterprise B2B only |

[1][2][3][4]

**Recommendation: Crisp for most clients.** Its free plan includes unlimited conversations with 2 agents — generous enough for small businesses that have one or two staff members handling chat. Tidio's free plan caps at 50 conversations per month, which a busy business exhausts in days. Intercom has no free tier and starts at enterprise pricing.[3][5][6][1]

**For clients using GoHighLevel**: GHL includes a built-in chat widget that feeds conversations directly into the GHL inbox and CRM. Consider using this instead of a third-party chat tool to simplify the client's workflow stack.

### Chat Widget Installation in Next.js

Because chat widgets are heavy third-party scripts, always load them with `strategy="lazyOnload"` — they load during idle time, completely after the page is interactive, never touching your LCP score:

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>

      {/* Crisp chat widget — loads during idle time, after everything else */}
      <Script
        id="crisp-widget"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.$crisp = [];
            window.CRISP_WEBSITE_ID = "${process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID}";
            (function() {
              var d = document;
              var s = d.createElement("script");
              s.src = "https://client.crisp.chat/l.js";
              s.async = 1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `,
        }}
      />
    </Script>
  );
}
```

**Hiding chat on specific pages**: Landing pages designed for paid ads should not have a chat widget — it distracts from the conversion goal. Suppress it conditionally:

```typescript
'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ChatController() {
  const pathname = usePathname();
  const noChat = ['/lp-', '/landing-']; // Prefixes for landing pages

  useEffect(() => {
    if (!window.$crisp) return;
    const shouldHide = noChat.some(prefix => pathname.startsWith(prefix));
    shouldHide ? window.$crisp.push(['do', 'chat:hide']) : window.$crisp.push(['do', 'chat:show']);
  }, [pathname]);

  return null;
}
```

***

## Part 16: A/B Testing & Conversion Rate Optimization (CRO)

**CRO** is the practice of running controlled experiments on your pages to find which version of a headline, CTA button, form layout, or hero image converts more visitors into leads. A 2% improvement in conversion rate on a page receiving 1,000 visitors/month is 20 additional leads — at zero additional ad spend. This is one of the most high-leverage services an agency can offer clients.

### A/B Testing Methods

**Method 1 — Client-Side (Traditional, Avoid)**: A JavaScript snippet loads on the page, randomly shows visitors Variant A or B, and tracks results. Tools: Google Optimize (now sunset), VWO, Optimizely. Problem: the page loads with Version A, then JavaScript swaps it to Version B after load — causing a visible flash, harming CLS scores, and distorting Lighthouse measurements.

**Method 2 — Edge Middleware (Recommended)**: The routing decision (which variant to show) is made *before* any HTML is sent to the browser. The visitor receives exactly one version with zero JavaScript overhead, zero layout shift, and zero impact on Core Web Vitals.[7]

```typescript
// middleware.ts (lives at the root of your Next.js project)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run A/B test on the homepage
  if (pathname !== '/') return NextResponse.next();

  // Check if visitor already has a bucket assigned (cookie from previous visit)
  const existingBucket = request.cookies.get('ab-homepage')?.value;

  // Assign bucket: 50/50 split between control and variant
  const bucket = existingBucket ?? (Math.random() < 0.5 ? 'control' : 'variant-a');

  // Serve variant-a visitors a different page silently (URL stays as '/')
  const response = bucket === 'variant-a'
    ? NextResponse.rewrite(new URL('/homepage-variant-a', request.url))
    : NextResponse.next();

  // Store the bucket in a cookie for 30 days (consistent experience on return visits)
  response.cookies.set('ab-homepage', bucket, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'lax',
  });

  // Push bucket name to dataLayer via response header for GTM to read
  response.headers.set('x-ab-bucket', bucket);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)'],
};
```

**Method 3 — Feature Flags with Statsig or PostHog**: A more sophisticated system where variants are controlled from a dashboard without code deploys. Create a flag named `homepage-hero-cta`, configure the split percentage in the dashboard, and your code reads the flag value. Results are tracked in the Statsig/PostHog analytics dashboard with statistical significance calculations built in.[8]

### CRO Tools by Category

| Category | Tool | Cost | Purpose |
|---|---|---|---|
| **A/B Testing — Edge** | Vercel Edge Middleware ✅ | Free | Zero-JS variant routing |
| **A/B Testing — Platform** | Statsig | Free tier | Statistical rigor + feature flags |
| **Session Recording** | Microsoft Clarity | Free forever | Watch real user sessions; identify drop-offs |
| **Heatmaps** | Microsoft Clarity | Free forever | See where users click, scroll, ignore |
| **Session Recording (paid)** | PostHog | Free tier (1M events) | Full product analytics + recordings |
| **Heatmaps (paid)** | Hotjar | Free tier (35 sessions/day) | Industry standard heatmaps |
| **Funnel Analysis** | PostHog or GA4 | Free | Which steps lose the most users |
| **Popup/Overlay Testing** | Personizely | $29/mo | Exit-intent popups, CTA overlays |

**Microsoft Clarity** is the agency's secret weapon for CRO — it's completely free, installs via a single GTM tag, and provides session recordings and heatmaps with no usage limits. Install it on every client site from day one.[9]

***

## Part 17: Performance & Core Web Vitals

### The Three Metrics

Google uses **Core Web Vitals** as a direct ranking factor. All three metrics are measured from real user data (not just lab conditions) and must consistently be in the "Good" range:[10][11]

| Metric | Full Name | What It Measures | Good | Needs Improvement | Poor |
|---|---|---|---|---|---|
| **LCP** | Largest Contentful Paint | When the largest visible element loads | < 2.5s | 2.5–4.0s | > 4.0s |
| **CLS** | Cumulative Layout Shift | Visual stability (elements jumping around) | < 0.1 | 0.1–0.25 | > 0.25 |
| **INP** | Interaction to Next Paint | Responsiveness to clicks/taps | < 200ms | 200–500ms | > 500ms |

[11][12]

### LCP — Fixing the Most Common Causes

LCP is almost always your hero image, hero headline, or above-the-fold background. The fix checklist:

**1. Add `priority` to your hero image**:
```typescript
import Image from 'next/image';

// In your HeroSection component
<Image
  src={heroImageUrl}
  alt="Expert plumbers serving DFW"
  width={1200}
  height={800}
  priority={true}  // ← This adds <link rel="preload"> to <head>. CRITICAL for LCP.
  quality={85}     // WebP quality: 85 is visually identical to 100 at 40% smaller size
  sizes="(max-width: 768px) 100vw, 50vw" // Tell browser expected size at each breakpoint
/>
```

**2. Never lazy-load above-the-fold images**. Lazy loading (the default) is correct for images *below* the fold. For everything visible on page load, use `priority={true}`.

**3. Preconnect to external origins** if you fetch images from a CMS CDN:
```typescript
// app/layout.tsx — inside <head>
<link rel="preconnect" href="https://cdn.sanity.io" />
<link rel="dns-prefetch" href="https://cdn.sanity.io" />
```

**4. Set explicit `width` and `height` on every image** — prevents layout shift while images load, directly fixing CLS.

### CLS — Fixing Layout Shift

CLS happens when elements move after initial paint. Common causes and fixes:

| Cause | Fix |
|---|---|
| Images without explicit dimensions | Always set `width` and `height` on `<Image>` |
| Web fonts loading late | Use `next/font` — fonts are preloaded at build time |
| Dynamically injected banners/ads above content | Reserve space with CSS `min-height` before content loads |
| Animations resizing elements | Only animate `transform` and `opacity` (never `height`, `margin`) |
| Cookie consent banners | Position as overlay, never push page content down |

### INP — Fixing Interaction Delays

INP measures responsiveness to *all* user interactions (clicks, taps, keyboard input) throughout a session — not just the first one. It replaced FID (First Input Delay) as a Core Web Vital.

**Causes of poor INP**: Long JavaScript tasks blocking the main thread. Every JS task over 50ms is a "long task." When a user clicks during a long task, the response is delayed.

```typescript
// Fix: Break expensive state updates into non-blocking transitions
'use client';
import { useTransition, useState } from 'react';

function FilterableList({ items }) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('');

  function handleFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
    // startTransition marks this state update as non-urgent
    // React renders the input update immediately, defers the filtering
    startTransition(() => {
      setFilter(e.target.value);
    });
  }

  const filtered = items.filter(item => item.name.includes(filter));
  return (
    <>
      <input onChange={handleFilterChange} placeholder="Filter..." />
      {isPending && <span>Updating...</span>}
      <ul>{filtered.map(item => <li key={item.id}>{item.name}</li>)}</ul>
    </>
  );
}
```

### Image Optimization Summary

```typescript
// next.config.ts — Configure allowed external image domains
import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    // List every external domain you load images from
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // next/image will generate WebP and AVIF versions automatically
    formats: ['image/avif', 'image/webp'],
  },
  // Enable Partial Pre-Rendering (PPR) experimentally in Next.js 15
  experimental: {
    ppr: true,
  },
};

export default config;
```

### Third-Party Script Strategy

Every third-party script (GTM, chat widget, review badge, social embeds) steals time from your main thread. Use `next/script` loading strategies precisely:

| Strategy | When It Loads | Use For |
|---|---|---|
| `beforeInteractive` | Blocks page load | Critical polyfills only — almost never |
| `afterInteractive` ✅ | After hydration | GTM, GA4, analytics — anything that must fire early |
| `lazyOnload` ✅ | During idle time | Chat widgets, review badges, social embeds |
| `worker` | In a Web Worker (experimental) | Heavy analytics SDKs (keeps off main thread) |

***

## Part 18: Security & Compliance

### Security Headers

Configure these in `next.config.ts`. They are HTTP response headers that instruct the browser on security policies — preventing entire categories of attacks at zero performance cost:

```typescript
// next.config.ts
const securityHeaders = [
  // Prevent clickjacking — stops your site from being embedded in an iframe on a malicious site
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },

  // Stop browsers from guessing content type — prevents MIME-based attacks
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Controls how much referrer info is sent with requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Disable access to hardware features you don't use (camera, mic, location)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },

  // Force HTTPS for 2 years — tells browsers to never load this site over HTTP
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const config: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

### GDPR & CCPA Consent Management

**GDPR** (General Data Protection Regulation) is EU law. **CCPA** (California Consumer Privacy Act) covers California residents. Both require that websites ask for explicit permission before setting analytics or advertising cookies. Google's **Consent Mode v2** (mandatory since March 2024) adjusts how GA4 and Google Ads track users based on their consent choice, using **modeled conversions** to fill statistical gaps when users decline.

**The architecture**:
1. A **Consent Management Platform (CMP)** shows a cookie banner on first visit
2. The user accepts, rejects, or partially accepts cookie categories
3. The CMP stores the decision in a cookie and signals it to GTM via the Consent API
4. GTM fires tags (GA4, Meta Pixel, etc.) only when the appropriate consent is granted

**CMP Options**:

| Platform | Free Tier | GTM Consent Mode v2 | GDPR + CCPA | Recommendation |
|---|---|---|---|---|
| **Cookiebot** | Free up to 100 pages/site | Native, certified | Both | Best for EU-heavy clients |
| **Osano** | Free tier | Yes | Both | Good free option |
| **Cookie Script** | Free tier | Yes | Both | Simple setup |
| **Usercentrics** | $$ | Native, certified | Both | Enterprise clients |
| **CookieYes** | Free tier | Yes | Both | Budget-friendly |

**Do not skip this**. GDPR fines reach €20 million or 4% of global annual revenue. Even US-only businesses that have any European visitors are technically subject to GDPR. More practically, Google's analytics data quality degrades significantly without proper Consent Mode implementation — clients lose attribution data on paid campaigns.

### Environment Variable Security Checklist

```bash
# Variables that are SAFE to prefix with NEXT_PUBLIC_ (exposed to browser):
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX         # GTM container ID — public by nature
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX         # GA4 measurement ID — public by nature
NEXT_PUBLIC_CRISP_WEBSITE_ID=xxxxxxx   # Chat widget ID — public by nature
NEXT_PUBLIC_SUPABASE_URL=https://...   # Supabase URL — public by design
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # Supabase anon key — limited permissions

# Variables that must NEVER have NEXT_PUBLIC_ (server-only secrets):
SANITY_API_TOKEN=skXxx...              # Full read/write CMS access
RESEND_API_KEY=re_xxx...               # Send emails on your behalf
GHL_WEBHOOK_URL=https://...            # Your client's GHL webhook
REVALIDATE_SECRET=random-long-string   # Webhook verification token
DATABASE_URL=postgresql://...          # Full database access
STRIPE_SECRET_KEY=sk_live_xxx...       # Charge cards on your clients' behalf
```

***

## Part 19: Hosting & Deployment

### Full Platform Comparison

| Platform | Next.js Support | Free Tier | Pro Price | CDN Regions | Best For |
|---|---|---|---|---|---|
| **Vercel** ✅ | Native (creators) | 100GB bandwidth, 1 deployer | $20/user/mo | 30+ global | All Next.js marketing sites |
| **Netlify** | Good (adapter) | 100GB, 300 build min/mo | $19/user/mo | 6 regions | Multi-framework agencies |
| **Cloudflare Pages** | Good (via Workers) | Unlimited bandwidth, 500 builds/mo | $20/mo (fixed) | 300+ PoPs | Static sites; global performance priority |
| **AWS Amplify** | Good | 15GB storage, 5GB bandwidth | Pay-per-use | CloudFront | AWS-native enterprise teams |
| **Render** | Manual (Node server) | 750 hours/mo (spins down) | $7-25/mo per service | Limited | Budget self-hosted |
| **Railway** | Manual | $5 credit/mo | $5/mo + usage | Limited | Simple hobby projects |

[13][14][15]

### Vercel Pricing Reality

**Hobby tier** (free): 100 GB bandwidth/month, 100 build hours/month, 1 deploying user, 1 concurrent build, commercial use **not allowed**.[16][17]

**⚠️ Critical Agency Note**: Vercel's **Hobby tier prohibits commercial use**. The moment you deploy a paying client's website, you must be on the Pro tier. This is not a technicality — Vercel enforces this in their Terms of Service.

**Pro tier** ($20/user/month): 1 TB bandwidth/month, 400 build hours/month, 12 concurrent builds, commercial use allowed, preview deployments for every branch push, Vercel Analytics included.[18][16]

**Practical cost for an agency on Vercel Pro**: As the sole deploying member of your team, you pay $20/month for your account. Each project (client site) deployed under that account is covered. You do not pay $20 per client site — you pay $20 for your one user seat, and you can deploy unlimited projects under it (up to the bandwidth and build limits).

### Vercel vs Cloudflare Pages — When to Deviate

Vercel is the default for all Next.js sites. Consider Cloudflare Pages when:
- A client site is fully static (Astro, or Next.js SSG-only) and has global traffic — Cloudflare's 300+ Point-of-Presence edge network outperforms Vercel's 30+ regions for raw static file delivery[14][13]
- The client is extremely budget-sensitive — Cloudflare Pages has unlimited bandwidth on its free tier
- The project uses Cloudflare Workers for server-side logic (Cloudflare's equivalent of Vercel's Edge Functions)

For any Next.js site using SSR, ISR, API routes, or Edge Middleware, Vercel is definitively the better choice — these features were engineered by the same team that built Next.js.[13]

### CI/CD Pipeline with GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI Quality Gate

on:
  push:
    branches: [main, 'feature/**', 'fix/**']
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Type Check + Lint + Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript type check
        run: pnpm type-check

      - name: ESLint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test --run

  lighthouse:
    name: Lighthouse Performance Audit
    needs: quality  # Only runs if the quality job passes
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          # Uses the Vercel preview URL from the PR
          urls: ${{ env.VERCEL_PREVIEW_URL }}
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

```json
// lighthouse-budget.json — CI fails if scores drop below these thresholds
{
  "assertions": {
    "categories:performance": ["error", { "minScore": 0.85 }],
    "categories:accessibility": ["error", { "minScore": 0.90 }],
    "categories:best-practices": ["error", { "minScore": 0.90 }],
    "categories:seo": ["error", { "minScore": 0.95 }],
    "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
    "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
    "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
  }
}
```

This pipeline means: every time you (or an AI agent) push code, GitHub automatically checks TypeScript validity, ESLint compliance, unit tests, and Lighthouse scores. If anything breaks, the merge is blocked. You cannot accidentally ship a broken or slow site.

***

## Part 20: Testing & Observability

### Testing Pyramid

| Layer | Tool | What It Tests | Speed |
|---|---|---|---|
| **Unit** | **Vitest** ✅ | Individual utility functions | <30 seconds |
| **Component** | **Testing Library + Vitest** | React component render + interaction | <60 seconds |
| **E2E** | **Playwright** ✅ | Full user flows in real browser | 2-5 minutes |
| **Visual Regression** | **Chromatic** | Screenshot comparison (UI didn't break) | 5-10 minutes |
| **Performance** | **Lighthouse CI** | Core Web Vitals on every PR | 3-5 minutes |

For monorepo enforcement, add three repository-level commands and require all of them in CI:

```bash
pnpm test        # Functional suite (unit/component/e2e where defined)
pnpm test:ci     # Deterministic CI profile (affected workspaces)
pnpm test:coverage  # Strict line/function/branch/statements gate
```

Use mutation testing as a second quality gate where coverage can be misleading:

```bash
pnpm test:mutation
```

Write these four Playwright tests on day one for every client site. They catch 90% of production-breaking issues:

```typescript
// tests/e2e/critical-flows.test.ts
import { test, expect } from '@playwright/test';

test('homepage loads without errors', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Acme Plumbing/);
  // Check no console errors
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  expect(errors).toHaveLength(0);
});

test('contact form submits successfully', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('[name="name"]', 'John Smith');
  await page.fill('[name="email"]', 'john@test.com');
  await page.fill('[name="phone"]', '2145551234');
  await page.selectOption('[name="service"]', 'drain-cleaning');
  await page.fill('[name="message"]', 'My drain is clogged and water backs up.');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});

test('all navigation links work', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Services');
  await expect(page).toHaveURL(/\/services/);
  await page.click('text=About');
  await expect(page).toHaveURL(/\/about/);
});

test('mobile menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 Pro
  await page.goto('/');
  await page.click('[data-testid="mobile-menu-button"]');
  await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  await page.click('[data-testid="mobile-menu-close"]');
  await expect(page.locator('[data-testid="mobile-nav"]')).not.toBeVisible();
});
```

### Error Monitoring with Sentry

**Sentry** captures every unhandled error in your production app — server-side and client-side — with the full stack trace, the user's browser, the page they were on, and a replay of their actions. Without Sentry, you discover production errors when an angry client emails you, often hours after the issue started.

```bash
pnpm add @sentry/nextjs
pnpx @sentry/wizard@latest -i nextjs
# The wizard creates sentry.client.config.ts, sentry.server.config.ts, instrumentation.ts
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,   // Track 10% of transactions for performance monitoring
  replaysOnErrorSampleRate: 1.0,   // Always capture a replay when an error occurs
  replaysSessionSampleRate: 0.05,  // Capture 5% of all sessions for general insight
  integrations: [Sentry.replayIntegration()],
});
```

***

## Part 21: Authentication & Client Portals

If your marketing site includes a **Client Portal** — a password-protected section where clients view their reports, approve designs, or access invoices — you need authentication.

### Authentication Options

| Solution | Hosting | Free Tier | Setup Time | Best For |
|---|---|---|---|---|
| **Clerk** ✅ | Cloud (SaaS) | 10,000 MAU | 30 minutes | Agency portals — beautiful pre-built UI |
| **NextAuth.js v5 (Auth.js)** | Self-hosted | Free | 2–4 hours | Full control; no external dependency |
| **Supabase Auth** | Cloud or self-hosted | Free tier | 1 hour | Teams already using Supabase DB |
| **WorkOS** | Cloud (SaaS) | $$ | 2 hours | Enterprise SSO (SAML, Okta, Azure AD) |
| **Lucia** | Self-hosted library | Free | 3–6 hours | Developers wanting maximum control |

**Clerk** is recommended for agency client portals because it provides pre-built, fully accessible sign-in/sign-up/profile components that work natively with Next.js App Router Server Components. A client portal can be live in 30 minutes — critical when you're a solo operator.

```typescript
// middleware.ts — Protect all routes under /portal
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPortalRoute = createRouteMatcher(['/portal(.*)']);

export default clerkMiddleware((auth, req) => {
  if (isPortalRoute(req)) {
    auth().protect(); // Redirect to sign-in if not authenticated
  }
});
```

### Payment Integration: Stripe (For Client Sites)

When a client's business needs to accept payments (service deposits, booking fees, product sales):

```typescript
// app/api/checkout/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const { serviceId, serviceName, price } = await request.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: serviceName },
        unit_amount: price * 100, // Stripe uses cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/book`,
    metadata: { serviceId }, // Pass data through to your webhook handler
  });

  return Response.json({ checkoutUrl: session.url });
}
```

***

## Part 22: The Agentic Workflow — Directing Cursor & Windsurf

This section is the operational bridge between everything you have learned and actually building it. Understanding the architecture is 50% of the battle. Knowing how to communicate that architecture to your AI agent is the other 50%.

### The `.cursorrules` File

The `.cursorrules` file (or `AGENTS.md` for Windsurf and other agents) lives at the root of your repository. It is read by your AI agent at the start of every session. It is the single most important file for maintaining consistency across hundreds of agent interactions. Without it, each new session is a blank slate — the agent has no memory of your conventions, your stack choices, or your quality standards.

Think of `.cursorrules` as an employee handbook that your AI agent reads every morning before starting work.

```markdown
# .cursorrules — Agency Repository Standards
# READ THIS ENTIRE FILE BEFORE WRITING ANY CODE.

## WHO YOU ARE
You are an expert Next.js 15 developer building a marketing website for a client.
You work inside a monorepo managed with Turborepo and pnpm.
Your code must be production-quality, performant, and accessible.

## TECH STACK (NON-NEGOTIABLE)
- Framework: Next.js 15 App Router
- Language: TypeScript with strict mode. NEVER use `any` type.
- Styling: Tailwind CSS ONLY. Never write custom CSS files unless explicitly asked.
- Components: Shadcn/ui (components live in /components/ui/). Radix UI for primitives.
- Animations: Framer Motion for scroll animations and transitions.
- Forms: React Hook Form + Zod for all forms. Schemas live in /lib/validations.ts.
- CMS: Sanity.io. All queries in /lib/cms.ts using GROQ.
- Email: Resend with React Email templates in /packages/email/.
- Database: Supabase + Drizzle ORM (only when explicitly needed).

## COMPONENT RULES
- Default to SERVER COMPONENTS. Only add 'use client' when you need:
    useState, useEffect, onClick, or other browser-only APIs.
- Every component file exports one named component matching the filename.
- Use the `cn()` utility from @/lib/utils for all conditional class merging.
- Props interfaces are defined above the component function, named `ComponentNameProps`.

## PERFORMANCE RULES
- ALL images use next/image with explicit width, height, and alt text.
- Hero/above-fold images MUST include priority={true}.
- Third-party scripts use next/script with strategy="afterInteractive" or "lazyOnload".
- Never lazy-load fonts. Always use next/font.
- Animate ONLY transform and opacity properties with Framer Motion.

## SEO RULES
- Every page.tsx exports a metadata object or generateMetadata function.
- metadataBase is always set in the root layout.tsx.
- Every dynamic route has generateStaticParams for SSG.
- Blog and service pages include relevant JSON-LD schema.

## FILE STRUCTURE RULES
- New page sections go in /components/sections/
- Reusable UI primitives go in /components/ui/ (Shadcn only)
- All CMS queries: /lib/cms.ts
- All Zod schemas: /lib/validations.ts
- All analytics events: /lib/analytics.ts
- API routes: /app/api/[endpoint]/route.ts

## FORBIDDEN PATTERNS
- NEVER install moment.js. Use date-fns instead.
- NEVER use CSS-in-JS (styled-components, emotion).
- NEVER use the `any` TypeScript type.
- NEVER hardcode API keys, URLs, or secrets in code. Use environment variables.
- NEVER use <img> tags. Always use next/image.
- NEVER use <a> tags for internal links. Always use next/link.

## WHEN IN DOUBT
Ask for clarification before writing code.
If a decision has significant architectural implications, explain the options and ask which to choose.
```

### Prompt Templates for Common Tasks

These are battle-tested prompt structures. Copy, adapt, and use them directly in Cursor or Windsurf.

**Creating a new page section**:
```
Create a new React Server Component at components/sections/TestimonialsCarousel.tsx.

Read @tailwind.config.ts to understand the brand colors.
Read @components/ui/card.tsx to understand the card component API.

The component should:
- Display an array of testimonials passed as a prop
- Each testimonial has: quote (string), authorName (string), authorTitle (string), 
  rating (1-5 number), and optionally authorImage (string URL)
- Use Shadcn Card components for each testimonial
- Display star ratings using filled/empty star icons (use lucide-react)
- On desktop: 3 columns grid. On tablet: 2 columns. On mobile: 1 column.
- Each card should have a scroll-triggered fade-up animation using Framer Motion.
- Use brand colors from the Tailwind config for accents.

TypeScript interface for the testimonial prop should be in the same file.
```

**Creating a CMS-connected dynamic page**:
```
Create a dynamic service page at app/services/[service]/page.tsx.

Read @lib/cms.ts to understand existing query patterns.
Read @schemaTypes/service.ts to understand the Sanity service schema.
Read @app/layout.tsx to understand existing metadata setup.

This page should:
1. Export generateStaticParams that fetches all service slugs from Sanity using GROQ
2. Export generateMetadata that returns SEO data from the service's seo field in Sanity
3. Use ISR with revalidate = 3600
4. Display the service name, fullDescription (as rich text using @portabletext/react), 
   and a contact CTA section
5. Include LocalBusiness JSON-LD schema at the bottom using the client details 
   from @lib/client-config.ts

Add a new GROQ query function getService(slug: string) to @lib/cms.ts first.
```

**Implementing a contact form**:
```
Implement a contact form for the client.

Read @lib/validations.ts for the existing contactFormSchema.
Read @app/api/contact/route.ts to understand the submission handler.
Read @components/ui/ to see which Shadcn form components are available.

Create components/sections/ContactForm.tsx as a Client Component that:
1. Uses React Hook Form with zodResolver pointing to contactFormSchema
2. Includes fields: name, email, phone (optional), service (select dropdown), message
3. Uses Shadcn Form, Input, Select, and Textarea components for accessible markup
4. Shows inline validation errors beneath each field (red text, from Zod messages)
5. Disables the submit button and shows "Sending..." during submission
6. On success: show a Shadcn Toast with "Message sent! We'll contact you within 24 hours."
7. On error: show a Shadcn Toast with the error message from the API
8. Includes a visually hidden honeypot field for bot protection

The form should fire analytics.formSubmit() from @lib/analytics.ts on successful submission.
```

**Debugging and refactoring**:
```
@components/sections/HeroSection.tsx is failing to render the hero image correctly.

The Lighthouse report shows LCP of 4.2 seconds on this page — the hero image is
the LCP element. Read the component and:

1. Identify why the LCP is slow (look for missing priority prop, missing dimensions,
   wrong loading strategy, or wrong sizes attribute)
2. Fix the issue
3. Explain what was wrong and what you changed, in plain English

Do not change anything else in the file.
```

### Using `@` Context Mentions in Cursor

Cursor's `@` mention system feeds specific files or folders directly into the AI's context window for a given prompt. This is how you prevent the agent from making assumptions about code it hasn't read:

| Mention | What to Use It For |
|---|---|
| `@layout.tsx` | Reference when creating pages that need to match the existing layout |
| `@tailwind.config.ts` | Reference whenever styling decisions need to use brand colors/fonts |
| `@lib/cms.ts` | Reference when writing any CMS queries or data fetching |
| `@lib/validations.ts` | Reference when creating forms or API routes that need validation |
| `@components/ui/` | Reference when building sections that use Shadcn components |
| `@.cursorrules` | Force the agent to re-read its own standing instructions |
| `@package.json` | Reference when the agent needs to know what packages are installed |

**Rule**: The shorter your prompt + the more `@` context you provide, the better the output. AI agents hallucinate when they lack context. They over-explain when you over-prompt. The sweet spot is a precise task description + all relevant files `@`-mentioned.

### Common Pitfalls When Directing AI Agents

**Pitfall 1 — Open-ended instructions**: `"Build a homepage"` produces inconsistent, generic output. Instead: `"Build the homepage at app/page.tsx using the sections listed in @lib/page-content.ts. Use @tailwind.config.ts for colors. The page order is: HeroSection, StatsBar, ServicesGrid, TestimonialsCarousel, CTABanner."`

**Pitfall 2 — Not specifying Server vs Client**: If you don't specify, the agent may add `'use client'` unnecessarily (sending excess JavaScript to the browser) or omit it when it is needed (causing a runtime error). Always specify: `"This should be a Server Component"` or `"This needs useState so make it a Client Component."`

**Pitfall 3 — Letting agents install new packages without approval**: Agents frequently reach for unfamiliar packages. Before running `pnpm install` on anything the agent adds, check it on `bundlephobia.com`. Prompt the agent with: `"If you need to install a new package, ask me first and explain why. Do not install anything without explicit approval."`

**Pitfall 4 — Not reviewing generated environment variable names**: AI agents sometimes invent environment variable names that don't match your `.env.local`. After any session that involves API integrations, review the generated code against your actual env file.

***

## Part 23: Google Search Console & Post-Launch

### Google Search Console Setup

**Google Search Console (GSC)** is a free Google tool that shows you how your client's site performs in Google Search — which queries people use to find it, which pages rank, click-through rates, and any crawl errors Google encounters. Every client site must be set up in GSC at launch.

**Step-by-step setup**:

1. **Go to** search.google.com/search-console → Add Property → Domain (enter `acmeplumbing.com`)
2. **Verify ownership** via DNS TXT record: GSC gives you a string like `google-site-verification=XXXXXXXXX`
3. **In Cloudflare** → DNS → Add Record → Type: TXT → Name: `@` → Content: the verification string
4. **Wait up to 48 hours** for Google to verify → click Verify in GSC
5. **Submit your sitemap**: GSC → Sitemaps → Add sitemap URL → `https://acmeplumbing.com/sitemap.xml`
6. **Request indexing** of the homepage: GSC → URL Inspection → enter `/` → Request Indexing

**Alternative verification via `next.config.ts`** (no DNS change required):
```typescript
// app/layout.tsx — Add this to your metadata
export const metadata: Metadata = {
  verification: {
    google: 'your-verification-code-from-gsc',
  },
};
```

### Post-Launch GSC Workflow

Check GSC weekly for the first month, then monthly. Key reports to monitor:

- **Coverage report**: Shows pages Google has indexed (should match your sitemap) and any crawl errors
- **Performance report**: Click-through rate and impressions per query — identifies keyword opportunities
- **Core Web Vitals report**: Shows LCP, CLS, and INP from real user data (not lab conditions)
- **Manual Actions**: If Google has penalized the site for spam or policy violations, it appears here

***

## Part 24: Client Handoff Workflow

### Pre-Launch Handoff

Before you deliver a site to a client, your checklist:

**Technical verification:**
- [ ] `metadataBase` set to production domain in root layout
- [ ] All pages have unique `<title>` and `<meta description>` tags
- [ ] `sitemap.xml` accessible and listing all indexable pages
- [ ] `robots.txt` blocking `/api/`, `/studio/`, `/_next/`
- [ ] All images use `next/image` with explicit dimensions and `alt` text
- [ ] Fonts loaded via `next/font` (verify no `<link>` tags to Google Fonts in source)
- [ ] Security headers active (test at securityheaders.com)
- [ ] Sentry connected and capturing errors in production
- [ ] GTM firing correctly (verify via GTM Preview mode)
- [ ] GA4 receiving data (verify via GA4 Realtime DebugView)
- [ ] Contact form submissions arriving in client inbox and/or GHL
- [ ] Cookie consent banner live and connected to GTM Consent Mode v2
- [ ] Google Search Console property verified, sitemap submitted
- [ ] OG image preview correct (test at opengraph.xyz)
- [ ] Lighthouse scores meet thresholds (Performance ≥ 85, SEO = 100, Accessibility ≥ 90)
- [ ] All E2E Playwright tests passing
- [ ] SSL certificate active (padlock in browser)
- [ ] `www.` redirect to non-www (or vice versa — pick one canonical version)
- [ ] Canonical tags correct on all pages

**Client access handoff:**
- [ ] Client invited to Sanity Studio with Editor role (not Admin)
- [ ] Client invited to Google Search Console as a user
- [ ] Client invited to GA4 property as Viewer
- [ ] Client invited to GHL sub-account
- [ ] Short screen-recorded tutorial (Loom) showing how to edit content in Sanity Studio
- [ ] Documentation of all integrations set up (what platforms are connected, what each does)

### Sanity Studio Client Access

When you invite a client to Sanity, give them the **Editor** role — not Administrator. Editors can create and update content but cannot modify the Studio configuration, delete datasets, or add API tokens. This prevents clients from accidentally breaking the CMS configuration.

Access levels to grant clients across all platforms:

| Platform | Role to Grant | What They Can Do |
|---|---|---|
| Sanity | Editor | Create, edit, and publish content |
| GA4 | Viewer | See all analytics reports |
| Google Search Console | Full user | See all GSC data; cannot add/remove users |
| GHL sub-account | Admin | Full access to their account only |
| Vercel | No access needed | You manage deployments |
| Cloudflare | No access needed | You manage DNS |

***

## Part 25: Complete Agency Cost Breakdown
### Day 1 Costs (One-Time or First Month)

| Item | Cost |
|---|---|
| Domain registration (Namecheap) | ~$12/year per client domain |
| Vercel Pro (your account — covers unlimited projects) | $20/month |
| Logo/brand assets | $0 (client provides) or $50–200 (Looka, Canva Pro) |
| Stock photography (Unsplash is free; Getty/Adobe Stock) | $0–$50/month |

### Monthly Recurring — Agency Operations Stack

These are tools *you* pay for to run your agency. They are business expenses regardless of how many clients you have.

| Tool | Purpose | Free Tier | Paid Cost |
|---|---|---|---|
| **GoHighLevel Unlimited** | CRM, automation, reporting, reputation | None | $297/month |
| **Vercel Pro** | Hosting all client sites | Hobby (no commercial use) | $20/month (1 seat covers all projects) |
| **Make.com** | Workflow automation | 1,000 ops/month | $9/month |
| **Namecheap** | Domain registrar | N/A | ~$12/year per domain |
| **Cloudflare** | DNS management, CDN, security | Free (covers all clients) | $0 |
| **GitHub** | Repository hosting | Free (public + private repos) | $0–$4/month |
| **Cursor Pro** | AI coding agent | Free (limited) | $20/month |
| **Total (lean start)** | | | **~$346/month** |

### Monthly Recurring — Per Client Site

These costs vary per client depending on their content volume and traffic. Most are free at the start.

| Tool | Purpose | Free Tier | When You Upgrade |
|---|---|---|---|
| **Sanity** | CMS for content editing | Free (20 seats, generous limits) | When API calls exceed 250k/month |
| **Resend** | Email notifications from forms | 3,000 emails/month, 100/day [1] | $20/month at 50k emails/month [1] |
| **Sentry** | Error monitoring | 5,000 errors/month [2] | $26/month (Team) when project scales |
| **Crisp** | Live chat widget | 2 agents, unlimited conversations [3] | $45/month for 4 agents |
| **Supabase** | Database (if needed) | 500MB DB, 2 projects | $25/month |
| **Algolia** | Site search (if needed) | 10,000 searches/month | $50/month |
| **Clerk** | Auth for client portals | 10,000 MAU | $25/month |
| **Cookiebot** | GDPR consent management | Free up to 100 pages | $18/month |

### Realistic Monthly Cost Scenarios

**Scenario A — Just Launched, 2 Clients:**

| Item | Cost |
|---|---|
| GoHighLevel Unlimited | $297 |
| Vercel Pro | $20 |
| Cursor Pro | $20 |
| Make.com Starter | $9 |
| Cloudflare + GitHub Free | $0 |
| Sanity Free (both clients) | $0 |
| Resend Free (both clients) | $0 |
| **Monthly total** | **$346** |

**Scenario B — Established, 10 Active Clients:**

| Item | Cost |
|---|---|
| GoHighLevel Unlimited | $297 |
| Vercel Pro | $20 |
| Cursor Pro | $20 |
| Make.com Core | $9 |
| Sanity Free (most clients) | $0 |
| Resend Free (most clients) | $0 |
| Sentry (2 high-traffic clients) | $52 |
| Crisp paid (3 clients) | $135 |
| Cookiebot (EU clients) | $54 |
| Misc (domains, small tools) | ~$30 |
| **Monthly total** | **~$617** |

**Key insight**: The agency's core operational cost is dominated by GoHighLevel ($297) and Vercel ($20). Every additional client site costs effectively $0 in infrastructure at launch — your margins on client retainers are extremely high in the early months.

***

## Part 26: Pre-Launch Quality Checklist

Run through this checklist on every site before the domain goes live. Share it with your AI agent and ask it to verify each item before you close a project.

### Technical Foundation
- [ ] TypeScript compiles with zero errors (`pnpm type-check`)
- [ ] ESLint passes with zero errors (`pnpm lint`)
- [ ] All E2E Playwright tests passing locally (`pnpm test:e2e`)
- [ ] No `console.error` or `console.warn` in browser DevTools on any page
- [ ] No broken internal links (test with `pnpm dlx broken-link-checker`)
- [ ] `.env.example` committed; `.env.local` in `.gitignore` and not committed

### Performance & Core Web Vitals
- [ ] Lighthouse Performance score ≥ 85 (test in Incognito mode to exclude extensions)
- [ ] Lighthouse SEO score = 100
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Lighthouse Best Practices score ≥ 90
- [ ] All hero / above-fold images have `priority={true}` on `next/image`
- [ ] All images have explicit `width`, `height`, and descriptive `alt` attributes
- [ ] No `<img>` tags or `<a>` tags in codebase (all replaced with `next/image` and `next/link`)
- [ ] No render-blocking scripts in `<head>` (all third-party scripts use `next/script`)
- [ ] Fonts loaded via `next/font`, not `<link>` tags

### SEO
- [ ] `metadataBase` set to production domain in root `layout.tsx`
- [ ] Every page has a unique `<title>` following the `Page Name | Brand Name` template
- [ ] Every page has a unique `<meta name="description">` under 160 characters
- [ ] Canonical tag correct on every page (no duplicate URLs indexed)
- [ ] `sitemap.xml` accessible at `/sitemap.xml` and listing all indexable pages
- [ ] `robots.txt` blocking `/api/`, `/studio/`, `/_next/` routes from crawling
- [ ] JSON-LD schema correct for the page type (validate at schema.org/validator)
- [ ] OpenGraph image previews correct (test at opengraph.xyz or Twitter Card Validator)
- [ ] Google Search Console property verified, sitemap submitted

### Marketing & Integrations
- [ ] GTM container firing on all pages (verify with GTM Preview mode)
- [ ] GA4 receiving data (verify in GA4 Realtime report)
- [ ] Contact form submissions arriving in GHL and/or client inbox
- [ ] Form validation working (try submitting with empty fields; try submitting with invalid email)
- [ ] Honeypot bot trap present in all forms
- [ ] Cookie consent banner live before any tracking scripts fire
- [ ] Meta Pixel firing on relevant pages (if client runs Facebook/Instagram ads)

### Security & Compliance
- [ ] Security headers active (test at securityheaders.com — should score A or A+)
- [ ] All environment variables set in Vercel dashboard, not in committed code
- [ ] Sentry connected and capturing test errors in production environment
- [ ] HTTPS enforced on all URLs (all `http://` redirects to `https://`)
- [ ] `www.` redirects to non-www (or vice versa — pick one canonical domain)

### Client Access
- [ ] Client invited to Sanity Studio as Editor (not Admin)
- [ ] Client invited to GA4 as Viewer
- [ ] Client invited to Google Search Console as Full User
- [ ] Client has GHL sub-account access
- [ ] Loom tutorial recorded covering Sanity content editing
- [ ] Invoice/retainer set up in Stripe

***

## Part 27: Appendix — Reference Sheets

### The `next.config.ts` Master Template

```typescript
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const config: NextConfig = {
  // --- Images ---
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // --- Security Headers ---
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },

  // --- Redirects (example: legacy URL migrations) ---
  async redirects() {
    return [
      { source: '/old-services', destination: '/services', permanent: true },
    ];
  },

  // --- Performance ---
  compress: true,
  poweredByHeader: false, // Remove "X-Powered-By: Next.js" header

  // --- Experimental (Next.js 15) ---
  experimental: {
    ppr: true,              // Partial Pre-Rendering
    reactCompiler: true,    // Auto-memoization of React components
  },
};

export default config;
```

### The Complete `.env.example` Template

```bash
# ==========================================
# SITE CONFIGURATION
# ==========================================
NEXT_PUBLIC_BASE_URL=https://yourclientdomain.com
NEXT_PUBLIC_SITE_NAME="Client Business Name"

# ==========================================
# CMS — SANITY
# ==========================================
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_TOKEN=                   # Server-only read token
NEXT_PUBLIC_SANITY_PROJECT_ID=      # Same as SANITY_PROJECT_ID (for client-side Studio)
REVALIDATE_SECRET=                  # Generate: openssl rand -base64 32

# ==========================================
# ANALYTICS & TRACKING
# ==========================================
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ==========================================
# EMAIL — RESEND
# ==========================================
RESEND_API_KEY=
CLIENT_NOTIFICATION_EMAIL=owner@clientdomain.com
EMAIL_FROM=noreply@yourclientdomain.com

# ==========================================
# CRM — GOHIGHLEVEL
# ==========================================
GHL_WEBHOOK_URL=                    # Inbound webhook URL from GHL Automations

# ==========================================
# DATABASE — SUPABASE (if applicable)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only — full DB access

# ==========================================
# ERROR MONITORING — SENTRY
# ==========================================
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=                  # For source map uploads during build

# ==========================================
# LIVE CHAT — CRISP (if applicable)
# ==========================================
NEXT_PUBLIC_CRISP_WEBSITE_ID=

# ==========================================
# AUTH — CLERK (if portal exists)
# ==========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# ==========================================
# PAYMENTS — STRIPE (if applicable)
# ==========================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### AI Agent Prompt Starter Library

Save these in a `prompts/` folder at the root of your repo. Reference them at the start of new Cursor/Windsurf sessions:

**New client site initialization:**
```
I am starting a new client website. The client is [BUSINESS NAME], a [BUSINESS TYPE]
located in [CITY, STATE]. Their brand colors are: Primary [HEX], Secondary [HEX],
Accent [HEX]. Their fonts are [HEADING FONT] for headings and [BODY FONT] for body text.

Read @.cursorrules before doing anything.

Step 1: Update @tailwind.config.ts with the client's brand colors and fonts.
Step 2: Update @app/layout.tsx to use the correct next/font configuration for these fonts.
Step 3: Create a @lib/client-config.ts file with the client's NAP data
        (Name, Address, Phone, business hours, service area).
Step 4: Update the metadata defaults in @app/layout.tsx with the client's
        business name, description, and production domain.

Do not build any pages yet. Confirm each step before proceeding.
```

**New page from wireframe:**
```
I need to build the [PAGE NAME] page at [URL PATH].

The page content and structure is:
[PASTE YOUR OUTLINE OR WIREFRAME HERE]

Before writing anything:
1. Read @.cursorrules
2. Read @tailwind.config.ts for brand colors
3. Read @components/sections/ to see what section components already exist
4. Read @lib/cms.ts to understand available data queries

Build only the components and data structures needed for this page.
Reuse existing section components wherever they fit.
Create new section components only where the existing ones do not cover the need.
All new components go in @components/sections/.
```

**Debug a Lighthouse performance issue:**
```
The Lighthouse audit on [PAGE URL] is scoring [SCORE] on Performance.
The primary issue flagged is [PASTE LIGHTHOUSE FINDING].

Read the following files and identify the cause:
@app/[path]/page.tsx
@components/sections/[relevant component]
@next.config.ts

Do NOT make any changes yet. First, explain:
1. What is causing the performance issue in plain English
2. What file(s) need to change
3. What the fix will be

After I approve your plan, make only the minimum changes needed to fix this one issue.
```

**Sanity schema creation:**
```
I need a new Sanity content schema for [CONTENT TYPE].

The client needs to be able to edit the following fields:
[LIST EACH FIELD WITH: name, what type of content it is, whether it is required,
any length limits, and any helper text you want shown to the editor]

Read @sanity.config.ts to understand the existing schema setup.

Create the schema at @schemaTypes/[name].ts and register it in @sanity.config.ts.
Add TypeScript types for this schema to @types/cms.ts.
Add a GROQ query function to @lib/cms.ts that fetches this content.
```

### Decision Tree: Choosing the Right Tool

When you are unsure which tool to use for a given task, follow this decision tree:

**Rendering strategy:**
```
Does this page show the same content to every visitor?
  YES → Does it change more than once per day?
    YES → ISR with revalidate = 3600 (or lower)
    NO  → SSG (static, rebuild only on deploy or CMS webhook)
  NO  → Does it need to be fast AND personalized?
    YES → PPR (static shell + dynamic island)
    NO  → SSR (force-dynamic)
```

**Data storage:**
```
Does the data need to be edited by non-technical client staff?
  YES → Sanity CMS
  NO  → Is it user-generated (form submissions, bookings, accounts)?
    YES → Does the client already use GHL?
      YES → POST to GHL webhook (no database needed)
      NO  → Supabase + Drizzle
    NO  → Is it structured but static (team members, services)?
      YES → Sanity CMS or MDX files
      NO  → Hardcode in a TypeScript constant file (lib/data/[name].ts)
```

**Component type:**
```
Does this component need onClick, useState, useEffect, 
browser APIs, or third-party hooks?
  YES → 'use client' Client Component
  NO  → Server Component (default — no 'use client' needed)
```

**Image handling:**
```
Is this image above the fold (visible without scrolling on page load)?
  YES → next/image with priority={true}
  NO  → next/image without priority (lazy loading is default and correct)
  BACKGROUND IMAGE → Use next/image with fill and objectFit="cover",
                     wrapped in a position-relative container
```

***

## Final Thought: The Architecture is the Product

Everything in this guide reduces to a single principle: **structure precedes speed**. AI agents are extraordinarily capable when they operate inside a well-defined system. When the TypeScript types are correct, the component folders are organized, the `.cursorrules` file establishes the conventions, and the environment variables are properly scoped, an AI agent can build a production-quality service page in minutes.

Your competitive advantage as a non-traditional developer is not writing faster code — it is designing better systems that make AI coding reliable, consistent, and auditable. Every client site you ship from this foundation carries the same architecture, the same performance standards, the same security posture, and the same quality floor. That consistency compounds over time into a reputation that grows faster than any individual technical skill could.[4][5]

The framework, the CMS, the rendering strategy, the CI pipeline — none of these are the product. The trust your clients place in you to represent their business online is the product. This architecture is how you earn and keep that trust at scale.[6]

---

## Part 28: AI Content Operations

### Introduction to AI-Assisted Content

AI-assisted content operations represent a transformative opportunity for marketing agencies to scale content production while maintaining quality and brand consistency. However, implementing AI content generation requires careful consideration of safety, compliance, and brand governance.

### Core Principles

#### Safety First
- **No direct auto-publish**: All AI-generated content must pass through human review
- **Multi-layered safety checks**: PII detection, toxicity filtering, bias identification
- **Risk-based workflows**: Different approval levels based on content risk assessment
- **Compliance guardrails**: Regulatory compliance for healthcare, finance, and other regulated industries

#### Brand Consistency
- **Brand voice training**: Train AI models on approved brand content
- **Style guide enforcement**: Automatic adherence to brand formatting and tone
- **Quality scoring**: Real-time brand alignment scoring and feedback
- **Template-based generation**: Structured prompts for consistent output

#### Human Oversight
- **Strategic human input**: Humans define strategy, AI handles execution
- **Review checkpoints**: Multiple human review stages in approval workflows
- **Feedback loops**: Continuous improvement based on human corrections
- **Escalation paths**: Clear paths for handling problematic content

### Implementation Strategy

#### Phase 1: Foundation (Weeks 1-2)
1. **Define pilot scope**: Start with internal drafting only (safe mode)
2. **Document brand voice**: Create comprehensive brand guidelines
3. **Set up safety guardrails**: Configure PII, toxicity, and bias detection
4. **Establish governance framework**: Define roles and responsibilities

#### Phase 2: Brand Training (Weeks 3-4)
1. **Collect training data**: Gather approved brand content
2. **Train brand voice models**: Create AI models trained on brand content
3. **Test brand alignment**: Validate AI output against brand guidelines
4. **Refine based on feedback**: Iteratively improve brand voice accuracy

#### Phase 3: Workflow Integration (Weeks 5-6)
1. **Build approval workflows**: Configure role-based approval processes
2. **Integrate human review**: Set up review checkpoints and notifications
3. **Add compliance layers**: Implement legal and regulatory review
4. **Create audit trails**: Document all content generation and review activities

#### Phase 4: Pilot Testing (Weeks 7-8)
1. **Run internal pilot**: Test with internal content team
2. **Measure effectiveness**: Track quality, efficiency, and compliance metrics
3. **Refine processes**: Improve based on pilot results
4. **Document lessons learned**: Create implementation guide for scaling

### Risk Assessment Framework

#### Content Risk Levels
- **Low Risk**: Internal memos, drafts, non-customer-facing content
  - Auto-approval possible
  - Basic brand review sufficient
- **Medium Risk**: Blog posts, social media, email newsletters
  - Brand manager review required
  - Compliance check for regulated industries
- **High Risk**: Landing pages, marketing materials, product descriptions
  - Brand + compliance review required
  - Legal review for regulated content
- **Critical Risk**: Press releases, legal documents, healthcare content
  - Full review process required
  - Legal counsel approval mandatory

#### Safety Check Categories
1. **PII Detection**: Email addresses, phone numbers, SSNs, credit cards
2. **Toxicity Check**: Harmful language, threats, harassment
3. **Bias Detection**: Gender, racial, age, and other forms of bias
4. **Factual Accuracy**: False claims, unsubstantiated statistics
5. **Brand Compliance**: Adherence to brand voice and guidelines

### Technology Stack

#### AI Providers
- **OpenAI**: GPT-4 for general content generation
- **Anthropic**: Claude for more complex reasoning tasks
- **Multi-provider strategy**: Use different models for different use cases

#### Safety & Compliance
- **Custom safety filters**: Industry-specific content filtering
- **Compliance frameworks**: GDPR, HIPAA, SOC 2 compliance
- **Audit logging**: Complete audit trail for all content operations
- **Data retention**: Configurable retention policies based on compliance needs

#### Integration Points
- **CMS integration**: Direct integration with content management systems
- **Workflow automation**: Integration with existing approval workflows
- **Analytics tracking**: Usage and performance analytics
- **API connectivity**: RESTful APIs for system integration

### Best Practices

#### Content Generation
1. **Clear prompts**: Provide specific requirements and context
2. **Brand voice specification**: Always include brand voice ID
3. **Risk level assignment**: Match content type to appropriate risk level
4. **Human review requirement**: Never publish without human approval

#### Brand Voice Training
1. **High-quality training data**: Use only approved, well-written content
2. **Diverse content types**: Include various formats and topics
3. **Regular updates**: Retrain models with new content periodically
4. **Quality control**: Remove low-quality or outdated training documents

#### Safety & Compliance
1. **Enable all safety checks**: Never disable safety features for speed
2. **Regular compliance audits**: Periodic review of compliance status
3. **Cost monitoring**: Track usage and set appropriate limits
4. **Incident response**: Clear process for handling safety violations

### Measuring Success

#### Quality Metrics
- **Brand alignment score**: Percentage of content meeting brand guidelines
- **Compliance rate**: Percentage of content passing compliance checks
- **Human approval rate**: Percentage of AI-generated content approved by humans
- **Revision requirements**: Average number of revisions needed per content piece

#### Efficiency Metrics
- **Content generation speed**: Time from request to first draft
- **Review cycle time**: Time from generation to final approval
- **Cost efficiency**: Cost per piece of content vs. human-written content
- **Volume scaling**: Ability to increase content production volume

#### Business Impact
- **Content velocity**: Speed of content creation and publication
- **Quality consistency**: Consistency of quality across all content
- **Brand consistency**: Adherence to brand voice and guidelines
- **Risk reduction**: Reduction in compliance and legal risks

### Common Pitfalls to Avoid

#### Implementation Mistakes
1. **Skipping safety checks**: Never disable safety features for speed
2. **Insufficient training data**: Poor brand voice leads to inconsistent content
3. **Inadequate human oversight**: Relying too heavily on auto-approval
4. **Poor risk assessment**: Underestimating content risks

#### Operational Issues
1. **Inadequate training**: Team members not properly trained on AI tools
2. **Poor integration**: AI tools not integrated with existing workflows
3. **Insufficient monitoring**: Lack of ongoing quality and compliance monitoring
4. **No escalation process**: Clear process for handling problematic content

### Future Considerations

#### Emerging Technologies
- **Multimodal AI**: Image and video content generation
- **Real-time collaboration**: AI-assisted collaborative content creation
- **Advanced personalization**: Hyper-personalized content at scale
- **Voice and video**: AI-generated audio and video content

#### Regulatory Evolution
- **AI regulations**: Evolving regulations around AI-generated content
- **Copyright considerations**: Intellectual property rights for AI content
- **Transparency requirements**: Disclosure requirements for AI-generated content
- **Industry standards**: Emerging standards for AI content operations

---

Sources
[1] Pricing - Resend https://resend.com/pricing
[2] Sentry Pricing 2025 https://www.g2.com/products/sentry/pricing
[3] Pricing and plans - Crisp best deals https://crisp.chat/en/pricing/
[4] Next.js Benefits (2026): speed, SEO, server actions & when to use it https://naturaily.com/blog/nextjs-benefits
[5] How to Write .cursorrules That Actually Work - DEV Community https://dev.to/nedcodes/how-to-write-cursorrules-that-actually-work-2imd
[6] Best CRM for Marketing Agencies in 2026: Why GoHighLevel Wins ... https://ghl-services-playbooks-automation-crm-marketing.ghost.io/best-crm-for-marketing-agencies-2026-why-gohighlevel-wins/
[7] Resend Pricing in 2025: Is it Worth It? https://userjot.com/blog/resend-pricing-in-2025
[8] EmailIt vs Resend (2026) - Email Comparison - Sequenzy https://www.sequenzy.com/versus/emailit-vs-resend
[9] Resend API Pricing Calculator (2026) | BuildMVPFast https://www.buildmvpfast.com/tools/api-pricing-estimator/resend
[10] MailerSend vs Resend: Features, Pricing and User Reviews 2026 https://toolquestor.com/vs/mailersend-vs-resend
[11] Sentry Pricing - Crozdesk https://crozdesk.com/software/sentry/pricing
[12] Cloudflare Queues now available on Workers Free plan · Changelog https://developers.cloudflare.com/changelog/post/2026-02-04-queues-free-plan/
[13] What are the pricing options for Resend? - LinkGo https://linkgo.dev/faq/the-pricing-options-for-resend
[14] Sentry Software Reviews, Demo & Pricing - 2026 https://www.softwareadvice.com/application-performance-manage/sentry-profile/
[15] Cloudflare Review 2026 — Still a Top Choice or Time to Move On? https://www.youtube.com/watch?v=h7y4TatWDNs
[16] Resend vs SendGrid vs Dreamlit (2026) https://dreamlit.ai/blog/resend-vs-sendgrid-vs-dreamlit
[17] Sentry Pricing: Plans, Features, and Value Optimization https://www.spendflo.com/blog/sentry-pricing-guide
[18] Cloudflare Review (2025) - Can It Boost Your Site's Performance? https://www.websiteplanet.com/web-hosting/cloudflare/
[19] Resend vs Mailchimp Comparison (2025) https://forwardemail.net/en/blog/resend-vs-mailchimp-email-service-comparison