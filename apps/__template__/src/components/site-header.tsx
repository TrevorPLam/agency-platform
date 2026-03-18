import { SiteHeader as MarketingSiteHeader } from '@agency/marketing/shell'
import { siteConfig } from '@/config/site'

export function SiteHeader() {
  return <MarketingSiteHeader config={siteConfig} />
}
