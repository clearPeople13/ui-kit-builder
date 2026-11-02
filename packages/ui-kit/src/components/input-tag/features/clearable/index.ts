import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const inputTagClearableFeature = createClassFeature({
  id: 'input-tag.clearable',
  props: {
    clearable: { type: Boolean },
    clearIcon: { type: [String, Object, Function], default: () => ({ name: 'CircleClose', __name: 'circle-close' }) }
  },
  className: (props) => (props.clearable || props.clearIcon ? 'ui-input-tag--clearable' : undefined)
})
