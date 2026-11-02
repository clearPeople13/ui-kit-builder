import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import './style.css'

export const buttonAppearanceFeature = {
  id: 'button.appearance',
  props: {
    plain: Boolean,
    text: Boolean,
    link: Boolean,
    bg: Boolean,
    dark: Boolean,
    round: Boolean,
    circle: Boolean,
    dashed: Boolean,
    color: String
  },
  setup(props: Record<string, any>) {
    const classes = computed(() => {
      const list: string[] = []
      if (props.plain) {
        list.push('is-plain')
      }
      if (props.text) {
        list.push('is-text')
      }
      if (props.link) {
        list.push('is-link')
      }
      if (props.bg) {
        list.push('is-bg')
      }
      if (props.dark) {
        list.push('is-dark')
      }
      if (props.round) {
        list.push('is-round')
      }
      if (props.circle) {
        list.push('is-circle')
      }
      if (props.dashed) {
        list.push('is-dashed')
      }
      return list.join(' ')
    })

    const style = computed<CSSProperties>(() => {
      if (!props.color) {
        return {}
      }
      if (props.plain) {
        return { color: props.color, borderColor: props.color }
      }
      if (props.text || props.link) {
        return { color: props.color }
      }
      return { backgroundColor: props.color, borderColor: props.color }
    })

    return { class: classes, style }
  }
}
