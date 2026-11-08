import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { ConfigProvider, Transfer } from '@ui-kit-full'

const rows = [
  { key: 1, label: '选项一' },
  { key: 2, label: '选项二' },
  { key: 3, label: '选项三', disabled: true }
]

function mountTransfer(props: Record<string, any> = {}) {
  return mount(Transfer, { props: { data: rows, modelValue: [], ...props }, attachTo: document.body })
}

function panel(wrapper: ReturnType<typeof mountTransfer>, side: 'left' | 'right') {
  return wrapper.find(`.ui-transfer__panel.is-${side}`)
}

function itemsOf(wrapper: ReturnType<typeof mountTransfer>, side: 'left' | 'right') {
  return panel(wrapper, side).findAll('.ui-transfer__item')
}

function countOf(wrapper: ReturnType<typeof mountTransfer>, side: 'left' | 'right') {
  return panel(wrapper, side).find('.ui-transfer__count').text()
}

function inputsOf(wrapper: ReturnType<typeof mountTransfer>, side: 'left' | 'right') {
  return panel(wrapper, side).findAll('input[type="checkbox"]')
}

function buttons(wrapper: ReturnType<typeof mountTransfer>) {
  return wrapper.findAll('.ui-transfer__button')
}

// Transfer 未声明 emits，复选框的原生 change 会冒泡进 wrapper.emitted()，
// 组件抛出的 change 载荷以新选中键数组开头，按此过滤
function changeEvents(wrapper: ReturnType<typeof mountTransfer>) {
  return (wrapper.emitted('change') ?? []).filter((args: unknown[]) => Array.isArray(args[0]))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Transfer', () => {
  it('默认渲染左右面板与标题、计数', () => {
    const wrapper = mountTransfer()
    expect(wrapper.classes()).toContain('ui-transfer')
    expect(panel(wrapper, 'left').find('.ui-transfer__header span').text()).toBe('列表 1')
    expect(panel(wrapper, 'right').find('.ui-transfer__header span').text()).toBe('列表 2')
    expect(countOf(wrapper, 'left')).toBe('0/3')
    expect(countOf(wrapper, 'right')).toBe('0/0')
    // 右侧无数据时渲染占位
    expect(panel(wrapper, 'right').find('.ui-transfer__empty').text()).toBe('暂无数据')
    wrapper.unmount()
  })

  it('modelValue 按 key 划分左右列表', () => {
    const wrapper = mountTransfer({ modelValue: [3] })
    expect(itemsOf(wrapper, 'left').map((item) => item.text())).toEqual(['选项一', '选项二'])
    expect(itemsOf(wrapper, 'right').map((item) => item.text())).toEqual(['选项三'])
    expect(countOf(wrapper, 'left')).toBe('0/2')
    expect(countOf(wrapper, 'right')).toBe('0/1')
    wrapper.unmount()
  })

  it('titles 映射面板标题', () => {
    const wrapper = mountTransfer({ titles: ['源列表', '目标列表'] })
    expect(panel(wrapper, 'left').find('.ui-transfer__header span').text()).toBe('源列表')
    expect(panel(wrapper, 'right').find('.ui-transfer__header span').text()).toBe('目标列表')
    wrapper.unmount()
  })

  it('buttonTexts 渲染文字按钮并加 is-text，缺省渲染图标', () => {
    const texted = mountTransfer({ buttonTexts: ['移到右侧', '移到左侧'] })
    expect(buttons(texted)[0].classes()).toEqual(['ui-transfer__button', 'is-text'])
    expect(buttons(texted).map((button) => button.text())).toEqual(['移到右侧', '移到左侧'])
    texted.unmount()
    const icon = mountTransfer()
    expect(buttons(icon)[0].find('svg').exists()).toBe(true)
    expect(buttons(icon)[0].text()).toBe('')
    icon.unmount()
  })

  it('勾选左侧条目更新计数并启用右移按钮', async () => {
    const wrapper = mountTransfer()
    expect(buttons(wrapper)[0].attributes('disabled')).toBeDefined()
    await inputsOf(wrapper, 'left')[0].setValue(true)
    await nextTick()
    expect(countOf(wrapper, 'left')).toBe('1/3')
    expect(buttons(wrapper)[0].attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('取消勾选恢复计数并重新禁用移动按钮', async () => {
    const wrapper = mountTransfer()
    await inputsOf(wrapper, 'left')[0].setValue(true)
    await nextTick()
    await inputsOf(wrapper, 'left')[0].setValue(false)
    await nextTick()
    expect(countOf(wrapper, 'left')).toBe('0/3')
    expect(buttons(wrapper)[0].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('点击右移抛出 update:modelValue 与 change 并清空勾选', async () => {
    const wrapper = mountTransfer()
    await inputsOf(wrapper, 'left')[0].setValue(true)
    await inputsOf(wrapper, 'left')[1].setValue(true)
    await buttons(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 2]])
    expect(changeEvents(wrapper)[0]).toEqual([[1, 2], 'right'])
    await nextTick()
    expect(countOf(wrapper, 'left')).toBe('0/3')
    expect(buttons(wrapper)[0].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('移回左侧时从 modelValue 中移除对应键、清空勾选并报 left 方向', async () => {
    const wrapper = mountTransfer({ modelValue: [1, 2] })
    await inputsOf(wrapper, 'right')[0].setValue(true)
    await nextTick()
    await buttons(wrapper)[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[2]])
    // F-21 回归：change 的第二参随实际移动方向变化
    expect(changeEvents(wrapper)[0]).toEqual([[2], 'left'])
    await nextTick()
    expect(inputsOf(wrapper, 'right').map((input) => (input.element as HTMLInputElement).checked)).toEqual([
      false,
      false
    ])
    expect(buttons(wrapper)[1].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('受控数据流：父级回写 modelValue 后重新划分列表', async () => {
    const wrapper = mountTransfer()
    await inputsOf(wrapper, 'left')[0].setValue(true)
    await buttons(wrapper)[0].trigger('click')
    await wrapper.setProps({ modelValue: [1] })
    await nextTick()
    expect(itemsOf(wrapper, 'left').map((item) => item.text())).toEqual(['选项二', '选项三'])
    expect(itemsOf(wrapper, 'right').map((item) => item.text())).toEqual(['选项一'])
    wrapper.unmount()
  })

  it('leftDefaultChecked 与 rightDefaultChecked 预设勾选状态', () => {
    const wrapper = mountTransfer({ modelValue: [1], leftDefaultChecked: [2], rightDefaultChecked: [1] })
    expect(countOf(wrapper, 'left')).toBe('1/2')
    expect(countOf(wrapper, 'right')).toBe('1/1')
    expect((inputsOf(wrapper, 'left')[0].element as HTMLInputElement).checked).toBe(true)
    expect((inputsOf(wrapper, 'right')[0].element as HTMLInputElement).checked).toBe(true)
    expect(buttons(wrapper)[1].attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('预设勾选跳过 disabled 条目', async () => {
    // F-22 回归：leftDefaultChecked 不能再把禁用项搬走
    const wrapper = mountTransfer({ modelValue: [], leftDefaultChecked: [3] })
    await nextTick()
    const leftInputs = inputsOf(wrapper, 'left')
    expect(leftInputs.map((input) => (input.element as HTMLInputElement).checked)).toEqual([false, false, false])
    expect(countOf(wrapper, 'left')).toBe('0/3')
    expect(buttons(wrapper)[0].attributes('disabled')).toBeDefined()
    await buttons(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('props 字段映射 key、label、disabled', async () => {
    const wrapper = mountTransfer({
      data: [
        { id: 'x', text: '映射一' },
        { id: 'y', text: '映射二', off: true }
      ],
      props: { key: 'id', label: 'text', disabled: 'off' }
    })
    expect(itemsOf(wrapper, 'left').map((item) => item.text())).toEqual(['映射一', '映射二'])
    expect(itemsOf(wrapper, 'left')[1].classes()).toContain('is-disabled')
    expect(inputsOf(wrapper, 'left')[1].attributes('disabled')).toBeDefined()
    await inputsOf(wrapper, 'left')[0].setValue(true)
    await buttons(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['x']])
    wrapper.unmount()
  })

  it('原始值数组以序号为键、元素为标签', async () => {
    const wrapper = mountTransfer({ data: ['甲', '乙'] })
    expect(itemsOf(wrapper, 'left').map((item) => item.text())).toEqual(['甲', '乙'])
    await inputsOf(wrapper, 'left')[0].setValue(true)
    await buttons(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[0]])
    wrapper.unmount()
  })

  it('label 缺失回退到 key，key 缺失回退到序号', () => {
    const wrapper = mountTransfer({ data: [{ label: '只有标签' }, { key: 9 }] })
    expect(itemsOf(wrapper, 'left').map((item) => item.text())).toEqual(['只有标签', '9'])
    wrapper.unmount()
  })

  it('disabled 条目输出禁用态且无法勾选', async () => {
    const wrapper = mountTransfer()
    expect(itemsOf(wrapper, 'left')[2].classes()).toContain('is-disabled')
    expect(inputsOf(wrapper, 'left')[2].attributes('disabled')).toBeDefined()
    await inputsOf(wrapper, 'left')[2].trigger('click')
    await nextTick()
    expect(countOf(wrapper, 'left')).toBe('0/3')
    expect(buttons(wrapper)[0].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('空态与筛选占位文案来自 ConfigProvider 注入的 locale', () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: { transfer: { empty: 'Nothing here', filterPlaceholder: 'Type to filter' } } },
      slots: { default: () => h(Transfer, { data: [], modelValue: [], filterable: true }) },
      attachTo: document.body
    })
    expect(wrapper.find('.ui-transfer__empty').text()).toBe('Nothing here')
    expect(wrapper.find('.ui-transfer__input').attributes('placeholder')).toBe('Type to filter')
    wrapper.unmount()
  })

  it('面板标题来自 ConfigProvider 注入的 locale，未注入键回退中文', () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: { transfer: { titleLeft: 'Source' } } },
      slots: { default: () => h(Transfer, { data: [], modelValue: [] }) },
      attachTo: document.body
    })
    expect(wrapper.find('.is-left .ui-transfer__header span').text()).toBe('Source')
    expect(wrapper.find('.is-right .ui-transfer__header span').text()).toBe('列表 2')
    wrapper.unmount()
  })

  it('filterable 渲染两侧筛选输入框，filterPlaceholder 映射占位符', () => {
    const wrapper = mountTransfer({ filterable: true })
    expect(wrapper.findAll('.ui-transfer__filter')).toHaveLength(2)
    expect(wrapper.find('.is-left .ui-transfer__input').attributes('placeholder')).toBe('请输入搜索内容')
    wrapper.unmount()
    const custom = mountTransfer({ filterable: true, filterPlaceholder: '搜这里' })
    expect(custom.find('.is-right .ui-transfer__input').attributes('placeholder')).toBe('搜这里')
    custom.unmount()
    const plain = mountTransfer()
    expect(plain.findAll('.ui-transfer__input')).toHaveLength(0)
    plain.unmount()
  })

  it('筛选按标签模糊收窄左侧列表，无匹配时显示暂无数据', async () => {
    const wrapper = mountTransfer({ filterable: true })
    await wrapper.find('.is-left .ui-transfer__input').setValue('选项')
    expect(itemsOf(wrapper, 'left')).toHaveLength(3)
    await wrapper.find('.is-left .ui-transfer__input').setValue('一')
    expect(itemsOf(wrapper, 'left').map((item) => item.text())).toEqual(['选项一'])
    await wrapper.find('.is-left .ui-transfer__input').setValue('不存在的词')
    expect(itemsOf(wrapper, 'left')).toHaveLength(0)
    expect(panel(wrapper, 'left').find('.ui-transfer__empty').exists()).toBe(true)
    wrapper.unmount()
  })

  it('筛选隐藏已勾选项但不影响移动载荷', async () => {
    const wrapper = mountTransfer({ filterable: true })
    await inputsOf(wrapper, 'left')[0].setValue(true)
    await inputsOf(wrapper, 'left')[1].setValue(true)
    await wrapper.find('.is-left .ui-transfer__input').setValue('不存在的词')
    expect(itemsOf(wrapper, 'left')).toHaveLength(0)
    await buttons(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 2]])
    wrapper.unmount()
  })

  it('两侧筛选各自收窄对应列表', async () => {
    const wrapper = mountTransfer({
      data: [
        { key: 1, label: '苹果' },
        { key: 2, label: '香蕉' },
        { key: 3, label: '苹果汁' }
      ],
      modelValue: [3],
      filterable: true
    })
    await wrapper.find('.is-left .ui-transfer__input').setValue('香蕉')
    await wrapper.find('.is-right .ui-transfer__input').setValue('苹果')
    expect(itemsOf(wrapper, 'left').map((item) => item.text())).toEqual(['香蕉'])
    expect(itemsOf(wrapper, 'right').map((item) => item.text())).toEqual(['苹果汁'])
    wrapper.unmount()
  })

  it('空数据时两侧面板均显示暂无数据', () => {
    const wrapper = mountTransfer({ data: [] })
    expect(panel(wrapper, 'left').find('.ui-transfer__empty').text()).toBe('暂无数据')
    expect(panel(wrapper, 'right').find('.ui-transfer__empty').text()).toBe('暂无数据')
    expect(buttons(wrapper).map((button) => button.attributes('disabled'))).toEqual(['', ''])
    wrapper.unmount()
  })

  it('data 或 modelValue 非数组时按空列表处理', () => {
    const wrapper = mountTransfer({ data: null, modelValue: 'x' } as Record<string, any>)
    expect(countOf(wrapper, 'left')).toBe('0/0')
    expect(countOf(wrapper, 'right')).toBe('0/0')
    expect(wrapper.findAll('.ui-transfer__item')).toHaveLength(0)
    wrapper.unmount()
  })

  it('key 按严格相等匹配划分左右', () => {
    const wrapper = mountTransfer({ data: [{ key: '1', label: '字符串键条目' }], modelValue: [1] })
    expect(itemsOf(wrapper, 'left').map((item) => item.text())).toEqual(['字符串键条目'])
    expect(itemsOf(wrapper, 'right')).toHaveLength(0)
    wrapper.unmount()
  })
})
