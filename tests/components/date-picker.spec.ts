import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigProvider, DatePicker, DatePickerPanel } from '@ui-kit-full'

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

// 键盘路径一律派发真实 keydown：只有真事件的 target 才是被按键的元素，
// 才能同时验证"输入框按键冒泡到触发区后被挡掉"这类分流语义
async function keydownOn(node: Element | null | undefined, key: string) {
  node?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await nextTick()
}

// 行首不能以括号起手：无分号风格下会被 ASI 拼进上一条语句
function focusNode(node: Element | null | undefined) {
  const element = node as HTMLElement | null | undefined
  element?.focus()
}

// 焦点落点断言只认"activeElement 是不是某个日格"，不锁实现里的查找顺序细节
function activeCell() {
  const active = document.activeElement as HTMLElement | null
  return active?.classList?.contains('ui-date-picker__cell') ? active : null
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
    await clickNative(panel()!.querySelector<HTMLElement>('.ui-date-picker__nav[aria-label="下一页"]'))
    expect(Array.from(panel()!.querySelectorAll('.ui-date-picker__title')).map((t) => t.textContent)).toEqual([
      '2026年',
      '12月'
    ])
    await clickNative(panel()!.querySelector<HTMLElement>('.ui-date-picker__nav[aria-label="上一页"]'))
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

  it('文案来自 ConfigProvider 注入的 locale，未注入键回退中文', async () => {
    const wrapper = mount(ConfigProvider, {
      props: {
        locale: {
          datePicker: {
            placeholder: 'Pick a date',
            today: 'Today',
            confirm: 'OK',
            prevPage: 'Previous',
            nextPage: 'Next',
            monthFormat: '{month}M',
            weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
          }
        }
      },
      slots: { default: () => h(DatePicker, { modelValue: '2026-11-06' }) },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await nextTick()
    expect(wrapper.find('input').attributes('placeholder')).toBe('Pick a date')
    await wrapper.find('.ui-date-picker__trigger').trigger('click')
    await nextTick()
    const actions = Array.from(
      panel()!.querySelectorAll('.ui-date-picker__footer-actions .ui-date-picker__action')
    ) as HTMLElement[]
    expect(actions.map((action) => action.textContent)).toEqual(['Today', 'OK'])
    expect(panel()!.querySelectorAll('.ui-date-picker__nav')[0].getAttribute('aria-label')).toBe('Previous')
    expect(panel()!.querySelectorAll('.ui-date-picker__nav')[1].getAttribute('aria-label')).toBe('Next')
    expect(Array.from(panel()!.querySelectorAll('.ui-date-picker__weekday')).map((node) => node.textContent)).toEqual([
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su'
    ])
    // monthFormat 已注入，yearFormat 未注入仍回退默认中文
    expect(Array.from(panel()!.querySelectorAll('.ui-date-picker__title')).map((node) => node.textContent)).toEqual([
      '2026年',
      '11M'
    ])
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

  // 原缺陷：showSeconds 用 pattern.includes('s') 判断，格式串里带字面 s（如 '(summer)'）会误开秒列；
  // 修复后与 time-picker 共用 shared/date 的 hasSecondsToken，只认 s/ss 占位
  it('格式串含字面 s（非秒占位）不渲染秒列', async () => {
    const wrapper = mountPicker({
      type: 'datetime',
      modelValue: '2026-11-06 08:00',
      format: 'YYYY-MM-DD HH:mm (summer)'
    })
    await open(wrapper)
    const titles = Array.from(document.querySelectorAll('.ui-date-picker__time-title')).map((el) => el.textContent)
    expect(titles).toEqual(['时', '分'])
    expect(titles).not.toContain('秒')
  })

  it('格式串含 ss 秒占位时渲染秒列', async () => {
    const wrapper = mountPicker({ type: 'datetime', modelValue: '2026-11-06 08:00:00' })
    await open(wrapper)
    const titles = Array.from(document.querySelectorAll('.ui-date-picker__time-title')).map((el) => el.textContent)
    expect(titles).toEqual(['时', '分', '秒'])
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
    expect(wrapper.classes()).toContain('--size-large')
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

describe('DatePicker 键盘操作', () => {
  beforeEach(freezeToday)

  it('触发区 Enter / ArrowDown 打开面板并把焦点落到已选日', async () => {
    const wrapper = mountPicker({ modelValue: '2026-11-15' })
    const trigger = wrapper.find('.ui-date-picker__trigger')
    await keydownOn(trigger.element, 'Enter')
    await nextTick()
    expect(panel()).not.toBeNull()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.emitted('visible-change')).toEqual([[true]])
    expect(activeCell()?.textContent).toBe('15')
    expect(activeCell()?.className).toContain('is-selected')

    await keydownOn(activeCell(), 'Escape')
    await nextTick()
    expect(panel()).toBeNull()
    expect(trigger.attributes('aria-expanded')).toBe('false')

    // ArrowDown 与 Enter 等价：再次打开仍落在已选日上
    await keydownOn(trigger.element, 'ArrowDown')
    await nextTick()
    expect(panel()).not.toBeNull()
    expect(activeCell()?.textContent).toBe('15')
  })

  it('没有已选日时焦点落到今天', async () => {
    const wrapper = mountPicker({ modelValue: '' })
    await keydownOn(wrapper.find('.ui-date-picker__trigger').element, 'Enter')
    await nextTick()
    expect(activeCell()?.textContent).toBe('6')
    expect(activeCell()?.className).toContain('is-today')
  })

  it('今天与已选日都被禁用时焦点落到首个可用日格', async () => {
    const wrapper = mountPicker({ modelValue: '', disabledDate: (date: Date) => date.getDate() !== 20 })
    await keydownOn(wrapper.find('.ui-date-picker__trigger').element, 'ArrowDown')
    await nextTick()
    expect(activeCell()?.textContent).toBe('20')
    expect(activeCell()?.className).not.toContain('is-disabled')
  })

  it('网格 ←→↑↓ 漫游，↑↓ 按整周跳，Home / End 到两端', async () => {
    const wrapper = mountPicker({ modelValue: '2026-11-06' })
    await keydownOn(wrapper.find('.ui-date-picker__trigger').element, 'Enter')
    await nextTick()
    const index = () => cells().indexOf(document.activeElement as HTMLElement)
    const start = index()
    expect(start).toBeGreaterThan(0)

    await keydownOn(document.activeElement, 'ArrowRight')
    expect(index()).toBe(start + 1)
    await keydownOn(document.activeElement, 'ArrowDown')
    expect(index()).toBe(start + 8)
    await keydownOn(document.activeElement, 'ArrowLeft')
    expect(index()).toBe(start + 7)
    await keydownOn(document.activeElement, 'ArrowUp')
    expect(index()).toBe(start)
    await keydownOn(document.activeElement, 'Home')
    expect(index()).toBe(0)
    await keydownOn(document.activeElement, 'End')
    expect(index()).toBe(cells().length - 1)
  })

  it('方向键漫游跳过禁用日格', async () => {
    const wrapper = mountPicker({ modelValue: '2026-11-15', disabledDate: (date: Date) => date.getDate() === 16 })
    await keydownOn(wrapper.find('.ui-date-picker__trigger').element, 'Enter')
    await nextTick()
    expect(activeCell()?.textContent).toBe('15')
    await keydownOn(document.activeElement, 'ArrowRight')
    expect(activeCell()?.textContent).toBe('17')
  })

  it('Escape 收起面板并把焦点归还触发区', async () => {
    const wrapper = mountPicker()
    const trigger = wrapper.find('.ui-date-picker__trigger')
    // 真实键盘路径：焦点先落在触发区，再按键打开
    focusNode(trigger.element)
    await keydownOn(trigger.element, 'Enter')
    await nextTick()
    expect(activeCell()?.textContent).toBe('6')

    await keydownOn(activeCell(), 'Escape')
    await nextTick()
    expect(panel()).toBeNull()
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(document.activeElement).toBe(trigger.element)
  })

  it('触发区上 Escape 同样收起面板并归还焦点', async () => {
    const wrapper = mountPicker()
    const trigger = wrapper.find('.ui-date-picker__trigger')
    focusNode(trigger.element)
    await wrapper.find('.ui-date-picker__trigger').trigger('click')
    await nextTick()
    expect(panel()).not.toBeNull()

    await keydownOn(trigger.element, 'Escape')
    await nextTick()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('外部点击收起面板时不抢回焦点', async () => {
    const wrapper = mountPicker()
    const trigger = wrapper.find('.ui-date-picker__trigger')
    focusNode(trigger.element)
    await keydownOn(trigger.element, 'ArrowDown')
    await nextTick()
    expect(activeCell()?.textContent).toBe('6')

    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(panel()).toBeNull()
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(document.activeElement).not.toBe(trigger.element)
  })

  it('输入框草稿未改动时 Enter 打开面板，有改动时只提交不重开', async () => {
    const wrapper = mountPicker()
    const input = wrapper.find('input')
    await keydownOn(input.element, 'Enter')
    await nextTick()
    expect(panel()).not.toBeNull()
    expect(activeCell()?.textContent).toBe('6')

    // 面板内 Escape 收起后，草稿改动再回车：走提交路径，且不会再被触发区处理器重开
    await keydownOn(input.element, 'Escape')
    await nextTick()
    expect(panel()).toBeNull()
    await input.setValue('2026-12-25')
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.slice(-1)).toEqual([['2026-12-25']])
    expect(panel()).toBeNull()

    // 草稿已提交、面板保持收起时，ArrowDown 仍可重新打开
    await keydownOn(input.element, 'ArrowDown')
    await nextTick()
    expect(panel()).not.toBeNull()
  })

  it('区间字段 Enter 打开双面板，焦点落在区间开始日', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['2026-11-01', '2026-11-06'] })
    const fields = wrapper.findAll('.ui-date-picker__field')
    await keydownOn(fields[0].element, 'Enter')
    await nextTick()
    expect(panel()!.querySelectorAll('.ui-date-picker__panel')).toHaveLength(2)
    expect(fields.map((field) => field.attributes('aria-expanded'))).toEqual(['true', 'true'])
    expect(activeCell()?.textContent).toBe('1')
    expect(activeCell()?.className).toContain('is-selected')
  })

  it('区间字段 Escape 收起面板并把焦点归还该字段', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['2026-11-01', '2026-11-06'] })
    const fields = wrapper.findAll('.ui-date-picker__field')
    focusNode(fields[0].element)
    await keydownOn(fields[0].element, 'ArrowDown')
    await nextTick()
    expect(panel()).not.toBeNull()

    await keydownOn(activeCell(), 'Escape')
    await nextTick()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(fields[0].element)
  })

  it('区间草稿回车整段提交并收起', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['2026-11-01', '2026-11-06'] })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('2026-11-03')
    await inputs[0].trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.slice(-1)).toEqual([[['2026-11-03', '2026-11-06']]])
    expect(panel()).toBeNull()
  })
})

