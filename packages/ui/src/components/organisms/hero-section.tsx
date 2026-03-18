import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'

const heroSectionVariants = cva(
  'w-full',
  {
    variants: {
      size: {
        default: 'py-24 md:py-32',
        compact: 'py-16 md:py-24',
        spacious: 'py-32 md:py-48',
      },
      alignment: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
      background: {
        default: 'bg-background-primary',
        muted: 'bg-background-secondary',
        brand: 'bg-background-accent',
        gradient: 'bg-gradient-to-br from-background-primary to-background-secondary',
      },
    },
    defaultVariants: {
      size: 'default',
      alignment: 'center',
      background: 'default',
    },
  }
)

export interface HeroSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof heroSectionVariants> {
  asChild?: boolean
  headline?: React.ReactNode
  subheadline?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
  centered?: boolean
}

const HeroSection = React.forwardRef<HTMLElement, HeroSectionProps>(
  ({
    className,
    asChild = false,
    size,
    alignment,
    background,
    headline,
    subheadline,
    primaryAction,
    secondaryAction,
    centered,
    children,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : 'section'
    const finalAlignment = centered ? 'center' : alignment

    return (
      <Comp
        ref={ref}
        className={cn(heroSectionVariants({ size, alignment: finalAlignment, background }), className)}
        {...props}
      >
        <div className="container mx-auto px-4">
          <div className={cn(
            'max-w-4xl',
            finalAlignment === 'center' && 'mx-auto text-center',
            finalAlignment === 'left' && 'text-left',
            finalAlignment === 'right' && 'text-right'
          )}>
            {headline && (
              <h1 className="mb-6 text-4xl font-bold text-text-primary md:text-5xl lg:text-6xl">
                {headline}
              </h1>
            )}

            {subheadline && (
              <p className="mb-8 text-xl text-text-secondary md:text-2xl lg:text-3xl">
                {subheadline}
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

            {children && (
              <div className="mt-12">
                {children}
              </div>
            )}
          </div>
        </div>
      </Comp>
    )
  }
)
HeroSection.displayName = 'HeroSection'

export { HeroSection, heroSectionVariants }
