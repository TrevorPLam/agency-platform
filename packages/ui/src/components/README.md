# Component Hierarchy (Atomic Design)

<div align="center">

**Atomic Design methodology for scalable component architecture**

[![Storybook](https://img.shields.io/badge/Storybook-latest-ff69b4)](https://storybook.js.org/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-000000)](https://ui.shadcn.com/)
[![Atomic Design](https://img.shields.io/badge/Atomic%20Design-Methodology-blue)](https://atomicdesign.bradfrost.com/)

</div>

## 🏗️ Architecture Overview

### 📋 In-Repo Rules & Guidelines

**Levels and in-repo rules:** See [docs/architecture/ATOMIC_DESIGN.md](../../../../docs/architecture/ATOMIC_DESIGN.md) for comprehensive atomic design implementation.

**Component structure:** See [ARCHITECTURE.md](../../../../docs/architecture/ARCHITECTURE.md) §Component structure for detailed organization patterns.

### 🎯 Design Principles

- **Atomic Design Methodology** - Atoms → Molecules → Organisms → Templates → Pages
- **Component Isolation** - Each component is self-contained and reusable
- **Consistent Theming** - Design tokens for visual consistency
- **Accessibility First** - WCAG 2.1 AA compliance built-in
- **Type Safety** - Full TypeScript support with strict typing

## 🔧 Component Development Guidelines

### 📍 When Adding Components

Follow the hierarchical approach:

1. **Start with Atoms** - Basic building blocks (buttons, inputs, labels)
2. **Combine into Molecules** - Simple component groups (search box, form field)
3. **Build Organisms** - Complex UI sections (header, sidebar, card)
4. **Create Templates** - Layout structures with placeholder content
5. **Compose Pages** - Final UI with actual content

### 🚫 Import Restrictions

- **No App-to-App Imports** - Prevent circular dependencies
- **Shared UI Here** - All reusable components live in this package
- **App-Specific UI** - Client-specific components stay in `apps/*/src/components`
- **Promote Patterns** - When a component repeats across apps, promote it here

### 📁 File Structure

```
packages/ui/src/components/
├── atoms/              # Basic building blocks
│   ├── Button/
│   ├── Input/
│   ├── Label/
│   └── Icon/
├── molecules/          # Simple component groups
│   ├── SearchBox/
│   ├── FormField/
│   └── AvatarGroup/
├── organisms/          # Complex UI sections
│   ├── Header/
│   ├── Sidebar/
│   └── Card/
├── templates/          # Layout structures
│   ├── PageLayout/
│   └── ArticleLayout/
└── pages/             # Complete UI compositions
    ├── HomePage/
    └── SettingsPage/
```

## 🎨 Component Standards

### 📋 Component Template

Each component should include:

```typescript
// Component.tsx
'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ComponentProps {
  className?: string
  children?: React.ReactNode
  // ... other props
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('default-styles', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Component.displayName = 'Component'
```

### 🎯 Accessibility Requirements

- **Keyboard Navigation** - All interactive elements keyboard accessible
- **Screen Reader Support** - Proper ARIA labels and descriptions
- **Focus Management** - Clear focus indicators and logical tab order
- **Color Contrast** - WCAG 2.1 AA compliant color combinations
- **Reduced Motion** - Respect `prefers-reduced-motion` preferences

### 🧪 Testing Standards

```typescript
// Component.test.tsx
import { render, screen } from '@testing-library/react'
import { Component } from './Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component>Test</Component>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles accessibility', () => {
    render(<Component aria-label="Test component" />)
    expect(screen.getByLabelText('Test component')).toBeInTheDocument()
  })
})
```

## 📚 Component Library

### 🎨 Atoms

| Component | Purpose | Props | Status |
|-----------|---------|-------|--------|
| **Button** | Clickable actions | `variant`, `size`, `disabled` | ✅ Stable |
| **Input** | Text input | `type`, `placeholder`, `error` | ✅ Stable |
| **Label** | Text labels | `htmlFor`, `required` | ✅ Stable |
| **Icon** | SVG icons | `name`, `size`, `color` | ✅ Stable |

### 🔬 Molecules

| Component | Purpose | Props | Status |
|-----------|---------|-------|--------|
| **SearchBox** | Search input + button | `placeholder`, `onSearch` | ✅ Stable |
| **FormField** | Input + label + error | `label`, `error`, `required` | ✅ Stable |
| **AvatarGroup** | Multiple avatars | `users`, `max`, `size` | 🔄 In Development |

### 🏢 Organisms

| Component | Purpose | Props | Status |
|-----------|---------|-------|--------|
| **Header** | Site navigation | `navigation`, `user` | ✅ Stable |
| **Sidebar** | Side navigation | `items`, `collapsed` | 🔄 In Development |
| **Card** | Content container | `title`, `actions`, `children` | ✅ Stable |

## 🚀 Getting Started

### 📦 Installation

```bash
pnpm add @agency/ui
```

### 🔧 Usage

```tsx
'use client'

import { Button, Input, Card } from '@agency/ui'

export default function Example() {
  return (
    <Card title="Example Form">
      <Input placeholder="Enter your name" />
      <Button variant="primary">Submit</Button>
    </Card>
  )
}
```

### 🎯 **Real-World Examples**

#### **Contact Form Component**

```tsx
import { Card, Input, Button, Label, Textarea } from '@agency/ui'

export default function ContactForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }

  return (
    <Card className="max-w-md mx-auto" title="Contact Us">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="John Doe" required />
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" required />
        </div>
        
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" placeholder="Your message..." rows={4} />
        </div>
        
        <Button type="submit" className="w-full">
          Send Message
        </Button>
      </form>
    </Card>
  )
}
```

#### **Navigation Header**

```tsx
import { Header, Button, Avatar, Icon } from '@agency/ui'

export default function NavigationHeader() {
  return (
    <Header
      logo={
        <div className="flex items-center space-x-2">
          <Icon name="logo" size="sm" />
          <span className="font-bold">Agency</span>
        </div>
      }
      navigation={
        <nav className="flex space-x-4">
          <Button variant="ghost" href="/">Home</Button>
          <Button variant="ghost" href="/about">About</Button>
          <Button variant="ghost" href="/services">Services</Button>
        </nav>
      }
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline">Sign In</Button>
          <Avatar src="/user-avatar.jpg" alt="User" />
        </div>
      }
    />
  )
}
```

#### **Dashboard Card Grid**

```tsx
import { Card, Icon, Button } from '@agency/ui'

export default function DashboardGrid() {
  const metrics = [
    { title: 'Total Revenue', value: '$12,345', change: '+12%', icon: 'dollar' },
    { title: 'Active Users', value: '1,234', change: '+5%', icon: 'users' },
    { title: 'Conversion Rate', value: '3.2%', change: '-2%', icon: 'chart' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{metric.title}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className={`text-sm ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change}
              </p>
            </div>
            <Icon name={metric.icon} size="lg" className="text-gray-400" />
          </div>
        </Card>
      ))}
    </div>
  )
}
```

### 🎨 Theming

Components use design tokens for consistent theming:

```css
/* Custom theme overrides */
.card {
  --card-background: var(--color-surface);
  --card-border: var(--color-border);
  --card-shadow: var(--shadow-md);
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .card {
    --card-background: var(--color-surface-dark);
    --card-border: var(--color-border-dark);
  }
}
```

### 🎨 **Custom Component Examples**

#### **Themed Button Variants**

```tsx
import { Button } from '@agency/ui'

