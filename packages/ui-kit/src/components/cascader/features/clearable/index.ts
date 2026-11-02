import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderClearableFeature = createClassFeature({
  id: 'cascader.clearable',
  props: {
    clearable: { type: Boolean },
    clearIcon: { type: [String, Object, Function], default: () => ({ name: 'CircleClose', __name: 'circle-close' }) }
  },
  className: (props) => (props.clearable || props.clearIcon ? 'ui-cascader--clearable' : undefined)
})
