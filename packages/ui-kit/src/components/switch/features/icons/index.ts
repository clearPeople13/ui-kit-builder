import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const switchIconsFeature = createClassFeature({
  id: 'switch.icons',
  props: {
    activeIcon: { type: [String, Object, Function] },
    inactiveIcon: { type: [String, Object, Function] },
    activeActionIcon: { type: [String, Object, Function] },
    inactiveActionIcon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-switch--icons' : undefined)
})
