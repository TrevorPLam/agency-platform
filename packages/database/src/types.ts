// Minimal Database types to unblock build
// TODO: Generate proper types with `pnpm db:generate-types:local` when Docker is available

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          tenant_id?: string
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
      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
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