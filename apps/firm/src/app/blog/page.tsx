import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@agency/ui'
import { getAllPosts } from '@/content/blog'

export const metadata = {
  title: 'Blog',
  description: 'Insights and updates from our agency on marketing, design, and growth.',
}

// Generate static params for individual blog posts
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">Blog</h1>
          <p className="text-xl text-slate-600">Insights on marketing, design, and growth.</p>
        </header>
        <section className="mx-auto max-w-3xl space-y-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="transition-colors hover:border-slate-400">
                <CardHeader>
                  <CardTitle className="text-slate-900">{post.title}</CardTitle>
                  <p className="text-sm text-slate-600">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {post.readingTime && ` • ${post.readingTime} min read`}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{post.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
