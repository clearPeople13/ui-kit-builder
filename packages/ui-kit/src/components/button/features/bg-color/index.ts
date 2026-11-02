import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import chroma from 'chroma-js'
import './style.css'

const DARK_TEXT = '#101828'
const LIGHT_TEXT = '#ffffff'

export function resolveContrastText(background: string): string {
  try {
    return chroma(background).luminance() > 0.45 ? DARK_TEXT : LIGHT_TEXT
  } catch {
    return LIGHT_TEXT
  }
}

export function brightenBackground(background: string, amount: number): string {
  try {
    return chroma(background).brighten(amount).hex()
  } catch {
    return background
  }
}

export const bgColorFeature = {
  id: 'button.bg-color',
  props: {
    bgColor: { type: String, default: '' },
    autoContrast: { type: Boolean, default: false }
  },
  setup(props: { bgColor?: string; autoContrast?: boolean }) {
    const style = computed<CSSProperties>(() => {
      if (!props.bgColor) {
        return {}
      }
      const next: CSSProperties = { backgroundColor: props.bgColor }
      if (props.autoContrast) {
        next.color = resolveContrastText(props.bgColor)
      }
      return next
    })

    return {
      class: computed(() => (props.bgColor ? 'ui-button--bg-color' : undefined)),
      style
    }
  }
}
