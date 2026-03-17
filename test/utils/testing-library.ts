import { render, RenderOptions, waitFor } from '@testing-library/react'
import { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Accessibility testing utilities
export const runAccessibilityTests = async (container: HTMLElement) => {
  const axe = await import('axe-core')
  const results = await axe.run(container)
  
  if (results.violations.length > 0) {
    console.error('Accessibility violations found:', results.violations)
  }
  
  return results
}

// Form testing utilities
export const fillForm = (container: HTMLElement, formData: Record<string, string>) => {
  Object.entries(formData).forEach(([name, value]) => {
    const field = container.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (field) {
      field.value = value
      field.dispatchEvent(new Event('input', { bubbles: true }))
      field.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
}

export const submitForm = (container: HTMLElement) => {
  const form = container.querySelector('form') as HTMLFormElement
  if (form) {
    form.dispatchEvent(new Event('submit', { bubbles: true }))
  }
}

// Component testing utilities
export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

export const expectButtonToBeDisabled = (button: HTMLElement | null) => {
  expect(button).toBeInTheDocument()
  expect(button).toBeDisabled()
}

export const expectButtonToBeEnabled = (button: HTMLElement | null) => {
  expect(button).toBeInTheDocument()
  expect(button).not.toBeDisabled()
}

// Async testing utilities
export const waitForElementToBeVisible = async (element: HTMLElement | null) => {
  await waitFor(() => {
    expectElementToBeVisible(element)
  })
}

export const waitForElementToHaveText = async (element: HTMLElement | null, text: string) => {
  await waitFor(() => {
    expectElementToHaveText(element, text)
  })
}

// Mock component utilities
export const createMockComponent = (name: string, props: any = {}) => {
  const MockComponent = ({ children, ...rest }: any) => {
    return <div data-testid={name} {...rest}>{children}</div>
  }
  MockComponent.displayName = name
  return MockComponent
}
