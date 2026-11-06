export const tableSelectionFeature = {
  id: 'table.selection',
  props: {
    selectable: { type: Function },
    showCheckbox: { type: [Boolean, Function], default: true },
    checkStrictly: { type: Boolean, default: false }
  }
}
