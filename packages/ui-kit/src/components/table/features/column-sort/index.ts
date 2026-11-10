import type { UiFeature } from '../../../../shared/feature'

export const tableColumnSortFeature: UiFeature = {
  id: 'table.column-sort',
  props: {
    sortable: { type: [Boolean, String], default: false },
    sortMethod: { type: Function },
    sortOrders: { type: Array, default: () => ['ascending', 'descending', null] }
  }
}
