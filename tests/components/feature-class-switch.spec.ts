import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { DatePicker, Drawer, Image, Select, Slider, TimePicker, Transfer, Upload } from '@ui-kit-full'

// F-11 回归：以布尔开关命名的特性类名必须跟随该开关。
// 根因在 createClassFeature 的早期写法 `className: () => 'ui-x--y'`（无参常量）会被无条件拼接，
// 只有 `className: (props) => ...` 才拿得到 props 判断。结构性类名（--popper / --validate / --format
// 这类没有对应开关 prop 的）不属于缺陷，仍按常量输出。
interface SwitchCase {
  label: string
  component:
    | typeof Upload
    | typeof Image
    | typeof Transfer
    | typeof Select
    | typeof Slider
    | typeof Drawer
    | typeof DatePicker
  baseProps: Record<string, unknown>
  offProps: Record<string, unknown>
  onProps: Record<string, unknown>
  className: string
  // teleport 型组件（Drawer 打开时整块传到 body）需要从 document 读根节点类名
  rootSelector?: string
}

const cases: SwitchCase[] = [
  {
    label: 'Upload multiple',
    component: Upload,
    baseProps: {},
    offProps: { multiple: false },
    onProps: { multiple: true },
    className: 'ui-upload--multiple'
  },
  {
    label: 'Image lazy',
    component: Image,
    baseProps: { src: 'a.png' },
    offProps: { lazy: false },
    onProps: { lazy: true },
    className: 'ui-image--lazy'
  },
  {
    label: 'Transfer filterable',
    component: Transfer,
    baseProps: { data: [{ key: 1, label: '选项一' }], modelValue: [] },
    offProps: { filterable: false },
    onProps: { filterable: true },
    className: 'ui-transfer--filterable'
  },
  {
    label: 'Select multiple',
    component: Select,
    baseProps: { options: [{ label: '甲', value: 1 }] },
    offProps: { multiple: false },
    onProps: { multiple: true, modelValue: [] },
    className: 'ui-select--multiple'
  },
  {
    label: 'Select filterable',
    component: Select,
    baseProps: { options: [{ label: '甲', value: 1 }] },
    offProps: { filterable: false },
    onProps: { filterable: true },
    className: 'ui-select--filterable'
  },
  {
    label: 'Slider range',
    component: Slider,
    baseProps: { modelValue: 0 },
    offProps: { range: false },
    onProps: { range: true, modelValue: [0, 10] },
    className: 'ui-slider--range'
  },
  {
    label: 'Drawer modal',
    component: Drawer,
    baseProps: { modelValue: true },
    offProps: { modal: false },
    onProps: { modal: true },
    className: 'ui-drawer--modal',
    rootSelector: '.ui-drawer'
  },
  {
    label: 'DatePicker editable',
    component: DatePicker,
    baseProps: { modelValue: '2026-11-06' },
    offProps: { editable: false },
    onProps: { editable: true },
    className: 'ui-date-picker--editable'
  }
]

const mounted: VueWrapper[] = []

function classesOf(item: SwitchCase, extra: Record<string, unknown>) {
  const wrapper = mount(item.component, { props: { ...item.baseProps, ...extra }, attachTo: document.body })
  mounted.push(wrapper)
  if (item.rootSelector) {
    const node = document.querySelector(item.rootSelector)
    return node ? [...node.classList] : []
  }
  return wrapper.classes()
}

function mountPicker(component: typeof DatePicker | typeof TimePicker, props: Record<string, unknown>) {
  const wrapper = mount(component, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

describe('特性开关类名跟随 props', () => {
  it.each(cases.map((item) => [item.label, item] as const))('%s：开关关闭时不挂特性类名', (_label, item) => {
    expect(classesOf(item, item.offProps)).not.toContain(item.className)
  })

  it.each(cases.map((item) => [item.label, item] as const))('%s：开关打开时挂上特性类名', (_label, item) => {
    expect(classesOf(item, item.onProps)).toContain(item.className)
  })

  it('DatePicker 的区间类名跟随 isRange 与区间型 type', async () => {
    const single = mountPicker(DatePicker, { modelValue: '2026-11-06' })
    expect(single.classes()).not.toContain('ui-date-picker--range')
    await single.setProps({ isRange: true, modelValue: [] })
    expect(single.classes()).toContain('ui-date-picker--range')
    single.unmount()
    document.body.innerHTML = ''

    const byType = mountPicker(DatePicker, { modelValue: '', type: 'daterange' })
    expect(byType.classes()).toContain('ui-date-picker--range')
  })

  it('TimePicker 的区间类名跟随 isRange 与 time-range', async () => {
    const single = mountPicker(TimePicker, { modelValue: '09:24:36' })
    expect(single.classes()).not.toContain('ui-time-picker--range')
    await single.setProps({ isRange: true, modelValue: ['09:00', '10:00'] })
    expect(single.classes()).toContain('ui-time-picker--range')
    single.unmount()
    document.body.innerHTML = ''

    const byType = mountPicker(TimePicker, { modelValue: '', type: 'time-range' })
    expect(byType.classes()).toContain('ui-time-picker--range')
  })
})
