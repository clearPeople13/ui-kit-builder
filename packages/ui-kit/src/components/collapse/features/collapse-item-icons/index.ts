import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const collapseItemIconsFeature = createClassFeature({
  id: 'collapse.collapse-item-icons',
  props: {
    icon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-collapse-item--icons' : undefined)
})
