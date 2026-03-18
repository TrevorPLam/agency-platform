import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/utils'

export function Section({ className, ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section className={cn('py-16 md:py-24', className)} {...props} />
}
