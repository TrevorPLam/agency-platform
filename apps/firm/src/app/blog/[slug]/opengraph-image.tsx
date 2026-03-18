import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'

// Blog post data - this should match the posts in page.tsx
const posts: Record<string, { title: string; date: string; content: string }> = {
  'getting-started': {
    title: 'Getting Started with Digital Marketing',
    date: '2025-03-01',
    content:
      'Taking your first steps in digital marketing can feel overwhelming. Start with a clear goal, know your audience, and focus on one or two channels before expanding. We help businesses build strategy and execution that scales.',
  },
  'design-tips': {
    title: 'Design Tips That Convert',
    date: '2025-02-15',
    content:
      'Good design builds trust and guides users toward action. Use clear hierarchy, consistent branding, and simple calls-to-action. Test and iterate based on data to improve conversion over time.',
  },
}

export const runtime = 'edge'
export const alt = 'Blog Post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts[slug]
  
  if (!post) {
    notFound()
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #1e40af 0%, #047857 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '40px',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
            lineHeight: 1.2,
          }}
        >
          {post.title}
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'normal',
            opacity: 0.9,
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Agency Blog
        </div>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 'normal',
            opacity: 0.8,
            marginTop: '40px',
            borderTop: '2px solid rgba(255,255,255,0.3)',
            paddingTop: '20px',
          }}
        >
          {post.date}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
