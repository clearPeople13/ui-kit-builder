import type { VNodeChild } from 'vue'
import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { renderIcon } from '../../shared/icon'
import './core.css'

const BREADCRUMB_SEPARATOR = Symbol('ui-breadcrumb-separator')

const breadcrumbBaseProps = {
  separator: { type: String, default: '/' },
  separatorIcon: { type: [String, Object, Function] }
}

export function createBreadcrumb(features: UiFeature[] = []) {
  const base = wrapperConfig({
    name: 'UiBreadcrumb',
    baseClass: 'ui-breadcrumb',
    props: breadcrumbBaseProps,
    defaultTag: 'nav'
  })
  return createUiComponent(
    {
      ...base,
      setup(props, { provide }) {
        provide(BREADCRUMB_SEPARATOR, () => {
          if (props.separatorIcon) {
            return renderIcon(props.separatorIcon, { class: 'ui-breadcrumb-item__separator-icon' })
          }
          return props.separator || '/'
        })
        return {}
      }
    },
    features
  )
}

const breadcrumbItemBaseProps = {
  to: { type: [String, Object], default: '' },
  replace: { type: Boolean }
}

function linkTarget(to: unknown): string {
  if (typeof to === 'string') {
    return to
  }
  if (to && typeof to === 'object') {
    const record = to as Record<string, unknown>
    if (typeof record.href === 'string') {
      return record.href
    }
    if (typeof record.path === 'string') {
      return record.path
    }
  }
  return ''
}

export function createBreadcrumbItem(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiBreadcrumbItem',
      baseClass: 'ui-breadcrumb-item',
      props: breadcrumbItemBaseProps,
      setup(_props, { inject }) {
        const separator = inject(BREADCRUMB_SEPARATOR, null) as (() => VNodeChild) | null
        return {
          get separator(): VNodeChild {
            return separator ? separator() : '/'
          }
        }
      },
      classes: (props) => [linkTarget(props.to) ? 'is-link' : ''],
      tag: (props) => (linkTarget(props.to) ? 'a' : 'span'),
      attrs: (props) => {
        const href = linkTarget(props.to)
        if (!href) {
          return {}
        }
        const attrs: Record<string, any> = { href }
        if (props.replace) {
          attrs.onClick = (event: MouseEvent) => {
            event.preventDefault()
            window.location.replace(href)
          }
        }
        return attrs
      },
      content: ({ slots, state }) => {
        const body = slots.default?.() ?? null
        return [
          h('span', { class: 'ui-breadcrumb-item__separator', 'aria-hidden': 'true' }, [state.separator]),
          h('span', { class: 'ui-breadcrumb-item__inner' }, [body])
        ]
      }
    },
    features
  )
}
