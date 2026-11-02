import type { Component } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import { CircleCheck, CircleX, Info, TriangleAlert } from '../../../../shared/icons'
import { renderIcon } from '../../../../shared/icon'
import { isString } from '../../../../shared/utils'
import './style.css'

const ALERT_ICONS: Record<string, Component> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  info: Info
}

export const alertIconsFeature: UiFeature = {
  id: 'alert.icons',
  props: {
    showIcon: { type: Boolean }
  },
  setup(props) {
    return {
      class: () => (props.showIcon ? 'ui-alert--icons' : undefined),
      prefix: () => {
        if (!props.showIcon) {
          return null
        }
        const type = isString(props.type) ? props.type : ''
        return renderIcon(ALERT_ICONS[type] ?? Info, { class: 'ui-alert__icon' })
      }
    }
  }
}
