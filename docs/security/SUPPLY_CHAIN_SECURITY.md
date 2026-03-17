# Supply Chain Security

This document outlines the supply chain security measures implemented in the Agency Platform to ensure the integrity, authenticity, and security of our software supply chain.

## Overview

Supply chain security is critical for modern software development. The Agency Platform implements a comprehensive supply chain security program that includes:

- **SBOM Generation** - Complete Software Bill of Materials tracking
- **SLSA Attestations** - Build provenance and integrity verification  
- **Artifact Integrity Verification** - Cryptographic hash verification
- **Build Provenance Tracking** - Complete build history and metadata
- **Supply Chain Monitoring** - Continuous vulnerability scanning
- **Cryptographic Verification** - Digital signatures and encryption

## Architecture

### Security Package Structure

```
packages/security/
├── src/
│   ├── index.ts              # Main security manager
│   ├── types.ts              # Core security types
│   ├── sbom/                 # SBOM generation and management
│   │   └── index.ts
│   ├── integrity/            # Artifact integrity verification
│   │   └── index.ts
│   ├── provenance/           # Build provenance tracking
│   │   └── index.ts
│   ├── monitoring/           # Supply chain monitoring
│   │   └── index.ts
│   ├── agent-auditing.ts     # AI agent security and auditing
│   └── crypto.ts             # Cryptographic verification
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Security Scripts

```
scripts/security/
├── generate-sbom.ts          # SBOM generation script
├── verify-integrity.ts       # Integrity verification script
├── monitor-supply-chain.ts   # Supply chain monitoring script
├── verify-signatures.ts      # Cryptographic verification script
├── agent-security.ts         # AI agent security monitoring
└── audit-supply-chain.ts     # Comprehensive supply chain audit
```

## Implementation Details

### 1. SBOM Generation Automation

**Purpose**: Generate comprehensive Software Bill of Materials for all builds.

**Tools Used**:
- **Syft** - Primary SBOM generation tool
- **CycloneDX** - Standard SBOM format
- **SPDX** - Alternative format for compliance

**Workflow**:
1. Automated SBOM generation in CI/CD pipeline
2. Support for both CycloneDX and SPDX formats
3. Vulnerability scanning integration
4. Quality checks and validation

**Usage**:
```bash
# Generate SBOM for entire workspace
pnpm run generate-sbom

# Generate SBOM for specific app
pnpm run generate-sbom --path apps/agency-admin

