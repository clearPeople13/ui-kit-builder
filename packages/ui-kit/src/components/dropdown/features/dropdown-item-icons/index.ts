import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const dropdownItemIconsFeature = createClassFeature({
  id: 'dropdown.dropdown-item-icons',
  props: {
    icon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-dropdown-item--icons' : undefined)
})
