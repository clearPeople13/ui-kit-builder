import type { Component, VNodeChild } from 'vue'
import { defineComponent, h, inject, shallowRef } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { UI_CONFIG_KEY } from '../../shared/config'
import { mergeStyles } from '../../shared/utils'
import { BUTTON_GROUP_CONTEXT, type ButtonGroupContext } from './button-group/core'
import {
  collectFeatureClasses,
  collectFeatureFragments,
  collectFeatureHooks,
  collectFeatureStyles,
  isFeatureDisabled,
  mergeFeatureProps,
  resolveFeatureStates,
  transformFeatureContent
} from '../../shared/feature'
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
  return defineComponent({
    name: 'UiButton',
    inheritAttrs: false,
    props: { ...baseProps, ...mergeFeatureProps(features) },
    setup(props, { attrs, slots }) {
      const resolved = props as Record<string, any>
      const globalConfig = inject(UI_CONFIG_KEY, undefined)
      const groupContext = inject(BUTTON_GROUP_CONTEXT, null) as ButtonGroupContext | null
      const states = resolveFeatureStates(features, resolved)
      const clickHooks = collectFeatureHooks(states, 'click')

      // 点击效果机制：每次点击铺一层效果节点，圆心=点击坐标，动画由皮肤 theme 配置
      // （wave-animation token + theme.rawCss 注入的 @keyframes），未配置动画时节点不可见
      const ripples = shallowRef<WaveRipple[]>([])
      let waveSeq = 0

      function removeRipple(id: number) {
        ripples.value = ripples.value.filter((ripple) => ripple.id !== id)
      }

      function handleWaveClick(event: MouseEvent) {
        if (resolved.disabled) {
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
        setTimeout(() => removeRipple(id), waveCleanupDelayMs(target))
      }

      function renderWaveRipples(): VNodeChild {
        return ripples.value.map((ripple) =>
          h('span', {
            key: ripple.id,
            class: 'ui-button__wave',
            style: {
              '--ui-button-wave-origin-x': ripple.originX,
              '--ui-button-wave-origin-y': ripple.originY,
              ...(ripple.color ? { '--ui-button-wave-color': ripple.color } : {})
            }
          })
        )
      }

      return function render() {
        const tag = (resolved.tag ?? 'button') as string | Component
        const size = resolved.size || groupContext?.size() || globalConfig?.value.size || 'default'
        // 全局配置（ConfigProvider）目前只治理 size，类型默认值只走"属性 → 按钮组"两级
        const type = resolved.type || groupContext?.type() || 'default'
        const prefix = collectFeatureFragments(states, 'prefix')
        const suffix = collectFeatureFragments(states, 'suffix')
        const content = transformFeatureContent(states, slots.default?.() ?? null)
        // 用户 onClick、点击效果、特性 click hooks 都保留：用户处理器先执行
        const onClick = (event: MouseEvent) => {
          invokeClickHandler(attrs.onClick, event)
          handleWaveClick(event)
          clickHooks.forEach((hook) => hook(event))
        }

        return h(
          tag,
          {
            ...attrs,
            onClick,
            type: tag === 'button' ? resolved.nativeType : undefined,
            class: [
              attrs.class,
              'ui-button',
              'ui-button--wave',
              `ui-button--${type}`,
              `ui-button--size-${size}`,
              ...collectFeatureClasses(states)
            ],
            style: mergeStyles(attrs.style, collectFeatureStyles(states)),
            disabled: Boolean(resolved.disabled) || isFeatureDisabled(states) || undefined,
            autofocus: resolved.autofocus || undefined
          },
          [
            ...prefix.map((renderFragment) => renderFragment()),
            content,
            ...suffix.map((renderFragment) => renderFragment()),
            renderWaveRipples()
          ]
        )
      }
    }
  })
}
