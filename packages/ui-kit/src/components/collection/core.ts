import type { PropType, Ref } from 'vue'
import { defineComponent, h, inject, onBeforeUnmount, provide, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { mergeFeatureProps } from '../../shared/feature'
import './core.css'

interface CollectionContext {
  itemRefs: Map<unknown, Ref<HTMLElement | null>>
  getItem: (item: unknown) => HTMLElement | null
}

const collectionKey = Symbol('uiCollection')

const collectionItemBaseProps = {
  item: { type: Object as PropType<Record<string, any>>, required: true }
}

export function createCollection(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiCollection',
    inheritAttrs: false,
    props: mergeFeatureProps(features),
    setup(_, { slots, expose }) {
      const itemRefs = new Map<unknown, Ref<HTMLElement | null>>()

      function getItem(item: unknown): HTMLElement | null {
        return itemRefs.get(item)?.value ?? null
      }

      const context: CollectionContext = { itemRefs, getItem }
      provide(collectionKey, context)
      expose({ itemRefs, getItem })

      return () => slots.default?.() ?? null
    }
  })
}

export function createCollectionItem(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiCollectionItem',
    inheritAttrs: false,
    props: { ...collectionItemBaseProps, ...mergeFeatureProps(features) },
    setup(props, { slots }) {
      const context = inject<CollectionContext | null>(collectionKey, null)
      const elementRef = ref<HTMLElement | null>(null)
      context?.itemRefs.set(props.item, elementRef)

      onBeforeUnmount(() => {
        context?.itemRefs.delete(props.item)
      })

      return () =>
        h(
          'div',
          {
            ref: elementRef,
            class: 'ui-collection__item',
            style: { display: 'contents' }
          },
          slots.default?.() ?? []
        )
    }
  })
}
