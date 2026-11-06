import type { PropType, Ref, VNodeRef } from 'vue'
import { defineComponent, h, inject, onBeforeUpdate, provide, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { mergeFeatureProps } from '../../shared/feature'
import './core.css'

type Orientation = 'horizontal' | 'vertical'
type Direction = 'ltr' | 'rtl'

interface RovingFocusContext {
  currentTabStopId: Ref<string | null>
  registerItem: (id: string, element: HTMLElement) => void
  unregisterItem: (id: string) => void
  ensureTabStop: () => void
  releaseTabStop: (id: string) => void
  itemFocus: (id: string, event: FocusEvent) => void
  itemBlur: (id: string, event: FocusEvent) => void
  keydown: (event: KeyboardEvent) => void
}

const rovingFocusGroupKey = Symbol('uiRovingFocusGroup')
let itemSeed = 0

const rovingFocusGroupBaseProps = {
  currentTabStopId: { type: String as PropType<string | null>, default: null },
  orientation: { type: String as PropType<Orientation> },
  dir: { type: String as PropType<Direction> },
  loop: Boolean
}

const rovingFocusItemBaseProps = {
  tabStopId: { type: String, default: '' },
  focusable: { type: Boolean, default: true },
  active: Boolean
}

export function createRovingFocusGroup(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiRovingFocusGroup',
    inheritAttrs: false,
    props: { ...rovingFocusGroupBaseProps, ...mergeFeatureProps(features) },
    emits: ['update:currentTabStopId', 'itemFocus', 'itemBlur'],
    setup(props, { attrs, slots, emit }) {
      const currentTabStopId = ref<string | null>(props.currentTabStopId)
      const elements = new Map<string, HTMLElement>()

      watch(
        () => props.currentTabStopId,
        (value) => {
          currentTabStopId.value = value
        }
      )

      function setCurrentTabStopId(id: string | null) {
        currentTabStopId.value = id
        emit('update:currentTabStopId', id)
      }

      function orderedItems() {
        return [...elements.entries()].sort(([, left], [, right]) =>
          left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
        )
      }

      // focusable=false 的项没有 tabindex，element.focus() 对它是空操作。
      // 漫游候选必须只挑有 tabindex 的项，否则 tab stop 会落到一个根本拿不到焦点的元素上
      function focusableItems() {
        return orderedItems().filter(([, element]) => element.hasAttribute('tabindex'))
      }

      function moveFocus(fromId: string, step: 1 | -1) {
        const items = focusableItems()
        if (!items.length) {
          return
        }
        const currentIndex = items.findIndex(([id]) => id === fromId)
        if (currentIndex < 0) {
          return
        }
        let nextIndex = currentIndex + step
        if (props.loop) {
          nextIndex = (nextIndex + items.length) % items.length
        }
        const target = items[nextIndex]
        if (!target) {
          return
        }
        const [id, element] = target
        element.focus({ preventScroll: true })
        setCurrentTabStopId(id)
        emit('itemFocus', id)
      }

      function keydown(event: KeyboardEvent) {
        const active = document.activeElement as HTMLElement | null
        if (!active) {
          return
        }
        const entry = orderedItems().find(([, element]) => element === active || element.contains(active))
        if (!entry) {
          return
        }
        const [id] = entry
        const orientation = props.orientation ?? 'horizontal'
        const dir = props.dir ?? 'ltr'
        const forwardKey = orientation === 'vertical' ? 'ArrowDown' : dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
        const backwardKey = orientation === 'vertical' ? 'ArrowUp' : dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'

        if (event.key === forwardKey) {
          event.preventDefault()
          moveFocus(id, 1)
          return
        }
        if (event.key === backwardKey) {
          event.preventDefault()
          moveFocus(id, -1)
          return
        }
        if (event.key === 'Home' || event.key === 'End') {
          const items = focusableItems()
          if (!items.length) {
            return
          }
          event.preventDefault()
          const [targetId, element] = event.key === 'Home' ? items[0] : items[items.length - 1]
          element.focus({ preventScroll: true })
          setCurrentTabStopId(targetId)
          emit('itemFocus', targetId)
        }
      }

      // 当前停靠点失效（项被卸载，或 focusable 改成 false 后不再写 tabindex）时整组会从 Tab 序里消失，
      // 所以每次项集合或可聚焦状态变化都要兜底重选一个可聚焦项
      function ensureTabStop() {
        const current = currentTabStopId.value
        const element = current ? elements.get(current) : null
        if (element?.hasAttribute('tabindex')) {
          return
        }
        const next = focusableItems()[0]
        setCurrentTabStopId(next ? next[0] : null)
        if (element && element.contains(document.activeElement)) {
          next?.[1].focus({ preventScroll: true })
        }
      }

      // tabindex 一被拿掉浏览器立刻把焦点丢回 body，赶在 patch 前把焦点交给下一个可聚焦项，
      // 否则漫游会因为「当前焦点不在任何项里」而方向键全失灵
      function releaseTabStop(id: string) {
        const target = focusableItems().find(([itemId]) => itemId !== id)
        setCurrentTabStopId(target ? target[0] : null)
        target?.[1].focus({ preventScroll: true })
      }

      const context: RovingFocusContext = {
        currentTabStopId,
        registerItem(id, element) {
          elements.set(id, element)
          // 初始 tab stop 只能给能聚焦的项：不可聚焦项先注册时不能把整组带进死胡同
          if (!currentTabStopId.value && element.hasAttribute('tabindex')) {
            currentTabStopId.value = id
          }
        },
        unregisterItem(id) {
          elements.delete(id)
          ensureTabStop()
        },
        ensureTabStop,
        releaseTabStop,
        itemFocus(id, event) {
          setCurrentTabStopId(id)
          emit('itemFocus', id, event)
        },
        itemBlur(id, event) {
          emit('itemBlur', id, event)
        },
        keydown
      }

      provide(rovingFocusGroupKey, context)

      return () =>
        h(
          'div',
          {
            ...attrs,
            class: [attrs.class, 'ui-roving-focus-group'],
            onKeydown: keydown
          },
          slots.default?.() ?? []
        )
    }
  })
}

