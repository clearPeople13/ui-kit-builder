import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const treeIconsFeature = createClassFeature({
  id: 'tree.icons',
  props: {
    icon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-tree--icons' : undefined)
})
