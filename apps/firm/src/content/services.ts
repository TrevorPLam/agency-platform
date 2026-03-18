import { type ServicePage } from './types'

/**
 * Firm app services content - typed and validated
 *
 * This replaces inline hardcoded services data with type-safe content
 * that can be validated at build time and used across multiple components.
 */
export const services: ServicePage[] = [
  {
    id: 'service-1',
    type: 'service',
    slug: 'digital-strategy',
    title: 'Digital Strategy',
    description: 'Evidence-based strategic planning that aligns your marketing with business goals and customer needs.',
    publishedAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    author: 'Agency Team',
    features: [
      {
        title: 'Audience Research',
        description: 'Deep dive into your target audience demographics, behaviors, and preferences to inform all marketing decisions.',
      },
      {
        title: 'Competitive Analysis',
        description: 'Comprehensive analysis of your competitive landscape to identify opportunities and positioning strategies.',
      },
      {
        title: 'Campaign Planning',
        description: 'Strategic campaign development with clear objectives, KPIs, and execution timelines.',
      },
    ],
    pricing: {
      model: 'Project-based',
      startingAt: '$5,000',
      notes: 'Custom pricing based on scope and complexity',
    },
    process: [
      {
        step: 1,
        title: 'Discovery',
        description: 'Understanding your business, goals, and competitive landscape.',
      },
      {
        step: 2,
        title: 'Research',
        description: 'Conducting audience research and competitive analysis.',
      },
      {
        step: 3,
        title: 'Strategy',
        description: 'Developing comprehensive marketing strategy and campaign plans.',
      },
      {
        step: 4,
        title: 'Execution',
        description: 'Implementing campaigns with ongoing optimization.',
      },
    ],
    seo: {
      title: 'Digital Strategy Services | Agency',
      description: 'Evidence-based digital strategy services that align marketing with business goals.',
      keywords: ['digital strategy', 'marketing strategy', 'campaign planning'],
    },
  },
  {
    id: 'service-2',
    type: 'service',
    slug: 'web-design',
    title: 'Web Design & Development',
    description: 'Custom web design and development that creates exceptional user experiences and drives business results.',
    publishedAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    author: 'Agency Team',
    features: [
      {
        title: 'Custom Design',
        description: 'Unique, brand-aligned web design that stands out from competitors and resonates with your audience.',
      },
      {
        title: 'Responsive Development',
        description: 'Mobile-first development ensuring perfect functionality across all devices and screen sizes.',
      },
      {
        title: 'Performance Optimization',
        description: 'Lightning-fast load times and smooth interactions for optimal user experience and SEO.',
      },
    ],
    pricing: {
      model: 'Project-based',
      startingAt: '$10,000',
      notes: 'Varies based on complexity and features',
    },
    process: [
      {
        step: 1,
        title: 'Planning',
        description: 'Defining requirements, user journeys, and technical specifications.',
      },
      {
        step: 2,
        title: 'Design',
        description: 'Creating wireframes, mockups, and interactive prototypes.',
      },
      {
        step: 3,
        title: 'Development',
        description: 'Building the website with modern technologies and best practices.',
      },
      {
        step: 4,
        title: 'Launch',
        description: 'Deployment, testing, and post-launch optimization.',
      },
    ],
    seo: {
      title: 'Web Design & Development Services | Agency',
      description: 'Custom web design and development services that create exceptional user experiences.',
      keywords: ['web design', 'web development', 'UX design', 'responsive design'],
    },
  },
  {
    id: 'service-3',
    type: 'service',
    slug: 'growth-marketing',
    title: 'Growth Marketing',
    description: 'Data-driven marketing campaigns that acquire customers, optimize conversions, and scale your business.',
    publishedAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    author: 'Agency Team',
    features: [
      {
        title: 'SEO Optimization',
        description: 'Comprehensive SEO strategy to improve search rankings and drive organic traffic.',
      },
      {
        title: 'Paid Advertising',
        description: 'Strategic paid media campaigns across Google, Facebook, and other platforms.',
      },
      {
        title: 'Analytics & Reporting',
        description: 'Detailed performance tracking and actionable insights to optimize marketing ROI.',
      },
    ],
    pricing: {
      model: 'Monthly retainer',
      startingAt: '$3,000/month',
      notes: 'Custom packages available based on needs',
    },
    process: [
      {
        step: 1,
        title: 'Audit',
        description: 'Analyzing current marketing performance and identifying opportunities.',
      },
      {
        step: 2,
        title: 'Strategy',
        description: 'Developing comprehensive growth marketing strategy and channel mix.',
      },
      {
        step: 3,
        title: 'Implementation',
        description: 'Launching campaigns and optimizing based on performance data.',
      },
      {
        step: 4,
        title: 'Scale',
        description: 'Scaling successful campaigns and expanding to new channels.',
      },
    ],
    seo: {
      title: 'Growth Marketing Services | Agency',
      description: 'Data-driven growth marketing services that acquire customers and scale your business.',
      keywords: ['growth marketing', 'SEO', 'paid advertising', 'analytics'],
    },
  },
] // Runtime validation will be added later once Zod issues are resolved

/**
 * Get all services
 */
export function getAllServices(): ServicePage[] {
  return services
}

/**
 * Get a single service by slug
 */
export function getServiceBySlug(slug: string): ServicePage | null {
  return services.reduce((found, service) => found || (service.slug === slug ? service : null), null as ServicePage | null)
}

/**
 * Get featured services
 */
export function getFeaturedServices(): ServicePage[] {
  return services // All services are featured by default
}
