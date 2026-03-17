/**
 * Integrated Knowledge Management Types
 * 
 * This file defines the core types and interfaces for the agency platform's
 * knowledge management system, supporting automated capture, AI-powered search,
 * expertise mapping, and knowledge sharing incentives.
 */

export type KnowledgeSource = 'commit' | 'pr' | 'discussion' | 'meeting' | 'documentation' | 'code' | 'issue'

export type KnowledgeCategory = 
  | 'architecture'
  | 'security'
  | 'performance'
  | 'testing'
  | 'deployment'
  | 'monitoring'
  | 'governance'
  | 'best-practices'
  | 'troubleshooting'
  | 'onboarding'

export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface KnowledgeCapture {
  id: string
  title: string
  content: string
  summary: string
  source: KnowledgeSource
  category: KnowledgeCategory
  tags: string[]
  expertise: ExpertiseLevel
  timestamp: string // ISO 8601
  author: string
  authorEmail: string
  repository: string
  filePath?: string
  prNumber?: number
  commitHash?: string
  issueNumber?: number
  citations: Citation[]
  quality: QualityMetrics
  metadata: Record<string, unknown>
}

export interface Citation {
  id: string
  url: string
  title: string
  snippet: string
  confidence: number
  type: 'file' | 'commit' | 'pr' | 'issue' | 'documentation'
}

export interface QualityMetrics {
  clarity: number // 0-100
  accuracy: number // 0-100
  completeness: number // 0-100
  relevance: number // 0-100
  overall: number // 0-100
}

export interface ExpertiseProfile {
  userId: string
  name: string
  email: string
  areas: ExpertiseArea[]
  contributions: KnowledgeCapture[]
  activity: ActivityMetrics
  reputation: ReputationMetrics
  availability: AvailabilityInfo
  mentorship: MentorshipProfile
  lastActive: string // ISO 8601
}

export interface ExpertiseArea {
  category: KnowledgeCategory
  level: ExpertiseLevel
  confidence: number // 0-100
  contributions: number
  endorsements: number
  lastContribution: string // ISO 8601
}

export interface ActivityMetrics {
  totalContributions: number
  contributionsByCategory: Record<KnowledgeCategory, number>
  contributionsBySource: Record<KnowledgeSource, number>
  averageQuality: number
  responseTime: number // hours
  collaborationScore: number // 0-100
}

export interface ReputationMetrics {
  score: number // 0-100
  rank: number
  endorsements: number
  helpfulVotes: number
  mentorshipPoints: number
  knowledgeShared: number
  badges: Badge[]
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: string // ISO 8601
  category: 'contribution' | 'expertise' | 'collaboration' | 'mentorship'
}

export interface AvailabilityInfo {
  timezone: string
  workingHours: {
    start: string // HH:mm
    end: string // HH:mm
  }
  days: string[] // Mon, Tue, etc.
  currentLoad: number // 0-100
  mentorshipCapacity: number
}

export interface MentorshipProfile {
  mentorshipStyle: 'hands-on' | 'guidance' | 'review' | 'collaborative'
  preferredTopics: KnowledgeCategory[]
  menteeCount: number
  successRate: number // 0-100
  mentorshipSessions: MentorshipSession[]
}

export interface MentorshipSession {
  id: string
  menteeId: string
  topic: string
  category: KnowledgeCategory
  scheduledAt: string // ISO 8601
  duration: number // minutes
  status: 'scheduled' | 'completed' | 'cancelled'
  rating?: number // 1-5
  notes?: string
}

export interface SearchQuery {
  query: string
  category?: KnowledgeCategory
  expertise?: ExpertiseLevel
  source?: KnowledgeSource
  author?: string
  dateRange?: {
    start: string // ISO 8601
    end: string // ISO 8601
  }
  tags?: string[]
  sortBy?: 'relevance' | 'date' | 'quality' | 'author'
  limit?: number
  offset?: number
}

export interface SearchResult {
  item: KnowledgeCapture
  relevance: number
  highlights: string[]
  matchedTerms: string[]
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: SearchQuery
  suggestions: string[]
  categories: CategoryStats[]
  took: number // milliseconds
}

export interface CategoryStats {
  category: KnowledgeCategory
  count: number
  avgQuality: number
  topContributors: string[]
}

export interface KnowledgeAudit {
  id: string
  timestamp: string // ISO 8601
  type: 'quality' | 'completeness' | 'accuracy' | 'relevance'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  scope: {
    category?: KnowledgeCategory
    dateRange?: {
      start: string // ISO 8601
      end: string // ISO 8601
    }
    author?: string
  }
  results: AuditResult[]
  summary: AuditSummary
}

export interface AuditResult {
  itemId: string
  issues: AuditIssue[]
  score: number // 0-100
  recommendations: string[]
  status: 'passed' | 'warning' | 'failed'
}

export interface AuditIssue {
  type: 'clarity' | 'accuracy' | 'completeness' | 'relevance' | 'formatting'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggestion: string
  location?: string
}

export interface AuditSummary {
  totalItems: number
  passed: number
  warnings: number
  failed: number
  averageScore: number
  topIssues: AuditIssue[]
}

export interface IncentiveProgram {
  id: string
  name: string
  description: string
  type: 'points' | 'badges' | 'recognition' | 'privileges'
  rules: IncentiveRule[]
  rewards: Reward[]
  active: boolean
  startDate: string // ISO 8601
  endDate?: string // ISO 8601
}

export interface IncentiveRule {
  id: string
  action: 'contribute' | 'review' | 'mentor' | 'share' | 'endorse'
  condition: Record<string, unknown>
  points: number
  badges?: string[]
  description: string
}

export interface Reward {
  id: string
  name: string
  description: string
  type: 'digital' | 'physical' | 'privilege' | 'recognition'
  cost: number
  available: boolean
  claimed: number
  maxClaims?: number
}

export interface WorkflowTrigger {
  type: 'commit' | 'pr' | 'issue' | 'release' | 'schedule'
  conditions: Record<string, unknown>
  actions: WorkflowAction[]
}

export interface WorkflowAction {
  type: 'capture' | 'index' | 'notify' | 'audit' | 'incentivize'
  config: Record<string, unknown>
}

// Utility types for database operations
export type CreateKnowledgeCapture = Omit<KnowledgeCapture, 'id' | 'timestamp' | 'quality'>
export type UpdateKnowledgeCapture = Partial<CreateKnowledgeCapture>
export type KnowledgeFilter = Partial<{
  category: KnowledgeCategory
  source: KnowledgeSource
  author: string
  expertise: ExpertiseLevel
  tags: string[]
  dateRange: { start: string; end: string }
}>
