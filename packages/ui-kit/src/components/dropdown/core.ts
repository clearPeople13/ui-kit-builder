import { h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { renderIcon } from '../../shared/icon'
import { sizeValue, triggerConfig, wrapperConfig } from '../../shared/behavior'
import './core.css'

const dropdownBaseProps = {
  size: { type: String, default: '' },
  disabled: { type: Boolean },
  trigger: { type: [String, Array], default: 'hover' },
  effect: { type: String, default: 'light' },
  id: { type: String },
  hideOnClick: { type: Boolean, default: true },
  showTimeout: { type: Number, default: 150 },
  hideTimeout: { type: Number, default: 150 },
  // Boolean prop 必须显式 default: undefined，否则不传时 Vue 归一化成 false，
  // triggerConfig 会把"未受控"误判成"受控且强制收起"
  visible: { type: Boolean, default: undefined },
  tabindex: { type: [Number, String], default: 0 },
  maxHeight: { type: [Number, String], default: '' },
  role: { type: String, default: 'menu' }
}

function dropdownTrigger(props: Record<string, any>): 'click' | 'hover' | 'contextmenu' {
  const value = Array.isArray(props.trigger) ? props.trigger[0] : props.trigger
  return value === 'click' || value === 'contextmenu' ? value : 'hover'
}

interface DropdownMenuContext {
  // roving tabindex：整个面板只占一个 Tab 停靠点，键盘/点击在可导航项间同步当前项
  navId: () => string | null
  setNavId: (id: string) => void
  registerNav: (id: string, element: HTMLElement) => void
  unregisterNav: (id: string) => void
  ensureNav: () => void
}

const DROPDOWN_MENU_CONTEXT = Symbol('ui-dropdown-menu-context')

export function createDropdown(features: UiFeature[] = []) {
  const base = triggerConfig({
    name: 'UiDropdown',
    baseClass: 'ui-dropdown',
    props: dropdownBaseProps,
    panelClass: 'ui-dropdown__panel',
    trigger: dropdownTrigger,
    closeOnPanelClick: (props) => props.hideOnClick !== false,
    ariaHaspopup: (props) => props.role || 'menu',
    panel: ({ slots, props, state }) =>
      h(
        'div',
        {
          class: 'ui-dropdown__content',
          // menuitem 必须有 role=menu 的合法父级，与 trigger 的 aria-haspopup 同源
          role: props.role || 'menu',
          style: {
            maxHeight: sizeValue(props.maxHeight) ?? '240px',
            overflowY: 'auto'
          },
          // 面板 teleport 到 body，键盘事件在内容层收口，不走组件根节点冒泡
          onKeydown: (event: KeyboardEvent) => state.handleMenuKeydown?.(event)
        },
        [slots.dropdown?.() ?? slots.content?.() ?? null]
      )
  })
  return createUiComponent(
    {
      ...base,
      setup: (props, context) => {
        const state = base.setup?.(props, context) ?? {}
        const triggerRef = state.triggerRef as { value: HTMLElement | undefined } | undefined
        const navId = ref<string | null>(null)
        const navElements = new Map<string, HTMLElement>()
        // 键盘 Enter/Space 打开时置位，展开后用它决定是否把焦点移交菜单项；悬停/点击打开不抢焦点
        let keyboardOpen = false

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

        function navigableItems(): HTMLElement[] {
          return Array.from(navElements.values()).filter((element) => !element.closest('.is-disabled'))
        }

        function focusNavItem(element: HTMLElement) {
          element.focus({ preventScroll: true })
          for (const [id, item] of navElements) {
            if (item === element) {
              navId.value = id
              return
            }
          }
        }

        function focusTrigger() {
          triggerRef?.value?.focus({ preventScroll: true })
        }

        // WAI-ARIA 菜单键盘映射：↑↓ 在可导航项间循环移动，Home/End 跳首末可用项，
        // Enter 选中当前项，Escape 收起并归还触发器；禁用项跳过
        function handleMenuKeydown(event: KeyboardEvent) {
          const root = event.currentTarget as HTMLElement | null
          const target = (event.target as HTMLElement | null)?.closest?.('.ui-dropdown-item') as HTMLElement | null
          if (event.key === 'Escape') {
            // 收起由 triggerConfig 登记的 Escape 栈负责，这里只归还焦点
            if (target && root?.contains(target)) {
              focusTrigger()
            }
            return
          }
          if (!target || !root?.contains(target) || target.closest('.is-disabled')) {
            return
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            // 与鼠标点击同一出口：触发项上的业务监听，面板按 hideOnClick 决定是否收起
            target.click()
            if (!(state.open as boolean)) {
              // 选中即收起时焦点不能落在已隐藏的面板项上，归还触发器
              focusTrigger()
            }
            return
          }
          const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
          if (!keys.includes(event.key)) {
            return
          }
          event.preventDefault()
          const items = navigableItems()
          if (!items.length) {
            return
          }
          const currentIndex = items.indexOf(target)
          if (event.key === 'Home' || event.key === 'End') {
            focusNavItem(event.key === 'Home' ? items[0] : items[items.length - 1])
            return
          }
          const step = event.key === 'ArrowDown' ? 1 : -1
          const from = currentIndex >= 0 ? currentIndex : 0
          focusNavItem(items[(from + step + items.length) % items.length])
        }

        context.provide(DROPDOWN_MENU_CONTEXT, {
          navId: () => navId.value,
          setNavId: (id: string) => {
            navId.value = id
          },
          registerNav,
          unregisterNav,
          ensureNav
        })

        watch(
          () => state.open as boolean,
          (value) => {
            const byKeyboard = keyboardOpen
            keyboardOpen = false
            if (!value) {
              return
            }
            // setTimeout 而非 nextTick：探针页里组件由页面 Vue 渲染、watch 回调跨 Vue 调度器时，
            // kit 侧 nextTick 会挂在不冲刷的 flush 承诺上，焦点移交必须走宏任务
            setTimeout(() => {
              // 悬停打开的短暂窗口里焦点可能刚落在触发器上，只有键盘打开才接管焦点
              if (!byKeyboard || !triggerRef?.value?.contains(document.activeElement)) {
                return
              }
              const first = navigableItems()[0]
              if (first) {
                focusNavItem(first)
              }
            }, 0)
          }
        )

        // 直接改写字段而不展开合并：展开会把 base setup 的 getter（open/position 等）冻结成当时的静态值
        state.handleMenuKeydown = handleMenuKeydown
        state.handleTriggerKeydown = (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            keyboardOpen = true
          }
        }
        return state
      },
      attrs: (props, state) => {
        const baseAttrs = base.attrs?.(props, state) ?? {}
        return {
          ...baseAttrs,
          onKeydown: (event: KeyboardEvent) => {
            // Enter/Space 走键盘打开通道：展开后焦点移交首个菜单项，Escape 仍走原有收口
            state.handleTriggerKeydown?.(event)
            baseAttrs.onKeydown?.(event)
          }
        }
      }
    },
    features
  )
}

