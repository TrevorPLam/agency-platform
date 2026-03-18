import type { SiteConfig } from '@agency/marketing/types'

export const siteConfig = {
  slug: 'firm',
  name: 'Agency',
  nav: [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/book', label: 'Book' },
    { href: '/contact', label: 'Contact' },
  ],
  footer: {
    links: [
      { href: '/services', label: 'Services' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  shell: {
    header:
      'sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95',
    headerContainer: 'container mx-auto flex h-14 items-center justify-between px-4',
    brandLink: 'text-lg font-semibold text-slate-900 dark:text-white',
    desktopNav: 'hidden items-center gap-6 md:flex',
    navLink:
      'text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
    navLinkActive: 'text-slate-900 dark:text-white',
    mobileNav: 'flex flex-col gap-4',
    mobileNavLink:
      'text-lg font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
    mobileNavLinkActive: 'text-slate-900 dark:text-white',
    footer: 'mt-auto border-t border-slate-200 bg-slate-50',
    footerContainer: 'container mx-auto px-4 py-8',
    footerText: 'text-sm text-slate-600',
    footerNavLink: 'text-sm text-slate-600 hover:text-slate-900',
    main: 'flex-1',
  },
} satisfies SiteConfig
