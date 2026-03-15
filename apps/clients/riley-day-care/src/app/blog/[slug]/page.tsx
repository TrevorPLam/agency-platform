import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@agency/ui'

const posts: Record<string, { title: string; date: string; content: string }> = {
  welcome: {
    title: 'Welcome to Riley Day Care',
    date: '2025-03-01',
    content: 'We are excited to share updates and tips for families. Stay tuned for news about programs, events, and early learning resources.',
  },
  'early-learning': {
    title: 'The Importance of Early Learning',
    date: '2025-02-15',
    content: 'The first five years of life are critical for brain development. At Riley Day Care we use play-based learning to support literacy, math readiness, and social-emotional skills in a nurturing environment.',
  },
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = posts[slug]
  if (!post) return { title: 'Post Not Found' }
  return { title: post.title, description: post.content.slice(0, 160) }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = posts[slug]
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-background-primary text-text-primary">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Link href="/blog">
          <Button variant="outline" className="mb-8">← Back to Blog</Button>
        </Link>
        <article>
          <h1 className="text-4xl font-bold text-brand-primary mb-2">{post.title}</h1>
          <p className="text-text-secondary mb-8">{post.date}</p>
          <div className="prose prose-slate max-w-none text-text-primary">
            <p className="text-text-secondary">{post.content}</p>
          </div>
        </article>
      </div>
    </main>
  )
}
