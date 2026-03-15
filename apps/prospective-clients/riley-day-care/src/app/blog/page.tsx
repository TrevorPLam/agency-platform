import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'
import { cn } from '@agency/ui'

export const metadata = {
  title: 'Blog',
  description: 'News and updates from Riley Day Care.',
}

const posts = [
  { slug: 'welcome', title: 'Welcome to Riley Day Care', date: '2025-03-01', excerpt: 'We are excited to share updates and tips for families.' },
  { slug: 'early-learning', title: 'The Importance of Early Learning', date: '2025-02-15', excerpt: 'How play-based learning supports development in the first five years.' },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background-primary text-text-primary">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-primary mb-4">Blog</h1>
          <p className="text-lg text-text-secondary">News, tips, and updates for families.</p>
        </header>
        <section className="space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="hover:border-brand-primary transition-colors">
                <CardHeader>
                  <CardTitle className={cn('text-brand-primary')}>{post.title}</CardTitle>
                  <p className="text-sm text-text-secondary">{post.date}</p>
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
