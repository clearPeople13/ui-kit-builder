/**
 * 第八批 · TimePicker 场景契约回归（由 it.fails 守卫降级而来）。
 *
 * 这些断言先在未修代码上以 it.fails 形式全部见红，修复后转红再降级为常规 it，
 * 保证"用例确实打到缺陷上"而不是事后补一条永远绿的测试。
 * 覆盖 F-55…F-63：F-16 把触发区从纯 span 换成真实 input 后未复查点击语义，
 * 以及 7.2 节自己写下的"依赖触发区不是表单控件的写法需要复查"一直没做。
 * F-64（裁剪掉 editable 特性后仍可键入）属于构建期特性裁剪，
 * 由 scripts/verify-governance.mjs 的全库静态守卫覆盖。
 */
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { TimePicker } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

function mountPicker(props: Record<string, any> = {}) {
  const wrapper = mount(TimePicker, {
    props: { modelValue: '09:24:36', ...props },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

async function flush() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function dropdown() {
  return document.querySelector('.ui-time-picker__dropdown') as HTMLElement | null
}

function columnItems(index: number) {
  const column = document.querySelectorAll('.ui-time-picker__column')[index]
  return Array.from(column?.querySelectorAll('.ui-time-picker__time-item') ?? []) as HTMLElement[]
}

function fieldNodes(wrapper: ReturnType<typeof mountPicker>) {
  return Array.from(wrapper.element.querySelectorAll('.ui-time-picker__field')) as HTMLElement[]
}

function triggerText(wrapper: ReturnType<typeof mountPicker>) {
  const node = wrapper.element.querySelector('.ui-time-picker__value, .ui-time-picker__placeholder')
  return node ? ((node as HTMLInputElement).value ?? '') : null
}

async function clickNode(node: HTMLElement | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flush()
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

describe('TimePicker 场景契约回归（F-55…F-63）', () => {
  it('F-55 面板已开时点击输入框不应收起面板', async () => {
    const wrapper = mountPicker()
    await flush()
    await wrapper.find('.ui-time-picker__trigger').trigger('click')
    await flush()
    expect(dropdown()).not.toBeNull()
    await wrapper.find('input').trigger('click')
    await flush()
    expect(dropdown()).not.toBeNull()
    expect(wrapper.find('.ui-time-picker__trigger').attributes('aria-expanded')).toBe('true')
  })

  it('F-56 键入草稿后点面板项，只写回一次且保留草稿的分秒', async () => {
    const wrapper = mountPicker()
    await flush()
    await wrapper.find('.ui-time-picker__trigger').trigger('click')
    await flush()
    await wrapper.find('input').setValue('11:22:33')
    await flush()
    await clickNode(columnItems(0)[3])
    expect(wrapper.emitted('update:modelValue')).toEqual([['03:22:33']])
    expect(triggerText(wrapper)).toBe('03:22:33')
  })

  it('F-57 夹带垃圾的时间文本不得被吞成合法时间', async () => {
    const wrapper = mountPicker()
    await flush()
    const input = wrapper.find('input')
    for (const text of ['abc1:2xyz', '1:299', '上午9:30随意', '09:24:36junk']) {
      await input.setValue(text)
      await input.trigger('keydown', { key: 'Enter' })
      await flush()
    }
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(triggerText(wrapper)).toBe('09:24:36')
  })

  it('F-58 照着显示格式键入的时间可以回输', async () => {
    const wrapper = mountPicker({ format: 'HH 点 mm 分' })
    await flush()
    expect(triggerText(wrapper)).toBe('09 点 24 分')
    const input = wrapper.find('input')
    await input.setValue('10 点 30 分')
    await input.trigger('keydown', { key: 'Enter' })
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['10 点 30 分']])
    expect(triggerText(wrapper)).toBe('10 点 30 分')
  })

  it('F-59 defaultValue / defaultTime 要出现在输入框里', async () => {
    const withDefault = mountPicker({ modelValue: '', defaultValue: '07:45' })
    await flush()
    expect(triggerText(withDefault)).toBe('07:45:00')
    withDefault.unmount()
    document.body.innerHTML = ''

    const withTime = mountPicker({ modelValue: '', defaultTime: '11:11' })
    await flush()
    expect(triggerText(withTime)).toBe('11:11:00')
  })

  it('F-60 区间写回的两端必须按同一格式规范化', async () => {
    const wrapper = mountPicker({ isRange: true, modelValue: ['09:00', '10:00'] })
    await flush()
    fieldNodes(wrapper)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flush()
    await clickNode(columnItems(0)[11])
    expect(wrapper.emitted('update:modelValue')).toEqual([[['09:00:00', '11:00:00']]])
  })

  it('F-61 清空后输入框同步变空，而不是继续显示旧值', async () => {
    const wrapper = mountPicker()
    await flush()
    await wrapper.find('.ui-time-picker__clear').trigger('click')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(triggerText(wrapper)).toBe('')
  })

  it('F-62 clearable 关掉后特性类名也要跟着去掉', async () => {
    const wrapper = mountPicker({ clearable: false })
    await flush()
    expect(wrapper.find('.ui-time-picker__clear').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('ui-time-picker--clearable')
  })

  it('F-63 12 小时制格式要真正格式化而不是回吐字面量', async () => {
    const wrapper = mountPicker({ modelValue: '21:24:36', format: 'hh:mm A' })
    await flush()
    expect(triggerText(wrapper)).toBe('09:24 PM')
  })
})
