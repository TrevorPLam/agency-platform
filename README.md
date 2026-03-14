# Marketing Repository

Enterprise marketing repository built with 2026 best practices, featuring a modern monorepo architecture with Next.js 15, TypeScript, and cutting-edge development tooling.

## 🏗️ Architecture

This repository follows a **layered monorepo architecture** designed for scalability and developer productivity:

```
firm/
├── apps/                    # Applications and services
│   ├── web/                # Main marketing website
│   ├── docs/               # Documentation site
│   └── blog/               # Company blog
├── packages/               # Shared libraries and utilities
│   ├── ui/                 # Reusable UI components
│   ├── utils/              # Utility functions
│   └── config/             # Shared configuration
├── tools/                  # Development tools and scripts
│   ├── scripts/            # Automation scripts
│   └── build/              # Build utilities
└── infrastructure/         # Infrastructure as Code (future)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.10.0
- **pnpm** >= 9.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd firm

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development
pnpm dev
```

### Development Workflow

```bash
# Development mode (all packages)
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm type-check

# Run tests
pnpm test

# Clean all build artifacts
pnpm clean

# Format code
pnpm format
```

## 📦 Package Management

This monorepo uses **pnpm workspaces** for efficient dependency management and **Turborepo** for build orchestration.

### Workspace Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all packages and applications
- `pnpm lint` - Run ESLint across all packages
- `pnpm test` - Run tests across all packages
- `pnpm type-check` - TypeScript type checking
- `pnpm clean` - Clean build artifacts

### Individual Package Scripts

```bash
# Work with specific packages
pnpm --filter @marketing-repository/web dev
pnpm --filter @marketing-repository/ui build
pnpm --filter @marketing-repository/utils test
```

## 🛠️ Technology Stack

### Core Technologies
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **pnpm** - Package manager
- **Turborepo** - Build orchestration

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

### Future Integrations (Planned)
- **Headless CMS** (Hygraph/Contentful)
- **AI Personalization** engine
- **Advanced Analytics** (Google Analytics 4)
- **Performance Monitoring** (Core Web Vitals)

## 🎯 Applications

### Web App (`apps/web`)
Main marketing website with:
- Next.js 15 App Router
- Server-first rendering
- Performance optimization
- AI-powered personalization (future)

### Documentation (`apps/docs`)
Technical documentation site with:
- API documentation
- Developer guides
- Architecture documentation

### Blog (`apps/blog`)
Company blog with:
- Content management integration
- SEO optimization
- Performance optimization

## 📚 Shared Packages

### UI Package (`packages/ui`)
Reusable React components:
- Design system components
- Marketing-specific components
- Accessibility features

### Utils Package (`packages/utils`)
Utility functions:
- Common helper functions
- Business logic utilities
- Type definitions

### Config Package (`packages/config`)
Shared configuration:
- TypeScript configurations
- Build configurations
- Environment setups

## 🔧 Development Environment

### IDE Configuration
The repository includes optimized configurations for:
- **VS Code** - Workspace settings and extensions
- **AI Coding Agents** - Claude Code, OpenCode configurations

### Git Configuration
- **.gitignore** - Comprehensive ignore patterns
- **.gitattributes** - Line ending normalization and language detection
- **Husky** - Pre-commit hooks for code quality

## 📊 Performance Targets

- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1
- **Build Time**: 70-85% faster than polyrepo approach
- **Developer Productivity**: 40% improvement
- **Site Performance**: 15-30% conversion rate improvement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

[License information to be added]

## 🔗 Related Documentation

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

*Built with ❤️ using 2026 enterprise best practices*
