import { h } from 'vue'
import { CircleHelp } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { useLocale } from '../../shared/config'
import { renderIcon } from '../../shared/icon'
import { sizeValue, triggerConfig } from '../../shared/behavior'
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
  modelValue: { type: Boolean, default: undefined },
  effect: { type: String, default: 'light' },
  width: { type: [String, Number], default: 150 }
}

const popconfirmTrigger = triggerConfig({
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
      h('span', null, props.title || state.locale.value.title)
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
        props.cancelButtonText || state.locale.value.cancel
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
        props.confirmButtonText || state.locale.value.confirm
      )
    ])
  ]
})

export function createPopconfirm(features: UiFeature[] = []) {
  const baseSetup = popconfirmTrigger.setup
  return createUiComponent(
    {
      ...popconfirmTrigger,
      // cancel / confirm 是面板按钮的动作事件，必须显式声明，否则监听留在 attrs 形成双通道
      emits: [...(popconfirmTrigger.emits ?? []), 'cancel', 'confirm'],
      setup(props, context) {
        // 直接挂到基座 state 上：展开态等取值是 getter，展开复制会丢响应性
        const state = baseSetup?.(props, context) ?? {}
        state.locale = useLocale('popconfirm')
        return state
      }
    },
    features
  )
}
