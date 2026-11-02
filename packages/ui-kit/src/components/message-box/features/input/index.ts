import { createClassFeature } from '../../../../shared/component'

export const messageBoxInputFeature = createClassFeature({
  id: 'message-box.input',
  props: {
    showInput: Boolean,
    inputPlaceholder: { type: String, default: '' },
    inputType: { type: String, default: 'text' },
    inputValue: { type: String, default: '' },
    inputValidator: Function,
    inputErrorMessage: { type: String, default: '' }
  },
  className: (props) => (props.showInput ? 'has-input' : undefined)
})
