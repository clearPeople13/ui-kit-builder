import { h } from 'vue'
import type { UiFeature } from './feature'
import './input-word-limit.css'

function toText(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }
  return String(value)
}

function countText(text: string, counter: unknown): number {
  if (typeof counter === 'function') {
    const count = Number(counter(text))
    if (Number.isFinite(count)) {
      return count
    }
  }
  return text.length
}

function limitValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const limit = Number(value)
  return Number.isFinite(limit) ? limit : undefined
}

export function createInputWordLimitFeature(options: { id: string; baseClass: string }): UiFeature {
  return {
    id: options.id,
    props: {
      showWordLimit: { type: Boolean },
      wordLimitPosition: { type: String, default: 'inside' }
    },
    setup(props) {
      return {
        class: () => {
          if (!props.showWordLimit) {
            return undefined
          }
          return props.wordLimitPosition === 'outside'
            ? `${options.baseClass}--word-limit is-word-limit-outside`
            : `${options.baseClass}--word-limit`
        },
        suffix: () => {
          if (!props.showWordLimit) {
            return null
          }
          const count = countText(toText(props.modelValue ?? props.value), props.countGraphemes)
          const limit = limitValue(props.maxlength)
          const exceed = limit !== undefined && count > limit
          return h(
            'span',
            {
              class: [`${options.baseClass}__count`, exceed ? 'is-exceed' : ''].filter(Boolean),
              'aria-hidden': 'true'
            },
            limit === undefined ? String(count) : `${count}/${limit}`
          )
        }
      }
    }
  }
}
