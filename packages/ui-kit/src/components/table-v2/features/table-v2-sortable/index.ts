import { createClassFeature } from '../../../../shared/component'
import './style.css'

export const tableV2SortableFeature = createClassFeature({
  id: 'table-v2.table-v2-sortable',
  props: {
    sortBy: { type: Object, default: () => ({}) }
  },
  className: (props) =>
    props.sortable || props.sortMethod || props.sortBy || props.sortOrders || props.defaultSort
      ? 'ui-table-v2--sortable'
      : undefined
})
