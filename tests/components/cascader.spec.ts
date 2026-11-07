import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Cascader } from '@ui-kit-full'

/**
 * Cascader 级联选择器：面板 teleport 到 body，关闭时若 persistent 仍在 DOM 里（display:none）。
 * 组件是非受控的，选中后必须靠 setProps 回灌 modelValue 才能断言回显。
 */
const tree = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州' },
      { value: 'nb', label: '宁波' }
    ]
  },
  { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] }
]

let wrappers: any[] = []

const mountCascader = (props: Record<string, unknown> = {}) => {
  const wrapper = mount(Cascader, { props, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

/** 卸载全部实例并清空 body，避免读到上一个实例 teleport 出去的面板 */
const reset = () => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
}

const panel = () => document.querySelector('.ui-cascader__dropdown')
const nodesOf = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-cascader__node'))
const columnsOf = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-cascader__column'))

const click = async (el: Element | null | undefined) => {
  el?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

const openByClick = async (wrapper: any) => {
  await wrapper.find('.ui-cascader__trigger').trigger('click')
  await nextTick()
}

describe('Cascader', () => {
  afterEach(() => {
    reset()
    vi.useRealTimers()
  })

  it('默认渲染触发器与常驻面板，结构类名是常量钩子', () => {
    const wrapper = mountCascader({ options: tree })
    expect(wrapper.classes()).toContain('ui-cascader')
    expect(wrapper.classes()).toContain('ui-cascader--clearable')
    expect(wrapper.classes()).toContain('ui-cascader--popper')
    expect(wrapper.classes()).toContain('ui-cascader--virtualized')
    expect(wrapper.classes()).toContain('ui-cascader--format')
    const trigger = wrapper.find('.ui-cascader__trigger')
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.ui-cascader__placeholder').text()).toBe('请选择')
    expect(wrapper.find('.ui-cascader__arrow').exists()).toBe(true)
    expect(wrapper.find('.ui-cascader__clear').exists()).toBe(false)
    // persistent 默认为 true：未展开时面板仍在 DOM，只是 display:none
    expect(panel()).not.toBeNull()
    expect(panel()?.getAttribute('style')).toContain('display: none')
  })

  it('size / disabled 落到 is-size-* / is-disabled 类，禁用时不可聚焦', async () => {
    const sized = mountCascader({ options: tree, size: 'small' })
    expect(sized.classes()).toContain('is-size-small')

    reset()
    const disabled = mountCascader({ options: tree, disabled: true, modelValue: ['zj', 'hz'], clearable: true })
    expect(disabled.classes()).toContain('is-disabled')
    expect(disabled.find('.ui-cascader__trigger').attributes('tabindex')).toBeUndefined()
    expect(disabled.find('.ui-cascader__clear').exists()).toBe(false)
    await disabled.find('.ui-cascader__trigger').trigger('click')
    await nextTick()
    expect(disabled.classes()).not.toContain('is-open')
    expect(disabled.emitted('visible-change')).toBeUndefined()
  })

  it('fitWidth / maxWidth / height 写入根节点与列容器', async () => {
    const wrapper = mountCascader({ options: tree, fitWidth: true, maxWidth: 240, height: 160 })
    expect(wrapper.attributes('style')).toContain('width: fit-content')
    expect(wrapper.attributes('style')).toContain('max-width: 240px')
    await openByClick(wrapper)
    expect(columnsOf()[0].style.maxHeight).toBe('160px')
    expect(panel()?.className).toContain('ui-floating-panel')
    expect(panel()?.className).toContain('is-light')
  })

  it('点击展开后逐级下钻，抛 expand-change / change / visible-change', async () => {
    const wrapper = mountCascader({ options: tree })
    await openByClick(wrapper)
    expect(wrapper.classes()).toContain('is-open')
    expect(wrapper.find('.ui-cascader__trigger').attributes('aria-expanded')).toBe('true')
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([true])
    expect(columnsOf()).toHaveLength(1)
    expect(nodesOf().map((n) => n.textContent)).toEqual(['浙江', '江苏'])

    await click(nodesOf()[0])
    expect(columnsOf()).toHaveLength(2)
    expect(wrapper.emitted('expand-change')?.at(-1)).toEqual([['zj']])
    expect(nodesOf()[0].className).toContain('is-active')

    await click(nodesOf()[2])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['zj', 'hz']])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([['zj', 'hz']])
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
    expect(wrapper.classes()).not.toContain('is-open')
  })

  it('默认回显完整路径，separator / showAllLevels 影响文案', async () => {
    const full = mountCascader({ options: tree, modelValue: ['zj', 'hz'] })
    expect(full.find('.ui-cascader__selected').text()).toBe('浙江 / 杭州')

    reset()
    const last = mountCascader({ options: tree, modelValue: ['zj', 'hz'], showAllLevels: false })
    expect(last.find('.ui-cascader__selected').text()).toBe('杭州')

    reset()
    const custom = mountCascader({ options: tree, modelValue: ['zj', 'hz'], separator: '->' })
    expect(custom.find('.ui-cascader__selected').text()).toBe('浙江->杭州')

    reset()
    const unknown = mountCascader({ options: tree, modelValue: ['nope'] })
    expect(unknown.find('.ui-cascader__value').text()).toBe('nope')

    reset()
    const empty = mountCascader({ options: tree, placeholder: '请选择地区' })
    expect(empty.find('.ui-cascader__placeholder').text()).toBe('请选择地区')
    await empty.setProps({ modelValue: [] })
    expect(empty.find('.ui-cascader__selected').text()).toBe('')
  })

  it('emitPath=false 时 v-model 只存末级值，回显仍反查完整路径', async () => {
    const wrapper = mountCascader({ options: tree, modelValue: 'hz', emitPath: false })
    expect(wrapper.find('.ui-cascader__selected').text()).toBe('浙江 / 杭州')
    await openByClick(wrapper)
    // 展开后列顺序：浙江 江苏 | 杭州 宁波
    await click(nodesOf()[2])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['hz'])
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['hz'])

    reset()
    const leaf = mountCascader({ options: [{ value: 'a', label: '甲' }], emitPath: false })
    await openByClick(leaf)
    await click(nodesOf()[0])
    expect(leaf.emitted('update:modelValue')?.at(-1)).toEqual(['a'])
  })

  it('clearable 清空抛 clear + undefined，valueOnClear 可定制', async () => {
    const wrapper = mountCascader({ options: tree, modelValue: ['zj', 'hz'], clearable: true })
    const clear = wrapper.find('.ui-cascader__clear')
    expect(clear.exists()).toBe(true)
    await clear.trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([undefined])

    reset()
    const withValue = mountCascader({ options: tree, modelValue: ['zj', 'hz'], clearable: true, valueOnClear: '' })
    await withValue.find('.ui-cascader__clear').trigger('click')
    expect(withValue.emitted('update:modelValue')?.at(-1)).toEqual([''])

    reset()
    const multiple = mountCascader({ options: tree, modelValue: [['zj', 'hz']], multiple: true, clearable: true })
    await multiple.find('.ui-cascader__clear').trigger('click')
    expect(multiple.emitted('update:modelValue')?.at(-1)).toEqual([[]])
  })

  it('multiple 渲染标签，点关闭移除对应路径', async () => {
    const wrapper = mountCascader({
      options: tree,
      multiple: true,
      modelValue: [['zj', 'hz'], ['js', 'nj']],
      tagType: 'success',
      tagEffect: 'dark'
    })
    const tags = wrapper.findAll('.ui-cascader__tag')
    expect(tags).toHaveLength(2)
    expect(tags[0].classes()).toContain('is-success')
    expect(tags[0].classes()).toContain('is-dark')
    expect(wrapper.findAll('.ui-cascader__tag-label').map((t) => t.text())).toEqual(['浙江 / 杭州', '江苏 / 南京'])
    await wrapper.findAll('.ui-cascader__tag-close')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[['js', 'nj']]])

    reset()
    const add = mountCascader({ options: tree, multiple: true, modelValue: [] })
    await openByClick(add)
    await click(nodesOf()[0])
    await click(nodesOf()[2])
    expect(add.emitted('update:modelValue')?.at(-1)).toEqual([[['zj', 'hz']]])
    // multiple 多选后保持展开，面板只在单选时收起
    expect(add.emitted('visible-change')?.at(-1)).toEqual([true])
    expect(add.classes()).toContain('is-open')
  })

  it('collapseTags + maxCollapseTags 折叠成 +N，tooltip 展开隐藏项', async () => {
    vi.useFakeTimers()
    const wrapper = mountCascader({
      options: tree,
      multiple: true,
      collapseTags: true,
      collapseTagsTooltip: true,
      maxCollapseTags: 1,
      modelValue: [['zj', 'hz'], ['zj', 'nb'], ['js', 'nj']]
    })
    expect(wrapper.findAll('.ui-cascader__tag')).toHaveLength(2)
    const more = wrapper.find('.ui-cascader__tag--more')
    expect(more.text()).toContain('+2')
    expect(more.attributes('aria-label')).toBe('还有 2 个已选项')
    await more.trigger('mouseenter')
    await nextTick()
    expect(document.querySelector('.ui-cascader__tag-popover')?.className).toContain('is-open')
    expect(Array.from(document.querySelectorAll('.ui-cascader__tag-popover-item')).map((i) => i.textContent)).toEqual([
      '浙江 / 宁波',
      '江苏 / 南京'
    ])
    await more.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(149)
    expect(document.querySelector('.ui-cascader__tag-popover')?.className).toContain('is-open')
    await vi.advanceTimersByTimeAsync(1)
    expect(document.querySelector('.ui-cascader__tag-popover')?.className).not.toContain('is-open')
    vi.useRealTimers()
  })

  it('checkbox 模式点复选框级联勾选父节点下所有叶子', async () => {
    const wrapper = mountCascader({ options: tree, multiple: true, checkbox: true, modelValue: [] })
    await openByClick(wrapper)
    const boxes = document.querySelectorAll('.ui-cascader__checkbox')
    expect(boxes).toHaveLength(2)
    await click(boxes[0])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[['zj', 'hz'], ['zj', 'nb']]])
    // 行点击只负责下钻，不改值
    await click(nodesOf()[1])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(columnsOf()).toHaveLength(2)
    // 回灌 v-model 后父级是全选态，再次点击取消
    await wrapper.setProps({ modelValue: [['zj', 'hz'], ['zj', 'nb']] })
    expect(document.querySelectorAll('.ui-cascader__checkbox')[0].className).toContain('is-checked')
    await click(document.querySelectorAll('.ui-cascader__checkbox')[0])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])

    reset()
    const partial = mountCascader({ options: tree, multiple: true, checkbox: true, modelValue: [['zj', 'hz']] })
    await openByClick(partial)
    expect(document.querySelectorAll('.ui-cascader__checkbox')[0].className).toContain('is-indeterminate')
    expect(document.querySelectorAll('.ui-cascader__checkbox-icon')).toHaveLength(1)
  })

  it('checkStrictly 时中间节点可直接勾选', async () => {
    const wrapper = mountCascader({ options: tree, multiple: true, checkStrictly: true, modelValue: [] })
    await openByClick(wrapper)
    expect(document.querySelectorAll('.ui-cascader__checkbox')).toHaveLength(2)
    await click(document.querySelectorAll('.ui-cascader__checkbox')[0])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[['zj']]])
    await wrapper.setProps({ modelValue: [['zj']] })
    expect(document.querySelectorAll('.ui-cascader__checkbox.is-checked')).toHaveLength(1)
    expect(nodesOf()[0].className).toContain('is-selected')
  })

  it('selectAll 栏展示计数并可一键全选 / 清空', async () => {
    const wrapper = mountCascader({ options: tree, multiple: true, selectAll: true, modelValue: [] })
    await openByClick(wrapper)
    const bar = document.querySelector('.ui-cascader__select-all')
    expect(bar?.textContent).toContain('全选')
    expect(document.querySelector('.ui-cascader__select-all-count')?.textContent).toBe('0 / 3')
    await click(document.querySelector('.ui-cascader__select-all-box'))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      [['zj', 'hz'], ['zj', 'nb'], ['js', 'nj']]
    ])

    reset()
    const all = mountCascader({
      options: tree,
      multiple: true,
      selectAll: true,
      modelValue: [['zj', 'hz'], ['zj', 'nb'], ['js', 'nj']]
    })
    await openByClick(all)
    expect(document.querySelector('.ui-cascader__select-all-label')?.textContent).toBe('清空')
    expect(document.querySelector('.ui-cascader__select-all-box')?.className).toContain('is-checked')
    await click(document.querySelector('.ui-cascader__select-all-box'))
    expect(all.emitted('update:modelValue')?.at(-1)).toEqual([[]])
  })

  it('filterable 输入走 debounce 300，命中列表按路径拼接展示', async () => {
    vi.useFakeTimers()
    const wrapper = mountCascader({ options: tree, filterable: true })
    expect(wrapper.find('.ui-cascader__input').exists()).toBe(true)
    await wrapper.find('.ui-cascader__input').trigger('focus')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    const input = document.querySelector('.ui-cascader__input') as HTMLInputElement
    input.value = '杭'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(299)
    await nextTick()
    expect(document.querySelector('.ui-cascader__search-list')).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    await nextTick()
    expect(nodesOf().map((n) => n.textContent)).toEqual(['浙江 / 杭州'])
    await click(nodesOf()[0])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['zj', 'hz']])
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])

    input.value = 'zzz'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    expect(document.querySelector('.ui-floating-panel__empty')?.textContent).toBe('无匹配数据')
    vi.useRealTimers()
  })

  it('filterMethod 自定义过滤，beforeFilter 每次输入都回调', async () => {
    vi.useFakeTimers()
    const beforeFilter = vi.fn()
    const filterMethod = vi.fn((query: string, path: { labels: string[] }) => path.labels.join('').includes(query))
    const wrapper = mountCascader({ options: tree, filterable: true, beforeFilter, filterMethod })
    const input = wrapper.find('.ui-cascader__input').element as HTMLInputElement
    input.value = '宁波'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    expect(beforeFilter).toHaveBeenCalledWith('宁波')
    expect(filterMethod).toHaveBeenCalled()
    expect(nodesOf().map((n) => n.textContent)).toEqual(['浙江 / 宁波'])
    vi.useRealTimers()
  })

  it('virtualScroll 超过 40 项才启用虚拟渲染', async () => {
    const many = Array.from({ length: 60 }, (_unused, index) => ({ value: 'v' + index, label: '选项' + index }))
    const wrapper = mountCascader({ options: many, virtualScroll: true, itemSize: 40, height: 120 })
    await openByClick(wrapper)
    expect(columnsOf()[0].className).toContain('is-virtual')
    const win = document.querySelector('.ui-cascader__window') as HTMLElement
    expect(win.style.height).toBe('2400px')
    const rows = document.querySelectorAll('.ui-cascader__row')
    expect(rows.length).toBeLessThan(60)
    expect(rows.length).toBeGreaterThan(0)
    expect((rows[0].firstElementChild as HTMLElement).style.height).toBe('40px')

    reset()
    const few = mountCascader({ options: many.slice(0, 20), virtualScroll: true })
    await openByClick(few)
    expect(columnsOf()[0].className).not.toContain('is-virtual')
    expect(document.querySelectorAll('.ui-cascader__node')).toHaveLength(20)
  })

  it('lazy 首次展开加载根级，下钻时按路径加载子级', async () => {
    const lazyLoad = vi.fn((node: any, resolve: (children: any[]) => void) =>
      resolve(node.level === 0 ? [{ value: 'a', label: 'A', leaf: false }] : [{ value: 'a1', label: 'A1', leaf: true }])
    )
    const wrapper = mountCascader({ options: [], lazy: true, lazyLoad })
    await openByClick(wrapper)
    expect(lazyLoad).toHaveBeenCalledTimes(1)
    expect(lazyLoad.mock.calls[0][0]).toMatchObject({ level: 0, root: true })
    expect(nodesOf().map((n) => n.textContent)).toEqual(['A'])
    await click(nodesOf()[0])
    expect(lazyLoad).toHaveBeenCalledTimes(2)
    expect(lazyLoad.mock.calls[1][0]).toMatchObject({ level: 1, value: 'a', pathValues: ['a'] })
    expect(columnsOf()).toHaveLength(2)
    expect(nodesOf().map((n) => n.textContent)).toEqual(['A', 'A1'])
    await click(nodesOf()[1])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a', 'a1']])
    // 已加载过不再重复请求
    await click(nodesOf()[0])
    expect(lazyLoad).toHaveBeenCalledTimes(2)
  })

  it('persistent=false 关闭即卸载面板，teleported=false 面板留在组件内', async () => {
    const wrapper = mountCascader({ options: tree, persistent: false })
    expect(panel()).toBeNull()
    await openByClick(wrapper)
    expect(panel()).not.toBeNull()
    await openByClick(wrapper)
    expect(panel()).toBeNull()

    reset()
    const inline = mountCascader({ options: tree, teleported: false, popperClass: 'cs-pop', effect: 'dark' })
    await openByClick(inline)
    const dropdown = inline.find('.ui-cascader__dropdown')
    expect(dropdown.exists()).toBe(true)
    expect(dropdown.classes()).toContain('cs-pop')
    expect(dropdown.classes()).toContain('is-dark')
    // 未 teleport 时面板就在根节点内部
    expect(inline.element.contains(dropdown.element)).toBe(true)
  })

  it('触发器 Escape 收起，外部按下也收起', async () => {
    const wrapper = mountCascader({ options: tree })
    await openByClick(wrapper)
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([true])
    await wrapper.find('.ui-cascader__trigger').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
    expect(panel()?.getAttribute('style')).toContain('display: none')

    await openByClick(wrapper)
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
    expect(wrapper.classes()).not.toContain('is-open')
  })

  it('禁用节点不可选，原始字符串选项也可用', async () => {
    const wrapper = mountCascader({
      options: [{ value: 'x', label: '禁用项', disabled: true }, { value: 'y', label: '可选项' }]
    })
    await openByClick(wrapper)
    expect(nodesOf()[0].className).toContain('is-disabled')
    await click(nodesOf()[0])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await click(nodesOf()[1])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['y']])

    reset()
    const raw = mountCascader({ options: ['甲', '乙'] })
    await openByClick(raw)
    expect(nodesOf().map((n) => n.textContent)).toEqual(['甲', '乙'])
    await click(nodesOf()[1])
    expect(raw.emitted('update:modelValue')?.at(-1)).toEqual([['乙']])
  })

  it('props 映射自定义字段名，超长文本不截断', async () => {
    const wrapper = mountCascader({
      options: [{ id: 'p1', name: '超长'.repeat(30), kids: [{ id: 'c1', name: '子节点' }] }],
      props: { value: 'id', label: 'name', children: 'kids' },
      modelValue: ['p1', 'c1']
    })
    expect(wrapper.find('.ui-cascader__selected').text()).toBe(`${'超长'.repeat(30)} / 子节点`)
    await openByClick(wrapper)
    expect(columnsOf()).toHaveLength(2)
    expect(nodesOf()).toHaveLength(2)

    reset()
    const noChildren = mountCascader({ options: [{ value: 'solo', label: '独苗' }] })
    await openByClick(noChildren)
    expect(columnsOf()).toHaveLength(1)
    await click(nodesOf()[0])
    expect(noChildren.emitted('update:modelValue')?.at(-1)).toEqual([['solo']])
  })

  it('空 options 展示无数据占位', async () => {
    const wrapper = mountCascader({ options: [] })
    await openByClick(wrapper)
    expect(document.querySelector('.ui-floating-panel__empty')?.textContent).toBe('无数据')
    expect(columnsOf()).toHaveLength(1)
  })
})
