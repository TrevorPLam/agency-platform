# Metadata Governance

This document describes the comprehensive metadata governance system implemented for the agency platform, enabling automated repository management, compliance tracking, and policy enforcement.

---

## Overview

The metadata governance system provides:

- **Repository Classification**: Structured metadata for consistent repository categorization
- **Custom Properties Management**: Automated management of GitHub repository properties
- **Dynamic Policy Targeting**: Ruleset enforcement based on repository metadata
- **Compliance Automation**: Automated compliance checking across frameworks
- **Risk Assessment**: Data-driven risk scoring and categorization
- **Workflow Automation**: Metadata-driven automated workflows

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Metadata Governance                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Classification  │  │ Property Mgmt   │  │ Policy Engine│ │
│  │    Schema       │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Compliance      │  │ Risk Assessment │  │ Workflow     │ │
│  │   Automation    │  │                 │  │  Automation  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    GitHub Integration                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Custom Props    │  │   Rulesets      │  │  Actions     │ │
│  │     API         │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Property Assignment** → Repository properties set via GitHub API
2. **Policy Evaluation** → Dynamic rulesets target repositories based on properties
3. **Compliance Checking** → Automated checks against framework requirements
4. **Risk Scoring** → Risk assessment based on property values
5. **Workflow Triggering** → Automated workflows triggered by property changes

---

## Repository Classification Schema

### Core Properties

#### Business Context
- **business_criticality**: Low | Medium | High | Critical
- **owner_team**: Team identifier (e.g., platform-ops, client-services)
- **service_tier**: Platform | Application | Library | Infrastructure
- **client_name**: Client identifier (for client-specific repos)
- **public_facing**: Whether repository hosts public applications

#### Compliance & Security
- **compliance_frameworks**: Array of applicable frameworks (SOC2, ISO27001, HIPAA, PCI-DSS, GDPR)
- **data_classification**: Public | Internal | Confidential | Restricted
- **environment**: Development | Staging | Production | Hybrid
- **security_classification**: Standard | Elevated | High | Critical

#### Technical Architecture
- **tech_stack**: Array of primary technologies
- **architecture_pattern**: Monolith | Microservices | Serverless | Library | Config
- **dependencies**: Internal | External | Mixed
- **build_system**: Turborepo | Webpack | Vite | Custom

#### Lifecycle & Operations
- **lifecycle_stage**: Development | Maintenance | Decommissioning | Archived
- **last_security_review**: ISO 8601 date of last security review
- **review_frequency**: Monthly | Quarterly | Semi-annual | Annual | As-needed
- **automated_tests**: Whether automated tests are present
- **ci_cd_enabled**: Whether CI/CD pipeline is configured

### Repository Profiles

#### Platform Services
```yaml
business_criticality: Critical
service_tier: Platform
owner_team: platform-ops
public_facing: false
compliance_frameworks: ["SOC2", "ISO27001"]
data_classification: Internal
environment: Production
security_classification: High
```

#### Client Applications
```yaml
business_criticality: High
service_tier: Application
owner_team: client-services
public_facing: true
compliance_frameworks: ["SOC2", "ISO27001"]
data_classification: Confidential
environment: Production
security_classification: Elevated
```

#### Shared Libraries
```yaml
business_criticality: Medium
service_tier: Library
owner_team: platform-ops
public_facing: false
compliance_frameworks: ["SOC2"]
data_classification: Internal
environment: Hybrid
security_classification: Standard
```

---

## Custom Properties Management

### Property Manager CLI

The `@agency/governance` package provides a comprehensive CLI for managing repository properties:

```bash
# Get properties for a repository
pnpm run manage-properties get <repository>

# Set properties from JSON file
pnpm run manage-properties set <repository> <properties-file>

# List all repositories with properties
pnpm run manage-properties list

# Apply predefined template
pnpm run manage-properties template <repository> <template>

# Bulk update multiple repositories
pnpm run manage-properties bulk <updates-file>
```

### Property Templates

Predefined templates for common repository types:

- **platform**: Platform service repositories
- **application**: Client application repositories  
- **library**: Shared library repositories
- **infrastructure**: Infrastructure tool repositories

### API Integration

The PropertyManager class provides TypeScript APIs for:

- Getting/setting repository properties
- Bulk operations across repositories
- Property validation and schema enforcement
- Search and filtering capabilities

---

## Dynamic Policy Targeting

### Policy Engine

The policy engine enables automated governance based on repository metadata:

```typescript
// Create policy targeting high-risk repositories
const policy = policyManager.createPolicy(
  'High-Risk Security',
  'Enhanced security for critical repositories',
  {
    business_criticality: ['Critical'],
    data_classification: ['Restricted']
  },
  [
    {
      type: 'requirement',
      name: 'Enhanced Approvals',
      condition: 'approvals: 2',
      action: 'enforce_approvals',
      enforcement: 'blocking'
    }
  ]
)
```

