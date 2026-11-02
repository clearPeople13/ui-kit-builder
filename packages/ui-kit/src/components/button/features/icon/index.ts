import type { Component } from 'vue'
import { renderIcon } from '../../../../shared/icon'
import './style.css'

export const buttonIconFeature = {
  id: 'button.icon',
  props: {
    icon: { type: [String, Object, Function] }
  },
  setup(props: { icon?: Component | string }) {
    return {
      prefix: () => (props.icon ? renderIcon(props.icon, { class: 'ui-button__icon' }) : null)
    }
  }
}
