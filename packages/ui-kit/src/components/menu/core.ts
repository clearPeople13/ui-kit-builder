import { h, isVNode, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { createCollapseTransition } from '../collapse-transition/core'
import './core.css'

const CollapseTransition = createCollapseTransition([])

interface MenuContext {
  active: () => string
  setActive: (index: string) => void
  isOpened: (index: string) => boolean
  toggleOpen: (index: string) => void
  setOpen: (index: string, opened: boolean) => void
  owners: Map<string, string>
  mode: () => string
  collapsible: () => boolean
  showTimeout: () => number
  hideTimeout: () => number
}

const MENU_CONTEXT = Symbol('ui-menu-context')
const SUBMENU_OWNER = Symbol('ui-submenu-owner')

function toDelay(value: unknown, fallback: number): number {
  if (value === '' || value === null || value === undefined) {
    return fallback
  }
  const delay = Number(value)
  return Number.isFinite(delay) ? Math.max(0, delay) : fallback
}

// 收起状态的子菜单不渲染子项，无法靠注册表反查祖先链；改从插槽 vnode 树收集子树内所有 index
function collectMenuIndices(node: unknown, out: string[]): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectMenuIndices(item, out)
    }
    return
  }
  if (!isVNode(node)) {
    return
  }
  const index = (node.props as Record<string, unknown> | null)?.index
  if (typeof index === 'string' && index) {
    out.push(index)
  }
  const children = node.children
  if (Array.isArray(children)) {
    collectMenuIndices(children, out)
  } else if (children && typeof children === 'object') {
    for (const value of Object.values(children)) {
      collectMenuIndices(typeof value === 'function' ? (value as () => unknown)() : value, out)
    }
  }
}

const menuBaseProps = {
  mode: { type: String, default: 'vertical' },
  defaultActive: { type: String, default: '' },
  defaultOpeneds: { type: Array, default: () => [] },
  uniqueOpened: { type: Boolean },
  collapse: { type: Boolean },
  backgroundColor: { type: String },
  textColor: { type: String },
  activeTextColor: { type: String },
  showTimeout: { type: Number, default: 300 },
  hideTimeout: { type: Number, default: 300 }
}

export function createMenu(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiMenu',
      baseClass: 'ui-menu',
      props: menuBaseProps,
      setup(props, { emit, provide }) {
        const active = ref(props.defaultActive || '')
        const openeds = ref<string[]>(
          Array.isArray(props.defaultOpeneds) ? ([...props.defaultOpeneds] as string[]) : []
        )
        // 子菜单 index -> 父级子菜单 index，用于手风琴只互斥同层兄弟
        const owners = new Map<string, string>()

        watch(
          () => props.defaultActive,
          (value) => {
            active.value = value || ''
          }
        )

        function setActive(index: string) {
          active.value = index
          emit('select', index)
        }

        function isOpened(index: string) {
          return openeds.value.includes(index)
        }

        function sameOwner(index: string, owner: string) {
          return (owners.get(index) ?? '') === owner
        }

        function setOpen(index: string, opened: boolean) {
          if (props.collapse || opened === isOpened(index)) {
            return
          }
          const owner = owners.get(index) ?? ''
          const next = opened
            ? props.uniqueOpened
              ? [...openeds.value.filter((item) => !sameOwner(item, owner)), index]
              : [...openeds.value, index]
            : openeds.value.filter((item) => item !== index)
          for (const item of openeds.value) {
            if (!next.includes(item)) {
              emit('close', item)
            }
          }
          openeds.value = next
          if (opened) {
            emit('open', index)
          }
        }

        function toggleOpen(index: string) {
          setOpen(index, !isOpened(index))
        }

        provide(MENU_CONTEXT, {
          active: () => active.value,
          setActive,
          isOpened,
          toggleOpen,
          setOpen,
          owners,
          mode: () => props.mode,
          collapsible: () => Boolean(props.collapse),
          showTimeout: () => toDelay(props.showTimeout, 300),
          hideTimeout: () => toDelay(props.hideTimeout, 300)
        })

        return {
          get activeIndex() {
            return active.value
          }
        }
      },
      classes: (props) => [props.mode ? `is-${props.mode}` : '', props.collapse ? 'is-collapse' : ''],
      styles: (props) => ({
        color: props.textColor,
        '--ui-menu-bg': props.backgroundColor,
        '--ui-menu-text-color': props.textColor,
        '--ui-menu-active-color': props.activeTextColor
      }),
      content: ({ slots }) => h('div', { class: 'ui-menu__list' }, [slots.default?.() ?? null])
    },
    features
  )
}

const menuItemBaseProps = {
  index: { type: String },
  disabled: { type: Boolean }
}

