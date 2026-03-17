import { headers } from 'next/headers'

/**
 * Get the CSP nonce from request headers
 * This should be called in Server Components to access the nonce set by middleware
 */
export async function getCspNonce(): Promise<string | undefined> {
  const headersList = await headers()
  return headersList.get('x-nonce') || undefined
}

/**
 * Check if CSP is enabled and nonce is available
 */
export async function isCspEnabled(): Promise<boolean> {
  const nonce = await getCspNonce()
  return !!nonce
}
