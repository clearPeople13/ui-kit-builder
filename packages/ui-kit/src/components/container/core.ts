import { Fragment, isVNode, type VNode } from 'vue'
import type { CSSProperties } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

const asideBaseProps = {
  width: { type: [String, Number], default: 300 }
}

// 纯数字字符串（来自输入框、URL 参数等）按 px 处理，其余字符串原样透传，避免出现 width: 300 这类无效值
function cssSize(value: unknown): string {
  if (typeof value === 'number') {
    return `${value}px`
  }
  const text = String(value ?? '')
  if (!text) {
    return ''
  }
  return /^\d+(\.\d+)?$/.test(text) ? `${text}px` : text
}

export function createAside(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiAside',
      baseClass: 'ui-aside',
      props: asideBaseProps,
      tag: () => 'aside',
      styles: (props) => ({ width: cssSize(props.width) }),
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}

const containerBaseProps = {
  direction: { type: String, default: '' },
  tag: { type: String, default: 'section' }
}

function toVNodes(children: unknown): VNode[] {
  if (Array.isArray(children)) {
    return children.filter((node): node is VNode => isVNode(node))
  }
  return isVNode(children) ? [children] : []
}

function containsAside(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Fragment) {
      return Array.isArray(node.children) && containsAside(node.children as VNode[])
    }
    return (node.type as { name?: string }).name === 'UiAside'
  })
}

function resolveDirection(direction: string, children: unknown): string {
  if (direction) {
    return direction
  }
  return containsAside(toVNodes(children)) ? 'horizontal' : 'vertical'
}

export function createContainer(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiContainer',
      baseClass: 'ui-container',
      props: containerBaseProps,
      tag: (props) => (props.tag as string) || 'section',
      setup(props, { slots }) {
        return {
          direction: () => resolveDirection(String(props.direction), slots.default?.() ?? [])
        }
      },
      classes: (_props, state) => (state.direction() === 'vertical' ? ['is-vertical'] : []),
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}

const footerBaseProps = {
  height: { type: [String, Number], default: 60 }
}

export function createFooter(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiFooter',
      baseClass: 'ui-footer',
      props: footerBaseProps,
      tag: () => 'footer',
      styles: (props) => ({ height: cssSize(props.height) }),
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}

const headerBaseProps = {
  height: { type: [String, Number], default: 60 }
}

export function createHeader(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiHeader',
      baseClass: 'ui-header',
      props: headerBaseProps,
      tag: () => 'header',
      styles: (props) => ({ height: cssSize(props.height) }),
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}

const mainBaseProps = {
  padding: { type: [String, Number], default: '' }
}

export function createMain(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiMain',
      baseClass: 'ui-main',
      props: mainBaseProps,
      tag: () => 'main',
      styles: (props) => {
        const style: CSSProperties = {}
        const padding = cssSize(props.padding)
        if (padding) {
          style.padding = padding
        }
        return style
      },
      content: ({ slots }) => slots.default?.() ?? null
    },
    features
  )
}
