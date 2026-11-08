import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfigProvider, TimePicker, TimeSelect } from '@ui-kit-full'
import type { ConfigProviderProps } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

// config-provider 的 locale 元数据未收录新命名空间，用例只验证注入行为
function localeOf(payload: Record<string, unknown>): NonNullable<ConfigProviderProps['locale']> {
  return payload as unknown as NonNullable<ConfigProviderProps['locale']>
}

// 此刻一类行为依赖系统时钟，统一冻结到 2026-11-06 09:08:07
function freezeAt(hour: number, minute: number, second: number) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 6, hour, minute, second))
}

function freezeNow() {
  freezeAt(9, 8, 7)
}

function mountPicker(props: Record<string, any> = {}) {
  const wrapper = mount(TimePicker, { props: { modelValue: '09:24:36', ...props }, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function mountSelect(props: Record<string, any> = {}) {
  const wrapper = mount(TimeSelect, { props: { modelValue: '10:00', ...props }, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function dropdown() {
  return document.querySelector('.ui-time-picker__dropdown') as HTMLElement | null
}

function selectDropdown() {
  return document.querySelector('.ui-time-select__dropdown') as HTMLElement | null
}

function columns(scope: HTMLElement | null = dropdown()) {
  return Array.from(scope?.querySelectorAll('.ui-time-picker__column') ?? []) as HTMLElement[]
}

function columnItems(index: number, scope: HTMLElement | null = dropdown()) {
  return Array.from(columns(scope)[index]?.querySelectorAll('.ui-time-picker__time-item') ?? []) as HTMLElement[]
}

function allItems(scope: HTMLElement | null = dropdown()) {
  return Array.from(scope?.querySelectorAll('.ui-time-picker__time-item') ?? []) as HTMLElement[]
}

function selected(scope: HTMLElement | null = dropdown()) {
  return allItems(scope)
    .filter((item) => item.className.includes('is-selected'))
    .map((item) => item.textContent)
}

function disabledItems(scope: HTMLElement | null = dropdown()) {
  return allItems(scope)
    .filter((item) => item.className.includes('is-disabled'))
    .map((item) => item.textContent)
}

function actions(scope: HTMLElement | null = dropdown()) {
  return Array.from(scope?.querySelectorAll('.ui-time-picker__action') ?? []) as HTMLElement[]
}

function options() {
  return Array.from(document.querySelectorAll('.ui-time-select__option')) as HTMLElement[]
}

// 触发区显示值：真实输入框读 value，兼容纯文本节点读 textContent
function triggerText(wrapper: ReturnType<typeof mountPicker>) {
  const value = wrapper.element.querySelector(
    '.ui-time-picker__value, .ui-time-picker__placeholder'
  ) as HTMLInputElement | null
  if (!value) {
    return null
  }
  return value.tagName === 'INPUT' ? (value as HTMLInputElement).value : (value.textContent ?? null)
}

function triggerInputs(wrapper: ReturnType<typeof mountPicker>) {
  return Array.from(wrapper.element.querySelectorAll('input')) as HTMLInputElement[]
}

function fieldNodes(wrapper: ReturnType<typeof mountPicker>) {
  return Array.from(wrapper.element.querySelectorAll('.ui-time-picker__field')) as HTMLElement[]
}

async function flush() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function open(wrapper: ReturnType<typeof mountPicker>) {
  await wrapper.find('.ui-time-picker__trigger').trigger('click')
  await flush()
  expect(dropdown()).not.toBeNull()
}

async function clickNode(node: HTMLElement | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flush()
}

// 键盘路径一律派发真实 keydown：只有真事件的 target 才是被按键的元素，
// 才能同时验证"输入框按键冒泡到触发字段后被挡掉"这类分流语义
async function keydownOn(node: Element | null | undefined, key: string) {
  node?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await flush()
}

// 焦点落点断言只认"activeElement 是不是列项"，不锁实现里的查找顺序细节
function activeItem() {
  const active = document.activeElement as HTMLElement | null
  return active?.classList?.contains('ui-time-picker__time-item') ? active : null
}

async function clickField(wrapper: ReturnType<typeof mountPicker>, index: number) {
  fieldNodes(wrapper)[index].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flush()
}

function caption(scope: HTMLElement | null = dropdown()) {
  return scope?.querySelector('.ui-time-picker__caption')?.textContent ?? null
}

function optionTexts() {
  return options().map((option) => option.textContent)
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('TimePicker 时间选择', () => {
  it('触发区由图标、真实输入框与动作区组成', async () => {
    const wrapper = mountPicker()
    await flush()
    // 特性开关类跟随 props：未开区间时不挂 --range（F-11 回归）
    expect(wrapper.classes()).toEqual([
      'ui-time-picker',
      'ui-time-picker--clearable',
      'ui-time-picker--popper',
      'ui-time-picker--editable',
      'ui-time-picker--format'
    ])
    const trigger = wrapper.find('.ui-time-picker__trigger')
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.ui-time-picker__icon').exists()).toBe(true)
    expect(triggerText(wrapper)).toBe('09:24:36')
    expect(
      Array.from(wrapper.find('.ui-time-picker__actions').element.children).map((child) => child.className)
    ).toEqual(['ui-time-picker__clear', 'ui-icon ui-time-picker__arrow'])
    const input = triggerInputs(wrapper)[0]
    expect(input.tagName).toBe('INPUT')
    expect(input.getAttribute('autocomplete')).toBe('off')
    expect(input.readOnly).toBe(false)
  })

  it('editable 与 readonly 决定输入框可否键入，id / name 落到输入框', async () => {
    const readonlyWrapper = mountPicker({ editable: false, id: 'tp-readonly', name: 'tp-readonly' })
    await flush()
    expect(readonlyWrapper.classes()).not.toContain('ui-time-picker--editable')
    expect(readonlyWrapper.find('input').attributes('readonly')).toBeDefined()
    expect(readonlyWrapper.find('input').attributes('id')).toBe('tp-readonly')
    expect(readonlyWrapper.find('input').attributes('name')).toBe('tp-readonly')
    readonlyWrapper.unmount()
    document.body.innerHTML = ''

    const explicit = mountPicker({ readonly: true })
    await flush()
    expect(explicit.find('input').attributes('readonly')).toBeDefined()
    explicit.unmount()
    document.body.innerHTML = ''

    const editable = mountPicker({ id: 'tp-editable' })
    await flush()
    const input = editable.find('input')
    expect(input.attributes('readonly')).toBeUndefined()
    expect(input.attributes('id')).toBe('tp-editable')
    expect(input.attributes('name')).toBeUndefined()
  })

  it('键入时间文本后回车提交，解析失败不提交且回退原值', async () => {
    const wrapper = mountPicker()
    await flush()
    const input = wrapper.find('input')
    await input.setValue('11:22:33')
    await input.trigger('keydown', { key: 'Enter' })
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['11:22:33']])

    await input.setValue('乱码时间')
    await input.trigger('keydown', { key: 'Enter' })
    await flush()
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(triggerText(wrapper)).toBe('09:24:36')
  })

  it('空值显示占位文案，placeholder 可配置', async () => {
    const empty = mountPicker({ modelValue: '' })
    await flush()
    expect(empty.element.querySelector('.ui-time-picker__value')).toBeNull()
    expect(empty.find('.ui-time-picker__placeholder').attributes('placeholder')).toBe('选择时间')
    expect(triggerText(empty)).toBe('')
    empty.unmount()
    document.body.innerHTML = ''

    const custom = mountPicker({ modelValue: '', placeholder: '挑个时间点' })
    await flush()
    expect(custom.find('.ui-time-picker__placeholder').attributes('placeholder')).toBe('挑个时间点')
  })

  it('format 与 timeFormat 决定展示文本', async () => {
    const formatted = mountPicker({ format: 'HH 点 mm 分' })
    await flush()
    expect(triggerText(formatted)).toBe('09 点 24 分')
    formatted.unmount()
    document.body.innerHTML = ''

    const timeFormat = mountPicker({ timeFormat: 'HH:mm' })
    await flush()
    expect(triggerText(timeFormat)).toBe('09:24')
  })

  it('面板按需挂载，三列标题为时分秒', async () => {
    const wrapper = mountPicker()
    await flush()
    expect(dropdown()).toBeNull()
    await open(wrapper)
    expect(columns().map((column) => column.querySelector('.ui-time-picker__column-title')?.textContent)).toEqual([
      '时',
      '分',
      '秒'
    ])
    expect(columns().map((column) => column.querySelectorAll('.ui-time-picker__time-item').length)).toEqual([
      24, 60, 60
    ])
    expect(allItems()).toHaveLength(144)
  })

  it('当前时分秒在各自列高亮', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    expect(selected()).toEqual(['09', '24', '36'])
  })

  it('点小时项立即写回完整时分秒', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    await clickNode(columnItems(0)[11])
    expect(wrapper.emitted('update:modelValue')).toEqual([['11:24:36']])
    expect(wrapper.emitted('change')).toEqual([['11:24:36']])
    expect(dropdown()).not.toBeNull()
    expect(selected()).toEqual(['11', '24', '36'])
  })

  it('点分钟与秒项同样立即写回', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    await clickNode(columnItems(1)[5])
    expect(wrapper.emitted('update:modelValue')).toEqual([['09:05:36']])
    await clickNode(columnItems(2)[7])
    expect(wrapper.emitted('update:modelValue')).toEqual([['09:05:36'], ['09:05:07']])
    expect(selected()).toEqual(['09', '05', '07'])
  })

  it('禁用项标灰且点击不写回', async () => {
    const wrapper = mountPicker({
      disabledHours: () => [1, 2],
      disabledMinutes: () => [5],
      disabledSeconds: () => [7]
    })
    await open(wrapper)
    expect(disabledItems()).toEqual(['01', '02', '05', '07'])
    await clickNode(columnItems(0)[1])
    await clickNode(columnItems(1)[5])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    // 可选值仍然正常
    await clickNode(columnItems(0)[3])
    expect(wrapper.emitted('update:modelValue')).toEqual([['03:24:36']])
  })

  it('此刻按钮写回当前时间但不收起面板', async () => {
    freezeNow()
    const wrapper = mountPicker()
    await open(wrapper)
    await clickNode(actions()[0])
    expect(wrapper.emitted('update:modelValue')).toEqual([['09:08:07']])
    expect(wrapper.emitted('change')).toEqual([['09:08:07']])
    expect(dropdown()).not.toBeNull()
    // 触发区乐观同步本次写回（F-56）：不再出现"输入框显示 A、modelValue 却是 B"
    expect(triggerText(wrapper)).toBe('09:08:07')
    // 使用方回写仍是唯一权威，会覆盖乐观值
    await wrapper.setProps({ modelValue: '12:00:00' })
    expect(triggerText(wrapper)).toBe('12:00:00')
  })

  it('确定按钮只收起面板，不额外抛写回事件', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    await clickNode(actions()[1])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(dropdown()).toBeNull()
  })

  it('点击外部与 Esc 都收起面板', async () => {
    const wrapper = mountPicker()
    await open(wrapper)
    expect(wrapper.find('.ui-time-picker__arrow').classes()).toContain('is-open')
    document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(dropdown()).toBeNull()
    expect(wrapper.find('.ui-time-picker__arrow').classes()).not.toContain('is-open')

    await open(wrapper)
    await wrapper.find('.ui-time-picker__trigger').trigger('keydown', { key: 'Escape' })
    await flush()
    expect(dropdown()).toBeNull()
  })

  it('showFooter 与 showNow、showConfirm 控制底部按钮', async () => {
    const noFooter = mountPicker({ showFooter: false })
    await open(noFooter)
    expect(dropdown()!.querySelector('.ui-time-picker__footer')).toBeNull()
    expect(allItems()).toHaveLength(144)
    noFooter.unmount()
    document.body.innerHTML = ''

    const noNow = mountPicker({ showNow: false })
    await open(noNow)
    expect(actions().map((action) => action.textContent)).toEqual(['确定'])
    noNow.unmount()
    document.body.innerHTML = ''

    const noConfirm = mountPicker({ showConfirm: false })
    await open(noConfirm)
    expect(actions().map((action) => action.textContent)).toEqual(['此刻'])
  })

  it('清空图标抛 clear 与空串', async () => {
    const wrapper = mountPicker()
    await wrapper.find('.ui-time-picker__clear').trigger('click')
    await flush()
    expect(wrapper.emitted('clear')).toEqual([[]])
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('change')).toEqual([['']])
  })

  it('valueOnClear 改写清空后写回的值', async () => {
    const wrapper = mountPicker({ valueOnClear: '00:00:00' })
    await wrapper.find('.ui-time-picker__clear').trigger('click')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['00:00:00']])
  })

  it('clearable 为 false 时清空图标与特性类都不出现（F-62）', async () => {
    const wrapper = mountPicker({ clearable: false })
    await flush()
    expect(wrapper.find('.ui-time-picker__clear').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('ui-time-picker--clearable')
  })

  it('禁用态标灰且无法展开', async () => {
    const wrapper = mountPicker({ disabled: true })
    await flush()
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('.ui-time-picker__clear').exists()).toBe(false)
    await wrapper.find('.ui-time-picker__trigger').trigger('click')
    await flush()
    expect(dropdown()).toBeNull()
    expect(wrapper.find('.ui-time-picker__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('size 与 tabindex、ariaLabel 落到触发区', async () => {
    const wrapper = mountPicker({ size: 'large', tabindex: 3, ariaLabel: '会议时间' })
    await flush()
    expect(wrapper.classes()).toContain('--size-large')
    const trigger = wrapper.find('.ui-time-picker__trigger')
    expect(trigger.attributes('tabindex')).toBe('3')
    expect(trigger.attributes('aria-label')).toBe('会议时间')
  })

  it('defaultValue 与 defaultTime 决定初始高亮', async () => {
    const withDefault = mountPicker({ modelValue: '', defaultValue: '07:45' })
    await open(withDefault)
    expect(selected()).toEqual(['07', '45', '00'])
    withDefault.unmount()
    document.body.innerHTML = ''

    const withTime = mountPicker({ modelValue: '', defaultTime: '11:11' })
    await open(withTime)
    expect(selected()).toEqual(['11', '11', '00'])
  })

  it('区间模式渲染双字段、分隔符与占位', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['09:24', '18:30'] })
    await flush()
    expect(wrapper.find('.ui-time-picker__trigger').exists()).toBe(false)
    expect(fieldNodes(wrapper)).toHaveLength(2)
    expect(
      fieldNodes(wrapper).map((field) => `${field.getAttribute('role')}/${field.getAttribute('aria-expanded')}`)
    ).toEqual(['combobox/false', 'combobox/false'])
    expect(
      Array.from(wrapper.element.querySelectorAll('.ui-time-picker__value')).map(
        (value) => (value as HTMLInputElement).value
      )
    ).toEqual(['09:24:00', '18:30:00'])
    expect(wrapper.find('.ui-time-picker__separator').text()).toBe('-')
    wrapper.unmount()
    document.body.innerHTML = ''

    // id / name 支持数组，区间两个字段各自映射
    const named = mountPicker({ isRange: true, modelValue: ['09:24', '18:30'], id: ['s', 'e'], name: ['from', 'to'] })
    await flush()
    expect(triggerInputs(named).map((input) => `${input.id}/${input.name}`)).toEqual(['s/from', 'e/to'])
    named.unmount()
    document.body.innerHTML = ''

    const custom = mountPicker({
      isRange: true,
      modelValue: [],
      rangeSeparator: '到',
      startPlaceholder: '上班',
      endPlaceholder: '下班'
    })
    await flush()
    expect(custom.find('.ui-time-picker__separator').text()).toBe('到')
    expect(
      Array.from(custom.element.querySelectorAll('.ui-time-picker__placeholder')).map((node) =>
        (node as HTMLElement).getAttribute('placeholder')
      )
    ).toEqual(['上班', '下班'])
  })

  it('区间点字段切换面板标题与展开态', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['09:00', '10:00'] })
    await clickField(wrapper, 0)
    expect(dropdown()).not.toBeNull()
    expect(caption()).toBe('开始时间')
    expect(fieldNodes(wrapper).map((field) => field.getAttribute('aria-expanded'))).toEqual(['true', 'false'])
    expect(selected()).toEqual(['09', '00', '00'])

    await clickField(wrapper, 1)
    expect(caption()).toBe('结束时间')
    expect(selected()).toEqual(['10', '00', '00'])
  })

  it('区间开始位选时写回数组', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['09:24', '18:30'] })
    await clickField(wrapper, 0)
    await clickNode(columnItems(0)[3])
    expect(wrapper.emitted('update:modelValue')).toEqual([[['03:24:00', '18:30:00']]])
  })

  it('区间结束位选到更晚的小时写回，选到更早则静默丢弃', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['09:00', '10:00'] })
    await clickField(wrapper, 1)
    await clickNode(columnItems(0)[11])
    expect(wrapper.emitted('update:modelValue')).toEqual([[['09:00:00', '11:00:00']]])
    // 早于开始时刻的选择被丢弃，既不写回也不提示
    await clickNode(columnItems(0)[2])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    await clickNode(columnItems(1)[40])
    expect(wrapper.emitted('update:modelValue')).toEqual([[['09:00:00', '11:00:00']], [['09:00:00', '11:40:00']]])
  })

  it('区间的此刻写回当前时间，越界时贴到另一端', async () => {
    freezeAt(9, 8, 7)
    const before = mountPicker({ isRange: true, modelValue: ['09:00', '10:00'] })
    await clickField(before, 0)
    await clickNode(actions()[0])
    expect(before.emitted('update:modelValue')).toEqual([[['09:08:07', '10:00:00']]])
    before.unmount()
    document.body.innerHTML = ''

    // 此刻已超过结束时刻，开始位被夹到结束位的时刻而不是当前时间
    freezeAt(23, 59, 44)
    const after = mountPicker({ isRange: true, modelValue: ['09:00', '10:00'] })
    await clickField(after, 0)
    await clickNode(actions()[0])
    expect(after.emitted('update:modelValue')).toEqual([[['10:00:00', '10:00:00']]])
  })

  it('type 参数不改变面板粒度', async () => {
    for (const type of ['time', 'datetime', 'daterange']) {
      const wrapper = mountPicker({ type })
      await open(wrapper)
      expect(columns().map((column) => column.querySelector('.ui-time-picker__column-title')?.textContent)).toEqual([
        '时',
        '分',
        '秒'
      ])
      expect(allItems()).toHaveLength(144)
      expect(document.querySelectorAll('.ui-date-picker__cell')).toHaveLength(0)
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  it('点秒项写回，disabledSeconds 的列项标灰且点击不写回', async () => {
    const wrapper = mountPicker({ disabledSeconds: () => [6] })
    await open(wrapper)
    expect(columnItems(2)[6].className).toContain('is-disabled')
    await clickNode(columnItems(2)[6])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await clickNode(columnItems(2)[5])
    expect(wrapper.emitted('update:modelValue')).toEqual([['09:24:05']])
  })

  it('区间清空把两端都置空并同步输入框', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['09:00', '18:30'] })
    await flush()
    await wrapper.find('.ui-time-picker__clear').trigger('click')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([[['', '']]])
    expect(triggerInputs(wrapper).map((input) => input.value)).toEqual(['', ''])
  })

  it('editable 关掉后键入的值在失焦时被回退', async () => {
    const wrapper = mountPicker({ editable: false })
    await flush()
    const input = wrapper.find('input')
    await input.setValue('11:22:33')
    await input.trigger('blur')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(triggerText(wrapper)).toBe('09:24:36')
  })

  it('defaultTime / defaultValue 支持 Date 实例', async () => {
    const withTime = mountPicker({ modelValue: '', defaultTime: new Date(2026, 0, 1, 7, 5, 9) })
    await open(withTime)
    expect(selected()).toEqual(['07', '05', '09'])
    withTime.unmount()
    document.body.innerHTML = ''

    const withDefault = mountPicker({ modelValue: '', defaultValue: new Date(2026, 0, 1, 6, 4, 2) })
    await open(withDefault)
    expect(selected()).toEqual(['06', '04', '02'])
  })

  it('无法解析的 modelValue 原样回显', async () => {
    const wrapper = mountPicker({ modelValue: 'not-a-time' })
    await flush()
    expect(triggerText(wrapper)).toBe('not-a-time')
  })
})

