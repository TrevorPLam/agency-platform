import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/utils'

export function Heading({ className, ...props }: ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2 className={cn('text-3xl font-bold tracking-tight md:text-4xl', className)} {...props} />
  )
}
