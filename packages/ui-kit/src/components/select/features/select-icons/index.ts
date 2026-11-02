import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const selectIconsFeature = createClassFeature({
  id: 'select.select-icons',
  props: {
    suffixIcon: { type: [String, Object, Function], default: '' }
  },
  className: (props) => (hasIconProp(props) ? 'ui-select--icons' : undefined)
})
