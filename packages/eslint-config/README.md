# @agency/eslint-config

<div align="center">

**Shared ESLint configuration for agency platform projects**

[![npm version](https://img.shields.io/npm/v/@agency/eslint-config)](https://www.npmjs.org/package/@agency/eslint-config)
[![ESLint](https://img.shields.io/badge/ESLint-9.x-blue)](https://eslint.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)

</div>

Comprehensive ESLint configuration with TypeScript support, security rules, and agency-specific best practices for consistent code quality across all packages and applications.

## 🚀 Features

### 🔍 **Code Quality**
- **TypeScript Support** - Full type checking and linting
- **Security Rules** - Security vulnerability detection
- **Best Practices** - Industry-standard coding practices
- **Import/Export** - Proper import/export handling
- **Code Formatting** - Consistent code style enforcement

### 🏢 **Agency-Specific Rules**
- **No App-to-App Imports** - Prevent circular dependencies
- **Service Role Key Protection** - Prevent exposure of sensitive keys
- **Tenant Data Rules** - Enforce proper tenant isolation
- **Database Access** - Safe database operation patterns
- **API Security** - Secure API endpoint implementation

### 🎯 **Developer Experience**
- **Auto-Fixable Rules** - Automatic code fixing where possible
- **Clear Error Messages** - Helpful error descriptions
- **Performance Optimized** - Fast linting for large codebases
- **IDE Integration** - Perfect VS Code and editor integration

## 📦 Installation

```bash
pnpm add -D @agency/eslint-config
```

## 🔧 Configuration

### **Basic Setup**

Create `eslint.config.mjs` in your project root:

```javascript
// eslint.config.mjs
import agencyConfig from '@agency/eslint-config'

export default [
  ...agencyConfig,
  {
    // Project-specific overrides
    rules: {
      // Add or override rules here
    }
  }
]
```

### **Package.json Scripts**

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "lint:report": "eslint . --format=json --output-file=eslint-report.json"
  }
}
```

## 📋 Configuration Options

### **Default Rules**

The agency config includes these rule sets:

#### **TypeScript Rules**
- `@typescript-eslint/no-unused-vars` - Prevent unused variables
- `@typescript-eslint/no-explicit-any` - Disallow `any` types
- `@typescript-eslint/prefer-unknown` - Use `unknown` over `any`
- `@typescript-eslint/no-non-null-assertion` - Avoid non-null assertions

#### **Security Rules**
- `no-eval` - Prevent eval() usage
- `no-implied-eval` - Prevent implied eval
- `no-new-func` - Prevent Function constructor
- `no-script-url` - Prevent javascript: URLs

#### **Import Rules**
- `import/order` - Consistent import ordering
- `import/no-unresolved` - Prevent unresolved imports
- `import/no-cycle` - Prevent circular dependencies

#### **Agency-Specific Rules**
- `no-service-role-exposure` - Prevent service role key exposure
- `no-app-to-app-imports` - Prevent app-to-app dependencies
- `tenant-data-isolation` - Enforce tenant data patterns

### **Custom Configuration**

```javascript
// eslint.config.mjs
import agencyConfig from '@agency/eslint-config'

export default [
  ...agencyConfig,
  {
    // Enable React rules for React projects
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: ['react', 'react-hooks'],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  {
    // Test files - more relaxed rules
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },
  {
    // Configuration files
    files: ['*.config.js', '*.config.ts', '*.config.mjs'],
    rules: {
      'no-console': 'off'
    }
  }
]
```

## 🔍 Agency-Specific Rules

### **Service Role Key Protection**

```typescript
// ❌ BAD - Service role key exposed
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ❌ Exposed to client
)

// ✅ GOOD - Service role key on server only
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ✅ Server-side only
)
```

### **No App-to-App Imports**

```typescript
// ❌ BAD - Importing from another app
import { Button } from '../../firm/src/components/Button' // ❌ App-to-app

// ✅ GOOD - Import from shared package
import { Button } from '@agency/ui' // ✅ Shared package
```

### **Tenant Data Isolation**

```typescript
// ❌ BAD - Missing tenant context
const bookings = await supabase.from('bookings').select('*') // ❌ No tenant filter

// ✅ GOOD - Proper tenant isolation
const bookings = await supabase
  .from('bookings')
  .select('*')
  .eq('tenant_id', tenantId) // ✅ Tenant-scoped
```

## 🎨 IDE Integration

### **VS Code Setup**

Install recommended extensions:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss"
  ]
}
```

Configure VS Code settings:

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### **ESLint Ignore Patterns**

Create `.eslintignore`:

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/

# Generated files
*.generated.ts
*.d.ts

# Test coverage
coverage/

# Environment files
.env*
.env.local

# Temporary files
*.tmp
*.temp
```

## 🧪 Testing Configuration

### **Test File Rules**

```javascript
// eslint.config.mjs
import agencyConfig from '@agency/eslint-config'

export default [
  ...agencyConfig,
  {
    // Test files - relaxed rules
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/__tests__/**/*'
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-empty-function': 'off'
    }
  }
]
```

### **Mock File Rules**

```javascript
// Mock files - very relaxed rules
{
  files: ['**/*.mock.ts', '**/__mocks__/**/*'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-console': 'off'
  }
}
```

## 📊 Linting Performance

### **Optimization Tips**

```javascript
// eslint.config.mjs
import agencyConfig from '@agency/eslint-config'