export default function ButtonExamples() {
  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      
      <div className="flex space-x-2">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      
      <div className="flex space-x-2">
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <Button icon="plus">With Icon</Button>
      </div>
    </div>
  )
}
```

#### **Form with Validation**

```tsx
import { Card, Input, Button, Label } from '@agency/ui'
import { useState } from 'react'

export default function ValidatedForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    if (name === 'email' && !value.includes('@')) {
      newErrors.email = 'Please enter a valid email'
    } else {
      delete newErrors.email
    }
    
    if (name === 'password' && value.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else {
      delete newErrors.password
    }
    
    setErrors(newErrors)
  }

  return (
    <Card title="Sign Up" className="max-w-md mx-auto">
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            error={errors.email}
            onChange={(e) => validateField('email', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            error={errors.password}
            onChange={(e) => validateField('password', e.target.value)}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={Object.keys(errors).length > 0}
        >
          Create Account
        </Button>
      </div>
    </Card>
  )
}
```

## 📖 Documentation

### 📚 Storybook

Run Storybook to view and test components:

```bash
# From repo root
pnpm storybook

# From this package
pnpm run storybook
```

### 🔍 Component Inspection

```bash
# List all components
pnpm run components:list

# Find component usage
pnpm run components:find Button

# Validate component structure
pnpm run components:validate
```

## 🧪 Development

### 🔧 Build Commands

```bash
# Build components
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint

# Testing
pnpm test

# Storybook
pnpm storybook
```

### 🔄 Component Lifecycle

1. **Design** - Create design in Figma/Sketch
2. **Implement** - Build component with TypeScript
3. **Test** - Add unit and accessibility tests
4. **Document** - Add Storybook stories
5. **Review** - Code review and accessibility audit
6. **Publish** - Update package version

## 🤝 Contributing

### 📋 Contribution Guidelines

1. **Follow Atomic Design** - Use appropriate hierarchy level
2. **TypeScript First** - Strict typing for all props
3. **Accessibility Required** - WCAG 2.1 AA compliance
4. **Test Coverage** - Unit tests for all components
5. **Documentation** - Storybook stories and JSDoc comments
6. **Design Tokens** - Use tokens for all styling

### 🚀 Component Submission

```bash
# 1. Create component
mkdir packages/ui/src/components/atoms/NewComponent

# 2. Add files
touch NewComponent.tsx
touch NewComponent.test.tsx
touch NewComponent.stories.tsx
touch NewComponent.css

# 3. Implement and test
pnpm test -- NewComponent
pnpm storybook

# 4. Submit PR
git add .
git commit -m "feat: add NewComponent atom"
git push origin feature/new-component
```

## 🆘 **Troubleshooting & Support**

### **🔧 Common Issues & Solutions**

#### **1. Component Not Rendering**

**Symptoms**: Component imported but not displaying

**Solutions**:
- ✅ Check import path: `import { Button } from '@agency/ui'`
- ✅ Verify component export in `index.ts`
- ✅ Ensure `'use client'` directive for client components
- ✅ Check for TypeScript errors in console

```tsx
// Debug component import
import { Button } from '@agency/ui'
console.log('Button component:', Button)
```

#### **2. Styling Issues**

**Symptoms**: Component not styled correctly, missing design tokens

**Solutions**:
- ✅ Ensure design tokens are loaded: `import '@agency/design-tokens'`
- ✅ Check CSS variables are defined
- ✅ Verify Tailwind CSS configuration
- ✅ Check component-specific CSS imports

```css
/* Debug design tokens */
:root {
  --debug-primary: var(--color-primary, red);
}
```

#### **3. TypeScript Errors**

**Symptoms**: Type errors, missing props interfaces

**Solutions**:
- ✅ Check props interface extends HTML attributes
- ✅ Verify forwardRef usage
- ✅ Ensure proper generic types
- ✅ Check for missing exports

```tsx
// Debug component props
interface DebugButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}
```

#### **4. Accessibility Failures**

**Symptoms**: Screen reader issues, keyboard navigation problems

**Solutions**:
- ✅ Add proper ARIA labels and descriptions
- ✅ Ensure keyboard navigation support
- ✅ Check focus management
- ✅ Verify color contrast ratios

```tsx
// Accessibility audit
export default function AccessibleButton() {
  return (
    <Button
      aria-label="Submit form"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Handle keyboard interaction
        }
      }}
    >
      Submit
    </Button>
  )
}
```

#### **5. Storybook Not Working**

**Symptoms**: Storybook fails to start, components not showing

**Solutions**:
- ✅ Check Storybook configuration
- ✅ Verify component exports
- ✅ Ensure proper story file structure
- ✅ Check for missing dependencies

```tsx
// Debug Storybook story
export default {
  title: 'Atoms/Button',
  component: Button,
} as ComponentMeta<typeof Button>

