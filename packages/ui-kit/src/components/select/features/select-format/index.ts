import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const selectFormatFeature = createClassFeature({
  id: 'select.select-format',
  props: {
    valueOnClear: { type: [String, Number, Boolean, Function], default: undefined }
  },
  className: () => 'ui-select--format'
})
