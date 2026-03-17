export interface ServiceLevelObjective {
  name: string
  sli: string
  target: number
  windowDays: number
}

export interface ErrorBudgetPolicy {
  sloName: string
  burnRateThresholds: {
    fastBurn: number
    mediumBurn: number
    slowBurn: number
  }
  actions: {
    fastBurn: string
    mediumBurn: string
    slowBurn: string
  }
}

export interface ErrorClassRunbook {
  errorClass: string
  severity: 'sev1' | 'sev2' | 'sev3' | 'sev4'
  runbookPath: string
  owner: string
}

export const DEFAULT_SLOS: ServiceLevelObjective[] = [
  {
    name: 'api-availability',
    sli: 'successful_responses / total_responses excluding 4xx',
    target: 99.9,
    windowDays: 30,
  },
  {
    name: 'api-latency-p95',
    sli: 'p95 request latency under 800ms',
    target: 99.0,
    windowDays: 30,
  },
]

export const DEFAULT_ERROR_BUDGET_POLICIES: ErrorBudgetPolicy[] = [
  {
    sloName: 'api-availability',
    burnRateThresholds: {
      fastBurn: 14.4,
      mediumBurn: 6,
      slowBurn: 2,
    },
    actions: {
      fastBurn: 'Page on-call immediately and pause all non-critical deploys.',
      mediumBurn: 'Escalate to incident commander and increase monitoring frequency.',
      slowBurn: 'Create reliability issue and track remediation in current sprint.',
    },
  },
]

export const ERROR_CLASS_RUNBOOKS: ErrorClassRunbook[] = [
  {
    errorClass: 'AUTHENTICATION_REQUIRED',
    severity: 'sev2',
    runbookPath: 'docs/OPERATIONS_RUNBOOK.md#authentication-failures',
    owner: 'platform-security',
  },
  {
    errorClass: 'AUTHORIZATION_DENIED',
    severity: 'sev2',
    runbookPath: 'docs/OPERATIONS_RUNBOOK.md#authorization-and-tenant-isolation',
    owner: 'platform-security',
  },
  {
    errorClass: 'TENANT_RESOLUTION_FAILED',
    severity: 'sev1',
    runbookPath: 'docs/OPERATIONS_RUNBOOK.md#tenant-resolution-failures',
    owner: 'platform-core',
  },
  {
    errorClass: 'DATABASE_OPERATION_FAILED',
    severity: 'sev1',
    runbookPath: 'docs/OPERATIONS_RUNBOOK.md#database-degradation-or-outage',
    owner: 'platform-data',
  },
  {
    errorClass: 'EXTERNAL_SERVICE_FAILED',
    severity: 'sev2',
    runbookPath: 'docs/OPERATIONS_RUNBOOK.md#third-party-provider-outages',
    owner: 'platform-integrations',
  },
]
