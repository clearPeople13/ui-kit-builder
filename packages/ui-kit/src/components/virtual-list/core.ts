import type { CSSProperties, VNodeChild } from 'vue'
import { computed, h, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { alignVirtualScrollTop, computeVirtualRange, resolveVirtualViewport } from '../../shared/virtual-window'
import './core.css'

const virtualListBaseProps = {
  data: { type: Array as () => any[], default: () => [] },
  height: { type: Number, default: 200 },
  itemSize: { type: Number, default: 30 },
  estimatedItemSize: { type: Number, default: 0 },
  itemKey: { type: String, default: '' },
  cache: { type: Number, default: 2 },
  total: { type: Number, default: 0 },
  /**
   * 受控窗口模式（§25）：传了 scrollTop 就由调用方维护滚动位置，本组件不再监听自身滚动。
   * Select 这类「外层浮层是滚动容器」的场景靠它复用同一套窗口算法与渲染结构。
   */
  scrollTop: { type: Number, default: undefined },
  /** 受控窗口模式下的可视高度；不传则退回 height */
  viewportHeight: { type: Number, default: 0 },
  /** false 时不渲染自己的滚动容器（不设高度与 overflow、不监听 scroll），只输出窗口内容 */
  scrollable: { type: Boolean, default: true }
}

function renderItemContent(
  slots: Record<string, ((...args: any[]) => VNodeChild) | undefined>,
  item: unknown,
  index: number
) {
  if (slots.default) {
    return [slots.default({ item, index })]
  }
  if (item && typeof item === 'object' && 'label' in item) {
    return [String((item as any).label)]
  }
  return [String(item ?? '')]
}

export function createVirtualList(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiVirtualList',
      baseClass: 'ui-virtual-list',
      props: virtualListBaseProps,
      setup(props, { root }) {
        const rootRef = root
        const innerScrollTop = ref(0)

        // 受控优先：调用方的 scrollTop 存在时以它为准，避免两份状态互相覆盖
        const controlled = computed(() => typeof props.scrollTop === 'number')
        const effectiveScrollTop = computed(() => (controlled.value ? Number(props.scrollTop) : innerScrollTop.value))
        const itemCount = computed(() => (props.total > 0 ? props.total : props.data.length))
        const viewport = computed(() =>
          props.viewportHeight > 0 ? resolveVirtualViewport(props.viewportHeight) : resolveVirtualViewport(props.height)
        )
        const range = computed(() =>
          computeVirtualRange({
            scrollTop: effectiveScrollTop.value,
            viewport: viewport.value,
            itemSize: props.itemSize,
            total: itemCount.value,
            overscan: props.cache,
            fallbackItemSize: props.estimatedItemSize
          })
        )

        function applyScroll(top: number) {
          const next = Math.max(0, Number(top) || 0)
          if (rootRef.value) {
            rootRef.value.scrollTop = next
          }
          if (!controlled.value) {
            innerScrollTop.value = next
          }
        }

        function handleScroll(event: Event) {
          // 受控模式下滚动位置由调用方写入，这里不回写自己的状态
          if (!controlled.value) {
            innerScrollTop.value = (event.target as HTMLElement).scrollTop
          }
        }

        return {
          range,
          handleScroll,
          api: {
            scrollToTop: () => applyScroll(0),
            scrollToIndex: (index: number) =>
              applyScroll(
                alignVirtualScrollTop(
                  index,
                  effectiveScrollTop.value,
                  range.value.itemSize,
                  viewport.value,
                  itemCount.value
                )
              )
          }
        }
      },
      attrs: (props, state) => ({ onScroll: props.scrollable ? state.handleScroll : undefined }),
      classes: (props) => [props.scrollable ? '' : 'is-static'],
      styles: (props) =>
        props.scrollable
          ? ({
              height: `${props.height}px`,
              overflowY: 'auto',
              overflowX: 'hidden',
              position: 'relative'
            } as CSSProperties)
          : ({ position: 'relative' } as CSSProperties),
      content: ({ props, slots, state }) => {
        const { start, end, itemSize, totalSize } = state.range.value as {
          start: number
          end: number
          itemSize: number
          totalSize: number
        }
        const items: VNodeChild[] = []
        for (let index = start; index < end; index++) {
          const item = props.data[index]
          // 占位行仅在未提供默认插槽时兜底展示；插槽场景把 item=undefined 交给消费方自行渲染骨架
          const showPlaceholder = index >= props.data.length && !slots.default
          const key =
            props.itemKey && item && typeof item === 'object' ? (item as Record<string, any>)[props.itemKey] : index
          items.push(
            h(
              'div',
              {
                key: key ?? index,
                class: ['ui-virtual-list__item', showPlaceholder ? 'is-placeholder' : ''],
                style: {
                  position: 'absolute',
                  top: `${index * itemSize}px`,
                  left: '0',
                  right: '0',
                  height: `${itemSize}px`
                } as CSSProperties
              },
              showPlaceholder ? ['加载中…'] : renderItemContent(slots, item, index)
            )
          )
        }

        return h(
          'div',
          {
            class: 'ui-virtual-list__spacer',
            style: { height: `${totalSize}px`, position: 'relative' }
          },
          items
        )
      },
      expose: ({ state }) => state.api
    },
    features
  )
}
