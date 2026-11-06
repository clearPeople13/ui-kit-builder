import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderFilterableFeature = createClassFeature({
  id: 'cascader.filterable',
  props: {
    filterable: { type: Boolean },
    filterMethod: { type: Function },
    debounce: { type: Number, default: 300 },
    fitInputWidth: { type: [Boolean, Number], default: false }
  },
  className: (props) => (props.filterable ? 'ui-cascader--filterable' : undefined)
})
