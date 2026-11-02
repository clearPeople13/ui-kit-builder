import { createClassFeature } from '../../../../shared/component'

export const selectV2FilterableFeature = createClassFeature({
  id: 'select-v2.filterable',
  props: {
    filterable: Boolean,
    filterMethod: Function,
    remote: Boolean,
    remoteMethod: Function,
    loading: Boolean,
    loadingText: { type: String, default: '加载中' },
    noMatchText: { type: String, default: '无匹配数据' },
    noDataText: { type: String, default: '无数据' }
  },
  className: (props) => (props.filterable ? 'is-filterable' : undefined)
})
