# @agency/eslint-config Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Shared ESLint configuration with agency-specific rules and security patterns. This package provides consistent linting standards across all packages and applications.

## Agent Skills (Available Commands)
- `pnpm lint` - Run ESLint on current package
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm lint:check` - Check configuration validity
- `pnpm rules:list` - List all available rules

## Integration Points
- Depends on: `eslint` core, `@typescript-eslint/parser` for TypeScript
- Used by: All packages and applications for linting
- See also: `@.agents/security.md` for security linting rules
- Reference: ESLint documentation for rule configuration

## Core Patterns

### Security-Focused Rules
```javascript
// ✅ Correct - Security rules enabled
module.exports = {
  rules: {
    // Prevent service role key exposure
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message: 'Use environment variables instead of process.env',
      },
    ],
    // Require tenant context in database queries
    'agency/require-tenant-context': 'error',
    // Prevent user_metadata usage
    'agency/no-user-metadata': 'error',
  },
};

// ❌ Incorrect - Missing security rules
module.exports = {
  rules: {
    // No security-specific rules
  },
};
```

### TypeScript Strict Rules
```javascript
// ✅ Correct - Strict TypeScript configuration
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-unknown': 'error',
  },
};

// ❌ Incorrect - Lenient TypeScript rules
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn', // Should be error
  },
};
```

## Package Commands

```bash
# Run linting
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Check configuration
pnpm lint:check

# List rules
pnpm rules:list

# Type check
pnpm type-check
```

## File Structure

```
packages/eslint-config/
├── index.js                 # Base configuration
├── typescript.js            # TypeScript-specific rules
├── security.js              # Security-focused rules
├── react.js                 # React-specific rules
├── agency-rules.js          # Custom agency rules
├── AGENTS.md                # This file
└── package.json
```

## Key Exports

### Base Configuration
```javascript
// eslint.config.js
import agencyConfig from '@agency/eslint-config';

export default [
  ...agencyConfig,
  {
    rules: {
      // Package-specific overrides
    },
  },
];
```

### TypeScript Configuration
```javascript
import typescriptConfig from '@agency/eslint-config/typescript';

export default [
  ...typescriptConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
```

## Security Rules

### Service Role Key Detection
```javascript
// ✅ Correct - Detects service role exposure
module.exports = {
  rules: {
    'no-restricted-properties': [
      'error',
      {
        property: 'SUPABASE_SERVICE_ROLE_KEY',
        message: 'Never expose service role keys in client code',
      },
    ],
  },
};
```

### Tenant Context Enforcement
```javascript
// ✅ Correct - Custom agency rule
module.exports = {
  rules: {
    'agency/require-tenant-context': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require tenant_id in database operations',
        },
      },
      create(context) {
        return {
          // Rule implementation
        };
      },
    },
  },
};
```

## Testing Patterns

### Rule Testing
```javascript
// tests/agency-rules.test.js
const { RuleTester } = require('eslint');
const rule = require('../agency-rules.js');

const ruleTester = new RuleTester();

ruleTester.run('require-tenant-context', rule, {
  valid: [
    {
      code: 'client.from("users").select("*").eq("tenant_id", tenantId);',
    },
  ],
  invalid: [
    {
      code: 'client.from("users").select("*");',
      errors: [{ message: 'Missing tenant_id in database query' }],
    },
  ],
});
```

## Dependencies

This package depends on:
- `eslint` - Core linting engine
- `@typescript-eslint/parser` - TypeScript parsing
- `@typescript-eslint/eslint-plugin` - TypeScript rules
- `eslint-plugin-react` - React rules
- `eslint-plugin-security` - Security rules

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `docs/LINTING.md` - Complete linting guide
- ESLint documentation - Rule configuration patterns
