import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CascaderPanel, ConfigProvider } from '@ui-kit-full'

/**
 * CascaderPanel 内联级联面板：没有浮层与触发器，直接按 activePath 展开多列。
 * 口径：列数 / 节点态类名 / 单选与多选的事件载荷 / props 映射 / 懒加载与虚拟滚动等特性开关。
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

let mounted: ReturnType<typeof mount>[] = []

const mountPanel = (props: Record<string, any> = {}) => {
  const wrapper = mount(CascaderPanel, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

/** 同一用例里多实例时先卸载再清 body，避免 document 查询读到上一个实例的节点 */
const reset = () => {
  mounted.forEach((wrapper) => wrapper.unmount())
  mounted = []
  document.body.innerHTML = ''
}

const columns = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-cascader-panel__column'))
const nodes = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-cascader-panel__node'))
const labelsOf = () => nodes().map((node) => node.textContent)

async function click(node: Element | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

/** 键盘驱动统一走可取消的冒泡 keydown；两次 nextTick 因为子列可能是按键里 nextTick 才新建的 */
const pressKey = async (element: Element | null | undefined, key: string) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  element?.dispatchEvent(event)
  await nextTick()
  await nextTick()
  return event
}

const tabStopIndex = () => nodes().findIndex((node) => node.getAttribute('tabindex') === '0')
const activeText = () => (document.activeElement as HTMLElement | null)?.textContent ?? ''

afterEach(() => {
  reset()
  vi.useRealTimers()
})

