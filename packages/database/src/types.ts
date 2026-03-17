// Generated database types from current schema
// This file should be regenerated with `pnpm db:generate-types:local` when Docker is available
// or `pnpm db:generate-types` with proper project_id for production

export interface Database {
  public: {
    Tables: {
      // Core tenant tables
      tenants: {
        Row: {
          id: string
          slug: string
          domain: string
          name: string
          industry: 'healthcare' | 'ecommerce' | 'hospitality' | 'general'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          domain: string
          name: string
          industry: 'healthcare' | 'ecommerce' | 'hospitality' | 'general'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          domain?: string
          name?: string
          industry?: 'healthcare' | 'ecommerce' | 'hospitality' | 'general'
          created_at?: string
          updated_at?: string
        }
      }
      tenant_users: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          role: 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          role?: 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          role?: 'admin' | 'member'
          created_at?: string
        }
      }
      customer_auth_mappings: {
        Row: {
          tenant_id: string
          user_id: string
          real_email: string
          auth_email: string
        }
        Insert: {
          tenant_id: string
          user_id: string
          real_email: string
          auth_email: string
        }
        Update: {
          tenant_id?: string
          user_id?: string
          real_email?: string
          auth_email?: string
        }
      }
      
      // Content tables
      posts: {
        Row: {
          id: string
          tenant_id: string
          title: string
          slug: string
          content: string | null
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          slug: string
          content?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          slug?: string
          content?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      
      // Booking system
      bookings: {
        Row: {
          id: string
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          created_at?: string
        }
      }
      
      // Contact submissions
      contact_submissions: {
        Row: {
          id: string
          tenant_id: string
          name: string | null
          email: string
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name?: string | null
          email: string
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string | null
          email?: string
          message?: string | null
          created_at?: string
        }
      }
      
      // DORA metrics tables
      deployments: {
        Row: {
          id: string
          timestamp: string
          commit_sha: string
          environment: 'production' | 'staging' | 'development'
          service: string
          status: 'success' | 'failure' | 'rollback'
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          timestamp?: string
          commit_sha: string
          environment: 'production' | 'staging' | 'development'
          service: string
          status: 'success' | 'failure' | 'rollback'
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          timestamp?: string
          commit_sha?: string
          environment?: 'production' | 'staging' | 'development'
          service?: string
          status?: 'success' | 'failure' | 'rollback'
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      
      incidents: {
        Row: {
          id: string
          detected_at: string
          resolved_at: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          deployment_id: string | null
          description: string
          service: string
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          detected_at: string
          resolved_at?: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          deployment_id?: string | null
          description: string
          service: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          detected_at?: string
          resolved_at?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          deployment_id?: string | null
          description?: string
          service?: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      },
      
      // Cost monitoring tables
      cost_metrics: {
        Row: {
          id: string
          tenant_id: string
          storage_usage: number
          cicd_runtime: number
          bandwidth_usage: number
          total_cost: number
          currency: string
          timestamp: string
          period: 'hourly' | 'daily' | 'weekly' | 'monthly'
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          tenant_id: string
          storage_usage?: number
          cicd_runtime?: number
          bandwidth_usage?: number
          total_cost?: number
          currency?: string
          timestamp?: string
          period: 'hourly' | 'daily' | 'weekly' | 'monthly'
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          tenant_id?: string
          storage_usage?: number
          cicd_runtime?: number
          bandwidth_usage?: number
          total_cost?: number
          currency?: string
          timestamp?: string
          period?: 'hourly' | 'daily' | 'weekly' | 'monthly'
          metadata?: Record<string, unknown>
        }
      }
      
      budget_alerts: {
        Row: {
          id: string
          tenant_id: string
          name: string
          category: 'storage' | 'compute' | 'bandwidth' | 'total'
          threshold: number
          threshold_type: 'absolute' | 'percentage' | 'rate'
          severity: 'low' | 'medium' | 'high' | 'critical'
          active: boolean
          notification_channels: unknown[]
          last_triggered: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          category: 'storage' | 'compute' | 'bandwidth' | 'total'
          threshold: number
          threshold_type?: 'absolute' | 'percentage' | 'rate'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          active?: boolean
          notification_channels?: unknown[]
          last_triggered?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          category?: 'storage' | 'compute' | 'bandwidth' | 'total'
          threshold?: number
          threshold_type?: 'absolute' | 'percentage' | 'rate'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          active?: boolean
          notification_channels?: unknown[]
          last_triggered?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      optimization_recommendations: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string
          category: 'storage' | 'compute' | 'bandwidth' | 'architecture'
          priority: 'low' | 'medium' | 'high' | 'critical'
          estimated_savings: number | null
          implementation_effort: 'low' | 'medium' | 'high'
          status: 'pending' | 'in_progress' | 'completed' | 'rejected'
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          description: string
          category: 'storage' | 'compute' | 'bandwidth' | 'architecture'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          estimated_savings?: number | null
          implementation_effort?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed' | 'rejected'
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          description?: string
          category?: 'storage' | 'compute' | 'bandwidth' | 'architecture'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          estimated_savings?: number | null
          implementation_effort?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed' | 'rejected'
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      
      // Artifact lifecycle management
      artifacts: {
        Row: {
          id: string
          tenant_id: string
          name: string
          type: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other'
          size_bytes: number
          storage_path: string
          checksum: string
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          type: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other'
          size_bytes: number
          storage_path: string
          checksum: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          type?: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other'
          size_bytes?: number
          storage_path?: string
          checksum?: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      
      artifact_versions: {
        Row: {
          id: string
          artifact_id: string
          version: string
          size_bytes: number
          storage_path: string
          checksum: string
          changelog: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          artifact_id: string
          version: string
          size_bytes: number
          storage_path: string
          checksum: string
          changelog?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          artifact_id?: string
          version?: string
          size_bytes?: number
          storage_path?: string
          checksum?: string
          changelog?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
      }
      
      // Audit logging
      audit_log: {
        Row: {
          id: string
          tenant_id: string | null
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Record<string, unknown> | null
          new_values: Record<string, unknown> | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Record<string, unknown> | null
          new_values?: Record<string, unknown> | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: Record<string, unknown> | null
          new_values?: Record<string, unknown> | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Common database types for reuse
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantUser = Database['public']['Tables']['tenant_users']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type ContactSubmission = Database['public']['Tables']['contact_submissions']['Row']
export type Deployment = Database['public']['Tables']['deployments']['Row']
export type Incident = Database['public']['Tables']['incidents']['Row']
export type CostMetric = Database['public']['Tables']['cost_metrics']['Row']
export type BudgetAlert = Database['public']['Tables']['budget_alerts']['Row']
export type OptimizationRecommendation = Database['public']['Tables']['optimization_recommendations']['Row']
export type Artifact = Database['public']['Tables']['artifacts']['Row']
export type ArtifactVersion = Database['public']['Tables']['artifact_versions']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

// Insert types for forms
export type TenantInsert = Database['public']['Tables']['tenants']['Insert']
export type TenantUserInsert = Database['public']['Tables']['tenant_users']['Insert']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type ContactSubmissionInsert = Database['public']['Tables']['contact_submissions']['Insert']
export type DeploymentInsert = Database['public']['Tables']['deployments']['Insert']
export type IncidentInsert = Database['public']['Tables']['incidents']['Insert']
export type CostMetricInsert = Database['public']['Tables']['cost_metrics']['Insert']
export type BudgetAlertInsert = Database['public']['Tables']['budget_alerts']['Insert']
export type OptimizationRecommendationInsert = Database['public']['Tables']['optimization_recommendations']['Insert']
export type ArtifactInsert = Database['public']['Tables']['artifacts']['Insert']
export type ArtifactVersionInsert = Database['public']['Tables']['artifact_versions']['Insert']
export type AuditLogInsert = Database['public']['Tables']['audit_log']['Insert']

// Update types for edits
export type TenantUpdate = Database['public']['Tables']['tenants']['Update']
export type TenantUserUpdate = Database['public']['Tables']['tenant_users']['Update']
export type PostUpdate = Database['public']['Tables']['posts']['Update']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']
export type ContactSubmissionUpdate = Database['public']['Tables']['contact_submissions']['Update']
export type DeploymentUpdate = Database['public']['Tables']['deployments']['Update']
export type IncidentUpdate = Database['public']['Tables']['incidents']['Update']
export type CostMetricUpdate = Database['public']['Tables']['cost_metrics']['Update']
export type BudgetAlertUpdate = Database['public']['Tables']['budget_alerts']['Update']
export type OptimizationRecommendationUpdate = Database['public']['Tables']['optimization_recommendations']['Update']
export type ArtifactUpdate = Database['public']['Tables']['artifacts']['Update']
export type ArtifactVersionUpdate = Database['public']['Tables']['artifact_versions']['Update']
export type AuditLogUpdate = Database['public']['Tables']['audit_log']['Update']

// Utility types for common operations
export type TenantId = string
export type UserId = string
export type JSONValue = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: JSONValue }
  | JSONValue[]

export type DatabaseError = {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Helper function to check if a value is a valid tenant_id
export function isValidTenantId(value: unknown): value is TenantId {
  return typeof value === 'string' && value.length > 0
}

// Helper function to check if a value is a valid user_id
export function isValidUserId(value: unknown): value is UserId {
  return typeof value === 'string' && value.length > 0
}