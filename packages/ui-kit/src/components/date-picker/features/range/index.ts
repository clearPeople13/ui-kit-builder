import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const datePickerRangeFeature = createClassFeature({
  id: 'date-picker.range',
  props: {
    rangeSeparator: { type: String, default: '-' },
    startPlaceholder: { type: String },
    endPlaceholder: { type: String },
    unlinkPanels: { type: Boolean },
    showWeekNumber: { type: Boolean }
  },
  className: (props) =>
    Boolean(props.isRange) || String(props.type || 'date').endsWith('range') ? 'ui-date-picker--range' : undefined
})
