# Versioning Policy

This document outlines the versioning strategy and procedures for the agency platform.

---

## Versioning Strategy

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/) (SemVer) for all packages and applications:

**Format**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backward-compatible functionality)
- **PATCH**: Bug fixes (backward-compatible bug fixes)

### Release Cadence

**Regular Releases**
- **Patch releases**: Weekly (as needed)
- **Minor releases**: Bi-weekly
- **Major releases**: Quarterly

**Emergency Releases**
- **Critical security fixes**: Immediate
- **Critical bug fixes**: Within 24 hours

## Package Versioning

### Internal Packages
- Use workspace protocol: `"workspace:*"`
- Publish with semantic versions
- Maintain backward compatibility when possible

### External Dependencies
- Pin exact versions for critical dependencies
- Use caret ranges for compatible updates
- Regular security updates

## Release Process

### Pre-Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Breaking changes documented

### Release Steps
1. **Version bump**: Update package.json files
2. **Changelog**: Update CHANGELOG.md
3. **Tag**: Create Git tag with version
4. **Release**: Create GitHub release
5. **Deploy**: Deploy to production
6. **Monitor**: Monitor for issues

### Post-Release
- Monitor for issues
- Update documentation
- Communicate changes
- Plan next release

## Branch Strategy

### Main Branch
- Always production-ready
- Tags for releases
- Protected from direct pushes

### Develop Branch
- Integration branch
- Next release development
- Regular merges from feature branches

### Feature Branches
- Descriptive names
- Short-lived
- Regular rebasing

## Breaking Changes

### Identification
- API changes
- Database schema changes
- Configuration changes
- Dependency updates

### Communication
- Advance notice (2 weeks)
- Migration guides
- Deprecation warnings
- Support timelines

### Migration Support
- Backward compatibility period
- Migration tools
- Documentation
- Support channels

## Changelog Management

### Format
```markdown
## [1.2.3] - 2024-03-17

### Added
- New feature description

### Changed
- Modified behavior description

### Deprecated
- Feature being deprecated

### Removed
- Removed feature description

### Fixed
- Bug fix description

### Security
- Security fix description
```

### Generation
- Automatic from commit messages
- Manual additions for clarity
- Release notes from changelog
- Historical records maintained

## Dependency Management

### Updates Strategy
- **Security updates**: Immediate
- **Patch updates**: Weekly
- **Minor updates**: Monthly
- **Major updates**: Quarterly

### Review Process
- Security vulnerability assessment
- Breaking change analysis
- Compatibility testing
- Performance impact evaluation

## Quality Assurance

### Testing Requirements
- Unit tests for all changes
- Integration tests for features
- E2E tests for user flows
- Performance tests for optimizations

### Release Testing
- Smoke tests in staging
- Feature validation
- Performance verification
- Security validation

## Rollback Procedures

### Triggers
- Critical bugs
- Security vulnerabilities
- Performance degradation
- User impact

### Process
1. **Assessment**: Evaluate impact and options
2. **Decision**: Approve rollback if necessary
3. **Execution**: Implement rollback quickly
4. **Communication**: Notify stakeholders
5. **Analysis**: Post-mortem and prevention

---

*Last updated: March 17, 2026*
*Review cycle: Monthly*
*Next review: April 17, 2026*
