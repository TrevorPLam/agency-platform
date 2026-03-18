import type { NextRequest } from 'next/server'
import { validateTenantAccess as validateTenantAccessBase } from './auth'

export async function validateTenantAccess(request?: NextRequest, requestedTenantId?: string) {
  try {
    const auth = await validateTenantAccessBase(request, requestedTenantId)
    return {
      tenantId: auth.tenantId,
      userId: auth.userId,
      user: auth.user,
      isPlatformAdmin: auth.isPlatformAdmin,
      isAuthenticated: true,
    }
  } catch {
    return null
  }
}