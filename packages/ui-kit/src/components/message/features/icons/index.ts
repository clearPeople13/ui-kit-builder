import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const messageIconsFeature = createClassFeature({
  id: 'message.icons',
  props: {
    icon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-message--icons' : undefined)
})
