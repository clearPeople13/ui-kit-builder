import type { Ref } from 'vue'
import { h, inject, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

interface AnchorContext {
  activeHrefs: Ref<Set<string>>
  scrollTo: (href: string) => void
}

const ANCHOR_CONTEXT = Symbol('ui-anchor')

const anchorBaseProps = {
  type: { type: String, default: 'default' },
  bound: { type: Number, default: 15 }
}

function resolveAnchorTarget(href: string): HTMLElement | null {
  if (!href.startsWith('#')) {
    return null
  }
  return document.getElementById(href.slice(1))
}

function ancestorLinkOf(element: HTMLElement): HTMLElement | null {
  const parent = element.parentElement
  return parent ? (parent.closest('.ui-anchor-link') as HTMLElement | null) : null
}

function hrefTrail(link: HTMLElement): string[] {
  const trail: string[] = []
  let node: HTMLElement | null = link
  while (node) {
    const href = node.getAttribute('href')
    if (href) {
      trail.push(href)
    }
    node = ancestorLinkOf(node)
  }
  return trail
}

function scrollParentOf(element: HTMLElement): HTMLElement | Window {
  let parent = element.parentElement
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent)
    if (/(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }
  return window
}

function targetOffset(element: HTMLElement, container: HTMLElement | Window): number {
  if (container === window) {
    return element.getBoundingClientRect().top
  }
  const containerRect = (container as HTMLElement).getBoundingClientRect()
  return element.getBoundingClientRect().top - containerRect.top
}

export function createAnchor(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiAnchor',
      baseClass: 'ui-anchor',
      props: anchorBaseProps,
      setup(props) {
        const listRef = ref<HTMLElement>()
        const activeHrefs = ref<Set<string>>(new Set())
        let frame = 0

        function offsetValue(): number {
          return Number(props.offset) || 0
        }

        function linkElements(): HTMLAnchorElement[] {
          const list = listRef.value
          return list ? Array.from(list.querySelectorAll<HTMLAnchorElement>('.ui-anchor-link')) : []
        }

        function updateActive() {
          frame = 0
          const bound = Number(props.bound) || 0
          let current: HTMLAnchorElement | null = null
          let firstResolvable: HTMLAnchorElement | null = null
          for (const link of linkElements()) {
            const target = resolveAnchorTarget(link.getAttribute('href') || '')
            if (!target) {
              continue
            }
            if (!firstResolvable) {
              firstResolvable = link
            }
            if (targetOffset(target, scrollParentOf(target)) <= bound) {
              current = link
            }
          }
          // 没有任何目标落在阈值内时，先高亮第一个可解析的链接，避免导航整列空白
          const currentLink = current ?? firstResolvable
          activeHrefs.value = currentLink ? new Set(hrefTrail(currentLink)) : new Set()
        }

        function schedule() {
          if (frame) {
            return
          }
          frame = requestAnimationFrame(updateActive)
        }

        function scrollTo(href: string) {
          const target = resolveAnchorTarget(href)
          if (!target) {
            return
          }
          const clicked = linkElements().find((link) => link.getAttribute('href') === href) ?? null
          activeHrefs.value = new Set(clicked ? hrefTrail(clicked) : [href])
          const container = scrollParentOf(target)
          const top = Math.max(0, targetOffset(target, container) - offsetValue())
          if (container === window) {
            window.scrollTo({ top: top + window.scrollY, behavior: 'smooth' })
          } else {
            ;(container as HTMLElement).scrollTo({
              top: (container as HTMLElement).scrollTop + top,
              behavior: 'smooth'
            })
          }
          if (window.location.hash !== href) {
            window.history.replaceState(null, '', href)
          }
        }

        provide(ANCHOR_CONTEXT, { activeHrefs, scrollTo })

        onMounted(() => {
          window.addEventListener('scroll', schedule, { capture: true, passive: true })
          window.addEventListener('resize', schedule)
          // 首帧前直接算一次，避免 requestAnimationFrame 延迟导致初始没有任何高亮
          updateActive()
        })

        onBeforeUnmount(() => {
          window.removeEventListener('scroll', schedule, { capture: true })
          window.removeEventListener('resize', schedule)
          if (frame) {
            cancelAnimationFrame(frame)
            frame = 0
          }
        })

        return {
          listRef,
          get anchorType() {
            return props.type || 'default'
          }
        }
      },
      classes: (props) => [props.type ? `ui-anchor--${props.type}` : '', props.disabled ? 'is-disabled' : ''],
      content: ({ slots, state }) =>
        h('div', { ref: state.listRef, class: 'ui-anchor__list', role: 'navigation' }, [slots.default?.() ?? null])
    },
    features
  )
}

const anchorLinkBaseProps = {
  href: { type: String, default: '' },
  target: { type: String, default: '_self' },
  title: { type: String, default: '' },
  underline: { type: Boolean, default: true }
}

export function createAnchorLink(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiAnchorLink',
      baseClass: 'ui-anchor-link',
      props: anchorLinkBaseProps,
      tag: () => 'a',
      attrs: (props, state) => {
        const anchor = state.anchor as AnchorContext | null
        return {
          href: props.href || undefined,
          target: props.target || undefined,
          onClick: (event: MouseEvent) => {
            if (!anchor || !props.href.startsWith('#') || props.target === '_blank') {
              return
            }
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
              return
            }
            // 点击冒泡到外层链接时不接管，交还给真正被点击的那一层
            const origin = event.target as Element | null
            if (origin && origin.closest('.ui-anchor-link') !== event.currentTarget) {
              return
            }
            event.preventDefault()
            anchor.scrollTo(props.href)
          }
        }
      },
      classes: (props, state) => {
        const anchor = state.anchor as AnchorContext | null
        return [
          props.underline ? '' : 'is-underline-hidden',
          anchor && props.href && anchor.activeHrefs.value.has(props.href) ? 'is-active' : ''
        ]
      },
      content: ({ props, slots }) => slots.default?.() ?? props.title ?? props.href ?? null,
      setup(_props) {
        return { anchor: inject<AnchorContext | null>(ANCHOR_CONTEXT, null) }
      }
    },
    features
  )
}
