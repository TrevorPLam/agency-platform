'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'

type SelectOption = {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

type SelectContextValue = {
  value: string
  setValue: (value: string) => void
  options: SelectOption[]
  setOptions: (options: SelectOption[]) => void
  placeholder?: React.ReactNode
  setPlaceholder: (placeholder?: React.ReactNode) => void
  disabled?: boolean
  name?: string
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext(componentName: string): SelectContextValue {
  const context = React.useContext(SelectContext)

  if (!context) {
    throw new Error(`${componentName} must be used within Select`)
  }

  return context
}

function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
}: {
  children: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  name?: string
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? '')
  const [options, setOptions] = React.useState<SelectOption[]>([])
  const [placeholder, setPlaceholder] = React.useState<React.ReactNode>()
  const currentValue = value ?? uncontrolledValue

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setUncontrolledValue(nextValue)
      }

      onValueChange?.(nextValue)
    },
    [onValueChange, value]
  )

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        setValue: handleValueChange,
        options,
        setOptions,
        placeholder,
        setPlaceholder,
        disabled,
        name,
      }}
    >
      <div data-slot="select">{children}</div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({ className, ...props }: React.ComponentProps<'select'>) {
  const { value, setValue, options, placeholder, disabled, name } = useSelectContext('SelectTrigger')

  return (
    <select
      data-slot="select-trigger"
      className={cn(
        'border-input shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px]',
        className
      )}
      disabled={disabled ?? props.disabled}
      name={name ?? props.name}
      value={value}
      onChange={(event) => {
        props.onChange?.(event)
        setValue(event.target.value)
      }}
      {...props}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function SelectValue({ placeholder }: { placeholder?: React.ReactNode }) {
  const { setPlaceholder } = useSelectContext('SelectValue')

  React.useEffect(() => {
    setPlaceholder(placeholder)

    return () => {
      setPlaceholder(undefined)
    }
  }, [placeholder, setPlaceholder])

  return null
}

function SelectContent({ children }: { children: React.ReactNode }) {
  const { setOptions } = useSelectContext('SelectContent')

  React.useEffect(() => {
    const nextOptions = React.Children.toArray(children).flatMap((child) => {
      if (!React.isValidElement<SelectItemProps>(child)) {
        return []
      }

      return [
        {
          value: child.props.value,
          label: child.props.children,
          disabled: child.props.disabled,
        },
      ]
    })

    setOptions(nextOptions)

    return () => {
      setOptions([])
    }
  }, [children, setOptions])

  return null
}

type SelectItemProps = {
  value: string
  disabled?: boolean
  children: React.ReactNode
}

function SelectItem(_props: SelectItemProps) {
  return null
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }