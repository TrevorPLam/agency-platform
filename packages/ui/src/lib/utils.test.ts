import { describe, it, expect, beforeEach } from 'vitest'
import { cn } from './utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle empty strings', () => {
      const result = cn('class1', '', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const result = cn(
        'base-class',
        true && 'conditional-class',
        false && 'hidden-class',
        'always-class'
      )
      expect(result).toBe('base-class conditional-class always-class')
    })

    it('should merge classes and resolve tailwind conflicts', () => {
      expect(cn('px-2', 'px-4', 'font-bold')).toBe('px-4 font-bold')
    })

    it('should handle complex Tailwind utilities', () => {
      const result = cn(
        'flex',
        'items-center',
        'justify-between',
        'p-4',
        'bg-white',
        'rounded-lg',
        'shadow-md'
      )
      expect(result).toBe('flex items-center justify-between p-4 bg-white rounded-lg shadow-md')
    })

    it('should handle variant classes', () => {
      const variants = {
        variant: {
          default: 'bg-primary text-primary-foreground',
          destructive: 'bg-destructive text-destructive-foreground',
          outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        },
        size: {
          default: 'h-10 px-4 py-2',
          sm: 'h-9 rounded-md px-3',
          lg: 'h-11 rounded-md px-8',
          icon: 'h-10 w-10',
        },
      }

      const result = cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants.variant.default,
        variants.size.default
      )

      expect(result).toContain('inline-flex items-center justify-center')
      expect(result).toContain('bg-primary text-primary-foreground')
      expect(result).toContain('h-10 px-4 py-2')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3', ['class4', 'class5'])
      expect(result).toBe('class1 class2 class3 class4 class5')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
        'class4': false,
      })
      expect(result).toBe('class1 class3')
    })

    it('should handle mixed input types', () => {
      const result = cn(
        'base-class',
        { 'conditional-1': true, 'conditional-2': false },
        ['array-1', 'array-2'],
        undefined,
        null,
        ''
      )
      expect(result).toBe('base-class conditional-1 array-1 array-2')
    })

    it('should handle responsive variants', () => {
      const result = cn(
        'text-sm',
        'md:text-base',
        'lg:text-lg',
        'xl:text-xl'
      )
      expect(result).toBe('text-sm md:text-base lg:text-lg xl:text-xl')
    })

    it('should handle state variants', () => {
      const result = cn(
        'border',
        'border-gray-300',
        'focus:border-blue-500',
        'focus:ring-2',
        'focus:ring-blue-200',
        'disabled:bg-gray-100',
        'disabled:cursor-not-allowed'
      )
      expect(result).toBe('border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed')
    })

    it('should handle animation classes', () => {
      const result = cn(
        'transition-all',
        'duration-200',
        'ease-in-out',
        'transform',
        'hover:scale-105',
        'active:scale-95'
      )
      expect(result).toBe('transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95')
    })
  })
})
