import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { notFound } from 'next/navigation'
import { Button } from '@agency/ui'
import { BlogPosting, WithContext } from 'schema-dts'
import { getPostBySlug, getAllPosts } from '../../../content/blog'

// Generate static params for blog posts
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.description,
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  return renderBlogPostPage(slug)
}

async function renderBlogPostPage(slug: string) {
  'use cache'

  cacheLife('days')
  cacheTag('page:blog', `page:blog:${slug}`, 'blog', `blog:${slug}`, 'site:firm')

  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const vercelUrl = process.env['VERCEL_URL']
  const baseUrl = vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000'

  // JSON-LD structured data for BlogPosting
  const blogPosting: WithContext<BlogPosting> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo?.description || post.description,
    image: `${baseUrl}/api/og/blog/${slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Agency',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Agency',
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${slug}`,
    },
    ...(post.tags && { keywords: post.tags.join(', ') }),
  }

  return (
    <>
      <head>
        {/* JSON-LD structured data for BlogPosting */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(blogPosting).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <Link href="/blog">
            <Button variant="outline" className="mb-8">
              ← Back to Blog
            </Button>
          </Link>
          <article>
            <header className="mb-8">
              <h1 className="mb-2 text-4xl font-bold text-slate-900">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {post.author && <span>• By {post.author}</span>}
                {post.readingTime && <span>• {post.readingTime} min read</span>}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>
            <div className="prose prose-slate max-w-none">
              {/* Render markdown content - for now just render as text with basic formatting */}
              <div className="leading-relaxed whitespace-pre-wrap text-slate-700">
                {post.content}
              </div>
            </div>
          </article>
        </div>
      </main>
    </>
  )
}
