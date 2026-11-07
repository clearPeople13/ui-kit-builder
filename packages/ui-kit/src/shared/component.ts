import type { Component, CSSProperties, ShallowRef, VNodeChild } from 'vue'
import { Teleport, defineComponent, h, inject, provide, shallowRef } from 'vue'
import type { UiFeature, UiFeatureState } from './feature'
import { UI_CONFIG_KEY } from './config'
import { mergeStyles } from './utils'
import './theme.css'
import './icons.css'
import './scrollbar.css'
import './floating.css'
import './loading.css'
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

export interface UiComponentSetupContext {
  attrs: Record<string, any>
  slots: Record<string, ((...args: any[]) => VNodeChild) | undefined>
  emit: (event: string, ...args: any[]) => void
  provide: (key: string | symbol, value: any) => void
  inject: (key: string | symbol, defaultValue?: any) => any
  /** 根节点 ref（渲染前创建，setup 内即可挂事件/读布局） */
  root: ShallowRef<any>
}

export interface UiComponentConfig {
  name: string
  baseClass: string
  props?: Record<string, any>
  emits?: string[]
  setup?: (props: Record<string, any>, context: UiComponentSetupContext) => Record<string, any>
  tag?: (props: Record<string, any>, state: Record<string, any>) => string | Component
  classes?: (props: Record<string, any>, state: Record<string, any>) => (string | false | null | undefined)[]
  styles?: (props: Record<string, any>, state: Record<string, any>) => CSSProperties
  attrs?: (props: Record<string, any>, state: Record<string, any>, states?: UiFeatureState[]) => Record<string, any>
  disabled?: (props: Record<string, any>, state: Record<string, any>) => boolean
  teleport?: (props: Record<string, any>, state: Record<string, any>) => string | Element | null | undefined
  content?: (context: UiComponentContext) => VNodeChild
  /** 渲染覆盖点：内容区之后的追加节点（如 button 的水波动画层），缺省时子节点结构不变 */
  append?: (context: UiComponentContext) => VNodeChild
  /** 组件级 expose，与特性 expose 合并（特性同名键优先）；缺省时不影响现有 expose 行为 */
  expose?: (runtime: {
    props: Record<string, any>
    attrs: Record<string, any>
    slots: Record<string, ((...args: any[]) => VNodeChild) | undefined>
    emit: (event: string, ...args: any[]) => void
    root: ShallowRef<any>
    state: Record<string, any>
  }) => Record<string, any> | void
  /** false 时关闭全局 size 注入（如 button 的 size 继承链是 属性→按钮组→全局，不能被基座截胡） */
  globalSize?: boolean
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
  const sizeFromGlobal = config.globalSize !== false && acceptsGlobalSize(baseProps.size)

  return defineComponent({
    name: config.name,
    inheritAttrs: false,
    // emits 必须显式声明齐全：未声明事件的监听（onChange/onInput/...）会留在 attrs 里，
    // 而下方 render 把 attrs 整体铺到根节点（约 117 行 ...attrs），组件内 emit() 对未声明事件
    // 又会回退调用 attrs 上的同名监听 —— 原生事件冒泡到根节点再触发一次，形成双通道二次回调。
    // 声明 emits 后 Vue 会把对应监听从 attrs 中剔除，只保留 emit 单通道。
    emits: config.emits,
    props: { ...baseProps, ...mergeFeatureProps(features) },
    setup(props, { attrs, slots, emit, expose }) {
      const resolved = props as Record<string, any>
      const root = shallowRef<any>(null)
      const globalConfig = inject(UI_CONFIG_KEY, undefined)
      const state = config.setup?.(resolved, { attrs, slots, emit, provide, inject, root }) ?? {}
      const states = resolveFeatureStates(features, resolved, { attrs, slots, emit, root, state })
      const exposed = {
        ...config.expose?.({ props: resolved, attrs, slots, emit, root, state }),
        ...collectFeatureExposed(features, { props: resolved, attrs, slots, emit, root, state })
      }
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
        const appended = config.append?.(context)
        const disabled = Boolean(config.disabled?.(renderProps, state)) || isFeatureDisabled(states)

        const node = h(
          tag,
          {
            // 注意：attrs 里可能含未声明事件的监听（见 emits 处注释），铺到根节点后
            // 会与 emit() 构成双通道；补全各组件 config.emits 是消除双绑的正确方式。
            ...attrs,
            ref: root,
            ...(config.attrs?.(renderProps, state, states) ?? {}),
            ...collectFeatureAttrs(states),
            class: [
              attrs.class,
              config.baseClass,
              ...(config.classes?.(renderProps, state) ?? []),
              ...collectFeatureClasses(states)
            ],
            style: mergeStyles(
              attrs.style,
              config.styles?.(renderProps, state),
              collectFeatureStyles(states)
            ) as CSSProperties,
            disabled: disabled || undefined
          },
          [
            ...prefix.map((renderFragment) => renderFragment()),
            content,
            ...suffix.map((renderFragment) => renderFragment()),
            ...(appended === undefined ? [] : [appended])
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
