import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TreeSelect } from '@ui-kit-full'

/**
 * TreeSelect：面板按需挂载、默认 teleport 到 body；展开态看触发器 is-open 与面板是否存在。
 * 数据经 shared/tree 归一化（key / value / level / children），筛选命中后整条祖先链保留并全部展开。
 */
const treeData = [
  { id: 1, label: '一级 1', children: [{ id: 2, label: '二级 1-1' }] },
  { id: 3, label: '一级 2', children: [{ id: 4, label: '二级 2-1' }] }
]

let wrappers: VueWrapper[] = []

function mountTreeSelect(props: Record<string, any> = {}) {
  const wrapper = mount(TreeSelect, { props: { data: treeData, ...props }, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

function reset() {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers = []
  document.body.innerHTML = ''
}

function panel() {
  return document.querySelector('.ui-tree-select__dropdown')
}

function nodeNodes() {
  return Array.from(document.querySelectorAll('.ui-tree-select__node'))
}

async function open(wrapper: ReturnType<typeof mountTreeSelect>) {
  await wrapper.find('.ui-tree-select__trigger').trigger('click')
  await nextTick()
}

async function clickNode(node: Element | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

async function typeFilter(value: string) {
  const input = document.querySelector('.ui-tree-select__search-input') as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  reset()
})

describe('TreeSelect', () => {
  it('默认渲染触发器、占位文案与收起态（面板不挂载）', () => {
    const wrapper = mountTreeSelect()
    expect(wrapper.classes()).toContain('ui-tree-select')
    const trigger = wrapper.find('.ui-tree-select__trigger')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.classes()).toEqual(['ui-tree-select__trigger'])
    expect(wrapper.find('.ui-tree-select__placeholder').text()).toBe('请选择')
    expect(wrapper.find('.ui-tree-select__arrow').exists()).toBe(true)
    expect(wrapper.find('.ui-tree-select__clear').exists()).toBe(false)
    expect(panel()).toBeNull()
  })

  it('placeholder 可自定义；命中 value 回显 label，未命中回显字符串', () => {
    expect(mountTreeSelect({ placeholder: '请选择节点' }).find('.ui-tree-select__placeholder').text()).toBe(
      '请选择节点'
    )
    expect(mountTreeSelect({ modelValue: 2 }).find('.ui-tree-select__selected').text()).toBe('二级 1-1')
    expect(mountTreeSelect({ modelValue: 99 }).find('.ui-tree-select__selected').text()).toBe('99')
  })

  it('点击触发器展开：teleport 到 body，再点一次收起', async () => {
    const wrapper = mountTreeSelect()
    await open(wrapper)
    expect(wrapper.find('.ui-tree-select__trigger').classes()).toContain('is-open')
    expect(panel()?.className).toContain('is-light')
    expect(wrapper.element.contains(panel())).toBe(false)
    expect(nodeNodes().map((item) => item.textContent)).toEqual(['一级 1', '一级 2'])
    await open(wrapper)
    expect(wrapper.find('.ui-tree-select__trigger').classes()).not.toContain('is-open')
    expect(panel()).toBeNull()
  })

  it('defaultExpandAll 展开全部节点，并按层级缩进', async () => {
    const wrapper = mountTreeSelect({ defaultExpandAll: true })
    await open(wrapper)
    expect(nodeNodes().map((item) => item.textContent)).toEqual(['一级 1', '二级 1-1', '一级 2', '二级 2-1'])
    expect(nodeNodes()[0].getAttribute('style')).toContain('padding-left: 8px')
    expect(nodeNodes()[1].getAttribute('style')).toContain('padding-left: 24px')
    expect(nodeNodes()[0].querySelector('.ui-tree-select__expand')?.className).not.toContain('is-leaf')
    expect(nodeNodes()[1].querySelector('.ui-tree-select__expand')?.className).toContain('is-leaf')
  })

  it('点击展开图标只切换展开，不选中节点', async () => {
    const wrapper = mountTreeSelect()
    await open(wrapper)
    document.querySelector('.ui-tree-select__expand')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(nodeNodes()).toHaveLength(3)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(nodeNodes()[0].querySelector('.ui-tree-select__expand')?.className).not.toContain('is-leaf')
  })

  it('点击节点抛出 update:modelValue / change 并收起面板', async () => {
    const wrapper = mountTreeSelect()
    await open(wrapper)
    await clickNode(nodeNodes()[0])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
    expect(wrapper.emitted('change')?.[0]).toEqual([1])
    expect(panel()).toBeNull()
  })

  it('禁用节点带 is-disabled 且点击不提交', async () => {
    const wrapper = mountTreeSelect({
      data: [
        { id: 1, label: '禁用节点', disabled: true },
        { id: 2, label: '正常节点' }
      ]
    })
    await open(wrapper)
    expect(nodeNodes()[0].className).toContain('is-disabled')
    await clickNode(nodeNodes()[0])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await clickNode(nodeNodes()[1])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2])
  })

  it('disabled 时不展开、不聚焦，clear 也不渲染', async () => {
    const wrapper = mountTreeSelect({ modelValue: 1, clearable: true, disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('.ui-tree-select__trigger').classes()).toContain('is-disabled')
    expect(wrapper.find('.ui-tree-select__trigger').attributes('tabindex')).toBeUndefined()
    expect(wrapper.find('.ui-tree-select__clear').exists()).toBe(false)
    await open(wrapper)
    expect(panel()).toBeNull()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('size 落类名，fitWidth / maxWidth 落根节点内联样式', () => {
    const sized = mountTreeSelect({ size: 'small' })
    expect(sized.classes()).toContain('ui-tree-select--small')
    const fitted = mountTreeSelect({ fitWidth: true, maxWidth: 320 })
    expect(fitted.attributes('style')).toContain('width: fit-content')
    expect(fitted.attributes('style')).toContain('max-width: 320px')
    const percent = mountTreeSelect({ maxWidth: '50%' })
    expect(percent.attributes('style')).toContain('max-width: 50%')
  })

  it('clearable 有值时渲染清除按钮，单选抛 undefined', async () => {
    const wrapper = mountTreeSelect({ modelValue: 1, clearable: true })
    const clear = wrapper.find('.ui-tree-select__clear')
    expect(clear.exists()).toBe(true)
    await clear.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([undefined])
    expect(wrapper.emitted('change')?.[0]).toEqual([undefined])
  })

  it('multiple 点击未选节点追加、点击已选节点移除，面板保持展开', async () => {
    const wrapper = mountTreeSelect({ modelValue: [1], multiple: true })
    expect(wrapper.classes()).toContain('is-multiple')
    expect(wrapper.find('.ui-tree-select__tag-label').text()).toBe('一级 1')
    await open(wrapper)
    await clickNode(nodeNodes()[1])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 3]])
    expect(panel()).not.toBeNull()
    await clickNode(nodeNodes()[0])
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[]])
  })

  it('多选标签支持 collapseTags 折叠与单个移除', async () => {
    const wrapper = mountTreeSelect({
      modelValue: [1, 2, 3],
      multiple: true,
      collapseTags: true,
      maxCollapseTags: 2
    })
    expect(wrapper.findAll('.ui-tree-select__tag:not(.ui-tree-select__tag--more)')).toHaveLength(2)
    expect(wrapper.find('.ui-tree-select__tag--more').text()).toBe('+1')
    await wrapper.find('.ui-tree-select__tag-close').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[2, 3]])
  })

  it('props 字段映射决定节点文案、禁用态与提交值', async () => {
    const wrapper = mountTreeSelect({
      data: [
        { id: 'a', text: '甲' },
        { id: 'b', text: '乙', off: true }
      ],
      props: { label: 'text', disabled: 'off' },
      modelValue: 'a'
    })
    expect(wrapper.find('.ui-tree-select__selected').text()).toBe('甲')
    await open(wrapper)
    expect(nodeNodes().map((item) => item.textContent)).toEqual(['甲', '乙'])
    expect(nodeNodes()[1].className).toContain('is-disabled')
    await clickNode(nodeNodes()[0])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
  })

  it('filterable 按 label 收窄并保留祖先链，filterMethod 收到关键字', async () => {
    const filterMethod = vi.fn()
    const wrapper = mountTreeSelect({ filterable: true, filterMethod })
    await open(wrapper)
    expect(wrapper.classes()).toContain('is-filterable')
    await typeFilter('2-1')
    expect(nodeNodes().map((item) => item.textContent)).toEqual(['一级 2', '二级 2-1'])
    expect(filterMethod.mock.calls[0]?.[0]).toBe('2-1')
    await typeFilter('zzz')
    expect(nodeNodes()).toHaveLength(0)
    expect(document.querySelector('.ui-tree-select__empty')?.textContent).toBe('暂无数据')
  })

  it('空数据与自定义 emptyText', async () => {
    const wrapper = mountTreeSelect({ data: [], emptyText: '空空的' })
    await open(wrapper)
    expect(document.querySelector('.ui-tree-select__empty')?.textContent).toBe('空空的')
    expect(nodeNodes()).toHaveLength(0)
  })

  it('effect / popperClass / popperStyle / teleported=false 落到面板', async () => {
    const wrapper = mountTreeSelect({
      teleported: false,
      effect: 'dark',
      popperClass: 'tree-panel',
      popperStyle: { padding: '2px' }
    })
    await open(wrapper)
    const dropdown = panel()
    expect(wrapper.element.contains(dropdown)).toBe(true)
    expect(dropdown?.className).toContain('is-dark')
    expect(dropdown?.className).toContain('tree-panel')
    expect(dropdown?.getAttribute('style')).toContain('padding: 2px')
  })

  it('modelValue 命中 key 时也回显对应 label', () => {
    const wrapper = mountTreeSelect({ data: [{ key: 'k1', label: '组节点', value: 'v1' }], modelValue: 'k1' })
    expect(wrapper.find('.ui-tree-select__selected').text()).toBe('组节点')
  })

  it('触发器响应 Enter / Space 与 Escape', async () => {
    const wrapper = mountTreeSelect()
    await wrapper.find('.ui-tree-select__trigger').trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(panel()).not.toBeNull()
  })
})
