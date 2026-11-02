import type { Component } from 'vue'
import { h, ref } from 'vue'
import { CircleCheck, CircleX, Info, TriangleAlert, X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { nextZIndex, resolveZIndex } from '../../shared/z-index'
import { messageIconsFeature } from './features/icons/index'
import { messageClosableFeature } from './features/closable/index'
import { messagePopperFeature } from './features/popper/index'
import { messageAppearanceFeature } from './features/appearance/index'
import './core.css'

const MESSAGE_ICONS: Record<string, Component> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  info: Info
}

const messageBaseProps = {
  type: { type: String, default: 'info' },
  customClass: { type: [String, Array, Object, Boolean], default: '' },
  dangerouslyUseHTMLString: { type: Boolean, default: false },
  id: { type: String, default: '' },
  message: { type: [String, Object, Function], default: '' },
  zIndex: { type: Number, default: 0 },
  showClose: { type: Boolean, default: false },
  center: { type: Boolean, default: false }
}

export function createMessage(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiMessage',
      baseClass: 'ui-message',
      props: messageBaseProps,
      classes: (props) => [`ui-message--${props.type || 'info'}`, props.center ? 'is-center' : '', props.customClass],
      styles: (props, state) => {
        const style: Record<string, any> = { zIndex: resolveZIndex(props.zIndex, state.zIndex) }
        const placement = props.placement as string | undefined
        if (!placement) {
          return style
        }
        const [side, align = 'center'] = placement.split('-')
        const offset = Number(props.offset ?? 16)
        style.position = 'fixed'
        style.width = 'auto'
        style.maxWidth = 'calc(100vw - 32px)'
        if (side === 'top' || side === 'bottom') {
          style[side] = `${offset}px`
          if (align === 'start') {
            style.left = `${offset}px`
          } else if (align === 'end') {
            style.right = `${offset}px`
          } else {
            style.left = '50%'
            style.transform = 'translateX(-50%)'
          }
        } else if (side === 'left' || side === 'right') {
          style[side] = `${offset}px`
          if (align === 'start') {
            style.top = `${offset}px`
          } else if (align === 'end') {
            style.bottom = `${offset}px`
          } else {
            style.top = '50%'
            style.transform = 'translateY(-50%)'
          }
        } else {
          return { zIndex: style.zIndex }
        }
        return style
      },
      setup(_props, { emit }) {
        const closed = ref(false)
        const zIndex = ref(nextZIndex())
        return {
          get zIndex() {
            return zIndex.value
          },
          get closed() {
            return closed.value
          },
          close() {
            closed.value = true
            emit('close')
          }
        }
      },
      content: ({ props, state }) => {
        if (state.closed) {
          return null
        }
        const body = props.dangerouslyUseHTMLString
          ? h('span', { class: 'ui-message__content', innerHTML: String(props.message ?? '') })
          : h('span', { class: 'ui-message__content' }, [props.message ?? ''])
        return h('div', { class: 'ui-message__panel', role: 'alert' }, [
          renderIcon(props.icon || MESSAGE_ICONS[props.type] || Info, { class: 'ui-message__icon' }),
          body,
          props.showClose
            ? h('button', { class: 'ui-message__close', type: 'button', onClick: () => state.close() }, [renderIcon(X)])
            : null
        ])
      }
    },
    features
  )
}
