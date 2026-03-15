import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@agency/ui', '@agency/database', '@agency/analytics'],
}

export default nextConfig
