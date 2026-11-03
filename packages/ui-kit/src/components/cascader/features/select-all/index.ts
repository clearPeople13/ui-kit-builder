import type { UiFeature } from '../../../../shared/feature'
import './style.css'

export const cascaderSelectAllFeature: UiFeature = {
  id: 'cascader.select-all',
  props: {
    selectAll: { type: Boolean }
  },
  setup(_props, context) {
    const state = context.state as { renderSelectAllBar?: () => unknown }
    return {
      hooks: {
        panelHeader: () => state.renderSelectAllBar?.() ?? null
      }
    }
  }
}
