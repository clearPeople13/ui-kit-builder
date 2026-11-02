import type { CSSProperties, VNodeChild } from 'vue'
import { computed, defineComponent, h, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { mergeFeatureProps } from '../../shared/feature'
import './core.css'

const virtualListBaseProps = {
  data: { type: Array as () => any[], default: () => [] },
  height: { type: Number, default: 200 },
  itemSize: { type: Number, default: 30 },
  estimatedItemSize: { type: Number, default: 0 },
  itemKey: { type: String, default: '' },
  cache: { type: Number, default: 2 },
  total: { type: Number, default: 0 }
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
  return defineComponent({
    name: 'UiVirtualList',
    inheritAttrs: false,
    props: { ...virtualListBaseProps, ...mergeFeatureProps(features) },
    setup(props, { attrs, slots }) {
      const scrollTop = ref(0)

      const itemHeight = computed(() => {
        if (props.itemSize > 0) {
          return props.itemSize
        }
        return props.estimatedItemSize > 0 ? props.estimatedItemSize : 30
      })

      const itemCount = computed(() => (props.total > 0 ? props.total : props.data.length))

      const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - props.cache))

      const endIndex = computed(() =>
        Math.min(itemCount.value, Math.ceil((scrollTop.value + props.height) / itemHeight.value) + props.cache)
      )

      function handleScroll(event: Event) {
        scrollTop.value = (event.target as HTMLElement).scrollTop
      }

      return () => {
        const items: VNodeChild[] = []
        for (let index = startIndex.value; index < endIndex.value; index++) {
          const item = props.data[index]
          const key =
            props.itemKey && item && typeof item === 'object' ? (item as Record<string, any>)[props.itemKey] : index
          items.push(
            h(
              'div',
              {
                key: key ?? index,
                class: 'ui-virtual-list__item',
                style: {
                  position: 'absolute',
                  top: `${index * itemHeight.value}px`,
                  left: '0',
                  right: '0',
                  height: `${itemHeight.value}px`
                } as CSSProperties
              },
              renderItemContent(slots, item, index)
            )
          )
        }

        return h(
          'div',
          {
            ...attrs,
            class: [attrs.class, 'ui-virtual-list'],
            style: {
              ...(attrs.style as CSSProperties),
              height: `${props.height}px`,
              overflowY: 'auto',
              overflowX: 'hidden',
              position: 'relative'
            },
            onScroll: handleScroll
          },
          [
            h(
              'div',
              {
                class: 'ui-virtual-list__spacer',
                style: { height: `${itemCount.value * itemHeight.value}px`, position: 'relative' }
              },
              items
            )
          ]
        )
      }
    }
  })
}
