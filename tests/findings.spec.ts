import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AvatarGroup,
  Carousel,
  CarouselItem,
  ColorPicker,
  ColorPickerPanel,
  DatePicker,
  Dropdown,
  Image,
  Menu,
  MenuItem,
  MenuItemGroup,
  Popover,
  TimePicker,
  TimeSelect,
  Transfer,
  Upload
} from '@ui-kit-full'

// 本文件用 it.fails 固定"期望行为"，记录第二批用例暴露出的库缺陷。
// it.fails 的语义是"断言失败才算通过"：一旦组件修好，这里会转为失败，
// 提醒维护者把用例迁回 tests/components/<组件>.spec.ts 作为常规回归。
const rows = [
  { key: 1, label: '选项一' },
  { key: 2, label: '选项二' },
  { key: 3, label: '选项三', disabled: true }
]

async function flush() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function click(node: Element | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

async function clickNode(node: Element | null | undefined) {
  click(node)
  await flush()
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('已知缺陷（it.fails 守卫）', () => {
  it.fails('特性开关类：props 关闭后 ui-<组件>--<特性> 仍然挂在根节点上', async () => {
    // 根因在 createClassFeature：className 写成 () => 'ui-x--y' 这种无参常量时会被无条件拼接，
    // 只有 className: (props) => ... 才拿得到 props 判断。全库 178 个特性里有 59 个写成常量形式
    // （另有 67 个已是 (props) => 的条件写法），这里只抽样六个带开关的组件。
    const upload = mount(Upload, { props: { multiple: false } })
    expect(upload.classes()).not.toContain('ui-upload--multiple')

    const datePicker = mount(DatePicker, { props: { modelValue: '2026-11-06', isRange: false } })
    expect(datePicker.classes()).not.toContain('ui-date-picker--range')

    const timePicker = mount(TimePicker, { props: { modelValue: '09:24:36', isRange: false } })
    expect(timePicker.classes()).not.toContain('ui-time-picker--range')

    const image = mount(Image, { props: { src: 'a.png', lazy: false } })
    expect(image.classes()).not.toContain('ui-image--lazy')

    const transfer = mount(Transfer, { props: { data: rows, modelValue: [] } })
    expect(transfer.classes()).not.toContain('ui-transfer--filterable')

    const panel = mount(ColorPickerPanel, { props: { modelValue: '#3366cc', border: false } })
    expect(panel.classes()).not.toContain('ui-color-picker-panel--appearance')
  })

  it.fails('MenuItemGroup：title 留空时不应渲染分组标题节点', () => {
    // menu-item-group 的 core 直接把 props.title 渲染成 __title，没有做空值判断，
    // 结果未传 title 的分组仍占一行高度
    const wrapper = mount(Menu, {
      props: { defaultActive: '1' },
      slots: {
        default: () =>
          h(MenuItemGroup, null, {
            default: () => [h(MenuItem, { index: '1' }, () => '退款申请')]
          })
      },
      attachTo: document.body
    })
    expect(wrapper.find('.ui-menu-item-group__title').exists()).toBe(false)
  })

  it.fails('Dropdown：visible=false 应强制收起，不随点击重开', async () => {
    // triggerConfig 用 options.defaultOpen || props.visible 只给 open 播种初始值，
    // 之后 visible 不再参与，点击触发区照样把内部 open 置真
    const wrapper = mount(Dropdown, {
      props: { trigger: 'click', visible: false },
      slots: {
        default: () => h('button', { class: 'probe-trigger' }, '更多操作'),
        dropdown: () => h('ul', null, [h('li', null, '编辑')])
      },
      attachTo: document.body
    })
    await wrapper.find('.ui-dropdown__trigger').trigger('click')
    await flush()
    const panel = document.querySelector('.ui-dropdown__panel') as HTMLElement
    expect(panel.style.display).toBe('none')
  })

  it.fails('Popover：visible=false 应强制收起，不随点击重开', async () => {
    // 与 Dropdown 同一套 triggerConfig，visible 只是初始值
    const wrapper = mount(Popover, {
      props: { trigger: 'click', visible: false, title: '备注' },
      slots: { default: () => h('button', { class: 'probe-trigger' }, '编辑备注') },
      attachTo: document.body
    })
    await wrapper.find('.ui-popover__trigger').trigger('click')
    await flush()
    const panel = document.querySelector('.ui-popover__panel') as HTMLElement
    expect(panel.style.display).toBe('none')
  })

  it.fails('DatePicker：type=dates 应支持多选并抛日期数组', async () => {
    // 面板把 dates 粒度当单日处理，第二次点击仍只抛一个字符串，选中态也只留一个 is-selected
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 6))
    const wrapper = mount(DatePicker, { props: { type: 'dates', modelValue: [] }, attachTo: document.body })
    await wrapper.find('.ui-date-picker__trigger').trigger('click')
    await flush()
    const dayCells = () =>
      Array.from(document.querySelectorAll('.ui-date-picker__cell')).filter(
        (cell) => !cell.className.includes('is-outside')
      )
    await clickNode(dayCells().find((cell) => cell.textContent === '1'))
    await clickNode(dayCells().find((cell) => cell.textContent === '2'))
    const last = (wrapper.emitted('update:modelValue') ?? []).slice(-1)[0]?.[0]
    expect(Array.isArray(last) ? last : []).toEqual(['2026-11-01', '2026-11-02'])
  })

  it.fails('TimePicker：声明了 editable/readonly/id/name，但触发区没有可输入的控件', async () => {
    // time-picker 的触发区整体是 span 文本（__value/__placeholder），没有 input 承载，
    // editable 只影响 ui-time-picker--editable 类名，键盘输入路径不存在
    const wrapper = mount(TimePicker, { props: { modelValue: '09:24:36', editable: true, id: ['tp'], name: ['tp'] } })
    await flush()
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it.fails('TimeSelect：format 只替换时分，秒位以字面量留在文案里', async () => {
    // 选项文案走同一套格式化，'HH:mm:ss' 的 ss 段没被识别，直接吐出 'ss'
    const wrapper = mount(TimeSelect, { props: { modelValue: '10:00', format: 'HH:mm:ss' }, attachTo: document.body })
    await wrapper.find('.ui-time-select__trigger').trigger('click')
    await flush()
    expect((document.querySelector('.ui-time-select__option') as HTMLElement).textContent).toBe('09:00:00')
  })

  it.fails('ColorPicker：清空后未回写 modelValue 时不应显示兜底色', async () => {
    // clear 把内部 draft 颜色写成兜底色并保留 has-value，受控写法下展示值脱离 props，
    // 与 DatePicker 这类"未回写就保持原值"的行为不一致
    const wrapper = mount(ColorPicker, { props: { modelValue: '#ff0000' }, attachTo: document.body })
    await wrapper.find('.ui-color-picker__clear').trigger('click')
    await flush()
    expect((wrapper.element.querySelector('.ui-color-picker__value') as HTMLElement).textContent).toBe('#ff0000')
  })

  it.fails('ColorPicker：无法解析的色值应视作空值而不是兜底色', async () => {
    // 解析失败回退 FALLBACK_COLOR，同时按有值渲染，用户看不出自己填错了
    const wrapper = mount(ColorPicker, { props: { modelValue: 'not-a-color' }, attachTo: document.body })
    await flush()
    expect(wrapper.classes()).not.toContain('has-value')
    expect(wrapper.find('.ui-color-picker__placeholder').exists()).toBe(true)
  })

  it.fails('ColorPickerPanel：modelValue 为空时不应回吐近似兜底色', async () => {
    // 面板拿内部兜底色反解析成文本，且反解析结果 (#40a0ff) 与声明的 #409eff 也不一致
    const wrapper = mount(ColorPickerPanel, { props: { modelValue: '' }, attachTo: document.body })
    await flush()
    expect(wrapper.find('.ui-color-picker-panel__value').text()).toBe('')
  })

  it.fails('Transfer：change 的方向参数应随实际移动方向变化', async () => {
    // core.ts 的 emitKeys 固定写 emit('change', next, 'right')，移回左侧也报 'right'
    const wrapper = mount(Transfer, { props: { data: rows, modelValue: [1, 2] }, attachTo: document.body })
    const checkbox = wrapper.find('.ui-transfer__panel.is-right input[type="checkbox"]')
    await checkbox.setValue(true)
    await wrapper.findAll('.ui-transfer__button')[1].trigger('click')
    await flush()
    const change = (wrapper.emitted('change') ?? []).filter((args: unknown[]) => Array.isArray(args[0])).slice(-1)[0]
    expect(change?.[1]).toBe('left')
  })

  it.fails('Transfer：leftDefaultChecked 不应勾中 disabled 条目', async () => {
    // 预设勾选直接吞并左键集合，跳过 disabled 校验，右移按钮因此可点并把禁用项搬走
    const wrapper = mount(Transfer, {
      props: { data: rows, modelValue: [], leftDefaultChecked: [3] },
      attachTo: document.body
    })
    const disabledInput = wrapper.findAll('.ui-transfer__panel.is-left input[type="checkbox"]')[2]
    expect((disabledInput.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.findAll('.ui-transfer__button')[0].attributes('disabled')).toBeDefined()
  })

  it.fails('Carousel：内部切换应抛出 modelValue/change，支持 v-model', async () => {
    // 当前轮播只改内部 activeIndex，既不声明 modelValue 也不抛事件，父级无法同步页码
    const wrapper = mount(Carousel, {
      props: { autoplay: false },
      slots: {
        default: () => [
          h(CarouselItem, { name: 'a' }, { default: () => '内容A' }),
          h(CarouselItem, { name: 'b' }, { default: () => '内容B' })
        ]
      },
      attachTo: document.body
    })
    await flush()
    await wrapper.find('.ui-carousel__arrow.is-right').trigger('click')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it.fails('Carousel：指示点没有 label 时应给出可读的 aria-label', async () => {
    // 未传 name/label 时回退到 CarouselItem 自动生成的条目名，读屏会念出 item-4f2a… 这类随机串
    const wrapper = mount(Carousel, {
      props: { autoplay: false },
      slots: {
        default: () => [h(CarouselItem, null, { default: () => 'A' }), h(CarouselItem, null, { default: () => 'B' })]
      },
      attachTo: document.body
    })
    await flush()
    const labels = wrapper.findAll('.ui-carousel__indicator').map((item) => item.attributes('aria-label'))
    expect(labels).toEqual(['第 1 张', '第 2 张'])
  })

  it.fails('AvatarGroup：gap 应是受控 prop 并驱动间距，而不是透传成 DOM 属性', () => {
    // AvatarGroupProps 没有声明 gap，值落到 attrs 变成 <div gap="4">，间距由 CSS 写死 -8px
    const wrapper = mount(AvatarGroup, {
      props: { gap: 4 },
      slots: { default: () => [h('span', { class: 'ui-avatar' }, 'A'), h('span', { class: 'ui-avatar' }, 'B')] },
      attachTo: document.body
    })
    expect(wrapper.attributes('gap')).toBeUndefined()
    expect(wrapper.element.getAttribute('style') ?? '').toContain('4px')
  })
})
