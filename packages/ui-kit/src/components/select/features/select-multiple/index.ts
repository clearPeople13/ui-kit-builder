import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const selectMultipleFeature = createClassFeature({
  id: 'select.select-multiple',
  props: {
    multiple: { type: Boolean },
    multipleLimit: { type: Number, default: 0 },
    collapseTags: { type: Boolean },
    maxCollapseTags: { type: Number, default: 1 },
    tagType: { type: String, default: 'info' },
    tagEffect: { type: String, default: 'light' }
  },
  className: (props) => (props.multiple ? 'ui-select--multiple' : undefined)
})
