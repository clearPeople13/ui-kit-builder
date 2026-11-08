import { h, isVNode, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  // roving tabindex：整组菜单只占一个 Tab 停靠点，键盘/点击在可导航项间同步当前项
  navId: () => string | null
  setNavId: (id: string) => void
  registerNav: (id: string, element: HTMLElement) => void
  unregisterNav: (id: string) => void
  ensureNav: () => void
}

const MENU_CONTEXT = Symbol('ui-menu-context')
const SUBMENU_OWNER = Symbol('ui-submenu-owner')
let menuNavSeed = 0

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
  collapsed: { type: Boolean },
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
          if (props.collapsed || opened === isOpened(index)) {
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
              emit('submenu-change', item, false)
            }
          }
          openeds.value = next
          if (opened) {
            emit('submenu-change', index, true)
          }
        }

        function toggleOpen(index: string) {
          setOpen(index, !isOpened(index))
        }

        // menu-item 与 sub-menu 标题共享整组唯一的 Tab 停靠点
        const navId = ref<string | null>(null)
        const navElements = new Map<string, HTMLElement>()

        function registerNav(id: string, element: HTMLElement) {
          navElements.set(id, element)
          // 初始停靠点落在首个注册的可导航项
          if (!navId.value) {
            navId.value = id
          }
        }

        function ensureNav() {
          const current = navId.value ? navElements.get(navId.value) : undefined
          if (current && !current.closest('.is-disabled')) {
            return
          }
          // 当前停靠项被卸载或禁用后，回退到首个可用项，避免整组从 Tab 序里消失
          for (const [id, element] of navElements) {
            if (!element.closest('.is-disabled')) {
              navId.value = id
              return
            }
          }
          navId.value = null
        }

        function unregisterNav(id: string) {
          navElements.delete(id)
          ensureNav()
        }

        function setNavId(id: string) {
          navId.value = id
        }

        function navIdOf(element: HTMLElement): string | null {
          for (const [id, item] of navElements) {
            if (item === element) {
              return id
            }
          }
          return null
        }

        const NAV_ITEM_SELECTOR = '.ui-menu-item__inner, .ui-sub-menu__title'

        // 可导航项按 DOM 顺序收集（收起子菜单的子项不渲染，自然退出导航）；禁用项一律跳过
        function navigableItems(root: HTMLElement): HTMLElement[] {
          return Array.from(root.querySelectorAll<HTMLElement>(NAV_ITEM_SELECTOR)).filter(
            (element) => !element.closest('.is-disabled')
          )
        }

        function focusNavItem(element: HTMLElement) {
          element.focus({ preventScroll: true })
          const id = navIdOf(element)
          if (id) {
            navId.value = id
          }
        }

        // WAI-ARIA 交互式菜单键盘映射：↑↓ 在可导航项间循环移动，→ 展开/进入子菜单，
        // ← 收起子菜单或回到父级标题，Home/End 跳首末可用项；禁用项跳过
        function handleNavKeydown(event: KeyboardEvent) {
          const keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End']
          if (!keys.includes(event.key)) {
            return
          }
          const root = event.currentTarget as HTMLElement
          const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(NAV_ITEM_SELECTOR)
          if (!target || !root.contains(target) || target.closest('.is-disabled')) {
            return
          }
          const items = navigableItems(root)
          if (!items.length) {
            return
          }
          event.preventDefault()
          const currentIndex = items.indexOf(target)

          if (event.key === 'Home' || event.key === 'End') {
            focusNavItem(event.key === 'Home' ? items[0] : items[items.length - 1])
            return
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const step = event.key === 'ArrowDown' ? 1 : -1
            const from = currentIndex >= 0 ? currentIndex : 0
            focusNavItem(items[(from + step + items.length) % items.length])
            return
          }
          if (event.key === 'ArrowRight') {
            // 仅子菜单标题响应：未展开先展开，随后焦点落到第一个子项（无子项则停在标题）
            if (!target.classList.contains('ui-sub-menu__title')) {
              return
            }
            const subRoot = target.parentElement as HTMLElement | null
            const index = subRoot?.getAttribute('data-submenu-index')
            if (index && !isOpened(index)) {
              setOpen(index, true)
            }
            void nextTick(() => {
              if (!subRoot) {
                return
              }
              // 第一个子项 = 子树内排除标题自身的首个可导航元素（嵌套子菜单标题也算）
              const first = navigableItems(subRoot).find((element) => element !== target)
              if (first) {
                focusNavItem(first)
              }
            })
            return
          }
          // ArrowLeft：子项上收起所在子菜单并把焦点交回标题；标题上收起自身、焦点不动
          const subRoot = target.closest('.ui-sub-menu') as HTMLElement | null
          if (!subRoot) {
            return
          }
          const index = subRoot.getAttribute('data-submenu-index')
          if (index && isOpened(index)) {
            setOpen(index, false)
          }
          const title = Array.from(subRoot.children).find(
            (child): child is HTMLElement =>
              child instanceof HTMLElement && child.classList.contains('ui-sub-menu__title')
          )
          if (title && target !== title) {
            focusNavItem(title)
          }
        }

        provide(MENU_CONTEXT, {
          active: () => active.value,
          setActive,
          isOpened,
          toggleOpen,
          setOpen,
          owners,
          mode: () => props.mode,
          collapsible: () => Boolean(props.collapsed),
          showTimeout: () => toDelay(props.showTimeout, 300),
          hideTimeout: () => toDelay(props.hideTimeout, 300),
          navId: () => navId.value,
          setNavId,
          registerNav,
          unregisterNav,
          ensureNav
        })

        return {
          handleNavKeydown,
          get activeIndex() {
            return active.value
          }
        }
      },
      attrs: (_props, state) => ({ onKeydown: state.handleNavKeydown }),
      classes: (props) => [props.mode ? `is-${props.mode}` : '', props.collapsed ? 'is-collapse' : ''],
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
        const navKey = props.index || `ui-menu-item-nav-${menuNavSeed++}`
        const innerRef = ref<HTMLElement | null>(null)

        onMounted(() => {
          if (innerRef.value) {
            context?.registerNav(navKey, innerRef.value)
          }
        })
        onBeforeUnmount(() => context?.unregisterNav(navKey))
        // 禁用态翻转后兜底重选停靠点，否则整组可能从 Tab 序里消失
        watch(
          () => props.disabled,
          () => context?.ensureNav()
        )

        return {
          innerRef,
          get active() {
            return Boolean(props.index) && context?.active() === props.index
          },
          // roving tabindex：仅当前停靠项为 0，禁用项整体退出 Tab 序与键盘导航
          get tabindex() {
            return props.disabled ? undefined : context?.navId() === navKey ? 0 : -1
          },
          select() {
            if (props.disabled || !props.index) {
              return
            }
            // 鼠标点击同步 roving 当前项，与键盘导航共用同一出口
            context?.setNavId(navKey)
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
            ref: state.innerRef,
            tabindex: state.tabindex,
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
        const navKey = props.index || `ui-sub-menu-nav-${menuNavSeed++}`
        const titleRef = ref<HTMLElement | null>(null)
        if (props.index) {
          context?.owners.set(String(props.index), owner)
        }
        provide(SUBMENU_OWNER, props.index ? String(props.index) : '')
        let timer: ReturnType<typeof setTimeout> | null = null
        // 悬停展开的子菜单移出后自动收起；点击展开的保持展开
        let openedByHover = false

        onMounted(() => {
          if (titleRef.value) {
            context?.registerNav(navKey, titleRef.value)
          }
        })
        watch(
          () => props.disabled,
          () => context?.ensureNav()
        )

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
          context?.unregisterNav(navKey)
        })

        return {
          titleRef,
          get opened() {
            return Boolean(props.index) && Boolean(context?.isOpened(props.index as string))
          },
          // roving tabindex：仅当前停靠项为 0，禁用项整体退出 Tab 序与键盘导航
          get tabindex() {
            return props.disabled ? undefined : context?.navId() === navKey ? 0 : -1
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
            // 鼠标点击同步 roving 当前项，与键盘导航共用同一出口
            context?.setNavId(navKey)
            context?.toggleOpen(props.index)
          }
        }
      },
      attrs: (props, state) => ({
        onMouseenter: state.handleEnter,
        onMouseleave: state.handleLeave,
        // 键盘导航靠它把标题反查回子菜单 index（无 index 的子菜单本就无法展开）
        'data-submenu-index': props.index || undefined
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
              ref: state.titleRef,
              tabindex: state.tabindex,
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
