import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { TreeV2 } from '@ui-kit-full'

function inputOf(node: { element: Element }): HTMLInputElement {
  return node.element as HTMLInputElement
}

const treeData = [
  { key: 1, label: '一级 1', children: [{ key: 2, label: '二级 1-1' }] },
  { key: 3, label: '一级 2' }
]

function mountTreeV2(props: Record<string, any> = {}) {
  return mount(TreeV2, { props: { data: treeData, ...props }, attachTo: document.body })
}

function nodes(wrapper: ReturnType<typeof mountTreeV2>) {
  return wrapper.findAll('.ui-tree-v2__node')
}

function labels(wrapper: ReturnType<typeof mountTreeV2>) {
  return wrapper.findAll('.ui-tree-v2__label').map((item) => item.text())
}

async function clickLabel(wrapper: ReturnType<typeof mountTreeV2>, index: number) {
  await nodes(wrapper)[index].find('.ui-tree-v2__label').trigger('click')
  await nextTick()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('TreeV2', () => {
  it('默认收起只渲染根节点', async () => {
    const wrapper = mountTreeV2()
    await nextTick()
    expect(wrapper.classes()).toContain('ui-tree-v2')
    expect(nodes(wrapper)).toHaveLength(2)
    expect(labels(wrapper)).toEqual(['一级 1', '一级 2'])
  })

  it('defaultExpandAll 展开全树并挂 is-expanded', async () => {
    const wrapper = mountTreeV2({ defaultExpandAll: true })
    await nextTick()
    expect(nodes(wrapper)).toHaveLength(3)
    expect(nodes(wrapper)[0].classes()).toContain('is-expanded')
  })

  it('defaultExpandedKeys 精确展开', async () => {
    const wrapper = mountTreeV2({ defaultExpandedKeys: [1] })
    await nextTick()
    expect(labels(wrapper)).toEqual(['一级 1', '二级 1-1', '一级 2'])
  })

  it('缩进为 level*indent+4，indent 可自定义', async () => {
    const wrapper = mountTreeV2({ defaultExpandAll: true, indent: 20 })
    await nextTick()
    expect(nodes(wrapper)[0].attributes('style') ?? '').toContain('padding-left: 4px')
    expect(nodes(wrapper)[1].attributes('style') ?? '').toContain('padding-left: 24px')
  })

  it('点击标签抛 node-click 且带原始数据', async () => {
    const wrapper = mountTreeV2()
    await nextTick()
    await clickLabel(wrapper, 1)
    expect(wrapper.emitted('node-click')?.[0]).toEqual([treeData[1]])
  })

  it('点击父节点标签同时抛 node-expand', async () => {
    const wrapper = mountTreeV2()
    await nextTick()
    await clickLabel(wrapper, 0)
    await nextTick()
    expect(wrapper.emitted('node-click')).toHaveLength(1)
    expect(wrapper.emitted('node-expand')?.[0]).toEqual([treeData[0], true])
    expect(nodes(wrapper)).toHaveLength(3)
  })

  it('expandOnClickNode=false 时点击标签不展开', async () => {
    const wrapper = mountTreeV2({ expandOnClickNode: false })
    await nextTick()
    await clickLabel(wrapper, 0)
    expect(nodes(wrapper)).toHaveLength(2)
    expect(wrapper.emitted('node-expand')).toBeUndefined()
  })

  it('点击展开图标切换展开且不触发 node-click', async () => {
    const wrapper = mountTreeV2()
    await nextTick()
    await nodes(wrapper)[0].find('.ui-tree-v2__expand').trigger('click')
    await nextTick()
    expect(nodes(wrapper)).toHaveLength(3)
    expect(wrapper.emitted('node-click')).toBeUndefined()
  })

  it('叶子节点使用占位展开符', async () => {
    const wrapper = mountTreeV2({ defaultExpandAll: true })
    await nextTick()
    expect(nodes(wrapper)[1].find('.ui-tree-v2__expand').classes()).toContain('is-leaf')
  })

  it('disabled 节点不高亮交互且不抛 node-click', async () => {
    const wrapper = mountTreeV2({ data: [{ key: 1, label: '禁用', disabled: true }] })
    await nextTick()
    expect(nodes(wrapper)[0].classes()).toContain('is-disabled')
    await clickLabel(wrapper, 0)
    expect(wrapper.emitted('node-click')).toBeUndefined()
  })

  it('showCheckbox 渲染复选框并挂 is-checkable', async () => {
    const wrapper = mountTreeV2({ defaultExpandAll: true, showCheckbox: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-checkable')
    expect(wrapper.findAll('.ui-tree-v2__checkbox input')).toHaveLength(3)
  })

  it('defaultCheckedKeys 初始化勾选', async () => {
    const wrapper = mountTreeV2({ defaultExpandAll: true, showCheckbox: true, defaultCheckedKeys: [2] })
    await nextTick()
    expect(wrapper.findAll('.ui-tree-v2__checkbox input').map((item) => inputOf(item).checked)).toEqual([
      false,
      true,
      false
    ])
  })

  it('勾选节点抛出 check-change', async () => {
    const wrapper = mountTreeV2({ defaultExpandAll: true, showCheckbox: true })
    await nextTick()
    await wrapper.findAll('.ui-tree-v2__checkbox input')[0].setValue(true)
    await nextTick()
    expect(wrapper.emitted('check-change')?.[0]).toEqual([treeData[0], true])
  })

  it('accordion 同时只展开一个分支', async () => {
    const wrapper = mountTreeV2({
      data: [
        { key: 1, label: '甲', children: [{ key: 11, label: '甲一' }] },
        { key: 2, label: '乙', children: [{ key: 21, label: '乙一' }] }
      ],
      accordion: true
    })
    await nextTick()
    await clickLabel(wrapper, 0)
    await clickLabel(wrapper, 2)
    const expanded = nodes(wrapper).filter((node) => node.classes().includes('is-expanded'))
    expect(expanded).toHaveLength(1)
  })

  it('highlightCurrent 点击后标记 is-current', async () => {
    const wrapper = mountTreeV2({ highlightCurrent: true, expandOnClickNode: false })
    await nextTick()
    await clickLabel(wrapper, 1)
    expect(nodes(wrapper)[1].classes()).toContain('is-current')
    expect(nodes(wrapper)[0].classes()).not.toContain('is-current')
  })

  it('props 映射自定义字段', async () => {
    const wrapper = mountTreeV2({
      data: [{ id: 'a', title: '甲', items: [{ id: 'a1', title: '甲一' }] }],
      props: { label: 'title', children: 'items' },
      defaultExpandAll: true
    })
    await nextTick()
    expect(labels(wrapper)).toEqual(['甲', '甲一'])
  })

  it('height 存在时挂 is-scrollable 并写容器高度', async () => {
    const wrapper = mountTreeV2({ defaultExpandAll: true, height: 200 })
    await nextTick()
    expect(wrapper.classes()).toContain('is-scrollable')
    expect(wrapper.find('.ui-tree-v2__nodes').attributes('style') ?? '').toContain('height: 200px')
  })

  it('空数据渲染占位文案', () => {
    expect(mountTreeV2({ data: [] }).find('.ui-tree-v2__empty').text()).toBe('暂无数据')
    expect(mountTreeV2({ data: [], emptyText: '啥也没有' }).find('.ui-tree-v2__empty').text()).toBe('啥也没有')
  })

  it('非数组数据按空树处理', () => {
    expect(mountTreeV2({ data: 'oops' as unknown as never[] }).findAll('.ui-tree-v2__node')).toHaveLength(0)
  })

  // WAI-ARIA Tree View 模式：tree/treeitem 角色、aria 属性同步、roving tabindex + 方向键
  describe('可访问性与键盘导航', () => {
    it('容器与节点挂 tree/treeitem 角色，aria-expanded 与展开态同步', async () => {
      const wrapper = mountTreeV2()
      await nextTick()
      expect(wrapper.find('.ui-tree-v2__nodes').attributes('role')).toBe('tree')
      const rows = nodes(wrapper)
      expect(rows.map((row) => row.attributes('role'))).toEqual(['treeitem', 'treeitem'])
      expect(rows[0].attributes('aria-expanded')).toBe('false')
      expect(rows[1].attributes('aria-expanded')).toBeUndefined()
      await rows[0].find('.ui-tree-v2__expand').trigger('click')
      await nextTick()
      expect(nodes(wrapper)[0].attributes('aria-expanded')).toBe('true')
    })

    it('aria-selected 与选中态同步，is-current 类名保持不变', async () => {
      const wrapper = mountTreeV2({ highlightCurrent: true, expandOnClickNode: false })
      await nextTick()
      await clickLabel(wrapper, 1)
      const rows = nodes(wrapper)
      expect(rows[1].attributes('aria-selected')).toBe('true')
      expect(rows[0].attributes('aria-selected')).toBe('false')
      expect(rows[1].classes()).toContain('is-current')
    })

    it('roving tabindex：仅首个可见节点 tabindex=0', async () => {
      const wrapper = mountTreeV2({ defaultExpandAll: true })
      await nextTick()
      expect(nodes(wrapper).map((row) => row.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    })

    it('ArrowDown/ArrowUp 在可见节点间循环移动焦点', async () => {
      const wrapper = mountTreeV2({ defaultExpandAll: true })
      await nextTick()
      await nodes(wrapper)[0].trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(document.activeElement).toBe(nodes(wrapper)[1].element)
      await nodes(wrapper)[1].trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect(document.activeElement).toBe(nodes(wrapper)[0].element)
      await nodes(wrapper)[0].trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      // 循环：首节点向上回到尾节点
      expect(document.activeElement).toBe(nodes(wrapper)[2].element)
    })

    it('ArrowRight 展开收起节点，已展开则下钻到第一个子节点', async () => {
      const wrapper = mountTreeV2()
      await nextTick()
      await nodes(wrapper)[0].trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(wrapper.emitted('node-expand')?.[0]).toEqual([treeData[0], true])
      expect(nodes(wrapper)[0].classes()).toContain('is-expanded')

      await nodes(wrapper)[0].trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(document.activeElement).toBe(nodes(wrapper)[1].element)
    })

    it('ArrowLeft 收起已展开节点，否则焦点回父级', async () => {
      const wrapper = mountTreeV2({ defaultExpandedKeys: [1] })
      await nextTick()
      await nodes(wrapper)[0].trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(document.activeElement).toBe(nodes(wrapper)[1].element)

      await nodes(wrapper)[1].trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      // 子节点无展开态，焦点回父级
      expect(document.activeElement).toBe(nodes(wrapper)[0].element)

      await nodes(wrapper)[0].trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      expect(wrapper.emitted('node-expand')?.[0]).toEqual([treeData[0], false])
      expect(nodes(wrapper)).toHaveLength(2)
    })

    it('Enter 选中节点并复用点击出口抛 node-click', async () => {
      const wrapper = mountTreeV2({ highlightCurrent: true, expandOnClickNode: false })
      await nextTick()
      await nodes(wrapper)[1].trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(wrapper.emitted('node-click')?.[0]).toEqual([treeData[1]])
      expect(nodes(wrapper)[1].classes()).toContain('is-current')
      expect(nodes(wrapper)[1].attributes('aria-selected')).toBe('true')
    })
  })
})
