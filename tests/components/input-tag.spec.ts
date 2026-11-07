import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { InputTag } from '@ui-kit-full'

/**
 * InputTag 标签输入框：受控模型 + 草稿态输入，标签增删都靠事件上行。
 * 关闭按钮 / 清空按钮 / 分隔符 / 拖拽分属三个特性，类名与行为要分开断言。
 */
const mounted: ReturnType<typeof mount>[] = []

function mountTag(props: Record<string, any> = {}) {
  const wrapper = mount(InputTag, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

/** input 与原生事件同名，只保留自定义字符串载荷 */
function stringEvents(wrapper: ReturnType<typeof mountTag>, name: string) {
  return (wrapper.emitted(name) ?? []).filter((payload) => !(payload[0] instanceof Event))
}

async function draft(wrapper: ReturnType<typeof mountTag>, text: string) {
  const input = wrapper.find('input').element as HTMLInputElement
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('InputTag 标签输入框', () => {
  it('默认渲染标签与输入框，placeholder 只在无标签时出现', () => {
    const wrapper = mountTag({ modelValue: ['a', 'b'] })
    expect(wrapper.classes()).toEqual(['ui-input-tag'])
    const tags = wrapper.findAll('.ui-input-tag__tag')
    expect(tags).toHaveLength(2)
    expect(tags[0].find('.ui-input-tag__text').text()).toBe('a')
    expect(tags[0].find('.ui-input-tag__close').attributes('aria-label')).toBe('移除 a')

    const input = wrapper.find('input')
    expect(input.classes()).toContain('ui-input-tag__input')
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(input.attributes('tabindex')).toBe('0')
    expect(input.attributes('placeholder')).toBe('')

    const empty = mountTag()
    expect(empty.findAll('.ui-input-tag__tag')).toHaveLength(0)
    expect(empty.find('input').attributes('placeholder')).toBe('请输入后回车')
    expect(mountTag({ placeholder: '按回车添加' }).find('input').attributes('placeholder')).toBe('按回车添加')
  })

  it('size / effect / tagType 分别落到根节点与标签类名', () => {
    const wrapper = mountTag({ modelValue: ['a'], size: 'large', effect: 'dark', tagType: 'success' })
    expect(wrapper.classes()).toContain('--size-large')
    expect(wrapper.find('.ui-input-tag__tag').classes()).toEqual(['ui-input-tag__tag', 'is-dark', 'is-success'])
  })

  it('回车生成标签并同时抛 update:modelValue / change / add-tag，草稿被清空', async () => {
    const wrapper = mountTag({ modelValue: ['a'] })
    await draft(wrapper, 'c')
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a', 'c']])
    expect(wrapper.emitted('change')?.[0]).toEqual([['a', 'c']])
    expect(wrapper.emitted('add-tag')?.[0]).toEqual(['c'])
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
    expect(stringEvents(wrapper, 'input')[0]).toEqual(['c'])
  })

  it('默认以回车为触发键，trigger=Space 才接受空格', async () => {
    const enter = mountTag()
    await draft(enter, 'x')
    await enter.find('input').trigger('keydown', { key: ' ' })
    expect(enter.emitted('update:modelValue')).toBeUndefined()
    await enter.find('input').trigger('keydown', { key: 'Enter' })
    expect(enter.emitted('update:modelValue')?.[0]).toEqual([['x']])

    const space = mountTag({ trigger: 'Space' })
    await draft(space, 'x')
    await space.find('input').trigger('keydown', { key: ' ' })
    expect(space.emitted('update:modelValue')?.[0]).toEqual([['x']])
  })

  // 预期：trigger='Both' 时空格与回车都能提交（spec.mjs 约定 Enter / Space / Both）
  it('trigger=Both 同时接受空格与回车', async () => {
    const wrapper = mountTag({ trigger: 'Both' })
    await draft(wrapper, 'y')
    await wrapper.find('input').trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['y']])
  })

  it('空白草稿不生成标签，重复标签被静默忽略并清空草稿', async () => {
    const blank = mountTag()
    await draft(blank, '   ')
    await blank.find('input').trigger('keydown', { key: 'Enter' })
    expect(blank.emitted('update:modelValue')).toBeUndefined()

    const duplicate = mountTag({ modelValue: ['a'] })
    await draft(duplicate, 'a')
    await duplicate.find('input').trigger('keydown', { key: 'Enter' })
    expect(duplicate.emitted('update:modelValue')).toBeUndefined()
    expect((duplicate.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('max 达到上限后拒绝新增，未满时正常追加', async () => {
    const full = mountTag({ modelValue: ['a', 'b'], max: 2 })
    await draft(full, 'c')
    await full.find('input').trigger('keydown', { key: 'Enter' })
    expect(full.emitted('update:modelValue')).toBeUndefined()

    const room = mountTag({ modelValue: ['a', 'b'], max: 3 })
    await draft(room, 'c')
    await room.find('input').trigger('keydown', { key: 'Enter' })
    expect(room.emitted('update:modelValue')?.[0]).toEqual([['a', 'b', 'c']])
  })

  it('草稿为空时 Backspace 删除末尾标签并抛 remove-tag', async () => {
    const wrapper = mountTag({ modelValue: ['a', 'b'] })
    await wrapper.find('input').trigger('keydown', { key: 'Backspace' })
    expect(wrapper.emitted('remove-tag')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a']])
    expect(wrapper.emitted('change')?.[0]).toEqual([['a']])
  })

  it('点击标签关闭按钮移除该项，回灌 props 后标签消失', async () => {
    const wrapper = mountTag({ modelValue: ['a', 'b'] })
    await wrapper.findAll('.ui-input-tag__close')[0].trigger('click')
    expect(wrapper.emitted('remove-tag')?.[0]).toEqual(['a'])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['b']])
    await wrapper.setProps({ modelValue: ['b'] })
    expect(wrapper.findAll('.ui-input-tag__tag')).toHaveLength(1)
    expect(wrapper.find('.ui-input-tag__text').text()).toBe('b')
  })

  it('disabled 时标签没有关闭按钮、输入框禁用且不可删除', async () => {
    const wrapper = mountTag({ modelValue: ['a'], disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.findAll('.ui-input-tag__close')).toHaveLength(0)
    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.attributes('tabindex')).toBeUndefined()
    await wrapper.find('.ui-input-tag__tag').trigger('click')
    expect(wrapper.emitted('remove-tag')).toBeUndefined()
  })

  it('id / tabindex / maxlength / minlength / ariaLabel 透传到输入框', () => {
    const wrapper = mountTag({
      modelValue: [],
      id: 'tag-input',
      tabindex: 4,
      maxlength: 12,
      minlength: 2,
      ariaLabel: '标签输入'
    })
    const input = wrapper.find('input')
    expect(input.attributes('id')).toBe('tag-input')
    expect(input.attributes('tabindex')).toBe('4')
    expect(input.attributes('maxlength')).toBe('12')
    expect(input.attributes('minlength')).toBe('2')
    expect(input.attributes('aria-label')).toBe('标签输入')

    const readonly = mountTag({ modelValue: [], readonly: true })
    expect(readonly.find('input').attributes('readonly')).toBeDefined()
  })

  it('focus / blur 抛事件，saveOnBlur 控制失焦是否提交草稿', async () => {
    const wrapper = mountTag()
    await wrapper.find('input').trigger('focus')
    expect(wrapper.emitted('focus')).toHaveLength(1)
    await draft(wrapper, 'z')
    await wrapper.find('input').trigger('blur')
    expect(wrapper.emitted('blur')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['z']])

    const lazy = mountTag({ saveOnBlur: false })
    await draft(lazy, 'z')
    await lazy.find('input').trigger('blur')
    expect(lazy.emitted('update:modelValue')).toBeUndefined()
  })

  it('点击容器把焦点放回输入框，点击标签不抢焦点', async () => {
    const wrapper = mountTag({ modelValue: [] })
    const input = wrapper.find('input').element as HTMLInputElement
    await wrapper.trigger('click')
    expect(document.activeElement).toBe(input)

    const withTag = mountTag({ modelValue: ['a'] })
    await withTag.find('.ui-input-tag__tag').trigger('click')
    expect(document.activeElement).not.toBe(withTag.find('input').element)
  })

  it('clearable 特性：类名与清空按钮随标签 / 禁用状态出现，点击抛三连事件', async () => {
    const wrapper = mountTag({ modelValue: ['a', 'b'], clearable: true })
    expect(wrapper.classes()).toContain('ui-input-tag--clearable')
    const clear = wrapper.find('.ui-input-tag__clear')
    expect(clear.attributes('aria-label')).toBe('清空')
    await clear.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]])
    expect(wrapper.emitted('change')?.[0]).toEqual([[]])
    expect(wrapper.emitted('clear')).toHaveLength(1)

    const empty = mountTag({ clearable: true })
    expect(empty.find('.ui-input-tag__clear').exists()).toBe(false)
    const disabled = mountTag({ modelValue: ['a'], clearable: true, disabled: true })
    expect(disabled.find('.ui-input-tag__clear').exists()).toBe(false)

    const imperative = mountTag({ modelValue: ['a'], clearable: true })
    const vm = imperative.vm as unknown as Record<string, unknown>
    expect(typeof vm.clear).toBe('function')
    const clearMethod = vm.clear as () => void
    clearMethod()
    expect(imperative.emitted('update:modelValue')?.[0]).toEqual([[]])
    expect(imperative.emitted('clear')).toHaveLength(1)
  })

  it('separator 特性：输入与粘贴含分隔符时批量生成标签，尾段留在草稿', async () => {
    const wrapper = mountTag({ modelValue: ['a', 'b'], separator: ',' })
    expect(wrapper.classes()).toContain('ui-input-tag--separator')
    await draft(wrapper, 'c,d')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a', 'b', 'c']])
    expect(wrapper.emitted('add-tag')?.[0]).toEqual(['c'])
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('d')

    await wrapper.find('input').trigger('paste', { clipboardData: { getData: () => 'x,y' } })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a', 'b', 'x', 'y']])
    expect(wrapper.emitted('add-tag')?.slice(-2)).toEqual([['x'], ['y']])
  })

  it('draggable 特性：标签带上拖拽属性，drop 后抛重排数组，未开启时不加属性', async () => {
    const wrapper = mountTag({ modelValue: ['a', 'b'], draggable: true })
    expect(wrapper.classes()).toContain('ui-input-tag--draggable')
    const tags = wrapper.findAll('.ui-input-tag__tag')
    expect(tags[0].attributes('draggable')).toBe('true')
    expect(tags[0].attributes('data-tag-index')).toBe('0')
    expect(tags[1].attributes('data-tag-index')).toBe('1')

    await tags[0].trigger('dragstart', { dataTransfer: { setData: () => {}, effectAllowed: '' } })
    await tags[1].trigger('drop', { dataTransfer: { getData: () => '0' } })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['b', 'a']])

    const plain = mountTag({ modelValue: ['a'] })
    expect(plain.find('.ui-input-tag__tag').attributes('draggable')).toBeUndefined()
    expect(plain.find('.ui-input-tag__tag').attributes('data-tag-index')).toBeUndefined()

    const blocked = mountTag({ modelValue: ['a'], draggable: true, disabled: true })
    expect(blocked.find('.ui-input-tag__tag').attributes('draggable')).toBeUndefined()
  })
})