describe('DatePicker 面板细粒度交互', () => {
  beforeEach(freezeToday)

  function timeItem(lists: HTMLElement[], column: number, index: number) {
    return lists[column].querySelectorAll<HTMLElement>('.ui-date-picker__time-item')[index]
  }

  it('datetime 面板的时分秒列点选即刻写回且不收起', async () => {
    const wrapper = mountPicker({ type: 'datetime', modelValue: '2026-11-06 08:30:00' })
    await open(wrapper)
    const lists = Array.from(panel()!.querySelectorAll('.ui-date-picker__time-list')) as HTMLElement[]
    expect(lists).toHaveLength(3)
    await clickNative(timeItem(lists, 0, 10))
    expect(wrapper.emitted('update:modelValue')?.slice(-1)).toEqual([['2026-11-06 10:30:00']])
    await clickNative(timeItem(lists, 1, 5))
    expect(wrapper.emitted('update:modelValue')?.slice(-1)).toEqual([['2026-11-06 10:05:00']])
    await clickNative(timeItem(lists, 2, 7))
    expect(wrapper.emitted('update:modelValue')?.slice(-1)).toEqual([['2026-11-06 10:05:07']])
    expect(panel()).not.toBeNull()
  })

  it('datetime 的禁用时分秒列项标灰且点击不写回', async () => {
    const wrapper = mountPicker({
      type: 'datetime',
      modelValue: '2026-11-06 08:30:00',
      disabledHours: () => [9],
      disabledMinutes: () => [31],
      disabledSeconds: () => [32]
    })
    await open(wrapper)
    const lists = Array.from(panel()!.querySelectorAll('.ui-date-picker__time-list')) as HTMLElement[]
    const marks: HTMLElement[] = [timeItem(lists, 0, 9), timeItem(lists, 1, 31), timeItem(lists, 2, 32)]
    expect(marks.map((item) => item.className.includes('is-disabled'))).toEqual([true, true, true])
    expect(marks.map((item) => (item as HTMLButtonElement).disabled)).toEqual([true, true, true])
    for (const mark of marks) {
      await clickNative(mark)
    }
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('unlinkPanels 时两块面板各自翻月', async () => {
    const wrapper = mountPicker({ isRange: true, unlinkPanels: true, modelValue: ['2026-11-01', '2026-12-06'] })
    await wrapper.findAll('.ui-date-picker__field')[0].trigger('click')
    await nextTick()
    const titles = () =>
      Array.from(panel()!.querySelectorAll('.ui-date-picker__title.is-static')).map((title) => title.textContent)
    expect(titles()).toEqual(['2026年11月', '2026年12月'])

    const panels = Array.from(panel()!.querySelectorAll('.ui-date-picker__panel')) as HTMLElement[]
    await clickNative(panels[0].querySelector<HTMLElement>('.ui-date-picker__nav[aria-label="下一页"]'))
    expect(titles()).toEqual(['2026年12月', '2026年12月'])
    await clickNative(panels[1].querySelector<HTMLElement>('.ui-date-picker__nav[aria-label="上一页"]'))
    expect(titles()).toEqual(['2026年12月', '2026年11月'])
  })

  it('showWeekNumber 渲染每周周号', async () => {
    const wrapper = mountPicker({ showWeekNumber: true })
    await open(wrapper)
    const weeks = Array.from(panel()!.querySelectorAll('.ui-date-picker__week-num')) as HTMLElement[]
    expect(weeks.map((week) => week.textContent)).toEqual(['W44', 'W45', 'W46', 'W47', 'W48', 'W49'])
    expect(weeks[0].getAttribute('title')).toBe('第 44 周')
    expect(panel()!.querySelectorAll('.ui-date-picker__weekday')).toHaveLength(8)
    expect(cells()).toHaveLength(42)
  })

  it('年份表与月份表按页翻动', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    const titles = () => Array.from(panel()!.querySelectorAll('.ui-date-picker__title')) as HTMLElement[]
    const yearCells = () =>
      Array.from(panel()!.querySelectorAll('.ui-date-picker__month-cell')).map((cell) => cell.textContent)

    await clickNative(titles()[0])
    expect(yearCells()[0]).toBe('2016')
    // 年份表一次翻一页（12 年），十年窗口按 12 年对齐重排
    await clickNative(panel()!.querySelector<HTMLElement>('.ui-date-picker__nav[aria-label="下一页"]'))
    expect(titles()[0].textContent).toBe('2038年')
    expect(yearCells()[0]).toBe('2028')

    // 月份表翻页按整年滚动
    await clickNative(titles()[1])
    expect(yearCells()).toHaveLength(12)
    await clickNative(panel()!.querySelector<HTMLElement>('.ui-date-picker__nav[aria-label="下一页"]'))
    expect(titles()[0].textContent).toBe('2039年')
  })

  it('点输入框同样展开面板', async () => {
    const wrapper = mountPicker()
    await wrapper.find('input').trigger('click')
    await nextTick()
    expect(panel()).not.toBeNull()
    expect(wrapper.emitted('visible-change')).toEqual([[true]])
  })

  it('区间草稿缺一端时只落一端，两端颠倒时提交前互换', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: [] })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('2026-11-20')
    await inputs[0].trigger('keydown', { key: 'Enter' })
    await nextTick()
    // 只填了开始位：先记下这一端，等第二次选择，不抛值
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await inputs[1].setValue('2026-11-10')
    await inputs[0].trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.slice(-1)).toEqual([[['2026-11-10', '2026-11-20']]])
  })

  it('多选面板的「今天」把今天并入勾选且保持展开', async () => {
    const wrapper = mountPicker({ type: 'dates', modelValue: [] })
    await open(wrapper)
    const todayAction = () =>
      Array.from(panel()!.querySelectorAll('.ui-date-picker__action')).find(
        (action) => action.textContent === '今天'
      ) as HTMLElement
    await clickNative(todayAction())
    expect(wrapper.emitted('update:modelValue')?.slice(-1)).toEqual([[['2026-11-06']]])
    expect(panel()).not.toBeNull()
    // 已勾选今天时不重复抛值
    await clickNative(todayAction())
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
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