describe('CascaderPanel 级联面板', () => {
  it('默认渲染单列、根节点内联高度变量与结构类名', async () => {
    const wrapper = mountPanel({ options: tree })
    await nextTick()
    expect(wrapper.classes()).toEqual([
      'ui-cascader-panel',
      'ui-cascader-panel--virtualized',
      'ui-cascader-panel--border'
    ])
    expect(wrapper.attributes('style')).toContain('--ui-cascader-panel-height: 204px')
    expect(columns()).toHaveLength(1)
    expect(columns()[0].getAttribute('style')).toBe('max-height: 204px;')
    expect(columns()[0].getAttribute('role')).toBe('listbox')
    expect(columns()[0].getAttribute('aria-label')).toBe('第 1 级')
    expect(labelsOf()).toEqual(['浙江', '江苏'])
    expect(nodes()[0].getAttribute('role')).toBe('option')
    expect(nodes()[0].getAttribute('aria-selected')).toBe('false')
    expect(nodes()[0].getAttribute('aria-disabled')).toBeNull()
    expect(wrapper.find('.ui-cascader-panel__node-arrow').exists()).toBe(true)
    // 单选且非多选时没有勾选框
    expect(wrapper.find('.ui-cascader-panel__check').exists()).toBe(false)
    expect(wrapper.find('.ui-cascader-panel__empty').exists()).toBe(false)
  })

  it('受控 modelValue 按路径展开到对应层级并标出选中节点', async () => {
    mountPanel({ options: tree, modelValue: ['zj'] })
    await nextTick()
    expect(columns()).toHaveLength(2)
    expect(labelsOf()).toEqual(['浙江', '江苏', '杭州', '宁波'])
    expect(nodes()[0].className).toContain('is-selected')
    expect(nodes()[0].getAttribute('aria-selected')).toBe('true')

    reset()
    const leaf = mountPanel({ options: tree, modelValue: ['zj', 'hz'] })
    await nextTick()
    // 只有完整路径末级既是 active 又是 selected，父级不参与高亮
    expect(nodes()[2].className).toContain('is-active')
    expect(nodes()[2].className).toContain('is-selected')
    expect(nodes()[2].getAttribute('aria-selected')).toBe('true')
    expect(nodes()[0].className).not.toContain('is-selected')
    expect(leaf.find('.ui-cascader-panel__check-icon').exists()).toBe(true)
  })

  it('非数组 modelValue 视作单级路径，未知值只展开一层', async () => {
    mountPanel({ options: tree, modelValue: 'zj' })
    await nextTick()
    expect(columns()).toHaveLength(2)
    expect(nodes()[0].className).toContain('is-selected')

    reset()
    mountPanel({ options: tree, modelValue: 'nope' })
    await nextTick()
    expect(columns()).toHaveLength(1)
    expect(nodes().every((node) => !node.className.includes('is-selected'))).toBe(true)
  })

  it('点击可展开节点只下钻，不抛写回事件；可展开节点不挂 is-active', async () => {
    const wrapper = mountPanel({ options: tree })
    await nextTick()
    await click(nodes()[1])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(columns()).toHaveLength(2)
    expect(labelsOf()).toEqual(['浙江', '江苏', '南京'])
    expect(nodes()[1].className).not.toContain('is-active')
    expect(nodes()[1].className).not.toContain('is-selected')
  })

  it('点击叶子节点抛 update:modelValue 与 change，完整路径回传', async () => {
    const wrapper = mountPanel({ options: tree, modelValue: ['zj'] })
    await nextTick()
    await click(nodes()[2])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['zj', 'hz']])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([['zj', 'hz']])
    expect(nodes()[2].className).toContain('is-active')
  })

  it('节点 disabled 不可选，可选项仍正常提交', async () => {
    const wrapper = mountPanel({
      options: [
        { value: 'x', label: '禁用项', disabled: true },
        { value: 'y', label: '可选项' }
      ]
    })
    await nextTick()
    expect(nodes()[0].className).toContain('is-disabled')
    expect(nodes()[0].getAttribute('aria-disabled')).toBe('true')
    await click(nodes()[0])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await click(nodes()[1])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['y']])
  })

  it('根节点 disabled 拦截下钻与提交', async () => {
    const wrapper = mountPanel({ options: tree, disabled: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-disabled')
    await click(nodes()[0])
    expect(columns()).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('multiple 按路径切换勾选，回灌后勾选框带图标', async () => {
    const wrapper = mountPanel({ options: tree, multiple: true, modelValue: [] })
    await nextTick()
    await click(nodes()[1])
    // 父级只展开，不改变选值；叶子才有勾选框
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.findAll('.ui-cascader-panel__check')).toHaveLength(1)
    await click(nodes()[2])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[['js', 'nj']]])

    await wrapper.setProps({ modelValue: [['js', 'nj']] })
    expect(document.querySelectorAll('.ui-cascader-panel__check.is-checked')).toHaveLength(1)
    expect(wrapper.find('.ui-cascader-panel__check-icon').exists()).toBe(true)
    await click(nodes()[2])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
  })

  it('checkStrictly 时中间节点也可勾选与提交单级路径', async () => {
    const wrapper = mountPanel({ options: tree, multiple: true, checkStrictly: true, modelValue: [] })
    await nextTick()
    await click(nodes()[1])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[['js']]])
    expect(columns()).toHaveLength(2)
    await wrapper.setProps({ modelValue: [['js']] })
    expect(nodes()[1].className).toContain('is-selected')
    expect(nodes()[1].querySelector('.ui-cascader-panel__check')?.className).toContain('is-checked')
  })

  it('props 字段映射同时支持嵌套 props 与顶层别名', async () => {
    const data = [{ id: 'p', name: '父', kids: [{ id: 'c', name: '子' }] }]
    mountPanel({
      options: data,
      modelValue: ['p', 'c'],
      props: { value: 'id', label: 'name', children: 'kids' }
    })
    await nextTick()
    expect(labelsOf()).toEqual(['父', '子'])
    expect(nodes()[1].className).toContain('is-selected')

    reset()
    mountPanel({
      options: data,
      modelValue: ['p', 'c'],
      value: 'id',
      label: 'name',
      children: 'kids'
    })
    await nextTick()
    expect(labelsOf()).toEqual(['父', '子'])
  })

  it('原始字符串选项也能渲染并提交', async () => {
    const wrapper = mountPanel({ options: ['甲', '乙'] })
    await nextTick()
    expect(labelsOf()).toEqual(['甲', '乙'])
    await click(nodes()[1])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['乙']])
  })

  it('height 改写根节点变量与列容器 maxHeight', async () => {
    const wrapper = mountPanel({ options: tree, height: 120 })
    await nextTick()
    expect(wrapper.attributes('style')).toContain('--ui-cascader-panel-height: 120px')
    expect(columns()[0].getAttribute('style')).toBe('max-height: 120px;')
    await click(nodes()[0])
    expect(columns()[1].getAttribute('style')).toBe('max-height: 120px;')
  })

  it('itemSize 与列内超过 40 项才启用虚拟渲染', async () => {
    const many = Array.from({ length: 50 }, (_unused, index) => ({ value: 'v' + index, label: '选项' + index }))
    mountPanel({ options: many, height: 120, itemSize: 30 })
    await nextTick()
    expect(columns()[0].className).toContain('is-virtual')
    const win = document.querySelector('.ui-cascader-panel__window') as HTMLElement
    expect(win.getAttribute('style')).toBe('height: 1500px;')
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.ui-cascader-panel__row'))
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(50)
    expect(rows[0].getAttribute('style')).toBe('top: 0px;')
    expect((rows[0].firstElementChild as HTMLElement).getAttribute('style')).toBe('height: 30px;')

    reset()
    mountPanel({ options: many.slice(0, 20), height: 120, itemSize: 30 })
    await nextTick()
    expect(columns()[0].className).not.toContain('is-virtual')
    expect(nodes()).toHaveLength(20)
  })

  it('lazy 首次加载根级，未返回前展示加载占位', async () => {
    let resolveRoot: ((children: any[]) => void) | undefined
    const lazyLoad = vi.fn((node: any, resolve: (children: any[]) => void) => {
      if (node.level === 0) {
        resolveRoot = resolve
      }
    })
    const wrapper = mountPanel({ options: [], lazy: true, props: { lazyLoad } })
    await nextTick()
    expect(lazyLoad).toHaveBeenCalledTimes(1)
    expect(lazyLoad.mock.calls[0][0]).toMatchObject({ level: 0, root: true })
    expect(wrapper.find('.ui-cascader-panel__empty').text()).toBe('加载中…')

    resolveRoot?.([{ value: 'a', label: 'A' }])
    await nextTick()
    expect(labelsOf()).toEqual(['A'])
    expect(wrapper.find('.ui-cascader-panel__node-arrow').exists()).toBe(true)
  })

  it('lazy 下钻按路径加载子级，加载中挂 is-loading 且不重复请求', async () => {
    let resolveChild: ((children: any[]) => void) | undefined
    const lazyLoad = vi.fn((node: any, resolve: (children: any[]) => void) => {
      if (node.level === 0) {
        resolve([{ value: 'a', label: 'A' }])
      } else {
        resolveChild = resolve
      }
    })
    mountPanel({ options: [], lazy: true, props: { lazyLoad } })
    await nextTick()
    await click(nodes()[0])
    expect(lazyLoad).toHaveBeenCalledTimes(2)
    expect(lazyLoad.mock.calls[1][0]).toMatchObject({ level: 1, value: 'a', pathValues: ['a'] })
    expect(nodes()[0].className).toContain('is-loading')
    expect(nodes()[0].textContent).toContain('加载中…')
    expect(columns()).toHaveLength(1)

    resolveChild?.([{ value: 'c', label: '子' }])
    await nextTick()
    expect(columns()).toHaveLength(2)
    expect(labelsOf()).toEqual(['A', '子'])
    expect(nodes()[0].className).not.toContain('is-loading')

    await click(nodes()[0])
    expect(lazyLoad).toHaveBeenCalledTimes(2)
  })

  it('空 options 展示无数据占位', async () => {
    const wrapper = mountPanel({ options: [] })
    await nextTick()
    expect(columns()).toHaveLength(1)
    expect(wrapper.find('.ui-cascader-panel__empty').text()).toBe('无数据')

    // 连 options 都不传时走 prop 默认值
    reset()
    expect(mountPanel().find('.ui-cascader-panel__empty').text()).toBe('无数据')
  })

  it('特性类名跟随开关：multiple / lazy / selection / border', async () => {
    const wrapper = mountPanel({
      options: tree,
      multiple: true,
      lazy: true,
      checkStrictly: true,
      border: false
    })
    await nextTick()
    expect(wrapper.classes()).toEqual([
      'ui-cascader-panel',
      'ui-cascader-panel--multiple',
      'ui-cascader-panel--lazy',
      'ui-cascader-panel--selection',
      'ui-cascader-panel--virtualized',
      'ui-cascader-panel--plain'
    ])
  })

  it('层级 aria-label 走 locale，未注入的空数据文案回退中文', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: { cascader: { levelFormat: 'L{level}' } } },
      slots: { default: () => h(CascaderPanel, { options: [] }) },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await nextTick()
    expect(columns()[0].getAttribute('aria-label')).toBe('L1')
    expect(wrapper.find('.ui-cascader-panel__empty').text()).toBe('无数据')
  })

  describe('键盘可操作', () => {
    it('整面板单一 Tab 停靠点：禁用节点退出 Tab 序，停靠键跟随点击', async () => {
      mountPanel({
        options: [
          { value: 'x', label: '禁用项', disabled: true },
          { value: 'y', label: '可选项' }
        ]
      })
      await nextTick()
      expect(nodes()[0].hasAttribute('tabindex')).toBe(false)
      expect(nodes()[1].getAttribute('tabindex')).toBe('0')
      expect(tabStopIndex()).toBe(1)

      reset()
      mountPanel({ options: tree })
      await nextTick()
      expect(nodes().filter((node) => node.getAttribute('tabindex') === '0')).toHaveLength(1)
      await click(nodes()[1])
      expect(tabStopIndex()).toBe(1)
      // 子列首项也是 -1，整面板仍只有一个 Tab 位
      expect(nodes().filter((node) => node.getAttribute('tabindex') === '0')).toHaveLength(1)

      reset()
      mountPanel({ options: tree, multiple: true, modelValue: [['js', 'nj']] })
      await nextTick()
      // 多选回填展开路径，停靠点仍兜底第一列首个非禁用节点
      expect(columns()).toHaveLength(2)
      expect(tabStopIndex()).toBe(0)
    })

    it('↓/↑ 同列移动跳过禁用节点，列首列尾停住', async () => {
      mountPanel({
        options: [
          { value: 'zj', label: '浙江', children: [{ value: 'hz', label: '杭州' }] },
          { value: 'ah', label: '安徽', disabled: true },
          { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] }
        ]
      })
      await nextTick()
      nodes()[0].focus()
      const down = await pressKey(nodes()[0], 'ArrowDown')
      expect(down.defaultPrevented).toBe(true)
      expect(activeText()).toBe('江苏')
      expect(tabStopIndex()).toBe(2)
      await pressKey(nodes()[2], 'ArrowDown')
      expect(activeText()).toBe('江苏')

      const up = await pressKey(nodes()[2], 'ArrowUp')
      expect(up.defaultPrevented).toBe(true)
      expect(activeText()).toBe('浙江')
      await pressKey(nodes()[0], 'ArrowUp')
      expect(activeText()).toBe('浙江')
    })

    it('→ 展开并进入子列首项，← 在父列收起子列、在子列回父级', async () => {
      mountPanel({ options: tree })
      await nextTick()
      nodes()[0].focus()
      const right = await pressKey(nodes()[0], 'ArrowRight')
      expect(right.defaultPrevented).toBe(true)
      expect(columns()).toHaveLength(2)
      expect(activeText()).toBe('杭州')
      expect(tabStopIndex()).toBe(2)

      const left = await pressKey(nodes()[0], 'ArrowLeft')
      expect(left.defaultPrevented).toBe(true)
      expect(columns()).toHaveLength(1)
      expect(activeText()).toBe('浙江')

      reset()
      mountPanel({ options: tree, modelValue: ['zj'] })
      await nextTick()
      nodes()[3].focus()
      await pressKey(nodes()[3], 'ArrowLeft')
      expect(document.activeElement).toBe(nodes()[0])
      expect(tabStopIndex()).toBe(0)

      // 叶子上的 → 没有子列可进，焦点原地不动
      nodes()[2].focus()
      const leafRight = await pressKey(nodes()[2], 'ArrowRight')
      expect(leafRight.defaultPrevented).toBe(true)
      expect(activeText()).toBe('杭州')
      expect(columns()).toHaveLength(2)
    })

    it('Home / End 跳到本列首末的非禁用节点', async () => {
      mountPanel({ options: tree })
      await nextTick()
      nodes()[0].focus()
      const end = await pressKey(nodes()[0], 'End')
      expect(end.defaultPrevented).toBe(true)
      expect(activeText()).toBe('江苏')
      expect(tabStopIndex()).toBe(1)
      const home = await pressKey(nodes()[1], 'Home')
      expect(home.defaultPrevented).toBe(true)
      expect(activeText()).toBe('浙江')
    })

    it('Enter / Space 等同点击：叶子抛 update:modelValue 与 change', async () => {
      const wrapper = mountPanel({ options: tree, modelValue: ['zj'] })
      await nextTick()
      const enter = await pressKey(nodes()[2], 'Enter')
      expect(enter.defaultPrevented).toBe(true)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['zj', 'hz']])
      expect(wrapper.emitted('change')?.at(-1)).toEqual([['zj', 'hz']])

      reset()
      const multiple = mountPanel({ options: tree, multiple: true, modelValue: [] })
      await nextTick()
      await click(nodes()[1])
      const space = await pressKey(nodes()[2], ' ')
      expect(space.defaultPrevented).toBe(true)
      expect(multiple.emitted('update:modelValue')?.at(-1)).toEqual([[['js', 'nj']]])
    })

    it('根 disabled 时整面板退出 Tab 序与键盘导航', async () => {
      const wrapper = mountPanel({ options: tree, disabled: true })
      await nextTick()
      expect(nodes().every((node) => !node.hasAttribute('tabindex'))).toBe(true)
      expect(tabStopIndex()).toBe(-1)
      // 按键仍被接管（不再落到页面滚动），但不产生选中与下钻
      const enter = await pressKey(nodes()[0], 'Enter')
      expect(enter.defaultPrevented).toBe(true)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      await pressKey(nodes()[0], 'ArrowRight')
      expect(columns()).toHaveLength(1)
    })

    it('禁用节点、列容器与非导航键都不参与漫游', async () => {
      mountPanel({
        options: [
          { value: 'x', label: '禁用项', disabled: true },
          { value: 'y', label: '可选项' }
        ]
      })
      await nextTick()
      const onDisabled = await pressKey(nodes()[0], 'ArrowDown')
      expect(onDisabled.defaultPrevented).toBe(false)
      // Home 跳过列首禁用项落到唯一可选项
      const home = await pressKey(nodes()[1], 'Home')
      expect(home.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(nodes()[1])

      const onColumn = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
      columns()[0].dispatchEvent(onColumn)
      await nextTick()
      expect(onColumn.defaultPrevented).toBe(false)
      const tab = await pressKey(nodes()[1], 'Tab')
      expect(tab.defaultPrevented).toBe(false)
    })

    it('虚拟列滚动重算窗口区间，同一滚动位置不再触发渲染', async () => {
      const many = Array.from({ length: 50 }, (_unused, index) => ({ value: 'v' + index, label: '选项' + index }))
      mountPanel({ options: many, height: 120, itemSize: 30 })
      await nextTick()
      const rows = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-cascader-panel__row'))
      expect(rows()[0].getAttribute('style')).toBe('top: 0px;')

      columns()[0].scrollTop = 600
      columns()[0].dispatchEvent(new Event('scroll', { bubbles: true }))
      await nextTick()
      // start = floor(600 / 30) - overscan 4
      expect(rows()[0].getAttribute('style')).toBe('top: 480px;')
      const count = rows().length
      columns()[0].dispatchEvent(new Event('scroll', { bubbles: true }))
      await nextTick()
      expect(rows()).toHaveLength(count)
    })
  })
})
