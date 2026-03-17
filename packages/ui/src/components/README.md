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

### 🎨 Theming

Components use design tokens for consistent theming:

```css
/* Custom theme overrides */
.card {
  --card-background: var(--color-surface);
  --card-border: var(--color-border);
  --card-shadow: var(--shadow-md);
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

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../../../docs/) • [🎨 Design Tokens](../design-tokens/) • [🔒 Security](../../../../SECURITY.md)

</div>
