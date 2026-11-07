import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatePickerPanel } from '@ui-kit-full'

/**
 * DatePickerPanel 内联日期面板：不含触发器，只渲染日历网格与页脚操作。
 * 口径：网格粒度与类名 / 选中与范围标记 / 提交载荷 / disabled 与快捷操作 / 双面板联动等特性开关。
 */
let mounted: ReturnType<typeof mount>[] = []

const mountPanel = (props: Record<string, any> = {}) => {
  const wrapper = mount(DatePickerPanel, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

const reset = () => {
  mounted.forEach((wrapper) => wrapper.unmount())
  mounted = []
  document.body.innerHTML = ''
}

const panels = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-date-picker-panel__panel'))
const cells = (panelIndex?: number) => {
  const scope: ParentNode = panelIndex === undefined ? document : panels()[panelIndex]
  return Array.from(scope.querySelectorAll<HTMLButtonElement>('.ui-date-picker-panel__cell'))
}
const cell = (text: string, panelIndex?: number) =>
  cells(panelIndex).find((node) => node.textContent === text && !node.className.includes('is-outside'))
const titles = () =>
  Array.from(document.querySelectorAll('.ui-date-picker-panel__title')).map((node) => node.textContent)
const footer = () => document.querySelector('.ui-date-picker-panel__footer')

async function click(node: Element | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 6, 9, 8, 7))
})

afterEach(() => {
  reset()
  vi.useRealTimers()
})

