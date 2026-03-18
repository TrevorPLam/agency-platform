import type { NextRequest } from 'next/server'
import { validateTenantAccess as validateTenantAccessBase } from '../auth'

export async function validateTenantAccess(request?: NextRequest, requestedTenantId?: string) {
  try {
    const auth = await validateTenantAccessBase(request, requestedTenantId)
    return {
      ...auth,
      isAuthenticated: true,
    }
  } catch {
    return {
      isAuthenticated: false,
      user: null,
      userId: null,
      tenantId: null,
      isPlatformAdmin: false,
    }
  }
}