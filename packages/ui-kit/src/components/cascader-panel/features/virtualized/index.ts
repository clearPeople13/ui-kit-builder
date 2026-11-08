import { h, ref } from 'vue'
import type { VNodeChild } from 'vue'
import type { UiFeature, UiFeatureState } from '../../../../shared/feature'
import { computeVirtualRange } from '../../../../shared/virtual-window'
import type { CascaderPanelColumnContext, CascaderPanelColumnWindow } from '../../core'
import './style.css'

const VIRTUAL_THRESHOLD = 40
const OVERSCAN = 4
const DEFAULT_ITEM_SIZE = 34

export const cascaderPanelVirtualizedFeature: UiFeature = {
  id: 'cascader-panel.virtualized',
  props: {
    itemSize: { type: Number, default: DEFAULT_ITEM_SIZE }
  },
  setup(props) {
    const scrollTops = ref<Record<number, number>>({})
    const virtualLevels = new Set<number>()

    function itemSize(): number {
      return Number(props.itemSize ?? 0)
    }

    function onColumnScroll(level: number, event: Event): void {
      if (!virtualLevels.has(level)) {
        return
      }
      const top = (event.target as HTMLElement).scrollTop
      if ((scrollTops.value[level] ?? 0) === top) {
        return
      }
      scrollTops.value = { ...scrollTops.value, [level]: top }
    }

    function renderColumn(context: CascaderPanelColumnContext): CascaderPanelColumnWindow | null {
      const size = Number(context.itemSize ?? itemSize())
      if (size <= 0 || context.column.length <= VIRTUAL_THRESHOLD) {
        virtualLevels.delete(context.level)
        return null
      }
      virtualLevels.add(context.level)
      const range = computeVirtualRange({
        scrollTop: scrollTops.value[context.level] ?? 0,
        viewport: context.height,
        itemSize: size,
        total: context.column.length,
        overscan: OVERSCAN
      })
      const rows: VNodeChild[] = []
      for (let index = range.start; index < range.end; index += 1) {
        rows.push(
          h(
            'div',
            {
              key: `row-${context.level}-${index}`,
              class: 'ui-cascader-panel__row',
              style: { top: `${index * size}px` }
            },
            [context.renderNode(context.column[index], context.level, context.tabStop, size)]
          )
        )
      }
      return {
        children: [
          h('div', { class: 'ui-cascader-panel__window', style: { height: `${context.column.length * size}px` } }, rows)
        ],
        virtual: true
      }
    }

    const state: UiFeatureState = {
      class: () =>
        props.virtualized || props.estimatedItemSize || props.itemSize ? 'ui-cascader-panel--virtualized' : undefined,
      hooks: {
        columnItemSize: itemSize,
        onColumnScroll: ({ level, event }: { level: number; event: Event }) => onColumnScroll(level, event),
        renderColumn
      }
    }
    return state
  }
}