### Ruleset Generation

Automatically generates GitHub ruleset configurations from policy definitions:

```yaml
name: High-Risk Repository Security
target:
  repository_filters:
    - type: property
      property_name: business_criticality
      pattern: Critical
rules:
  - type: creation
    requires_approving_reviews: true
    required_approving_review_count: 2
    requires_code_scanning: true
```

### Predefined Policies

- **High-Risk Repository Security**: Enhanced controls for critical repositories
- **HIPAA Compliance Requirements**: HIPAA-specific controls for healthcare
- **Public-Facing Application Security**: Security requirements for public apps

---

## Compliance Automation

### Supported Frameworks

#### SOC 2 (Type II)
- **CC1**: Security - Access controls and ownership
- **CC3**: Information - Data classification and handling
- **CC6**: Security - Logical access controls
- **CC7**: Systems - System operations and monitoring
- **CC8**: Change - Change management and testing

#### ISO 27001
- **A.8.1**: Asset inventory and classification
- **A.9.2**: Access control policies
- **A.12.6**: Vulnerability management

#### HIPAA
- **164.308**: Administrative safeguards
- **164.312**: Technical safeguards
- **164.312(e)**: Transmission security

#### PCI DSS
- **Requirement 3**: Protect stored cardholder data
- **Requirement 4**: Encrypt cardholder data transmission
- **Requirement 7**: Restrict access to cardholder data

#### GDPR
- **Article 25**: Data protection by design and default
- **Article 32**: Security of processing

### Compliance Checking CLI

```bash
# Check compliance for specific repository
pnpm run compliance-automation check <repository>

# Check compliance for all repositories
pnpm run compliance-automation check-all

# Generate comprehensive compliance report
pnpm run compliance-automation report

# Check specific framework compliance
pnpm run compliance-automation framework <framework> <repository>

# Generate remediation plan
pnpm run compliance-automation remediate <repository>
```

### Violation Management

Automated violation detection and reporting:

- **Critical**: Immediate notification and issue creation
- **High**: Issue creation and team notification
- **Medium**: Documentation and tracking
- **Low**: Informational and recommendations

---

## Risk Assessment

### Risk Scoring Algorithm

Risk scores are calculated using weighted factors:

```
Risk Score = (Business Criticality × 0.3) +
             (Data Classification × 0.25) +
             (Security Classification × 0.2) +
             (Compliance Frameworks × 0.15) +
             (Public Facing × 0.1)
```

### Risk Categories

| Score Range | Category | Required Actions |
|------------|----------|------------------|
| 3.5 - 4.0 | Critical | Enhanced monitoring, quarterly reviews, strict policies |
| 2.8 - 3.4 | High | Monthly reviews, standard enhanced policies |
| 2.0 - 2.7 | Medium | Quarterly reviews, standard policies |
| 1.0 - 1.9 | Low | Semi-annual reviews, basic policies |

### Risk Assessment CLI

```bash
# Assess risk for specific repository
pnpm run risk-assessment assess <repository>

# Assess risk for all repositories
pnpm run risk-assessment assess-all

# Generate aggregate risk report
pnpm run risk-assessment aggregate

# Show risk trend for repository
pnpm run risk-assessment trend <repository>

# Compare risk between repositories
pnpm run risk-assessment compare <repo1> <repo2>

# Generate comprehensive risk report
pnpm run risk-assessment report
```

### Risk Factors

#### Business Criticality
- **Critical** (4.0): Core business functions, revenue impact
- **High** (3.0): Important business functions, significant impact
- **Medium** (2.0): Supporting functions, moderate impact
- **Low** (1.0): Optional functions, minimal impact

#### Data Classification
- **Restricted** (4.0): PHI, financial data, highly sensitive
- **Confidential** (3.0): Business secrets, client data
- **Internal** (2.0): Internal communications, operational data
- **Public** (1.0): Public information, marketing content

#### Security Classification
- **Critical** (4.0): Requires highest security controls
- **High** (3.0): Enhanced security measures required
- **Elevated** (2.0): Above-standard security controls
- **Standard** (1.0): Baseline security requirements

---

## Workflow Automation

### Workflow Triggers

#### Property Change Triggers
- Triggered when repository properties are modified
- Supports specific value change detection
- Enables immediate response to classification changes

#### Schedule Triggers
- Daily, weekly, monthly schedule support
- Automated periodic reviews and assessments
- Configurable timing and frequency

#### Compliance Failure Triggers
- Triggered by compliance check failures
- Severity-based response automation
- Integration with issue tracking systems

#### Risk Threshold Triggers
- Triggered when risk scores exceed thresholds
- Automated escalation procedures
- Dynamic policy application

