import { h } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import './style.css'

export const tableLoadingFeature: UiFeature = {
  id: 'table.loading',
  props: {
    loading: { type: Boolean },
    loadingText: { type: String, default: '' }
  },
  setup(props) {
    function suffix() {
      if (!props.loading) {
        return null
      }
      return h('div', { class: 'ui-table__loading' }, [
        h('span', { class: 'ui-table__loading-spinner', 'aria-hidden': 'true' }),
        props.loadingText ? h('span', { class: 'ui-table__loading-text' }, props.loadingText) : null
      ])
    }

    return {
      class: () => (props.loading ? 'is-loading' : ''),
      suffix
    }
  }
}
