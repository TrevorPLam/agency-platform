import { Factory } from '../utils/factory'

const { each } = Factory.Sync

// UI component test data factories

// Button props factory
export const buttonPropsFactory = Factory.Sync.makeFactory({
  children: each(i => `Button ${i}`),
  variant: 'default' as const,
  size: 'default' as const,
  disabled: false,
  loading: false,
})

// Form field factory
export const formFieldFactory = Factory.Sync.makeFactory({
  name: each(i => `field-${i}`),
  label: each(i => `Field ${i}`),
  placeholder: each(i => `Enter value for ${i}`),
  required: false,
  disabled: false,
  error: undefined,
})

// User factory for UI tests
export const userFactory = Factory.Sync.makeFactory({
  id: each(i => `user-${i}`),
  name: each(i => `Test User ${i}`),
  email: each(i => `user${i}@example.com`),
  avatar: each(i => `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`),
  role: 'user' as const,
  isActive: true,
})

// Navigation item factory
export const navigationItemFactory = Factory.Sync.makeFactory({
  id: each(i => `nav-${i}`),
  label: each(i => `Navigation ${i}`),
  href: each(i => `/page-${i}`),
  icon: undefined,
  active: false,
  disabled: false,
})

// Alert/message factory
export const alertFactory = Factory.Sync.makeFactory({
  id: each(i => `alert-${i}`),
  title: each(i => `Alert ${i}`),
  message: each(i => `This is alert message ${i}`),
  variant: 'info' as const,
  dismissible: true,
})

// Table data factory
export const tableRowFactory = Factory.Sync.makeFactory({
  id: each(i => `row-${i}`),
  name: each(i => `Item ${i}`),
  status: each(i => (i % 2 === 0 ? 'active' : 'inactive')),
  created: each(() => new Date().toISOString()),
  updated: each(() => new Date().toISOString()),
})

// Form data factory
export const formDataFactory = Factory.Sync.makeFactory({
  name: each(i => `Test Name ${i}`),
  email: each(i => `test${i}@example.com`),
  message: each(i => `Test message ${i}`),
  terms: false,
  newsletter: true,
})

// Helper functions
export const createButtonWithVariants = () => ({
  default: buttonPropsFactory.build({ variant: 'default' }),
  destructive: buttonPropsFactory.build({ variant: 'destructive' }),
  outline: buttonPropsFactory.build({ variant: 'outline' }),
  secondary: buttonPropsFactory.build({ variant: 'secondary' }),
  ghost: buttonPropsFactory.build({ variant: 'ghost' }),
  link: buttonPropsFactory.build({ variant: 'link' }),
})

export const createFormWithErrors = () => {
  const baseForm = formDataFactory.build()
  return {
    ...baseForm,
    errors: {
      name: i % 2 === 0 ? 'Name is required' : undefined,
      email: i % 3 === 0 ? 'Invalid email format' : undefined,
      message: i % 4 === 0 ? 'Message too short' : undefined,
    }
  }
}

export const resetUIFactories = () => {
  buttonPropsFactory.resetSequenceNumber()
  formFieldFactory.resetSequenceNumber()
  userFactory.resetSequenceNumber()
  navigationItemFactory.resetSequenceNumber()
  alertFactory.resetSequenceNumber()
  tableRowFactory.resetSequenceNumber()
  formDataFactory.resetSequenceNumber()
}
