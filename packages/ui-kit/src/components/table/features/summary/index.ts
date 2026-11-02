export const tableSummaryFeature = {
  id: 'table.summary',
  props: {
    showSummary: { type: Boolean },
    sumText: { type: String, default: 'Sum' },
    summaryMethod: { type: Function }
  },
  setup(props: { showSummary?: boolean; sumText?: string; summaryMethod?: Function }) {
    function tableSummary(columns: Array<Record<string, any>>, rows: any[]) {
      if (!props.showSummary) {
        return null
      }
      if (typeof props.summaryMethod === 'function') {
        return props.summaryMethod({ columns, data: rows })
      }
      return columns.map((column, index) => {
        if (index === 0) {
          return props.sumText ?? 'Sum'
        }
        const total = rows.reduce((sum, row) => {
          const value = Number(row?.[column.prop])
          return Number.isFinite(value) ? sum + value : sum
        }, 0)
        return total || ''
      })
    }

    return {
      hooks: { tableSummary }
    }
  }
}
