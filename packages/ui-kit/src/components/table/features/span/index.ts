import type { UiFeature } from '../../../../shared/feature'

export const tableSpanFeature: UiFeature = {
  id: 'table.span',
  props: {
    spanMethod: { type: Function }
  },
  setup(props) {
    function tableSpan(scope: Record<string, any>) {
      if (typeof props.spanMethod !== 'function') {
        return null
      }
      return props.spanMethod(scope)
    }

    return {
      hooks: { tableSpan }
    }
  }
}
