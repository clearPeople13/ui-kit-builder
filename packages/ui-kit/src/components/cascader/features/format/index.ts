import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const cascaderFormatFeature = createClassFeature({
  id: 'cascader.format',
  props: {
    valueOnClear: { type: [String, Number, Boolean, Function], default: undefined }
  },
  className: () => 'ui-cascader--format'
})
