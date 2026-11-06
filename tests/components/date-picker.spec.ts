import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatePicker, DatePickerPanel } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

// 今天、此刻一类断言依赖系统时钟，统一冻结到 2026-11-06，避免用例随日历漂移
function freezeToday() {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 6, 9, 8, 7))
}

function mountPicker(props: Record<string, any> = {}) {
  const wrapper = mount(DatePicker, { props: { modelValue: '2026-11-06', ...props }, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function panel() {
  return document.querySelector('.ui-date-picker__dropdown') as HTMLElement | null
}

async function open(wrapper: ReturnType<typeof mountPicker>) {
  await wrapper.find('.ui-date-picker__trigger').trigger('click')
  await nextTick()
  expect(panel()).not.toBeNull()
}

function cells(scope: Element | null = panel()) {
  return Array.from(scope?.querySelectorAll('.ui-date-picker__cell') ?? []) as HTMLElement[]
}

function cellByText(text: string, scope: Element | null = panel()) {
  return cells(scope).find((cell) => cell.textContent === text && !cell.className.includes('is-outside')) as HTMLElement
}

async function clickNative(node: HTMLElement | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

function inputValue(wrapper: ReturnType<typeof mountPicker>) {
  return (wrapper.find('input').element as HTMLInputElement).value
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('DatePicker 日期选择', () => {
  // 今天/此刻一类按钮读系统时钟，整组用例统一冻结
  beforeEach(freezeToday)

  it('触发区由图标、输入框与动作区组成', async () => {
    const wrapper = mountPicker()
    await nextTick()
    const trigger = wrapper.find('.ui-date-picker__trigger')
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    // 特性开关类名跟随 props：非区间模式不再挂 --range（F-11 回归）
    expect(wrapper.classes()).toEqual([
      'ui-date-picker',
      'ui-date-picker--clearable',
      'ui-date-picker--popper',
      'ui-date-picker--editable',
      'ui-date-picker--format'
    ])
    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('选择日期')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(inputValue(wrapper)).toBe('2026-11-06')
    expect(wrapper.find('.ui-date-picker__icon').exists()).toBe(true)
    expect(wrapper.find('.ui-date-picker__clear').exists()).toBe(true)
    expect(wrapper.find('.ui-date-picker__arrow').exists()).toBe(true)
  })

  it('点击触发区展开面板并抛 visible-change', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    expect(wrapper.find('.ui-date-picker__trigger').attributes('aria-expanded')).toBe('true')
    expect(wrapper.classes()).toContain('is-open')
    expect(wrapper.emitted('visible-change')).toEqual([[true]])
    await wrapper.find('.ui-date-picker__trigger').trigger('click')
    await nextTick()
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
  })

  it('点击根节点不会展开面板', async () => {
    const wrapper = mountPicker()
    await wrapper.trigger('click')
    await nextTick()
    expect(wrapper.find('.ui-date-picker__trigger').attributes('aria-expanded')).toBe('false')
    expect(panel()).toBeNull()
  })

  it('面板头部显示年月并提供翻页', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    expect(Array.from(panel()!.querySelectorAll('.ui-date-picker__title')).map((t) => t.textContent)).toEqual([
      '2026年',
      '11月'
    ])
    expect(panel()!.querySelectorAll('.ui-date-picker__nav')).toHaveLength(2)
    await clickNative(panel()!.querySelector('.ui-date-picker__nav[aria-label="下一页"]'))
    expect(Array.from(panel()!.querySelectorAll('.ui-date-picker__title')).map((t) => t.textContent)).toEqual([
      '2026年',
      '12月'
    ])
    await clickNative(panel()!.querySelector('.ui-date-picker__nav[aria-label="上一页"]'))
    expect(Array.from(panel()!.querySelectorAll('.ui-date-picker__title')).map((t) => t.textContent)).toEqual([
      '2026年',
      '11月'
    ])
  })

  it('月历按周一开头排列，跨月补灰', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    expect(Array.from(panel()!.querySelectorAll('.ui-date-picker__weekday')).map((w) => w.textContent)).toEqual([
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
      '日'
    ])
    const list = cells()
    expect(list).toHaveLength(42)
    expect(list[0].className).toContain('is-outside')
    expect(list[0].textContent).toBe('26')
    expect(list[6].className).toBe('ui-date-picker__cell')
    expect(list.filter((cell) => cell.className.includes('is-outside'))).toHaveLength(12)
  })

  it('选中日与今日共用单元格类名', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const today = cells().find((cell) => cell.className.includes('is-today'))!
    expect(today.textContent).toBe('6')
    expect(today.className).toContain('is-selected')
    expect(cells().filter((cell) => cell.className.includes('is-selected'))).toHaveLength(1)
  })

  it('点击日期单元格提交并收起面板', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    await clickNative(cellByText('15'))
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-15']])
    expect(wrapper.emitted('change')).toEqual([['2026-11-15']])
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(inputValue(wrapper)).toBe('2026-11-06')
  })

  it('disabledDate 与 cellClassName 作用在单元格上', async () => {
    const wrapper = mountPicker({
      disabledDate: (date: Date) => date.getDate() % 2 === 0,
      cellClassName: (date: Date) => (date.getDate() === 15 ? 'mine-mark' : '')
    })
    await open(wrapper)
    expect(cellByText('2').className).toContain('is-disabled')
    expect(cellByText('3').className).not.toContain('is-disabled')
    expect(cellByText('15').className).toContain('mine-mark')
  })

  it('点击禁用单元格不提交', async () => {
    const wrapper = mountPicker({ disabledDate: (date: Date) => date.getDate() === 15 })
    await open(wrapper)
    await clickNative(cellByText('15'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('visible-change')).toEqual([[true]])
  })

  it('页脚提供今天与确定，确定再次提交并收起', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const actions = Array.from(
      panel()!.querySelectorAll('.ui-date-picker__footer-actions .ui-date-picker__action')
    ) as HTMLElement[]
    expect(actions.map((action) => action.textContent)).toEqual(['今天', '确定'])
    expect(actions[1].className).toContain('is-primary')
    await clickNative(actions[0])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2026-11-06'])
    await clickNative(actions[1])
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2)
  })

  it('快捷方式按文本提交对应日期', async () => {
    const wrapper = mountPicker({
      shortcuts: [
        { text: '今天', value: new Date(2026, 10, 6) },
        { text: '昨天', value: () => new Date(2026, 10, 5) }
      ]
    })
    await open(wrapper)
    const shortcuts = Array.from(panel()!.querySelectorAll('.ui-date-picker__shortcut')) as HTMLElement[]
    expect(shortcuts.map((item) => item.textContent)).toEqual(['今天', '昨天'])
    await clickNative(shortcuts[1])
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-05']])
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
  })

  it('showFooter 与 showConfirm 控制页脚', async () => {
    const hidden = mountPicker({ showFooter: false })
    await open(hidden)
    expect(panel()!.querySelector('.ui-date-picker__footer')).toBeNull()
    hidden.unmount()
    document.body.innerHTML = ''

    const noConfirm = mountPicker({ showConfirm: false })
    await open(noConfirm)
    const actions = Array.from(
      noConfirm.element.ownerDocument.querySelectorAll('.ui-date-picker__footer-actions .ui-date-picker__action')
    ) as HTMLElement[]
    expect(actions.map((action) => action.textContent)).toEqual(['今天'])
  })

  it('datetime 面板带时间列且页脚首项是此刻', async () => {
    const wrapper = mountPicker({ type: 'datetime', modelValue: '2026-11-06 08:00:00' })
    await open(wrapper)
    const actions = Array.from(
      panel()!.querySelectorAll('.ui-date-picker__footer-actions .ui-date-picker__action')
    ) as HTMLElement[]
    expect(actions.map((action) => action.textContent)).toEqual(['此刻', '确定'])
    await clickNative(actions[0])
    const value = wrapper.emitted('update:modelValue')?.[0]?.[0] as string
    expect(value).toMatch(/^2026-11-06 \d{2}:\d{2}:\d{2}$/)
  })

  it('month 与 year 切换成对应粒度的选择表', async () => {
    const month = mountPicker({ type: 'month' })
    await open(month)
    const monthCells = Array.from(panel()!.querySelectorAll('.ui-date-picker__month-cell')) as HTMLElement[]
    expect(monthCells).toHaveLength(12)
    expect(monthCells[10].className).toContain('is-selected')
    await clickNative(monthCells[2])
    expect(month.emitted('update:modelValue')).toEqual([['2026-03']])
    month.unmount()
    document.body.innerHTML = ''

    const year = mountPicker({ type: 'year', modelValue: '2026' })
    await open(year)
    const yearCells = Array.from(panel()!.querySelectorAll('.ui-date-picker__month-cell')) as HTMLElement[]
    expect(yearCells).toHaveLength(12)
    // 年份表按十年窗口升序铺满，选中值落在窗口内
    expect(yearCells.map((cell) => cell.textContent)).toEqual([
      '2016',
      '2017',
      '2018',
      '2019',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
      '2027'
    ])
    expect(yearCells[10].className).toContain('is-selected')
    expect(Array.from(panel()!.querySelectorAll('.ui-date-picker__title')).map((title) => title.textContent)).toEqual([
      '2026年'
    ])
    await clickNative(yearCells[3])
    expect(year.emitted('update:modelValue')).toEqual([['2019']])
    expect(year.emitted('change')).toEqual([['2019']])
    expect(year.emitted('visible-change')).toEqual([[true], [false]])
  })

  it('标题可切到年份表与月份表', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const titles = () => Array.from(panel()!.querySelectorAll('.ui-date-picker__title')) as HTMLElement[]
    expect(titles().map((title) => title.textContent)).toEqual(['2026年', '11月'])
    expect(titles().every((title) => !title.className.includes('is-active'))).toBe(true)

    // 点年前标题：换成十年年份表，标题高亮跟着走
    await clickNative(titles()[0])
    expect(panel()!.querySelector('.ui-date-picker__years')).not.toBeNull()
    expect(cells()).toHaveLength(0)
    expect(titles().map((title) => title.className)).toEqual([
      'ui-date-picker__title is-active',
      'ui-date-picker__title'
    ])

    // 点月份标题：换成十二个月表，高亮移到月份标题
    await clickNative(titles()[1])
    expect(panel()!.querySelector('.ui-date-picker__months')).not.toBeNull()
    expect(
      Array.from(panel()!.querySelectorAll('.ui-date-picker__month-cell')).map((cell) => cell.textContent)
    ).toEqual(['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'])
    expect(titles().map((title) => title.className)).toEqual([
      'ui-date-picker__title',
      'ui-date-picker__title is-active'
    ])
  })

  it('月表选月只换月份，之后再选日才提交', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const titles = () => Array.from(panel()!.querySelectorAll('.ui-date-picker__title')) as HTMLElement[]
    await clickNative(titles()[1])
    await clickNative(Array.from(panel()!.querySelectorAll<HTMLElement>('.ui-date-picker__month-cell'))[2])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    // 回到月历，标题已换成 3 月
    expect(titles().map((title) => title.textContent)).toEqual(['2026年', '3月'])
    expect(panel()!.querySelector('.ui-date-picker__months')).toBeNull()
    expect(cells()).toHaveLength(42)
    await clickNative(cellByText('18'))
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-03-18']])
    expect(wrapper.emitted('change')).toEqual([['2026-03-18']])
  })

  it('手动输入只在失焦时提交，非法文本回退原值', async () => {
    const wrapper = mountPicker()
    await wrapper.find('input').setValue('2026-12-25')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.find('input').trigger('blur')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-12-25']])
    expect(wrapper.emitted('change')?.slice(-1)).toEqual([['2026-12-25']])
    await wrapper.find('input').setValue('乱码')
    await wrapper.find('input').trigger('blur')
    await nextTick()
    expect(inputValue(wrapper)).toBe('2026-11-06')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('saveOnBlur 为 false 时失焦不提交', async () => {
    const wrapper = mountPicker({ saveOnBlur: false })
    await wrapper.find('input').setValue('2026-12-25')
    await wrapper.find('input').trigger('blur')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('readonly 写入输入框并拦截提交', async () => {
    const wrapper = mountPicker({ readonly: true })
    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
    await wrapper.find('input').setValue('2026-12-25')
    await wrapper.find('input').trigger('blur')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(inputValue(wrapper)).toBe('2026-12-25')
  })

  it('清空图标抛 clear 与空值', async () => {
    const wrapper = mountPicker()
    await wrapper.find('.ui-date-picker__clear').trigger('click')
    await nextTick()
    expect(wrapper.emitted('clear')).toEqual([[]])
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('change')).toEqual([['']])
  })

  it('清空后由使用方回写 modelValue，输入框才变空', async () => {
    const wrapper = mountPicker()
    await wrapper.find('.ui-date-picker__clear').trigger('click')
    await nextTick()
    // 受控值未回写时输入框仍显示原值
    expect(inputValue(wrapper)).toBe('2026-11-06')
    await wrapper.setProps({ modelValue: '' })
    expect(inputValue(wrapper)).toBe('')
  })

  it('禁用态没有清空按钮也无法展开', async () => {
    const wrapper = mountPicker({ disabled: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('.ui-date-picker__clear').exists()).toBe(false)
    await wrapper.find('.ui-date-picker__trigger').trigger('click')
    await nextTick()
    expect(panel()).toBeNull()
    expect(wrapper.find('.ui-date-picker__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('clearable 为 false 时没有清空按钮也不挂特性类名', async () => {
    const wrapper = mountPicker({ clearable: false })
    await nextTick()
    expect(wrapper.find('.ui-date-picker__clear').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('ui-date-picker--clearable')
  })

  it('size 与自定义 placeholder、format 生效', async () => {
    const wrapper = mountPicker({ size: 'large', placeholder: '请选择到访日期', format: 'YYYY年MM月DD日' })
    await nextTick()
    expect(wrapper.classes()).toContain('is-size-large')
    expect(wrapper.find('input').attributes('placeholder')).toBe('请选择到访日期')
    expect(inputValue(wrapper)).toBe('2026年11月06日')
  })

  it('区间模式渲染两个输入位与双面板', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['2026-11-01', '2026-11-06'] })
    await nextTick()
    const fields = wrapper.findAll('.ui-date-picker__field')
    expect(fields).toHaveLength(2)
    expect(fields.map((field) => field.attributes('role'))).toEqual(['combobox', 'combobox'])
    expect(wrapper.findAll('input').map((input) => input.attributes('placeholder'))).toEqual(['开始日期', '结束日期'])
    expect(wrapper.find('.ui-date-picker__separator').text()).toBe('-')
    await fields[0].trigger('click')
    await nextTick()
    expect(panel()!.querySelectorAll('.ui-date-picker__panel')).toHaveLength(2)
    // 双面板按相邻两个月铺开后合起来覆盖整个区间
    expect(
      Array.from(panel()!.querySelectorAll('.ui-date-picker__panel-title')).map((title) => title.textContent)
    ).toEqual(['2026年11月', '2026年12月'])
    const marks = cells().filter((cell) => cell.className.match(/is-selected|is-in-range/))
    expect(marks.map((cell) => cell.textContent)).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(marks[0].className).toContain('is-selected')
    expect(marks[1].className).toContain('is-in-range')
  })

  it('区间的分隔符与占位文案可配置', async () => {
    const wrapper = mountPicker({
      isRange: true,
      modelValue: [],
      rangeSeparator: '到',
      startPlaceholder: '入住',
      endPlaceholder: '退房'
    })
    await nextTick()
    expect(wrapper.find('.ui-date-picker__separator').text()).toBe('到')
    expect(wrapper.findAll('input').map((input) => input.attributes('placeholder'))).toEqual(['入住', '退房'])
  })

  it('type=dates 支持多选，每次点击抛出升序日期数组', async () => {
    // F-15 回归：dates 粒度过去被当单日处理，只抛一个字符串
    const wrapper = mountPicker({ type: 'dates', modelValue: [] })
    await open(wrapper)
    await clickNative(cellByText('2'))
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['2026-11-02'])
    await clickNative(cellByText('1'))
    expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toEqual(['2026-11-01', '2026-11-02'])
    expect(
      cells()
        .filter((cell) => cell.className.includes('is-selected'))
        .map((cell) => cell.textContent)
    ).toEqual(['1', '2'])
    expect(panel()).not.toBeNull()

    // 再点一次取消该日，其余保持选中
    await clickNative(cellByText('1'))
    expect(wrapper.emitted('update:modelValue')?.[2]?.[0]).toEqual(['2026-11-02'])
    const actions = Array.from(panel()!.querySelectorAll('.ui-date-picker__action')) as HTMLElement[]
    await clickNative(actions.find((action) => action.textContent === '确定'))
    expect(panel()).toBeNull()
  })

  it('空值时输入框为空且没有选中单元格', async () => {
    const wrapper = mountPicker({ modelValue: '' })
    await open(wrapper)
    expect(inputValue(wrapper)).toBe('')
    expect(cells().filter((cell) => cell.className.includes('is-selected'))).toHaveLength(0)
  })
})

describe('DatePickerPanel 日期面板', () => {
  it('独立面板直接渲染月历', async () => {
    const wrapper = mount(DatePickerPanel, { props: { modelValue: '2026-11-06' }, attachTo: document.body })
    mounted.push(wrapper)
    await nextTick()
    expect(wrapper.classes()).toContain('ui-date-picker-panel')
    expect(wrapper.find('.ui-date-picker__dropdown').exists()).toBe(false)
    expect(wrapper.findAll('.ui-date-picker-panel__cell')).toHaveLength(42)
    expect(wrapper.find('.ui-date-picker-panel__title').text()).toBe('2026年 11月')
    expect(wrapper.findAll('.ui-date-picker-panel__nav').map((nav) => nav.attributes('aria-label'))).toEqual([
      '上一组',
      '上一页',
      '下一页',
      '下一组'
    ])
  })

  it('面板点击单元格直接提交且不产生浮层', async () => {
    const wrapper = mount(DatePickerPanel, { props: { modelValue: '2026-11-06' }, attachTo: document.body })
    mounted.push(wrapper)
    const target = wrapper.findAll('.ui-date-picker-panel__cell').find((cell) => cell.text() === '15')!
    await target.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-15']])
    expect(wrapper.emitted('change')).toEqual([['2026-11-15']])
    expect(document.querySelector('.ui-date-picker__dropdown')).toBeNull()
  })
})
