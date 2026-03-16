# Repository Classification Schema

This document defines the comprehensive repository classification schema for the agency platform, enabling automated governance, compliance tracking, and policy enforcement through GitHub custom properties.

---

## Overview

The classification schema provides structured metadata to:
- Enable automated governance at scale
- Track compliance requirements across repositories
- Support risk-based security policies
- Facilitate audit trails and reporting
- Guide repository lifecycle management

---

## Core Properties Schema

### 1. Business Context

| Property | Type | Values | Required | Description |
|----------|------|--------|----------|-------------|
| `business_criticality` | String | `Low` \| `Medium` \| `High` \| `Critical` | ✅ | Business impact level if repository is compromised or unavailable |
| `owner_team` | String | Team identifier (e.g., `platform-ops`, `client-services`) | ✅ | Primary team responsible for repository maintenance |
| `service_tier` | String | `Platform` \| `Application` \| `Library` \| `Infrastructure` | ✅ | Architectural classification of repository purpose |
| `client_name` | String | Client identifier (for client-specific repos) | ❌ | Associated client for client work |
| `public_facing` | Boolean | `true` \| `false` | ✅ | Whether repository hosts public-facing applications/services |

### 2. Compliance & Security

| Property | Type | Values | Required | Description |
|----------|------|--------|----------|-------------|
| `compliance_frameworks` | Array | `["SOC2"]`, `["ISO27001"]`, `["HIPAA"]`, `["PCI-DSS"]`, `["GDPR"]` | ✅ | Applicable compliance frameworks |
| `data_classification` | String | `Public` \| `Internal` \| `Confidential` \| `Restricted` | ✅ | Highest data sensitivity level in repository |
| `environment` | String | `Development` \| `Staging` \| `Production` \| `Hybrid` | ✅ | Primary deployment environment |
| `security_classification` | String | `Standard` \| `Elevated` \| `High` \| `Critical` | ✅ | Security requirements level |

### 3. Technical Architecture

| Property | Type | Values | Required | Description |
|----------|------|--------|----------|-------------|
| `tech_stack` | Array | `["React"]`, `["Node.js"]`, `["TypeScript"]`, `["Python"]`, etc. | ❌ | Primary technologies used |
| `architecture_pattern` | String | `Monolith` \| `Microservices` \| `Serverless` \| `Library` \| `Config` | ❌ | Architectural pattern |
| `dependencies` | String | `Internal` \| `External` \| `Mixed` | ❌ | Dependency classification |
| `build_system` | String | `Turborepo` \| `Webpack` \| `Vite` \| `Custom` | ❌ | Build tooling |

### 4. Lifecycle & Operations

| Property | Type | Values | Required | Description |
|----------|------|--------|----------|-------------|
| `lifecycle_stage` | String | `Development` \| `Maintenance` \| `Decommissioning` \| `Archived` | ✅ | Current repository lifecycle stage |
| `last_security_review` | String | ISO 8601 date | ❌ | Date of last security review |
| `review_frequency` | String | `Monthly` \| `Quarterly` \| `Semi-annual` \| `Annual` \| `As-needed` | ❌ | Required review cadence |
| `automated_tests` | Boolean | `true` \| `false` | ✅ | Whether automated tests are present |
| `ci_cd_enabled` | Boolean | `true` \| `false` | ✅ | Whether CI/CD pipeline is configured |

---

## Repository Type Profiles

### Platform Services
```yaml
business_criticality: Critical
service_tier: Platform
owner_team: platform-ops
public_facing: false
compliance_frameworks: ["SOC2", "ISO27001"]
data_classification: Internal
environment: Production
security_classification: High
lifecycle_stage: Maintenance
automated_tests: true
ci_cd_enabled: true
```

### Client Applications
```yaml
business_criticality: High
service_tier: Application
owner_team: client-services
public_facing: true
compliance_frameworks: ["SOC2", "ISO27001"]
data_classification: Confidential
environment: Production
security_classification: Elevated
lifecycle_stage: Development
automated_tests: true
ci_cd_enabled: true
```

### Shared Libraries
```yaml
business_criticality: Medium
service_tier: Library
owner_team: platform-ops
public_facing: false
compliance_frameworks: ["SOC2"]
data_classification: Internal
environment: Hybrid
security_classification: Standard
lifecycle_stage: Maintenance
automated_tests: true
ci_cd_enabled: true
```

### Development Tools
```yaml
business_criticality: Low
service_tier: Infrastructure
owner_team: platform-ops
public_facing: false
compliance_frameworks: []
data_classification: Internal
environment: Development
security_classification: Standard
lifecycle_stage: Development
automated_tests: false
ci_cd_enabled: true
```

---

## Risk Assessment Matrix

### Risk Score Calculation

Risk scores are calculated using the formula:
```
Risk Score = (Business Criticality Weight × 0.3) + 
             (Data Classification Weight × 0.25) + 
             (Security Classification Weight × 0.2) + 
             (Compliance Frameworks Weight × 0.15) + 
             (Public Facing Weight × 0.1)
```

### Weight Mappings

#### Business Criticality
- Critical: 4.0
- High: 3.0
- Medium: 2.0
- Low: 1.0

#### Data Classification
- Restricted: 4.0
- Confidential: 3.0
- Internal: 2.0
- Public: 1.0

#### Security Classification
- Critical: 4.0
- High: 3.0
- Elevated: 2.0
- Standard: 1.0

#### Compliance Frameworks
- 4+ frameworks: 4.0
- 3 frameworks: 3.0
- 2 frameworks: 2.0
- 1 framework: 1.0
- 0 frameworks: 0.5