export function createMenuItem(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiMenuItem',
      baseClass: 'ui-menu-item',
      props: menuItemBaseProps,
      setup(props, { inject }) {
        const context = inject(MENU_CONTEXT, null) as MenuContext | null
        return {
          get active() {
            return Boolean(props.index) && context?.active() === props.index
          },
          select() {
            if (props.disabled || !props.index) {
              return
            }
            context?.setActive(props.index)
          }
        }
      },
      classes: (props, state) => [state.active ? 'is-active' : '', props.disabled ? 'is-disabled' : ''],
      content: ({ slots, state }) =>
        h(
          'div',
          {
            class: 'ui-menu-item__inner',
            onClick: () => state.select()
          },
          [slots.default?.() ?? null]
        )
    },
    features
  )
}

const menuItemGroupBaseProps = {
  title: { type: String }
}

export function createMenuItemGroup(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiMenuItemGroup',
      baseClass: 'ui-menu-item-group',
      props: menuItemGroupBaseProps,
      content: ({ props, slots }) => [
        // 未传 title（或空串）时不渲染分组标题节点，避免空标题占据一行高度
        props.title ? h('div', { class: 'ui-menu-item-group__title' }, props.title) : null,
        h('div', { class: 'ui-menu-item-group__list' }, [slots.default?.() ?? null])
      ]
    },
    features
  )
}

const subMenuBaseProps = {
  index: { type: String },
  disabled: { type: Boolean },
  showTimeout: { type: Number },
  hideTimeout: { type: Number }
}

export function createSubMenu(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiSubMenu',
      baseClass: 'ui-sub-menu',
      props: subMenuBaseProps,
      setup(props, { inject, provide, slots }) {
        const context = inject(MENU_CONTEXT, null) as MenuContext | null
        const owner = inject(SUBMENU_OWNER, '') as string
        if (props.index) {
          context?.owners.set(String(props.index), owner)
        }
        provide(SUBMENU_OWNER, props.index ? String(props.index) : '')
        let timer: ReturnType<typeof setTimeout> | null = null
        // 悬停展开的子菜单移出后自动收起；点击展开的保持展开
        let openedByHover = false

        function clearTimer() {
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
        }

        function selectable(): string {
          return props.disabled || !props.index || context?.collapsible() ? '' : (props.index as string)
        }

        function handleEnter() {
          const target = selectable()
          if (!target || context?.isOpened(target)) {
            return
          }
          clearTimer()
          timer = setTimeout(
            () => {
              openedByHover = true
              context?.setOpen(target, true)
            },
            toDelay(props.showTimeout, context?.showTimeout() ?? 300)
          )
        }

        function handleLeave() {
          clearTimer()
          const target = selectable()
          if (!target || !openedByHover || !context?.isOpened(target)) {
            return
          }
          timer = setTimeout(
            () => {
              openedByHover = false
              context?.setOpen(target, false)
            },
            toDelay(props.hideTimeout, context?.hideTimeout() ?? 300)
          )
        }

        onBeforeUnmount(() => {
          clearTimer()
          if (props.index) {
            context?.owners.delete(String(props.index))
          }
        })

        return {
          get opened() {
            return Boolean(props.index) && Boolean(context?.isOpened(props.index as string))
          },
          // 激活项是否在本子菜单的子树内（子项选中、父级收起时给标题一个高亮标识）
          get activeDescendant() {
            const current = context?.active() ?? ''
            if (!current || !props.index) {
              return false
            }
            const indices: string[] = []
            collectMenuIndices(slots.default?.(), indices)
            return indices.includes(current)
          },
          get mode() {
            return context?.mode() ?? 'vertical'
          },
          handleEnter,
          handleLeave,
          toggle() {
            if (props.disabled || !props.index) {
              return
            }
            clearTimer()
            openedByHover = false
            context?.toggleOpen(props.index)
          }
        }
      },
      attrs: (_props, state) => ({
        onMouseenter: state.handleEnter,
        onMouseleave: state.handleLeave
      }),
      classes: (props, state) => [
        state.opened ? 'is-opened' : '',
        state.activeDescendant ? 'is-active' : '',
        props.disabled ? 'is-disabled' : ''
      ],
      content: ({ props, slots, state }) => {
        const arrowIcon = state.opened
          ? state.mode === 'horizontal'
            ? props.collapseOpenIcon
            : props.expandOpenIcon
          : state.mode === 'horizontal'
            ? props.collapseCloseIcon
            : props.expandCloseIcon
        return [
          h(
            'div',
            {
              class: 'ui-sub-menu__title',
              onClick: () => state.toggle()
            },
            [
              slots.title?.() ?? null,
              arrowIcon
                ? renderIcon(arrowIcon, { class: ['ui-sub-menu__arrow', 'is-custom'] })
                : renderIcon(ChevronRight, { class: 'ui-sub-menu__arrow' })
            ]
          ),
          h(CollapseTransition, null, {
            default: () => (state.opened ? h('div', { class: 'ui-sub-menu__body' }, [slots.default?.() ?? null]) : null)
          })
        ]
      }
    },
    features
  )
}