### Workflow Actions

#### Property Management
- **set_property**: Update repository property values
- **remove_property**: Remove repository properties

#### Communication
- **create_issue**: Create GitHub issues for tracking
- **send_notification**: Send notifications to teams/channels

#### Security Operations
- **run_scan**: Trigger security scans
- **trigger_build**: Initiate CI/CD pipelines
- **apply_policy**: Apply governance policies

### Predefined Workflows

#### High-Risk Repository Onboarding
- Trigger: Business criticality or data classification change to high-risk
- Actions: Enhanced security classification, issue creation, team notification

#### Compliance Framework Activation
- Trigger: Compliance framework added to repository
- Actions: Compliance scan, issue creation, policy application

#### Risk Threshold Breach
- Trigger: Risk score exceeds critical threshold
- Actions: Critical classification, issue creation, management notification

#### Security Review Reminder
- Trigger: Monthly schedule
- Actions: Security scan, review issue creation

#### Public-Facing Application Security
- Trigger: public_facing property set to true
- Actions: Elevated security, web security scan, issue creation

### Workflow Management CLI

```bash
# Create new workflow
pnpm run metadata-workflows create <name> <description> <triggers> <actions>

# List all workflows
pnpm run metadata-workflows list

# Enable/disable workflow
pnpm run metadata-workflows enable <workflow-id>
pnpm run metadata-workflows disable <workflow-id>

# Trigger workflows manually
pnpm run metadata-workflows trigger <repo> <event> <data>

# View execution history
pnpm run metadata-workflows history [repo] [workflow-id]

# View workflow statistics
pnpm run metadata-workflows stats

# Generate predefined workflows
pnpm run metadata-workflows generate-predefined
```

---

## Implementation Guide

### Setup Requirements

1. **GitHub Access**: Organization-level admin access for custom properties
2. **API Token**: GitHub personal access token with appropriate permissions
3. **Node.js**: Version 22.x LTS required
4. **Dependencies**: @agency/governance package and dependencies

### Configuration

