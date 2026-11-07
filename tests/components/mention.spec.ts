import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Mention } from '@ui-kit-full'

/**
 * Mention 提及输入：浮层默认 teleport 到 body，面板判定用 wrapper.element.contains()。
 * 触发词由输入框 caret 前的 prefix 决定，选项过滤 / 键盘 / 盲点关闭都在 setup 里完成。
 */
const mounted: ReturnType<typeof mount>[] = []

function mountMention(props: Record<string, any> = {}, slots: Record<string, () => unknown> = {}) {
  const wrapper = mount(Mention, { props, slots, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function reset() {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
}

const panel = () => document.querySelector('.ui-mention__dropdown') as HTMLElement | null
const optionNodes = () => Array.from(document.querySelectorAll('.ui-mention__option'))

/** select / input / change / focus / blur 与原生事件同名，只保留自定义载荷 */
function customEvents(wrapper: ReturnType<typeof mountMention>, name: string) {
  return (wrapper.emitted(name) ?? []).filter((payload) => !(payload[0] instanceof Event))
}

const options = [
  { value: 'alice', label: 'Alice' },
  { value: 'bob', label: 'Bob', disabled: true },
  { value: 'carol', label: 'Carol' }
]

afterEach(() => {
  reset()
  vi.useRealTimers()
})

describe('Mention 提及输入', () => {
  it('默认渲染 combobox 输入框与结构类名', () => {
    const wrapper = mountMention()
    expect(wrapper.classes()).toEqual(['ui-mention', 'ui-mention--popper'])
    const input = wrapper.find('input.ui-mention__inner')
    expect(input.exists()).toBe(true)
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-autocomplete')).toBe('list')
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(input.attributes('tabindex')).toBe('0')
    expect(input.attributes('type')).toBe('text')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(panel()).toBeNull()
  })

  it('modelValue / value 回退与 placeholder / name / id / form 等属性透传', () => {
    const wrapper = mountMention({
      modelValue: '你好',
      placeholder: '输入 @ 提及',
      name: 'content',
      id: 'mention-input',
      form: 'post-form',
      maxlength: 30,
      minlength: 2,
      ariaLabel: '正文',
      inputmode: 'search'
    })
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('你好')
    expect(input.attributes('placeholder')).toBe('输入 @ 提及')
    expect(input.attributes('name')).toBe('content')
    expect(input.attributes('id')).toBe('mention-input')
    expect(input.attributes('form')).toBe('post-form')
    expect(input.attributes('maxlength')).toBe('30')
    expect(input.attributes('minlength')).toBe('2')
    expect(input.attributes('aria-label')).toBe('正文')
    expect(input.attributes('inputmode')).toBe('search')

    const fallback = mountMention({ value: '旧值' })
    expect((fallback.find('input').element as HTMLInputElement).value).toBe('旧值')
  })

  it('size / disabled 影响根类名与输入控件', () => {
    const sized = mountMention({ size: 'large' })
    expect(sized.classes()).toContain('ui-mention--size-large')

    const disabled = mountMention({ modelValue: 'x', disabled: true })
    expect(disabled.classes()).toContain('is-disabled')
    expect(disabled.find('input').attributes('disabled')).toBeDefined()
  })

  it('type=textarea 渲染多行输入并映射 rows / resize', () => {
    const wrapper = mountMention({ modelValue: '多行', type: 'textarea', rows: 4, resize: 'none' })
    expect(wrapper.classes()).toContain('ui-mention--textarea')
    const textarea = wrapper.find('textarea.ui-mention__inner')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('rows')).toBe('4')
    expect(textarea.attributes('style')).toContain('resize: none')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('多行')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('inputStyle 与 containerRole 落到根节点', () => {
    const wrapper = mountMention({ inputStyle: { width: '300px' }, containerRole: 'group' })
    expect(wrapper.attributes('style')).toContain('width: 300px')
    expect(wrapper.attributes('role')).toBe('group')
    expect(mountMention().attributes('role')).toBeUndefined()
  })

  it('聚焦遇到 @ 打开面板，按关键字过滤并抛 search / visible-change', async () => {
    const wrapper = mountMention({ modelValue: '@a', options })
    await wrapper.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(panel()).not.toBeNull()
    expect(panel()!.getAttribute('role')).toBe('listbox')
    expect(optionNodes().map((node) => node.textContent)).toEqual(['Alice', 'Carol'])
    expect(wrapper.find('.ui-mention__inner').attributes('aria-expanded')).toBe('true')
    expect(wrapper.emitted('search')?.[0]).toEqual(['a', '@'])
    expect(wrapper.emitted('visible-change')?.[0]).toEqual([true])
    expect(wrapper.element.contains(panel())).toBe(false)
  })

  it('禁用项不进入高亮序列，方向键在可用项之间循环', async () => {
    const wrapper = mountMention({ modelValue: '@', options })
    await wrapper.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(optionNodes()[0].className).toContain('is-active')
    expect(optionNodes()[1].className).toContain('is-disabled')
    expect(optionNodes()[1].getAttribute('aria-selected')).toBe('false')

    await wrapper.find('.ui-mention__inner').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(optionNodes()[2].className).toContain('is-active')
    expect(optionNodes()[2].getAttribute('aria-selected')).toBe('true')

    await wrapper.find('.ui-mention__inner').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(optionNodes()[0].className).toContain('is-active')
  })

  it('回车选中当前项，按 split 补分隔符并抛 update / input / select', async () => {
    const wrapper = mountMention({ modelValue: '@', options })
    const input = wrapper.find('.ui-mention__inner')
    const inputEl = input.element as HTMLInputElement
    inputEl.focus()
    inputEl.setSelectionRange(2, 2)
    await input.trigger('click')
    await nextTick()
    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['@Carol '])
    expect(customEvents(wrapper, 'input')?.[0]).toEqual(['@Carol '])
    expect(customEvents(wrapper, 'select')?.[0]).toEqual([{ value: 'carol', label: 'Carol' }])
    expect(panel()).toBeNull()
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
  })

  it('点击候选项同样完成选中并关闭面板', async () => {
    const wrapper = mountMention({ modelValue: '@', options })
    await wrapper.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    optionNodes()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['@Alice '])
    expect(customEvents(wrapper, 'select')?.[0]).toEqual([{ value: 'alice', label: 'Alice' }])
    expect(panel()).toBeNull()
  })

  it('Esc 立即收起，失焦 120ms 后收起，点击外部也收起', async () => {
    const wrapper = mountMention({ modelValue: '@', options })
    await wrapper.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(panel()).not.toBeNull()
    await wrapper.find('.ui-mention__inner').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(panel()).toBeNull()
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
    reset()

    vi.useFakeTimers()
    const blur = mountMention({ modelValue: '@', options })
    await blur.find('.ui-mention__inner').trigger('focus')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    expect(panel()).not.toBeNull()
    await blur.find('.ui-mention__inner').trigger('blur')
    await vi.advanceTimersByTimeAsync(119)
    expect(panel()).not.toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    expect(panel()).toBeNull()
    expect(blur.emitted('visible-change')?.at(-1)).toEqual([false])
    vi.useRealTimers()
    reset()

    const outside = mountMention({ modelValue: '@', options })
    await outside.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(panel()).toBeNull()
    expect(outside.emitted('visible-change')?.at(-1)).toEqual([false])
  })

  it('无匹配候选项 / disabled / readonly 都不打开面板', async () => {
    const none = mountMention({ modelValue: '@zzz', options })
    await none.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(panel()).toBeNull()
    expect(none.emitted('search')?.[0]).toEqual(['zzz', '@'])
    expect(none.emitted('visible-change')).toBeUndefined()
    reset()

    const disabled = mountMention({ modelValue: '@', options, disabled: true })
    await disabled.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(panel()).toBeNull()
    expect(disabled.emitted('visible-change')).toBeUndefined()
    reset()

    const readonly = mountMention({ modelValue: '@', options, readonly: true })
    await readonly.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(panel()).toBeNull()
    expect(readonly.emitted('visible-change')).toBeUndefined()
  })

  it('filterOption=false 列出全部，函数形式按自定义规则收窄', async () => {
    const all = mountMention({ modelValue: '@b', options, filterOption: false })
    await all.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(optionNodes().map((node) => node.textContent)).toEqual(['Alice', 'Bob', 'Carol'])
    reset()

    const custom = mountMention({
      modelValue: '@a',
      options,
      filterOption: (_query: string, item: any) => item.value === 'alice'
    })
    await custom.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(optionNodes().map((node) => node.textContent)).toEqual(['Alice'])
  })

  it('自定义 prefix / props 字段映射 / split 参与插入文本', async () => {
    const wrapper = mountMention({
      modelValue: '#a',
      prefix: '#',
      options: [{ id: 'x', name: 'Xavier' }],
      props: { label: 'name', value: 'id' },
      split: ':'
    })
    await wrapper.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(wrapper.emitted('search')?.[0]).toEqual(['a', '#'])
    expect(optionNodes().map((node) => node.textContent)).toEqual(['Xavier'])
    optionNodes()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['#Xavier:'])
    expect(customEvents(wrapper, 'select')?.[0]).toEqual([{ id: 'x', name: 'Xavier' }])
  })

  it('loading 时面板用加载占位替代候选列表', async () => {
    const wrapper = mountMention({ modelValue: '@', options, loading: true })
    await wrapper.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(panel()).not.toBeNull()
    expect(panel()!.querySelector('.ui-loader')?.textContent).toContain('加载中')
    expect(optionNodes()).toHaveLength(0)
    expect(wrapper.find('.ui-mention__inner').attributes('aria-expanded')).toBe('true')
  })

  it('teleported=false 时面板留在组件内，popperClass / showArrow / appendTo 生效', async () => {
    const inline = mountMention({
      modelValue: '@',
      options,
      teleported: false,
      popperClass: 'mention-panel',
      popperStyle: { color: 'red' }
    })
    await inline.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(inline.element.contains(panel())).toBe(true)
    expect(panel()!.className).toContain('mention-panel')
    expect(panel()!.getAttribute('style')).toContain('color: red')
    expect(panel()!.querySelector('.ui-floating-arrow')).not.toBeNull()
    reset()

    const host = document.createElement('div')
    host.id = 'mention-host'
    document.body.appendChild(host)
    const appended = mountMention({ modelValue: '@', options, appendTo: '#mention-host', showArrow: false })
    await appended.find('.ui-mention__inner').trigger('focus')
    await nextTick()
    expect(host.querySelector('.ui-mention__dropdown')).not.toBeNull()
    expect(host.querySelector('.ui-floating-arrow')).toBeNull()
    reset()
  })

  it('clearable / password 特性：清空与密码可见切换', async () => {
    const clearable = mountMention({ modelValue: 'hi', clearable: true })
    expect(clearable.classes()).toContain('ui-mention--clearable')
    const clear = clearable.find('.ui-mention__clear')
    expect(clear.attributes('aria-label')).toBe('Clear')
    await clear.trigger('click')
    expect(clearable.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(customEvents(clearable, 'input')?.[0]).toEqual([''])
    expect(customEvents(clearable, 'change')?.[0]).toEqual([''])
    expect(clearable.emitted('clear')).toHaveLength(1)
    const vm = clearable.vm as unknown as Record<string, unknown>
    expect(typeof vm.clear).toBe('function')
    reset()

    const password = mountMention({ modelValue: 'pw', type: 'password', showPassword: true, options })
    const toggle = password.find('.ui-mention__password')
    expect(password.find('input').attributes('type')).toBe('password')
    expect(toggle.attributes('aria-label')).toBe('Show password')
    await toggle.trigger('click')
    await nextTick()
    expect(password.find('input').attributes('type')).toBe('text')
    expect(toggle.attributes('aria-label')).toBe('Hide password')
    reset()

    const disabledClear = mountMention({ modelValue: 'hi', clearable: true, disabled: true })
    expect(disabledClear.find('.ui-mention__clear').exists()).toBe(false)
  })

  it('word-limit / icons 特性与 append 插槽', () => {
    const limited = mountMention({
      modelValue: 'abcd',
      showWordLimit: true,
      wordLimitPosition: 'outside',
      maxlength: 3,
      countGraphemes: () => 8
    })
    expect(limited.classes()).toContain('ui-mention--word-limit')
    expect(limited.classes()).toContain('is-word-limit-outside')
    expect(limited.find('.ui-mention__count').text()).toBe('8/3')
    expect(limited.find('.ui-mention__count').classes()).toContain('is-exceed')
    reset()

    const iconed = mountMention({ prefixIcon: 'Search', suffixIcon: 'Close' })
    expect(iconed.classes()).toContain('ui-mention--icons')
    expect(iconed.find('.ui-mention__prefix').exists()).toBe(true)
    expect(iconed.find('.ui-mention__suffix').exists()).toBe(true)
    reset()

    const appended = mountMention({ modelValue: '@' }, { append: () => '尾注' })
    expect(appended.text()).toContain('尾注')
  })
})
