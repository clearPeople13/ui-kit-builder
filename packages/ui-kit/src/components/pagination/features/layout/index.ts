import type { UiFeature } from '../../../../shared/feature'
import './style.css'

export const paginationLayoutFeature: UiFeature = {
  id: 'pagination.layout',
  props: {
    layout: { type: String, default: 'prev, pager, next' },
    pageSizes: { type: Array, default: () => [10, 20, 30, 40, 50, 100] }
  }
}
