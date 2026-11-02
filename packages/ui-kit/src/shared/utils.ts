export function noop(): void {}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

export function isDef<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function'
}

export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function hasOwn(target: unknown, key: PropertyKey): boolean {
  return !isNil(target) && Object.prototype.hasOwnProperty.call(target, key)
}

export function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (isNil(value)) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function addUnit(value: unknown): string | undefined {
  if (isNil(value) || value === '') {
    return undefined
  }
  if (typeof value === 'number') {
    return `${value}px`
  }
  const text = String(value)
  return /^\d+(\.\d+)?$/.test(text) ? `${text}px` : text
}

export function isClient(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay = 100): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const wrapped = ((...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }) as T & { cancel: () => void }
  wrapped.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return wrapped
}

export function throttle<T extends (...args: any[]) => void>(fn: T, interval = 100): T {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = interval - (now - last)
    if (remaining <= 0) {
      last = now
      fn(...args)
      return
    }
    if (!timer) {
      timer = setTimeout(() => {
        timer = null
        last = Date.now()
        fn(...args)
      }, remaining)
    }
  }) as T
}

export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false
  let result: ReturnType<T>
  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true
      result = fn(...args)
    }
    return result
  }) as T
}
