export interface TimeParts {
  hours: number
  minutes: number
  seconds: number
}

export function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const FORMAT_TOKENS = /YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g

export function formatDateValue(date: Date, pattern: string): string {
  const hour24 = date.getHours()
  const hour12 = hour24 % 12 || 12
  const meridiem = hour24 < 12 ? 'AM' : 'PM'
  const map: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    YY: pad(date.getFullYear() % 100),
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    DD: pad(date.getDate()),
    D: String(date.getDate()),
    HH: pad(hour24),
    H: String(hour24),
    hh: pad(hour12),
    h: String(hour12),
    mm: pad(date.getMinutes()),
    m: String(date.getMinutes()),
    ss: pad(date.getSeconds()),
    s: String(date.getSeconds()),
    A: meridiem,
    a: meridiem.toLowerCase()
  }
  return pattern.replace(FORMAT_TOKENS, (token) => map[token] ?? token)
}

/**
 * 秒列是否该出现：只认 s / ss token。
 * 原先写 includes('s')，凡是格式里带英文字面 s（如 '(summer)'）就会误开秒列。
 */
export function hasSecondsToken(pattern: string): boolean {
  return /(^|[^A-Za-z])ss?(?![A-Za-z])/.test(pattern)
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

/**
 * 严格解析 HH:mm[:ss]。正则首尾锚定（F-57）：
 * 原先 /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/ 会把 'abc1:2xyz'、'1:299'、
 * '上午9:30随意' 里的片段吞成合法时间，让"解析失败不提交"的契约形同虚设。
 */
export function parseTimeValue(value: unknown): TimeParts | null {
  const text = String(value ?? '').trim()
  if (!text) {
    return null
  }
  const match = text.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)
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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 按显示格式回输（F-58 / F-63）：先走严格的 HH:mm[:ss]，失败时把 pattern
 * 编译成正则再解析。这样"照着界面上看到的格式键入"能提交成功，
 * 而夹带垃圾的文本仍然进不来。支持 hh / h / A / a 的 12 小时制。
 *
 * parseTimeValue 保持严格语义给 time-select 等调用方用，避免把宽容解析扩散到全库。
 */
export function parseTimeText(value: unknown, pattern?: string): TimeParts | null {
  const strict = parseTimeValue(value)
  if (strict || !pattern) {
    return strict
  }
  const text = String(value ?? '').trim()
  if (!text) {
    return null
  }

  const slots: string[] = []
  let source = ''
  let last = 0
  const tokens = /YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g
  let token: RegExpExecArray | null
  while ((token = tokens.exec(pattern)) !== null) {
    source += escapeRegExp(pattern.slice(last, token.index))
    const name = token[0]
    if (name === 'HH' || name === 'H' || name === 'hh' || name === 'h') {
      source += '(\\d{1,2})'
      slots.push('h')
    } else if (name === 'mm' || name === 'm') {
      source += '(\\d{1,2})'
      slots.push('m')
    } else if (name === 'ss' || name === 's') {
      source += '(\\d{1,2})'
      slots.push('s')
    } else if (name === 'A' || name === 'a') {
      source += '(AM|PM|am|pm)'
      slots.push('meridiem')
    } else {
      // 日期段不参与时间解析，但也不能把字面文本吃掉
      source += '(?:\\d{1,4})'
    }
    last = token.index + name.length
  }
  source += escapeRegExp(pattern.slice(last))

  const matched = new RegExp(`^${source}$`, 'i').exec(text)
  if (!matched) {
    return null
  }
  let hours = 0
  let minutes = 0
  let seconds = 0
  let meridiem = ''
  slots.forEach((slot, index) => {
    const raw = matched[index + 1]
    if (slot === 'h') {
      hours = Number(raw)
    } else if (slot === 'm') {
      minutes = Number(raw)
    } else if (slot === 's') {
      seconds = Number(raw)
    } else {
      meridiem = String(raw)
    }
  })
  if (/^pm$/i.test(meridiem) && hours < 12) {
    hours += 12
  }
  if (/^am$/i.test(meridiem) && hours === 12) {
    hours = 0
  }
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
