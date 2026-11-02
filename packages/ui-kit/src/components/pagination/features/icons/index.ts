import { createClassFeature } from '../../../../shared/component'
import { hasIconProp } from '../../../../shared/icon'
import './style.css'

export const paginationIconsFeature = createClassFeature({
  id: 'pagination.icons',
  props: {
    prevIcon: { type: [String, Object, Function] },
    nextIcon: { type: [String, Object, Function] }
  },
  className: (props) => (hasIconProp(props) ? 'ui-pagination--icons' : undefined)
})
