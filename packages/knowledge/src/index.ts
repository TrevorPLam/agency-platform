/**
 * Integrated Knowledge Management System
 * 
 * Main entry point for the @agency/knowledge package.
 * Provides automated knowledge capture, AI-powered search, expertise mapping,
 * and workflow integration for the agency platform.
 */

export * from './types'
export { KnowledgeCaptureEngine } from './capture'
export { KnowledgeSearchEngine } from './search'
export { ExpertiseMapper } from './expertise'
export { WorkflowManager } from './workflows'
export { KnowledgeAuditor } from './audit'
export { IncentiveManager } from './incentives'

// Version information
export const KNOWLEDGE_VERSION = '1.0.0'
