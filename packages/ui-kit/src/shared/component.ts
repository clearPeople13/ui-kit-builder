import type { Component, CSSProperties, VNodeChild } from 'vue'
import { Teleport, defineComponent, h, inject, provide, shallowRef } from 'vue'
import type { UiFeature, UiFeatureState } from './feature'
import { UI_CONFIG_KEY } from './config'
import './theme.css'
import './icons.css'
import './scrollbar.css'
import './floating.css'
import {
  collectFeatureAttrs,
  collectFeatureClasses,
  collectFeatureExposed,
  collectFeatureFragments,
  collectFeatureStyles,
  isFeatureDisabled,
  mergeFeatureProps,
  resolveFeatureStates,
  transformFeatureContent
} from './feature'

export interface UiComponentContext {
  props: Record<string, any>
  attrs: Record<string, any>
  slots: Record<string, ((...args: any[]) => VNodeChild) | undefined>
  state: Record<string, any>
  states: UiFeatureState[]
  emit: (event: string, ...args: any[]) => void
  tag: string | Component
}

export interface UiComponentConfig {
  name: string
  baseClass: string
  props?: Record<string, any>
  emits?: string[]
  setup?: (
    props: Record<string, any>,
    context: {
      attrs: Record<string, any>
      slots: Record<string, ((...args: any[]) => VNodeChild) | undefined>
      emit: (event: string, ...args: any[]) => void
      provide: (key: string | symbol, value: any) => void
      inject: (key: string | symbol, defaultValue?: any) => any
    }
  ) => Record<string, any>
  tag?: (props: Record<string, any>, state: Record<string, any>) => string | Component
  classes?: (props: Record<string, any>, state: Record<string, any>) => (string | false | null | undefined)[]
  styles?: (props: Record<string, any>, state: Record<string, any>) => CSSProperties
  attrs?: (props: Record<string, any>, state: Record<string, any>) => Record<string, any>
  disabled?: (props: Record<string, any>, state: Record<string, any>) => boolean
  teleport?: (props: Record<string, any>, state: Record<string, any>) => string | Element | null | undefined
  content?: (context: UiComponentContext) => VNodeChild
}

export function renderSlot(
  slots: Record<string, ((...args: any[]) => VNodeChild) | undefined>,
  name: string,
  fallback: VNodeChild = null
): VNodeChild {
  return slots[name]?.() ?? fallback
}

function acceptsGlobalSize(sizeProp: Record<string, any> | undefined): boolean {
  if (!sizeProp?.type) {
    return false
  }
  const types = Array.isArray(sizeProp.type) ? sizeProp.type : [sizeProp.type]
  return types.includes(String) && !types.includes(Number)
}

export function createUiComponent(config: UiComponentConfig, features: UiFeature[] = []) {
  const baseProps = config.props ?? {}
  const sizeFromGlobal = acceptsGlobalSize(baseProps.size)

  return defineComponent({
    name: config.name,
    inheritAttrs: false,
    emits: config.emits,
    props: { ...baseProps, ...mergeFeatureProps(features) },
    setup(props, { attrs, slots, emit, expose }) {
      const resolved = props as Record<string, any>
      const root = shallowRef<any>(null)
      const globalConfig = inject(UI_CONFIG_KEY, undefined)
      const state = config.setup?.(resolved, { attrs, slots, emit, provide, inject }) ?? {}
      const states = resolveFeatureStates(features, resolved, { attrs, slots, emit, root, state })
      const exposed = collectFeatureExposed(features, { props: resolved, attrs, slots, emit, root, state })
      if (Object.keys(exposed).length) {
        expose(exposed)
      }

      return function render() {
        const globalSize = sizeFromGlobal && !resolved.size ? (globalConfig?.value.size ?? '') : ''
        const renderProps = globalSize ? { ...resolved, size: globalSize } : resolved
        const tag = config.tag?.(renderProps, state) ?? 'div'
        const context: UiComponentContext = {
          props: renderProps,
          attrs,
          slots,
          state,
          states,
          emit,
          tag
        }
        const prefix = collectFeatureFragments(states, 'prefix')
        const suffix = collectFeatureFragments(states, 'suffix')
        const baseContent = config.content
          ? config.content(context)
          : (slots.default?.() ?? renderProps.label ?? renderProps.content ?? renderProps.title ?? null)
        const content = transformFeatureContent(states, baseContent)
        const disabled = Boolean(config.disabled?.(renderProps, state)) || isFeatureDisabled(states)

        const node = h(
          tag,
          {
            ...attrs,
            ref: root,
            ...(config.attrs?.(renderProps, state) ?? {}),
            ...collectFeatureAttrs(states),
            class: [
              attrs.class,
              config.baseClass,
              ...(config.classes?.(renderProps, state) ?? []),
              ...collectFeatureClasses(states)
            ],
            style: {
              ...(attrs.style as Record<string, any>),
              ...(config.styles?.(renderProps, state) ?? {}),
              ...collectFeatureStyles(states)
            },
            disabled: disabled || undefined
          },
          [
            ...prefix.map((renderFragment) => renderFragment()),
            content,
            ...suffix.map((renderFragment) => renderFragment())
          ]
        )
        const teleportTarget = config.teleport?.(renderProps, state)
        return teleportTarget ? h(Teleport, { to: teleportTarget }, [node]) : node
      }
    }
  })
}

export function createClassFeature(config: {
  id: string
  props: Record<string, any>
  className: string | ((props: Record<string, any>) => string | false | null | undefined)
  style?: (props: Record<string, any>) => CSSProperties | undefined
  disabled?: (props: Record<string, any>) => boolean
}): UiFeature {
  return {
    id: config.id,
    props: config.props,
    setup(props) {
      return {
        class: () => {
          const value = typeof config.className === 'function' ? config.className(props) : config.className
          return value || undefined
        },
        style: () => config.style?.(props),
        disabled: () => config.disabled?.(props) ?? false
      }
    }
  }
}

export function toKebab(value: string): string {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '')
}