1. **Create config.json**:
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "organization": "your-org-name"
}
```

2. **Install dependencies**:
```bash
pnpm install --filter=@agency/governance
```

3. **Build packages**:
```bash
pnpm run build --filter=@agency/governance
```

### Initial Setup

1. **Create Custom Properties**:
   - Define property schema in GitHub organization settings
   - Use schema.json as reference for property definitions

2. **Generate Predefined Workflows**:
```bash
pnpm run metadata-workflows generate-predefined
```

3. **Apply Initial Properties**:
```bash
# Apply templates to existing repositories
pnpm run manage-properties template <repo> <template>
```

4. **Run Initial Assessments**:
```bash
# Assess all repositories
pnpm run risk-assessment assess-all
pnpm run compliance-automation check-all
```

### Ongoing Operations

#### Daily
- Automated governance workflow runs
- Property change monitoring
- Compliance check execution

#### Weekly
- Risk assessment updates
- Workflow execution review
- Policy effectiveness evaluation

#### Monthly
- Comprehensive compliance reporting
- Risk trend analysis
- Workflow optimization

#### Quarterly
- Governance policy review
- Risk assessment calibration
- Team training and documentation updates

---

## Monitoring and Reporting

### Dashboards

#### Governance Dashboard
- Repository classification overview
- Compliance status summary
- Risk assessment distribution
- Workflow execution metrics

#### Compliance Dashboard
- Framework-specific compliance status
- Violation tracking and trends
- Remediation progress
- Audit trail documentation

#### Risk Dashboard
- Risk score distribution
- High-risk repository tracking
- Risk trend analysis
- Mitigation progress

### Reports

#### Automated Reports
- Daily compliance status
- Weekly risk assessment
- Monthly governance summary
- Quarterly audit reports

#### On-Demand Reports
- Repository-specific assessments
- Framework compliance reports
- Risk analysis reports
- Workflow execution reports

### Alerts

#### Critical Alerts
- Critical compliance violations
- Risk threshold breaches
- Security classification changes
- High-risk repository creation

#### Warning Alerts
- High-severity violations
- Risk score increases
- Missed review deadlines
- Workflow execution failures

---

## Best Practices

### Property Management
- Use consistent property values across repositories
- Document property definitions and usage guidelines
- Regularly review and update property schemas
- Validate property values before assignment

### Policy Design
- Start with minimal, focused policies
- Test policies on pilot repositories first
- Document policy rationale and requirements
- Monitor policy effectiveness and impact

### Risk Assessment
- Regularly calibrate risk scoring weights
- Validate risk scores against business impact
- Use risk assessments to prioritize security efforts
- Track risk trends over time

### Workflow Automation
- Design workflows with clear triggers and actions
- Include error handling and rollback procedures
- Monitor workflow execution and success rates
- Document workflow purposes and processes

### Compliance Management
- Map compliance requirements to property values
- Automate compliance checking where possible
- Maintain comprehensive audit trails
- Regular review of compliance frameworks

---

## Troubleshooting

### Common Issues

#### Property Management
- **Error**: "Failed to set property" - Check API permissions and property schema
- **Error**: "Invalid property value" - Validate against schema definitions
- **Error**: "Property not found" - Ensure property exists in organization schema

#### Policy Application
- **Error**: "Ruleset creation failed" - Check GitHub permissions and ruleset limits
- **Error**: "Policy targeting failed" - Verify property values and filter expressions
- **Error**: "Rule enforcement failed" - Check repository permissions and rule conflicts

#### Compliance Checking
- **Error**: "Compliance check failed" - Verify repository access and property data
- **Error**: "Framework not supported" - Check framework spelling and configuration
- **Error**: "Assessment incomplete" - Ensure all required properties are set

#### Risk Assessment
- **Error**: "Risk calculation failed" - Verify property data completeness
- **Error**: "Invalid risk score" - Check weight configuration and property values
- **Error**: "Trend analysis failed" - Ensure historical assessment data exists

#### Workflow Automation
- **Error**: "Workflow execution failed" - Check trigger conditions and action permissions
- **Error**: "Action failed" - Verify action parameters and API access
- **Error**: "Workflow not found" - Check workflow ID and enabled status

### Debugging Tools

#### Property Validation
```bash
# Validate properties against schema
pnpm run validate-properties --filter=@agency/governance
```

#### Configuration Testing
```bash
# Validate risk assessment configuration
pnpm run risk-assessment validate
```

#### Workflow Testing
```bash
# Test workflow triggers manually
pnpm run metadata-workflows trigger <repo> manual '{"workflowId":"test"}'
```

#### Log Analysis
- Check GitHub Actions workflow logs
- Review property change history
- Analyze workflow execution results
- Monitor API error responses

---

## Security Considerations

### Access Control
- Limit API token permissions to minimum required
- Use organization-level permissions for property management
- Implement role-based access for governance tools
- Regularly rotate API tokens and credentials

### Data Protection
- Encrypt sensitive configuration data
- Secure storage of assessment results
- Implement audit logging for all governance operations
- Follow data retention policies for assessment data

### Privacy Compliance
- Ensure property values don't contain PII
- Follow GDPR requirements for data processing
- Implement data subject rights procedures
- Document data processing activities

---

## Integration Points

### GitHub Integration
- Custom properties API for metadata management
- Rulesets API for policy enforcement
- Issues API for compliance tracking
- Actions API for workflow automation

### CI/CD Integration
- Property validation in build pipelines
- Compliance checking in deployment workflows
- Risk assessment in release processes
- Automated testing for governance requirements

### Monitoring Integration
- Metrics collection for governance KPIs
- Alert routing for critical issues
- Dashboard integration for visibility
- Reporting integration for stakeholder communication

### Third-Party Tools
- Slack/Teams for notifications
- Jira for issue tracking
- Confluence for documentation
- Grafana for dashboard visualization

---

## Future Enhancements

### Planned Features
- AI-powered risk assessment
- Predictive compliance analysis
- Advanced workflow orchestration
- Real-time monitoring dashboards
- Mobile application for governance management

### Scalability Improvements
- Distributed property management
- Caching for performance optimization
- Parallel assessment execution
- Load balancing for API requests

### Integration Expansion
- Additional compliance frameworks
- Extended tool integrations
- Cloud provider metadata sync
- External audit system integration

---

## Support and Documentation

### Getting Help
- Review troubleshooting section for common issues
- Check GitHub Issues for known problems
- Consult API documentation for integration details
- Contact governance team for assistance

### Contributing
- Submit issues for bugs and feature requests
- Contribute code improvements via pull requests
- Update documentation for new features
- Share best practices and lessons learned

### Training Resources
- Governance system overview presentations
- Hands-on workshop materials
- Best practice guidelines
- Case studies and examples

---

## Related Documentation

- [Repository Classification Schema](./REPOSITORY_CLASSIFICATION.md)
- [Security Documentation](../SECURITY.md)
- [Contribution Guidelines](../CONTRIBUTING.md)
- [Supply Chain Security](../security/SUPPLY_CHAIN_SECURITY.md)
- [Development Guidelines](../development/)

---

## Version History

- **v1.0.0** (March 2026): Initial implementation with core governance features
- **v1.1.0** (Planned): Enhanced workflow automation and reporting
- **v1.2.0** (Planned): AI-powered risk assessment and predictive analytics
- **v2.0.0** (Planned): Enterprise-scale enhancements and multi-org support
