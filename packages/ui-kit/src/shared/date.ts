export interface TimeParts {
  hours: number
  minutes: number
  seconds: number
}

export function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDateValue(date: Date, pattern: string): string {
  const map: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    YY: pad(date.getFullYear() % 100),
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    DD: pad(date.getDate()),
    D: String(date.getDate()),
    HH: pad(date.getHours()),
    H: String(date.getHours()),
    mm: pad(date.getMinutes()),
    m: String(date.getMinutes()),
    ss: pad(date.getSeconds()),
    s: String(date.getSeconds())
  }
  return pattern.replace(/YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g, (token) => map[token] ?? token)
}

export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime())
  }
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const text = String(value ?? '').trim()
  if (!text) {
    return null
  }
  const match = text.match(
    /^(\d{4})(?:[-/](\d{1,2}))?(?:[-/](\d{1,2}))?(?:[T ](\d{1,2}))?(?::(\d{1,2}))?(?::(\d{1,2}))?/
  )
  if (!match) {
    return null
  }
  const date = new Date(
    Number(match[1]),
    Number(match[2] ?? 1) - 1,
    Number(match[3] ?? 1),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0)
  )
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseTimeValue(value: unknown): TimeParts | null {
  const text = String(value ?? '').trim()
  if (!text) {
    return null
  }
  const match = text.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/)
  if (!match) {
    return null
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3] ?? 0)
  if (hours > 23 || minutes > 59 || seconds > 59) {
    return null
  }
  return { hours, minutes, seconds }
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function monthCells(monthDate: Date): Date[] {
  const first = startOfMonth(monthDate)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset)
  return Array.from({ length: 42 }, (_item, index) => {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
  })
}

export function compareDate(left: Date, right: Date): number {
  return left.getTime() - right.getTime()
}

export function isoWeekNumber(date: Date): number {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayOffset = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayOffset + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstOffset = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstOffset + 3)
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000))
}
