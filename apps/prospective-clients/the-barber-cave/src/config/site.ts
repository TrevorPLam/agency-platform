import type { SiteConfig } from '@agency/marketing/types'

export const siteConfig = {
  slug: 'the-barber-cave',
  name: 'The Barber Cave',
  nav: [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
  footer: {
    links: [
      { href: '/services', label: 'Services' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
    secondaryText: '2629 N Stemmons Fwy STE 104, Dallas, TX 75207',
  },
  shell: {
    header:
      'border-border-primary bg-background-primary/95 sticky top-0 z-50 w-full border-b backdrop-blur',
    headerContainer: 'container mx-auto flex h-14 max-w-4xl items-center justify-between px-4',
    brandLink: 'text-brand-primary text-lg font-semibold',
    desktopNav: 'hidden items-center gap-6 md:flex',
    navLink: 'text-text-primary hover:text-brand-primary text-sm font-medium transition-colors',
    navLinkActive: 'text-brand-primary',
    mobileNav: 'flex flex-col gap-4',
    mobileNavLink:
      'text-lg font-medium text-text-primary transition-colors hover:text-brand-primary',
    mobileNavLinkActive: 'text-brand-primary',
    footer: 'border-border-primary bg-background-secondary mt-auto border-t',
    footerContainer: 'container mx-auto max-w-4xl px-4 py-8',
    footerText: 'text-text-secondary text-sm',
    footerNavLink: 'text-text-secondary hover:text-brand-primary text-sm',
    main: 'flex-1',
  },
} satisfies SiteConfig
