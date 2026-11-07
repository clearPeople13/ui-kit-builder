import { Comment, Fragment, Teleport, Text, h, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { sizeValue } from '../../shared/behavior'
import { renderIcon } from '../../shared/icon'
import { useFloatingPanel } from '../../shared/panel'
import './core.css'

function flattenAvatarNodes(nodes: unknown): any[] {
  if (!Array.isArray(nodes)) {
    return nodes ? [nodes] : []
  }
  const result: any[] = []
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      continue
    }
    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...flattenAvatarNodes(node.children))
      continue
    }
    if (node.type === Comment || node.type === Text) {
      continue
    }
    result.push(node)
  }
  return result
}

const avatarBaseProps = {
  size: { type: [Number, String] },
  shape: { type: String },
  src: { type: String, default: '' },
  alt: { type: String },
  srcSet: { type: String },
  fit: { type: String, default: 'cover' }
}

export function createAvatar(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiAvatar',
      baseClass: 'ui-avatar',
      props: avatarBaseProps,
      tag: (props) => (props.tag as string) || 'span',
      classes: (props) => [props.shape ? `is-${props.shape}` : ''],
      styles: (props) => {
        const size = sizeValue(props.size)
        return size ? { width: size, height: size, fontSize: `calc(${size} / 2.6)` } : {}
      },
      content: ({ props, slots }) => {
        if (props.src) {
          return h('img', {
            class: 'ui-avatar__image',
            src: props.src,
            alt: props.alt,
            srcSet: props.srcSet,
            style: { objectFit: props.fit || 'cover' }
          })
        }
        return h('span', { class: 'ui-avatar__text' }, [
          props.icon ? renderIcon(props.icon, { class: 'ui-avatar__icon' }) : (slots.default?.() ?? null)
        ])
      }
    },
    features
  )
}

const avatarGroupBaseProps = {
  size: { type: [Number, String], validator: (value: any) => ['', 'default', 'small', 'large'].includes(value) },
  shape: { type: String, validator: (value: any) => ['circle', 'square'].includes(value) },
  gap: { type: [Number, String] },
  collapseAvatars: { type: Boolean },
  collapseAvatarsTooltip: { type: Boolean, default: true },
  maxCollapseAvatars: { type: Number, default: 1 },
  effect: { type: String, default: 'light' },
  collapseClass: { type: [String, Array, Object, Boolean] },
  collapseStyle: { type: [String, Array, Object, Boolean] }
}

export function createAvatarGroup(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiAvatarGroup',
      baseClass: 'ui-avatar-group',
      props: avatarGroupBaseProps,
      tag: (props) => (props.tag as string) || 'span',
      classes: (props) => [
        props.shape ? `is-${props.shape}` : '',
        props.size && props.size !== 'default' ? `is-size-${props.size}` : ''
      ],
      // gap 是受控 prop，写成 CSS 变量交给 core.css 的负边距消费，避免透传成 DOM 属性
      styles: (props) => {
        const gap = sizeValue(props.gap)
        return gap ? { '--ui-avatar-group-gap': gap } : {}
      },
      setup(props) {
        const collapseRef = shallowRef<HTMLElement>()
        const panelRef = shallowRef<HTMLElement>()
        const open = ref(false)
        let hideTimer: ReturnType<typeof setTimeout> | null = null

        const floating = useFloatingPanel({
          props,
          open: () => open.value,
          close: () => {
            open.value = false
          },
          trigger: collapseRef,
          panel: panelRef,
          placement: () => props.placement ?? 'top',
          offset: () => Number(props.offset ?? 8),
          fallbackPlacements: () => props.fallbackPlacements
        })

        function clearHideTimer() {
          if (hideTimer) {
            clearTimeout(hideTimer)
            hideTimer = null
          }
        }

        function show() {
          if (props.collapseAvatarsTooltip === false) {
            return
          }
          clearHideTimer()
          open.value = true
        }

        function toggle() {
          if (props.collapseAvatarsTooltip === false) {
            open.value = !open.value
            return
          }
          show()
        }

        function scheduleHide() {
          if (props.collapseAvatarsTooltip === false) {
            return
          }
          clearHideTimer()
          hideTimer = setTimeout(() => {
            hideTimer = null
            open.value = false
          }, 120)
        }

        function handleDocumentPointerDown(event: Event) {
          if (!open.value) {
            return
          }
          const target = event.target as Node | null
          if (target && (collapseRef.value?.contains(target) || panelRef.value?.contains(target))) {
            return
          }
          open.value = false
        }

        onMounted(() => {
          document.addEventListener('pointerdown', handleDocumentPointerDown, true)
        })

        onBeforeUnmount(() => {
          clearHideTimer()
          document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
        })

        return {
          collapseRef,
          panelRef,
          show,
          toggle,
          scheduleHide,
          get open() {
            return open.value
          },
          get position() {
            return floating.position.value
          },
          get arrowStyle() {
            return floating.arrowStyle.value
          },
          get actualSide() {
            return floating.actualSide.value
          }
        }
      },
      content: ({ props, slots, state }) => {
        const children = flattenAvatarNodes(slots.default?.())
        const limit = Math.max(0, Number(props.maxCollapseAvatars ?? 1))
        const collapsed = Boolean(props.collapseAvatars) && children.length > limit
        const visible = collapsed ? children.slice(0, limit) : children
        const rest = collapsed ? children.slice(limit) : []
        const collapseEl = collapsed
          ? h(
              'span',
              {
                ref: state.collapseRef,
                class: ['ui-avatar', 'ui-avatar--collapse', props.collapseClass],
                style: props.collapseStyle,
                onMouseenter: () => state.show(),
                onMouseleave: () => state.scheduleHide(),
                onClick: () => state.toggle()
              },
              `+${rest.length}`
            )
          : null
        const panel =
          collapsed && rest.length && state.open
            ? h(
                'div',
                {
                  ref: state.panelRef,
                  class: [
                    'ui-avatar-group__dropdown',
                    'ui-floating-panel',
                    props.effect === 'dark' ? 'is-dark' : null,
                    props.shape ? `is-${props.shape}` : null,
                    `is-${state.actualSide}`,
                    props.popperClass
                  ],
                  style: [
                    props.popperStyle,
                    state.position,
                    state.position && Object.keys(state.position).length ? null : { visibility: 'hidden' }
                  ],
                  onMouseenter: () => state.show(),
                  onMouseleave: () => state.scheduleHide()
                },
                [
                  h('div', { class: 'ui-avatar-group__list' }, rest),
                  props.showArrow ? h('span', { class: 'ui-floating-arrow', style: state.arrowStyle }) : null
                ]
              )
            : null
        const target = props.appendTo
        const teleportTarget = target && typeof target === 'object' && 'value' in target ? target.value : target
        return h('span', { class: 'ui-avatar-group__inner' }, [
          ...visible,
          collapseEl,
          panel && props.teleported !== false ? h(Teleport, { to: teleportTarget || 'body' }, [panel]) : panel
        ])
      }
    },
    features
  )
}
