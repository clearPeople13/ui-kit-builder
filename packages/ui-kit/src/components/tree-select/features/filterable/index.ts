import { createClassFeature } from '../../../../shared/component'

export const treeSelectFilterableFeature = createClassFeature({
  id: 'tree-select.filterable',
  props: {
    filterable: Boolean,
    filterMethod: Function
  },
  className: (props) => (props.filterable ? 'is-filterable' : undefined)
})
