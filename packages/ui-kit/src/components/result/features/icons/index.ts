import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const resultIconsFeature = createClassFeature({
  id: 'result.icons',
  props: {
    icon: { type: String, default: 'info' }
  },
  className: (props) => (hasIconProp(props) ? 'ui-result--icons' : undefined)
})
