import type { VNode } from 'vue'
import { Comment, Fragment, Text, cloneVNode, defineComponent, isVNode } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { mergeFeatureProps } from '../../shared/feature'
import './core.css'

function isLegitChild(vnode: unknown): vnode is VNode {
  if (!isVNode(vnode)) {
    return false
  }
  if (vnode.type === Comment) {
    return false
  }
  if (vnode.type === Text && String(vnode.children ?? '').trim() === '') {
    return false
  }
  return true
}

function flattenChildren(children: unknown, result: VNode[] = []): VNode[] {
  if (Array.isArray(children)) {
    for (const child of children) {
      flattenChildren(child, result)
    }
    return result
  }
  if (isVNode(children) && children.type === Fragment) {
    flattenChildren(children.children, result)
    return result
  }
  if (isLegitChild(children)) {
    result.push(children)
  }
  return result
}

export function createOnlyChild(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiOnlyChild',
    inheritAttrs: false,
    props: mergeFeatureProps(features),
    setup(_, { attrs, slots }) {
      return () => {
        const children = flattenChildren(slots.default?.())
        if (children.length > 1) {
          console.warn('[UiOnlyChild] requires exactly one child element.')
          return null
        }
        const child = children[0]
        if (!child) {
          return null
        }
        if (typeof child.type === 'string') {
          return cloneVNode(child, { ...attrs, class: [attrs.class, child.props?.class] })
        }
        return child
      }
    }
  })
}
