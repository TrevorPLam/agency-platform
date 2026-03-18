import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'

const pageSectionVariants = cva(
  'w-full',
  {
    variants: {
      background: {
        default: 'bg-background-primary',
        muted: 'bg-background-secondary',
        brand: 'bg-background-accent',
      },
      padding: {
        default: 'py-16 md:py-24',
        compact: 'py-8 md:py-12',
        spacious: 'py-24 md:py-32',
      },
    },
    defaultVariants: {
      background: 'default',
      padding: 'default',
    },
  }
)

export interface PageSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof pageSectionVariants> {
  asChild?: boolean
  heading?: React.ReactNode
  subheading?: React.ReactNode
  action?: React.ReactNode
  centered?: boolean
}

const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(
  ({ className, asChild = false, background, padding, heading, subheading, action, centered = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'section'

    return (
      <Comp
        ref={ref}
        className={cn(pageSectionVariants({ background, padding }), className)}
        {...props}
      >
        <div className={cn('container mx-auto px-4', centered && 'text-center')}>
          {(heading || subheading || action) && (
            <div className="mb-12">
              {heading && (
                <h2 className="mb-4 text-3xl font-bold text-text-primary md:text-4xl">
                  {heading}
                </h2>
              )}
              {subheading && (
                <p className="mb-8 text-lg text-text-secondary md:text-xl">
                  {subheading}
                </p>
              )}
              {action && (
                <div className={cn('flex gap-4', centered ? 'justify-center' : '')}>
                  {action}
                </div>
              )}
            </div>
          )}
          {children}
        </div>
      </Comp>
    )
  }
)
PageSection.displayName = 'PageSection'

export { PageSection, pageSectionVariants }
