import { h, ref } from 'vue'
import type { VNodeChild } from 'vue'
import type { UiFeature, UiFeatureState } from '../../../../shared/feature'
import { computeVirtualRange } from '../../../../shared/virtual-window'
import type { CascaderColumnContext, CascaderColumnWindow } from '../../core'
import './style.css'

const VIRTUAL_THRESHOLD = 40
const OVERSCAN = 4
const MIN_ITEM_SIZE = 16
const DEFAULT_ITEM_SIZE = 34

export const cascaderVirtualizedFeature: UiFeature = {
  id: 'cascader.virtualized',
  props: {
    virtualScroll: { type: Boolean },
    itemSize: { type: Number, default: DEFAULT_ITEM_SIZE }
  },
  setup(props) {
    const scrollTops = ref<Record<number, number>>({})
    const virtualLevels = new Set<number>()

    function enabled(): boolean {
      return props.virtualScroll === true
    }

    function itemSize(): number {
      return Math.max(MIN_ITEM_SIZE, Number(props.itemSize ?? DEFAULT_ITEM_SIZE))
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

    function renderColumn(context: CascaderColumnContext): CascaderColumnWindow | null {
      if (!enabled() || context.column.length <= VIRTUAL_THRESHOLD) {
        virtualLevels.delete(context.level)
        return null
      }
      virtualLevels.add(context.level)
      const size = Math.max(MIN_ITEM_SIZE, Number(context.itemSize ?? itemSize()))
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
              class: 'ui-cascader__row',
              style: { top: `${index * size}px` }
            },
            [context.renderNode(context.column[index], context.level, context.tabStop, size)]
          )
        )
      }
      return {
        children: [
          h('div', { class: 'ui-cascader__window', style: { height: `${context.column.length * size}px` } }, rows)
        ],
        virtual: true
      }
    }

    const state: UiFeatureState = {
      class: () =>
        props.virtualized || props.estimatedItemSize || props.itemSize ? 'ui-cascader--virtualized' : undefined,
      hooks: {
        columnItemSize: itemSize,
        onColumnReset: () => {
          scrollTops.value = {}
        },
        onColumnScroll: ({ level, event }: { level: number; event: Event }) => onColumnScroll(level, event),
        renderColumn
      }
    }
    return state
  }
}
