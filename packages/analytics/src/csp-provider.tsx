import { headers } from 'next/headers'
import Script from 'next/script'

interface CspNonceProviderProps {
  children: React.ReactNode
}

/**
 * Get the CSP nonce from request headers
 * This should be called in Server Components to access the nonce set by middleware
 */
async function getCspNonce(): Promise<string | undefined> {
  const headersList = await headers()
  return headersList.get('x-nonce') || undefined
}

/**
 * CSP Nonce Provider Component
 * Server component that injects the CSP nonce into the page for client-side access
 */
export async function CspNonceProvider({ children }: CspNonceProviderProps) {
  const nonce = await getCspNonce()

  if (!nonce) {
    // If no nonce is available, render children without nonce injection
    return <>{children}</>
  }

  return (
    <>
      {/* Inject nonce into a meta tag for client-side access */}
      <meta name="csp-nonce" content={nonce} />

      {/* Inject nonce into a global variable as fallback */}
      <Script id="csp-nonce-injection">
        {`
          if (typeof window !== 'undefined') {
            window.__CSP_NONCE__ = '${nonce}';
          }
        `}
      </Script>

      {/* Render children */}
      {children}
    </>
  )
}
