import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { sizeValue, triggerConfig, wrapperConfig } from '../../shared/behavior'
import { dropdownPopperFeature } from './features/popper/index'
import { dropdownItemIconsFeature } from './features/dropdown-item-icons/index'
import './core.css'

const dropdownBaseProps = {
  size: { type: String, default: '' },
  disabled: { type: Boolean },
  trigger: { type: [String, Array], default: 'hover' },
  effect: { type: String, default: 'light' },
  id: { type: String },
  hideOnClick: { type: Boolean, default: true },
  showTimeout: { type: Number, default: 150 },
  hideTimeout: { type: Number, default: 150 },
  // Boolean prop 必须显式 default: undefined，否则不传时 Vue 归一化成 false，
  // triggerConfig 会把"未受控"误判成"受控且强制收起"
  visible: { type: Boolean, default: undefined },
  tabindex: { type: [Number, String], default: 0 },
  maxHeight: { type: [Number, String], default: '' },
  role: { type: String, default: 'menu' }
}

function dropdownTrigger(props: Record<string, any>): 'click' | 'hover' | 'contextmenu' {
  const value = Array.isArray(props.trigger) ? props.trigger[0] : props.trigger
  return value === 'click' || value === 'contextmenu' ? value : 'hover'
}

export function createDropdown(features: UiFeature[] = []) {
  return createUiComponent(
    triggerConfig({
      name: 'UiDropdown',
      baseClass: 'ui-dropdown',
      props: dropdownBaseProps,
      panelClass: 'ui-dropdown__panel',
      trigger: dropdownTrigger,
      closeOnPanelClick: (props) => props.hideOnClick !== false,
      panel: ({ slots, props }) =>
        h(
          'div',
          {
            class: 'ui-dropdown__content',
            style: {
              maxHeight: sizeValue(props.maxHeight) ?? '240px',
              overflowY: 'auto'
            }
          },
          [slots.dropdown?.() ?? slots.content?.() ?? null]
        )
    }),
    features
  )
}

const dropdownItemBaseProps = {
  disabled: { type: Boolean },
  divided: { type: Boolean }
}

export function createDropdownItem(features: UiFeature[] = []) {
  const base = wrapperConfig({
    name: 'UiDropdownItem',
    baseClass: 'ui-dropdown-item',
    props: dropdownItemBaseProps,
    defaultTag: 'li'
  })
  return createUiComponent(
    {
      ...base,
      classes: (props, state) => [...(base.classes?.(props, state) ?? []), props.divided ? 'is-divided' : ''],
      content: (context) => [
        context.props.icon ? renderIcon(context.props.icon, { class: 'ui-dropdown-item__icon' }) : null,
        base.content?.(context) ?? null
      ]
    },
    features
  )
}

const dropdownMenuBaseProps = {}

export function createDropdownMenu(features: UiFeature[] = []) {
  return createUiComponent(
    wrapperConfig({
      name: 'UiDropdownMenu',
      baseClass: 'ui-dropdown-menu',
      props: dropdownMenuBaseProps,
      defaultTag: 'ul'
    }),
    features
  )
}
