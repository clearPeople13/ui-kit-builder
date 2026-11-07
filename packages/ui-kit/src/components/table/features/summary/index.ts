export const tableSummaryFeature = {
  id: 'table.summary',
  props: {
    showSummary: { type: Boolean },
    sumText: { type: String, default: '合计' },
    summaryMethod: { type: Function }
  },
  setup(props: {
    showSummary?: boolean
    sumText?: string
    summaryMethod?: (payload: { columns: Array<Record<string, any>>; data: any[] }) => unknown
  }) {
    function tableSummary(columns: Array<Record<string, any>>, rows: any[]) {
      if (!props.showSummary) {
        return null
      }
      if (typeof props.summaryMethod === 'function') {
        return props.summaryMethod({ columns, data: rows })
      }
      return columns.map((column, index) => {
        if (index === 0) {
          return props.sumText ?? '合计'
        }
        const values = rows
          .map((row) => row?.[column.prop])
          .filter((value) => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value)))
          .map((value) => Number(value))
        if (!values.length) {
          return ''
        }
        return values.reduce((sum, value) => sum + value, 0)
      })
    }

    return {
      hooks: { tableSummary }
    }
  }
}
