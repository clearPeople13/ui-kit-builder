import type { Component, VNode } from 'vue'
import { h } from 'vue'
import { DEFAULT_ICON_SIZE, DEFAULT_ICON_STROKE_WIDTH, resolveIcon } from './icons'

const ICON_PROP_NAMES = [
  'showIcon',
  'icon',
  'prefixIcon',
  'suffixIcon',
  'loadingIcon',
  'activeIcon',
  'inactiveIcon',
  'activeActionIcon',
  'inactiveActionIcon',
  'expandCloseIcon',
  'expandOpenIcon',
  'collapseCloseIcon',
  'collapseOpenIcon',
  'ellipsisIcon',
  'prevIcon',
  'nextIcon',
  'arrowIcon',
  'checkIcon',
  'indeterminateIcon'
] as const

export function hasIconProp(props: Record<string, any>): boolean {
  return ICON_PROP_NAMES.some((name) => Boolean(props[name]))
}

export interface UiIconOptions {
  class?: string | (string | false | null | undefined)[]
  size?: number | string
  strokeWidth?: number
  attrs?: Record<string, any>
}

export function renderIcon(icon: Component | string, options: UiIconOptions = {}): VNode {
  const component = resolveIcon(icon)
  return h('span', { ...options.attrs, class: ['ui-icon', options.class], 'aria-hidden': 'true' }, [
    component
      ? h(component, {
          size: options.size ?? DEFAULT_ICON_SIZE,
          'stroke-width': options.strokeWidth ?? DEFAULT_ICON_STROKE_WIDTH,
          focusable: 'false'
        })
      : null
  ])
}
