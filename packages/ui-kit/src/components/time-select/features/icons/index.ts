import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const timeSelectIconsFeature = createClassFeature({
  id: 'time-select.icons',
  props: {
    prefixIcon: { type: [String, Object], default: '' }
  },
  className: (props) => (hasIconProp(props) ? 'ui-time-select--icons' : undefined)
})
