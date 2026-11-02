import type { InjectionKey } from 'vue'

export interface FormRule {
  required?: boolean
  message?: string
  min?: number
  max?: number
  pattern?: RegExp | string
  whitespace?: boolean
  trigger?: string | string[]
}

export type FormRules = Record<string, FormRule | FormRule[]>

export interface FormContext {
  readonly model: Record<string, any> | undefined
  readonly rules: FormRules | undefined
  readonly errors: Record<string, string>
  readonly disabled: boolean
  readonly labelWidth: string | number | undefined
  readonly labelPosition: string
  readonly size: string | undefined
  readonly showMessage: boolean
  readonly inlineMessage: boolean
  readonly statusIcon: boolean
  readonly requireAsteriskPosition: string
  readonly hideRequiredAsterisk: boolean
  readonly labelSuffix: string
}

export const FORM_CONTEXT_KEY: InjectionKey<FormContext> = Symbol('ui-form-context')

export function normalizeFieldPath(prop: unknown): string {
  if (Array.isArray(prop)) {
    return prop
      .filter((part) => part !== undefined && part !== null && part !== '')
      .map((part) => String(part))
      .join('.')
  }
  return typeof prop === 'string' ? prop : ''
}

export function getFieldValue(model: Record<string, any> | undefined, path: string): unknown {
  if (!model || !path) {
    return undefined
  }
  let current: any = model
  for (const key of path.split('.')) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[key]
  }
  return current
}

export function toRuleList(rules: FormRule | FormRule[] | undefined): FormRule[] {
  if (!rules) {
    return []
  }
  const list = Array.isArray(rules) ? rules : [rules]
  return list.filter((rule): rule is FormRule => Boolean(rule) && typeof rule === 'object')
}

export function isEmptyFieldValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true
  }
  return Array.isArray(value) && value.length === 0
}

function measurableLength(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (Array.isArray(value)) {
    return value.length
  }
  if (typeof value === 'string') {
    return value.length
  }
  return undefined
}

export function resolveRuleMessage(value: unknown, rules: FormRule | FormRule[] | undefined): string {
  for (const rule of toRuleList(rules)) {
    const empty =
      isEmptyFieldValue(value) || (rule.whitespace === true && typeof value === 'string' && value.trim() === '')
    if (rule.required && empty) {
      return rule.message || '该字段为必填项'
    }
    if (empty) {
      continue
    }
    if (rule.pattern) {
      const pattern = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern)
      pattern.lastIndex = 0
      if (!pattern.test(String(value))) {
        return rule.message || '格式不正确'
      }
    }
    if (typeof rule.min === 'number' || typeof rule.max === 'number') {
      const length = measurableLength(value)
      if (length !== undefined) {
        if (typeof rule.min === 'number' && length < rule.min) {
          return rule.message || `不能小于 ${rule.min}`
        }
        if (typeof rule.max === 'number' && length > rule.max) {
          return rule.message || `不能大于 ${rule.max}`
        }
      }
    }
  }
  return ''
}