#### Public Facing
- true: 1.5
- false: 1.0

### Risk Categories

| Score Range | Category | Required Actions |
|------------|----------|------------------|
| 3.5 - 4.0 | Critical | Enhanced monitoring, quarterly reviews, strict policies |
| 2.8 - 3.4 | High | Monthly reviews, standard enhanced policies |
| 2.0 - 2.7 | Medium | Quarterly reviews, standard policies |
| 1.0 - 1.9 | Low | Semi-annual reviews, basic policies |

---

## Compliance Framework Mapping

### SOC 2 Controls Mapping
| Property | SOC 2 Criteria | Control Requirements |
|----------|----------------|---------------------|
| `compliance_frameworks: ["SOC2"]` | Common Criteria 1-9 | Security controls, access management |
| `data_classification: "Restricted"` | CC6.1 | Logical access controls |
| `automated_tests: true` | CC7.1 | System operation controls |
| `ci_cd_enabled: true` | CC8.1 | Change management controls |

### ISO 27001 Controls Mapping
| Property | ISO 27001 Annex | Control Requirements |
|----------|------------------|---------------------|
| `compliance_frameworks: ["ISO27001"]` | A.5-A.18 | Information security management |
| `owner_team` | A.8.1 | Asset inventory and responsibility |
| `review_frequency` | A.6.1 | Information security risk assessment |
| `security_classification` | A.9.2 | Access control policies |

### HIPAA Requirements Mapping
| Property | HIPAA Requirement | Control Requirements |
|----------|-------------------|---------------------|
| `compliance_frameworks: ["HIPAA"]` | All HIPAA rules | Dedicated infrastructure required |
| `data_classification: "Restricted"` | PHI protection | Enhanced access controls |
| `environment: "Production"` | Administrative safeguards | Audit logging and monitoring |

---

## Property Governance

### Property Management RACI

| Role | Responsibilities |
|------|------------------|
| **Enterprise Admin** | Property schema definition, enterprise-level properties |
| **Organization Owner** | Organization-level properties, policy enforcement |
| **Repository Admin** | Repository-level property values, maintenance |
| **Security Team** | Compliance framework validation, security classification |
| **Platform Team** | Technical properties, architecture classification |

### Property Validation Rules

1. **Required Properties**: All repositories must have values for required properties
2. **Value Validation**: Property values must match defined schemas
3. **Consistency Checks**: Related properties must have consistent values
4. **Change Approval**: High-impact property changes require approval
5. **Audit Trail**: All property changes are logged and auditable

### Property Lifecycle

1. **Creation**: Properties defined at organization/enterprise level
2. **Assignment**: Values set during repository creation/onboarding
3. **Maintenance**: Regular reviews and updates as repository evolves
4. **Decommissioning**: Properties archived when repository is retired

---

## Integration Points

### Ruleset Targeting
Custom properties enable dynamic ruleset targeting:

```yaml
# High-risk repositories
target: 
  business_criticality: "Critical"
  OR
  data_classification: "Restricted"
rules:
  - require_approvals: 2
  - require_code_scanning: true
  - require_status_checks: ["security-scan", "license-check"]

# Compliance repositories
target:
  compliance_frameworks: ["HIPAA", "PCI-DSS"]
rules:
  - require_signed_commits: true
  - restrict_file_paths: ["*.key", "*.pem"]
  - require_deploy_keys: true
```

### Workflow Automation
Properties trigger automated workflows:

```yaml
# Security review automation
if: security_classification == "Critical" || data_classification == "Restricted"
runs: security-review-workflow

# Compliance automation
if: contains(compliance_frameworks, "SOC2")
runs: soc2-compliance-check

# Client onboarding
if: service_tier == "Application" && client_name != null
runs: client-onboarding-workflow
```

### Reporting and Monitoring
Properties enable comprehensive reporting:

- Compliance status dashboards
- Risk assessment reports
- Repository inventory analysis
- Security posture monitoring
- Team ownership tracking

---

## Implementation Guidelines

### Property Naming Conventions
- Use snake_case for property names
- Use descriptive, meaningful names
- Avoid abbreviations and jargon
- Maintain consistent naming across organization

### Value Standards
- Use defined value sets (enums) where possible
- Document all allowed values
- Use consistent capitalization and formatting
- Provide clear descriptions for each value

### Schema Evolution
- Version property schemas
- Maintain backward compatibility
- Communicate schema changes to teams
- Provide migration paths for deprecated properties

---

## Validation and Testing

### Automated Validation
- Schema validation for property values
- Consistency checks across related properties
- Required property compliance verification
- Risk score calculation validation

### Manual Review Processes
- Quarterly property audits
- Risk assessment validation
- Compliance framework verification
- Team ownership confirmation

### Testing Procedures
- Property creation and assignment workflows
- Ruleset targeting effectiveness
- Automated policy enforcement
- Reporting and dashboard accuracy

---

## Next Steps

1. **Implement Property Schema**: Create GitHub organization/enterprise properties
2. **Develop Management Tools**: Build TypeScript utilities for property management
3. **Configure Rulesets**: Set up dynamic policy targeting
4. **Automate Workflows**: Implement property-based automation
5. **Train Teams**: Educate repository owners on property management
6. **Monitor and Iterate**: Continuously improve schema and processes

---

## Related Documentation

- [SECURITY.md](../SECURITY.md) - Security attack vectors and controls
- [GOVERNANCE.md](./GOVERNANCE.md) - Design system governance
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [docs/security/SUPPLY_CHAIN_SECURITY.md](../security/SUPPLY_CHAIN_SECURITY.md) - Supply chain security
