import { type BlogPost } from './types'

/**
 * Riley Day Care blog content - typed and validated
 */
export const posts: BlogPost[] = [
  {
    id: 'blog-1',
    type: 'blog',
    slug: 'choosing-the-right-daycare',
    title: 'Choosing the Right Daycare for Your Child',
    description: 'A comprehensive guide for parents selecting the perfect childcare facility.',
    publishedAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
    author: 'Riley Day Care Team',
    content: `# Choosing the Right Daycare for Your Child

Finding the perfect daycare is one of the most important decisions you'll make as a parent. We understand the trust you place in us and want to help you make an informed choice.

## What to Look For

### Safety and Cleanliness
- Proper licensing and certifications
- Clean, child-safe environment
- Secure entry and exit procedures
- Regular health and safety inspections

### Staff Qualifications
- Trained early childhood educators
- Low child-to-staff ratios
- Ongoing professional development
- First aid and CPR certified

### Learning Environment
- Age-appropriate learning activities
- Structured daily routines
- Opportunities for creative play
- Outdoor play space

## Questions to Ask

1. What is your daily schedule like?
2. How do you handle discipline?
3. What are your communication methods with parents?
4. What is your sick child policy?

## Getting Started

Schedule a tour to see our facility and meet our staff. We look forward to showing you why Riley Day Care is the right choice for your family.`,
    readingTime: 3,
    tags: ['parenting', 'childcare', 'daycare-selection'],
    featured: true,
    seo: {
      title: 'Choosing the Right Daycare | Riley Day Care',
      description: 'A comprehensive guide for parents selecting the perfect childcare facility.',
      keywords: ['daycare', 'childcare', 'parenting', 'early-education'],
    },
  },
  {
    id: 'blog-2',
    type: 'blog',
    slug: 'developmental-benefits-of-daycare',
    title: 'Developmental Benefits of Quality Daycare',
    description: 'How professional childcare supports your child\'s growth and development.',
    publishedAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-15T00:00:00.000Z',
    author: 'Riley Day Care Team',
    content: `# Developmental Benefits of Quality Daycare

Quality daycare does more than just provide supervision - it creates a foundation for lifelong learning and social development.

## Social Development

### Building Friendships
- Learning to share and take turns
- Developing empathy and compassion
- Practicing conflict resolution
- Building confidence in social situations

### Communication Skills
- Expressing needs and feelings
- Listening to others
- Following instructions
- Group participation

## Cognitive Growth

### Early Learning
- Letter and number recognition
- Problem-solving skills
- Critical thinking
- Language development

### School Readiness
- Following routines
- Independent self-care
- Basic academic concepts
- Love of learning

## Emotional Development

### Building Independence
- Making choices
- Self-help skills
- Confidence building
- Emotional regulation

### Resilience
- Adapting to new situations
- Overcoming challenges
- Persistence
- Coping strategies

## The Riley Day Care Difference

Our curriculum is designed to support all areas of development through play-based learning, structured activities, and individual attention.`,
    readingTime: 4,
    tags: ['child-development', 'early-education', 'social-skills'],
    featured: false,
    seo: {
      title: 'Developmental Benefits of Daycare | Riley Day Care',
      description: 'How professional childcare supports your child\'s growth and development.',
      keywords: ['child-development', 'early-education', 'social-skills', 'cognitive-growth'],
    },
  },
]

/**
 * Get all blog posts
 */
export function getAllPosts(): BlogPost[] {
  return posts
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  return posts.reduce((found, post) => found || (post.slug === slug ? post : null), null as BlogPost | null)
}

/**
 * Get featured blog posts
 */
export function getFeaturedPosts(): BlogPost[] {
  return posts.filter((post) => post.featured)
}

/**
 * Get blog posts by tag
 */
export function getPostsByTag(tag: string): BlogPost[] {
  return posts.filter((post) => post.tags && post.tags.indexOf(tag) !== -1)
}

/**
 * Get all unique tags from blog posts
 */
export function getAllTags(): string[] {
  const allTags = posts.reduce((tags, post) => {
    if (post.tags) {
      tags.push(...post.tags)
    }
    return tags
  }, [] as string[])
  
  // Remove duplicates manually and convert back to array
  const uniqueTags = allTags.reduce((unique, tag) => {
    if (unique.indexOf(tag) === -1) {
      unique.push(tag)
    }
    return unique
  }, [] as string[])
  
  return uniqueTags.sort()
}