const dropdownItemBaseProps = {
  disabled: { type: Boolean },
  divided: { type: Boolean }
}

let dropdownItemNavSeed = 0

export function createDropdownItem(features: UiFeature[] = []) {
  const base = wrapperConfig({
    name: 'UiDropdownItem',
    baseClass: 'ui-dropdown-item',
    props: dropdownItemBaseProps,
    defaultTag: 'li'
  })
  return createUiComponent(
    {
      ...base,
      setup: (props, context) => {
        const menu = context.inject(DROPDOWN_MENU_CONTEXT, null) as DropdownMenuContext | null
        const navKey = `ui-dropdown-item-nav-${dropdownItemNavSeed++}`
        let rootElement: HTMLElement | null = null
        // 鼠标点击同步 roving 停靠点，与键盘导航共用同一出口；走 DOM 监听避免覆盖项上的 onClick attrs
        const syncNav = () => {
          if (!props.disabled) {
            menu?.setNavId(navKey)
          }
        }
        onMounted(() => {
          rootElement = context.root.value as HTMLElement | null
          if (rootElement) {
            menu?.registerNav(navKey, rootElement)
            rootElement.addEventListener('click', syncNav)
          }
        })
        onBeforeUnmount(() => {
          rootElement?.removeEventListener('click', syncNav)
          rootElement = null
          menu?.unregisterNav(navKey)
        })
        // 禁用态翻转后兜底重选停靠点，否则整组可能从 Tab 序里消失
        watch(
          () => props.disabled,
          () => menu?.ensureNav()
        )
        return {
          // menuitem 只在菜单上下文里成立：孤立渲染时保留 li 原生语义，否则 axe 报 aria-required-parent
          inMenu: Boolean(menu),
          // roving tabindex：仅当前停靠项为 0，禁用项整体退出 Tab 序与键盘导航
          get tabindex() {
            if (!menu || props.disabled) {
              return undefined
            }
            return menu.navId() === navKey ? 0 : -1
          }
        }
      },
      classes: (props, state) => [...(base.classes?.(props, state) ?? []), props.divided ? 'is-divided' : ''],
      attrs: (props, state) => ({
        ...base.attrs?.(props, state),
        role: state.inMenu ? 'menuitem' : undefined,
        tabindex: state.tabindex,
        'aria-disabled': props.disabled ? 'true' : undefined
      }),
      content: (context) => [
        context.props.icon ? renderIcon(context.props.icon, { class: 'ui-dropdown-item__icon' }) : null,
        base.content?.(context) ?? null
      ]
    },
    features
  )
}

const dropdownMenuBaseProps = {}

export function createDropdownMenu(features: UiFeature[] = []) {
  return createUiComponent(
    wrapperConfig({
      name: 'UiDropdownMenu',
      baseClass: 'ui-dropdown-menu',
      props: dropdownMenuBaseProps,
      defaultTag: 'ul'
    }),
    features
  )
}
