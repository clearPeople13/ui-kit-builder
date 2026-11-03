import type { Ref, VNode, VNodeChild } from 'vue'
import { cloneVNode, isVNode } from 'vue'
import type { UiFeature } from '../../../../shared/feature'

const INPUT_CLASS = 'ui-input-tag__input'

function isInputVNode(vnode: VNode): boolean {
  const value = vnode.props?.class
  const classes = Array.isArray(value) ? value.join(' ') : String(value ?? '')
  return classes.split(/\s+/).includes(INPUT_CLASS)
}

function splitText(text: string, separator: string): string[] {
  return text
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean)
}

export const inputTagSeparatorFeature: UiFeature = {
  id: 'input-tag.separator',
  props: {
    separator: { type: String }
  },
  setup(props, { emit, state }) {
    const draft = (state?.draft ?? null) as Ref<string> | null

    function tags(): unknown[] {
      return Array.isArray(props.modelValue) ? props.modelValue : []
    }

    function maxRemain(): number {
      return props.max === undefined ? Number.POSITIVE_INFINITY : Number(props.max) - tags().length
    }

    function addTags(candidates: string[]): void {
      const remain = maxRemain()
      const current = tags()
      const added: string[] = []
      for (const value of candidates) {
        if (added.length >= remain) {
          break
        }
        if (current.includes(value) || added.includes(value)) {
          continue
        }
        added.push(value)
      }
      if (!added.length) {
        return
      }
      const next = [...current, ...added]
      emit('update:modelValue', next)
      emit('change', next)
      for (const value of added) {
        emit('add-tag', value)
      }
    }

    function splitDraftInput(event: Event): void {
      const separator = props.separator
      if (!separator || !draft) {
        return
      }
      const value = (event.target as HTMLInputElement).value
      if (!value.includes(separator)) {
        return
      }
      const parts = value.split(separator)
      const complete = parts.slice(0, -1).map((part) => part.trim()).filter(Boolean)
      if (complete.length) {
        addTags(complete)
      }
      draft.value = parts[parts.length - 1]
      ;(event.target as HTMLInputElement).value = draft.value
    }

    function splitPaste(event: ClipboardEvent): void {
      const separator = props.separator
      if (!separator || !draft) {
        return
      }
      const text = event.clipboardData?.getData('text') ?? ''
      if (!text.includes(separator)) {
        return
      }
      event.preventDefault()
      const parts = splitText(text, separator)
      if (parts.length) {
        addTags(parts)
      }
      draft.value = ''
    }

    function decorate(content: VNodeChild): VNodeChild {
      if (!props.separator || !Array.isArray(content)) {
        return content
      }
      return content.map((child) => {
        if (!isVNode(child) || !isInputVNode(child)) {
          return child
        }
        return cloneVNode(child, {
          onInput: splitDraftInput,
          onPaste: splitPaste
        })
      })
    }

    return {
      class: () => (props.separator ? 'ui-input-tag--separator' : undefined),
      transformContent(content) {
        return decorate(content)
      }
    }
  }
}