export const Primary: ComponentStory<typeof Button> = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
}
```

### **🔍 Debugging Tools**

#### **Component Inspector**
```tsx
// Development-only component inspector
if (process.env.NODE_ENV === 'development') {
  const ComponentInspector = ({ children, ...props }) => {
    console.log('Component props:', props)
    return <>{children}</>
  }
}
```

#### **Theme Debugger**
```css
/* Debug CSS variables */
* {
  box-shadow: 0 0 0 1px rgba(255, 0, 0, 0.1);
}

:root {
  --debug-tokens: true;
}
```

#### **Performance Monitor**
```tsx
// Component performance monitoring
import { useEffect, useRef } from 'react'

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  
  useEffect(() => {
    renderCount.current += 1
    console.log(`${componentName} rendered ${renderCount.current} times`)
  })
}
```

### **📞 Getting Help**

**Self-Service Debugging**:
1. Check browser console for errors
2. Verify component imports and exports
3. Test in isolation with simple example
4. Check Storybook for working examples
5. Review component documentation

**Community Support**:
- **Storybook Documentation**: [https://storybook.js.org/docs](https://storybook.js.org/docs)
- **shadcn/ui Examples**: [https://ui.shadcn.com/docs/examples](https://ui.shadcn.com/docs/examples)
- **GitHub Issues**: [Agency Platform Issues](https://github.com/agency/platform/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/agency)
- **Design System Support**: ui@agency.com

**Common Debug Commands**:
```bash
# Check component exports
pnpm run components:list

# Validate component structure
pnpm run components:validate

# Test specific component
pnpm test -- Button

# Start Storybook in debug mode
pnpm storybook --debug
```

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../../../docs/) • [🎨 Design Tokens](../design-tokens/) • [🔒 Security](../../../../SECURITY.md)

</div>
