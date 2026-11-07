import { h, ref } from 'vue'
import type { UiFeature, UiFeatureState } from '../../../../shared/feature'
import { alignVirtualScrollTop, resolveVirtualViewport } from '../../../../shared/virtual-window'
import { createVirtualList } from '../../../virtual-list/core'
import type { SelectOption, SelectOptionListContext } from '../../core'
import './style.css'

/** 上下缓冲行数，与改造前一致 */
const OVERSCAN = 5
/** 面板未挂载时的兜底可视高度，与改造前一致 */
const FALLBACK_VIEWPORT = 274

interface SelectListHookPayload {
  panel?: HTMLElement | null
  list?: SelectOption[]
}

interface SelectActiveHookPayload extends SelectListHookPayload {
  index?: number
}

/**
 * 大数据虚拟列表（§25 重构）。
 *
 * 改造前窗口算术写在 `select/core.ts` 里：不开特性也照样打包，`sizes.json` 里
 * `select.select-virtualized` 的边际值只有 441B（仅 props + 类名），"开了才打包"名不副实；
 * 同时窗口逻辑与 `cascader` / `cascader-panel` / `virtual-list` 各写一套，overscan 与边界 clamp 全不一样。
 *
 * 现在收敛为：算法只留 `shared/virtual-window.ts`，渲染只留 `virtual-list` 组件，
 * Select 侧全部逻辑落在本特性里 —— 特性没被选中时这些代码和 VirtualList 都不会进产物。
 */
export const selectVirtualizedFeature: UiFeature = {
  id: 'select.select-virtualized',
  props: {
    virtualized: { type: Boolean, default: true },
    itemSize: { type: Number, default: 34 },
    virtualThreshold: { type: Number, default: 100 }
  },
  setup(props) {
    // 滚动位置与实测行高由特性自己维护，core 不再持有任何虚拟状态
    const listScrollTop = ref(0)
    const measuredItemSize = ref(0)

    function enabled(): boolean {
      return props.virtualized === true
    }

    function itemSize(): number {
      return Number(measuredItemSize.value) || Number(props.itemSize) || 0
    }

    function threshold(): number {
      return Number(props.virtualThreshold ?? 100)
    }

    function shouldVirtualize(list: SelectOption[]): boolean {
      // 分组行的行高与普通选项不同，窗口算法按固定行高算会错位，保持改造前的回退口径
      return enabled() && list.length > threshold() && !list.some((option) => option.group)
    }

    function resetScroll(panel?: HTMLElement | null) {
      listScrollTop.value = 0
      if (panel) {
        panel.scrollTop = 0
      }
    }

    function measureItemSize(panel?: HTMLElement | null) {
      const option = panel?.querySelector('.ui-select__option')
      if (option instanceof HTMLElement && option.offsetHeight > 0) {
        measuredItemSize.value = option.offsetHeight
      }
    }

    // 组件只在模块加载时创建一次，避免每次 render 生成新组件类型导致整棵子树重建
    const VirtualList = createVirtualList()

    const state: UiFeatureState = {
      // 根节点挂特性类名：样式只在特性被选中时生效，也让构建期能识别该特性的产物标记
      class: () => (props.virtualized === false ? undefined : 'ui-select--virtualized'),
      hooks: {
        onListOpen: ({ panel, list }: SelectListHookPayload) => {
          resetScroll(panel)
          if (list && shouldVirtualize(list)) {
            measureItemSize(panel)
          }
        },
        onListClose: ({ panel }: SelectListHookPayload) => resetScroll(panel),
        onListReset: ({ panel }: SelectListHookPayload) => resetScroll(panel),
        onListScroll: ({ panel }: SelectListHookPayload & { event?: Event }) => {
          if (panel) {
            listScrollTop.value = panel.scrollTop
          }
        },
        onActiveChange: ({ index, panel, list }: SelectActiveHookPayload) => {
          if (!panel || !list || index === undefined || index < 0 || !shouldVirtualize(list)) {
            return
          }
          const viewport = resolveVirtualViewport(panel.clientHeight, FALLBACK_VIEWPORT)
          const next = alignVirtualScrollTop(index, listScrollTop.value, itemSize(), viewport, list.length)
          if (next !== listScrollTop.value) {
            listScrollTop.value = next
            panel.scrollTop = next
          }
        },
        renderOptionList: (context: SelectOptionListContext) => {
          const { list } = context
          if (!shouldVirtualize(list)) {
            return null
          }
          const size = itemSize()
          const viewport = resolveVirtualViewport(context.viewport, FALLBACK_VIEWPORT)
          return h(
            VirtualList,
            {
              class: 'ui-select__virtual',
              data: list,
              total: list.length,
              itemSize: size,
              cache: OVERSCAN,
              viewportHeight: viewport,
              scrollTop: listScrollTop.value,
              // 滚动容器仍是 Select 自己的浮层面板，VirtualList 只负责窗口渲染
              scrollable: false
            },
            {
              // 单行仍交给 core 渲染，保证 role=option / aria-selected / 悬停高亮 / 点击选择语义不变
              default: ({ item, index }: { item: SelectOption; index: number }) => context.renderOption(item, index)
            }
          )
        }
      }
    }
    return state
  }
}
