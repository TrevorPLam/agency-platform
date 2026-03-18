import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@agency/ui'

const featureGridVariants = cva('grid w-full', {
  variants: {
    columns: {
      '1': 'grid-cols-1',
      '2': 'grid-cols-1 md:grid-cols-2',
      '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    },
    gap: {
      default: 'gap-8',
      compact: 'gap-4',
      spacious: 'gap-12',
    },
  },
  defaultVariants: {
    columns: '3',
    gap: 'default',
  },
})

export interface FeatureItemProps {
  icon?: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  className?: string
}

const FeatureItem = React.forwardRef<HTMLDivElement, FeatureItemProps>(
  ({ className, icon, title, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border-border-primary bg-background-primary rounded-lg border p-6 text-center shadow-sm',
          className
        )}
        {...props}
      >
        {icon ? <div className="text-brand-primary mb-4 flex justify-center">{icon}</div> : null}
        <h3 className="text-text-primary mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-text-secondary">{description}</p>
      </div>
    )
  }
)

FeatureItem.displayName = 'FeatureItem'

export interface FeatureGridProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof featureGridVariants> {
  asChild?: boolean
  features?: FeatureItemProps[]
  centered?: boolean
}

const FeatureGrid = React.forwardRef<HTMLDivElement, FeatureGridProps>(
  ({ className, asChild = false, columns, gap, features, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'

    return (
      <Comp ref={ref} className={cn(featureGridVariants({ columns, gap }), className)} {...props}>
        {features?.map((feature, index) => (
          <FeatureItem key={index} {...feature} />
        ))}
        {children}
      </Comp>
    )
  }
)

FeatureGrid.displayName = 'FeatureGrid'

export { FeatureGrid, FeatureItem, featureGridVariants }
