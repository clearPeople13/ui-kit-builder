import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const notificationIconsFeature = createClassFeature({
  id: 'notification.icons',
  props: {
    icon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-notification--icons' : undefined)
})
