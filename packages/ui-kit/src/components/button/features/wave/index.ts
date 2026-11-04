import type { VNodeChild } from 'vue'
import { h, shallowRef } from 'vue'
import './style.css'

interface WaveRipple {
  id: number
  left: string
  top: string
  color: string
}

// 水波颜色取按钮文字色：实心按钮文字为白、水波即白；默认按钮文字为深色、水波即深，天然对比
function resolveWaveColor(el: HTMLElement): string {
  return getComputedStyle(el).color
}

export const buttonWaveFeature = {
  id: 'button.wave',
  props: {
    wave: { type: Boolean, default: true }
  },
  setup(props: { wave?: boolean; disabled?: boolean }) {
    const ripples = shallowRef<WaveRipple[]>([])
    let seq = 0

    function removeRipple(id: number) {
      ripples.value = ripples.value.filter((ripple) => ripple.id !== id)
    }

    function handleClick(event: MouseEvent) {
      if (!props.wave || props.disabled) {
        return
      }
      const target = event.currentTarget
      if (!(target instanceof HTMLElement)) {
        return
      }
      const rect = target.getBoundingClientRect()
      const id = ++seq
      ripples.value = [
        ...ripples.value,
        {
          id,
          left: `${Math.round(event.clientX - rect.left)}px`,
          top: `${Math.round(event.clientY - rect.top)}px`,
          color: resolveWaveColor(target)
        }
      ]
      // animationend 在动画被取消或隐藏视口下不触发，用超时兜底回收
      setTimeout(() => removeRipple(id), 900)
    }

    return {
      class: () => (props.wave ? 'ui-button--wave' : undefined),
      hooks: { click: handleClick },
      suffix: (): VNodeChild =>
        ripples.value.map((ripple) =>
          h('span', {
            key: ripple.id,
            class: 'ui-button__wave',
            style: {
              left: ripple.left,
              top: ripple.top,
              '--ui-button-wave-color': ripple.color
            }
          })
        )
    }
  }
}
