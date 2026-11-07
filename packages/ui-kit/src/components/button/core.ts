import type { Component } from 'vue'
import { h, inject, onBeforeUnmount, shallowRef } from 'vue'
import type { UiFeature, UiFeatureState } from '../../shared/feature'
import { collectFeatureHooks } from '../../shared/feature'
import { UI_CONFIG_KEY } from '../../shared/config'
import { createUiComponent } from '../../shared/component'
import { BUTTON_GROUP_CONTEXT, type ButtonGroupContext } from './button-group/core'
import './core.css'
import './wave.css'

function invokeClickHandler(handler: unknown, event: MouseEvent) {
  if (Array.isArray(handler)) {
    handler.forEach((item) => invokeClickHandler(item, event))
    return
  }
  if (typeof handler === 'function') {
    ;(handler as (event: MouseEvent) => void)(event)
  }
}

const buttonTypes = ['default', 'primary', 'success', 'warning', 'info', 'danger', '']
const buttonNativeTypes = ['button', 'submit', 'reset']
const buttonSizes = ['large', 'default', 'small', '']

const baseProps = {
  size: {
    type: String,
    values: buttonSizes,
    default: ''
  },
  type: {
    type: String,
    values: buttonTypes,
    default: ''
  },
  disabled: Boolean,
  nativeType: {
    type: String,
    values: buttonNativeTypes,
    default: 'button'
  },
  autofocus: Boolean,
  tag: {
    type: [String, Object, Function],
    default: 'button'
  }
}

interface WaveRipple {
  id: number
  color: string | null
  originX: string
  originY: string
}

// 与 antd getTargetWaveColor 一致：边框顶色 → 边框色 → 背景色，白色/透明视为无效色
function isValidWaveColor(color: string): boolean {
  if (!color) {
    return false
  }
  return (
    color !== '#fff' &&
    color !== '#ffffff' &&
    color !== 'rgb(255, 255, 255)' &&
    color !== 'rgba(255, 255, 255, 1)' &&
    !/rgba\((?:\d*, ){3}0\)/i.test(color) &&
    !/^#(?:[0-9a-f]{3}0|[0-9a-f]{6}00)$/i.test(color) &&
    color !== 'transparent' &&
    color !== 'canvastext'
  )
}

// 颜色契约：--ui-button-wave-color 为缺省值 auto 时由 JS 取边框/背景色（antd 行为）；
// 皮肤显式配 currentcolor（取文字色，Material 涟漪行为）或具体颜色时 JS 不插手
function resolveWaveColor(el: HTMLElement): string | null {
  const style = getComputedStyle(el)
  const configured = style.getPropertyValue('--ui-button-wave-color').trim().toLowerCase()
  if (configured && configured !== 'auto') {
    return null
  }
  return [style.borderTopColor, style.borderColor, style.backgroundColor].find(isValidWaveColor) ?? null
}

// 回收时机跟随皮肤的淡出时长（读到的变量名带构建前缀，dist 构建已改写）
function waveCleanupDelayMs(target: HTMLElement): number {
  const raw = getComputedStyle(target).getPropertyValue('--ui-button-wave-fade-duration').trim()
  const seconds = Number.parseFloat(raw)
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 2) * 1000 + 100
}

export function createButton(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiButton',
      baseClass: 'ui-button ui-button--wave',
      props: baseProps,
      // size 继承链是 属性 → 按钮组 → 全局配置 → default，不能被基座的全局 size 注入截胡
      globalSize: false,
      tag: (props) => (props.tag ?? 'button') as string | Component,
      disabled: (props) => Boolean(props.disabled),
      setup(props, { attrs }) {
        const globalConfig = inject(UI_CONFIG_KEY, undefined)
        const groupContext = inject(BUTTON_GROUP_CONTEXT, null) as ButtonGroupContext | null

        // 点击效果机制：每次点击铺一层效果节点，圆心=点击坐标，动画由皮肤 theme 配置
        // （wave-animation token + theme.rawCss 注入的 @keyframes），未配置动画时节点不可见
        const ripples = shallowRef<WaveRipple[]>([])
        let waveSeq = 0
        // 兜底回收定时器登记在册，卸载时统一清掉，避免卸载后回调写已死实例
        const waveTimers = new Set<ReturnType<typeof setTimeout>>()

        function removeRipple(id: number) {
          ripples.value = ripples.value.filter((ripple) => ripple.id !== id)
        }

        onBeforeUnmount(() => {
          waveTimers.forEach((timer) => clearTimeout(timer))
          waveTimers.clear()
          ripples.value = []
        })

        function handleWaveClick(event: MouseEvent) {
          if (props.disabled) {
            return
          }
          const target = event.currentTarget
          if (!(target instanceof HTMLElement)) {
            return
          }
          const rect = target.getBoundingClientRect()
          const id = ++waveSeq
          ripples.value = [
            ...ripples.value,
            {
              id,
              color: resolveWaveColor(target),
              originX: `${Math.round(event.clientX - rect.left)}px`,
              originY: `${Math.round(event.clientY - rect.top)}px`
            }
          ]
          // animationend 在动画被取消或隐藏视口下不触发，按淡出时长超时兜底回收
          const timer = setTimeout(() => {
            waveTimers.delete(timer)
            removeRipple(id)
          }, waveCleanupDelayMs(target))
          waveTimers.add(timer)
        }

        return { ripples, globalConfig, groupContext, handleWaveClick, rawAttrs: attrs }
      },
      attrs: (props, state, states: UiFeatureState[] = []) => {
        const clickHooks = collectFeatureHooks(states, 'click')
        // 用户 onClick、点击效果、特性 click hooks 都保留：用户处理器先执行
        const onClick = (event: MouseEvent) => {
          invokeClickHandler(state.rawAttrs.onClick, event)
          state.handleWaveClick(event)
          clickHooks.forEach((hook) => hook(event))
        }
        const tag = (props.tag ?? 'button') as string | Component
        return {
          onClick,
          type: tag === 'button' ? props.nativeType : undefined,
          autofocus: props.autofocus || undefined
        }
      },
      classes: (props, state) => {
        const size = props.size || state.groupContext?.size() || state.globalConfig?.value.size || 'default'
        // 全局配置（ConfigProvider）目前只治理 size，类型默认值只走"属性 → 按钮组"两级
        const type = props.type || state.groupContext?.type() || 'default'
        return [`ui-button--${type}`, `ui-button--size-${size}`]
      },
      append: ({ state }) => state.ripples.value.map((ripple: WaveRipple) => rippleVNode(ripple))
    },
    features
  )
}

function rippleVNode(ripple: WaveRipple) {
  return h('span', {
    key: ripple.id,
    class: 'ui-button__wave',
    style: {
      '--ui-button-wave-origin-x': ripple.originX,
      '--ui-button-wave-origin-y': ripple.originY,
      ...(ripple.color ? { '--ui-button-wave-color': ripple.color } : {})
    }
  })
}
