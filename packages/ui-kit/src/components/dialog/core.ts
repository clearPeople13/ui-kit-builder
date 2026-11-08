import type { UiFeature } from '../../shared/feature'
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { createUiComponent } from '../../shared/component'
import { overlayConfig } from '../../shared/behavior'
import { getFocusableElements } from '../focus-trap/core'
import './core.css'

const dialogBaseProps = {
  modelValue: { type: Boolean },
  center: { type: Boolean },
  alignCenter: { type: Boolean },
  overflow: { type: Boolean },
  title: { type: String, default: '' },
  top: { type: String },
  width: { type: [String, Number] },
  zIndex: { type: Number }
}

export function createDialog(features: UiFeature[] = []) {
  const config = overlayConfig({
    name: 'UiDialog',
    baseClass: 'ui-dialog',
    props: dialogBaseProps,
    panelClass: 'ui-dialog__panel',
    visibleKey: 'modelValue',
    useMask: true,
    defaultVisible: false
  })
  const baseSetup = config.setup
  return createUiComponent(
    {
      ...config,
      setup(props, context) {
        const state = baseSetup?.(props, context) ?? {}
        const { root } = context
        // 打开前的活动元素（触发元素），关闭后归还焦点
        let previousActive: HTMLElement | null = null

        function getPanel(): HTMLElement | undefined {
          const rootEl = root.value as HTMLElement | undefined
          return rootEl?.querySelector<HTMLElement>('.ui-dialog__panel') ?? rootEl
        }

        function focusFirst() {
          const panel = getPanel()
          if (!panel || !props.modelValue) {
            return
          }
          const focusable = getFocusableElements(panel)
          ;(focusable[0] ?? panel).focus({ preventScroll: true })
        }

        function restoreFocus() {
          const target = previousActive
          previousActive = null
          target?.focus({ preventScroll: true })
        }

        // Tab / Shift+Tab 在面板内循环；Esc 分层在 overlayConfig 的 handleKeydown，
        // 那里以 capture 监听并检查 defaultPrevented，本处理器只认 Tab，互不干扰
        function handleKeydown(event: KeyboardEvent) {
          if (event.key !== 'Tab' || !props.modelValue) {
            return
          }
          const panel = getPanel()
          if (!panel) {
            return
          }
          const focusable = getFocusableElements(panel)
          if (!focusable.length) {
            event.preventDefault()
            panel.focus({ preventScroll: true })
            return
          }
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          const active = document.activeElement as HTMLElement | null
          const outside = !active || !panel.contains(active)
          if (event.shiftKey) {
            if (outside || active === first) {
              event.preventDefault()
              last.focus({ preventScroll: true })
            }
            return
          }
          if (outside || active === last) {
            event.preventDefault()
            first.focus({ preventScroll: true })
          }
        }

        watch(
          () => props.modelValue,
          (open) => {
            if (open) {
              const active = document.activeElement
              previousActive = active instanceof HTMLElement ? active : null
              nextTick(focusFirst)
            } else {
              restoreFocus()
            }
          },
          { immediate: true }
        )

        onMounted(() => window.addEventListener('keydown', handleKeydown, true))
        onBeforeUnmount(() => {
          window.removeEventListener('keydown', handleKeydown, true)
          // 打开期间直接卸载（路由切换等）也要归还焦点
          restoreFocus()
        })

        return state
      }
    },
    features
  )
}
