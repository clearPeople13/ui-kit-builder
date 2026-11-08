import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tree, ConfigProvider } from '@ui-kit-full'
import { normalizeTreeNodes } from '../../packages/ui-kit/src/shared/tree'
import { canDropNode, moveNode, resolveDropType } from '../../packages/ui-kit/src/components/tree/features/draggable'

function dragEvent(
  type: string,
  init: { clientY?: number; dataTransfer?: Record<string, any>; relatedTarget?: EventTarget | null } = {}
) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  if (init.clientY !== undefined) {
    Object.defineProperty(event, 'clientY', { value: init.clientY })
  }
  if ('relatedTarget' in init) {
    Object.defineProperty(event, 'relatedTarget', { value: init.relatedTarget })
  }
  if (init.dataTransfer) {
    Object.defineProperty(event, 'dataTransfer', { value: init.dataTransfer })
  }
  return event as unknown as DragEvent
}

function stubRect(element: Element, top = 0, height = 100) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 100,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({})
  } as DOMRect)
}

/** findAll('input') 拿到的是 VueNode<Element>，勾选与半选态要按 HTMLInputElement 读 */
function inputOf(node: { element: Element }): HTMLInputElement {
  return node.element as HTMLInputElement
}

const treeData = [
  { id: 1, label: '一级 1', children: [{ id: 2, label: '二级 1-1' }] },
  { id: 3, label: '一级 2', children: [{ id: 4, label: '二级 2-1', children: [{ id: 5, label: '三级 2-1-1' }] }] }
]

function mountTree(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Tree, { props: { data: treeData, ...props }, slots, attachTo: document.body })
}

function nodes(wrapper: ReturnType<typeof mountTree>) {
  return wrapper.findAll('.ui-tree__node')
}

function nodeClasses(wrapper: ReturnType<typeof mountTree>) {
  return nodes(wrapper).map((node) => node.classes())
}

