import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const formItemValidateFeature = createClassFeature({
  id: 'form.form-item-validate',
  props: {
    rules: { type: [Object, Array] },
    showMessage: { type: Boolean, default: null },
    inlineMessage: { type: Boolean, default: null }
  },
  className: () => 'ui-form-item--validate'
})
