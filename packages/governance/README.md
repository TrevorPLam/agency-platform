# @agency/governance

<div align="center">

**Enterprise governance framework for multi-tenant operations**

[![npm version](https://img.shields.io/npm/v/@agency/governance)](https://www.npmjs.org/package/@agency/governance)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![SOC 2](https://img.shields.io/badge/SOC%202-Compliant-green)](https://www.aicpa.org/socservices)

</div>

Comprehensive governance framework implementing SOC 2, ISO 27001, GDPR, and HIPAA compliance controls for multi-tenant SaaS operations with automated policy enforcement and audit trails.

## 🚀 Features

### 🏛️ **Compliance Frameworks**
- **SOC 2 Type II** - Security, availability, processing integrity controls
- **ISO 27001** - Information security management system
- **GDPR** - Data protection and privacy rights
- **HIPAA** - Healthcare data protection and BAA requirements
- **CCPA/CPRA** - California privacy compliance

### 🔒 **Security Controls**
- **Access Management** - Role-based access control (RBAC)
- **Data Classification** - Automated data sensitivity classification
- **Encryption Management** - Key rotation and encryption policies
- **Audit Logging** - Comprehensive audit trail generation
- **Incident Response** - Security incident management workflow

### 📊 **Policy Automation**
- **Policy Engine** - Real-time policy evaluation and enforcement
- **Compliance Monitoring** - Continuous compliance status monitoring
- **Risk Assessment** - Automated risk identification and scoring
- **Change Management** - Controlled change approval workflows
- **Vendor Management** - Third-party risk assessment

## 📦 Installation

```bash
pnpm add @agency/governance
```

## 🔧 Configuration

### **Environment Variables**

```bash
# Governance Configuration
GOVERNANCE_ENABLED=true
COMPLIANCE_FRAMEWORKS=soc2,iso27001,gdpr,hipaa

# Audit Configuration
AUDIT_LOG_RETENTION_DAYS=2555
AUDIT_ENCRYPTION_KEY=your_audit_encryption_key

# Risk Management
RISK_ASSESSMENT_FREQUENCY=weekly
RISK_THRESHOLD_HIGH=8.0
RISK_THRESHOLD_MEDIUM=5.0

# Notification Settings
COMPLIANCE_ALERT_EMAIL=compliance@agency.com
SECURITY_ALERT_EMAIL=security@agency.com
```

### **Framework Setup**

```typescript
// src/governance/config.ts
import { GovernanceConfig } from '@agency/governance'

export const governanceConfig: GovernanceConfig = {
  frameworks: {
    soc2: {
      enabled: true,
      controls: ['A1.1', 'A1.2', 'A2.1', 'A6.1', 'A7.1', 'A8.1'],
      reportingFrequency: 'quarterly',
      auditor: 'external-auditor'
    },
    iso27001: {
      enabled: true,
      controls: ['A.9.2', 'A.10.1', 'A.11.2', 'A.12.1', 'A.13.2'],
      certification: true,
      surveillanceAudits: 'semi-annual'
    },
    gdpr: {
      enabled: true,
      dataProcessingOfficer: 'dpo@agency.com',
      dataProtectionImpact: true,
      breachNotification: '72-hours'
    },
    hipaa: {
      enabled: true,
      businessAssociateAgreement: true,
      protectedHealthInfo: true,
      securityRule: true
    }
  },
  audit: {
    retentionDays: 2555,
    encryptionEnabled: true,
    realTimeLogging: true
  },
  risk: {
    assessmentFrequency: 'weekly',
    scoringMethodology: 'cvss',
    thresholdHigh: 8.0,
    thresholdMedium: 5.0
  }
}
```

## 🚀 Quick Start

### **Initialize Governance**

```typescript
import { GovernanceEngine } from '@agency/governance'

const governance = new GovernanceEngine(governanceConfig)

// Initialize governance framework
await governance.initialize()

// Start compliance monitoring
await governance.startMonitoring()
```

### **Access Control**

```typescript
import { AccessControl } from '@agency/governance'

const accessControl = new AccessControl()

// Check user permissions
const canAccess = await accessControl.checkPermission({
  userId: 'user-123',
  resource: 'customer-data',
  action: 'read',
  tenantId: 'acme-corp'
})

if (!canAccess) {
  throw new Error('Access denied')
}
```

### **Audit Logging**

```typescript
import { AuditLogger } from '@agency/governance'

const audit = new AuditLogger()

// Log security event
await audit.logEvent({
  eventType: 'data_access',
  userId: 'user-123',
  resource: 'customer-record-456',
  action: 'read',
  tenantId: 'acme-corp',
  metadata: {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    timestamp: new Date(),
    result: 'success'
  }
})
```

## 📚 API Reference

### **GovernanceEngine**

#### **Methods**

| Method | Description | Parameters |
|--------|-------------|------------|
| `initialize()` | Initialize governance framework | - |
| `startMonitoring()` | Start compliance monitoring | - |
| `stopMonitoring()` | Stop compliance monitoring | - |
| `getComplianceStatus()` | Get current compliance status | `framework?: string` |
| `runRiskAssessment()` | Execute risk assessment | `scope?: string` |
| `generateReport()` | Generate compliance report | `framework: string, period: DateRange` |

### **AccessControl**

#### **Methods**

| Method | Description | Parameters |
|--------|-------------|------------|
| `checkPermission(request)` | Check user permission | `PermissionRequest` |
| `grantRole(userId, role, tenantId)` | Grant role to user | `userId: string`, `role: string`, `tenantId: string` |
| `revokeRole(userId, role, tenantId)` | Revoke user role | `userId: string`, `role: string`, `tenantId: string` |
| `listUserPermissions(userId)` | List user permissions | `userId: string` |
| `updateRolePermissions(role, permissions)` | Update role permissions | `role: string`, `permissions: Permission[]` |

### **AuditLogger**

#### **Methods**

| Method | Description | Parameters |
|--------|-------------|------------|
| `logEvent(event)` | Log audit event | `AuditEvent` |
| `searchEvents(query)` | Search audit events | `AuditQuery` |
| `exportEvents(format)` | Export audit events | `format: 'json' | 'csv' | 'pdf'` |
| `getEventStatistics(period)` | Get event statistics | `period: DateRange` |
| `archiveEvents(beforeDate)` | Archive old events | `beforeDate: Date` |

### **Types**

```typescript
interface PermissionRequest {
  userId: string
  resource: string
  action: string
  tenantId: string
  context?: Record<string, any>
}

interface AuditEvent {
  eventType: string
  userId: string
  resource: string
  action: string
  tenantId: string
  timestamp: Date
  result: 'success' | 'failure'
  metadata: Record<string, any>
}

interface ComplianceStatus {
  framework: string
  status: 'compliant' | 'non-compliant' | 'pending'
  score: number
  lastAssessment: Date
  nextAssessment: Date
  issues: ComplianceIssue[]
}
```

## 🏛️ Compliance Frameworks

### **SOC 2 Implementation**

```typescript
// SOC 2 Trust Services Criteria
const soc2Controls = {
  'A1.1': {
    title: 'Security',
    description: 'Information and systems are protected against unauthorized access',
    implementation: 'accessControl',
    evidence: ['access_logs', 'permission_matrix'],
    frequency: 'continuous'
  },
  'A2.1': {
    title: 'Availability',
    description: 'Information and systems are available for operation and use',
    implementation: 'availabilityMonitoring',
    evidence: ['uptime_reports', 'incident_logs'],
    frequency: 'continuous'
  },
  'A6.1': {
    title: 'Processing Integrity',
    description: 'System processing is complete, accurate, timely, and authorized',
    implementation: 'dataValidation',
    evidence: ['processing_logs', 'validation_reports'],
    frequency: 'daily'
  }
}

// SOC 2 Audit Report
const soc2Report = await governance.generateReport('soc2', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-03-31')
})
```

### **GDPR Compliance**

```typescript
// GDPR Data Subject Rights
import { GDPRController } from '@agency/governance'

const gdpr = new GDPRController()

// Right to Access
const userData = await gdpr.rightToAccess({
  userId: 'user-123',
  tenantId: 'acme-corp',
  requestId: 'DSR-2024-001'
})

// Right to Erasure (Right to be Forgotten)
await gdpr.rightToErasure({
  userId: 'user-123',
  tenantId: 'acme-corp',
  requestId: 'DSR-2024-002',
  retentionExceptions: ['legal_hold', 'regulatory_requirement']
})

// Data Breach Notification
await gdpr.reportBreach({
  breachId: 'BR-2024-001',
  affectedUsers: ['user-123', 'user-456'],
  breachType: 'unauthorized_access',
  discoveryDate: new Date(),
  notificationDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
})
```

### **HIPAA Compliance**

```typescript
// HIPAA Security Rule
import { HIPAAController } from '@agency/governance'

const hipaa = new HIPAAController()

// Protected Health Information (PHI) Access
const phiAccess = await hipaa.accessPHI({
  userId: 'provider-123',
  patientId: 'patient-456',
  purpose: 'treatment',
  minimumNecessary: true,
  tenantId: 'healthcare-client'
})

// Business Associate Agreement (BAA) Management
await hipaa.validateBAA({
  businessAssociate: 'cloud-provider',
  services: ['data_storage', 'data_processing'],
  complianceDate: new Date(),
  renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
})
```

## 🔒 Security Controls

### **Role-Based Access Control**

```typescript
// Define roles and permissions
const roles = {
  'admin': {
    permissions: ['read', 'write', 'delete', 'manage_users'],
    scope: 'all',
    elevation: 'high'
  },
  'analyst': {
    permissions: ['read', 'write'],
    scope: ['customer_data', 'analytics'],
    elevation: 'medium'
  },
  'viewer': {
    permissions: ['read'],
    scope: ['customer_data'],
    elevation: 'low'
  }
}

// Assign role to user
await accessControl.grantRole('user-123', 'analyst', 'acme-corp')

// Check specific permission
const canReadCustomerData = await accessControl.checkPermission({
  userId: 'user-123',
  resource: 'customer_data',
  action: 'read',
  tenantId: 'acme-corp'
})
```

### **Data Classification**

```typescript
import { DataClassifier } from '@agency/governance'

const classifier = new DataClassifier()

// Classify data sensitivity
const classification = await classifier.classify({
  data: customerRecord,
  context: {
    tenantId: 'acme-corp',
    dataType: 'customer_profile',
    storageLocation: 'database'
  }
})

console.log('Data classification:', classification)
// Output: {
//   level: 'confidential',
//   category: 'personal_data',
//   retentionPeriod: 2555,
//   encryptionRequired: true,
//   accessControls: ['role_based', 'multi_factor']
// }
```

### **Encryption Management**

```typescript
import { EncryptionManager } from '@agency/governance'

const encryption = new EncryptionManager()

// Generate encryption key
const key = await encryption.generateKey({
  algorithm: 'AES-256-GCM',
  keyUsage: ['encrypt', 'decrypt'],
  tenantId: 'acme-corp'
})

// Encrypt sensitive data
const encrypted = await encryption.encrypt({
  data: sensitiveCustomerData,
  keyId: key.id,
  tenantId: 'acme-corp'
})

// Decrypt data
const decrypted = await encryption.decrypt({
  encryptedData: encrypted,
  keyId: key.id,
  tenantId: 'acme-corp'
})
```

## 📊 Risk Management

### **Risk Assessment**

```typescript
import { RiskManager } from '@agency/governance'

const riskManager = new RiskManager()

// Conduct risk assessment
const assessment = await riskManager.assessRisk({
  asset: 'customer_database',
  threats: ['unauthorized_access', 'data_breach', 'service_disruption'],
  vulnerabilities: ['weak_authentication', 'outdated_patches'],
  impact: 'high',
  likelihood: 'medium',
  tenantId: 'acme-corp'
})

console.log('Risk assessment:', assessment)
// Output: {
//   riskScore: 7.5,
//   riskLevel: 'high',
//   mitigationPlan: [
//     'Implement MFA for all users',
//     'Update security patches',
//     'Add database encryption'
//   ],
//   reviewDate: new Date('2024-06-01')
}
```

### **Continuous Monitoring**

```typescript
// Set up continuous monitoring
await governance.startMonitoring({
  controls: ['access_control', 'data_encryption', 'audit_logging'],
  frequency: 'continuous',
  alertThreshold: 0.8,
  notificationChannels: ['email', 'slack']
})

// Monitor compliance status
const monitoring = await governance.getMonitoringStatus()
console.log('Compliance monitoring:', monitoring)
```

## 🚀 **Real-World Examples**

### **Customer Onboarding Compliance**

```typescript
export async function onboardCustomerWithCompliance(customerData: CustomerData) {
  // 1. Data Classification
  const classification = await classifier.classify({
    data: customerData,
    context: { dataType: 'customer_profile' }
  })
  
  // 2. Access Control Setup
  await accessControl.createCustomerTenant(customerData.id, {
    defaultRoles: ['admin'],
    permissions: ['manage_own_data'],
    dataClassification: classification.level
  })
  
  // 3. Audit Trail
  await audit.logEvent({
    eventType: 'customer_onboarding',
    resource: `customer-${customerData.id}`,
    action: 'create',
    metadata: {
      dataClassification: classification.level,
      complianceFrameworks: ['gdpr', 'soc2'],
      retentionPeriod: classification.retentionPeriod
    }
  })
  
  // 4. Risk Assessment
  await riskManager.assessCustomerRisk({
    customerId: customerData.id,
    dataVolume: 'medium',
    geographicLocation: customerData.country,
    industry: customerData.industry
  })
  
  return { success: true, complianceStatus: 'compliant' }
}
```

### **Security Incident Response**

```typescript
export async function handleSecurityIncident(incident: SecurityIncident) {
  // 1. Incident Classification
  const severity = await riskManager.classifyIncident(incident)
  
  // 2. Containment Actions
  if (severity.level === 'critical') {
    await accessControl.revokeSuspiciousAccess({
      timeWindow: 24 * 60 * 60 * 1000, // 24 hours
      riskThreshold: 0.8
    })
  }
  
  // 3. Compliance Reporting
  if (incident.dataBreach) {
    await gdpr.reportBreach({
      breachId: incident.id,
      affectedUsers: incident.affectedUsers,
      discoveryDate: incident.discoveredAt,
      notificationDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000)
    })
  }
  
  // 4. Audit Logging
  await audit.logEvent({
    eventType: 'security_incident',
    resource: incident.resource,
    action: 'response',
    metadata: {
      incidentId: incident.id,
      severity: severity.level,
      actions: incident.responseActions,
      frameworks: ['soc2', 'hipaa', 'gdpr']
    }
  })
  
  // 5. Post-Incident Review
  setTimeout(async () => {
    await riskManager.postIncidentReview(incident.id)
  }, 7 * 24 * 60 * 60 * 1000) // 7 days later
}
```

## 🆘 **Troubleshooting & Support**

### **🔧 Common Issues & Solutions**

#### **1. Compliance Check Failures**

**Symptoms**: Compliance checks failing, non-compliant status

**Solutions**:
- ✅ Verify framework configuration and controls
- ✅ Check evidence collection and logging
- ✅ Review policy implementation and enforcement
- ✅ Validate data classification and access controls

```typescript
// Debug compliance issues
const debugCompliance = async (framework: string) => {
  try {
    const status = await governance.getComplianceStatus(framework)
    console.log(`Framework: ${framework}`)
    console.log(`Status: ${status.status}`)
    console.log(`Score: ${status.score}`)
    
    // Check specific controls
    for (const issue of status.issues) {
      console.log(`Issue: ${issue.controlId}`)
      console.log(`Description: ${issue.description}`)
      console.log(`Remediation: ${issue.remediation}`)
    }
    
  } catch (error) {
    console.error('Compliance check failed:', error.message)
  }
}
```

#### **2. Access Control Problems**

**Symptoms**: Users unable to access resources, permission errors

**Solutions**:
- ✅ Verify role assignments and permissions
- ✅ Check tenant context and isolation
- ✅ Review access control policies
- ✅ Validate user authentication and identity

```typescript
// Debug access control
const debugAccessControl = async (userId: string, resource: string) => {
  try {
    // Check user roles
    const roles = await accessControl.getUserRoles(userId)
    console.log('User roles:', roles)
    
    // Check resource permissions
    const permissions = await accessControl.getResourcePermissions(resource)
    console.log('Resource permissions:', permissions)
    
    // Test access
    const canAccess = await accessControl.checkPermission({
      userId,
      resource,
      action: 'read',
      tenantId: 'test-tenant'
    })
    
    console.log('Can access:', canAccess)
    
  } catch (error) {
    console.error('Access control debug failed:', error.message)
  }
}
```

#### **3. Audit Logging Issues**

**Symptoms**: Audit events not being logged, missing evidence

**Solutions**:
- ✅ Verify audit configuration and storage
- ✅ Check logging permissions and access
- ✅ Review audit event structure and validation
- ✅ Ensure compliance with retention policies

```typescript
// Debug audit logging
const debugAuditLogging = async () => {
  try {
    // Test audit event
    const testEvent = {
      eventType: 'test_event',
      userId: 'test-user',
      resource: 'test-resource',
      action: 'test_action',
      tenantId: 'test-tenant',
      timestamp: new Date(),
      result: 'success' as const,
      metadata: { test: true }
    }
    
    await audit.logEvent(testEvent)
    console.log('Test event logged successfully')
    
    // Search for event
    const events = await audit.searchEvents({
      eventType: 'test_event',
      limit: 1
    })
    
    console.log('Found events:', events.length)
    
  } catch (error) {
    console.error('Audit logging debug failed:', error.message)
  }
}
```

### **📞 Getting Help**

**Self-Service Debugging**:
1. Check governance configuration and framework setup
2. Verify compliance control implementation
3. Review audit logs and evidence collection
4. Test access control and permissions
5. Monitor risk assessment results

**Community Support**:
- **Compliance Documentation**: [Complete compliance guide](../../docs/compliance/)
- **Security Documentation**: [Security best practices](../../SECURITY.md)
- **GitHub Issues**: [Agency Platform Issues](https://github.com/agency/platform/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/agency)
- **Email Support**: governance@agency.com

**Emergency Support**:
- **Security Incidents**: security@agency.com (immediate response)
- **Compliance Violations**: compliance@agency.com (response within 4 hours)
- **Data Breaches**: breach@agency.com (immediate response)

**Common Debug Commands**:
```bash
# Check governance configuration
pnpm run governance:check-config

# Validate compliance controls
pnpm run governance:validate-controls

# Test access control
pnpm run governance:test-access

# Check audit logging
pnpm run governance:test-audit

# Run risk assessment
pnpm run governance:assess-risk

# Generate compliance report
pnpm run governance:report
```

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🔒 Security](../../SECURITY.md) • [⚖️ Legal](../../LEGAL.md)

</div>
