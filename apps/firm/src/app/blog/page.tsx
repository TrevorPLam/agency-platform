import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'

export const metadata = {
  title: 'Blog',
  description: 'Insights and updates from our agency on marketing, design, and growth.',
}

const posts = [
  {
    slug: 'getting-started',
    title: 'Getting Started with Digital Marketing',
    date: '2025-03-01',
    excerpt: 'A practical guide for small businesses taking their first steps online.',
  },
  {
    slug: 'design-tips',
    title: 'Design Tips That Convert',
    date: '2025-02-15',
    excerpt: 'How to use design to build trust and drive action.',
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">Blog</h1>
          <p className="text-xl text-slate-600">Insights on marketing, design, and growth.</p>
        </header>
        <section className="mx-auto max-w-3xl space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="transition-colors hover:border-slate-400">
                <CardHeader>
                  <CardTitle className="text-slate-900">{post.title}</CardTitle>
                  <p className="text-sm text-slate-600">{post.date}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{post.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
