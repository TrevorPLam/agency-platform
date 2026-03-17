import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'
import { cn } from '@agency/ui'

export const metadata = {
  title: 'Blog',
  description: 'News and updates from TEMPLATE_NAME.',
}

const posts = [
  {
    slug: 'welcome',
    title: 'Welcome to TEMPLATE_NAME',
    date: '2026-01-01',
    excerpt: 'We are excited to share news, tips, and updates with our community.',
  },
  {
    slug: 'our-approach',
    title: 'Our Approach to Quality Service',
    date: '2026-01-15',
    excerpt: 'How we deliver consistent, high-quality results for every client.',
  },
]

export default function BlogPage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">Blog</h1>
          <p className="text-text-secondary text-lg">News, tips, and updates.</p>
        </header>
        <section className="space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="hover:border-brand-primary transition-colors">
                <CardHeader>
                  <CardTitle className={cn('text-brand-primary')}>{post.title}</CardTitle>
                  <p className="text-text-secondary text-sm">{post.date}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary">{post.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
