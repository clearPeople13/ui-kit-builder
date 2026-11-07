import { h, ref } from 'vue'
import { X } from '../../../../shared/icons'
import type { UiFeature } from '../../../../shared/feature'
import { renderIcon } from '../../../../shared/icon'
import './style.css'

export const alertClosableFeature: UiFeature = {
  id: 'alert.closable',
  props: {
    closable: { type: Boolean, default: true },
    closeText: { type: String, default: '' }
  },
  setup(props, { emit }) {
    const visible = ref(true)
    return {
      class: () => (visible.value ? 'is-closable' : 'is-hidden'),
      suffix: () => {
        if (!visible.value) {
          return null
        }
        if (!props.closable && !props.closeText) {
          return null
        }
        return h(
          'button',
          {
            class: 'ui-alert__close',
            type: 'button',
            'aria-label': 'Close',
            onClick: () => {
              visible.value = false
              emit('close')
            }
          },
          props.closeText || renderIcon(X)
        )
      }
    }
  }
}
