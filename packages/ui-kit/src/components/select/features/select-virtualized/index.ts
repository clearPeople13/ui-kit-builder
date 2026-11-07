import { createClassFeature } from '../../../../shared/component'
import './style.css'

/**
 * 大数据虚拟列表：由已删除的旧虚拟列表选择器合并而来（第十一批 §22 的改造结论）。
 * 特性被裁剪掉时 props 里不会有这几个键，core.ts 用 `props.virtualized === true`
 * 判定，避免「undefined 被当成启用」的布尔归一坑（F-64 同类）。
 */
export const selectVirtualizedFeature = createClassFeature({
  id: 'select.select-virtualized',
  props: {
    virtualized: { type: Boolean, default: true },
    itemSize: { type: Number, default: 34 },
    virtualThreshold: { type: Number, default: 100 }
  },
  // 根节点挂特性类名：样式只在特性被选中时生效，也让构建期能识别该特性的产物标记
  className: (props) => (props.virtualized === false ? undefined : 'ui-select--virtualized')
})
