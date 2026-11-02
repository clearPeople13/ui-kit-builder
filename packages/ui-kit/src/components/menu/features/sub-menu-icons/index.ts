import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const subMenuIconsFeature = createClassFeature({
  id: 'menu.sub-menu-icons',
  props: {
    expandCloseIcon: { type: [String, Object, Function] },
    expandOpenIcon: { type: [String, Object, Function] },
    collapseCloseIcon: { type: [String, Object, Function] },
    collapseOpenIcon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-sub-menu--icons' : undefined)
})
