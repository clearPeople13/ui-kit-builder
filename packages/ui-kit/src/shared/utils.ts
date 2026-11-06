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

/**
 * 合并样式来源，支持宿主写 `style="width: 220px"` 这种字符串写法。
 *
 * 不能直接用对象展开：`{...attrs.style}` 在 attrs.style 是字符串时展开成
 * `{0:'w',1:'i',2:'d',…}`，Vue 会把数字键当成样式名写进 style[0]，
 * 真浏览器里 setStyle 直接抛 TypeError 让整个组件挂不掉
 * （happy-dom 的 CSSStyleDeclaration 不校验索引写入，单测看不出问题）。
 */
function assignStyle(target: Record<string, string>, source: unknown): void {
  if (isNil(source) || source === false || source === true) {
    return
  }
  if (isString(source)) {
    for (const declaration of source.split(';')) {
      const separator = declaration.indexOf(':')
      if (separator < 0) {
        continue
      }
      const name = declaration.slice(0, separator).trim()
      const value = declaration.slice(separator + 1).trim()
      if (name) {
        target[name] = value
      }
    }
    return
  }
  if (Array.isArray(source)) {
    for (const item of source) {
      assignStyle(target, item)
    }
    return
  }
  if (isObject(source)) {
    for (const [name, value] of Object.entries(source)) {
      if (!name || isNil(value) || value === false) {
        continue
      }
      target[name] = String(value)
    }
  }
}

export function mergeStyles(...sources: unknown[]): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const source of sources) {
    assignStyle(merged, source)
  }
  return merged
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
