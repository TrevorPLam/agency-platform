/**
 * Test data fixtures for common test scenarios
 */

export const TENANTS = {
  active: {
    id: 'tenant-active-123',
    name: 'Active Agency',
    slug: 'active-agency',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  inactive: {
    id: 'tenant-inactive-456',
    name: 'Inactive Agency',
    slug: 'inactive-agency',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-01T00:00:00Z'
  },
  trial: {
    id: 'tenant-trial-789',
    name: 'Trial Agency',
    slug: 'trial-agency',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
} as const

export const USERS = {
  admin: {
    id: 'user-admin-123',
    email: 'admin@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  member: {
    id: 'user-member-456',
    email: 'member@example.com',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  owner: {
    id: 'user-owner-789',
    email: 'owner@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
} as const

export const TENANT_USERS = {
  admin: {
    id: 'tenant-user-admin-123',
    user_id: USERS.admin.id,
    tenant_id: TENANTS.active.id,
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  member: {
    id: 'tenant-user-member-456',
    user_id: USERS.member.id,
    tenant_id: TENANTS.active.id,
    role: 'member',
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  owner: {
    id: 'tenant-user-owner-789',
    user_id: USERS.owner.id,
    tenant_id: TENANTS.active.id,
    role: 'owner',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
} as const

export const POSTS = {
  published: {
    id: 'post-published-123',
    title: 'Published Post',
    slug: 'published-post',
    content: 'This is a published post content.',
    excerpt: 'This is the excerpt.',
    tenant_id: TENANTS.active.id,
    status: 'published',
    published_at: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T12:00:00Z'
  },
  draft: {
    id: 'post-draft-456',
    title: 'Draft Post',
    slug: 'draft-post',
    content: 'This is a draft post content.',
    excerpt: 'This is the draft excerpt.',
    tenant_id: TENANTS.active.id,
    status: 'draft',
    published_at: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
} as const

export const BOOKINGS = {
  pending: {
    id: 'booking-pending-123',
    tenant_id: TENANTS.active.id,
    user_id: USERS.member.id,
    service_type: 'consultation',
    status: 'pending',
    scheduled_at: '2024-02-01T10:00:00Z',
    notes: 'Initial consultation request',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  confirmed: {
    id: 'booking-confirmed-456',
    tenant_id: TENANTS.active.id,
    user_id: USERS.member.id,
    service_type: 'development',
    status: 'confirmed',
    scheduled_at: '2024-01-20T14:00:00Z',
    notes: 'Website development project',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z'
  }
} as const

export const CONTACT_SUBMISSIONS = {
  new: {
    id: 'contact-new-123',
    tenant_id: TENANTS.active.id,
    name: 'John Doe',
    email: 'john@example.com',
    message: 'I am interested in your services.',
    status: 'new',
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z'
  },
  contacted: {
    id: 'contact-contacted-456',
    tenant_id: TENANTS.active.id,
    name: 'Jane Smith',
    email: 'jane@example.com',
    message: 'Looking for a partnership opportunity.',
    status: 'contacted',
    created_at: '2024-01-14T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
} as const

export const ANALYTICS_EVENTS = {
  page_view: {
    id: 'event-page-123',
    tenant_id: TENANTS.active.id,
    user_id: USERS.member.id,
    event_type: 'page_view',
    event_name: 'home_page',
    properties: {
      path: '/',
      referrer: 'direct',
      user_agent: 'Mozilla/5.0...'
    },
    created_at: '2024-01-16T10:00:00Z'
  },
  form_submit: {
    id: 'event-form-456',
    tenant_id: TENANTS.active.id,
    user_id: USERS.member.id,
    event_type: 'form_submit',
    event_name: 'contact_form',
    properties: {
      form_name: 'contact',
      form_version: '1.0'
    },
    created_at: '2024-01-16T11:00:00Z'
  }
} as const

// Test scenarios
export const TEST_SCENARIOS = {
  emptyDatabase: {},
  singleTenant: {
    tenants: [TENANTS.active],
    users: [USERS.admin, USERS.member],
    tenantUsers: [TENANT_USERS.admin, TENANT_USERS.member]
  },
  multiTenant: {
    tenants: [TENANTS.active, TENANTS.inactive, TENANTS.trial],
    users: [USERS.admin, USERS.member, USERS.owner],
    tenantUsers: [
      TENANT_USERS.admin, 
      TENANT_USERS.member, 
      TENANT_USERS.owner
    ]
  },
  withContent: {
    ...TEST_SCENARIOS.singleTenant,
    posts: [POSTS.published, POSTS.draft]
  },
  withBookings: {
    ...TEST_SCENARIOS.singleTenant,
    bookings: [BOOKINGS.pending, BOOKINGS.confirmed]
  },
  withContacts: {
    ...TEST_SCENARIOS.singleTenant,
    contacts: [CONTACT_SUBMISSIONS.new, CONTACT_SUBMISSIONS.contacted]
  },
  fullAgency: {
    ...TEST_SCENARIOS.singleTenant,
    posts: [POSTS.published, POSTS.draft],
    bookings: [BOOKINGS.pending, BOOKINGS.confirmed],
    contacts: [CONTACT_SUBMISSIONS.new, CONTACT_SUBMISSIONS.contacted],
    events: [ANALYTICS_EVENTS.page_view, ANALYTICS_EVENTS.form_submit]
  }
} as const
