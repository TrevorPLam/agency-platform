import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: [
    '@agency/ui',
    '@agency/database',
    '@agency/analytics',
    '@agency/marketing',
    '@agency/monitoring',
  ],
}

export default nextConfig
