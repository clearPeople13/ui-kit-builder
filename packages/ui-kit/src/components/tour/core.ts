import type { CSSProperties, VNodeChild } from 'vue'
import {
  computed,
  h,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch
} from 'vue'
import { X } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { wrapperConfig } from '../../shared/behavior'
import { tourClosableFeature } from './features/closable/index'
import { tourPopperFeature } from './features/popper/index'
import { tourValidateFeature } from './features/validate/index'
import { tourModalFeature } from './features/modal/index'
import { tourStepClosableFeature } from './features/tour-step-closable/index'
import { tourStepPopperFeature } from './features/tour-step-popper/index'
import { tourStepValidateFeature } from './features/tour-step-validate/index'
import './core.css'

interface TourStepRecord {
  id: number
  props: Record<string, any>
  slots: Record<string, ((...args: any[]) => VNodeChild) | undefined>
}

interface TourContext {
  registerStep: (step: TourStepRecord) => void
  unregisterStep: (id: number) => void
}

interface TourRect {
  top: number
  left: number
  width: number
  height: number
  bottom: number
  right: number
}

const TOUR_CONTEXT = Symbol('ui-tour')
let stepSeed = 0

const tourBaseProps = {
  modelValue: { type: Boolean },
  type: { type: String },
  zIndex: { type: Number },
  current: { type: Number },
  contentStyle: { type: Object },
  mask: { type: [Boolean, Object], default: true },
  gap: { type: Object, default: () => ({}) }
}

function resolveTargetElement(target: unknown): HTMLElement | null {
  if (!target) {
    return null
  }
  if (typeof target === 'string') {
    const element = document.querySelector(target)
    return element instanceof HTMLElement ? element : null
  }
  if (typeof target === 'function') {
    return resolveTargetElement(target())
  }
  if (target instanceof HTMLElement) {
    return target
  }
  if (typeof target === 'object' && 'value' in (target as Record<string, any>)) {
    return resolveTargetElement((target as Record<string, any>).value)
  }
  return null
}

function gapPadding(value: unknown): { x: number; y: number } {
  if (typeof value === 'number') {
    return { x: value, y: value }
  }
  if (Array.isArray(value)) {
    return { x: Number(value[1] ?? value[0]) || 0, y: Number(value[0]) || 0 }
  }
  return { x: 0, y: 0 }
}

function isTourStepVNode(vnode: any): boolean {
  const type = vnode?.type
  return Boolean(type && (type.name === 'UiTourStep' || type.__name === 'UiTourStep'))
}

function flattenVNodes(nodes: any, out: any[] = []): any[] {
  if (Array.isArray(nodes)) {
    nodes.forEach((node) => flattenVNodes(node, out))
    return out
  }
  if (nodes) {
    out.push(nodes)
  }
  return out
}

