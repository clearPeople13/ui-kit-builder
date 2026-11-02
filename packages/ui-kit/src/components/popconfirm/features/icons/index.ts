import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const popconfirmIconsFeature = createClassFeature({
  id: 'popconfirm.icons',
  props: {
    icon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-popconfirm--icons' : undefined)
})
