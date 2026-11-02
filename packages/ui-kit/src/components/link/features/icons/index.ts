import type { Component } from 'vue'
import { renderIcon } from '../../../../shared/icon'

export const linkIconsFeature = {
  id: 'link.icons',
  props: {
    icon: { type: [String, Object, Function] }
  },
  setup(props: { icon?: Component | string }) {
    return {
      prefix: () => (props.icon ? renderIcon(props.icon, { class: 'ui-link__icon' }) : null)
    }
  }
}
