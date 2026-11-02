import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const rateClearableFeature = createClassFeature({
  id: 'rate.clearable',
  props: {
    clearable: { type: Boolean }
  },
  className: (props) => (props.clearable || props.clearIcon ? 'ui-rate--clearable' : undefined)
})
