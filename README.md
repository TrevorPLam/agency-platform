# Agency Platform

A multi-client marketing agency monorepo built with Next.js 16, Turborepo, and modern tooling for scalable client application development.

## Architecture

This is a **monorepo** using pnpm workspaces and Turborepo for efficient development and deployment across multiple client applications. For directory structure and isolation layers, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick Start

**Prerequisites:** Node.js 22.x, pnpm 10.x, Docker Desktop (for local Supabase). See [TOOLCHAIN.md](TOOLCHAIN.md) for versions and install commands.

Repeat these steps **on each machine** where you develop. Each environment has its own clone and `.env.local`; the repo is designed for multi-environment use.

1. **Clone and setup**

   ```bash
   git clone <repository-url>
   cd <repository-root>   # e.g. firm or agency-platform — your clone directory name
   nvm use 22
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual values (per machine; file is gitignored)
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

### Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Run ESLint across the monorepo
- `pnpm test` - Run tests across all packages
- `pnpm type-check` - TypeScript type checking
- `pnpm tokens:build` - Build design token CSS files

## Design System

This platform uses a **three-tier design token hierarchy** following W3C DTCG standards (primitive, semantic, component tokens). Each client gets custom token compilation for brand consistency while sharing core components. See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) and [docs/](docs/) for details.

## Technology Stack

Next.js 16.1 with App Router, Turborepo 2.7, pnpm 10, Tailwind CSS v4, shadcn/ui, Supabase, PostHog, Inngest, Vercel. See [docs/README.md](docs/README.md) for platform overview and metrics.

## Multi-Tenant Architecture

Row-Level Security ensures data isolation between clients; tenant resolution via hostname and middleware; per-client branding through the design token system. See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) and [SECURITY.md](SECURITY.md).

## Security

Environment variables never committed to git; service role keys server-side only; RLS on all database tables; branch protection; dependency scanning; supply chain security (SBOM, SLSA). See [SECURITY.md](SECURITY.md) and [docs/security/SUPPLY_CHAIN_SECURITY.md](docs/security/SUPPLY_CHAIN_SECURITY.md).

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — Development guidelines, local runbook, and contribution requirements
- [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) — Monorepo structure, isolation layers, and scaling phases
- [TOOLCHAIN.md](TOOLCHAIN.md) — Tool versions and setup
- [docs/](docs/) — Architecture decisions and guides

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines, coding standards, and PR process.

## License

Private - All rights reserved to the agency and its clients.

---

**Built with ❤️ for scalable agency client delivery**
