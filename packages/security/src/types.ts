import { z } from 'zod'

/**
 * Core security types for supply chain management
 */

// SBOM Formats
export const SBOMFormatSchema = z.enum(['cyclonedx', 'spdx'])
export type SBOMFormat = z.infer<typeof SBOMFormatSchema>

// Component information
export const ComponentSchema = z.object({
  name: z.string(),
  version: z.string(),
  type: z.enum(['library', 'framework', 'application', 'tool']),
  purl: z.string().optional(),
  cpe: z.string().optional(),
  supplier: z.string().optional(),
  author: z.string().optional(),
  copyright: z.string().optional(),
  licenses: z.array(z.string()).optional(),
  hash: z.record(z.string()).optional(),
})

export type Component = z.infer<typeof ComponentSchema>

// Vulnerability information
export const VulnerabilitySchema = z.object({
  id: z.string(),
  source: z.enum(['CVE', 'GHSA', 'OSV', 'NVD']),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  description: z.string().optional(),
  published: z.string().datetime().optional(),
  updated: z.string().datetime().optional(),
  references: z.array(z.string()).optional(),
  affected: z.array(z.string()).optional(),
})

export type Vulnerability = z.infer<typeof VulnerabilitySchema>

// SBOM Document structure
export const SBOMDocumentSchema = z.object({
  bomFormat: z.enum(['CycloneDX', 'SPDX']),
  specVersion: z.string(),
  serialNumber: z.string().optional(),
  metadata: z.object({
    timestamp: z.string().datetime(),
    tools: z.array(z.object({
      name: z.string(),
      version: z.string(),
    })).optional(),
    component: ComponentSchema.optional(),
  }),
  components: z.array(ComponentSchema),
  dependencies: z.array(z.object({
    ref: z.string(),
    dependsOn: z.array(z.string()),
  })).optional(),
  vulnerabilities: z.array(VulnerabilitySchema).optional(),
})

export type SBOMDocument = z.infer<typeof SBOMDocumentSchema>

// Integrity verification
export const IntegrityCheckSchema = z.object({
  algorithm: z.enum(['sha256', 'sha384', 'sha512']),
  hash: z.string(),
  verified: z.boolean(),
  timestamp: z.string().datetime(),
})

export type IntegrityCheck = z.infer<typeof IntegrityCheckSchema>

// Build provenance
export const BuildProvenanceSchema = z.object({
  builder: z.object({
    id: z.string(),
    version: z.string(),
  }),
  buildType: z.string(),
  invocationId: z.string().optional(),
  buildConfig: z.record(z.unknown()).optional(),
  resolvedDependencies: z.array(ComponentSchema),
  materials: z.array(z.object({
    uri: z.string(),
    digest: z.record(z.string()),
  })).optional(),
})

export type BuildProvenance = z.infer<typeof BuildProvenanceSchema>

// Security scan results
export const SecurityScanResultSchema = z.object({
  scanType: z.enum(['sbom', 'vulnerability', 'integrity', 'provenance']),
  timestamp: z.string().datetime(),
  status: z.enum(['passed', 'failed', 'warning']),
  summary: z.string(),
  details: z.record(z.unknown()).optional(),
  vulnerabilities: z.array(VulnerabilitySchema).optional(),
  recommendations: z.array(z.string()).optional(),
})

export type SecurityScanResult = z.infer<typeof SecurityScanResultSchema>

// Policy compliance
export const ComplianceCheckSchema = z.object({
  framework: z.enum(['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'NIST']),
  requirement: z.string(),
  status: z.enum(['compliant', 'non-compliant', 'partial']),
  evidence: z.array(z.string()).optional(),
  gaps: z.array(z.string()).optional(),
  lastChecked: z.string().datetime(),
})

export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>

// Security configuration
export const SecurityConfigSchema = z.object({
  sbomGeneration: z.object({
    enabled: z.boolean(),
    formats: z.array(SBOMFormatSchema),
    includeDevDependencies: z.boolean(),
    excludePatterns: z.array(z.string()),
  }),
  integrityVerification: z.object({
    enabled: z.boolean(),
    algorithm: z.enum(['sha256', 'sha384', 'sha512']),
    verifyArtifacts: z.boolean(),
  }),
  provenanceTracking: z.object({
    enabled: z.boolean(),
    slsaLevel: z.enum([1, 2, 3, 4]),
    attestations: z.boolean(),
  }),
  vulnerabilityScanning: z.object({
    enabled: z.boolean(),
    severityThreshold: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    failOnThreshold: z.boolean(),
  }),
})

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>
