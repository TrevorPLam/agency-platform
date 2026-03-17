# @agency/database

<div align="center">

**Type-safe Supabase client factories with multi-tenant support**

[![npm version](https://img.shields.io/npm/v/@agency/database)](https://www.npmjs.com/package/@agency/database)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-latest-3ECF8E)](https://supabase.com/)

</div>

Type-safe database client factory for Supabase with automatic type generation, multi-tenant Row-Level Security (RLS), and comprehensive database management utilities for the agency platform.

## 🚀 Features

### 🔒 **Multi-Tenant Security**
- **Row-Level Security (RLS)** - Automatic tenant isolation
- **Type-Safe Queries** - Generated TypeScript types for all tables
- **Tenant Context** - Automatic tenant_id injection
- **Security Policies** - Pre-configured security templates

### 🏗️ **Database Management**
- **Type Generation** - Auto-generated types from database schema
- **Migration Support** - Database migration utilities
- **Connection Pooling** - Optimized database connections
- **Error Handling** - Comprehensive error management

### 🛠️ **Developer Experience**
- **Multiple Clients** - Client and admin client factories
- **Environment Support** - Development, staging, production configs
- **TypeScript Strict** - Full type safety with strict mode
- **Hot Reload** - Type regeneration on schema changes

### 📊 **Advanced Features**
- **Real-time Subscriptions** - Type-safe real-time listeners
- **File Storage** - Supabase Storage integration
- **Auth Integration** - Seamless authentication handling
- **Edge Functions** - Server-side function support

## 📦 Installation

```bash
pnpm add @agency/database
```

## 🔧 Configuration

### **Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Local Development
SUPABASE_DB_URL=postgresql://localhost:5432/postgres
SUPABASE_DB_PASSWORD=your_local_password
```

### **Supabase Setup**

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Create a new project
   - Note your project URL and API keys

2. **Configure Database**
   - Run migrations from `supabase/migrations/`
   - Set up Row-Level Security policies
   - Configure authentication providers

## 🚀 Quick Start

### **Client Usage**

```tsx
// lib/database.ts
import { createClient } from '@agency/database'

export const db = createClient()

// In your component
import { db } from '@/lib/database'
import type { Database } from '@agency/database'

export default function UserList() {
  const [users, setUsers] = useState<Database['public']['Tables']['users']['Row'][]>([])
  
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await db
        .from('users')
        .select('*')
      
      if (error) {
        console.error('Error fetching users:', error)
        return
      }
      
      setUsers(data)
    }
    
    fetchUsers()
  }, [])
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### **Admin Usage**

```ts
// lib/admin-db.ts
import { createAdminClient } from '@agency/database/admin'

export const adminDb = createAdminClient()

// In API route
import { adminDb } from '@/lib/admin-db'

export async function GET() {
  const { data, error } = await adminDb
    .from('users')
    .select('*')
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json(data)
}
```

### **Tenant-Aware Queries**

```tsx
import { createTenantClient } from '@agency/database'

export default function TenantData({ tenantId }: { tenantId: string }) {
  const db = createTenantClient(tenantId)
  
  const fetchData = async () => {
    // Automatically filtered by tenant_id
    const { data } = await db
      .from('bookings')
      .select('*')
    
    return data
  }
}
```

## 📚 API Reference

### **Client Factory**

#### **createClient()**
Creates a standard Supabase client with type safety.

```ts
import { createClient } from '@agency/database'

const db = createClient()
```

**Returns**: SupabaseClient<Database>

#### **createAdminClient()**
Creates an admin client with service role permissions.

```ts
import { createAdminClient } from '@agency/database/admin'

const adminDb = createAdminClient()
```

**Returns**: SupabaseClient<Database>

#### **createTenantClient(tenantId)**
Creates a tenant-aware client with automatic RLS context.

```ts
import { createTenantClient } from '@agency/database'

const tenantDb = createTenantClient('riverside-hotel')
```

**Parameters**:
- `tenantId: string` - The tenant identifier

**Returns**: SupabaseClient<Database>

### **Database Types**

The package automatically generates TypeScript types from your database schema:

```ts
type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; tenant_id: string; created_at: string }
        Insert: { email: string; tenant_id: string }
        Update: { email?: string }
      }
      bookings: {
        Row: { id: string; user_id: string; service_id: string; tenant_id: string }
        Insert: { user_id: string; service_id: string; tenant_id: string }
        Update: { user_id?: string; service_id?: string }
      }
    }
    Views: {
      // Generated views
    }
    Functions: {
      // Database functions
    }
  }
}
```

## 🔒 Security & RLS

### **Row-Level Security Setup**

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create tenant helper function
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('app.current_tenant', true)::TEXT;
$$;

-- Tenant isolation policies
CREATE POLICY "Users can view their own tenant data" ON public.users
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert their own tenant data" ON public.users
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update their own tenant data" ON public.users
  FOR UPDATE USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can delete their own tenant data" ON public.users
  FOR DELETE USING (tenant_id = public.tenant_id());
