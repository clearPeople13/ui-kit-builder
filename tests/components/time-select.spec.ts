import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { ConfigProvider, TimeSelect } from '@ui-kit-full'
import type { ConfigProviderProps } from '@ui-kit-full'

// config-provider 的 locale 元数据未收录新命名空间，用例只验证注入行为
function localeOf(payload: Record<string, unknown>): NonNullable<ConfigProviderProps['locale']> {
  return payload as unknown as NonNullable<ConfigProviderProps['locale']>
}

/**
 * TimeSelect 时间选择器：触发器 + teleport 到 body 的选项浮层，选项由 start/end/step/minTime/maxTime 生成。
 * 口径：结构与特性类名 / 展开与收起 / 选项生成与过滤 / 提交载荷 / 清空、格式化、禁用等开关。
 */
let mounted: ReturnType<typeof mount>[] = []

const mountSelect = (props: Record<string, any> = {}) => {
  const wrapper = mount(TimeSelect, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

const reset = () => {
  mounted.forEach((wrapper) => wrapper.unmount())
  mounted = []
  document.body.innerHTML = ''
}

const trigger = () => document.querySelector<HTMLElement>('.ui-time-select__trigger')
const dropdown = () => document.querySelector<HTMLElement>('.ui-time-select__dropdown')
const options = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-time-select__option'))
const optionTexts = () => options().map((node) => node.textContent)
const displayText = () => document.querySelector('.ui-time-select__value, .ui-time-select__placeholder')?.textContent
const hiddenInput = () => document.querySelector<HTMLInputElement>('input[type="hidden"]')

async function click(node: Element | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

async function open(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('.ui-time-select__trigger').trigger('click')
  await nextTick()
}

afterEach(() => {
  reset()
})

describe('TimeSelect 时间选择器', () => {
  it('默认渲染触发器、图标、清空按钮与隐藏输入，面板未展开', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    expect(wrapper.classes()).toEqual([
      'ui-time-select',
      'ui-time-select--clearable',
      'ui-time-select--popper',
      'ui-time-select--editable',
      'ui-time-select--format'
    ])
    expect(trigger()?.getAttribute('role')).toBe('combobox')
    expect(trigger()?.getAttribute('tabindex')).toBe('0')
    expect(trigger()?.getAttribute('aria-expanded')).toBe('false')
    expect(trigger()?.querySelector('.ui-time-select__icon')).not.toBeNull()
    expect(displayText()).toBe('10:00')
    expect(document.querySelector('.ui-time-select__clear')).not.toBeNull()
    expect(document.querySelector('.ui-time-select__arrow')?.className).toContain('ui-time-select__arrow')
    expect(hiddenInput()?.type).toBe('hidden')
    expect(hiddenInput()?.value).toBe('10:00')
    expect(dropdown()).toBeNull()
    expect(wrapper.element.children).toHaveLength(2)
  })

  it('空值时展示占位文案且不渲染清空按钮', async () => {
    mountSelect({ modelValue: '' })
    await nextTick()
    expect(displayText()).toBe('选择时间')
    expect(document.querySelector('.ui-time-select__placeholder')).not.toBeNull()
    expect(document.querySelector('.ui-time-select__value')).toBeNull()
    expect(document.querySelector('.ui-time-select__clear')).toBeNull()
    expect(hiddenInput()?.value).toBe('')

    reset()
    mountSelect({ modelValue: '', placeholder: '请选择会议时间' })
    await nextTick()
    expect(displayText()).toBe('请选择会议时间')
  })

  it('展开后浮层 teleport 到 body，默认生成 09:00–17:30 的半小时选项并高亮当前值', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    await open(wrapper)
    expect(trigger()?.getAttribute('aria-expanded')).toBe('true')
    expect(wrapper.classes()).toContain('is-open')
    expect(document.querySelector('.ui-time-select__arrow')?.className).toContain('is-open')
    expect(wrapper.emitted('visible-change')?.[0]).toEqual([true])
    const panel = dropdown() as HTMLElement
    expect(panel).not.toBeNull()
    expect(wrapper.element.contains(panel)).toBe(false)
    expect(document.body.contains(panel)).toBe(true)
    expect(panel.className).toContain('ui-floating-panel')
    expect(panel.className).toContain('is-light')
    expect(optionTexts()).toHaveLength(18)
    expect(optionTexts()[0]).toBe('09:00')
    expect(optionTexts().at(-1)).toBe('17:30')
    const selected = options().filter((node) => node.className.includes('is-selected'))
    expect(selected.map((node) => node.textContent)).toEqual(['10:00'])
  })

  it('点击选项抛 update:modelValue / change / visible-change(false) 并收起面板', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    await open(wrapper)
    await click(options()[5])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['11:30'])
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['11:30'])
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
    expect(dropdown()).toBeNull()
    expect(wrapper.classes()).not.toContain('is-open')
    // 受控：未回灌时展示仍是旧值
    expect(displayText()).toBe('10:00')
    await wrapper.setProps({ modelValue: '11:30' })
    expect(displayText()).toBe('11:30')
    expect(hiddenInput()?.value).toBe('11:30')
  })

  it('再次点击触发器收起，visible-change 依次为 true / false', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    await open(wrapper)
    expect(dropdown()).not.toBeNull()
    await open(wrapper)
    expect(wrapper.emitted('visible-change')).toEqual([[true], [false]])
    expect(dropdown()).toBeNull()
    expect(trigger()?.getAttribute('aria-expanded')).toBe('false')
  })

  it('Escape 键收起面板', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    await open(wrapper)
    await wrapper.find('.ui-time-select__trigger').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
    expect(dropdown()).toBeNull()
  })

  it('点击面板内部不收起，点击外部收起', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    await open(wrapper)
    const panel = dropdown() as HTMLElement
    panel.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(dropdown()).not.toBeNull()
    expect(trigger()?.getAttribute('aria-expanded')).toBe('true')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(dropdown()).toBeNull()
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
  })

  it('start / end / step 与 includeEndTime 决定选项边界', async () => {
    const wrapper = mountSelect({ start: '08:00', end: '10:00', step: '00:15' })
    await nextTick()
    await open(wrapper)
    expect(optionTexts()).toHaveLength(8)
    expect(optionTexts()[0]).toBe('08:00')
    expect(optionTexts().at(-1)).toBe('09:45')

    reset()
    const inclusive = mountSelect({ start: '08:00', end: '10:00', step: '00:15', includeEndTime: true })
    await nextTick()
    await open(inclusive)
    expect(optionTexts()).toHaveLength(9)
    expect(optionTexts().at(-1)).toBe('10:00')

    reset()
    const halfHour = mountSelect({ start: '08:00', end: '09:00' })
    await nextTick()
    await open(halfHour)
    expect(optionTexts()).toEqual(['08:00', '08:30'])
  })

  it('step 不是 HH:mm 时退化为逐分钟生成', async () => {
    const wrapper = mountSelect({ start: '08:00', end: '08:05', step: '30 min' })
    await nextTick()
    await open(wrapper)
    expect(optionTexts()).toEqual(['08:00', '08:01', '08:02', '08:03', '08:04'])
  })

  it('minTime / maxTime 按闭区间过滤选项', async () => {
    const wrapper = mountSelect({ start: '08:00', end: '09:00', minTime: '08:30', maxTime: '08:40' })
    await nextTick()
    await open(wrapper)
    expect(optionTexts()).toEqual(['08:30'])

    reset()
    const lower = mountSelect({ start: '08:00', end: '09:00', minTime: '08:20' })
    await nextTick()
    await open(lower)
    expect(optionTexts()).toEqual(['08:30'])
  })

  it('区间为空时展示“无可选时间”，includeEndTime 可保留端点', async () => {
    const wrapper = mountSelect({ start: '10:00', end: '10:00' })
    await nextTick()
    await open(wrapper)
    expect(options()).toHaveLength(0)
    expect(document.querySelector('.ui-floating-panel__empty')?.textContent).toBe('无可选时间')

    reset()
    const inclusive = mountSelect({ start: '10:00', end: '10:00', includeEndTime: true })
    await nextTick()
    await open(inclusive)
    expect(optionTexts()).toEqual(['10:00'])
    expect(document.querySelector('.ui-floating-panel__empty')).toBeNull()
  })

  it('format 同时作用于回显、隐藏输入与选项文案', async () => {
    const wrapper = mountSelect({ modelValue: '10:00', format: 'HH:mm:ss' })
    await nextTick()
    expect(displayText()).toBe('10:00:00')
    expect(hiddenInput()?.value).toBe('10:00:00')
    await open(wrapper)
    expect(optionTexts()[0]).toBe('09:00:00')
    expect(
      options()
        .filter((node) => node.className.includes('is-selected'))
        .map((node) => node.textContent)
    ).toEqual(['10:00:00'])

    reset()
    const chinese = mountSelect({ modelValue: '10:00', format: 'HH 点 mm 分' })
    await nextTick()
    expect(displayText()).toBe('10 点 00 分')
    await open(chinese)
    expect(optionTexts()[0]).toBe('09 点 00 分')
  })

  it('清空按钮抛 clear 与空值，valueOnClear 可改回填值', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    await click(document.querySelector('.ui-time-select__clear'))
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([undefined])
    expect(dropdown()).toBeNull()
    expect(displayText()).toBe('10:00')

    reset()
    const custom = mountSelect({ modelValue: '10:00', valueOnClear: '' })
    await nextTick()
    await click(document.querySelector('.ui-time-select__clear'))
    expect(custom.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(custom.emitted('change')?.at(-1)).toEqual([''])
  })

  it('面板展开时点清空只清值，不因冒泡收起面板', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    await open(wrapper)
    await click(document.querySelector('.ui-time-select__clear'))
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('visible-change')).toEqual([[true]])
    expect(dropdown()).not.toBeNull()
  })

  it('disabled 时不可聚焦、不可展开、不渲染清空按钮', async () => {
    const wrapper = mountSelect({ modelValue: '10:00', disabled: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-disabled')
    expect(trigger()?.getAttribute('tabindex')).toBeNull()
    expect(trigger()?.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('.ui-time-select__clear')).toBeNull()
    await open(wrapper)
    expect(dropdown()).toBeNull()
    expect(wrapper.emitted('visible-change')).toBeUndefined()
    expect(hiddenInput()?.value).toBe('10:00')
  })

  it('size / name / effect / popperClass / popperStyle 落到对应节点', async () => {
    const wrapper = mountSelect({
      modelValue: '10:00',
      size: 'small',
      name: 'meeting',
      effect: 'dark',
      popperClass: 'mine',
      popperStyle: { width: '300px' }
    })
    await nextTick()
    expect(wrapper.classes()).toContain('--size-small')
    expect(hiddenInput()?.getAttribute('name')).toBe('meeting')
    await open(wrapper)
    const panel = dropdown() as HTMLElement
    expect(panel.classList.contains('is-dark')).toBe(true)
    expect(panel.classList.contains('mine')).toBe(true)
    expect(panel.getAttribute('style')).toContain('width: 300px')
  })

  it('自定义前缀图标时追加 icons 特性类，图标节点仍在', async () => {
    const wrapper = mountSelect({ modelValue: '10:00', prefixIcon: 'clock' })
    await nextTick()
    expect(wrapper.classes()).toContain('ui-time-select--icons')
    expect(wrapper.find('.ui-time-select__icon').exists()).toBe(true)
  })

  it('受控回写驱动回显与选中态，空值回落占位', async () => {
    const wrapper = mountSelect({ modelValue: '10:00' })
    await nextTick()
    expect(displayText()).toBe('10:00')
    expect(document.querySelector('.ui-time-select__clear')).not.toBeNull()
    await wrapper.setProps({ modelValue: '11:30' })
    expect(displayText()).toBe('11:30')
    expect(hiddenInput()?.value).toBe('11:30')
    await open(wrapper)
    expect(
      options()
        .filter((node) => node.className.includes('is-selected'))
        .map((node) => node.textContent)
    ).toEqual(['11:30'])
    await open(wrapper)
    await wrapper.setProps({ modelValue: '' })
    expect(displayText()).toBe('选择时间')
    expect(document.querySelector('.ui-time-select__clear')).toBeNull()
  })

  it('占位与空态文案来自 ConfigProvider 注入的 locale，未注入键回退中文', async () => {
    const provider = mount(ConfigProvider, {
      // 只注入 empty，placeholder 未注入应落回默认中文
      props: { locale: localeOf({ timeSelect: { empty: 'No slots' } }) },
      slots: { default: () => h(TimeSelect, { start: '09:00', end: '09:00' }) },
      attachTo: document.body
    })
    mounted.push(provider)
    await nextTick()
    expect(displayText()).toBe('选择时间')

    await open(provider)
    expect(dropdown()?.querySelector('.ui-floating-panel__empty')?.textContent).toBe('No slots')

    await provider.setProps({ locale: localeOf({ timeSelect: { empty: 'Nichts', placeholder: 'Zeit' } }) })
    await nextTick()
    expect(displayText()).toBe('Zeit')
    expect(dropdown()?.querySelector('.ui-floating-panel__empty')?.textContent).toBe('Nichts')
  })
})
