import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@agency/ui'

const posts: Record<string, { title: string; date: string; content: string }> = {
  welcome: {
    title: 'Welcome to TEMPLATE_NAME',
    date: '2026-01-01',
    content:
      'We are excited to share news, tips, and updates with our community. Stay tuned for articles, announcements, and helpful resources.',
  },
  'our-approach': {
    title: 'Our Approach to Quality Service',
    date: '2026-01-15',
    content:
      'At TEMPLATE_NAME we put clients first. Every engagement starts with listening, followed by clear planning and consistent follow-through. Quality is not a one-time event—it is a process.',
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
    <main className="bg-background-primary text-text-primary min-h-screen">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Link href="/blog">
          <Button variant="outline" className="mb-8">
            ← Back to Blog
          </Button>
        </Link>
        <article>
          <h1 className="text-brand-primary mb-2 text-4xl font-bold">{post.title}</h1>
          <p className="text-text-secondary mb-8">{post.date}</p>
          <div className="prose prose-slate text-text-primary max-w-none">
            <p className="text-text-secondary">{post.content}</p>
          </div>
        </article>
      </div>
    </main>
  )
}
