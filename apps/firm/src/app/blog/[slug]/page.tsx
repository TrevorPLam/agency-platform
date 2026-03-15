import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@agency/ui'

const posts: Record<string, { title: string; date: string; content: string }> = {
  'getting-started': {
    title: 'Getting Started with Digital Marketing',
    date: '2025-03-01',
    content: 'Taking your first steps in digital marketing can feel overwhelming. Start with a clear goal, know your audience, and focus on one or two channels before expanding. We help businesses build strategy and execution that scales.',
  },
  'design-tips': {
    title: 'Design Tips That Convert',
    date: '2025-02-15',
    content: 'Good design builds trust and guides users toward action. Use clear hierarchy, consistent branding, and simple calls-to-action. Test and iterate based on data to improve conversion over time.',
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Link href="/blog">
          <Button variant="outline" className="mb-8">← Back to Blog</Button>
        </Link>
        <article>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{post.title}</h1>
          <p className="text-slate-600 mb-8">{post.date}</p>
          <p className="text-slate-600">{post.content}</p>
        </article>
      </div>
    </main>
  )
}
