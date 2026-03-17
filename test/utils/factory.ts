// Simple factory implementation for test data

interface Factory<T> {
  build(overrides?: Partial<T>): T
  buildList(count: number, overrides?: Partial<T>): T[]
  extend(overrides: Partial<T>): Factory<T>
  resetSequenceNumber(): void
}

interface FactoryConfig<T> {
  sequence: number
  defaults: Partial<T>
}

class SyncFactory<T> implements Factory<T> {
  private config: FactoryConfig<T>

  constructor(defaults: Partial<T>) {
    this.config = {
      sequence: 1,
      defaults
    }
  }

  static makeFactory<T>(defaults: Partial<T>): Factory<T> {
    return new SyncFactory(defaults)
  }

  build(overrides?: Partial<T>): T {
    const merged = {
      ...this.config.defaults,
      ...overrides
    }

    // Process sequence generators
    const result = {} as T
    Object.entries(merged).forEach(([key, value]) => {
      if (typeof value === 'function' && value.name === 'each') {
        (result as any)[key] = value(this.config.sequence)
      } else {
        (result as any)[key] = value
      }
    })

    this.config.sequence++
    return result
  }

  buildList(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides))
  }

  extend(overrides: Partial<T>): Factory<T> {
    const newDefaults = { ...this.config.defaults, ...overrides }
    return new SyncFactory(newDefaults)
  }

  resetSequenceNumber(): void {
    this.config.sequence = 1
  }

  // Helper for sequence-based values
  static each = (fn: (index: number) => any) => {
    const eachFn = (index: number) => fn(index)
    Object.defineProperty(eachFn, 'name', {
      value: 'each',
      writable: false,
      configurable: true
    })
    return eachFn
  }
}

export const Factory = {
  Sync: {
    makeFactory: SyncFactory.makeFactory,
    each: SyncFactory.each
  }
} as const

export type { Factory }