describe('DatePickerPanel 日期面板', () => {
  it('默认渲染单面板、周一起始的 6 行网格与结构类名', async () => {
    const wrapper = mountPanel()
    await nextTick()
    expect(wrapper.classes()).toEqual(['ui-date-picker-panel', 'ui-date-picker-panel--appearance'])
    expect(wrapper.find('.ui-date-picker-panel__grid').classes()).toEqual(['ui-date-picker-panel__grid', 'is-date'])
    expect(panels()).toHaveLength(1)
    expect(titles()).toEqual(['2026年 11月'])
    expect(
      Array.from(document.querySelectorAll('.ui-date-picker-panel__weekday')).map((node) => node.textContent)
    ).toEqual(['一', '二', '三', '四', '五', '六', '日'])
    expect(cells()).toHaveLength(42)
    expect(cells().filter((node) => node.className.includes('is-outside'))).toHaveLength(12)
    expect(cells()[6].textContent).toBe('1')
    expect(wrapper.findAll('.ui-date-picker-panel__nav')).toHaveLength(4)
    expect(
      Array.from(document.querySelectorAll('.ui-date-picker-panel__nav')).map((node) => node.getAttribute('aria-label'))
    ).toEqual(['上一组', '上一页', '下一页', '下一组'])
    expect(
      Array.from(document.querySelectorAll('.ui-date-picker-panel__footer > *')).map((node) => node.className)
    ).toEqual(['ui-date-picker-panel__now', 'ui-date-picker-panel__clear'])
  })

  it('今日与受控选中日期共用单元格类名，且今日只落在本月', async () => {
    mountPanel({ modelValue: '2026-11-06' })
    await nextTick()
    const today = cells().filter((node) => node.className.includes('is-today'))
    expect(today).toHaveLength(1)
    expect(today[0].textContent).toBe('6')
    expect(today[0].className).not.toContain('is-outside')
    const selected = cells().filter((node) => node.className.includes('is-selected'))
    expect(selected).toHaveLength(1)
    expect(selected[0].textContent).toBe('6')
    expect(selected[0].className).toContain('is-today')
    expect(selected[0].disabled).toBe(false)
  })

  it('默认点击日期立即抛 update:modelValue 与 change，回灌后高亮新日期', async () => {
    const wrapper = mountPanel({ modelValue: '2026-11-06' })
    await nextTick()
    expect(wrapper.find('.ui-date-picker-panel__confirm').exists()).toBe(false)
    await click(cell('15'))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-15'])
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['2026-11-15'])
    // 受控：emit 不会自改 props，选中态仍回到 modelValue 指定的 6 号
    expect(cells().find((node) => node.className.includes('is-selected'))?.textContent).toBe('6')
    await wrapper.setProps({ modelValue: '2026-11-15' })
    expect(cells().find((node) => node.className.includes('is-selected'))?.textContent).toBe('15')
    expect(cells().find((node) => node.className.includes('is-selected'))?.className).not.toContain('is-today')
    // 今日仍是 6 号，与选中态分离
    expect(
      cells()
        .filter((node) => node.className.includes('is-today'))
        .map((node) => node.textContent)
    ).toEqual(['6'])
  })

  it('disabledDate 与 cellClassName 落到单元格 disabled 与附加类', async () => {
    const wrapper = mountPanel({
      disabledDate: (date: Date) => date.getDate() === 2,
      cellClassName: (date: Date) => (date.getDate() === 15 ? 'mine' : '')
    })
    await nextTick()
    const disabled = cell('2') as HTMLButtonElement
    expect(disabled.disabled).toBe(true)
    expect(disabled.className).toContain('is-disabled')
    await click(disabled)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(cell('15')?.className).toContain('mine')
  })

  it('disabled 时导航、单元格与页脚按钮全部禁用且不抛事件', async () => {
    const wrapper = mountPanel({ disabled: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-disabled')
    expect(
      Array.from(document.querySelectorAll<HTMLButtonElement>('.ui-date-picker-panel__nav')).every(
        (node) => node.disabled
      )
    ).toBe(true)
    expect(cells().every((node) => node.disabled)).toBe(true)
    expect((document.querySelector('.ui-date-picker-panel__now') as HTMLButtonElement).disabled).toBe(true)
    expect((document.querySelector('.ui-date-picker-panel__clear') as HTMLButtonElement).disabled).toBe(true)
    await click(cell('15'))
    await click(document.querySelector('.ui-date-picker-panel__now'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('showConfirm 时先暂存选中，确认按钮启用后才提交', async () => {
    const wrapper = mountPanel({ modelValue: '2026-11-06', showConfirm: true })
    await nextTick()
    const confirm = document.querySelector('.ui-date-picker-panel__confirm') as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    await click(cell('15'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(cell('15')?.className).toContain('is-selected')
    expect(confirm.disabled).toBe(false)
    await click(confirm)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-15'])
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['2026-11-15'])
    // 提交后清空暂存，回到受控值
    expect(cells().find((node) => node.className.includes('is-selected'))?.textContent).toBe('6')
  })

  it('showFooter / showNow / clearable 决定页脚存废与按钮组合', async () => {
    mountPanel({ showFooter: false })
    await nextTick()
    expect(footer()).toBeNull()

    reset()
    mountPanel({ showNow: false })
    await nextTick()
    expect(
      Array.from(document.querySelectorAll('.ui-date-picker-panel__footer > *')).map((node) => node.className)
    ).toEqual(['ui-date-picker-panel__clear'])

    reset()
    mountPanel({ clearable: false })
    await nextTick()
    expect(
      Array.from(document.querySelectorAll('.ui-date-picker-panel__footer > *')).map((node) => node.className)
    ).toEqual(['ui-date-picker-panel__now'])

    reset()
    mountPanel({ showNow: false, clearable: false })
    await nextTick()
    expect(footer()).toBeNull()
  })

  it('此刻按钮提交当天：单值给字符串，范围给成对值并同步左面板月份', async () => {
    const wrapper = mountPanel({ modelValue: '2026-03-05' })
    await nextTick()
    expect(titles()).toEqual(['2026年 3月'])
    await click(document.querySelector('.ui-date-picker-panel__now'))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-06'])
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['2026-11-06'])
    expect(titles()).toEqual(['2026年 11月'])

    reset()
    const range = mountPanel({ modelValue: ['2026-03-01', '2026-03-05'], isRange: true })
    await nextTick()
    await click(document.querySelector('.ui-date-picker-panel__now'))
    expect(range.emitted('update:modelValue')?.at(-1)).toEqual([['2026-11-06', '2026-11-06']])
    expect(titles()).toEqual(['2026年 11月', '2026年 12月'])
  })

  it('清空按钮按粒度抛空字符串或空数组，回灌后清掉选中态', async () => {
    const wrapper = mountPanel({ modelValue: '2026-11-06' })
    await nextTick()
    await click(document.querySelector('.ui-date-picker-panel__clear'))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([''])
    await wrapper.setProps({ modelValue: '' })
    expect(cells().filter((node) => node.className.includes('is-selected'))).toHaveLength(0)

    reset()
    const range = mountPanel({ modelValue: ['2026-11-01', '2026-11-06'], isRange: true })
    await nextTick()
    await click(document.querySelector('.ui-date-picker-panel__clear'))
    expect(range.emitted('update:modelValue')?.at(-1)).toEqual([[]])
    await range.setProps({ modelValue: [] })
    expect(cells().filter((node) => node.className.includes('is-selected'))).toHaveLength(0)
  })

  it('shortcuts 单日直接提交，范围数组在范围模式下成对提交', async () => {
    const single = mountPanel({
      shortcuts: [{ text: '昨天', value: new Date(2026, 10, 5) }]
    })
    await nextTick()
    const shortcut = document.querySelector('.ui-date-picker-panel__shortcut') as HTMLButtonElement
    expect(shortcut.textContent).toBe('昨天')
    await click(shortcut)
    expect(single.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-05'])
    expect(single.emitted('change')?.at(-1)).toEqual(['2026-11-05'])

    reset()
    const range = mountPanel({
      modelValue: ['2026-11-01', '2026-11-06'],
      isRange: true,
      shortcuts: [{ text: '整周', value: [new Date(2026, 10, 2), new Date(2026, 10, 8)] }]
    })
    await nextTick()
    await click(document.querySelector('.ui-date-picker-panel__shortcut'))
    expect(range.emitted('update:modelValue')?.at(-1)).toEqual([['2026-11-02', '2026-11-08']])
    expect(titles()).toEqual(['2026年 11月', '2026年 12月'])
  })

  it('范围模式渲染双面板，起止与区间类名只落在本月日期', async () => {
    mountPanel({ modelValue: ['2026-11-01', '2026-11-06'], isRange: true })
    await nextTick()
    expect(document.querySelector('.ui-date-picker-panel')?.className).toContain('is-range')
    expect(panels()).toHaveLength(2)
    expect(titles()).toEqual(['2026年 11月', '2026年 12月'])
    const marked = cells().filter((node) => node.className.match(/is-selected|is-in-range/))
    expect(marked.map((node) => node.textContent)).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(marked[0].className).toContain('is-start')
    expect(marked[5].className).toContain('is-end')
    expect(marked.slice(1, 5).every((node) => node.className.includes('is-in-range'))).toBe(true)
    expect(marked.filter((node) => node.className.includes('is-selected'))).toHaveLength(2)
    expect(marked.every((node) => !node.className.includes('is-outside'))).toBe(true)
  })

  it('范围模式两次点击才提交，首次点击只暂存起点', async () => {
    const wrapper = mountPanel({ modelValue: ['2026-11-10', '2026-11-20'], isRange: true })
    await nextTick()
    await click(cell('5'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(
      cells()
        .filter((node) => node.className.includes('is-in-range'))
        .map((node) => node.textContent)
    ).toEqual(['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'])
    await click(cell('25'))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['2026-11-05', '2026-11-25']])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([['2026-11-05', '2026-11-25']])
  })

  it('范围模式起点晚于终点时自动交换', async () => {
    const wrapper = mountPanel({ modelValue: ['2026-11-10', '2026-11-20'], isRange: true })
    await nextTick()
    await click(cell('25'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await click(cell('5'))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['2026-11-05', '2026-11-25']])
  })

  it('范围 + showConfirm 需两端都暂存且确认后才提交', async () => {
    const wrapper = mountPanel({ modelValue: ['2026-11-10', '2026-11-20'], isRange: true, showConfirm: true })
    await nextTick()
    const confirm = document.querySelector('.ui-date-picker-panel__confirm') as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    await click(cell('5'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(confirm.disabled).toBe(true)
    await click(cell('25'))
    expect(confirm.disabled).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await click(confirm)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['2026-11-05', '2026-11-25']])
  })

  it('type=month 渲染 12 个月格，翻页按 12 个月步进', async () => {
    mountPanel({ modelValue: '2026-11', type: 'month' })
    await nextTick()
    expect(titles()).toEqual(['2026年'])
    expect(document.querySelector('.ui-date-picker-panel__grid')?.className).toContain('is-month')
    expect(document.querySelectorAll('.ui-date-picker-panel__weekday')).toHaveLength(0)
    expect(cells().map((node) => node.textContent)).toEqual([
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月'
    ])
    expect(cells().filter((node) => node.className.includes('is-selected'))).toHaveLength(1)
    expect(cells().find((node) => node.className.includes('is-selected'))?.textContent).toBe('11月')
    await click(document.querySelector('.ui-date-picker-panel__nav.is-next'))
    expect(titles()).toEqual(['2027年'])
    await click(document.querySelector('.ui-date-picker-panel__nav.is-next-year'))
    expect(titles()).toEqual(['2037年'])
  })

  it('type=year 渲染 10 年区间加首尾补位，跨十年翻页', async () => {
    mountPanel({ modelValue: '2026', type: 'year' })
    await nextTick()
    expect(document.querySelector('.ui-date-picker-panel__grid')?.className).toContain('is-year')
    expect(cells().map((node) => node.textContent)).toEqual([
      '2019',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
      '2027',
      '2028',
      '2029',
      '2030'
    ])
    expect(cells()[0].className).toContain('is-outside')
    expect(cells()[11].className).toContain('is-outside')
    expect(titles()).toEqual(['2019 - 2030'])
    expect(cells().find((node) => node.className.includes('is-selected'))?.textContent).toBe('2026')
    await click(document.querySelector('.ui-date-picker-panel__nav.is-next-year'))
    expect(titles()).toEqual(['2029 - 2040'])
    expect(cells().filter((node) => node.className.includes('is-selected'))).toHaveLength(0)
  })

  it('defaultValue 只决定初始月份，valueFormat 改写提交格式', async () => {
    mountPanel({ modelValue: '', defaultValue: ['2026-03-01'] })
    await nextTick()
    expect(titles()).toEqual(['2026年 3月'])
    expect(cells().filter((node) => node.className.includes('is-selected'))).toHaveLength(0)

    reset()
    const wrapper = mountPanel({ valueFormat: 'YYYY/MM/DD' })
    await nextTick()
    await click(cell('15'))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026/11/15'])
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['2026/11/15'])
  })

  it('showWeekNumber 增加周列并在每行前插入 ISO 周号', async () => {
    mountPanel({ showWeekNumber: true })
    await nextTick()
    const grid = document.querySelector('.ui-date-picker-panel__grid')
    expect(grid?.className).toContain('is-with-week')
    expect(
      Array.from(document.querySelectorAll('.ui-date-picker-panel__weekday')).map((node) => node.textContent)
    ).toEqual(['周', '一', '二', '三', '四', '五', '六', '日'])
    const weekNumbers = Array.from(document.querySelectorAll('.ui-date-picker-panel__week-number'))
    expect(weekNumbers).toHaveLength(6)
    expect(weekNumbers[0].textContent).toBe('44')
    expect(cells()).toHaveLength(42)
  })

  it('unlinkPanels 关闭时右面板跟随左面板，开启时保持不动', async () => {
    mountPanel({ modelValue: ['2026-11-01', '2026-11-06'], isRange: true })
    await nextTick()
    await click(panels()[0].querySelector('.ui-date-picker-panel__nav.is-next'))
    expect(titles()).toEqual(['2026年 12月', '2027年 1月'])
    await click(panels()[0].querySelector('.ui-date-picker-panel__nav.is-next-year'))
    expect(titles()).toEqual(['2027年 12月', '2028年 1月'])

    reset()
    mountPanel({ modelValue: ['2026-11-01', '2026-11-06'], isRange: true, unlinkPanels: true })
    await nextTick()
    await click(panels()[0].querySelector('.ui-date-picker-panel__nav.is-next'))
    expect(titles()).toEqual(['2026年 12月', '2026年 12月'])
  })

  it('month/year 粒度的提交值只保留年/月，不补零日', async () => {
    const outputs: unknown[] = []
    const monthWrapper = mountPanel({ modelValue: '2026-11', type: 'month' })
    await nextTick()
    await click(cell('3月'))
    outputs.push(monthWrapper.emitted('update:modelValue')?.at(-1)?.[0])

    reset()
    const yearWrapper = mountPanel({ modelValue: '2026', type: 'year' })
    await nextTick()
    await click(cell('2022'))
    outputs.push(yearWrapper.emitted('update:modelValue')?.at(-1)?.[0])

    expect(outputs).toEqual(['2026-03', '2022'])
  })
})
