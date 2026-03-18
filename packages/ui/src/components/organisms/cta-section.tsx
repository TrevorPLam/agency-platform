import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'

const ctaSectionVariants = cva(
  'w-full',
  {
    variants: {
      background: {
        default: 'bg-background-primary',
        muted: 'bg-background-secondary',
        brand: 'bg-background-accent',
        gradient: 'bg-gradient-to-r from-background-primary to-background-secondary',
      },
      size: {
        default: 'py-16 md:py-24',
        compact: 'py-12 md:py-16',
        spacious: 'py-20 md:py-32',
      },
      alignment: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      background: 'brand',
      size: 'default',
      alignment: 'center',
    },
  }
)

export interface CTASectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof ctaSectionVariants> {
  asChild?: boolean
  headline: React.ReactNode
  body?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
  centered?: boolean
}

const CTASection = React.forwardRef<HTMLElement, CTASectionProps>(
  ({
    className,
    asChild = false,
    background,
    size,
    alignment,
    headline,
    body,
    primaryAction,
    secondaryAction,
    centered,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : 'section'
    const finalAlignment = centered ? 'center' : alignment

    return (
      <Comp
        ref={ref}
        className={cn(ctaSectionVariants({ background, size, alignment: finalAlignment }), className)}
        {...props}
      >
        <div className="container mx-auto px-4">
          <div className={cn(
            'max-w-4xl',
            finalAlignment === 'center' && 'mx-auto text-center',
            finalAlignment === 'left' && 'text-left',
            finalAlignment === 'right' && 'text-right'
          )}>
            <h2 className="mb-4 text-3xl font-bold text-text-primary md:text-4xl">
              {headline}
            </h2>

            {body && (
              <p className="mb-8 text-lg text-text-secondary md:text-xl">
                {body}
              </p>
            )}

            {(primaryAction || secondaryAction) && (
              <div className={cn(
                'flex flex-wrap gap-4',
                finalAlignment === 'center' && 'justify-center',
                finalAlignment === 'left' && 'justify-start',
                finalAlignment === 'right' && 'justify-end'
              )}>
                {primaryAction}
                {secondaryAction}
              </div>
            )}
          </div>
        </div>
      </Comp>
    )
  }
)
CTASection.displayName = 'CTASection'

export { CTASection, ctaSectionVariants }
