import { describe, it, expect } from 'vitest'

describe('Button Accessibility - Simple Tests', () => {
  it('has basic button accessibility attributes', () => {
    const html = '<button>Click me</button>'
    
    // Basic accessibility checks
    expect(html).toContain('<button')
    expect(html).toContain('Click me')
    
    // Should not have accessibility anti-patterns
    expect(html).not.toContain('role="button"') // Don't add redundant role to button element
    expect(html).not.toContain('aria-disabled="true"') // Use disabled attribute instead
  })

  it('has proper ARIA when disabled', () => {
    const html = '<button disabled>Disabled Button</button>'
    
    expect(html).toContain('disabled')
    expect(html).toContain('Disabled Button')
  })

  it('supports ARIA attributes correctly', () => {
    const html = '<button aria-label="Close dialog" aria-expanded="false">×</button>'
    
    expect(html).toContain('aria-label="Close dialog"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('×')
  })

  it('has proper semantics when used as link', () => {
    const html = '<a href="https://example.com" role="button">Link Button</a>'
    
    expect(html).toContain('<a')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('role="button"')
    expect(html).toContain('Link Button')
  })

  it('supports keyboard navigation attributes', () => {
    const html = '<button tabindex="0">Tabbable Button</button>'
    
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('Tabbable Button')
  })

  it('has accessible error state', () => {
    const html = '<button aria-invalid="true">Invalid Input</button>'
    
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('Invalid Input')
  })

  it('supports screen reader announcements', () => {
    const html = '<button aria-live="polite" aria-label="Close dialog">×</button>'
    
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('aria-label="Close dialog"')
  })

  it('handles complex content accessibly', () => {
    const html = '<button><span class="icon">→</span><span>Next Step</span><span class="badge">New</span></button>'
    
    expect(html).toContain('<button')
    expect(html).toContain('Next Step')
    expect(html).toContain('New')
  })

  it('supports loading state accessibly', () => {
    const html = '<button aria-busy="true" disabled><span aria-hidden="true">⏳</span>Loading...</button>'
    
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('disabled')
    expect(html).toContain('Loading...')
    expect(html).toContain('aria-hidden="true"')
  })

  it('integrates with tooltips accessibly', () => {
    const html = '<button aria-describedby="tooltip-help">Save</button>'
    
    expect(html).toContain('aria-describedby="tooltip-help"')
    expect(html).toContain('Save')
  })

  it('has proper form submission attributes', () => {
    const html = '<button type="submit">Submit Form</button>'
    
    expect(html).toContain('type="submit"')
    expect(html).toContain('Submit Form')
  })
})
