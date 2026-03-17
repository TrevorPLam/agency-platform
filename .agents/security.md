# Security Guidelines & Threat Prevention

## Security First Principles

### Multi-Tenant Security
- **Tenant Isolation**: Never cross tenant data boundaries
- **App Metadata**: Use `app_metadata.tenant_id`, never `user_metadata`
- **Service Role Keys**: Never expose SUPABASE_SERVICE_ROLE_KEY to clients
- **Port Security**: Always use Port 6543 (Supavisor), never Port 5432

### Authentication & Authorization

#### User Authentication
```typescript
// ✅ Correct - Use @agency/database auth
import { createClient } from '@agency/database';

const { data: { user } } = await client.auth.getUser();
const tenantId = user?.app_metadata?.tenant_id;

// ❌ Incorrect - Direct Supabase auth
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
```

#### Tenant Resolution
```typescript
// ✅ Correct - Tenant-aware middleware
export async function getTenantFromRequest(request: Request) {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  
  if (!user?.app_metadata?.tenant_id) {
    throw new Error('No tenant context found');
  }
  
  return user.app_metadata.tenant_id;
}

// ❌ Incorrect - No tenant validation
export async function getUser(request: Request) {
  // Missing tenant validation
}
```

### Threat Prevention

#### Prompt Injection Prevention
```typescript
// ✅ Correct - Input sanitization
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .slice(0, 1000)        // Limit length
    .trim();
}

// ❌ Incorrect - Raw input usage
function processUserInput(input: string) {
  // Direct usage without sanitization
  return processAgent(input);
}
```

#### Code Execution Security
```typescript
// ✅ Correct - Sandboxed evaluation
import { VM } from 'vm2';

const vm = new VM({
  timeout: 1000,
  sandbox: {
    console: {
      log: console.log
    }
  }
});

// ❌ Incorrect - Direct eval
function executeCode(code: string) {
  return eval(code); // Dangerous!
}
```

### Security Commands

```bash
# Security scan
pnpm audit

# Check for exposed keys
grep -r "SUPABASE_SERVICE_ROLE_KEY" --exclude-dir=node_modules .

# Validate RLS policies
supabase test db

# Check for user_metadata usage
grep -r "user_metadata" --exclude-dir=node_modules .
```

### Environment Security

#### .env.local Requirements
```bash
# ✅ Required - Local development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here

# ❌ Never commit - These should be in .env.local only
# NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx
# DATABASE_URL=postgresql://...
```

#### Environment Validation
```typescript
// ✅ Correct - Environment validation
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// ❌ Incorrect - No validation
// Missing environment checks
```

### Data Protection

#### Sensitive Data Handling
```typescript
// ✅ Correct - Encrypt sensitive data
import crypto from 'crypto';

function encryptSensitiveData(data: string): string {
  const key = process.env.ENCRYPTION_KEY;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// ❌ Incorrect - Plain text storage
function storeSensitiveData(data: string) {
  return localStorage.setItem('sensitive', data); // Dangerous!
}
```

#### API Security
```typescript
// ✅ Correct - Secure API endpoints
export async function GET(request: Request) {
  const tenantId = await getTenantFromRequest(request);
  
  // Validate tenant access
  if (!tenantId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Tenant-scoped query
  const data = await client
    .from('sensitive_data')
    .select('*')
    .eq('tenant_id', tenantId);
    
  return Response.json(data);
}

// ❌ Incorrect - No tenant validation
export async function GET(request: Request) {
  const data = await client
    .from('sensitive_data')
    .select('*'); // Cross-tenant data leak!
    
  return Response.json(data);
}
```

### Security Monitoring

#### Audit Logging
```typescript
// ✅ Correct - Security event logging
function logSecurityEvent(event: {
  type: 'auth' | 'data_access' | 'permission_denied';
  userId?: string;
  tenantId?: string;
  details: Record<string, any>;
}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event
  }));
  
  // Send to security monitoring service
}

// ❌ Incorrect - No security logging
function accessData(dataId: string) {
  // No audit trail
}
```

#### Rate Limiting
```typescript
// ✅ Correct - Rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, limit: number = 100): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// ❌ Incorrect - No rate limiting
function processRequest(request: Request) {
  // Unlimited requests
}
```

### Security Testing

```bash
# Test RLS policies
supabase test db

# Security audit
pnpm audit --audit-level high

# Check for secrets
git secrets --scan

# Dependency vulnerability scan
pnpm audit
```

### Common Security Mistakes to Avoid

1. **Never** commit service role keys to version control
2. **Never** use `user_metadata` for tenant identification
3. **Never** connect to Supabase on port 5432 in production
4. **Never** expose database credentials to client-side code
5. **Never** skip RLS policy testing
6. **Never** use `eval()` or similar dynamic code execution
7. **Never** store sensitive data in localStorage or sessionStorage

## Progressive Documentation

For more details:
- `docs/SECURITY.md` - Complete security architecture
- `docs/DATABASE.md` - Database security patterns
- `SECURITY.md` - Security policies and procedures