export default [
  ...agencyConfig,
  {
    // Performance optimizations
    cache: true,
    cacheLocation: 'node_modules/.cache/eslint/',
    cacheStrategy: 'content',
    
    // Parallel processing
    parallel: true,
    
    // File filtering
    ignorePatterns: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**'
    ]
  }
]
```

### **Large Project Optimization**

```bash
# Lint specific directories
pnpm lint src/

# Lint changed files only
pnpm lint --cache --cache-strategy content

# Use multiple workers
ESLINT_USE_FLAT_CONFIG=true pnpm lint --max-workers 4
```

## 🚀 **Real-World Examples**

### **Package Configuration**

```javascript
// packages/ui/eslint.config.mjs
import agencyConfig from '@agency/eslint-config'

export default [
  ...agencyConfig,
  {
    files: ['**/*.tsx'],
    rules: {
      // React-specific rules for UI components
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      '@typescript-eslint/no-empty-function': 'off' // Event handlers
    }
  },
  {
    files: ['**/*.stories.tsx'],
    rules: {
      // Storybook files - relaxed rules
      'import/no-extraneous-dependencies': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
```

### **App Configuration**

```javascript
// apps/firm/eslint.config.mjs
import agencyConfig from '@agency/eslint-config'

export default [
  ...agencyConfig,
  {
    files: ['src/app/**/*.tsx'],
    rules: {
      // Next.js App Router specific
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react/display-name': 'off'
    }
  },
  {
    files: ['src/actions/**/*.ts'],
    rules: {
      // Server Actions - specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  }
]
```

## 🆘 **Troubleshooting & Support**

### **🔧 Common Issues & Solutions**

#### **1. ESLint Not Working**

**Symptoms**: No linting errors, ESLint not running

**Solutions**:
- ✅ Verify ESLint config file name and format
- ✅ Check package.json scripts configuration
- ✅ Ensure @agency/eslint-config is installed
- ✅ Verify file patterns and ignore rules

```bash
# Debug ESLint configuration
npx eslint --print-config src/app/page.tsx

# Check ESLint version
npx eslint --version

# Test specific file
npx eslint src/app/page.tsx --debug
```

#### **2. TypeScript Errors**

**Symptoms**: TypeScript-related ESLint errors not working

**Solutions**:
- ✅ Install @typescript-eslint/parser
- ✅ Configure tsconfig.json properly
- ✅ Check file extensions (.ts, .tsx)
- ✅ Verify TypeScript plugin loading

```javascript
// Debug TypeScript parsing
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
  }
]
```

#### **3. Performance Issues**

**Symptoms**: Slow linting, high memory usage

**Solutions**:
- ✅ Enable ESLint caching
- ✅ Use file filtering and ignore patterns
- ✅ Optimize TypeScript project references
- ✅ Use parallel processing

```bash
# Clear ESLint cache
rm -rf node_modules/.cache/eslint/

# Run with performance monitoring
time npx eslint src/ --cache

# Check memory usage
node --max-old-space-size=4096 node_modules/.bin/eslint src/
```

#### **4. Rule Conflicts**

**Symptoms**: Conflicting rule definitions, unexpected behavior

**Solutions**:
- ✅ Check rule precedence order
- ✅ Review plugin configurations
- ✅ Verify rule overrides
- ✅ Test with minimal config

```javascript
// Debug rule conflicts
export default [
  ...agencyConfig,
  {
    // Override specific rules
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Override error to warn
      'no-console': 'off' // Disable completely
    }
  }
]
```

#### **5. IDE Integration Issues**

**Symptoms**: VS Code not showing ESLint errors, auto-fix not working

**Solutions**:
- ✅ Install and enable ESLint extension
- ✅ Check VS Code ESLint settings
- ✅ Verify workspace ESLint configuration
- ✅ Restart VS Code language server

```json
// .vscode/settings.json
{
  "eslint.enable": true,
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.run": "onType",
  "eslint.workingDirectories": ["packages/*", "apps/*"]
}
```

### **🔍 Debugging Tools**

#### **Rule Inspector**

```bash
# Check which rules apply to a file
npx eslint src/app/page.tsx --print-config

# List all available rules
npx eslint --print-config | grep -E "rules:|@typescript-eslint"

# Test specific rule
npx eslint src/app/page.tsx --rule '@typescript-eslint/no-explicit-any'
```

#### **Performance Profiler**

```bash
# Profile ESLint performance
NODE_OPTIONS='--inspect' npx eslint src/ --debug

# Check cache efficiency
npx eslint src/ --cache --cache-strategy content --verbose
```

### **📞 Getting Help**

**Self-Service Debugging**:
1. Check ESLint configuration syntax and format
2. Verify plugin installations and compatibility
3. Test with minimal configuration
4. Review file patterns and ignore rules
5. Check IDE integration settings

**Community Support**:
- **ESLint Documentation**: [https://eslint.org/docs](https://eslint.org/docs)
- **TypeScript ESLint**: [httpstypescript-eslint.io](https://typescript-eslint.io)
- **GitHub Issues**: [Agency Platform Issues](https://github.com/agency/platform/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/agency)
- **Email Support**: eslint@agency.com

**Common Debug Commands**:
```bash
# Check ESLint setup
pnpm run eslint:check

# Validate configuration
pnpm run eslint:validate

# Test specific rules
pnpm run eslint:test-rules

# Profile performance
pnpm run eslint:profile

# Clear and rebuild cache
pnpm run eslint:clean-cache
```

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🔧 Toolchain](../../TOOLCHAIN.md) • [🚀 Development](../../CONTRIBUTING.md)

</div>