export function createTour(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTour',
      baseClass: 'ui-tour',
      props: tourBaseProps,
      setup(props, { emit }) {
        const steps = shallowRef<TourStepRecord[]>([])
        const currentIndex = ref(0)
        const rect = ref<TourRect | null>(null)
        let frame = 0

        const visible = computed(() => props.modelValue === true)
        const activeStep = computed<TourStepRecord | null>(() => steps.value[currentIndex.value] ?? null)
        const stepsCount = computed(() => steps.value.length)

        function clampIndex(value: number): number {
          if (!steps.value.length) {
            return 0
          }
          return Math.min(Math.max(0, value), steps.value.length - 1)
        }

        function registerStep(step: TourStepRecord) {
          if (steps.value.some((item) => item.id === step.id)) {
            return
          }
          steps.value = [...steps.value, step]
          const initial = typeof props.current === 'number' ? props.current : currentIndex.value
          currentIndex.value = clampIndex(initial)
          nextTick(() => measure(true))
        }

        function unregisterStep(id: number) {
          steps.value = steps.value.filter((item) => item.id !== id)
          currentIndex.value = clampIndex(currentIndex.value)
          rect.value = null
        }

        provide<TourContext>(TOUR_CONTEXT, { registerStep, unregisterStep })

        function measure(withScroll: boolean) {
          frame = 0
          const step = activeStep.value
          if (!visible.value || !step) {
            rect.value = null
            return
          }
          const element = resolveTargetElement(step.props.target)
          if (!element) {
            rect.value = null
            return
          }
          const options = step.props.scrollIntoViewOptions ?? props.scrollIntoViewOptions
          if (withScroll && step.props.target && options !== false && options !== undefined) {
            element.scrollIntoView(
              typeof options === 'object' ? { block: 'center', inline: 'nearest', ...options } : { block: 'center', inline: 'nearest' }
            )
          }
          const box = element.getBoundingClientRect()
          rect.value = {
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            bottom: box.bottom,
            right: box.right
          }
        }

        function schedule(scroll: boolean) {
          if (frame) {
            return
          }
          frame = requestAnimationFrame(() => measure(scroll))
        }

        function handleScroll() {
          if (visible.value) {
            schedule(false)
          }
        }

        function handleKeydown(event: KeyboardEvent) {
          if (event.key !== 'Escape' || !visible.value || props.closeOnPressEscape !== true) {
            return
          }
          event.preventDefault()
          emit('update:modelValue', false)
          emit('close')
        }

        onMounted(() => {
          window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
          window.addEventListener('resize', handleScroll)
          window.addEventListener('keydown', handleKeydown)
        })

        onBeforeUnmount(() => {
          window.removeEventListener('scroll', handleScroll, { capture: true })
          window.removeEventListener('resize', handleScroll)
          window.removeEventListener('keydown', handleKeydown)
          if (frame) {
            cancelAnimationFrame(frame)
            frame = 0
          }
        })

        watch(visible, (value) => {
          if (value) {
            currentIndex.value = clampIndex(Number(props.current) || 0)
            nextTick(() => measure(true))
            return
          }
          rect.value = null
        })

        watch(
          () => props.current,
          (value) => {
            if (typeof value !== 'number' || !visible.value) {
              return
            }
            currentIndex.value = clampIndex(value)
            nextTick(() => measure(true))
          }
        )

        watch(
          () => [currentIndex.value, stepsCount.value],
          () => {
            if (visible.value) {
              nextTick(() => measure(true))
            }
          }
        )

        function close() {
          emit('update:modelValue', false)
          emit('close')
        }

        function finish() {
          emit('update:modelValue', false)
          emit('close')
          emit('finish')
        }

        function goTo(index: number) {
          const next = clampIndex(index)
          if (next === currentIndex.value) {
            return
          }
          currentIndex.value = next
          emit('update:current', next)
          emit('change', next)
        }

        function next() {
          if (currentIndex.value < stepsCount.value - 1) {
            goTo(currentIndex.value + 1)
            return
          }
          finish()
        }

        function prev() {
          goTo(currentIndex.value - 1)
        }

        const placement = computed(() =>
          String(activeStep.value?.props.placement || props.placement || 'bottom')
        )

        const variant = computed(() =>
          String(activeStep.value?.props.type || props.type || 'default')
        )

        const panelStyle = computed<CSSProperties>(() => {
          const style: Record<string, any> = {
            ...(props.contentStyle || {}),
            ...(activeStep.value?.props.contentStyle || {})
          }
          const box = rect.value
          if (!box) {
            style.position = 'fixed'
            style.left = '50%'
            style.top = '50%'
            style.transform = 'translate(-50%, -50%)'
            return style
          }
          const offset = Number(props.offset ?? 10)
          const centerX = box.left + box.width / 2
          const centerY = box.top + box.height / 2
          style.position = 'fixed'
          if (placement.value === 'top') {
            style.left = `${centerX}px`
            style.top = `${box.top - offset}px`
            style.transform = 'translate(-50%, -100%)'
          } else if (placement.value === 'left') {
            style.left = `${box.left - offset}px`
            style.top = `${centerY}px`
            style.transform = 'translate(-100%, -50%)'
          } else if (placement.value === 'right') {
            style.left = `${box.right + offset}px`
            style.top = `${centerY}px`
            style.transform = 'translateY(-50%)'
          } else {
            style.left = `${centerX}px`
            style.top = `${box.bottom + offset}px`
            style.transform = 'translateX(-50%)'
          }
          return style
        })

        const maskVisible = computed(() => {
          if (props.mask === false) {
            return false
          }
          const step = activeStep.value
          return !step || step.props.mask !== false
        })

        const highlightStyle = computed<CSSProperties | null>(() => {
          const box = rect.value
          if (!box) {
            return null
          }
          const gap = props.gap && typeof props.gap === 'object' ? props.gap : {}
          const padding = gapPadding(gap.padding)
          const spread = Number(gap.offset) || 0
          const maskColor =
            props.mask && typeof props.mask === 'object' && props.mask.color
              ? String(props.mask.color)
              : 'rgba(15, 23, 42, 0.55)'
          const style: CSSProperties = {
            position: 'fixed',
            top: `${box.top - padding.y - spread}px`,
            left: `${box.left - padding.x - spread}px`,
            width: `${box.width + (padding.x + spread) * 2}px`,
            height: `${box.height + (padding.y + spread) * 2}px`,
            borderRadius: `${Number(gap.radius ?? 4)}px`,
            pointerEvents: 'none'
          }
          if (maskVisible.value) {
            style.boxShadow = `0 0 0 9999px ${maskColor}`
          } else {
            style.outline = '2px dashed var(--ui-color-primary, #409eff)'
          }
          return style
        })

        function renderHeader(step: TourStepRecord | null, slots: Record<string, any>): VNodeChild {
          const title = step?.props.title
          const stepClose = step?.props.showClose
          const mergedClose = stepClose !== undefined ? stepClose : props.showClose
          const showClose =
            mergedClose !== false && (mergedClose !== undefined || props.closeIcon !== undefined)
          if (!title && !slots.header && !showClose) {
            return null
          }
          return h('header', { class: 'ui-tour__panel__header' }, [
            h('span', { class: 'ui-tour__panel__title' }, slots.header?.() ?? title),
            showClose
              ? h(
                  'button',
                  {
                    class: 'ui-tour__panel__close',
                    type: 'button',
                    'aria-label': '关闭引导',
                    onClick: close
                  },
                  [renderIcon(step?.props.closeIcon || props.closeIcon || X)]
                )
              : null
          ])
        }

        function renderFooter(step: TourStepRecord | null, slots: Record<string, any>): VNodeChild {
          if (!step) {
            return slots.footer ? h('footer', { class: 'ui-tour__panel__footer' }, [slots.footer()]) : null
          }
          if (step.slots.footer) {
            return h('footer', { class: 'ui-tour__panel__footer' }, [step.slots.footer()])
          }
          return h('footer', { class: 'ui-tour__panel__footer' }, [
            h('span', { class: 'ui-tour__progress' }, `${currentIndex.value + 1} / ${stepsCount.value}`),
            h('div', { class: 'ui-tour__actions' }, [
              currentIndex.value > 0
                ? h(
                    'button',
                    {
                      class: 'ui-tour__action',
                      type: 'button',
                      onClick: prev
                    },
                    '上一步'
                  )
                : null,
              h(
                'button',
                {
                  class: 'ui-tour__action is-primary',
                  type: 'button',
                  onClick: next
                },
                currentIndex.value < stepsCount.value - 1 ? '下一步' : '完成'
              )
            ])
          ])
        }

        function renderPanel(
          step: TourStepRecord | null,
          slotContent: VNodeChild,
          slots: Record<string, any>
        ): VNodeChild {
          const body = step ? (step.slots.default?.() ?? step.props.description ?? null) : slotContent
          return h(
            'section',
            {
              class: ['ui-tour__panel', `is-placement-${placement.value}`, `is-type-${variant.value}`],
              style: panelStyle.value,
              role: 'dialog'
            },
            [
              renderHeader(step, slots),
              h('div', { class: 'ui-tour__panel__body' }, [body]),
              renderFooter(step, slots),
              rect.value && (step?.props.showArrow ?? props.showArrow) !== false
                ? h('span', { class: 'ui-tour__arrow', 'aria-hidden': 'true' })
                : null
            ]
          )
        }

        return {
          get visible() {
            return visible.value
          },
          renderContent(slotContent: VNodeChild, slots: Record<string, any>, hasSteps: boolean): VNodeChild[] {
            const step = activeStep.value
            const panel = hasSteps && !step ? null : renderPanel(step, slotContent, slots)
            const nodes: VNodeChild[] = []
            if (highlightStyle.value) {
              nodes.push(h('div', { class: 'ui-tour__highlight', style: highlightStyle.value }))
            } else if (maskVisible.value) {
              nodes.push(h('div', { class: 'ui-tour__mask' }))
            }
            if (panel) {
              nodes.push(panel)
            }
            return nodes
          }
        }
      },
      classes: (props, state) => [
        props.type ? `ui-tour--${props.type}` : '',
        state.visible ? '' : 'is-hidden'
      ],
      styles: (props) => (props.zIndex ? { zIndex: Number(props.zIndex) } : {}),
      teleport: (props) => {
        if (props.modelValue !== true || !props.appendTo) {
          return undefined
        }
        return typeof props.appendTo === 'object' && 'value' in props.appendTo ? props.appendTo.value : props.appendTo
      },
      content: ({ slots, state }) => {
        const slotContent = slots.default?.() ?? null
        const hasSteps = flattenVNodes(slotContent).some(isTourStepVNode)
        const panel = state.renderContent(slotContent, slots, hasSteps) as VNodeChild[]
        const nodes: VNodeChild[] = []
        if (hasSteps) {
          nodes.push(h('div', { class: 'ui-tour__steps', style: { display: 'none' } }, [slotContent]))
        }
        nodes.push(...panel)
        return nodes
      }
    },
    features
  )
}

const tourStepBaseProps = {
  type: { type: String },
  target: { type: [String, Object, Function] },
  title: { type: String },
  description: { type: String },
  mask: { type: [Boolean, Object], default: undefined },
  contentStyle: { type: Object }
}

export function createTourStep(features: UiFeature[] = []) {
  return createUiComponent(
    {
      ...wrapperConfig({
        name: 'UiTourStep',
        baseClass: 'ui-tour-step',
        props: tourStepBaseProps,
        defaultTag: 'div'
      }),
      setup(props, { slots, attrs }) {
        const context = inject<TourContext | null>(TOUR_CONTEXT, null)
        const id = ++stepSeed
        onMounted(() => {
          context?.registerStep({ id, props: props as Record<string, any>, slots })
        })
        onBeforeUnmount(() => {
          context?.unregisterStep(id)
        })
        return { registered: Boolean(context) }
      },
      content: ({ props, slots, state }) => {
        if (state.registered) {
          return null
        }
        return slots.default?.() ?? props.description ?? props.title ?? null
      }
    },
    features
  )
}
