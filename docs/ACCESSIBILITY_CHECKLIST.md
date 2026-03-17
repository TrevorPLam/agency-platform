# Accessibility Checklist (WCAG 2.2 AA Compliance)

This checklist ensures all public applications meet WCAG 2.2 AA standards. Use this for every new feature, page, or component deployment.

## 🎯 Phase 1: Core Requirements (Must Pass)

### ✅ Semantic Structure

- [ ] **HTML5 landmarks used**: `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`, `<aside>`
- [ ] **Single H1 per page**: Each page has exactly one `<h1>` for the main content
- [ ] **Heading hierarchy**: No skipped levels (h1 → h2 → h3, never h1 → h3)
- [ ] **Language attribute**: `<html lang="en">` set on all pages
- [ ] **Skip navigation link**: First focusable element, visible on focus

### ✅ Keyboard Navigation

- [ ] **Full keyboard access**: All interactive elements reachable with Tab
- [ ] **Visible focus indicator**: `:focus-visible` with 2px+ outline and 3:1 contrast (WCAG 2.4.11)
- [ ] **Logical tab order**: DOM order matches visual reading order
- [ ] **Focus trap in modals**: Tab stays within dialog when open
- [ ] **Escape key support**: Modals and dropdowns close on Escape

### ✅ Form Accessibility

- [ ] **Labels for all inputs**: `<label for="id">` or `aria-label`/`aria-labelledby`
- [ ] **Required field indicators**: Visual + screen reader indication (`required` attribute + "\*")
- [ ] **Error announcements**: Form errors in `role="alert"` or `aria-live="polite"`
- [ ] **Field validation**: Real-time validation with clear error messages
- [ ] **Input types**: Use appropriate `<input type="">` (email, tel, url, etc.)

### ✅ Target Size (WCAG 2.5.8)

- [ ] **Minimum touch targets**: 24×24px minimum OR 24px spacing between targets
- [ ] **Button sizing**: All buttons meet minimum target size
- [ ] **Link spacing**: Inline links have adequate spacing or larger hit areas

## 🎯 Phase 2: Content & Media (Must Pass)

### ✅ Images & Media

- [ ] **Meaningful alt text**: Decorative images have `alt=""`, informative images have descriptive alt
- [ ] **Complex images**: Charts/diagrams have long descriptions or data tables
- [ ] **Video captions**: All video content has accurate captions
- [ ] **Audio transcripts**: Audio-only content has text transcripts

### ✅ Text & Readability

- [ ] **Color contrast**: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- [ ] **Text resizing**: Text scales 200% without breaking layout or functionality
- [ ] **Link purpose**: Link text is descriptive out of context (avoid "click here")
- [ ] **No text in images**: All text is actual text, not embedded in images

### ✅ Color & Visual

- [ ] **Color not sole indicator**: Information conveyed with color + text/icon
- [ ] **Focus visibility**: Keyboard focus clearly visible with high contrast
- [ ] **No seizure triggers**: No flashing content (>3Hz) or rapidly changing colors

## 🎯 Phase 3: Advanced Requirements (Should Pass)

### ✅ ARIA Implementation

- [ ] **ARIA used correctly**: No redundant ARIA (e.g., `role="button"` on `<button>`)
- [ ] **Live regions**: Dynamic content updates announced appropriately
- [ ] **Screen reader announcements**: Page changes, errors, and status updates announced
- [ ] **Custom widgets**: Tabs, accordions, menus follow ARIA patterns

### ✅ Mobile & Touch

- [ ] **Touch target size**: 44×44px minimum for critical actions
- [ ] **Orientation support**: Content works in portrait and landscape
- [ ] **Zoom support**: Pinch-to-zoom works up to 200% without breaking functionality

### ✅ Performance & Cognitive

- [ ] **Page load time**: Content loads within 3 seconds on 3G
- [ ] **Timeout warnings**: Forms with timeouts warn users before expiration
- [ ] **Consistent navigation**: Navigation appears in same location across pages
- [ ] **Help and support**: Help mechanisms available and consistently located

## 🧪 Automated Testing Requirements

### Unit Tests ( axe-core )

```typescript
// Every component test must include:
import { axe, toHaveNoViolations } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### E2E Tests ( @axe-core/playwright )

```typescript
// Every critical user journey test must include:
import AxeBuilder from '@axe-core/playwright'

test('homepage accessibility', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
```

## 🚀 Release Gates

### Pre-merge Requirements

- [ ] **All new components pass axe-core tests**
- [ ] **Critical user journeys pass E2E accessibility tests**
- [ ] **Manual keyboard navigation test performed**
- [ ] **Screen reader spot check performed**

### Pre-deployment Requirements

- [ ] **Full accessibility checklist completed**
- [ ] **Automated test suite passes with 0 violations**
- [ ] **Cross-browser keyboard navigation verified**
- [ ] **Mobile accessibility verified**

## 🔧 Development Tools

### Browser Extensions (Recommended)

- **axe DevTools**: Chrome extension for real-time accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Color Contrast Analyzer**: Verify contrast ratios

### Screen Readers for Testing

- **NVDA** (Windows, free): Primary testing screen reader
- **VoiceOver** (macOS/iOS): Built-in screen reader
- **TalkBack** (Android): Built-in screen reader

### Keyboard Testing Checklist

1. **Tab through entire page**: All interactive elements reachable
2. **Shift+Tab**: Reverse navigation works
3. **Enter/Space**: Activate buttons and links
4. **Arrow keys**: Navigate menus, lists, radio buttons
5. **Escape**: Close modals, cancel operations

## 📝 Common Issues & Solutions

### Focus Issues

```css
/* ❌ Bad - Removes focus indicator */
:focus {
  outline: none;
}

/* ✅ Good - Enhanced focus indicator */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### Target Size Issues

```css
/* ❌ Bad - Small touch target */
.icon-button {
  width: 16px;
  height: 16px;
}

/* ✅ Good - Adequate touch target */
.icon-button {
  min-width: 24px;
  min-height: 24px;
  padding: 8px; /* Expands hit area without changing visual size */
}
```

### ARIA Anti-patterns

```tsx
// ❌ Bad - Redundant ARIA
<button role="button">Click</button>

// ✅ Good - Semantic HTML
<button>Click</button>

// ❌ Bad - Using div as button
<div role="button" onClick={handleClick}>Click</div>

// ✅ Good - Real button with proper styling
<button onClick={handleClick}>Click</button>
```

## 📚 Resources

- **WCAG 2.2 Guidelines**: <https://www.w3.org/TR/WCAG22/>
- **axe Documentation**: <https://www.deque.com/axe/>
- **WebAIM Checklist**: <https://webaim.org/standards/wcag/checklist/>
- **A11y Project**: <https://www.a11yproject.com/>

---

**Last Updated**: March 2026  
**Version**: 1.0  
**Compliance**: WCAG 2.2 AA
