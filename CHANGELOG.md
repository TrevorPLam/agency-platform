# Changelog

All notable changes to the Agency Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- DORA Metrics Implementation & Automation (TASK-017)
  - Complete @agency/metrics package with TypeScript calculators
  - Interactive dashboard in agency-admin with real-time metrics
  - GitHub Actions workflow for automated collection and alerting
  - GitHub webhook handlers for push, PR, and issues events
  - Database schema with proper indexes and RLS policies
  - Multiple output formats: CLI, HTML dashboard, JSON API
- Documentation coverage assessment and improvements
- LICENSE file for private repository
- CHANGELOG.md for tracking changes

### Changed
- Fixed README.md documentation references
- Updated broken links to point to existing files
- Created AGENTS.md for error-handling package

### Fixed
- Corrected documentation paths in README.md
- Fixed security documentation references

## [0.1.0] - 2026-03-16

### Added
- Initial monorepo setup with Turborepo 2.7
- Multi-tenant architecture with Row-Level Security
- Four applications: agency-admin, firm, and two prospective clients
- Fourteen shared packages for UI, database, analytics, and more
- Comprehensive security implementation with threat modeling
- Design token system following W3C DTCG standards
- CI/CD pipeline with automated testing and security scans
- Documentation structure with 28+ files
- AI agent governance and development guidelines

### Security
- Row-Level Security on all database tables
- Service role key protection (server-side only)
- Tenant isolation via app_metadata
- Comprehensive audit trails
- HIPAA-ready architecture
- Supply chain security with SBOM generation

### Documentation
- README.md with comprehensive project overview
- AGENTS.md files for all packages and applications
- Security documentation with threat vectors
- Architecture and operations guides
- AI development guidelines

---

## Versioning Policy

This project uses semantic versioning:
- **MAJOR**: Breaking changes that require client updates
- **MINOR**: New features and improvements (backward compatible)
- **PATCH**: Bug fixes and documentation updates

### Release Cadence

- **Major releases**: As needed for architectural changes
- **Minor releases**: Monthly for feature updates
- **Patch releases**: As needed for bug fixes and security updates

### Change Categories

- **Added**: New features, packages, or capabilities
- **Changed**: Modifications to existing functionality
- **Deprecated**: Features that will be removed in future versions
- **Removed**: Features removed from current version
- **Fixed**: Bug fixes and issue resolutions
- **Security**: Security-related changes and improvements
