import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const pageHeaderIconsFeature = createClassFeature({
  id: 'page-header.icons',
  props: {
    icon: { type: [String, Object, Function], default: 'arrowLeft' }
  },
  className: (props) => (hasIconProp(props) ? 'ui-page-header--icons' : undefined)
})
