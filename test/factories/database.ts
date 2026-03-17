import { Factory } from '../utils/factory'
import type { Database } from '@agency/database/types'

const { each } = Factory.Sync

// Type aliases for easier usage
type Tenant = Database['public']['Tables']['tenants']['Row']
type TenantUser = Database['public']['Tables']['tenant_users']['Row']
type Post = Database['public']['Tables']['posts']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']
type ContactSubmission = Database['public']['Tables']['contact_submissions']['Row']

// Tenant factory
export const tenantFactory = Factory.Sync.makeFactory<Tenant>({
  id: each(i => `tenant-${i}`),
  name: each(i => `Test Tenant ${i}`),
  slug: each(i => `test-tenant-${i}`),
  domain: each(i => `test-tenant-${i}.example.com`),
  status: 'active',
  created_at: each(() => new Date().toISOString()),
  updated_at: each(() => new Date().toISOString()),
})

// Tenant user factory
export const tenantUserFactory = Factory.Sync.makeFactory<TenantUser>({
  id: each(i => `user-${i}`),
  tenant_id: tenantFactory.build().id,
  user_id: each(i => `auth-user-${i}`),
  email: each(i => `user${i}@example.com`),
  role: 'member',
  is_active: true,
  created_at: each(() => new Date().toISOString()),
  updated_at: each(() => new Date().toISOString()),
})

// Post factory
export const postFactory = Factory.Sync.makeFactory<Post>({
  id: each(i => `post-${i}`),
  tenant_id: tenantFactory.build().id,
  title: each(i => `Test Post ${i}`),
  slug: each(i => `test-post-${i}`),
  content: each(i => `This is test content for post ${i}`),
  status: 'published',
  published_at: each(() => new Date().toISOString()),
  created_at: each(() => new Date().toISOString()),
  updated_at: each(() => new Date().toISOString()),
})

// Booking factory
export const bookingFactory = Factory.Sync.makeFactory<Booking>({
  id: each(i => `booking-${i}`),
  tenant_id: tenantFactory.build().id,
  name: each(i => `Test User ${i}`),
  email: each(i => `user${i}@example.com`),
  message: each(i => `Test booking message ${i}`),
  status: 'pending',
  created_at: each(() => new Date().toISOString()),
  updated_at: each(() => new Date().toISOString()),
})

// Contact submission factory
export const contactSubmissionFactory = Factory.Sync.makeFactory<ContactSubmission>({
  id: each(i => `contact-${i}`),
  tenant_id: tenantFactory.build().id,
  name: each(i => `Contact User ${i}`),
  email: each(i => `contact${i}@example.com`),
  message: each(i => `Contact message ${i}`),
  status: 'new',
  created_at: each(() => new Date().toISOString()),
  updated_at: each(() => new Date().toISOString()),
})

// Helper functions for creating test data with relationships
export const createTenantWithUsers = (userCount: number = 3) => {
  const tenant = tenantFactory.build()
  const users = tenantUserFactory.buildList(userCount, { tenant_id: tenant.id })
  
  return { tenant, users }
}

export const createTenantWithPosts = (postCount: number = 5) => {
  const tenant = tenantFactory.build()
  const posts = postFactory.buildList(postCount, { tenant_id: tenant.id })
  
  return { tenant, posts }
}

export const createTenantWithBookings = (bookingCount: number = 3) => {
  const tenant = tenantFactory.build()
  const bookings = bookingFactory.buildList(bookingCount, { tenant_id: tenant.id })
  
  return { tenant, bookings }
}

// Reset all factory sequence numbers
export const resetAllFactories = () => {
  tenantFactory.resetSequenceNumber()
  tenantUserFactory.resetSequenceNumber()
  postFactory.resetSequenceNumber()
  bookingFactory.resetSequenceNumber()
  contactSubmissionFactory.resetSequenceNumber()
}
