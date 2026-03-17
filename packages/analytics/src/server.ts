import { PostHog } from 'posthog-node'

// Singleton instance for server-side PostHog client
let posthogInstance: PostHog | null = null

/**
 * Server-side event properties with mandatory tenant field.
 * This TypeScript interface ensures all server events include tenant context.
 */
export interface ServerEventProperties {
  [key: string]: unknown
  tenant: string
}

/**
 * Get or create the singleton PostHog server client.
 * Implements lazy initialization to prevent issues during static generation.
 * Uses optimized batching settings for serverless environments.
 */
function getServerClient(): PostHog | null {
  if (!posthogInstance) {
    if (!process.env['NEXT_PUBLIC_POSTHOG_KEY']) {
      console.warn('PostHog API key not configured')
      return null
    }

    const options: Record<string, unknown> = {
      flushAt: 10,
      flushInterval: 10000,
    }
    
    const host = process.env['NEXT_PUBLIC_POSTHOG_HOST']
    if (host) {
      options['host'] = host
    }
    
    posthogInstance = new PostHog(process.env['NEXT_PUBLIC_POSTHOG_KEY'], options)
  }

  return posthogInstance
}

/**
 * Capture an analytics event on the server side.
 * Tenant field is mandatory at the TypeScript level.
 *
 * @param distinctId - User identifier (will be made tenant-specific)
 * @param event - Event name
 * @param properties - Event properties, must include tenant field
 */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties: ServerEventProperties
): void {
  try {
    const posthog = getServerClient()
    if (!posthog) {
      return
    }

    // Create tenant-specific distinct ID for uniqueness across tenants
    const tenantSpecificId = `${distinctId}@${properties.tenant}`

    posthog.capture({
      distinctId: tenantSpecificId,
      event,
      properties: {
        ...properties,
        // Ensure tenant is always present (redundant but safe)
        tenant: properties.tenant,
      },
    })
  } catch (error) {
    // Fail silently to avoid breaking server-side functionality
    console.error('Failed to capture server analytics event:', error)
  }
}

/**
 * Identify a user on the server side.
 * Creates tenant-specific user identification.
 *
 * @param distinctId - User identifier
 * @param properties - User properties, must include tenant field
 */
export function identifyServerUser(distinctId: string, properties: ServerEventProperties): void {
  try {
    const posthog = getServerClient()
    if (!posthog) {
      return
    }

    // Create tenant-specific distinct ID
    const tenantSpecificId = `${distinctId}@${properties.tenant}`

    posthog.identify({
      distinctId: tenantSpecificId,
      properties: {
        ...properties,
        tenant: properties.tenant,
      },
    })
  } catch (error) {
    console.error('Failed to identify server user:', error)
  }
}

/**
 * Alias multiple user identifiers together on the server side.
 * Useful for merging anonymous and authenticated users.
 *
 * @param distinctId - New user identifier
 * @param alias - Previous user identifier to alias from
 * @param tenant - Tenant slug for context
 */
export function aliasServerUser(distinctId: string, alias: string, tenant: string): void {
  try {
    const posthog = getServerClient()
    if (!posthog) {
      return
    }

    // Create tenant-specific identifiers
    const tenantSpecificId = `${distinctId}@${tenant}`
    const tenantSpecificAlias = `${alias}@${tenant}`

    posthog.alias({
      distinctId: tenantSpecificId,
      alias: tenantSpecificAlias,
    })
  } catch (error) {
    console.error('Failed to alias server user:', error)
  }
}

/**
 * Flush pending events immediately.
 * Useful for ensuring events are sent before function termination.
 */
export function flushServerEvents(): Promise<void> {
  try {
    const posthog = getServerClient()
    if (!posthog) {
      return Promise.resolve()
    }
    return posthog.flush()
  } catch (error) {
    console.error('Failed to flush server analytics events:', error)
    return Promise.resolve()
  }
}

/**
 * Get the raw PostHog server client for advanced usage.
 * Use sparingly and prefer the typed functions above.
 */
export function getPostHogServerClient(): PostHog | null {
  return getServerClient()
}
