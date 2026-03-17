import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'
import { testAccessibility, expectNoViolations, testWCAG22Compliance } from '../../../test/utils/accessibility'

describe('Button Accessibility', () => {
  it('has no accessibility violations in default state', async () => {
    await expectNoViolations(<Button>Click me</Button>)
  })

  it('has no accessibility violations in all variants', async () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    
    for (const variant of variants) {
      await expectNoViolations(
        <Button variant={variant}>Button {variant}</Button>
      )
    }
  })

  it('has no accessibility violations in all sizes', async () => {
    const sizes = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const
    
    for (const size of sizes) {
      await expectNoViolations(
        <Button size={size}>Size {size}</Button>
      )
    }
  })

  it('meets WCAG 2.2 AA compliance', async () => {
    const result = await testAccessibility(<Button>Accessible Button</Button>, {
      level: 'AA',
      tags: ['wcag2a', 'wcag2aa', 'wcag22aa']
    })
    
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('meets WCAG 2.2 target size requirements (2.5.8)', async () => {
    const result = await testWCAG22Compliance(
      <Button size="lg">Large Button</Button>,
      ['TARGET_SIZE']
    )
    
    expect(result.passed).toBe(true)
  })

  it('meets WCAG 2.2 focus appearance requirements (2.4.11)', async () => {
    const result = await testWCAG22Compliance(
      <Button>Focus Test</Button>,
      ['FOCUS_APPEARANCE']
    )
    
    expect(result.passed).toBe(true)
  })

  it('has proper button semantics when rendered as button', () => {
    render(<Button>Submit</Button>)
    
    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('maintains accessibility when disabled', async () => {
    await expectNoViolations(
      <Button disabled>Disabled Button</Button>
    )
    
    render(<Button disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Disabled Button' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('disabled')
  })

  it('maintains accessibility with aria attributes', async () => {
    await expectNoViolations(
      <Button aria-describedby="help-text" aria-expanded={false}>
        Toggle
      </Button>
    )
    
    render(
      <>
        <Button aria-describedby="help-text" aria-expanded={false}>
          Toggle
        </Button>
        <div id="help-text">Click to expand more options</div>
      </>
    )
    
    const button = screen.getByRole('button', { name: 'Toggle' })
    expect(button).toHaveAttribute('aria-describedby', 'help-text')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('maintains accessibility when used as link', async () => {
    await expectNoViolations(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    )
    
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    )
    
    const link = screen.getByRole('link', { name: 'Link Button' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<Button>Keyboard Test</Button>)
    
    const button = screen.getByRole('button', { name: 'Keyboard Test' })
    
    // Tab to button
    await user.tab()
    expect(button).toHaveFocus()
    
    // Activate with Enter
    await user.keyboard('{Enter}')
    
    // Activate with Space
    await user.keyboard('{ }')
  })

  it('has appropriate focus management', () => {
    render(<Button>Focus Test</Button>)
    
    const button = screen.getByRole('button', { name: 'Focus Test' })
    
    // Check for focus-visible styling classes
    expect(button).toHaveClass(
      'focus-visible:border-ring',
      'focus-visible:ring-[3px]',
      'focus-visible:ring-ring/50'
    )
  })

  it('handles invalid state accessibly', async () => {
    await expectNoViolations(
      <Button aria-invalid="true">Invalid Input</Button>
    )
    
    render(<Button aria-invalid="true">Invalid Input</Button>)
    
    const button = screen.getByRole('button', { name: 'Invalid Input' })
    expect(button).toHaveAttribute('aria-invalid', 'true')
    
    // Check for invalid styling classes
    expect(button).toHaveClass(
      'aria-invalid:border-destructive',
      'aria-invalid:ring-destructive/20'
    )
  })

  it('supports screen reader announcements', async () => {
    render(
      <Button aria-live="polite" aria-label="Close dialog">
        ×
      </Button>
    )
    
    const button = screen.getByRole('button', { name: 'Close dialog' })
    expect(button).toHaveAttribute('aria-live', 'polite')
    expect(button).toHaveAttribute('aria-label', 'Close dialog')
  })

  it('maintains accessibility with complex content', async () => {
    await expectNoViolations(
      <Button>
        <span className="icon">→</span>
        <span>Next Step</span>
        <span className="badge">New</span>
      </Button>
    )
    
    render(
      <Button>
        <span className="icon">→</span>
        <span>Next Step</span>
        <span className="badge">New</span>
      </Button>
    )
    
    const button = screen.getByRole('button', { name: '→ Next Step New' })
    expect(button).toBeInTheDocument()
  })

  it('handles loading state accessibly', async () => {
    await expectNoViolations(
      <Button aria-busy="true" disabled>
        <span aria-hidden="true">⏳</span>
        Loading...
      </Button>
    )
    
    render(
      <Button aria-busy="true" disabled>
        <span aria-hidden="true">⏳</span>
        Loading...
      </Button>
    )
    
    const button = screen.getByRole('button', { name: '⏳ Loading...' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
  })

  it('supports tooltip integration accessibly', async () => {
    await expectNoViolations(
      <Button aria-describedby="tooltip-help">
        Save
      </Button>
    )
    
    render(
      <>
        <Button aria-describedby="tooltip-help">Save</Button>
        <div id="tooltip-help" role="tooltip">
          Saves your changes to the server
        </div>
      </>
    )
    
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('aria-describedby', 'tooltip-help')
  })

  it('maintains accessibility in form context', async () => {
    await expectNoViolations(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required />
        <Button type="submit">Submit Form</Button>
      </form>
    )
    
    render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required />
        <Button type="submit">Submit Form</Button>
      </form>
    )
    
    const submitButton = screen.getByRole('button', { name: 'Submit Form' })
    expect(submitButton).toHaveAttribute('type', 'submit')
  })
})
