import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const selectFilterableFeature = createClassFeature({
  id: 'select.select-filterable',
  props: {
    filterable: { type: Boolean },
    filterMethod: { type: Function },
    remote: { type: Boolean },
    remoteMethod: { type: Function },
    debounce: { type: Number, default: 300 },
    noMatchText: { type: String },
    noDataText: { type: String },
  },
  className: () => 'ui-select--filterable'
})
