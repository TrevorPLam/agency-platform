# @agency/ui Package

## Purpose

Shared shadcn/ui components with Storybook integration and tenant-aware theming. This package provides a consistent design system across all agency applications.

## Core Patterns

### Component Usage
```typescript
// ✅ Correct - Import from @agency/ui
import { Button, Card, Input } from '@agency/ui';

export function UserProfile({ user }: { user: User }) {
  return (
    <Card className="p-4">
      <Input value={user.name} readOnly />
      <Button onClick={() => console.log('clicked')}>
        Edit Profile
      </Button>
    </Card>
  );
}

// ❌ Incorrect - Direct shadcn imports
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

### Tenant-Aware Styling
```typescript
// ✅ Correct - Use design tokens with tenant context
import { Button } from '@agency/ui';
import { useTenantTheme } from '@agency/ui/hooks';

export function TenantButton({ children }: { children: React.ReactNode }) {
  const { theme } = useTenantTheme();
  
  return (
    <Button 
      className={theme.colors.primary}
      style={{ 
        backgroundColor: `var(--tenant-primary-${theme.id})`,
        color: `var(--tenant-on-primary-${theme.id})`
      }}
    >
      {children}
    </Button>
  );
}

// ❌ Incorrect - Hardcoded colors
export function BadButton({ children }: { children: React.ReactNode }) {
  return (
    <Button style={{ backgroundColor: '#3b82f6' }}>
      {children}
    </Button>
  );
}
```

### Storybook Integration
```typescript
// ✅ Correct - Storybook stories with tenant context
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@agency/ui';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

export const WithTenant: Story = {
  args: {
    children: 'Tenant Button',
    className: 'tenant-tenant-1',
  },
  parameters: {
    tenant: {
      id: 'tenant-1',
      theme: 'light',
    },
  },
};

// ❌ Incorrect - Stories without context
export const BadStory: Story = {
  render: () => <Button>Click</Button>, // Missing args object
};
```

## Package Commands

```bash
# Build package
pnpm build

# Start Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook

# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

## File Structure

```
packages/ui/
├── src/
│   ├── components/          # shadcn/ui components
│   │   ├── ui/             # Base UI components
│   │   └── agency/         # Agency-specific components
│   ├── hooks/              # Custom hooks
│   │   ├── use-tenant-theme.ts
│   │   └── use-design-tokens.ts
│   ├── lib/                # Utilities
│   │   ├── utils.ts
│   │   └── cn.ts           # Classname utility
│   └── index.ts           # Main exports
├── .storybook/            # Storybook configuration
├── stories/               # Component stories
├── AGENTS.md              # This file
└── package.json
```

## Key Exports

### Components
```typescript
// Base shadcn/ui components
import { Button, Card, Input, Select } from '@agency/ui';

// Agency-specific components
import { TenantHeader, UserProfile, Navigation } from '@agency/ui';
```

### Hooks
```typescript
// Tenant theming
import { useTenantTheme } from '@agency/ui/hooks';

function MyComponent() {
  const { theme, tokens } = useTenantTheme();
  
  return (
    <div style={{ 
      backgroundColor: tokens.colors.background,
      color: tokens.colors.onBackground 
    }}>
      Content
    </div>
  );
}
```

### Utilities
```typescript
// Classname merging
import { cn } from '@agency/ui/lib';

const className = cn(
  'base-class',
  isActive && 'active-class',
  'additional-class'
);
```

## Design Token Integration

### Token Usage
```typescript
// ✅ Correct - Use CSS custom properties
const styles = {
  backgroundColor: 'var(--token-color-primary)',
  color: 'var(--token-color-on-primary)',
  padding: 'var(--token-spacing-md)',
};

// ❌ Incorrect - Hardcoded values
const styles = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  padding: '16px',
};
```

### Tenant Theming
```typescript
// ✅ Correct - Tenant-specific tokens
function TenantComponent({ tenantId }: { tenantId: string }) {
  return (
    <div 
      className={`tenant-${tenantId}`}
      style={{
        '--tenant-primary': `var(--tenant-primary-${tenantId})`,
        '--tenant-background': `var(--tenant-background-${tenantId})`,
      } as React.CSSProperties}
    >
      Content
    </div>
  );
}
```

## Component Development Patterns

### Component Structure
```typescript
// ✅ Correct - Component with proper typing
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  tenant?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', tenant, ...props }, ref) => {
    return (
      <button
        className={cn(
          'button-base',
          `button-${variant}`,
          `button-${size}`,
          tenant && `tenant-${tenant}`,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

// ❌ Incorrect - Component without proper typing
export function BadButton(props: any) {
  return <button {...props} />; // No type safety
}
```

### Accessibility
```typescript
// ✅ Correct - Accessible component
export function AccessibleCard({ title, children }: CardProps) {
  return (
    <Card role="article" aria-labelledby={`card-title-${title}`}>
      <h3 id={`card-title-${title}`}>{title}</h3>
      <div>{children}</div>
    </Card>
  );
}

// ❌ Incorrect - Missing accessibility
export function InaccessibleCard({ title, children }: CardProps) {
  return (
    <Card>
      <h3>{title}</h3> {/* No association with content */}
      <div>{children}</div>
    </Card>
  );
}
```

## Testing Patterns

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@agency/ui';

describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('button-destructive');
  });

  it('applies tenant classes correctly', () => {
    render(<Button tenant="tenant-1">Submit</Button>);
    
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveClass('tenant-tenant-1');
  });
});
```

### Storybook Testing
```typescript
// ✅ Correct - Story with accessibility tests
export const Accessible: Story = {
  args: {
    children: 'Accessible Button',
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            // Custom accessibility rules
            id: 'button-name',
            enabled: true,
          },
        ],
      },
    },
  },
};
```

## Performance Considerations

### Lazy Loading
```typescript
// ✅ Correct - Lazy load heavy components
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('@agency/ui/components/HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <HeavyChart />
    </Suspense>
  );
}

// ❌ Incorrect - Eager loading
import { HeavyChart } from '@agency/ui/components/HeavyChart'; // Loaded immediately
```

### Bundle Optimization
```typescript
// ✅ Correct - Tree-shakeable exports
export { Button } from './components/ui/button';
export { Card } from './components/ui/card';

// Re-export only what's needed
export type { ButtonProps } from './components/ui/button';

// ❌ Incorrect - Barrel exports that prevent tree-shaking
export * from './components'; // Exports everything
```

## Dependencies

This package depends on:
- `react` - Component framework
- `@radix-ui/*` - Accessible component primitives
- `class-variance-authority` - Component variants
- `clsx` - Classname utility
- `tailwindcss` - Styling framework
- `storybook` - Component documentation

## Integration with Design Tokens

### Token Compilation
```bash
# Build design tokens
pnpm tokens:build

# Watch for token changes
pnpm tokens:watch

# Validate token usage
pnpm tokens:validate
```

### Token Usage in Components
```typescript
// ✅ Correct - Use compiled tokens
import { tokens } from '@agency/ui/tokens';

const styles = {
  color: tokens.colors.primary,
  spacing: tokens.spacing.md,
};

// ❌ Incorrect - Direct token file access
import rawTokens from '@agency/design-tokens/tokens.json'; // Don't do this
```

## Progressive Documentation

For more details:
- `@packages/design-tokens/AGENTS.md` - Design token patterns
- `@.agents/testing.md` - Testing guidelines
- `storybook.localhost:6006` - Interactive component documentation
