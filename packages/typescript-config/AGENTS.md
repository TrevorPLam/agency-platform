# @agency/typescript-config Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Shared TypeScript configuration with strict type checking and agency-specific compiler options. This package provides consistent TypeScript settings across all packages and applications.

## Agent Skills (Available Commands)
- `pnpm types:check` - Run TypeScript type checking
- `pnpm types:validate` - Validate TypeScript configuration
- `pnpm types:upgrade` - Upgrade TypeScript configuration
- `pnpm types:references` - Update project references

## Integration Points
- Depends on: TypeScript compiler for configuration
- Used by: All packages and applications for TypeScript settings
- See also: `@packages/eslint-config/AGENTS.md` - Linting configuration
- Reference: TypeScript documentation for compiler options

## Core Patterns

### Strict TypeScript Configuration
```json
// ✅ Correct - Strict TypeScript settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}

// ❌ Incorrect - Lenient TypeScript settings
{
  "compilerOptions": {
    "strict": false, // Should be true
    "noImplicitAny": false, // Should be true
    "noUnusedLocals": false // Should be true
  }
}
```

### Project References
```json
// ✅ Correct - Proper project references
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "references": [
    { "path": "../database" },
    { "path": "../ui" },
    { "path": "../design-tokens" }
  ]
}

// ❌ Incorrect - No project references
{
  "compilerOptions": {
    // Missing composite and declaration settings
  }
  // No references section
}
```

## Package Commands

```bash
# Type check project
pnpm types:check

# Validate configuration
pnpm types:validate

# Upgrade configuration
pnpm types:upgrade --target=ES2022

# Update project references
pnpm types:references
```

## File Structure

```
packages/typescript-config/
├── base.json                # Base TypeScript configuration
├── strict.json              # Strict configuration overrides
├── node.json                # Node.js specific settings
├── react.json               # React specific settings
├── next.json                # Next.js specific settings
├── AGENTS.md                # This file
└── package.json
```

## Key Exports

### Base Configuration
```json
// tsconfig.json
{
  "extends": "@agency/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Strict Configuration
```json
// tsconfig.strict.json
{
  "extends": "@agency/typescript-config/strict.json",
  "compilerOptions": {
    // Package-specific strict overrides
  }
}
```

## Configuration Files

### Base Configuration (base.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": false
  }
}
```

### Strict Configuration (strict.json)
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

### Node.js Configuration (node.json)
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "types": ["node"]
  }
}
```

### React Configuration (react.json)
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["react", "react-dom", "react/next"]
  }
}
```

### Next.js Configuration (next.json)
```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Security Requirements

### Type Safety Enforcement
```json
// ✅ Correct - Maximum type safety
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}

// ❌ Incorrect - Weak type safety
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

### Secure Module Resolution
```json
// ✅ Correct - Secure module resolution
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "verbatimModuleSyntax": false
  }
}
```

## Testing Patterns

### Configuration Validation
```typescript
// test/config.test.ts
import { validateConfig } from '@agency/typescript-config';
import baseConfig from '../base.json';

describe('TypeScript Configuration', () => {
  it('validates base configuration', () => {
    const validation = validateConfig(baseConfig);
    
    expect(validation.valid).toBe(true);
    expect(validation.compilerOptions.strict).toBe(true);
    expect(validation.compilerOptions.noImplicitAny).toBe(true);
  });
});
```

## Dependencies

This package depends on:
- TypeScript - Core compiler
- No runtime dependencies

## Progressive Documentation

For more details:
- `@packages/eslint-config/AGENTS.md` - Linting configuration
- TypeScript documentation - Compiler options reference
- `docs/TYPESCRIPT.md` - Agency TypeScript guidelines