async function clickNode(wrapper: ReturnType<typeof mountTree>, index: number) {
  await nodes(wrapper)[index].find('.ui-tree__label').trigger('click')
  await nextTick()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Tree', () => {
  it('默认收起时只渲染根节点', async () => {
    const wrapper = mountTree()
    await nextTick()
    expect(wrapper.classes()).toContain('ui-tree')
    expect(nodes(wrapper)).toHaveLength(2)
    expect(wrapper.findAll('.ui-tree__label').map((item) => item.text())).toEqual(['一级 1', '一级 2'])
  })

  it('defaultExpandAll 展开全部并按层级缩进', async () => {
    const wrapper = mountTree({ defaultExpandAll: true })
    await nextTick()
    expect(nodes(wrapper)).toHaveLength(5)
    expect(nodeClasses(wrapper)).toEqual(
      Array.from({ length: 5 }, () => expect.arrayContaining(['ui-tree__node', 'is-expanded']))
    )
    expect(nodes(wrapper)[0].attributes('style')).toContain('padding-left: 4px')
    expect(nodes(wrapper)[1].attributes('style')).toContain('padding-left: 22px')
  })

  it('indent 自定义层级缩进', async () => {
    const wrapper = mountTree({ defaultExpandAll: true, indent: 30 })
    await nextTick()
    expect(nodes(wrapper)[1].attributes('style')).toContain('padding-left: 34px')
  })

  it('height 存在时挂 is-scrollable 并写容器高度', async () => {
    const wrapper = mountTree({ defaultExpandAll: true, height: 200 })
    await nextTick()
    expect(wrapper.classes()).toContain('is-scrollable')
    expect(wrapper.find('.ui-tree__nodes').attributes('style') ?? '').toContain('height: 200px')
  })

  it('defaultExpandedKeys 精确控制展开项', async () => {
    const wrapper = mountTree({ defaultExpandedKeys: [3] })
    await nextTick()
    expect(nodes(wrapper).map((item) => item.text())).toEqual(['一级 1', '一级 2', '二级 2-1'])
  })

  it('点击节点切换展开并抛出 node-expand', async () => {
    const wrapper = mountTree()
    await nextTick()
    await clickNode(wrapper, 0)
    expect(nodes(wrapper)).toHaveLength(3)
    expect(wrapper.emitted('node-expand')?.[0]).toEqual([treeData[0], true])
    await clickNode(wrapper, 0)
    expect(wrapper.emitted('node-expand')?.[1]).toEqual([treeData[0], false])
    expect(nodes(wrapper)).toHaveLength(2)
  })

  it('点击节点抛出 node-click 且带原始数据', async () => {
    const wrapper = mountTree()
    await nextTick()
    await clickNode(wrapper, 1)
    expect(wrapper.emitted('node-click')?.[0]).toEqual([treeData[1]])
  })

  it('点击展开图标只切换展开不触发 node-click', async () => {
    const wrapper = mountTree()
    await nextTick()
    await nodes(wrapper)[0].find('.ui-tree__expand').trigger('click')
    await nextTick()
    expect(nodes(wrapper)).toHaveLength(3)
    expect(wrapper.emitted('node-click')).toBeUndefined()
  })

  it('叶子节点使用占位展开符', async () => {
    const wrapper = mountTree({ defaultExpandAll: true })
    await nextTick()
    expect(nodes(wrapper)[1].find('.ui-tree__expand').classes()).toContain('is-leaf')
    expect(nodes(wrapper)[1].find('.ui-tree__expand').element.children).toHaveLength(0)
  })

  it('expandOnClickNode=false 时点击节点不展开', async () => {
    const wrapper = mountTree({ expandOnClickNode: false })
    await nextTick()
    await clickNode(wrapper, 0)
    expect(nodes(wrapper)).toHaveLength(2)
    expect(wrapper.emitted('node-click')).toHaveLength(1)
  })

  it('accordion 同时只展开一个分支', async () => {
    const wrapper = mountTree({ accordion: true })
    await nextTick()
    await clickNode(wrapper, 0)
    await clickNode(wrapper, wrapper.findAll('.ui-tree__node').length - 1)
    expect(nodes(wrapper).map((item) => item.text())).toEqual(['一级 1', '一级 2', '二级 2-1'])
    expect(nodeClasses(wrapper).filter((list) => list.includes('is-expanded'))).toHaveLength(1)
  })

  it('highlightCurrent 点击后标记 is-current', async () => {
    const wrapper = mountTree({ highlightCurrent: true })
    await nextTick()
    await clickNode(wrapper, 1)
    expect(nodeClasses(wrapper)[1]).toContain('is-current')
    expect(nodeClasses(wrapper)[0]).not.toContain('is-current')
  })

  it('currentNodeKey 初始高亮', async () => {
    const wrapper = mountTree({ highlightCurrent: true, currentNodeKey: 1 })
    await nextTick()
    expect(nodeClasses(wrapper)[0]).toContain('is-current')
  })

  it('props 映射自定义字段', async () => {
    const wrapper = mountTree({
      data: [
        { key: 'a', title: '甲', items: [{ key: 'a1', title: '甲一' }] },
        { key: 'b', title: '乙' }
      ],
      props: { label: 'title', children: 'items' },
      defaultExpandAll: true
    })
    await nextTick()
    expect(wrapper.findAll('.ui-tree__label').map((item) => item.text())).toEqual(['甲', '甲一', '乙'])
  })

  it('disabled 节点不高亮交互且复选框禁用', async () => {
    const wrapper = mountTree({
      data: [{ id: 1, label: '禁用', disabled: true, children: [{ id: 2, label: '子' }] }],
      showCheckbox: true
    })
    await nextTick()
    expect(nodeClasses(wrapper)[0]).toContain('is-disabled')
    await clickNode(wrapper, 0)
    expect(nodes(wrapper)).toHaveLength(1)
    expect(wrapper.emitted('node-expand')).toBeUndefined()
    expect(wrapper.find('.ui-tree__checkbox input').attributes('disabled')).toBeDefined()
  })

  it('勾选父节点级联子节点并抛出 check 事件', async () => {
    const wrapper = mountTree({ defaultExpandAll: true, showCheckbox: true })
    await nextTick()
    await wrapper.findAll('.ui-tree__checkbox input')[0].setValue(true)
    await nextTick()
    expect(wrapper.emitted('check-change')?.[0]).toEqual([treeData[0], true])
    expect(wrapper.emitted('update:checked-keys')?.[0]).toEqual([[1, 2]])
    expect(wrapper.findAll('.ui-tree__checkbox input').map((item) => inputOf(item).checked)).toEqual([
      true,
      true,
      false,
      false,
      false
    ])
  })

  it('部分勾选时父节点呈半选', async () => {
    const wrapper = mountTree({
      defaultExpandAll: true,
      showCheckbox: true,
      data: [
        {
          id: 1,
          label: '父',
          children: [
            { id: 2, label: '子一' },
            { id: 3, label: '子二' }
          ]
        }
      ]
    })
    await nextTick()
    await wrapper.findAll('.ui-tree__checkbox input')[1].setValue(true)
    await nextTick()
    const boxes = wrapper.findAll('.ui-tree__checkbox input')
    expect(inputOf(boxes[0]).indeterminate).toBe(true)
    expect(inputOf(boxes[0]).checked).toBe(false)
    expect(inputOf(boxes[1]).checked).toBe(true)
    await wrapper.findAll('.ui-tree__checkbox input')[2].setValue(true)
    await nextTick()
    expect(inputOf(wrapper.findAll('.ui-tree__checkbox input')[0]).indeterminate).toBe(false)
    expect(inputOf(wrapper.findAll('.ui-tree__checkbox input')[0]).checked).toBe(true)
  })

  it('checkStrictly 只影响自身', async () => {
    const wrapper = mountTree({ defaultExpandAll: true, showCheckbox: true, checkStrictly: true })
    await nextTick()
    await wrapper.findAll('.ui-tree__checkbox input')[0].setValue(true)
    await nextTick()
    expect(wrapper.emitted('update:checked-keys')?.[0]).toEqual([[1]])
    expect(wrapper.findAll('.ui-tree__checkbox input').map((item) => inputOf(item).checked)).toEqual([
      true,
      false,
      false,
      false,
      false
    ])
  })

  it('defaultCheckedKeys 初始化勾选', async () => {
    const wrapper = mountTree({ defaultExpandAll: true, showCheckbox: true, defaultCheckedKeys: [2] })
    await nextTick()
    expect(wrapper.findAll('.ui-tree__checkbox input').map((item) => inputOf(item).checked)).toEqual([
      true,
      true,
      false,
      false,
      false
    ])
  })

  it('checkOnClickNode 点击节点即勾选', async () => {
    const wrapper = mountTree({ showCheckbox: true, checkOnClickNode: true })
    await nextTick()
    await clickNode(wrapper, 0)
    expect(wrapper.emitted('check-change')?.[0]?.[1]).toBe(true)
    expect(inputOf(wrapper.findAll('.ui-tree__checkbox input')[0]).checked).toBe(true)
  })

  it('filter 默认按标签匹配并保留命中节点的父级', async () => {
    const wrapper = mountTree({ defaultExpandAll: true })
    await nextTick()
    ;(wrapper.vm as unknown as Record<string, any>).filter('二级 1-1')
    await nextTick()
    expect(wrapper.findAll('.ui-tree__label').map((item) => item.text())).toEqual(['一级 1', '二级 1-1'])
    ;(wrapper.vm as unknown as Record<string, any>).filter('')
    await nextTick()
    expect(nodes(wrapper)).toHaveLength(5)
  })

  it('filterNodeMethod 逐层判定，父级不命中则整枝隐藏', async () => {
    const wrapper = mountTree({
      defaultExpandAll: true,
      data: [
        { id: 1, label: '甲', keep: true, children: [{ id: 2, label: '甲一', keep: true }] },
        { id: 3, label: '乙', keep: false, children: [{ id: 4, label: '乙一', keep: true }] }
      ],
      filterNodeMethod: (_value: string, raw: { keep: boolean }) => Boolean(raw.keep)
    })
    await nextTick()
    ;(wrapper.vm as unknown as Record<string, any>).filter('keep')
    await nextTick()
    expect(wrapper.findAll('.ui-tree__label').map((item) => item.text())).toEqual(['甲', '甲一'])
  })

  it('setCheckedKeys 与 getCheckedNodes 对外接口', async () => {
    const wrapper = mountTree({ defaultExpandAll: true, showCheckbox: true })
    await nextTick()
    ;(wrapper.vm as unknown as Record<string, any>).setCheckedKeys([5])
    await nextTick()
    expect([...((wrapper.emitted('update:checked-keys')?.slice(-1)?.[0]?.[0] ?? []) as unknown[])].sort()).toEqual([
      3, 4, 5
    ])
    expect(wrapper.findAll('.ui-tree__checkbox input').map((item) => inputOf(item).checked)).toEqual([
      false,
      false,
      true,
      true,
      true
    ])
    expect((wrapper.vm as unknown as Record<string, any>).getCheckedNodes().length).toBe(3)
  })

  it('renderContent 自定义节点内容', async () => {
    const wrapper = mountTree({
      data: [{ id: 1, label: '甲' }],
      renderContent: (node: { label: string }) => h('em', { class: 'custom-node' }, `#${node.label}`)
    })
    await nextTick()
    expect(wrapper.find('.custom-node').text()).toBe('#甲')
  })

  it('default 插槽自定义节点内容，拿到 node/data/level 作用域并优先于 renderContent', async () => {
    const wrapper = mountTree(
      {
        data: [{ id: 1, label: '甲', children: [{ id: 2, label: '乙' }] }],
        defaultExpandAll: true,
        renderContent: (node: { label: string }) => h('em', { class: 'custom-node' }, `#${node.label}`)
      },
      {
        default: (scope: { node: { key: string }; data: { label: string }; level: number }) =>
          h('b', { class: 'slot-node' }, `${scope.level}:${scope.node.key}:${scope.data.label}`)
      }
    )
    await nextTick()
    const labels = wrapper.findAll('.ui-tree__label .slot-node').map((item) => item.text())
    expect(labels).toEqual(['0:1:甲', '1:2:乙'])
    expect(wrapper.find('.custom-node').exists()).toBe(false)
  })

  it('icon 自定义展开图标', async () => {
    const wrapper = mountTree({ icon: h('span', { class: 'my-icon' }) as unknown as Record<string, unknown> })
    await nextTick()
    expect(wrapper.find('.my-icon').exists()).toBe(true)
  })

  it('空数据渲染占位文案', async () => {
    expect(mountTree({ data: [] }).find('.ui-tree__empty').text()).toBe('暂无数据')
    expect(mountTree({ data: [], emptyText: '啥也没有' }).find('.ui-tree__empty').text()).toBe('啥也没有')
  })

  it('空数据文案走 ConfigProvider 注入的 locale，切换实时生效，未注入回退中文', async () => {
    const injected = mount(ConfigProvider, {
      props: { locale: { tree: { emptyText: 'Nothing here' } } },
      slots: { default: () => h(Tree, { data: [] }) },
      attachTo: document.body
    })
    await nextTick()
    expect(injected.find('.ui-tree__empty').text()).toBe('Nothing here')
    await injected.setProps({ locale: { tree: { emptyText: 'Changed' } } })
    expect(injected.find('.ui-tree__empty').text()).toBe('Changed')

    const fallback = mount(ConfigProvider, {
      props: { locale: { tree: {} } },
      slots: { default: () => h(Tree, { data: [] }) },
      attachTo: document.body
    })
    await nextTick()
    expect(fallback.find('.ui-tree__empty').text()).toBe('暂无数据')
  })

  it('非对象数组按字符串标签渲染', async () => {
    const wrapper = mountTree({ data: ['甲', '乙'] })
    await nextTick()
    expect(wrapper.findAll('.ui-tree__label').map((item) => item.text())).toEqual(['甲', '乙'])
    expect(nodes(wrapper)[0].attributes('style')).toContain('padding-left: 4px')
  })

  describe('键盘可操作', () => {
    /** 派发真实可取消的 keydown（走容器代理），返回事件以便断言 preventDefault */
    function pressKey(element: Element, key: string): KeyboardEvent {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      element.dispatchEvent(event)
      return event
    }

    function focusNode(node: { element: Element }) {
      ;(node.element as HTMLElement).focus()
    }

    function tabStopIndex(wrapper: ReturnType<typeof mountTree>) {
      return nodes(wrapper).findIndex((node) => node.attributes('tabindex') === '0')
    }

    it('整树单一 Tab 停靠点：首个可见节点 tabindex=0，其余 -1', async () => {
      const wrapper = mountTree({ defaultExpandAll: true })
      await nextTick()
      const all = nodes(wrapper)
      expect(all.filter((node) => node.attributes('tabindex') === '0')).toHaveLength(1)
      expect(all[0].attributes('tabindex')).toBe('0')
      expect(all.slice(1).every((node) => node.attributes('tabindex') === '-1')).toBe(true)
    })

    it('↓/↑ 在可见节点间移动焦点并同步 roving tabindex', async () => {
      const wrapper = mountTree({ defaultExpandAll: true })
      await nextTick()
      const all = nodes(wrapper)
      focusNode(all[0])
      const down = pressKey(all[0].element, 'ArrowDown')
      await nextTick()
      expect(down.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(nodes(wrapper)[1].element)
      expect(tabStopIndex(wrapper)).toBe(1)
      pressKey(nodes(wrapper)[1].element, 'ArrowUp')
      await nextTick()
      expect(document.activeElement).toBe(nodes(wrapper)[0].element)
      expect(tabStopIndex(wrapper)).toBe(0)
    })

    it('↓/↑ 跳过禁用节点且禁用节点没有 tabindex', async () => {
      const wrapper = mountTree({
        defaultExpandAll: true,
        data: [
          { id: 1, label: '甲', disabled: true, children: [{ id: 2, label: '子一' }] },
          { id: 3, label: '乙' }
        ]
      })
      await nextTick()
      const all = nodes(wrapper)
      expect(all[0].attributes('tabindex')).toBeUndefined()
      // 首停靠点落在首个非禁用节点
      expect(tabStopIndex(wrapper)).toBe(1)
      focusNode(all[2])
      pressKey(all[2].element, 'ArrowUp')
      await nextTick()
      // 跳过禁用的「甲」，落到「子一」
      expect(document.activeElement).toBe(nodes(wrapper)[1].element)
    })

    it('→ 展开已收起节点，已展开则进入第一个子节点', async () => {
      const wrapper = mountTree()
      await nextTick()
      const first = nodes(wrapper)[0]
      focusNode(first)
      const expand = pressKey(first.element, 'ArrowRight')
      await nextTick()
      expect(expand.defaultPrevented).toBe(true)
      expect(wrapper.emitted('node-expand')?.[0]).toEqual([treeData[0], true])
      expect(nodes(wrapper)).toHaveLength(3)
      // 焦点留在原节点，再次 → 进入第一个子节点
      expect(document.activeElement).toBe(nodes(wrapper)[0].element)
      pressKey(nodes(wrapper)[0].element, 'ArrowRight')
      await nextTick()
      expect(document.activeElement).toBe(nodes(wrapper)[1].element)
      expect(tabStopIndex(wrapper)).toBe(1)
    })

    it('← 收起已展开节点，已收起则回到父节点', async () => {
      const wrapper = mountTree({ defaultExpandedKeys: [1] })
      await nextTick()
      expect(nodes(wrapper)).toHaveLength(3)
      const parent = nodes(wrapper)[0]
      focusNode(parent)
      pressKey(parent.element, 'ArrowLeft')
      await nextTick()
      expect(wrapper.emitted('node-expand')?.[0]).toEqual([treeData[0], false])
      expect(nodes(wrapper)).toHaveLength(2)
      // 展开后 ← 从子节点回到父节点
      pressKey(nodes(wrapper)[0].element, 'ArrowRight')
      await nextTick()
      pressKey(nodes(wrapper)[1].element, 'ArrowLeft')
      await nextTick()
      expect(document.activeElement).toBe(nodes(wrapper)[0].element)
      expect(tabStopIndex(wrapper)).toBe(0)
    })

    it('Home/End 跳到首末可见节点', async () => {
      const wrapper = mountTree({ defaultExpandAll: true })
      await nextTick()
      const all = nodes(wrapper)
      focusNode(all[2])
      const end = pressKey(all[2].element, 'End')
      await nextTick()
      expect(end.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(nodes(wrapper)[4].element)
      expect(tabStopIndex(wrapper)).toBe(4)
      pressKey(nodes(wrapper)[4].element, 'Home')
      await nextTick()
      expect(document.activeElement).toBe(nodes(wrapper)[0].element)
      expect(tabStopIndex(wrapper)).toBe(0)
    })

    it('鼠标点击同步 roving 当前项', async () => {
      const wrapper = mountTree({ defaultExpandAll: true })
      await nextTick()
      await clickNode(wrapper, 2)
      expect(tabStopIndex(wrapper)).toBe(2)
      expect(nodes(wrapper)[0].attributes('tabindex')).toBe('-1')
    })

    it('showCheckbox 时容器层 roving 不抢 checkbox 的 Space', async () => {
      const wrapper = mountTree({ defaultExpandAll: true, showCheckbox: true })
      await nextTick()
      const first = nodes(wrapper)[0]
      focusNode(first)
      const box = first.find('input').element as HTMLInputElement
      const space = pressKey(box, ' ')
      await nextTick()
      expect(space.defaultPrevented).toBe(false)
      expect(box.checked).toBe(false)
      expect(wrapper.emitted('check-change')).toBeUndefined()
      // 焦点在 checkbox 内时方向键仍按所在节点导航
      const down = pressKey(box, 'ArrowDown')
      await nextTick()
      expect(down.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(nodes(wrapper)[1].element)
    })
  })

  describe('拖拽', () => {
    it('落点判定按纵向比例切三段，高度未知时按内部投放', () => {
      expect(resolveDropType(0, 0, 0)).toBe('inner')
      expect(resolveDropType(10, 0, 100)).toBe('prev')
      expect(resolveDropType(25, 0, 100)).toBe('inner')
      expect(resolveDropType(75, 0, 100)).toBe('inner')
      expect(resolveDropType(80, 0, 100)).toBe('next')
      expect(resolveDropType(110, 100, 100)).toBe('prev')
      expect(resolveDropType(190, 100, 100)).toBe('next')
    })

    it('canDropNode 拒绝未开启拖拽、自身、禁用目标、后代目标与 allowDrop=false', () => {
      const source = normalizeTreeNodes([{ id: 1, label: '甲', children: [{ id: 2, label: '甲一' }] }])[0]
      const disabled = normalizeTreeNodes([{ id: 3, label: '乙', disabled: true }])[0]
      const sibling = normalizeTreeNodes([{ id: 4, label: '丙' }])[0]

      expect(canDropNode(source, sibling, 'prev', { draggable: false })).toBe(false)
      expect(canDropNode(source, source, 'inner', { draggable: true })).toBe(false)
      expect(canDropNode(source, disabled, 'inner', { draggable: true })).toBe(false)
      expect(canDropNode(source, source.children[0], 'inner', { draggable: true })).toBe(false)
      expect(canDropNode(source, sibling, 'prev', { draggable: true, allowDrop: () => false })).toBe(false)
      expect(canDropNode(source, sibling, 'prev', { draggable: true, allowDrop: () => undefined })).toBe(true)
      expect(canDropNode(source, sibling, 'prev', { draggable: true })).toBe(true)
    })

    it('moveNode 支持 prev/next/inner，并重算层级与展开目标', () => {
      const make = () =>
        normalizeTreeNodes([
          { id: 1, label: '甲', children: [{ id: 2, label: '甲一' }] },
          { id: 3, label: '乙' }
        ])
      const expanded: Array<string | number> = []

      const next = make()
      expect(moveNode(next, next[1], next[0], 'prev', (key) => expanded.push(key))).toBe(true)
      expect(next.map((node) => node.key)).toEqual([3, 1])

      const prev = make()
      expect(moveNode(prev, prev[0], prev[1], 'next', (key) => expanded.push(key))).toBe(true)
      expect(prev.map((node) => node.key)).toEqual([3, 1])

      const inner = make()
      expect(moveNode(inner, inner[0], inner[1], 'inner', (key) => expanded.push(key))).toBe(true)
      expect(inner[0].key).toBe(3)
      expect(inner[0].children.map((node) => [node.key, node.level])).toEqual([[1, 1]])
      expect(inner[0].children[0].children.map((node) => [node.key, node.level])).toEqual([[2, 2]])
      expect(expanded).toEqual([3])
    })

    it('moveNode 源或目标不在树中时返回 false 且不改动', () => {
      const tree = normalizeTreeNodes([{ id: 1, label: '甲' }])
      const stranger = normalizeTreeNodes([{ id: 9, label: '外部' }])[0]
      expect(moveNode(tree, stranger, tree[0], 'prev', () => undefined)).toBe(false)
      expect(moveNode(tree, tree[0], stranger, 'next', () => undefined)).toBe(false)
      expect(tree.map((node) => node.key)).toEqual([1])
    })

    it('完整拖拽链路：dragstart → dragover → drop 抛事件并移动节点', async () => {
      const wrapper = mountTree({ draggable: true })
      await nextTick()
      const all = nodes(wrapper)
      const sourceEl = all[0].element as HTMLElement
      const targetEl = all[1].element as HTMLElement
      const dataTransfer = { effectAllowed: '', dropEffect: '', setData: vi.fn() }

      sourceEl.dispatchEvent(dragEvent('dragstart', { dataTransfer }))
      expect(sourceEl.classList.contains('is-drag-source')).toBe(true)
      expect(dataTransfer.effectAllowed).toBe('move')
      expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', '1')
      expect(wrapper.emitted('node-drag-start')?.[0]).toEqual([treeData[0]])

      stubRect(targetEl)
      targetEl.dispatchEvent(dragEvent('dragover', { clientY: 90, dataTransfer }))
      expect(dataTransfer.dropEffect).toBe('move')
      expect(targetEl.classList.contains('is-drop-next')).toBe(true)

      const drop = dragEvent('drop', { clientY: 90 })
      targetEl.dispatchEvent(drop)
      expect(drop.defaultPrevented).toBe(true)
      expect(wrapper.emitted('node-drop')?.[0]).toEqual([treeData[0], treeData[1], 'next'])
      expect(wrapper.emitted('node-drag-end')?.[0]).toEqual([treeData[0], treeData[1], 'next'])
      await nextTick()
      expect(wrapper.findAll('.ui-tree__label').map((item) => item.text())).toEqual(['一级 2', '一级 1'])
      expect(sourceEl.classList.contains('is-drag-source')).toBe(false)
    })

    it('内部投放把源节点挂到目标子级并展开目标', async () => {
      const wrapper = mountTree({ draggable: true })
      await nextTick()
      const all = nodes(wrapper)
      const targetEl = all[1].element as HTMLElement
      all[0].element.dispatchEvent(dragEvent('dragstart', { dataTransfer: { setData: vi.fn() } }))
      stubRect(targetEl)
      targetEl.dispatchEvent(dragEvent('dragover', { clientY: 50 }))
      expect(targetEl.classList.contains('is-drop-inner')).toBe(true)
      targetEl.dispatchEvent(dragEvent('drop', { clientY: 50 }))
      expect(wrapper.emitted('node-drop')?.[0]).toEqual([treeData[0], treeData[1], 'inner'])
      await nextTick()
      expect(wrapper.findAll('.ui-tree__label').map((item) => item.text())).toEqual(['一级 2', '二级 2-1', '一级 1'])
    })

    it('同节点/禁用目标/后代目标/allowDrop=false 都不落标记也不移动', async () => {
      const wrapper = mountTree({
        draggable: true,
        defaultExpandAll: true,
        allowDrop: (source: { id: number }, target: { id: number }) => target.id !== 4 && source.id !== 3
      })
      await nextTick()
      const all = nodes(wrapper)
      all[0].element.dispatchEvent(dragEvent('dragstart', { dataTransfer: { setData: vi.fn() } }))

      const self = all[0].element as HTMLElement
      stubRect(self)
      self.dispatchEvent(dragEvent('dragover', { clientY: 10 }))
      expect(self.classList.contains('is-drop-prev')).toBe(false)

      const descendant = all[1].element as HTMLElement
      stubRect(descendant)
      descendant.dispatchEvent(dragEvent('dragover', { clientY: 10 }))
      expect(descendant.className).not.toContain('is-drop-')

      const blocked = all[3].element as HTMLElement
      stubRect(blocked)
      blocked.dispatchEvent(dragEvent('dragover', { clientY: 50 }))
      expect(blocked.className).not.toContain('is-drop-')
      expect(wrapper.emitted('node-drop')).toBeUndefined()
    })

    it('allowDrag=false 或禁用节点不能开始拖拽', async () => {
      const blocked = mountTree({ draggable: true, allowDrag: () => false })
      await nextTick()
      const event = dragEvent('dragstart', { dataTransfer: { setData: vi.fn() } })
      nodes(blocked)[0].element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      expect(nodes(blocked)[0].classes()).not.toContain('is-drag-source')
      expect(blocked.emitted('node-drag-start')).toBeUndefined()

      const disabled = mountTree({
        draggable: true,
        data: [{ id: 1, label: '禁用', disabled: true }]
      })
      await nextTick()
      expect(nodes(disabled)[0].attributes('draggable')).toBeUndefined()
      expect(nodes(disabled)[0].attributes('data-tree-key')).toBeUndefined()
    })

    it('dragleave 移到节点内部保留标记，移出才清除；无 dataTransfer 不报错', async () => {
      const wrapper = mountTree({ draggable: true })
      await nextTick()
      const all = nodes(wrapper)
      const sourceEl = all[0].element as HTMLElement
      const targetEl = all[1].element as HTMLElement
      sourceEl.dispatchEvent(dragEvent('dragstart'))
      expect(sourceEl.classList.contains('is-drag-source')).toBe(true)

      stubRect(targetEl)
      targetEl.dispatchEvent(dragEvent('dragover', { clientY: 10 }))
      expect(targetEl.classList.contains('is-drop-prev')).toBe(true)
      const inner = targetEl.querySelector('.ui-tree__label') as HTMLElement
      targetEl.dispatchEvent(dragEvent('dragleave', { relatedTarget: inner }))
      expect(targetEl.classList.contains('is-drop-prev')).toBe(true)
      targetEl.dispatchEvent(dragEvent('dragleave'))
      expect(targetEl.classList.contains('is-drop-prev')).toBe(false)
    })

    it('没有拖拽源时的 dragover/drop/dragend 均为空操作', async () => {
      const wrapper = mountTree({ draggable: true })
      await nextTick()
      const targetEl = nodes(wrapper)[1].element as HTMLElement
      stubRect(targetEl)
      const over = dragEvent('dragover', { clientY: 10 })
      targetEl.dispatchEvent(over)
      expect(over.defaultPrevented).toBe(false)
      const drop = dragEvent('drop', { clientY: 10 })
      targetEl.dispatchEvent(drop)
      expect(drop.defaultPrevented).toBe(false)
      targetEl.dispatchEvent(dragEvent('dragend'))
      expect(wrapper.emitted('node-drop')).toBeUndefined()
      expect(wrapper.emitted('node-drag-end')).toBeUndefined()
    })

    it('dragend 在 drop 之前触发时补发 null 落点，且不重复触发', async () => {
      const wrapper = mountTree({ draggable: true })
      await nextTick()
      const sourceEl = nodes(wrapper)[0].element as HTMLElement
      sourceEl.dispatchEvent(dragEvent('dragstart', { dataTransfer: { setData: vi.fn() } }))
      sourceEl.dispatchEvent(dragEvent('dragend'))
      expect(wrapper.emitted('node-drag-end')?.[0]).toEqual([treeData[0], null, null])
      expect(sourceEl.classList.contains('is-drag-source')).toBe(false)
      sourceEl.dispatchEvent(dragEvent('dragend'))
      expect(wrapper.emitted('node-drag-end')).toHaveLength(1)
    })
  })
})
