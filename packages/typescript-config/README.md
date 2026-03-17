# @agency/typescript-config

<div align="center">

**Shared TypeScript configuration for agency platform projects**

[![npm version](https://img.shields.io/npm/v/@agency/typescript-config)](https://www.npmjs.org/package/@agency/typescript-config)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Strict Mode](https://img.shields.io/badge/Strict-Mode-red)](https://www.typescriptlang.org/tsconfig#strict)

</div>

Comprehensive TypeScript configuration with strict type checking, project references, and agency-specific compiler options for consistent type safety across all packages and applications.

## 🚀 Features

### 🔍 **Type Safety**
- **Strict Mode** - Maximum type safety and error checking
- **No Implicit Any** - Explicit type annotations required
- **Null Safety** - Strict null checks and undefined handling
- **Type Inference** - Smart type inference with strict constraints

### 🏢 **Agency-Specific Rules**
- **No Any Types** - Zero tolerance for `any` types
- **Unknown Types** - Use `unknown` over `any` for untyped values
- **Type Narrowing** - Proper type guards and narrowing patterns
- **Database Types** - Generated types with drift detection

### ⚡ **Performance Optimization**
- **Project References** - Incremental compilation for large codebases
- **Parallel Compilation** - Build multiple projects simultaneously
- **Type Caching** - Optimized type checking and caching
- **Fast Builds** - Optimized compiler settings for development

## 📦 Installation

```bash
pnpm add -D @agency/typescript-config
```

## 🔧 Configuration

### **Basic Setup**

Create `tsconfig.json` in your project root:

```json
{
  "extends": "@agency/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### **Package Configuration**

For packages in the monorepo:

```json
{
  "extends": "@agency/typescript-config/package.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### **Application Configuration**

For Next.js applications:

```json
{
  "extends": "@agency/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## 📋 Configuration Files

### **Base Configuration** (`base.json`)

```json
{
  "compilerOptions": {
    // Strict Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    
    // Module Resolution
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    
    // Emit Options
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "importHelpers": true,
    
    // Advanced Options
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "exclude": [
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage"
  ]
}
```

### **Package Configuration** (`package.json`)

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.stories.ts",
    "**/*.d.ts"
  ]
}
```

### **Next.js Configuration** (`nextjs.json`)

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "allowJs": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ]
}
```

## 🎯 Agency-Specific Rules

### **No Any Types Policy**

```typescript
// ❌ BAD - Using any type
function processData(data: any): any {
  return data.map((item: any) => item.value)
}

// ✅ GOOD - Proper typing
interface DataItem {
  id: string
  value: number
}

function processData(data: DataItem[]): DataItem[] {
  return data.map(item => item.value)
}
```

### **Unknown Types Over Any**

```typescript
// ❌ BAD - Using any for unknown data
function parseJSON(jsonString: string): any {
  return JSON.parse(jsonString)
}

// ✅ GOOD - Using unknown with type guards
function parseJSON(jsonString: string): unknown {
  return JSON.parse(jsonString)
}

// Type guard function
function isDataItem(value: unknown): value is DataItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'value' in value
  )
}

// Usage with type narrowing
const parsed = parseJSON(jsonString)
if (isDataItem(parsed)) {
  console.log(parsed.value) // TypeScript knows this is number
}
```

### **Strict Null Checks**

```typescript
// ❌ BAD - Potential null/undefined access
function getUserName(user: User | null): string {
  return user.name // Error: Object is possibly 'null'
}

// ✅ GOOD - Proper null checking
function getUserName(user: User | null): string {
  if (!user) {
    throw new Error('User is required')
  }
  return user.name
}

// ✅ BETTER - Using optional chaining
function getUserName(user: User | null): string {
  return user?.name ?? 'Unknown User'
}
```

## 🏗️ Project References

### **Monorepo Setup**

```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./packages/ui" },
    { "path": "./packages/database" },
    { "path": "./packages/analytics" },
    { "path": "./packages/design-tokens" },
    { "path": "./apps/firm" },
    { "path": "./apps/agency-admin" }
  ]
}
```

### **Package Reference**

```json
// packages/ui/tsconfig.json
{
  "extends": "@agency/typescript-config/package.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../design-tokens" }
  ]
}
```

### **Application Reference**

```json
// apps/firm/tsconfig.json
{
  "extends": "@agency/typescript-config/nextjs.json",
  "references": [
    { "path": "../../packages/ui" },
    { "path": "../../packages/database" },
    { "path": "../../packages/analytics" },
    { "path": "../../packages/design-tokens" }
  ]
}
```

## 🚀 **Real-World Examples**

### **Database Types**

```typescript
// Generated types with strict typing
interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          tenant_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Row, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Insert>
      }
      bookings: {
        Row: {
          id: string
          customer_email: string
          service_slug: string
          start_time: string
          end_time: string
          tenant_id: string
          status: 'pending' | 'confirmed' | 'cancelled'
          created_at: string
        }
        Insert: Omit<Row, 'id' | 'created_at'>
        Update: Partial<Insert>
      }
    }
    Functions: {
      get_tenant_bookings: {
        Args: { tenant_id: string }
        Returns: BookingsRow[]
      }
    }
  }
}

