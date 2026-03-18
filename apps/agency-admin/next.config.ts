import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@agency/ui',
    '@agency/database',
    '@agency/analytics',
    '@agency/cost',
    '@agency/error-handling',
    '@agency/metrics',
    '@agency/monitoring',
    '@agency/security',
    '@agency/storage',
  ],
}

export default nextConfig
