import type { VNodeChild } from 'vue'
import { Text, createTextVNode, isVNode } from 'vue'

function insertSpace(content: VNodeChild): VNodeChild {
  if (!Array.isArray(content) || content.length !== 1) {
    return content
  }
  const node = content[0]
  if (!isVNode(node) || node.type !== Text || typeof node.children !== 'string') {
    return content
  }
  const text = node.children
  if (!/^[\u3400-\u9fff]{2}$/.test(text)) {
    return content
  }
  return [createTextVNode(`${text[0]} ${text[1]}`)]
}

export const buttonAutoInsertSpaceFeature = {
  id: 'button.auto-insert-space',
  props: {
    autoInsertSpace: { type: Boolean, default: true }
  },
  setup(props: { autoInsertSpace?: boolean }) {
    return {
      transformContent: (content: VNodeChild) => (props.autoInsertSpace === false ? content : insertSpace(content))
    }
  }
}
