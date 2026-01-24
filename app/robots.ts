import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : 'https://godseyes.world')

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth'],
        disallow: ['/api/', '/products/', '/optimize/', '/results/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
