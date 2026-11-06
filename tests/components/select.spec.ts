import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Option, OptionGroup, Select } from '@ui-kit-full'

const options = [
  { value: 1, label: '选项一' },
  { value: 2, label: '选项二' },
  { value: 3, label: '禁用项', disabled: true }
]

let wrappers: VueWrapper[] = []

// 下拉面板 teleport 到 body 且常驻 DOM（收起时只是不带 is-open），
// 因此挂载必须 attachTo body，展开状态一律用触发器上的 aria-expanded 判定
function mountSelect(props: Record<string, unknown> = {}) {
  const wrapper = mount(Select, { props, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

function optionItems() {
  return Array.from(document.querySelectorAll('.ui-select__option'))
}

async function clickOption(el: Element) {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers = []
  document.body.innerHTML = ''
})

describe('Select', () => {
  it('渲染 combobox 触发器且默认收起', () => {
    const wrapper = mountSelect({ modelValue: undefined })
    const trigger = wrapper.find('.ui-select__trigger')
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.classes()).not.toContain('is-open')
  })

  it('空值显示占位文案，缺省回显“请选择”', () => {
    expect(
      mountSelect({ modelValue: undefined, placeholder: '请选择城市' }).find('.ui-select__placeholder').text()
    ).toBe('请选择城市')
    expect(mountSelect({ modelValue: undefined }).find('.ui-select__placeholder').text()).toBe('请选择')
  })

  // 原缺陷 F-2：modelValue 的类型联合含 Boolean，缺省的键被归一化成 false，
  // 占位文案被 "false" 顶掉；props 声明 default: undefined 后恢复正常
  it('完全不传 modelValue 时仍显示占位文案', () => {
    const wrapper = mountSelect({ options })
    expect(wrapper.find('.ui-select__placeholder').exists()).toBe(true)
    expect(wrapper.find('.ui-select__selected').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('false')
  })

  // 原缺陷 F-1：normalizeOptions 漏传 props 映射，自定义字段名的选项文案渲染为空
  it('props 字段映射决定选项文案与取值', async () => {
    const wrapper = mountSelect({
      options: [
        { id: 'a', text: '甲' },
        { id: 'b', text: '乙', off: true }
      ],
      props: { label: 'text', value: 'id', disabled: 'off' }
    })
    await wrapper.find('.ui-select__trigger').trigger('click')
    expect(optionItems().map((item) => item.textContent)).toEqual(['甲', '乙'])
    expect(optionItems()[1].className).toContain('is-disabled')
    await clickOption(optionItems()[0])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
  })

  it('modelValue 命中选项时回显 label', () => {
    expect(mountSelect({ options, modelValue: 1 }).find('.ui-select__selected').text()).toBe('选项一')
  })

  it('未命中值直接回显字符串', () => {
    expect(mountSelect({ options, modelValue: 99 }).find('.ui-select__selected').text()).toBe('99')
  })

  it('点击触发器展开并抛出 visible-change(true)', async () => {
    const wrapper = mountSelect({ options, modelValue: undefined })
    await wrapper.find('.ui-select__trigger').trigger('click')
    expect(wrapper.classes()).toContain('is-open')
    expect(wrapper.find('.ui-select__trigger').attributes('aria-expanded')).toBe('true')
    expect(wrapper.emitted('visible-change')?.[0]).toEqual([true])
    expect(optionItems().map((item) => item.textContent)).toEqual(['选项一', '选项二', '禁用项'])
  })

  it('禁用态加 is-disabled 类名且展开后选项不可选', async () => {
    const wrapper = mountSelect({ options, disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    await wrapper.find('.ui-select__trigger').trigger('click')
    expect(wrapper.find('.ui-select__trigger').attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('visible-change')).toBeUndefined()
  })

  it('点击选项抛出 update:modelValue 与 change 并收起面板', async () => {
    const wrapper = mountSelect({ options, modelValue: undefined })
    await wrapper.find('.ui-select__trigger').trigger('click')
    await clickOption(optionItems()[0])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
    expect(wrapper.emitted('change')?.[0]).toEqual([1])
    expect(wrapper.classes()).not.toContain('is-open')
  })

  it('禁用选项带 is-disabled 且点击无效', async () => {
    const wrapper = mountSelect({ options, modelValue: undefined })
    await wrapper.find('.ui-select__trigger').trigger('click')
    const disabled = optionItems()[2]
    expect(disabled.className).toContain('is-disabled')
    await clickOption(disabled)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('已选中项标记 aria-selected', async () => {
    const wrapper = mountSelect({ options, modelValue: 2 })
    await wrapper.find('.ui-select__trigger').trigger('click')
    expect(optionItems()[1].getAttribute('aria-selected')).toBe('true')
    expect(optionItems()[0].getAttribute('aria-selected')).toBe('false')
  })

  it('Escape 收起面板并抛出 visible-change(false)', async () => {
    const wrapper = mountSelect({ options, modelValue: undefined })
    await wrapper.find('.ui-select__trigger').trigger('click')
    await wrapper.find('.ui-select__trigger').trigger('keydown', { key: 'Escape' })
    expect(wrapper.classes()).not.toContain('is-open')
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
  })

  it('方向键循环高亮并跳过禁用项', async () => {
    const wrapper = mountSelect({ options, modelValue: undefined })
    await wrapper.find('.ui-select__trigger').trigger('click')
    const active = () => optionItems().findIndex((item) => item.className.includes('is-active'))
    expect(active()).toBe(0)
    await wrapper.find('.ui-select__trigger').trigger('keydown', { key: 'ArrowDown' })
    expect(active()).toBe(1)
    // 第三项禁用，继续向下回到第一项
    await wrapper.find('.ui-select__trigger').trigger('keydown', { key: 'ArrowDown' })
    expect(active()).toBe(0)
    await wrapper.find('.ui-select__trigger').trigger('keydown', { key: 'ArrowUp' })
    expect(active()).toBe(1)
  })

  it('Enter 选中当前高亮项', async () => {
    const wrapper = mountSelect({ options, modelValue: undefined })
    await wrapper.find('.ui-select__trigger').trigger('click')
    await wrapper.find('.ui-select__trigger').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
  })

  it('multiple 渲染标签并可单个移除', async () => {
    const wrapper = mountSelect({ options, multiple: true, modelValue: [1, 2] })
    expect(wrapper.classes()).toContain('ui-select--multiple')
    const tags = wrapper.findAll('.ui-select__tag')
    expect(tags).toHaveLength(2)
    expect(tags[0].text()).toContain('选项一')
    await tags[0].find('.ui-select__tag-close').trigger('click')
    expect(wrapper.emitted('remove-tag')?.[0]).toEqual([1])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[2]])
  })

  it('collapseTags + maxCollapseTags 折叠多余标签并显示 +N', () => {
    const wrapper = mountSelect({ options, multiple: true, modelValue: [1, 2], collapseTags: true, maxCollapseTags: 1 })
    expect(wrapper.findAll('.ui-select__tag:not(.ui-select__tag--more)')).toHaveLength(1)
    const more = wrapper.find('.ui-select__tag--more')
    expect(more.exists()).toBe(true)
    expect(more.text()).toBe('+1')
  })

  it('tagType / tagEffect 落到标签类名', () => {
    const wrapper = mountSelect({ options, multiple: true, modelValue: [1], tagType: 'danger', tagEffect: 'dark' })
    expect(wrapper.find('.ui-select__tag').classes()).toEqual(
      expect.arrayContaining(['ui-select__tag', 'is-danger', 'is-dark'])
    )
  })

  it('multipleLimit 限制可选数量', async () => {
    const wrapper = mountSelect({ options, multiple: true, modelValue: [1], multipleLimit: 1 })
    await wrapper.find('.ui-select__trigger').trigger('click')
    await clickOption(optionItems()[1])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('clearable 清空并抛出 clear', async () => {
    const wrapper = mountSelect({ options, modelValue: 1, clearable: true })
    await wrapper.find('.ui-select__trigger').trigger('mouseenter')
    expect(wrapper.find('.ui-select__clear').exists()).toBe(true)
    await wrapper.find('.ui-select__clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    // valueOnClear 缺省为 undefined
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([undefined])
    expect(wrapper.emitted('change')?.[0]).toEqual([undefined])
  })

  it('valueOnClear 自定义清空值', async () => {
    const wrapper = mountSelect({ options, modelValue: 1, clearable: true, valueOnClear: '' })
    await wrapper.find('.ui-select__trigger').trigger('mouseenter')
    await wrapper.find('.ui-select__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('filterable 提供输入框并按关键字过滤', async () => {
    const wrapper = mountSelect({ options, filterable: true, modelValue: undefined })
    await wrapper.find('.ui-select__trigger').trigger('click')
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    await input.setValue('选项二')
    expect(optionItems().map((item) => item.textContent)).toEqual(['选项二'])
  })

  it('filterable 大小写不敏感', async () => {
    const mixed = [{ value: 1, label: 'Apple' }]
    const wrapper = mountSelect({ options: mixed, filterable: true, modelValue: undefined })
    await wrapper.find('.ui-select__trigger').trigger('click')
    await wrapper.find('input').setValue('app')
    expect(optionItems()).toHaveLength(1)
  })

  it('filterMethod 自定义过滤', async () => {
    const wrapper = mountSelect({
      options,
      filterable: true,
      modelValue: undefined,
      filterMethod: (keyword: string, option: { label: string }) => option.label.includes(keyword)
    })
    await wrapper.find('.ui-select__trigger').trigger('click')
    await wrapper.find('input').setValue('禁用')
    expect(optionItems().map((item) => item.textContent)).toEqual(['禁用项'])
  })

  it('filterable 无匹配时显示 noMatchText', async () => {
    const wrapper = mountSelect({ options, filterable: true, noMatchText: '没找到' })
    await wrapper.find('.ui-select__trigger').trigger('click')
    await wrapper.find('input').setValue('zzz')
    expect(document.body.textContent).toContain('没找到')
  })

  it('无选项时显示 noDataText', async () => {
    const wrapper = mountSelect({ options: [], noDataText: '暂无数据' })
    await wrapper.find('.ui-select__trigger').trigger('click')
    expect(document.body.textContent).toContain('暂无数据')
  })

  it('loading 时面板显示加载文案', async () => {
    const wrapper = mountSelect({ options, loading: true, loadingText: '加载中' })
    await wrapper.find('.ui-select__trigger').trigger('click')
    expect(document.body.textContent).toContain('加载中')
  })

  it('插槽 Option / OptionGroup 参与选项列表', async () => {
    const wrapper = mount(Select, {
      props: { options: undefined, modelValue: undefined },
      attachTo: document.body,
      slots: {
        default: () => [
          h(Option, { value: 'a', label: '甲' }),
          h(OptionGroup, { label: '分组' }, () => [h(Option, { value: 'b', label: '乙' })])
        ]
      }
    })
    wrappers.push(wrapper)
    await wrapper.find('.ui-select__trigger').trigger('click')
    expect(document.body.textContent).toContain('甲')
    expect(document.body.textContent).toContain('分组')
    await clickOption(optionItems()[0])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
  })

  it('suffixIcon 渲染在操作区', () => {
    const wrapper = mountSelect({ options, suffixIcon: 'Star' })
    expect(wrapper.find('.ui-select__arrow').exists()).toBe(true)
  })
})
