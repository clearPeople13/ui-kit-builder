import { h } from 'vue'
import { CircleHelp } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { sizeValue, triggerConfig } from '../../shared/behavior'
import { popconfirmIconsFeature } from './features/icons/index'
import { popconfirmPopperFeature } from './features/popper/index'
import './core.css'

const popconfirmBaseProps = {
  title: { type: String },
  confirmButtonText: { type: String },
  cancelButtonText: { type: String },
  confirmButtonType: { type: String, default: 'primary' },
  cancelButtonType: { type: String, default: 'text' },
  iconColor: { type: String, default: '#f90' },
  hideIcon: { type: Boolean },
  hideAfter: { type: Number, default: 200 },
  // Boolean prop 必须显式 default: undefined，否则不传时 Vue 归一化成 false，
  // triggerConfig 会把"未受控"误判成"受控且强制收起"
  visible: { type: Boolean, default: undefined },
  effect: { type: String, default: 'light' },
  width: { type: [String, Number], default: 150 }
}

export function createPopconfirm(features: UiFeature[] = []) {
  return createUiComponent(
    triggerConfig({
      name: 'UiPopconfirm',
      baseClass: 'ui-popconfirm',
      props: popconfirmBaseProps,
      panelClass: 'ui-popconfirm__panel',
      trigger: 'click',
      panelStyle: (props) => ({ width: sizeValue(props.width) }),
      panel: ({ props, slots, emit, state }) => [
        h('div', { class: 'ui-popconfirm__title' }, [
          props.hideIcon
            ? null
            : renderIcon(props.icon || CircleHelp, {
                class: 'ui-popconfirm__icon',
                attrs: { style: { color: props.iconColor } }
              }),
          h('span', null, props.title || '确定执行此操作吗？')
        ]),
        slots.content ? h('div', { class: 'ui-popconfirm__content' }, [slots.content()]) : null,
        h('div', { class: 'ui-popconfirm__actions' }, [
          h(
            'button',
            {
              class: ['ui-popconfirm__button', 'is-cancel', props.cancelButtonType === 'text' ? 'is-text' : ''],
              type: 'button',
              onClick: () => {
                emit('cancel')
                state.hide()
              }
            },
            props.cancelButtonText || '取消'
          ),
          h(
            'button',
            {
              class: ['ui-popconfirm__button', 'is-confirm', `is-${props.confirmButtonType || 'primary'}`],
              type: 'button',
              onClick: () => {
                emit('confirm')
                state.hide()
              }
            },
            props.confirmButtonText || '确定'
          )
        ])
      ]
    }),
    features
  )
}
