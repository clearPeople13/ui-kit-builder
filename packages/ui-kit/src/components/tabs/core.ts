import type { VNode } from 'vue'
import { h, onBeforeUnmount, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

interface TabPaneMeta {
  name: string | number
  label: string
  disabled: boolean
  closable: boolean
}

// F-99：标记 TabPane 组件类型，Tabs 据此从 default slot 的 VNode 声明式推导页签元数据，
// 不再依赖子组件 setup 注册（注册晚于父级首渲，SSR 输出里页签栏为空）
const TAB_PANE_MARKER = Symbol('ui-tab-pane')

function isTabPaneVNode(vnode: unknown): vnode is VNode {
  return (
    typeof vnode === 'object' &&
    vnode !== null &&
    typeof (vnode as VNode).type === 'object' &&
    (vnode as VNode).type !== null &&
    Boolean(((vnode as VNode).type as unknown as Record<symbol, unknown>)[TAB_PANE_MARKER])
  )
}

interface TabsContext {
  active: () => string | number
  setActive: (name: string | number) => void
  register: (pane: TabPaneMeta) => void
  unregister: (name: string | number) => void
  isRemoved: (name: string | number) => boolean
}

const TABS_CONTEXT = Symbol('ui-tabs-context')
let paneSeed = 0

const tabPaneBaseProps = {
  type: { type: String, default: '' },
  disabled: { type: Boolean },
  stretch: { type: Boolean },
  tabindex: { type: [String, Number] },
  label: { type: String, default: '' },
  name: { type: [String, Number] }
}

export function createTabPane(features: UiFeature[] = []) {
  const component = createUiComponent(
    {
      name: 'UiTabPane',
      baseClass: 'ui-tab-pane',
      props: tabPaneBaseProps,
      setup(props, { inject }) {
        const context = inject(TABS_CONTEXT, null) as TabsContext | null
        const fallbackName = `pane-${(paneSeed += 1)}`
        const name = props.name ?? props.label ?? fallbackName
        const meta: TabPaneMeta = {
          name,
          label: props.label || String(name),
          disabled: Boolean(props.disabled),
          closable: Boolean(props.closable)
        }
        context?.register(meta)
        watch(
          () => [props.label, props.disabled, props.closable],
          () =>
            context?.register({
              ...meta,
              label: props.label || String(name),
              disabled: Boolean(props.disabled),
              closable: Boolean(props.closable)
            })
        )
        onBeforeUnmount(() => context?.unregister(name))
        const everActive = ref(false)
        watch(
          () => context?.active(),
          (value) => {
            if (value !== undefined && String(value) === String(name)) {
              everActive.value = true
            }
          },
          { immediate: true }
        )
        return {
          paneName: name,
          get isActive() {
            return context ? String(context.active()) === String(name) : true
          },
          get shouldRender() {
            if (context?.isRemoved(name)) {
              return false
            }
            return !props.lazy || everActive.value || (context ? String(context.active()) === String(name) : true)
          }
        }
      },
      classes: (props) => [props.disabled ? 'is-disabled' : ''],
      content: ({ props, slots, state }) => {
        if (!state.shouldRender) {
          return null
        }
        return h(
          'div',
          {
            class: 'ui-tab-pane__content',
            style: state.isActive ? undefined : { display: 'none' }
          },
          [slots.default?.() ?? props.label ?? null]
        )
      }
    },
    features
  )
  ;(component as unknown as Record<symbol, boolean>)[TAB_PANE_MARKER] = true
  return component
}

const tabsBaseProps = {
  type: { type: String, default: '' },
  modelValue: { type: [String, Number] },
  defaultValue: { type: [String, Number] },
  tabPosition: { type: String, default: 'top' },
  stretch: { type: Boolean },
  tabindex: { type: [String, Number], default: 0 }
}

export function createTabs(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTabs',
      baseClass: 'ui-tabs',
      props: tabsBaseProps,
      setup(props, { emit, provide }) {
        const panes = ref<TabPaneMeta[]>([])
        const active = ref<string | number>(props.modelValue ?? props.defaultValue ?? '')
        const removed = ref<Set<string>>(new Set())
        // 每轮渲染由 content 用 default slot 的 VNode 同步；键盘导航等渲染外路径也读这份快照
        let slotPanes: TabPaneMeta[] = []

        watch(
          () => props.modelValue,
          (value) => {
            if (value !== undefined) {
              active.value = value
            }
          }
        )

        function commit(name: string | number) {
          active.value = name
          emit('update:modelValue', name)
          emit('tab-change', name)
          emit('tab-click', name)
        }

        function setActive(name: string | number) {
          if (String(active.value) === String(name)) {
            return
          }
          // beforeLeave 支持 Promise 与 false 两种拦截写法；未声明时走同步提交，
          // 保持"点击即抛事件"的时序不被多一次微任务推迟
          if (typeof props.beforeLeave === 'function') {
            let result: unknown
            try {
              result = props.beforeLeave(active.value, name)
            } catch {
              return
            }
            if (result === false) {
              return
            }
            if (result && typeof (result as Promise<unknown>).then === 'function') {
              ;(result as Promise<unknown>).then(
                () => commit(name),
                () => undefined
              )
              return
            }
          }
          commit(name)
        }

        // F-99：从 default slot 的 VNode 声明式推导页签元数据（label/disabled/name/closable）。
        // 子组件注册晚于父级首渲，SSR 里注册拿不到首渲，导航必须由 VNode 推导。
        // 未命名页签就地补一个基于 slot 序号的确定性 fallback name（写回 vnode.props 副本，
        // 子组件 setup 解析 props 时拿到同一个 name，SSR 与客户端 hydrate 输出逐字一致）。
        function readSlotPanes(vnodes: VNode[] | null): TabPaneMeta[] {
          const list: TabPaneMeta[] = []
          for (const vnode of vnodes ?? []) {
            if (!isTabPaneVNode(vnode)) {
              continue
            }
            const raw = { ...((vnode.props ?? {}) as Record<string, unknown>) }
            let name = (raw.name ?? raw.label ?? null) as string | number | null
            if (name === null) {
              name = `pane-${list.length}`
              vnode.props = { ...(vnode.props ?? {}), name }
            }
            list.push({
              name,
              label: (raw.label as string) || String(name),
              disabled: Boolean(raw.disabled),
              closable: Boolean(raw.closable)
            })
          }
          return list
        }

        function register(pane: TabPaneMeta) {
          const index = panes.value.findIndex((item) => String(item.name) === String(pane.name))
          if (index >= 0) {
            const next = [...panes.value]
            next[index] = pane
            panes.value = next
            return
          }
          panes.value = [...panes.value, pane]
          if (active.value === '' && pane.name !== undefined) {
            active.value = pane.name
          }
        }

        function unregister(name: string | number) {
          panes.value = panes.value.filter((item) => String(item.name) !== String(name))
        }

        function isRemoved(name: string | number) {
          return removed.value.has(String(name))
        }

        function removeTab(name: string | number) {
          const key = String(name)
          if (removed.value.has(key)) {
            return
          }
          const index = panes.value.findIndex((item) => String(item.name) === key)
          const nextRemoved = new Set(removed.value)
          nextRemoved.add(key)
          removed.value = nextRemoved
          unregister(name)
          if (String(active.value) === key) {
            const remaining = panes.value.filter((item) => !isRemoved(item.name))
            const fallback = remaining[Math.min(index, remaining.length - 1)]
            active.value = fallback?.name ?? ''
            emit('update:modelValue', active.value)
            emit('tab-change', active.value)
          }
          emit('tab-remove', name)
          emit('edit', name, 'remove')
        }

        function addTab() {
          emit('tab-add')
          emit('edit', undefined, 'add')
        }

        // 导航按钮与页签元数据按渲染顺序一一对应（含禁用项），直接共享下标。
        // 可见列表 = slot 推导（首渲唯一来源）+ 子组件注册（hydrate 后的运行时补充），
        // 按 name 去重（slot 推导优先），再剔除已关闭项
        function visiblePaneList(): TabPaneMeta[] {
          const list: TabPaneMeta[] = []
          const seen = new Set<string>()
          for (const pane of [...slotPanes, ...panes.value]) {
            const key = String(pane.name)
            if (seen.has(key) || isRemoved(pane.name)) {
              continue
            }
            seen.add(key)
            list.push(pane)
          }
          return list
        }

        // WAI-ARIA Tabs 自动激活模式：方向键移动焦点即激活目标页签，与 click 行为走同一 setActive 出口
        function activateNavTarget(index: number, items: HTMLElement[]) {
          const pane = visiblePaneList()[index]
          if (!pane || pane.disabled) {
            return
          }
          setActive(pane.name)
          items[index]?.focus({ preventScroll: true })
        }

        function handleNavKeydown(event: KeyboardEvent) {
          const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
          if (!keys.includes(event.key)) {
            return
          }
          const nav = event.currentTarget as HTMLElement
          const items = Array.from(nav.querySelectorAll<HTMLElement>('.ui-tabs__nav-item'))
          const list = visiblePaneList()
          if (!items.length || !list.length) {
            return
          }
          const enabledIndex = (index: number) => index >= 0 && index < list.length && !list[index].disabled
          const target = (event.target as HTMLElement | null)?.closest('.ui-tabs__nav-item')
          const currentIndex = target ? items.indexOf(target as HTMLElement) : -1
          event.preventDefault()
          if (event.key === 'Home' || event.key === 'End') {
            const step = event.key === 'Home' ? 1 : -1
            const edge = event.key === 'Home' ? 0 : list.length - 1
            // Home/End 跳到首/尾可用页签
            for (let offset = 0; offset < list.length; offset += 1) {
              const index = (edge + step * offset + list.length * offset) % list.length
              if (enabledIndex(index)) {
                activateNavTarget(index, items)
                return
              }
            }
            return
          }
          const step = event.key === 'ArrowRight' ? 1 : -1
          const from =
            currentIndex >= 0 ? currentIndex : items.findIndex((item) => item.classList.contains('is-active'))
          if (from < 0) {
            return
          }
          // 循环移动焦点并跳过禁用页签
          for (let offset = 1; offset <= list.length; offset += 1) {
            const index = (from + step * offset + list.length * offset) % list.length
            if (enabledIndex(index)) {
              activateNavTarget(index, items)
              return
            }
          }
        }

        provide(TABS_CONTEXT, {
          active: () => active.value,
          setActive,
          register,
          unregister,
          isRemoved
        })

        return {
          setActive,
          register,
          unregister,
          removeTab,
          addTab,
          isRemoved,
          handleNavKeydown,
          get editable() {
            return Boolean(props.editable || props.addable)
          },
          get activeName() {
            return active.value
          },
          get paneList(): TabPaneMeta[] {
            return visiblePaneList()
          },
          // content 每轮渲染用它同步 slot 推导快照，导航与键盘导航共享同一份顺序。
          // 未受控（无 modelValue/defaultValue）时首渲直接把激活项落到第一个页签：
          // 在渲染期推导而非 setup 里调 slot（Vue 会对 setup 期调 slot 发告警），
          // 服务端与客户端首帧走同一条路径，SSR 输出与 hydrate 逐字一致
          syncSlotPanes(vnodes: VNode[] | null): TabPaneMeta[] {
            slotPanes = readSlotPanes(vnodes)
            const list = visiblePaneList()
            if (active.value === '') {
              const first = list[0]
              if (first && first.name !== '') {
                active.value = first.name
              }
            }
            return list
          }
        }
      },
      classes: (props) => [
        props.type ? `ui-tabs--${props.type}` : '',
        props.tabPosition ? `is-${props.tabPosition}` : '',
        props.stretch ? 'is-stretch' : ''
      ],
      content: ({ props, slots, state }) => {
        const tabsClosable = Boolean(props.closable || props.editable || props.addable)
        // 页签 VNode 只取一次：导航元数据由它声明式推导（F-99，SSR 首渲即有页签栏），
        // 同一批 VNode 继续作为面板内容渲染，保证两侧是同一对象
        const paneVNodes = (slots.default?.() ?? null) as VNode[] | null
        const navPanes = state.syncSlotPanes(paneVNodes)
        const nav = h(
          'div',
          {
            class: 'ui-tabs__nav',
            role: 'tablist',
            onKeydown: state.handleNavKeydown
          },
          [
            ...navPanes.map((pane: TabPaneMeta) =>
              h(
                'button',
                {
                  key: String(pane.name),
                  type: 'button',
                  role: 'tab',
                  'aria-selected': String(state.activeName) === String(pane.name) ? 'true' : 'false',
                  class: [
                    'ui-tabs__nav-item',
                    String(state.activeName) === String(pane.name) ? 'is-active' : '',
                    pane.disabled ? 'is-disabled' : ''
                  ],
                  // roving tabindex：仅激活页签留在 Tab 序里，其余页签只靠方向键到达（WAI-ARIA Tabs）
                  tabindex: String(state.activeName) === String(pane.name) ? Number(props.tabindex ?? 0) : -1,
                  onClick: () => {
                    if (!pane.disabled) {
                      state.setActive(pane.name)
                    }
                  }
                },
                [
                  pane.label,
                  (pane.closable || tabsClosable) && !pane.disabled
                    ? h(
                        'span',
                        {
                          class: 'ui-tabs__nav-close',
                          role: 'button',
                          'aria-label': `关闭 ${pane.label}`,
                          onClick: (event: MouseEvent) => {
                            event.stopPropagation()
                            state.removeTab(pane.name)
                          }
                        },
                        '×'
                      )
                    : null
                ]
              )
            ),
            state.editable
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'ui-tabs__nav-add',
                    'aria-label': '新增标签',
                    onClick: () => state.addTab()
                  },
                  '+'
                )
              : null
          ]
        )
        return [nav, h('div', { class: 'ui-tabs__content' }, [paneVNodes])]
      }
    },
    features
  )
}
