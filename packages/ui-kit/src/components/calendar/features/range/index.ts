import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const calendarRangeFeature = createClassFeature({
  id: 'calendar.range',
  props: {
    range: { type: Array }
  },
  className: (props) => (Array.isArray(props.range) && props.range.length > 0 ? 'ui-calendar--range' : undefined)
})
