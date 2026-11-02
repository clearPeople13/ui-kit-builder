import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const calendarRangeFeature = createClassFeature({
  id: 'calendar.range',
  props: {
    range: { type: Array }
  },
  className: () => 'ui-calendar--range'
})