// Type-safe database operations
async function getBookings(tenantId: string): Promise<Database['public']['Tables']['bookings']['Row'][]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', tenantId)
  
  if (error) {
    throw new Error(`Failed to get bookings: ${error.message}`)
  }
  
  return data || []
}
```

### **API Route Types**

```typescript
// Type-safe API routes
export type APIRoute = {
  input: unknown
  output: unknown
  context?: {
    user?: User
    tenantId: string
  }
}

// Booking API route
export const bookingAPI: APIRoute = {
  input: z.object({
    customerEmail: z.string().email(),
    serviceSlug: z.string(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime()
  }),
  output: z.object({
    id: z.string(),
    status: z.enum(['pending', 'confirmed', 'cancelled']),
    createdAt: z.string().datetime()
  })
}

// Implementation with type safety
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()
  
  // Type validation
  const result = bookingAPI.input.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error },
      { status: 400 }
    )
  }
  
  // Process with type safety
  const booking = await createBooking(result.data)
  
  return NextResponse.json(bookingAPI.output.parse(booking))
}
```

### **React Component Types**

```typescript
// Strict component props
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
}

// Type-safe component
export function Button({ variant, size, disabled, loading, onClick, children }: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        disabled && 'btn-disabled',
        loading && 'btn-loading'
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

// Usage with type checking
<Button
  variant="primary"
  size="md"
  onClick={() => console.log('clicked')}
>
  Click me
</Button>
```

## 🔧 Development Tools

### **Type Checking Scripts**

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "type-check:project": "tsc --build --verbose",
    "type-check:incremental": "tsc --build --incremental",
    "type-check:clean": "rm -rf .tsbuildinfo && tsc --build"
  }
}
```

### **IDE Configuration**

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.quoteStyle": "single",
  "typescript.format.semicolons": "insert",
  "typescript.format.insertSpaceBeforeFunctionParenthesis": false
}
```

### **Pre-commit Hooks**

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Type check all changed files
pnpm type-check

# Exit if type checking fails
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed. Please fix TypeScript errors before committing."
  exit 1
fi

echo "✅ Type checking passed"
```

## 🆘 **Troubleshooting & Support**

### **🔧 Common Issues & Solutions**

#### **1. Type Checking Failures**

**Symptoms**: TypeScript errors, type mismatches, compilation failures

**Solutions**:
- ✅ Check tsconfig.json extends path
- ✅ Verify import paths and module resolution
- ✅ Review type annotations and interfaces
- ✅ Check for missing type declarations

```bash
# Debug TypeScript configuration
npx tsc --showConfig

# Check specific file
npx tsc --noEmit src/app/page.tsx

# List all errors
npx tsc --noEmit --pretty
```

#### **2. Project Reference Issues**

**Symptoms**: Build failures, missing references, circular dependencies

**Solutions**:
- ✅ Verify tsconfig.json references
- ✅ Check composite flag settings
- ✅ Review build order and dependencies
- ✅ Clean tsbuildinfo files

```bash
# Clean build cache
rm -rf .tsbuildinfo
rm -rf node_modules/.cache

# Rebuild project references
npx tsc --build --clean
npx tsc --build --verbose
```

#### **3. Module Resolution Problems**

**Symptoms**: Import errors, module not found, path resolution issues

**Solutions**:
- ✅ Check moduleResolution setting
- ✅ Verify baseUrl and paths configuration
- ✅ Review package.json exports
- ✅ Check file extensions and naming

```json
// Debug module resolution
{
  "compilerOptions": {
    "traceResolution": true,
    "listFiles": true
  }
}
```

#### **4. Performance Issues**

**Symptoms**: Slow compilation, high memory usage, long build times

**Solutions**:
- ✅ Enable incremental compilation
- ✅ Use project references properly
- ✅ Optimize include/exclude patterns
- ✅ Check for large type definitions

```bash
# Profile TypeScript compilation
time npx tsc --noEmit

# Check incremental compilation
npx tsc --incremental --listFiles | wc -l
```

#### **5. Strict Mode Errors**

**Symptoms**: Strict type checking errors, implicit any issues

**Solutions**:
- ✅ Add explicit type annotations
- ✅ Use type guards and narrowing
- ✅ Review null/undefined handling
- ✅ Check function return types

```typescript
// Debug strict mode issues
// Add this to tsconfig.json temporarily
{
  "compilerOptions": {
    "noImplicitAny": false,
    "strictNullChecks": false
  }
}

// Fix issues one by one, then re-enable strict mode
```

### **📞 Getting Help**

**Self-Service Debugging**:
1. Check TypeScript configuration files
2. Verify project references and dependencies
3. Review import paths and module resolution
4. Test with minimal configuration
5. Check IDE TypeScript version

**Community Support**:
- **TypeScript Documentation**: [https://www.typescriptlang.org/docs](https://www.typescriptlang.org/docs)
- **TypeScript Playground**: [https://www.typescriptlang.org/play](https://www.typescriptlang.org/play)
- **GitHub Issues**: [Agency Platform Issues](https://github.com/agency/platform/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/agency)
- **Email Support**: typescript@agency.com

**Common Debug Commands**:
```bash
# Check TypeScript version
pnpm list typescript

# Validate configuration
pnpm run typescript:validate

# Check project references
pnpm run typescript:check-references

# Profile compilation
pnpm run typescript:profile

# Clean and rebuild
pnpm run typescript:clean-build
```

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🔧 Toolchain](../../TOOLCHAIN.md) • [🚀 Development](../../CONTRIBUTING.md)

</div>