describe('TimePicker 键盘操作', () => {
  it('触发区 Enter / ArrowDown 打开面板并把焦点落到首列选中项', async () => {
    const wrapper = mountPicker()
    await flush()
    const trigger = wrapper.find('.ui-time-picker__trigger')
    await keydownOn(trigger.element, 'Enter')
    expect(dropdown()).not.toBeNull()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(activeItem()?.textContent).toBe('09')
    expect(activeItem()?.parentElement?.className).toBe('ui-time-picker__list')

    await keydownOn(activeItem(), 'Escape')
    expect(dropdown()).toBeNull()

    await keydownOn(trigger.element, 'ArrowDown')
    expect(dropdown()).not.toBeNull()
    expect(activeItem()?.textContent).toBe('09')
  })

  it('选中项被禁用时焦点退到首个可用项', async () => {
    const wrapper = mountPicker({ disabledHours: () => [9, 0, 1] })
    await flush()
    await keydownOn(wrapper.find('.ui-time-picker__trigger').element, 'ArrowDown')
    expect(dropdown()).not.toBeNull()
    expect(activeItem()?.textContent).toBe('02')
  })

  it('列内 ArrowDown / ArrowUp 只在当列漫游，不跨列', async () => {
    const wrapper = mountPicker()
    await flush()
    await keydownOn(wrapper.find('.ui-time-picker__trigger').element, 'Enter')
    expect(activeItem()?.textContent).toBe('09')
    await keydownOn(document.activeElement, 'ArrowDown')
    expect(activeItem()?.textContent).toBe('10')
    await keydownOn(document.activeElement, 'ArrowUp')
    expect(activeItem()?.textContent).toBe('09')

    // 分钟列同样按列内序号移动：24 → 25
    await keydownOn(columnItems(1)[24], 'ArrowDown')
    expect(activeItem()?.textContent).toBe('25')
    expect(activeItem()?.parentElement).toBe(columnItems(1)[25].parentElement)
  })

  it('漫游跳过禁用项，到列尾不再移动', async () => {
    const wrapper = mountPicker({ modelValue: '09:24:36', disabledHours: () => [10] })
    await flush()
    await keydownOn(wrapper.find('.ui-time-picker__trigger').element, 'Enter')
    await keydownOn(document.activeElement, 'ArrowDown')
    expect(activeItem()?.textContent).toBe('11')
    wrapper.unmount()
    document.body.innerHTML = ''

    // 下一格被禁用且已到列尾：焦点留在原处，不越界
    const tail = mountPicker({ modelValue: '22:24:36', disabledHours: () => [23] })
    await flush()
    await keydownOn(tail.find('.ui-time-picker__trigger').element, 'Enter')
    expect(activeItem()?.textContent).toBe('22')
    await keydownOn(document.activeElement, 'ArrowDown')
    expect(activeItem()?.textContent).toBe('22')
  })

  it('键盘聚焦的列项是原生 button，Enter 触发的 click 直接写回', async () => {
    const wrapper = mountPicker()
    await flush()
    await keydownOn(wrapper.find('.ui-time-picker__trigger').element, 'ArrowDown')
    await keydownOn(document.activeElement, 'ArrowDown')
    const item = activeItem()!
    expect(item.tagName).toBe('BUTTON')
    expect(item.getAttribute('type')).toBe('button')
    // 原生按钮在 Enter 上的默认动作是 click，这里直接派发该 click 验证提交结果
    await clickNode(item)
    expect(wrapper.emitted('update:modelValue')).toEqual([['10:24:36']])
    expect(selected()).toEqual(['10', '24', '36'])
    expect(dropdown()).not.toBeNull()
  })

  it('面板内 Escape 收起面板并把焦点归还触发字段', async () => {
    const wrapper = mountPicker()
    await flush()
    const trigger = wrapper.find('.ui-time-picker__trigger')
    trigger.element.focus()
    await keydownOn(trigger.element, 'Enter')
    expect(activeItem()?.textContent).toBe('09')

    await keydownOn(activeItem(), 'Escape')
    expect(dropdown()).toBeNull()
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(document.activeElement).toBe(trigger.element)
  })

  it('输入框上 Escape 只收起面板，焦点留在输入框', async () => {
    const wrapper = mountPicker()
    await flush()
    await wrapper.find('.ui-time-picker__trigger').trigger('click')
    await flush()
    expect(dropdown()).not.toBeNull()
    const input = triggerInputs(wrapper)[0]
    input.focus()

    await keydownOn(input, 'Escape')
    expect(dropdown()).toBeNull()
    expect(document.activeElement).toBe(input)
  })

  it('输入框草稿未改动时 Enter 打开面板，有改动时只提交不重开', async () => {
    const wrapper = mountPicker()
    await flush()
    const input = wrapper.find('input')
    await keydownOn(input.element, 'Enter')
    expect(dropdown()).not.toBeNull()
    expect(activeItem()?.textContent).toBe('09')
    await keydownOn(activeItem(), 'Escape')
    expect(dropdown()).toBeNull()

    await input.setValue('11:22:33')
    await input.trigger('keydown', { key: 'Enter' })
    await flush()
    expect(wrapper.emitted('update:modelValue')?.slice(-1)).toEqual([['11:22:33']])
    expect(dropdown()).toBeNull()

    // 草稿已提交、面板保持收起时，ArrowDown 仍可重新打开
    await keydownOn(input.element, 'ArrowDown')
    expect(dropdown()).not.toBeNull()
  })

  it('区间字段 Enter 打开对应一侧并落焦该侧选中项', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['09:00', '18:30'] })
    await flush()
    const fields = fieldNodes(wrapper)
    await keydownOn(fields[1], 'Enter')
    expect(dropdown()).not.toBeNull()
    expect(caption()).toBe('结束时间')
    expect(fields.map((field) => field.getAttribute('aria-expanded'))).toEqual(['false', 'true'])
    expect(activeItem()?.textContent).toBe('18')

    // 焦点仍在字段上时 Escape：走字段处理器，收起后归还到该字段
    fields[1].focus()
    await keydownOn(fields[1], 'Escape')
    expect(dropdown()).toBeNull()
    expect(document.activeElement).toBe(fields[1])
  })

  it('文案来自 ConfigProvider 注入的 locale，未注入键回退中文', async () => {
    const provider = mount(ConfigProvider, {
      props: { locale: localeOf({ timePicker: { confirm: 'OK', hour: 'HR' } }) },
      slots: { default: () => h(TimePicker, { modelValue: ['', ''], isRange: true }) },
      attachTo: document.body
    })
    mounted.push(provider)
    await flush()

    // 未注入 startPlaceholder / endPlaceholder：占位回退默认中文
    expect(
      Array.from(document.querySelectorAll('.ui-time-picker__placeholder')).map((node) =>
        node.getAttribute('placeholder')
      )
    ).toEqual(['开始时间', '结束时间'])

    await clickNode(document.querySelector<HTMLElement>('.ui-time-picker__field'))
    // 注入键生效；分 / 秒 / 此刻 等未注入键落回中文
    expect(columns().map((column) => column.querySelector('.ui-time-picker__column-title')?.textContent)).toEqual([
      'HR',
      '分',
      '秒'
    ])
    expect(actions().map((action) => action.textContent)).toEqual(['此刻', 'OK'])
    expect(caption()).toBe('开始时间')
    // rangeSeparator 带默认值时 props 优先，locale.separator 只在 props 缺省时兜底
    expect(document.querySelector('.ui-time-picker__separator')?.textContent).toBe('-')

    // 切换注入的 locale 立即反映到已展开的面板
    await provider.setProps({
      locale: localeOf({
        timePicker: {
          confirm: 'Apply',
          hour: 'H',
          minute: 'M',
          second: 'S',
          now: 'Now',
          startPlaceholder: 'From',
          endPlaceholder: 'To'
        }
      })
    })
    await flush()
    expect(columns().map((column) => column.querySelector('.ui-time-picker__column-title')?.textContent)).toEqual([
      'H',
      'M',
      'S'
    ])
    expect(actions().map((action) => action.textContent)).toEqual(['Now', 'Apply'])
    expect(caption()).toBe('From')
  })
})

