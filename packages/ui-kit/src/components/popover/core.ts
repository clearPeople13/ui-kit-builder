import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { sizeValue, triggerConfig } from '../../shared/behavior'
import { mergeStyles } from '../../shared/utils'
import './core.css'

const popoverBaseProps = {
  disabled: { type: Boolean },
  // Boolean prop 必须显式 default: undefined，否则不传时 Vue 归一化成 false，
  // triggerConfig 会把"未受控"误判成"受控且强制收起"
  visible: { type: Boolean, default: undefined },
  showAfter: { type: Number, default: 0 },
  hideAfter: { type: Number, default: 200 },
  autoClose: { type: Number, default: 0 },
  arrowOffset: { type: Number, default: 5 },
  id: { type: String },
  style: { type: [String, Array, Object, Boolean] },
  className: { type: [String, Array, Object, Boolean] },
  effect: { type: String, default: 'light' },
  enterable: { type: Boolean, default: true },
  zIndex: { type: Number },
  content: { type: String, default: '' },
  onClick: { type: Function },
  trigger: { type: [String, Array], default: 'hover' },
  tabindex: { type: [Number, String], default: 0 },
  title: { type: String },
  width: { type: [String, Number], default: 150 }
}

function popoverTrigger(props: Record<string, any>): 'click' | 'hover' | 'contextmenu' {
  const value = Array.isArray(props.trigger) ? props.trigger[0] : props.trigger
  return value === 'click' || value === 'contextmenu' ? value : 'hover'
}

function popoverPanelStyle(props: Record<string, any>): Record<string, string> {
  return mergeStyles(props.style, { width: sizeValue(props.width) })
}

function popoverPanelClass(props: Record<string, any>): unknown {
  const className = props.className
  if (typeof className === 'string' || Array.isArray(className)) {
    return className
  }
  return className && typeof className === 'object' ? className : null
}

export function createPopover(features: UiFeature[] = []) {
  return createUiComponent(
    triggerConfig({
      name: 'UiPopover',
      baseClass: 'ui-popover',
      props: popoverBaseProps,
      panelClass: 'ui-popover__panel',
      trigger: popoverTrigger,
      enterable: (props) => props.enterable !== false,
      autoClose: (props) => Number(props.autoClose ?? 0),
      panelStyle: popoverPanelStyle,
      panelClassName: popoverPanelClass,
      panel: ({ props, slots }) => [
        props.title ? h('div', { class: 'ui-popover__title' }, props.title) : null,
        h('div', { class: 'ui-popover__content' }, [slots.content?.() ?? props.content ?? ''])
      ]
    }),
    features
  )
}
