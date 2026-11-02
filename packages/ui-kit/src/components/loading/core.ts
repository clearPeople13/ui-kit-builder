import type { CSSProperties } from 'vue'
import { h, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { nextZIndex } from '../../shared/z-index'
import './core.css'

const loadingBaseProps = {
  visible: { type: Boolean, default: true },
  text: { type: String, default: '' },
  size: { type: [Number, String], default: '' },
  color: { type: String, default: '' },
  background: { type: String, default: '' },
  fullscreen: Boolean,
  lock: Boolean,
  customClass: { type: String, default: '' },
  target: { type: String, default: '' },
}

function sizeStyle(value: string | number): string | undefined {
  if (value === '' || value === undefined) {
    return undefined
  }
  return typeof value === 'number' ? `${value}px` : value
}

export function createLoading(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiLoading',
      baseClass: 'ui-loading',
      props: loadingBaseProps,
      classes: (props) => [
        props.visible ? '' : 'is-hidden',
        props.fullscreen ? 'is-fullscreen' : '',
        props.lock ? 'is-lock' : '',
        props.customClass
      ],
      setup(props) {
        const zIndex = ref(nextZIndex())
        watch(
          () => props.visible,
          (value) => {
            if (value && props.fullscreen) {
              zIndex.value = nextZIndex()
            }
          }
        )
        return {
          get zIndex() {
            return zIndex.value
          }
        }
      },
      styles: (props, state) => {
        const style: CSSProperties = {}
        if (props.background) {
          style.background = props.background
        }
        if (props.color) {
          ;(style as Record<string, any>)['--ui-loading-color'] = props.color
        }
        if (props.target) {
          style.position = 'absolute'
        }
        if (props.fullscreen) {
          style.zIndex = state.zIndex
        }
        return style
      },
      content: ({ props }) => {
        if (!props.visible) {
          return null
        }
        const spinnerStyle: CSSProperties = {
          width: sizeStyle(props.size) ?? undefined,
          height: sizeStyle(props.size) ?? undefined
        }
        return [
          h('span', { class: 'ui-loading__spinner', style: spinnerStyle }),
          props.text ? h('span', { class: 'ui-loading__text' }, props.text) : null
        ]
      }
    },
    features
  )
}
