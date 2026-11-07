import type { CSSProperties, VNodeChild } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { mergeStyles } from '../../shared/utils'
import './core.css'

const popperBaseProps = {
  gpuAcceleration: { type: Boolean, default: true },
  strategy: { type: String, default: 'absolute' },
  role: { type: String, default: 'tooltip' }
}

export function createPopper(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiPopper',
        baseClass: 'ui-popper',
        props: popperBaseProps,
        defaultTag: 'div'
      }),
      attrs: (props) => ({ role: props.role || 'tooltip' }),
      styles: (props) =>
        ({
          position: props.strategy === 'fixed' ? 'fixed' : 'absolute',
          ...(props.gpuAcceleration === false ? {} : { willChange: 'transform', transform: 'translateZ(0)' })
        }) as CSSProperties
    },
    features
  )
}

const popperArrowBaseProps = {
  arrowOffset: { type: Number, default: 5 }
}

export function createPopperArrow(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiPopperArrow',
        baseClass: 'ui-popper-arrow',
        props: popperArrowBaseProps,
        defaultTag: 'div'
      }),
      attrs: () => ({
        'aria-hidden': 'true'
      }),
      styles: (props) => ({
        '--ui-popper-arrow-offset': `${Number(props.arrowOffset) || 0}px`
      })
    },
    features
  )
}

const popperContentBaseProps = {
  gpuAcceleration: { type: Boolean, default: true },
  strategy: { type: String, default: 'absolute' },
  arrowOffset: { type: Number, default: 5 },
  id: { type: String },
  style: { type: [String, Array, Object, Boolean] },
  className: { type: [String, Array, Object, Boolean] },
  content: { type: [String, Number, Object, Function] },
  label: { type: [String, Number, Object, Function] },
  title: { type: [String, Number, Object, Function] },
  description: { type: [String, Number, Object, Function] },
  value: { type: [String, Number, Object, Function] },
  effect: { type: String, default: 'dark' },
  visible: { type: Boolean, default: true },
  virtualTriggering: { type: Boolean },
  zIndex: { type: Number },
  ariaLabel: { type: String }
}

/** className 走 classes 合并：component.ts 会用宿主 attrs.class 重建 class 数组，写在 attrs 里会被覆盖 */
function popperContentClass(props: Record<string, any>): string | false | null {
  const className = props.className
  if (typeof className === 'string') {
    return className
  }
  if (Array.isArray(className)) {
    return className.filter(Boolean).join(' ')
  }
  if (className && typeof className === 'object') {
    return Object.keys(className)
      .filter((key) => className[key])
      .join(' ')
  }
  return null
}

export function createPopperContent(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiPopperContent',
      baseClass: 'ui-popper-content',
      props: popperContentBaseProps,
      tag: () => 'div',
      classes: (props) => [
        popperContentClass(props),
        props.effect ? `is-${props.effect}` : '',
        props.visible === false ? 'is-hidden' : '',
        props.virtualTriggering ? 'is-virtual' : ''
      ],
      styles: (props) =>
        mergeStyles(
          // 定位基准由 strategy 决定：absolute 认最近的定位祖先，fixed 认视口。
          // 缺了这一行面板就是 static，宿主写的 left/top 与 zIndex 全都不生效。
          { position: props.strategy === 'fixed' ? 'fixed' : 'absolute' },
          props.style,
          props.zIndex !== undefined ? { zIndex: Number(props.zIndex) } : {},
          props.gpuAcceleration === false ? {} : { willChange: 'transform', transform: 'translateZ(0)' },
          { '--ui-popper-arrow-offset': `${Number(props.arrowOffset) || 0}px` }
        ) as CSSProperties,
      attrs: (props) => ({
        id: props.id,
        role: 'tooltip',
        'aria-label': props.ariaLabel,
        'aria-hidden': props.visible === false ? 'true' : undefined
      }),
      content: ({ slots, props }) =>
        (slots.default?.() ??
          props.label ??
          props.title ??
          props.description ??
          props.content ??
          props.value ??
          null) as VNodeChild
    },
    features
  )
}

const popperTriggerBaseProps = {
  virtualTriggering: { type: Boolean },
  onClick: { type: Function },
  id: { type: String },
  expanded: { type: Boolean }
}

export function createPopperTrigger(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiPopperTrigger',
      baseClass: 'ui-popper-trigger',
      props: popperTriggerBaseProps,
      tag: () => 'div',
      classes: (props) => [props.expanded ? 'is-open' : '', props.virtualTriggering ? 'is-virtual' : ''],
      attrs: (props) => ({
        id: props.id,
        role: 'button',
        'aria-expanded': Boolean(props.expanded),
        'aria-hidden': props.virtualTriggering ? 'true' : undefined,
        onClick: (event: Event) => {
          if (typeof props.onClick === 'function') {
            props.onClick(event)
          }
        }
      }),
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}
