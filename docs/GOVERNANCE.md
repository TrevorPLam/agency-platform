# Design system governance

Lightweight governance for the shared design system (tokens, `@agency/ui`, and related packages). For detailed guidance on roles, RFCs, and cadence, see [docs/research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](../research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md) §11a.

---

## Roles

| Role | Responsibility |
|------|----------------|
| **Lead** | Vision, roadmap, change control; final say on disputes; approves major/minor releases and deprecations. |
| **Maintainers** | Steward components, docs, and CI; review and merge; enforce a11y and performance gates. |
| **Contributors** | Propose RFCs, file issues, open PRs, pilot new components. |
| **Consumers** | Use components and tokens in apps; give feedback. |

---

## Contribution workflow

Propose need and context → collaborate with the system team → review by maintainers → approve → implement and publish. For larger or breaking changes, use an **RFC** (or design doc) that captures context, proposal, impact, and migration path.

---

## Cadence

Align with [docs/development/VERSIONING.md](../development/VERSIONING.md): patch as needed, minor for backwards-compatible features, major with a review window and migration path. Without explicit governance, systems drift into ad hoc decisions; this doc is the lightweight “contract” for who decides and how.

---

## Repository classification (planned)

When adopted, repositories can be classified via structured metadata (e.g. GitHub custom properties) for governance, compliance, and policy: business_criticality, owner_team, service_tier, compliance_frameworks, data_classification, environment, security_classification, lifecycle_stage, automated_tests, ci_cd_enabled. Full schema and profiles to be documented when the system is implemented.

---

## Metadata governance (planned)

When adopted, metadata governance provides: classification schema, custom properties management, policy engine, compliance automation, risk assessment, and workflow automation, integrated with GitHub. Full architecture to be documented when implemented.

---

## Adoption (optional)

To track design system usage (e.g. which apps use `@agency/ui`, which tokens are used), use a lightweight script or grep over the repo, or integrate with Figma Library Analytics if design uses Figma. Document findings in CONTRIBUTING or here when adopted. See research §14.

---

## AI Agent Governance

The agency platform extends its governance framework to include AI/agent-specific capabilities, building upon the existing repository classification and metadata governance systems.

### Agent Classification System

AI agents are classified using the extended `@agency/governance` framework with agent-specific properties:

- **Agent Type**: Autonomous, Semi-Autonomous, Scripted, or Orchestrator
- **Autonomy Level**: Low, Medium, High, or Critical
- **Decision Scope**: Internal, Customer-Facing, System-Admin, or Cross-System
- **Authority Boundaries**: Defined decision, data, action, and system boundaries
- **Human Oversight**: Required review mechanisms and escalation paths
- **Compliance Frameworks**: HIPAA, GDPR, SOC2, ISO 27001, and custom frameworks

### Risk Assessment for Agents

The `RiskAssessmentEngine` extends to include agent-specific risk factors:

- **Autonomy Risk**: Based on agent autonomy level and decision scope
- **Human Oversight Risk**: Evaluates oversight requirements and mechanisms
- **Decision Impact Risk**: Assesses potential impact of agent decisions
- **Bias and Fairness Risk**: Monitors for bias in agent decision-making
- **Technical Risk**: Evaluates complexity of agent implementation

### Security and Auditing

Agent security is integrated into the existing `@agency/security` framework:

- **AgentAuditingSystem**: Comprehensive audit trails and compliance validation
- **Behavior Monitoring**: Real-time anomaly detection and threat analysis
- **Compliance Automation**: Framework-specific validation (HIPAA, GDPR, SOC2)
- **Session Management**: Secure agent sessions with timeout and access controls

### Governance Automation

Agent governance is automated through specialized scripts:

- **`scripts/governance/agent-governance.ts`**: Agent validation and compliance checking
- **`scripts/security/agent-security.ts`**: Continuous security monitoring and analysis
- **CI/CD Integration**: Automated agent validation in existing workflows

### Implementation Examples

```typescript
// Agent registration with governance and security
const agentProperties: AgentProperties = {
  agent_type: 'Semi-Autonomous',
  autonomy_level: 'Medium',
  decision_scope: 'Customer-Facing',
  authority_boundaries: [...],
  human_oversight_required: true,
  compliance_frameworks: ['SOC2', 'GDPR'],
  audit_trail_required: true
}

// Risk assessment
const riskEngine = new RiskAssessmentEngine()
const agentRisk = riskEngine.calculateAgentRiskScore(agentProperties)

// Security monitoring
const securityManager = new SecurityManager(config)
securityManager.registerAgent(agentId, agentProperties, authorization, frameworks)
```

### Usage and Monitoring

```bash
# Validate agent governance configuration
pnpm agent-governance validate

# Start continuous security monitoring
pnpm agent-security monitor --agent-id <agent-id>

# Generate compliance report
pnpm agent-governance compliance --agent-id <agent-id>

# Comprehensive security analysis
pnpm agent-security analyze
```

### Integration with Existing Governance

Agent governance extends rather than duplicates existing systems:

- **Repository Properties**: Leverages existing classification schema
- **Risk Assessment**: Builds on established risk assessment engine
- **Compliance Automation**: Integrates with existing compliance workflows
- **Security Framework**: Extends SBOM and integrity verification systems

### Documentation and Resources

- **`AGENTS.md`**: Comprehensive AI agent research and implementation guide
- **`packages/governance/src/types.ts`**: Agent governance type definitions
- **`packages/security/src/agent-auditing.ts`**: Agent security implementation
- **`packages/governance/src/authorization.ts`**: Agent authorization system
- **`packages/governance/src/risk.ts`**: Agent risk assessment engine

This agent governance framework ensures that AI agents are deployed and managed with the same enterprise-grade standards applied to all platform components, providing comprehensive oversight, security, and compliance for autonomous systems.
