import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderMultipleFeature = createClassFeature({
  id: 'cascader.multiple',
  props: {
    collapseTags: { type: Boolean },
    collapseTagsTooltip: { type: Boolean },
    maxCollapseTags: { type: Number, default: 1 },
    tagType: { type: String, default: 'info' },
    tagEffect: { type: String, default: 'light' }
  },
  className: (props) => (props.multiple ? 'ui-cascader--multiple' : undefined)
})
