/**
 * Organisms — compositions of molecules (and atoms) forming distinct UI sections.
 * Add interaction states (loading/empty/error) and clear data contracts here.
 * App-specific organisms (e.g. SiteHeader, ContactForm) live in apps; shared ones go here when repeated across multiple apps.
 */

export { PageSection } from './page-section'
export { HeroSection } from './hero-section'
export { FeatureGrid, FeatureItem } from './feature-grid'
export { CTASection } from './cta-section'

export type { PageSectionProps } from './page-section'
export type { HeroSectionProps } from './hero-section'
export type { FeatureGridProps, FeatureItemProps } from './feature-grid'
export type { CTASectionProps } from './cta-section'
