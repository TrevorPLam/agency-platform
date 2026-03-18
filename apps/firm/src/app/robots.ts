import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const vercelUrl = process.env['VERCEL_URL']
  const baseUrl = vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