export function createRovingFocusItem(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiRovingFocusItem',
    inheritAttrs: false,
    props: { ...rovingFocusItemBaseProps, ...mergeFeatureProps(features) },
    setup(props, { attrs, slots }) {
      const itemId = props.tabStopId || `ui-roving-focus-item-${itemSeed++}`
      const context = inject<RovingFocusContext | null>(rovingFocusGroupKey, null)
      const isTabStop = () => props.active || context?.currentTabStopId.value === itemId
      const elementRef = ref<HTMLElement | null>(null)

      // pre 阶段 DOM 还是旧的：元素上还挂着 tabindex、焦点也还在里面，这是移交焦点的最后时机。
      // 用旧属性判断「本轮之前是否可聚焦」，避免只因为焦点落在子节点里就被反复抢走
      onBeforeUpdate(() => {
        const element = elementRef.value
        if (
          !context ||
          props.focusable ||
          !element?.hasAttribute('tabindex') ||
          !element.contains(document.activeElement)
        ) {
          return
        }
        context.releaseTabStop(itemId)
      })

      // DOM 的 tabindex 在本次更新 patch 完才变，等渲染结束再兜底，否则读到的还是旧属性
      if (context) {
        watch(
          () => props.focusable,
          () => context.ensureTabStop(),
          { flush: 'post' }
        )
      }

      function handleFocus(event: FocusEvent) {
        context?.itemFocus(itemId, event)
      }

      function handleBlur(event: FocusEvent) {
        context?.itemBlur(itemId, event)
      }

      const setElement: VNodeRef = (element) => {
        elementRef.value = element instanceof HTMLElement ? element : null
        if (!context) {
          return
        }
        if (element instanceof HTMLElement) {
          context.registerItem(itemId, element)
        } else {
          context.unregisterItem(itemId)
        }
      }

      return () =>
        h(
          'div',
          {
            ...attrs,
            ref: setElement,
            tabindex: props.focusable ? (isTabStop() ? 0 : -1) : undefined,
            'data-roving-focus-item': itemId,
            class: [
              attrs.class,
              'ui-roving-focus-item',
              {
                'is-active': isTabStop(),
                'is-focusable': props.focusable
              }
            ],
            onFocusin: handleFocus,
            onBlur: handleBlur
          },
          slots.default?.() ?? []
        )
    }
  })
}
