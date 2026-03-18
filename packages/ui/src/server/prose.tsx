import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/utils'

export function Prose({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('prose prose-slate max-w-none', className)} {...props} />
}
