import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const checkboxAppearanceFeature = createClassFeature({
  id: 'checkbox.appearance',
  props: {
    border: { type: Boolean }
  },
  className: (props) => (props.border ? 'ui-checkbox--border' : undefined)
})
