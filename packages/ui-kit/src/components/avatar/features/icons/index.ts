import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const avatarIconsFeature = createClassFeature({
  id: 'avatar.icons',
  props: {
    icon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-avatar--icons' : undefined)
})
