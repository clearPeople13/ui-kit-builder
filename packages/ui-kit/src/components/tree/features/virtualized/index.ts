import { h, nextTick, ref } from 'vue'
import type { VNodeChild } from 'vue'
import type { UiFeature, UiFeatureState } from '../../../../shared/feature'
import { alignVirtualScrollTop, computeVirtualRange, resolveVirtualViewport } from '../../../../shared/virtual-window'
import { createVirtualList } from '../../../virtual-list/core'
import type { UiTreeNode } from '../../../../shared/tree'
import './style.css'

/** 上下缓冲行数，与 select.select-virtualized 一致 */
const OVERSCAN = 5
/** 容器未挂载 / happy-dom 环境的兜底可视高度 */
const FALLBACK_VIEWPORT = 274
/** 行高兜底：与 --ui-tree-node-min-height 基线值一致 */
const DEFAULT_ITEM_SIZE = 30

interface TreeWindowContext {
  props: Record<string, any>
  container?: HTMLElement
  nodes: UiTreeNode[]
  extend?: (node: UiTreeNode) => Record<string, any>
  renderNode: (node: UiTreeNode, extend?: (node: UiTreeNode) => Record<string, any>) => VNodeChild
}

/**
 * 大数据虚拟滚动（§44）。
 *
 * 窗口算术只引用 shared/virtual-window，渲染只复用 VirtualList 的受控窗口模式：
 * 滚动容器仍是 Tree 自己的 .ui-tree__nodes（core 出滚动与高度），VirtualList 只输出窗口行。
 * 单行渲染经 core 暴露的 renderNodeRow 回到 core，行结构 / 勾选 / 展开语义只有一种实现。
 * 特性未被 profile 选中时，这些代码与 VirtualList 都不会进产物。
 */
export const treeVirtualizedFeature: UiFeature = {
  id: 'tree.virtualized',
  props: {
    virtualized: { type: Boolean, default: true },
    itemSize: { type: Number, default: DEFAULT_ITEM_SIZE },
    virtualThreshold: { type: Number, default: 100 }
  },
  setup(props, { state }) {
    const listScrollTop = ref(0)
    const measuredItemSize = ref(0)

    // 组件只在模块加载时创建一次，避免每次 render 生成新组件类型导致整棵子树重建
    const VirtualTreeList = createVirtualList()

    function enabled(): boolean {
      return props.virtualized === true
    }

    function threshold(): number {
      return Number(props.virtualThreshold ?? 100)
    }

    function shouldVirtualize(nodes: UiTreeNode[]): boolean {
      // 窗口化必须有固定视口（height），否则滚动容器是页面本身，窗口无从谈起
      return enabled() && Boolean(props.height) && nodes.length > threshold()
    }

    function itemSize(): number {
      return Number(measuredItemSize.value) || Number(props.itemSize) || DEFAULT_ITEM_SIZE
    }

    function measureItemSize(container?: HTMLElement) {
      const row = container?.querySelector('.ui-tree__node')
      if (row instanceof HTMLElement && row.offsetHeight > 0) {
        measuredItemSize.value = row.offsetHeight
      }
    }

    function currentRange(container: HTMLElement, total: number) {
      return computeVirtualRange({
        scrollTop: listScrollTop.value,
        viewport: resolveVirtualViewport(container.clientHeight, FALLBACK_VIEWPORT),
        itemSize: itemSize(),
        total,
        overscan: OVERSCAN
      })
    }

    // 窗口化后 DOM 只剩可视切片，core 的键盘聚焦经 focusAdapter 交到这里：
    // 先把目标行滚进视口（同步写 ref，绕开"滚动事件晚于渲染"的竞态），等窗口重渲后再按数据 key 落焦点。
    // 未进入窗口化（低于阈值 / 未设 height）时退回 core 默认的 DOM 顺序聚焦
    function focusAdapter(index: number, visible: UiTreeNode[], container: HTMLElement) {
      if (!shouldVirtualize(visible)) {
        const items = Array.from(container.querySelectorAll<HTMLElement>('.ui-tree__node'))
        items[index]?.focus({ preventScroll: true })
        return
      }
      const size = itemSize()
      const viewport = resolveVirtualViewport(container.clientHeight, FALLBACK_VIEWPORT)
      const next = alignVirtualScrollTop(index, container.scrollTop, size, viewport, visible.length)
      const move = () => {
        const range = currentRange(container, visible.length)
        const rows = Array.from(container.querySelectorAll<HTMLElement>('.ui-tree__node'))
        const target = visible[index]
        const row =
          rows.find((el) => el.getAttribute('data-key') === String(target?.key)) ??
          rows[index - range.start] ??
          rows[rows.length - 1]
        row?.focus({ preventScroll: true })
      }
      if (next !== container.scrollTop) {
        container.scrollTop = next
        listScrollTop.value = next
        nextTick(move)
      } else {
        move()
      }
    }

    const featureState: UiFeatureState = {
      // 根节点挂特性类名：样式只在特性被选中时生效，也让构建期能识别该特性的产物标记
      class: () => (enabled() ? 'ui-tree--virtualized' : undefined),
      hooks: {
        renderNodeWindow: (context: TreeWindowContext) => {
          const { nodes, container, extend, renderNode } = context
          if (!shouldVirtualize(nodes)) {
            return null
          }
          measureItemSize(container)
          return h(
            VirtualTreeList,
            {
              class: 'ui-tree__virtual',
              data: nodes,
              total: nodes.length,
              itemSize: itemSize(),
              cache: OVERSCAN,
              viewportHeight: resolveVirtualViewport(container?.clientHeight, FALLBACK_VIEWPORT),
              scrollTop: listScrollTop.value,
              // 滚动容器仍是 Tree 自己的 .ui-tree__nodes，VirtualList 只负责窗口渲染
              scrollable: false
            },
            {
              // 单行交回 core 渲染，展开/勾选/点击语义与全量模式完全同一出口
              default: ({ item }: { item: UiTreeNode }) => renderNode(item, extend)
            }
          )
        },
        onNodesScroll: ({ event }: { event: Event }) => {
          listScrollTop.value = (event.target as HTMLElement).scrollTop
        }
      }
    }

    // core 在 setup 里先建好 state，特性 setup 后运行，此时挂接键盘焦点适配器
    if (state) {
      state.focusAdapter = focusAdapter
    }

    return featureState
  }
}
