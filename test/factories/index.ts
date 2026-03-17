// Export all factories for easy importing
export * from './database'
export * from './ui'
export * from './api'

// Re-export factory for direct usage
export { Factory } from '../utils/factory'

// Common test utilities
export const createTestTenant = (overrides?: Partial<any>) => {
  const { tenantFactory } = require('./database')
  return tenantFactory.build(overrides)
}

export const createTestUser = (overrides?: Partial<any>) => {
  const { userFactory } = require('./ui')
  return userFactory.build(overrides)
}

export const resetAllFactories = () => {
  const { resetAllFactories: resetDB } = require('./database')
  const { resetUIFactories } = require('./ui')
  const { resetAPIFactories } = require('./api')
  
  resetDB()
  resetUIFactories()
  resetAPIFactories()
}
