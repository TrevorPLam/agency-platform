import { SiteFooter as MarketingSiteFooter } from '@agency/marketing/shell'
import { siteConfig } from '../config/site'

export function SiteFooter() {
  return <MarketingSiteFooter config={siteConfig} />
}
