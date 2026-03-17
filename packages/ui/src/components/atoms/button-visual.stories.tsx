import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Primary action control. Use for submit, primary actions. Supports variants (default, destructive, outline, secondary, ghost, link) and sizes.',
      },
    },
  },
  tags: ['autodocs', 'visual-testing'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
}

export const Icon: Story = {
  args: {
    size: 'icon',
    children: '🔍',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

// Visual testing stories with different states
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button size="xs">Extra Small</Button>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button disabled>Disabled Default</Button>
        <Button variant="outline" disabled>Disabled Outline</Button>
        <Button variant="ghost" disabled>Disabled Ghost</Button>
      </div>
    </div>
  ),
}

export const InteractiveStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div>
        <h3>Hover States</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button variant="default">Hover Default</Button>
          <Button variant="destructive">Hover Destructive</Button>
          <Button variant="outline">Hover Outline</Button>
          <Button variant="secondary">Hover Secondary</Button>
        </div>
      </div>
      <div>
        <h3>Focus States</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button variant="default">Focus Default</Button>
          <Button variant="destructive">Focus Destructive</Button>
          <Button variant="outline">Focus Outline</Button>
          <Button variant="secondary">Focus Secondary</Button>
        </div>
      </div>
      <div>
        <h3>Loading States</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button disabled>Loading...</Button>
          <Button variant="outline" disabled>Loading...</Button>
          <Button variant="ghost" disabled>Loading...</Button>
        </div>
      </div>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button>
          <span style={{ marginRight: '0.5rem' }}>🔍</span>
          Search
        </Button>
        <Button variant="outline">
          <span style={{ marginRight: '0.5rem' }}>✏️</span>
          Edit
        </Button>
        <Button variant="destructive">
          <span style={{ marginRight: '0.5rem' }}>🗑️</span>
          Delete
        </Button>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button size="icon">🔍</Button>
        <Button size="icon" variant="outline">✏️</Button>
        <Button size="icon" variant="destructive">🗑️</Button>
        <Button size="icon" variant="ghost">⚙️</Button>
      </div>
    </div>
  ),
}

export const AccessibilityTesting: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div>
        <h3>ARIA Attributes</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button aria-label="Search for items">🔍</Button>
          <Button aria-describedby="button-help">Help Button</Button>
          <Button aria-pressed="false">Toggle Button</Button>
        </div>
        <p id="button-help" style={{ fontSize: '0.875rem', color: '#666' }}>
          This button provides additional help and guidance
        </p>
      </div>
      <div>
        <h3>Keyboard Navigation</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button tabIndex={0}>Tabbable Button</Button>
          <Button tabIndex={-1}>Non-tabbable Button</Button>
          <Button accessKey="s">Access Key Button (Alt+S)</Button>
        </div>
      </div>
      <div>
        <h3>Screen Reader Support</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button role="button" aria-label="Close dialog">Close</Button>
          <Button role="button" aria-describedby="action-desc">Perform Action</Button>
        </div>
        <p id="action-desc" style={{ fontSize: '0.875rem', color: '#666' }}>
          This action will save your changes and close the dialog
        </p>
      </div>
    </div>
  ),
}
