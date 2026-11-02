import type { CSSProperties, ComputedRef, Ref, VNodeChild } from 'vue'
import { unref } from 'vue'

export type UiMaybeRef<T> = T | ComputedRef<T> | (() => T)

export function resolveFeatureValue<T>(value: UiMaybeRef<T> | undefined): T | undefined {
  if (typeof value === 'function') {
    return (value as () => T)()
  }
  return unref(value)
}

export interface UiFeatureState {
  class?: UiMaybeRef<string | undefined>
  style?: UiMaybeRef<CSSProperties | undefined>
  attrs?: UiMaybeRef<Record<string, any> | undefined>
  disabled?: UiMaybeRef<boolean>
  prefix?: () => VNodeChild
  suffix?: () => VNodeChild
  transformContent?: (content: VNodeChild) => VNodeChild
  hooks?: Record<string, (...args: any[]) => any>
}

export interface UiFeatureContext {
  attrs: Record<string, any>
  slots: Record<string, ((...args: any[]) => VNodeChild) | undefined>
  emit: (event: string, ...args: any[]) => void
  root?: Ref<any>
  state?: Record<string, any>
}

export interface UiFeatureRuntime extends Omit<UiFeatureContext, 'state'> {
  props: Record<string, any>
  root: Ref<any>
  state: Record<string, any>
}

export interface UiFeature {
  id: string
  props?: Record<string, any>
  setup?: (props: Record<string, any>, context: UiFeatureContext) => UiFeatureState | void
  expose?: (runtime: UiFeatureRuntime) => Record<string, any> | void
}

export function mergeFeatureProps(features: UiFeature[] = []): Record<string, any> {
  return Object.assign({}, ...features.map((feature) => feature.props ?? {}))
}

export function resolveFeatureStates(
  features: UiFeature[] = [],
  props: Record<string, any>,
  context?: UiFeatureContext
): UiFeatureState[] {
  const runtimeContext = context ?? {
    attrs: {},
    slots: {},
    emit: () => {}
  }
  return features.map((feature) => feature.setup?.(props, runtimeContext) ?? {})
}

export function collectFeatureExposed(features: UiFeature[], runtime: UiFeatureRuntime): Record<string, any> {
  const exposed: Record<string, any> = {}
  for (const feature of features) {
    const value = feature.expose?.(runtime)
    if (value) {
      Object.assign(exposed, value)
    }
  }
  return exposed
}

export function collectFeatureClasses(states: UiFeatureState[]): string[] {
  const classes: string[] = []
  for (const state of states) {
    const value = resolveFeatureValue(state.class)
    if (value) {
      classes.push(...value.split(/\s+/).filter(Boolean))
    }
  }
  return classes
}

export function collectFeatureStyles(states: UiFeatureState[]): CSSProperties {
  return Object.assign({}, ...states.map((state) => resolveFeatureValue(state.style) ?? {}))
}

export function collectFeatureAttrs(states: UiFeatureState[]): Record<string, any> {
  return Object.assign({}, ...states.map((state) => resolveFeatureValue(state.attrs) ?? {}))
}

export function collectFeatureFragments(states: UiFeatureState[], key: 'prefix' | 'suffix'): (() => VNodeChild)[] {
  return states.map((state) => state[key]).filter((value): value is () => VNodeChild => typeof value === 'function')
}

export function collectFeatureHooks(states: UiFeatureState[], name: string): ((...args: any[]) => any)[] {
  const hooks: ((...args: any[]) => any)[] = []
  for (const state of states) {
    const hook = state.hooks?.[name]
    if (typeof hook === 'function') {
      hooks.push(hook)
    }
  }
  return hooks
}

export function isFeatureDisabled(states: UiFeatureState[]): boolean {
  return states.some((state) => Boolean(resolveFeatureValue(state.disabled)))
}

export function transformFeatureContent(states: UiFeatureState[], content: VNodeChild): VNodeChild {
  return states.reduce(
    (current, state) => (state.transformContent ? state.transformContent(current) : current),
    content
  )
}