# Include development dependencies
pnpm run generate-sbom --include-dev
```

**Configuration**:
```typescript
const securityConfig = {
  sbomGeneration: {
    enabled: true,
    formats: ['cyclonedx', 'spdx'],
    includeDevDependencies: false,
    excludePatterns: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/.next/**',
    ],
  },
}
```

### 2. SLSA Attestation Support

**Purpose**: Implement SLSA (Supply-chain Levels for Software Artifacts) compliance.

**SLSA Level**: 3 (Build provenance with hardened build platform)

**Features**:
- Build provenance generation
- GitHub Actions integration
- Cryptographic verification
- Attestation storage and retrieval

**Workflow**:
1. Build artifacts with provenance tracking
2. Generate SLSA attestations
3. Verify build integrity
4. Store attestations for audit

**Usage**:
```yaml
# GitHub Actions workflow
- name: Generate SLSA provenance
  uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0

- name: Generate package attestation
  uses: actions/attest-build-provenance@v1
  with:
    subject-path: build-artifacts/build-metadata.json
```

### 3. Artifact Integrity Verification

**Purpose**: Cryptographically verify artifact integrity and detect tampering.

**Algorithms**:
- **SHA-256** (default)
- **SHA-384**
- **SHA-512**

**Features**:
- File and directory hashing
- Integrity manifest generation
- Tamper detection
- CI/CD integration

**Usage**:
```bash
# Verify integrity of build artifacts
pnpm run verify-integrity --path dist/

# Generate integrity manifest
pnpm run verify-integrity --generate-manifest

# Quick integrity check for CI/CD
pnpm run verify-integrity --quick-check
```

**Configuration**:
```typescript
const securityConfig = {
  integrityVerification: {
    enabled: true,
    algorithm: 'sha256',
    verifyArtifacts: true,
  },
}
```

### 4. Build Provenance Tracking

**Purpose**: Track complete build history and metadata for audit trails.

**Tracked Information**:
- Build environment details
- Dependency resolution
- Source code commit
- Build configuration
- Materials and inputs

**Usage**:
```typescript
import { ProvenanceTracker } from '@agency/security/provenance'

const tracker = new ProvenanceTracker(config.provenanceTracking)
const provenance = await tracker.generate({
  buildId: 'build-123',
  commitSha: 'abc123',
  branch: 'main',
  // ... other options
})
```

### 5. Supply Chain Monitoring

**Purpose**: Continuous monitoring of dependencies for vulnerabilities.

**Scanning Tools**:
- **npm audit** - Official npm vulnerability scanner
- **Custom vulnerability database** - Additional threat intelligence
- **License compliance checking** - Legal compliance verification

**Features**:
- Automated vulnerability scanning
- Severity-based alerting
- Dependency update recommendations
- License compliance checking

**Usage**:
```bash
# Scan for vulnerabilities
pnpm run scan-dependencies

# Include development dependencies
pnpm run scan-dependencies --include-dev

# Set severity threshold
pnpm run scan-dependencies --severity high
```

**Configuration**:
```typescript
const securityConfig = {
  vulnerabilityScanning: {
    enabled: true,
    severityThreshold: 'HIGH',
    failOnThreshold: true,
  },
}
```

### 6. Cryptographic Verification

**Purpose**: Advanced cryptographic verification for critical artifacts.

**Supported Algorithms**:
- **Ed25519** (default for signatures)
- **RSA-SHA256** / **RSA-SHA512**
- **RSA-OAEP** (encryption)

**Features**:
- Digital signatures
- File encryption/decryption
- HMAC verification
- Multi-signature support

**Usage**:
```bash
# Generate key pair
pnpm run verify-signatures --generate-keys --key-type ed25519

# Sign a file
pnpm run verify-signatures --sign dist/app.js --key-id my-key

# Verify signature
pnpm run verify-signatures --verify dist/app.js --signature dist/app.js.sig --public-key public.pem

# Generate build proof
pnpm run verify-signatures --build-proof --path dist/
```

## CI/CD Integration

### GitHub Actions Workflows

#### SBOM Generation Workflow
```yaml
name: SBOM Generation
on: [push, pull_request]

jobs:
  generate-sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate SBOM
        run: |
          pnpm run generate-sbom \
            --output sbom-artifacts/ \
            --format cyclonedx
      - name: Upload SBOM artifacts
        uses: actions/upload-artifact@v4
        with:
          name: sbom-artifacts
          path: sbom-artifacts/
```

#### SLSA Attestation Workflow
```yaml
name: SLSA Build Attestations
on: [push, pull_request]

jobs:
  build-and-generate-provenance:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [agency-admin, firm, riley-day-care]
    steps:
      - uses: actions/checkout@v4
      - name: Build package
        run: pnpm turbo run build --filter="${{ matrix.package }}"
      - name: Generate package attestation
        uses: actions/attest-build-provenance@v1
        with:
          subject-path: build-artifacts/build-metadata.json
```

#### Security Verification Workflow
```yaml
name: Security Verification
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Scan dependencies
        run: pnpm run scan-dependencies --severity high
      - name: Verify integrity
        run: pnpm run verify-integrity --quick-check
      - name: Verify signatures
        run: pnpm run verify-signatures
```

## Security Policies

### Dependency Management

1. **Regular Updates**: Dependencies are updated regularly with security patches
2. **Vulnerability Monitoring**: Continuous scanning for new vulnerabilities
3. **License Compliance**: All dependencies must have compatible licenses
4. **Supply Chain Vetting**: New dependencies undergo security review

### Build Security

1. **Reproducible Builds**: All builds are reproducible and verifiable
2. **Provenance Tracking**: Complete build history is maintained
3. **Artifact Signing**: Critical artifacts are cryptographically signed
4. **Integrity Verification**: All artifacts are verified before deployment

### Access Control

1. **Key Management**: Cryptographic keys are securely stored and rotated
2. **Build Environment**: Build environments are hardened and monitored
3. **Audit Trails**: All security operations are logged and audited
4. **Role-Based Access**: Access is limited to authorized personnel

## Compliance Frameworks

### SOC 2 Compliance

- **Security**: Automated vulnerability scanning and monitoring
- **Availability**: Build integrity and provenance tracking
- **Processing Integrity**: Artifact verification and tamper detection
- **Confidentiality**: Encryption and access controls

### ISO 27001 Alignment

- **A.12.6**: Vulnerability management
- **A.14.2**: Secure development lifecycle
- **A.14.3**: Test data protection
- **A.16.1**: Incident management

### NIST Cybersecurity Framework

- **PR.DS**: Data security
- **PR.PS**: Protective technology
- **DE.CM**: Security continuous monitoring
- **DE.DP**: Detection processes

## Best Practices

### Development

1. **Use the security package** for all supply chain operations
2. **Generate SBOMs** for all builds and releases
3. **Sign critical artifacts** before distribution
4. **Verify dependencies** before adding to project
5. **Monitor for vulnerabilities** regularly

### Operations

1. **Verify build integrity** before deployment
2. **Check signatures** on all critical artifacts
3. **Monitor supply chain** for new threats
4. **Update security tools** regularly
5. **Audit security practices** quarterly

### Incident Response

1. **Immediate Isolation**: Isolate affected systems
2. **Impact Assessment**: Determine scope of compromise
3. **Root Cause Analysis**: Investigate supply chain breach
4. **Recovery Plan**: Restore secure operations
5. **Post-Incident Review**: Update security measures

## Troubleshooting

### Common Issues

#### SBOM Generation Failures
```bash
# Error: Syft not found
# Solution: Install Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
```

#### SLSA Attestation Errors
```bash
# Error: Permission denied
# Solution: Check GitHub Actions permissions
# Ensure attestations: write permission is granted
```

#### Integrity Verification Failures
```bash
# Error: Hash mismatch
# Solution: Check for file modifications
# Regenerate integrity manifest if changes are legitimate
```

#### Cryptographic Verification Issues
```bash
# Error: Invalid signature
# Solution: Verify correct public key is used
# Check signature format and encoding
```

### Debug Commands

```bash
# Debug SBOM generation
DEBUG=sbom:* pnpm run generate-sbom

# Debug integrity verification
DEBUG=integrity:* pnpm run verify-integrity

# Debug cryptographic operations
DEBUG=crypto:* pnpm run verify-signatures
```

## Monitoring and Alerting

### Metrics to Monitor

1. **Vulnerability Count**: Number of vulnerabilities by severity
2. **Dependency Age**: Age of dependencies in the supply chain
3. **Build Success Rate**: Success rate of verified builds
4. **Signature Verification**: Success rate of signature verification
5. **Integrity Checks**: Results of integrity verification

### 6. AI Agent Security

**Purpose**: Extend supply chain security to AI agents with comprehensive auditing, monitoring, and compliance validation.

**Implementation**:
- **AgentAuditingSystem**: Comprehensive audit trails and compliance validation
- **Behavior Monitoring**: Real-time anomaly detection and threat analysis
- **Compliance Automation**: Framework-specific validation (HIPAA, GDPR, SOC2)
- **Session Management**: Secure agent sessions with timeout and access controls

**Key Features**:
- **Agent Registration**: Centralized agent registration with governance and security monitoring
- **Risk Assessment**: Agent-specific risk factors including autonomy, decision impact, and bias risk
- **Real-time Monitoring**: Continuous behavior monitoring with anomaly detection
- **Compliance Validation**: Automated checking against major compliance frameworks

**Usage**:
```bash
# Register agent for security monitoring
pnpm agent-security register --agent-id <agent-id>

# Start continuous monitoring
pnpm agent-security monitor --agent-id <agent-id>

# Generate security analysis report
pnpm agent-security analyze
```

### Alert Configuration

```yaml
# Example alert configuration
alerts:
  critical_vulnerabilities:
    threshold: 1
    severity: critical
  high_vulnerabilities:
    threshold: 5
    severity: high
  integrity_failures:
    threshold: 1
    severity: critical
  signature_failures:
    threshold: 1
    severity: critical
  agent_anomalies:
    threshold: 1
    severity: high
  compliance_violations:
    threshold: 1
    severity: critical
```

## Future Enhancements

### Planned Improvements

1. **SLSA Level 4**: Full reproducible builds
2. **Binary Transparency**: Integration with binary transparency logs
3. **Dependency Graph**: Enhanced dependency relationship tracking
4. **Automated Updates**: Automated security patch application
5. **Threat Intelligence**: Integration with external threat feeds

### Research Areas

1. **AI-Powered Analysis**: Machine learning for anomaly detection
2. **Quantum-Resistant Cryptography**: Post-quantum cryptographic algorithms
3. **Zero-Knowledge Proofs**: Privacy-preserving verification
4. **Distributed Ledger**: Blockchain-based provenance tracking

## References

### Standards and Specifications

- [SLSA Framework](https://slsa.dev/)
- [CycloneDX Specification](https://cyclonedx.org/)
- [SPDX Specification](https://spdx.org/)
- [NIST Supply Chain Risk Management](https://www.nist.gov/itl/executiveorder14028)

### Tools and Libraries

- [Syft SBOM Generator](https://github.com/anchore/syft)
- [SLSA GitHub Generator](https://github.com/slsa-framework/slsa-github-generator)
- [GitHub Artifact Attestations](https://docs.github.com/en/actions/security-guides/using-artifact-attestations)

### Security Guidelines

- [OWASP Supply Chain Security](https://owasp.org/www-project-secure-software-development-lifecycle-practices-guide/)
- [CISA Supply Chain Security Guidance](https://www.cisa.gov/news-events/news/joint-guidance-securing-software-supply-chain)

---

**Last Updated**: March 16, 2026

**Maintainer**: Agency Platform Security Team

**Version**: 1.0.0
