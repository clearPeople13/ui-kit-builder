import type { UiFeature } from '../../../../shared/feature'

export const datePickerPanelRangeFeature: UiFeature = {
  id: 'date-picker-panel.range',
  props: {
    unlinkPanels: { type: Boolean },
    showWeekNumber: { type: Boolean }
  }
}