describe('TimeSelect 时刻选择', () => {
  it('触发区配一个隐藏 input 承载表单值', async () => {
    const wrapper = mountSelect({ name: 'meeting' })
    await flush()
    expect(wrapper.classes()).toEqual([
      'ui-time-select',
      'ui-time-select--clearable',
      'ui-time-select--popper',
      'ui-time-select--editable',
      'ui-time-select--format'
    ])
    const trigger = wrapper.find('.ui-time-select__trigger')
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(wrapper.find('.ui-time-select__value').text()).toBe('10:00')
    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('hidden')
    expect(input.attributes('name')).toBe('meeting')
    expect((input.element as HTMLInputElement).value).toBe('10:00')
    await wrapper.setProps({ modelValue: '11:30' })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('11:30')
  })

  it('默认从 09:00 到 17:30 每半小时一项', async () => {
    const wrapper = mountSelect()
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(options()).toHaveLength(18)
    expect(optionTexts()[0]).toBe('09:00')
    expect(optionTexts()[17]).toBe('17:30')
    expect(
      options()
        .filter((option) => option.className.includes('is-selected'))
        .map((option) => option.textContent)
    ).toEqual(['10:00'])
  })

  it('点选项写回并收起，收起后 DOM 移除', async () => {
    const wrapper = mountSelect()
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    await clickNode(options()[5])
    expect(wrapper.emitted('update:modelValue')).toEqual([['11:30']])
    expect(wrapper.emitted('change')).toEqual([['11:30']])
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(selectDropdown()).toBeNull()
  })

  it('step 用 HH:mm 控制间隔', async () => {
    const wrapper = mountSelect({ start: '08:00', end: '10:00', step: '00:15' })
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(optionTexts()).toEqual(['08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45'])
  })

  it('非 HH:mm 的 step 退化为逐分钟', async () => {
    const wrapper = mountSelect({ start: '08:00', end: '08:05', step: '30 min' })
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(optionTexts()).toEqual(['08:00', '08:01', '08:02', '08:03', '08:04'])
  })

  it('includeEndTime 决定末尾时刻是否入列', async () => {
    const without = mountSelect({ start: '08:00', end: '09:00', step: '00:30' })
    await without.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(optionTexts()).toEqual(['08:00', '08:30'])
    without.unmount()
    document.body.innerHTML = ''

    const withEnd = mountSelect({ start: '08:00', end: '09:00', step: '00:30', includeEndTime: true })
    await withEnd.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(optionTexts()).toEqual(['08:00', '08:30', '09:00'])
  })

  it('minTime 与 maxTime 直接过滤掉越界选项', async () => {
    const wrapper = mountSelect({ start: '08:00', end: '09:00', minTime: '08:30', maxTime: '08:40' })
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(optionTexts()).toEqual(['08:30'])
    expect(options().some((option) => option.className.includes('is-disabled'))).toBe(false)
  })

  it('format 的时分秒三段都参与格式化', async () => {
    const wrapper = mountSelect({ format: 'HH:mm:ss' })
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(optionTexts().slice(0, 3)).toEqual(['09:00:00', '09:30:00', '10:00:00'])
    expect(wrapper.find('.ui-time-select__value').text()).toBe('10:00:00')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('10:00:00')
  })

  it('effect 决定浮层皮肤', async () => {
    const light = mountSelect()
    await light.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(selectDropdown()!.className).toContain('is-light')
    light.unmount()
    document.body.innerHTML = ''

    const dark = mountSelect({ effect: 'dark' })
    await dark.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(selectDropdown()!.className).toContain('is-dark')
  })

  it('清空默认写回 undefined，valueOnClear 可改写', async () => {
    const wrapper = mountSelect()
    await wrapper.find('.ui-time-select__clear').trigger('click')
    await flush()
    expect(wrapper.emitted('clear')).toEqual([[]])
    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
    wrapper.unmount()
    document.body.innerHTML = ''

    const custom = mountSelect({ valueOnClear: '' })
    await custom.find('.ui-time-select__clear').trigger('click')
    await flush()
    expect(custom.emitted('update:modelValue')).toEqual([['']])
  })

  it('禁用态没有清空图标也无法展开', async () => {
    const wrapper = mountSelect({ disabled: true })
    await flush()
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('.ui-time-select__clear').exists()).toBe(false)
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(selectDropdown()).toBeNull()
    expect(wrapper.find('.ui-time-select__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('size 生效，editable 为 false 时去掉特性类但保留隐藏 input', async () => {
    const wrapper = mountSelect({ size: 'small', editable: false })
    await flush()
    expect(wrapper.classes()).toContain('--size-small')
    expect(wrapper.classes()).not.toContain('ui-time-select--editable')
    expect(wrapper.findAll('input')).toHaveLength(1)
  })

  it('点外部收起浮层，再次点击可重开', async () => {
    const wrapper = mountSelect()
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(selectDropdown()).not.toBeNull()
    document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(selectDropdown()).toBeNull()
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect(selectDropdown()).not.toBeNull()
    expect(wrapper.find('.ui-time-select__trigger').attributes('aria-expanded')).toBe('true')
  })

  it('非严格时间串不再被吞成时间，回退到 00:00（F-57 同族口径）', async () => {
    // shared/date.ts 的 parseTimeValue 首尾锚定后，time-select 也会受影响：
    // 原先 'abc10:00' 被吞成 10:00，现在解析失败走 formatTime 的 00:00 兜底。
    // 这是"不再静默吞垃圾"的有意口径变更，已审计但无害，在此锁住。
    const wrapper = mountSelect({ modelValue: 'abc10:00' })
    await flush()
    expect(wrapper.find('.ui-time-select__value').text()).toBe('00:00')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('00:00')
  })
})
