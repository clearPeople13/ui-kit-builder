import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Autocomplete } from '@ui-kit-full'

/**
 * Autocomplete 自动补全：面板 teleport 到 body，必须用 document.querySelector 断言。
 * 输入框抛出的 input / change 与原生同名事件混在一起，用 stringEvents() 过滤自定义事件。
 */
const mountAutocomplete = (props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) =>
  mount(Autocomplete, { props, attachTo: document.body, ...options })

/** 只保留自定义 emit（首参为字符串/对象）的记录，剔除冒泡上来的原生 Event */
function stringEvents(wrapper: ReturnType<typeof mountAutocomplete>, name: string) {
  const list = wrapper.emitted(name) ?? []
  return list.filter((payload) => !(payload[0] instanceof Event))
}

const options = () => Array.from(document.querySelectorAll('.ui-autocomplete__option'))
const dropdown = () => document.querySelector('.ui-autocomplete__dropdown')

async function type(wrapper: ReturnType<typeof mountAutocomplete>, value: string) {
  const input = wrapper.find('input').element as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('Autocomplete', () => {
  let wrappers: ReturnType<typeof mountAutocomplete>[] = []

  const track = (w: ReturnType<typeof mountAutocomplete>) => {
    wrappers.push(w)
    return w
  }

  /** 同一批用例里连挂多个实例时，先卸载并清空 body，避免读到上一个实例的 teleport 面板 */
  const reset = () => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
  }

  afterEach(() => {
    reset()
    vi.useRealTimers()
  })

  it('默认渲染出 combobox 输入框并带上结构类名', () => {
    const wrapper = track(mountAutocomplete())
    expect(wrapper.classes()).toContain('ui-autocomplete')
    // filterable / popper 是常量结构钩子，full 产物里始终存在
    expect(wrapper.classes()).toContain('ui-autocomplete--filterable')
    expect(wrapper.classes()).toContain('ui-autocomplete--popper')
    const input = wrapper.find('input')
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-autocomplete')).toBe('list')
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(input.attributes('tabindex')).toBe('0')
    expect(input.attributes('type')).toBe('text')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(dropdown()).toBeNull()
  })

  it('modelValue / placeholder / name / id / form / aria-label 透传到输入框', () => {
    const wrapper = track(
      mountAutocomplete({
        modelValue: '菠',
        placeholder: '搜索',
        name: 'kw',
        id: 'ac-input',
        form: 'search-form',
        ariaLabel: '关键词',
        maxlength: 20,
        minlength: 2,
        inputmode: 'search'
      })
    )
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('菠')
    expect(input.attributes('placeholder')).toBe('搜索')
    expect(input.attributes('name')).toBe('kw')
    expect(input.attributes('id')).toBe('ac-input')
    expect(input.attributes('form')).toBe('search-form')
    expect(input.attributes('aria-label')).toBe('关键词')
    expect(input.attributes('maxlength')).toBe('20')
    expect(input.attributes('minlength')).toBe('2')
    expect(input.attributes('inputmode')).toBe('search')
  })

  it('size / disabled / readonly 影响类名与输入态', async () => {
    const sized = track(mountAutocomplete({ size: 'large' }))
    expect(sized.classes()).toContain('ui-autocomplete--size-large')

    const disabled = track(mountAutocomplete({ disabled: true, modelValue: '菠', fetchSuggestions: ['菠萝包'] }))
    expect(disabled.classes()).toContain('is-disabled')
    expect(disabled.find('input').attributes('disabled')).toBeDefined()
    await disabled.find('input').trigger('focus')
    await nextTick()
    expect(dropdown()).toBeNull()

    const readonly = track(mountAutocomplete({ readonly: true, modelValue: '菠', fetchSuggestions: ['菠萝包'] }))
    expect(readonly.find('input').attributes('readonly')).toBeDefined()
    await readonly.find('input').trigger('focus')
    await nextTick()
    expect(dropdown()).toBeNull()
  })

  it('type=textarea 渲染多行并映射 resize / rows', () => {
    const wrapper = track(mountAutocomplete({ type: 'textarea', resize: 'none', rows: 4 }))
    expect(wrapper.classes()).toContain('ui-autocomplete--textarea')
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('rows')).toBe('4')
    expect(textarea.attributes('style')).toContain('resize: none')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('inputStyle 落到根节点 style 上', () => {
    const wrapper = track(mountAutocomplete({ inputStyle: { '--ui-ac-h': '40px' } }))
    expect(wrapper.attributes('style')).toContain('--ui-ac-h: 40px')
  })

  it('聚焦后按关键字过滤静态候选，并高亮命中片段', async () => {
    const wrapper = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: ['苹果汁', '菠萝包', '西瓜汁'] }))
    await wrapper.find('input').trigger('focus')
    await nextTick()
    expect(dropdown()).not.toBeNull()
    expect(options().map((o) => o.textContent)).toEqual(['菠萝包'])
    expect(dropdown()?.getAttribute('role')).toBe('listbox')
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true')
    expect(dropdown()?.querySelector('.ui-autocomplete__highlight')?.textContent).toBe('菠')
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([true])
  })

  it('候选项 label/value 双字段按 valueKey 匹配', async () => {
    const wrapper = track(
      mountAutocomplete({
        fetchSuggestions: [{ value: 'p', label: '菠萝包' }],
        valueKey: 'value'
      })
    )
    await wrapper.find('input').trigger('focus')
    await nextTick()
    expect(options().map((o) => o.textContent)).toEqual(['菠萝包'])
    options()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(stringEvents(wrapper, 'update:modelValue').at(-1)).toEqual(['p'])
    expect(stringEvents(wrapper, 'change').at(-1)).toEqual(['p'])
    expect(stringEvents(wrapper, 'select').at(-1)).toEqual([{ value: 'p', label: '菠萝包' }])
    expect(dropdown()).toBeNull()
  })

  it('输入走 debounce（默认 300ms），到点才刷新候选', async () => {
    vi.useFakeTimers()
    const wrapper = track(mountAutocomplete({ modelValue: '', fetchSuggestions: ['aa', 'ab'] }))
    await wrapper.find('input').trigger('focus')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    // 聚焦是 immediate 请求，静态数组立即返回全量
    expect(options().map((o) => o.textContent)).toEqual(['aa', 'ab'])
    await type(wrapper, 'ab')
    expect(stringEvents(wrapper, 'update:modelValue').at(-1)).toEqual(['ab'])
    await vi.advanceTimersByTimeAsync(299)
    await nextTick()
    expect(options().map((o) => o.textContent)).toEqual(['aa', 'ab'])
    await vi.advanceTimersByTimeAsync(1)
    await nextTick()
    expect(options().map((o) => o.textContent)).toEqual(['ab'])
    vi.useRealTimers()
  })

  it('空输入立即收起面板', async () => {
    const wrapper = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: ['菠萝包'] }))
    await wrapper.find('input').trigger('focus')
    await nextTick()
    expect(options()).toHaveLength(1)
    await type(wrapper, '')
    await nextTick()
    expect(dropdown()).toBeNull()
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
  })

  it('键盘上下键在候选间移动，loopNavigation=false 时停在边界', async () => {
    const wrapper = track(mountAutocomplete({ modelValue: '', fetchSuggestions: ['a', 'b', 'c'] }))
    await wrapper.find('input').trigger('focus')
    await nextTick()
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(options()[0].className).toContain('is-active')
    expect(options()[0].getAttribute('aria-selected')).toBe('true')
    await wrapper.find('input').trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(options()[2].className).toContain('is-active')
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(options()[0].className).toContain('is-active')

    reset()
    vi.useFakeTimers()
    const noLoop = track(mountAutocomplete({ modelValue: '', fetchSuggestions: ['a', 'b'], loopNavigation: false }))
    await noLoop.find('input').trigger('focus')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    await noLoop.find('input').trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(options()[0].className).toContain('is-active')
    await noLoop.find('input').trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(options()[0].className).toContain('is-active')
    vi.useRealTimers()
  })

  it('回车选中高亮项，Esc / Tab 关闭面板', async () => {
    const wrapper = track(mountAutocomplete({ modelValue: '', fetchSuggestions: ['a1', 'a2'] }))
    await wrapper.find('input').trigger('focus')
    await nextTick()
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(stringEvents(wrapper, 'update:modelValue').at(-1)).toEqual(['a1'])
    expect(stringEvents(wrapper, 'select').at(-1)).toEqual(['a1'])
    expect(dropdown()).toBeNull()

    await wrapper.find('input').trigger('focus')
    await nextTick()
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(dropdown()).toBeNull()
    await wrapper.find('input').trigger('focus')
    await nextTick()
    await wrapper.find('input').trigger('keydown', { key: 'Tab' })
    await nextTick()
    expect(dropdown()).toBeNull()
  })

  it('highlightFirstItem 自动高亮首项，triggerOnFocus=false 聚焦不请求', async () => {
    const first = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: ['菠萝包'], highlightFirstItem: true }))
    await first.find('input').trigger('focus')
    await nextTick()
    expect(options()[0].className).toContain('is-active')
    expect(first.find('input').attributes('aria-expanded')).toBe('true')

    reset()
    const lazy = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: ['菠萝包'], triggerOnFocus: false }))
    await lazy.find('input').trigger('focus')
    await nextTick()
    expect(dropdown()).toBeNull()
    expect(lazy.emitted('visible-change')).toBeUndefined()
  })

  it('selectWhenUnmatched 时回车提交原始输入', async () => {
    const wrapper = track(mountAutocomplete({ modelValue: '自定义词', selectWhenUnmatched: true }))
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(stringEvents(wrapper, 'select').at(-1)).toEqual(['自定义词'])
  })

  it('远程 fetch 期间显示加载文案，hideLoading 抑制面板', async () => {
    vi.useFakeTimers()
    const remote = (_q: string, cb: (l: unknown[]) => void) => setTimeout(() => cb(['r1', 'r2']), 50)
    const wrapper = track(mountAutocomplete({ modelValue: 'x', fetchSuggestions: remote }))
    await wrapper.find('input').trigger('focus')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    expect(document.querySelector('.ui-loader')?.textContent).toContain('加载中')
    expect(document.querySelectorAll('.ui-autocomplete__option')).toHaveLength(0)
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true')
    await vi.advanceTimersByTimeAsync(50)
    await nextTick()
    expect(document.querySelectorAll('.ui-autocomplete__option')).toHaveLength(2)
    expect(document.querySelector('.ui-loader')).toBeNull()

    reset()
    const hidden = track(mountAutocomplete({ modelValue: 'x', fetchSuggestions: remote, hideLoading: true }))
    await hidden.find('input').trigger('focus')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    expect(document.querySelector('.ui-loader')).toBeNull()
    expect(document.querySelector('.ui-autocomplete__dropdown')).toBeNull()
    await vi.advanceTimersByTimeAsync(50)
    await nextTick()
    expect(document.querySelectorAll('.ui-autocomplete__option')).toHaveLength(2)
    vi.useRealTimers()
  })

  it('fetchSuggestions 抛错时静默关闭面板', async () => {
    const boom = () => {
      throw new Error('network')
    }
    const wrapper = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: boom }))
    await wrapper.find('input').trigger('focus')
    await nextTick()
    expect(dropdown()).toBeNull()
    expect(wrapper.emitted('visible-change')?.at(-1)).not.toEqual([true])
  })

  it('blur 后 120ms 延时收起面板', async () => {
    vi.useFakeTimers()
    const wrapper = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: ['菠萝包'] }))
    await wrapper.find('input').trigger('focus')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    expect(dropdown()).not.toBeNull()
    await wrapper.find('input').trigger('blur')
    await vi.advanceTimersByTimeAsync(119)
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([true])
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
    vi.useRealTimers()
  })

  it('teleported=false 时面板留在组件内，popperClass 落到面板', async () => {
    const inline = track(
      mountAutocomplete({ modelValue: '菠', fetchSuggestions: ['菠萝包'], teleported: false, popperClass: 'ac-pop' })
    )
    await inline.find('input').trigger('focus')
    await nextTick()
    expect(inline.find('.ui-autocomplete__dropdown').exists()).toBe(true)
    expect(inline.find('.ui-autocomplete__dropdown').classes()).toContain('ac-pop')
    expect(inline.find('.ui-autocomplete__dropdown').classes()).toContain('ui-floating-panel')
    expect(inline.find('.ui-floating-arrow').exists()).toBe(true)

    reset()
    const noArrow = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: ['菠萝包'], showArrow: false }))
    await noArrow.find('input').trigger('focus')
    await nextTick()
    const panel = document.querySelector('.ui-autocomplete__dropdown')
    expect(panel).not.toBeNull()
    expect(panel?.querySelector('.ui-floating-arrow')).toBeNull()
    expect(panel?.querySelector('.ui-autocomplete__option')?.textContent).toBe('菠萝包')
  })

  it('clearable 展示清除按钮并抛 clear 系列事件', async () => {
    const wrapper = track(mountAutocomplete({ modelValue: '菠', clearable: true }))
    expect(wrapper.classes()).toContain('ui-autocomplete--clearable')
    const clear = wrapper.find('.ui-autocomplete__clear')
    expect(clear.attributes('aria-label')).toBe('Clear')
    await clear.trigger('click')
    expect(stringEvents(wrapper, 'update:modelValue').at(-1)).toEqual([''])
    expect(stringEvents(wrapper, 'change').at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')?.at(-1)).toEqual([])

    const empty = track(mountAutocomplete({ modelValue: '', clearable: true }))
    expect(empty.find('.ui-autocomplete__clear').exists()).toBe(false)
    const disabledClear = track(mountAutocomplete({ modelValue: '菠', clearable: true, disabled: true }))
    expect(disabledClear.find('.ui-autocomplete__clear').exists()).toBe(false)
  })

  it('showPassword 切换密码明文按钮', async () => {
    const wrapper = track(mountAutocomplete({ type: 'password', showPassword: true, modelValue: '123' }))
    const toggle = wrapper.find('.ui-autocomplete__password')
    expect(toggle.attributes('aria-label')).toBe('Show password')
    await toggle.trigger('click')
    await nextTick()
    expect(toggle.attributes('aria-label')).toBe('Hide password')
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('prefixIcon / suffixIcon 渲染前后缀槽位', () => {
    const wrapper = track(mountAutocomplete({ prefixIcon: 'Search', suffixIcon: 'Close' }))
    expect(wrapper.find('.ui-autocomplete__prefix').exists()).toBe(true)
    expect(wrapper.find('.ui-autocomplete__suffix').exists()).toBe(true)
  })

  it('showWordLimit 按 modelValue 统计字符数', async () => {
    const wrapper = track(mountAutocomplete({ modelValue: 'abc', maxlength: 10, showWordLimit: true }))
    expect(wrapper.find('.ui-autocomplete__count').text()).toBe('3/10')
    await wrapper.setProps({ modelValue: 'abcd' })
    expect(wrapper.find('.ui-autocomplete__count').text()).toBe('4/10')
    await wrapper.setProps({ modelValue: '' })
    expect(wrapper.find('.ui-autocomplete__count').text()).toBe('0/10')
    reset()
    const outside = track(
      mountAutocomplete({ modelValue: 'abc', maxlength: 2, showWordLimit: true, wordLimitPosition: 'outside' })
    )
    expect(outside.classes()).toContain('ui-autocomplete--word-limit')
    expect(outside.classes()).toContain('is-word-limit-outside')
    expect(outside.find('.ui-autocomplete__count').classes()).toContain('is-exceed')

    reset()
    const noLimit = track(mountAutocomplete({ modelValue: 'abc' }))
    expect(noLimit.find('.ui-autocomplete__count').exists()).toBe(false)
  })

  it('containerRole 落在根节点，countGraphemes 可覆盖计数口径', async () => {
    const wrapper = track(mountAutocomplete({ containerRole: 'group', modelValue: '中文', maxlength: 10, showWordLimit: true, countGraphemes: () => 9 }))
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.find('.ui-autocomplete__count').text()).toBe('9/10')
    const plain = track(mountAutocomplete())
    expect(plain.attributes('role')).toBeUndefined()
  })

  it('appendTo 指定挂载点，append 插槽渲染在输入框之后', async () => {
    const host = document.createElement('div')
    host.id = 'ac-host'
    document.body.appendChild(host)
    const wrapper = track(
      mountAutocomplete({ modelValue: '菠', fetchSuggestions: ['菠萝包'], appendTo: '#ac-host' }, { slots: { append: () => '后缀' } })
    )
    await wrapper.find('input').trigger('focus')
    await nextTick()
    expect(host.querySelector('.ui-autocomplete__dropdown')).not.toBeNull()
    expect(wrapper.text()).toContain('后缀')
    expect(host.querySelectorAll('.ui-autocomplete__option')).toHaveLength(1)
  })

  it('超长候选文本与空候选数组都不报错', async () => {
    const long = '菠'.repeat(200)
    const wrapper = track(mountAutocomplete({ modelValue: long, fetchSuggestions: [long] }))
    await wrapper.find('input').trigger('focus')
    await nextTick()
    expect(options()[0]?.textContent?.length).toBe(200)
    expect(options()[0]?.className).toContain('is-selected')

    reset()
    const none = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: [] }))
    await none.find('input').trigger('focus')
    await nextTick()
    expect(dropdown()).toBeNull()

    reset()
    const nullish = track(mountAutocomplete({ modelValue: '菠', fetchSuggestions: [null, undefined, 0] }))
    await nullish.find('input').trigger('focus')
    await nextTick()
    expect(dropdown()).toBeNull()
  })
})
