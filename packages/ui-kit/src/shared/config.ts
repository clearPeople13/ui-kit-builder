import type { ComputedRef, InjectionKey } from 'vue'
import { inject } from 'vue'

export interface UiGlobalConfig {
  size?: string
}

export const UI_CONFIG_KEY: InjectionKey<ComputedRef<UiGlobalConfig>> = Symbol('ui-config')

export function useUiConfig(): ComputedRef<UiGlobalConfig> | undefined {
  return inject(UI_CONFIG_KEY, undefined)
}