```

### **Tenant Context Management**

```ts
// lib/tenant-context.ts
export function setTenantContext(tenantId: string) {
  return {
    config: {
      global: {
        headers: {
          'X-Tenant-ID': tenantId
        }
      }
    }
  }
}
```

## 🔄 Type Generation

### **Automatic Type Generation**

```bash
# Generate types from production database
pnpm db:generate-types

# Generate types from local database
pnpm db:generate-types:local
```

### **Custom Type Configuration**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@agency/database": ["./packages/database/src"],
      "@agency/database/types": ["./packages/database/src/types.ts"]
    }
  }
}
```

### **Type Usage Examples**

```tsx
import type { Database } from '@agency/database'

type User = Database['public']['Tables']['users']['Row']
type NewUser = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export default function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.email}</h1>
      <p>Tenant: {user.tenant_id}</p>
    </div>
  )
}
```

## 📊 Advanced Usage

### **Real-time Subscriptions**

```tsx
import { useEffect } from 'react'
import { createClient } from '@agency/database'

export default function RealtimeData() {
  const db = createClient()
  
  useEffect(() => {
    const subscription = db
      .channel('realtime-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('New booking:', payload.new)
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  return <div>Listening for updates...</div>
}
```

### **File Storage Integration**

```tsx
import { createClient } from '@agency/database'

export default function FileUpload() {
  const db = createClient()
  
  const uploadFile = async (file: File) => {
    const { data, error } = await db.storage
      .from('uploads')
      .upload(`public/${file.name}`, file)
    
    if (error) {
      console.error('Upload error:', error)
      return
    }
    
    // Get public URL
    const { data: { publicUrl } } = db.storage
      .from('uploads')
      .getPublicUrl(`public/${file.name}`)
    
    return publicUrl
  }
  
  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) uploadFile(file)
      }}
    />
  )
}
```

### **Authentication Integration**

```tsx
import { createClient } from '@agency/database'
import { useEffect, useState } from 'react'

export default function AuthComponent() {
  const db = createClient()
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await db.auth.getUser()
      setUser(user)
    }
    
    getCurrentUser()
    
    // Listen for auth changes
    const { data: { subscription } } = db.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  const signIn = async (email: string, password: string) => {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Sign in error:', error)
      return
    }
    
    return data
  }
  
  const signOut = async () => {
    await db.auth.signOut()
  }
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <div>Please sign in</div>
      )}
    </div>
  )
}
```

## 🧪 Testing

### **Unit Testing**

```ts
// __tests__/database.test.ts
import { createClient } from '@agency/database'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        data: [],
        error: null
      }))
    }))
  }))
}))

test('should create database client', () => {
  const db = createClient()
  expect(db).toBeDefined()
})
```

### **Integration Testing**

```ts
// __tests__/integration.test.ts
import { createAdminClient } from '@agency/database/admin'

test('should connect to database', async () => {
  const db = createAdminClient()
  
  const { data, error } = await db
    .from('users')
    .select('count')
    .single()
  
  expect(error).toBeNull()
  expect(data).toBeDefined()
})
```

## 🔧 Development

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `pnpm build` | Build the package |
| `pnpm dev` | Watch mode for development |
| `pnpm type-check` | TypeScript type checking |
| `pnpm test` | Run tests with Vitest |
| `pnpm db:generate-types` | Generate types from production DB |
| `pnpm db:generate-types:local` | Generate types from local DB |

### **Development Workflow**

```bash
# 1. Start development mode
pnpm dev

# 2. Make changes to database schema
# 3. Regenerate types
pnpm db:generate-types:local

# 4. Run tests
pnpm test

# 5. Type check
pnpm type-check

# 6. Build
pnpm build
```

## 🚀 Deployment

### **Environment Configuration**

```bash
# Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_key

# Staging
NEXT_PUBLIC_SUPABASE_URL=https://your-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_key

# Production
NEXT_PUBLIC_SUPABASE_URL=https://your-production.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

### **Migration Management**

```bash
# Run migrations
supabase db push

# Generate types after migration
pnpm db:generate-types

# Reset local database
supabase db reset
```

## 🔍 Debugging

### **Common Issues**

1. **Type Mismatch**
   - Regenerate types: `pnpm db:generate-types`
   - Check database schema consistency
   - Verify table and column names

2. **RLS Policy Issues**
   - Check tenant_id is properly set
   - Verify RLS policies are enabled
   - Test with admin client

3. **Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Test network connectivity

### **Debug Mode**

```tsx
// Enable debug logging
import { createClient } from '@agency/database'

const db = createClient({
  global: {
    headers: {
      'X-Debug': 'true'
    }
  }
})
```

## 🤝 Contributing

1. **Type Safety** - Maintain strict TypeScript types
2. **Security** - Follow RLS best practices
3. **Testing** - Add tests for new features
4. **Documentation** - Update API documentation
5. **Performance** - Optimize database queries

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🎨 Design System](../design-tokens/) • [🔒 Security](../../SECURITY.md)

</div>
