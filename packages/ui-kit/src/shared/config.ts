import type { ComputedRef, InjectionKey } from 'vue'
import { computed, inject } from 'vue'

export interface UiLocaleEmpty {
  description?: string
}

export interface UiLocaleSelect {
  placeholder?: string
  loading?: string
  noData?: string
  noMatch?: string
}

export interface UiLocaleTransfer {
  filterPlaceholder?: string
  empty?: string
}

export interface UiLocale {
  empty?: UiLocaleEmpty
  select?: UiLocaleSelect
  transfer?: UiLocaleTransfer
}

export const defaultUiLocale: { [K in keyof UiLocale]-?: Required<NonNullable<UiLocale[K]>> } = {
  empty: { description: '暂无数据' },
  select: { placeholder: '请选择', loading: '加载中', noData: '无数据', noMatch: '无匹配数据' },
  transfer: { filterPlaceholder: '请输入搜索内容', empty: '暂无数据' }
}

export interface UiGlobalConfig {
  size?: string
  locale?: UiLocale
}

export const UI_CONFIG_KEY: InjectionKey<ComputedRef<UiGlobalConfig>> = Symbol('ui-config')

export function useUiConfig(): ComputedRef<UiGlobalConfig> | undefined {
  return inject(UI_CONFIG_KEY, undefined)
}

export function useLocale<T extends keyof UiLocale>(component: T): ComputedRef<Required<NonNullable<UiLocale[T]>>> {
  const config = inject(UI_CONFIG_KEY, undefined)
  // 键级回退：注入的 locale 只覆盖显式给出的键，其余键落回默认中文文案
  return computed(
    () =>
      ({ ...defaultUiLocale[component], ...(config?.value.locale?.[component] ?? {}) }) as unknown as Required<
        NonNullable<UiLocale[T]>
      >
  )
}
