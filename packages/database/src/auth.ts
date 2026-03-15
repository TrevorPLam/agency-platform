import { getAdminClient } from './admin'
import type { TenantId, UserId } from './types'

/**
 * User creation options interface.
 */
export interface CreateUserOptions {
  email: string
  password?: string
  tenantId: TenantId
  metadata?: Record<string, any>
  emailConfirm?: boolean
}

/**
 * User creation result interface.
 */
export interface CreateUserResult {
  user: {
    id: UserId
    email: string
    tenantId: TenantId
    emailConfirmed: boolean
  }
  needsEmailVerification: boolean
}

/**
 * Assigns an existing user to a tenant.
 * 
 * This function creates a tenant_user relationship record that
 * associates a Supabase auth user with a specific tenant. This
 * enables multi-tenant user management while maintaining
 * Supabase's global email uniqueness constraint.
 * 
 * @param userId - Supabase auth user ID
 * @param tenantId - Target tenant ID
 * @param role - User role within the tenant (optional)
 * @returns Success status
 * 
 * @example
 * ```typescript
 * import { assignUserToTenant } from '@agency/database'
 * 
 * async function addUserToTenant(userId: string, tenantId: string) {
 *   const success = await assignUserToTenant(userId, tenantId, 'member')
 *   
 *   if (success) {
 *     console.log('User assigned to tenant successfully')
 *   }
 * }
 * ```
 */
export async function assignUserToTenant(
  userId: UserId,
  tenantId: TenantId,
  role: string = 'member'
): Promise<boolean> {
  try {
    const admin = getAdminClient()
    
    // Check if user already assigned to this tenant
    const { data: existing } = await admin
      .from('tenant_users')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (existing) {
      return true // User already assigned
    }

    // Create tenant assignment
    const { error } = await admin
      .from('tenant_users')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        role,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error assigning user to tenant:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in assignUserToTenant:', error)
    return false
  }
}

/**
 * Creates a new user for a specific tenant.
 * 
 * This function implements the email aliasing pattern to work around
 * Supabase's global email uniqueness constraint. The user sees their
 * real email, but Supabase stores a unique internal email per tenant.
 * 
 * @param options - User creation options
 * @returns User creation result
 * 
 * @example
 * ```typescript
 * import { createUserForTenant } from '@agency/database'
 * 
 * async function createTenantUser(email: string, tenantId: string) {
 *   const result = await createUserForTenant({
 *     email,
 *     tenantId,
 *     emailConfirm: false
 *   })
 *   
 *   if (result.needsEmailVerification) {
 *     // Send verification email
 *     await sendVerificationEmail(result.user.email)
 *   }
 *   
 *   return result.user
 * }
 * ```
 */
export async function createUserForTenant(
  options: CreateUserOptions
): Promise<CreateUserResult> {
  const { email, password, tenantId, metadata, emailConfirm = false } = options

  try {
    const admin = getAdminClient()
    
    // Generate unique email for this tenant using aliasing pattern
    // This allows the same email to exist across multiple tenants
    const tenantSpecificEmail = generateTenantSpecificEmail(email, tenantId)
    
    // Create user in Supabase auth with tenant-specific email
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: tenantSpecificEmail,
      password: password || generateSecurePassword(),
      email_confirm: emailConfirm,
      user_metadata: {
        real_email: email, // Store original email for display
        tenant_id: tenantId,
        ...metadata
      }
    })

    if (authError || !authData.user) {
      throw new Error(`Failed to create user: ${authError?.message}`)
    }

    // Assign user to tenant in tenant_users table
    const assigned = await assignUserToTenant(authData.user.id, tenantId)
    
    if (!assigned) {
      // Clean up auth user if tenant assignment fails
      await admin.auth.admin.deleteUser(authData.user.id)
      throw new Error('Failed to assign user to tenant')
    }

    return {
      user: {
        id: authData.user.id,
        email, // Return original email for display
        tenantId,
        emailConfirmed: emailConfirm
      },
      needsEmailVerification: !emailConfirm
    }
  } catch (error) {
    console.error('Error creating user for tenant:', error)
    throw error
  }
}

/**
 * Generates a tenant-specific email alias.
 * 
 * This function implements the email aliasing pattern that allows
 * the same email address to be used across multiple tenants while
 * maintaining Supabase's global uniqueness constraint.
 * 
 * @param email - Original email address
 * @param tenantId - Tenant identifier
 * @returns Tenant-specific email alias
 * 
 * @example
 * ```typescript
 * const alias = generateTenantSpecificEmail('user@example.com', 'tenant-123')
 * // Returns: 'user+tenant-123@example.com'
 * ```
 */
export function generateTenantSpecificEmail(email: string, tenantId: TenantId): string {
  const [localPart, domain] = email.split('@')
  
  // Use + aliasing which is standard and preserves email delivery
  // Format: user+tenant-123@example.com
  return `${localPart}+tenant-${tenantId}@${domain}`
}

/**
 * Extracts the original email from a tenant-specific alias.
 * 
 * This function reverses the email aliasing pattern to display
 * the user's actual email address in the application.
 * 
 * @param tenantSpecificEmail - Tenant-specific email alias
 * @returns Original email address
 * 
 * @example
 * ```typescript
 * const original = extractOriginalEmail('user+tenant-123@example.com')
 * // Returns: 'user@example.com'
 * ```
 */
export function extractOriginalEmail(tenantSpecificEmail: string): string {
  const [localPart, domain] = tenantSpecificEmail.split('@')
  
  // Remove +tenant-xxx suffix if present
  const originalLocalPart = localPart.replace(/\+tenant-[^@]+/, '')
  
  return `${originalLocalPart}@${domain}`
}

/**
 * Generates a secure random password.
 * 
 * This function creates a cryptographically secure password when
 * no password is provided during user creation. The user will
 * need to reset their password via email verification.
 * 
 * @returns Secure random password
 */
function generateSecurePassword(): string {
  const length = 32
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  
  let password = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }
  
  return password
}

/**
 * Gets user's tenant assignments.
 * 
 * This function retrieves all tenants that a user is associated with,
 * useful for displaying user's available workspaces.
 * 
 * @param userId - Supabase auth user ID
 * @returns Array of tenant assignments
 * 
 * @example
 * ```typescript
 * const userTenants = await getUserTenants(userId)
 * // Returns: [{ tenantId: 'tenant-1', role: 'admin' }, ...]
 * ```
 */
export async function getUserTenants(userId: UserId): Promise<Array<{
  tenantId: TenantId
  role: string
  tenantName?: string
}>> {
  try {
    const admin = getAdminClient()
    
    const { data, error } = await admin
      .from('tenant_users')
      .select(`
        tenant_id,
        role,
        tenants:tenant_id (
          name
        )
      `)
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error getting user tenants:', error)
      return []
    }

    return (data || []).map(item => ({
      tenantId: item.tenant_id,
      role: item.role,
      tenantName: item.tenants?.name
    }))
  } catch (error) {
    console.error('Error in getUserTenants:', error)
    return []
  }
}
