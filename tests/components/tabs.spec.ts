import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TabPane, Tabs } from '@ui-kit-full'

// 用例里会往里混入 closable / lazy 这类条目级开关，类型放宽到通用记录
const panes: Record<string, any>[] = [
  { label: '标签一', name: 'a', text: '内容一' },
  { label: '标签二', name: 'b', text: '内容二' },
  { label: '标签三', name: 'c', text: '内容三', disabled: true }
]

// 面板由 TabPane 在自身 setup 里向 Tabs 注册，注册时机晚于 Tabs 首次渲染，
// 因此导航项需要多等一次 tick 才会出现
async function mountTabs(props: Record<string, any> = {}, list = panes) {
  const wrapper = mount(Tabs, {
    props,
    slots: {
      default: () => list.map((pane) => h(TabPane, pane, () => pane.text))
    },
    attachTo: document.body
  })
  await nextTick()
  return wrapper
}

function navItems(wrapper: Awaited<ReturnType<typeof mountTabs>>) {
  return wrapper.findAll('.ui-tabs__nav-item')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Tabs', () => {
  it('渲染导航与面板并标记激活项', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' })
    expect(wrapper.classes()).toContain('ui-tabs')
    expect(wrapper.find('.ui-tabs__nav').attributes('role')).toBe('tablist')
    expect(navItems(wrapper)).toHaveLength(3)
    expect(navItems(wrapper)[0].attributes('role')).toBe('tab')
    expect(navItems(wrapper)[0].classes()).toContain('is-active')
    expect(wrapper.find('.ui-tab-pane__content').text()).toBe('内容一')
  })

  it('未传 modelValue 时激活第一个面板', async () => {
    const wrapper = await mountTabs({})
    expect(navItems(wrapper)[0].classes()).toContain('is-active')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('defaultValue 指定初始激活项', async () => {
    const wrapper = await mountTabs({ defaultValue: 'b' })
    expect(navItems(wrapper)[1].classes()).toContain('is-active')
  })

  it('点击标签抛出 update:modelValue / tab-change / tab-click', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' })
    await navItems(wrapper)[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('tab-change')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('tab-click')?.[0]).toEqual(['b'])
  })

  it('切换后仅激活面板可见', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' })
    await navItems(wrapper)[1].trigger('click')
    await nextTick()
    const contents = wrapper.findAll('.ui-tab-pane__content')
    expect(contents).toHaveLength(3)
    expect(contents[0].attributes('style') ?? '').toContain('display: none')
    expect(contents[1].attributes('style') ?? '').not.toContain('display: none')
    expect(contents[2].attributes('style') ?? '').toContain('display: none')
  })

  it('disabled 标签不高亮也不响应', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' })
    expect(navItems(wrapper)[2].classes()).toContain('is-disabled')
    await navItems(wrapper)[2].trigger('click')
    expect(wrapper.emitted('tab-click')).toBeUndefined()
  })

  it('点击已激活标签不重复抛出事件', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' })
    await navItems(wrapper)[0].trigger('click')
    expect(wrapper.emitted('tab-click')).toBeUndefined()
  })

  it('外部受控 modelValue 变化同步高亮', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' })
    await wrapper.setProps({ modelValue: 'c' })
    await nextTick()
    expect(navItems(wrapper)[2].classes()).toContain('is-active')
  })

  it('tabPosition 与 stretch 映射布局类名', async () => {
    const wrapper = await mountTabs({ modelValue: 'a', tabPosition: 'left', stretch: true })
    expect(wrapper.classes()).toContain('is-left')
    expect(wrapper.classes()).toContain('is-stretch')
  })

  // 原缺陷 F-5：type 只是声明，classes() 不输出 ui-tabs--<type>，card / border-card 无样式钩子
  it('type 落到 ui-tabs--<type> 类名，缺省不附加', async () => {
    expect((await mountTabs({ modelValue: 'a', type: 'border-card' })).classes()).toContain('ui-tabs--border-card')
    expect((await mountTabs({ modelValue: 'a', type: 'card' })).classes()).toContain('ui-tabs--card')
    const plain = await mountTabs({ modelValue: 'a' })
    expect(plain.classes().filter((name: string) => name.startsWith('ui-tabs--'))).toEqual([])
  })

  // 原缺陷 F-6：beforeLeave 只参与 ui-tabs--editable 类名推导，切换标签时从未被调用
  it('beforeLeave 返回 reject 时阻止切换', async () => {
    const beforeLeave = vi.fn(() => Promise.reject(new Error('阻止切换')))
    const wrapper = await mountTabs({ modelValue: 'a', beforeLeave })
    await navItems(wrapper)[1].trigger('click')
    expect(beforeLeave).toHaveBeenCalledWith('a', 'b')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(wrapper.emitted('tab-change')).toBeUndefined()
    expect(navItems(wrapper)[0].classes()).toContain('is-active')
  })

  it('beforeLeave 放行后按顺序提交切换', async () => {
    const beforeLeave = vi.fn(() => Promise.resolve(true))
    const wrapper = await mountTabs({ modelValue: 'a', beforeLeave })
    await navItems(wrapper)[1].trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('tab-change')?.[0]).toEqual(['b'])
    expect(navItems(wrapper)[1].classes()).toContain('is-active')
  })

  it('beforeLeave 返回 false 同步拦截，返回真值同步放行', async () => {
    const blocked = await mountTabs({ modelValue: 'a', beforeLeave: () => false })
    await navItems(blocked)[1].trigger('click')
    expect(blocked.emitted('tab-change')).toBeUndefined()

    const passed = await mountTabs({ modelValue: 'a', beforeLeave: () => true })
    await navItems(passed)[1].trigger('click')
    expect(passed.emitted('tab-change')?.[0]).toEqual(['b'])
  })

  it('closable 渲染关闭按钮并移除面板', async () => {
    const wrapper = await mountTabs({ modelValue: 'a', closable: true })
    expect(wrapper.classes()).toContain('ui-tabs--closable')
    const close = wrapper.findAll('.ui-tabs__nav-close')
    expect(close).toHaveLength(2)
    // 禁用标签不给关闭按钮
    expect(close.map((item) => item.attributes('aria-label'))).toEqual(['关闭 标签一', '关闭 标签二'])
    await close[0].trigger('click')
    expect(wrapper.emitted('tab-remove')?.[0]).toEqual(['a'])
    expect(wrapper.emitted('edit')?.[0]).toEqual(['a', 'remove'])
    await nextTick()
    expect(navItems(wrapper)).toHaveLength(2)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })

  it('TabPane 自身 closable 单独开放关闭', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' }, [
      { label: '仅此项可关', name: 'a', closable: true, text: 'x' },
      panes[1]
    ])
    expect(wrapper.findAll('.ui-tabs__nav-close')).toHaveLength(1)
    await wrapper.find('.ui-tabs__nav-close').trigger('click')
    expect(wrapper.emitted('tab-remove')?.[0]).toEqual(['a'])
  })

  it('editable + addable 渲染新增按钮', async () => {
    const wrapper = await mountTabs({ modelValue: 'a', editable: true })
    expect(wrapper.classes()).toContain('ui-tabs--editable')
    const add = wrapper.find('.ui-tabs__nav-add')
    expect(add.exists()).toBe(true)
    await add.trigger('click')
    expect(wrapper.emitted('tab-add')).toHaveLength(1)
    expect(wrapper.emitted('edit')?.[0]).toEqual([undefined, 'add'])
  })

  it('lazy 面板激活后才渲染内容', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' }, [
      panes[0],
      { label: '懒加载', name: 'b', lazy: true, text: '迟到的内容' }
    ])
    expect(wrapper.text()).not.toContain('迟到的内容')
    await navItems(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('迟到的内容')
  })

  it('tabindex 落到标签按钮', async () => {
    const wrapper = await mountTabs({ modelValue: 'a', tabindex: -1 })
    expect(navItems(wrapper)[0].attributes('tabindex')).toBe('-1')
  })

  it('无面板时只渲染空导航', async () => {
    const wrapper = await mountTabs({ modelValue: 'a' }, [])
    expect(wrapper.find('.ui-tabs__nav').exists()).toBe(true)
    expect(wrapper.findAll('.ui-tabs__nav-item')).toHaveLength(0)
  })

  it('面板移除后原内容不再渲染', async () => {
    const wrapper = await mountTabs({ modelValue: 'a', closable: true })
    await wrapper.findAll('.ui-tabs__nav-close')[1].trigger('click')
    await nextTick()
    expect(wrapper.text()).not.toContain('内容二')
    expect(navItems(wrapper).map((item) => item.text().replace('×', ''))).toEqual(['标签一', '标签三'])
  })
})

describe('TabPane', () => {
  it('独立渲染内容容器', () => {
    const wrapper = mount(TabPane, { props: { label: 'L', name: 'n' }, slots: { default: () => '内容' } })
    expect(wrapper.classes()).toContain('ui-tab-pane')
    expect(wrapper.find('.ui-tab-pane__content').text()).toBe('内容')
  })

  it('脱离 Tabs 使用时默认视为激活', () => {
    const wrapper = mount(TabPane, { props: { label: 'L' }, slots: { default: () => '内容' } })
    expect(wrapper.find('.ui-tab-pane__content').attributes('style') ?? '').not.toContain('display: none')
  })
})
