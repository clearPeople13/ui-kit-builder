import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const formValidateFeature = createClassFeature({
  id: 'form.validate',
  props: {
    rules: { type: Object },
    showMessage: { type: Boolean, default: true },
    inlineMessage: { type: Boolean },
    statusIcon: { type: Boolean },
    validateOnRuleChange: { type: Boolean, default: true },
    scrollToError: { type: Boolean },
    scrollIntoViewOptions: { type: [Object, Boolean], default: true },
    requireAsteriskPosition: { type: String, default: 'left' },
    hideRequiredAsterisk: { type: Boolean },
    labelSuffix: { type: String, default: '' }
  },
  className: () => 'ui-form--validate'
})
