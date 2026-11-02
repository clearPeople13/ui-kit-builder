import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import { brightenBackground } from '../bg-color/index'
import './style.css'

export const gradientFeature = {
  id: 'button.gradient',
  props: {
    gradient: { type: Boolean, default: false },
    gradientAngle: { type: Number, default: 90 }
  },
  setup(props: { gradient?: boolean; gradientAngle?: number; bgColor?: string }) {
    const style = computed<CSSProperties>(() => {
      if (!props.gradient || !props.bgColor) {
        return {}
      }
      const endColor = brightenBackground(props.bgColor, 1.2)
      return {
        backgroundImage: `linear-gradient(${props.gradientAngle}deg, ${props.bgColor}, ${endColor})`
      }
    })

    return {
      class: computed(() => (props.gradient ? 'ui-button--gradient' : undefined)),
      style
    }
  }
}
