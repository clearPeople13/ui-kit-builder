import type { CSSProperties, VNodeChild } from 'vue'
import { Teleport, computed, h, onBeforeUnmount, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { useFloatingPanel } from '../../shared/panel'
import './core.css'

const tooltipBaseProps = {
  content: { type: String, default: '' },
  placement: { type: String, default: 'bottom' },
  effect: { type: String, default: 'dark' },
  disabled: Boolean,
  trigger: { type: [String, Array], default: 'hover' },
  modelValue: { type: Boolean, default: undefined },
  showArrow: { type: Boolean, default: true },
  rawContent: Boolean,
  teleported: { type: Boolean, default: true },
  offset: { type: Number, default: 12 },
  fallbackPlacements: { type: Array }
}

export function createTooltip(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTooltip',
      baseClass: 'ui-tooltip',
      props: tooltipBaseProps,
      emits: ['update:modelValue', 'visible-change'],
      setup(props, { emit }) {
        const innerOpen = ref(Boolean(props.modelValue))
        const triggerRef = ref<HTMLElement>()
        const panelRef = ref<HTMLElement>()
        let showTimer: ReturnType<typeof setTimeout> | null = null
        let hideTimer: ReturnType<typeof setTimeout> | null = null
        let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

        const isOpen = computed(() => innerOpen.value)

        const floating = useFloatingPanel({
          props,
          open: () => isOpen.value,
          close: hide,
          trigger: triggerRef,
          panel: panelRef,
          placement: () => String(props.placement || 'bottom'),
          offset: () => Number(props.offset ?? 12),
          fallbackPlacements: () => props.fallbackPlacements as string[] | undefined
        })

        function clearTimers() {
          if (showTimer) {
            clearTimeout(showTimer)
          }
          if (hideTimer) {
            clearTimeout(hideTimer)
          }
          if (autoCloseTimer) {
            clearTimeout(autoCloseTimer)
          }
          showTimer = null
          hideTimer = null
          autoCloseTimer = null
        }

        function open() {
          if (props.disabled) {
            return
          }
          clearTimers()
          const delay = Number(props.showAfter ?? 0)
          if (delay > 0) {
            showTimer = setTimeout(show, delay)
            return
          }
          show()
        }

        function show() {
          if (props.disabled || innerOpen.value) {
            return
          }
          innerOpen.value = true
          emit('update:modelValue', true)
          emit('visible-change', true)
          const autoClose = Number(props.autoClose ?? 0)
          if (Number.isFinite(autoClose) && autoClose > 0) {
            autoCloseTimer = setTimeout(hide, autoClose)
          }
        }

        function close() {
          clearTimers()
          if (props.disabled) {
            return
          }
          const delay = Number(props.hideAfter ?? 200)
          if (delay > 0) {
            hideTimer = setTimeout(hide, delay)
            return
          }
          hide()
        }

        function hide() {
          clearTimers()
          if (!innerOpen.value) {
            return
          }
          innerOpen.value = false
          emit('update:modelValue', false)
          emit('visible-change', false)
        }

        function toggle() {
          if (isOpen.value) {
            close()
          } else {
            open()
          }
        }

        const triggerList = computed(() => {
          const value = props.trigger
          return Array.isArray(value) ? value.map(String) : [String(value || 'hover')]
        })

        function getTriggerHandlers(): Record<string, (event: Event) => void> {
          const handlers: Record<string, (event: Event) => void> = {}
          if (triggerList.value.includes('hover')) {
            handlers.onMouseenter = () => open()
            handlers.onMouseleave = () => close()
            handlers.onFocus = () => open()
            handlers.onBlur = () => close()
          }
          if (triggerList.value.includes('click')) {
            handlers.onClick = () => toggle()
          }
          if (triggerList.value.includes('contextmenu')) {
            handlers.onContextmenu = (event) => {
              event.preventDefault()
              toggle()
            }
          }
          handlers.onKeydown = (event) => {
            if ((event as KeyboardEvent).key === 'Escape' && isOpen.value) {
              event.preventDefault()
              hide()
            }
          }
          return handlers
        }

        watch(
          () => props.modelValue,
          (value) => {
            if (value === undefined) {
              hide()
              return
            }
            if (value) {
              show()
            } else {
              hide()
            }
          }
        )

        onBeforeUnmount(clearTimers)

        function renderPopper(): VNodeChild {
          if (!isOpen.value && !props.persistent) {
            return null
          }
          const visible = isOpen.value
          const panel = h(
            'div',
            {
              ref: panelRef,
              class: [
                'ui-tooltip__popper',
                'ui-floating-panel',
                `is-${floating.actualSide.value}`,
                `is-${props.effect || 'dark'}`,
                props.popperClass
              ],
              style: [
                props.popperStyle as CSSProperties,
                floating.position.value,
                floating.position.value && Object.keys(floating.position.value).length
                  ? null
                  : { visibility: 'hidden' },
                visible ? null : { display: 'none' }
              ],
              role: 'tooltip',
              onMouseenter: () => {
                if (props.enterable !== false) {
                  clearTimers()
                }
              },
              onMouseleave: () => {
                if (props.enterable !== false) {
                  close()
                }
              }
            },
            [
              props.showArrow ? h('span', { class: 'ui-floating-arrow', style: floating.arrowStyle.value }) : null,
              props.rawContent
                ? h('span', { class: 'ui-tooltip__content', innerHTML: String(props.content ?? '') })
                : h('span', { class: 'ui-tooltip__content' }, props.content || '')
            ]
          )
          return props.teleported ? h(Teleport, { to: props.appendTo || 'body' }, panel) : panel
        }

        return {
          triggerRef,
          isOpen,
          getTriggerHandlers,
          renderPopper
        }
      },
      tag: () => 'div',
      attrs: (_props, state) => state.getTriggerHandlers() as Record<string, any>,
      content: ({ slots, state }) => [
        h(
          'div',
          {
            ref: state.triggerRef,
            class: 'ui-tooltip__trigger'
          },
          [slots.default?.() ?? null]
        ),
        state.renderPopper()
      ]
    },
    features
  )
}
