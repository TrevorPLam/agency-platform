export interface SiteNavItem {
  href: string
  label: string
}

export interface SiteFooterLink {
  href: string
  label: string
}

export interface SiteFooterConfig {
  legalName?: string
  secondaryText?: string
  links: SiteFooterLink[]
}

export interface SiteShellClasses {
  header: string
  headerContainer: string
  brandLink: string
  desktopNav: string
  navLink: string
  navLinkActive: string
  mobileNav: string
  mobileNavLink: string
  mobileNavLinkActive: string
  footer: string
  footerContainer: string
  footerText: string
  footerNavLink: string
  main?: string
  skipLink?: string
}

export interface SiteConfig {
  slug: string
  name: string
  nav: SiteNavItem[]
  footer: SiteFooterConfig
  shell: SiteShellClasses
}
