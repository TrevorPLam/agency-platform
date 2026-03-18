import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'
import { cn } from '@agency/ui'
import { REVALIDATE_CONTENT } from '@/lib/cache-config'

export const metadata = {
  title: 'Blog',
  description: 'News and updates from Riley Day Care.',
}

export const revalidate = REVALIDATE_CONTENT

const posts = [
  {
    slug: 'welcome',
    title: 'Welcome to Riley Day Care',
    date: '2025-03-01',
    excerpt: 'We are excited to share updates and tips for families.',
  },
  {
    slug: 'early-learning',
    title: 'The Importance of Early Learning',
    date: '2025-02-15',
    excerpt: 'How play-based learning supports development in the first five years.',
  },
]

export default function BlogPage() {
  return (
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-brand-primary mb-4 text-4xl font-bold">Blog</h1>
          <p className="text-text-secondary text-lg">News, tips, and updates for families.</p>
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
