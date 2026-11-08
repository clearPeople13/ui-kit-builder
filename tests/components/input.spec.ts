import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { Input } from '@ui-kit-full'

function mountInput(props: Record<string, any> = {}) {
  return mount(Input, { props })
}

describe('Input', () => {
  it('渲染容器与原生的输入节点', () => {
    const wrapper = mountInput({ modelValue: 'abc' })
    expect(wrapper.classes()).toContain('ui-input')
    const inner = wrapper.find('input.ui-input__inner')
    expect(inner.exists()).toBe(true)
    expect((inner.element as HTMLInputElement).value).toBe('abc')
  })

  it('未传 modelValue 时输入框为空串', () => {
    expect(mountInput().find('input').element.value).toBe('')
    expect(mountInput({ modelValue: null }).find('input').element.value).toBe('')
  })

  it('输入时同时抛出 update:modelValue 与 input', async () => {
    const wrapper = mountInput({ modelValue: '' })
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hello'])
    expect(wrapper.emitted('input')?.[0]).toEqual(['hello'])
  })

  it('change / focus / blur 事件带回当前值或事件对象', async () => {
    const wrapper = mountInput({ modelValue: 'x' })
    await wrapper.find('input').trigger('change')
    await wrapper.find('input').trigger('focus')
    await wrapper.find('input').trigger('blur')
    expect(wrapper.emitted('change')?.[0]).toEqual(['x'])
    expect(wrapper.emitted('focus')?.[0][0]).toBeInstanceOf(Event)
    expect(wrapper.emitted('blur')?.[0][0]).toBeInstanceOf(Event)
  })

  it('size 与 disabled 落到类名和属性', () => {
    const wrapper = mountInput({ size: 'large', disabled: true })
    expect(wrapper.classes()).toContain('ui-input--size-large')
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('placeholder / name / maxlength / autocomplete / readonly / tabindex 透传', () => {
    const wrapper = mountInput({
      placeholder: '请输入',
      name: 'keyword',
      maxlength: 20,
      autocomplete: 'off',
      readonly: true,
      tabindex: 3
    })
    const inner = wrapper.find('input')
    expect(inner.attributes('placeholder')).toBe('请输入')
    expect(inner.attributes('name')).toBe('keyword')
    expect(inner.attributes('maxlength')).toBe('20')
    expect(inner.attributes('autocomplete')).toBe('off')
    expect(inner.attributes('readonly')).toBeDefined()
    expect(inner.attributes('tabindex')).toBe('3')
  })

  // 原缺陷 F-3：inputConfig 组装控件属性时没带 id，FormItem 的 for 指向不到真实控件
  it('id 落到内部控件上，textarea 同样生效', () => {
    expect(mountInput({ id: 'kw' }).find('input').attributes('id')).toBe('kw')
    expect(mountInput({ id: 'desc', type: 'textarea' }).find('textarea').attributes('id')).toBe('desc')
  })

  // 回归（G2b）：未声明 emits 时 onChange/onInput 落入 attrs 被铺到根节点，原生事件冒泡 +
  // emit() 回退调用构成双通道。setValue 会依次派发原生 input 与 change（VTU 为 v-model.lazy 补发），
  // 声明 emits 后两个事件都必须只回调一次。
  it('声明 emits 后 change / input 只触发一次（消除 attrs 双通道）', async () => {
    const onChange = vi.fn()
    const onInput = vi.fn()
    const wrapper = mount(Input, { props: { modelValue: '', onChange, onInput } })
    await wrapper.find('input').setValue('hello')
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('inputStyle 写到容器行内样式', () => {
    const wrapper = mountInput({ inputStyle: { width: '240px' } })
    expect(wrapper.attributes('style')).toContain('width: 240px')
  })

  it('type=textarea 渲染 textarea 并使用 rows', () => {
    const wrapper = mountInput({ type: 'textarea', rows: 6 })
    expect(wrapper.find('textarea.ui-input__inner').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('textarea').attributes('rows')).toBe('6')
    expect(wrapper.classes()).toContain('ui-input--textarea')
  })

  it('textarea 默认 2 行，resize 写入样式', () => {
    const wrapper = mountInput({ type: 'textarea', resize: 'none' })
    expect(wrapper.find('textarea').attributes('rows')).toBe('2')
    expect(wrapper.find('textarea').attributes('style')).toContain('resize: none')
  })

  it('clearable 在空值时隐藏清除按钮，有值时点击清空', async () => {
    const empty = mountInput({ modelValue: '', clearable: true })
    expect(empty.find('.ui-input__clear').exists()).toBe(false)

    const wrapper = mountInput({ modelValue: 'abc', clearable: true })
    expect(wrapper.classes()).toContain('ui-input--clearable')
    await wrapper.find('.ui-input__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('disabled 时不显示清除按钮', () => {
    const wrapper = mountInput({ modelValue: 'abc', clearable: true, disabled: true })
    expect(wrapper.find('.ui-input__clear').exists()).toBe(false)
  })

  it('showPassword 仅在 type=password 时提供切换按钮', async () => {
    const withoutType = mountInput({ showPassword: true })
    expect(withoutType.find('.ui-input__password').exists()).toBe(false)

    const wrapper = mountInput({ showPassword: true, type: 'password', modelValue: 'secret' })
    const button = wrapper.find('.ui-input__password')
    expect(button.exists()).toBe(true)
    expect(wrapper.find('input').attributes('type')).toBe('password')
    expect(button.attributes('aria-pressed')).toBe('false')

    await button.trigger('click')
    expect(wrapper.find('input').attributes('type')).toBe('text')
    expect(wrapper.find('.ui-input__password').attributes('aria-pressed')).toBe('true')

    await wrapper.find('.ui-input__password').trigger('click')
    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('showWordLimit 配合 maxlength 显示计数', () => {
    const wrapper = mountInput({ modelValue: 'abc', maxlength: 10, showWordLimit: true })
    expect(wrapper.classes()).toContain('ui-input--word-limit')
    expect(wrapper.find('.ui-input__count').text()).toBe('3/10')
  })

  it('自定义 countGraphemes 参与计数', () => {
    const wrapper = mountInput({
      modelValue: 'abc',
      maxlength: 10,
      showWordLimit: true,
      countGraphemes: (value: string) => value.length * 2
    })
    expect(wrapper.find('.ui-input__count').text()).toBe('6/10')
  })

  it('prefixIcon / suffixIcon 渲染前后缀节点', () => {
    const wrapper = mountInput({ prefixIcon: 'Search', suffixIcon: 'Star' })
    expect(wrapper.classes()).toContain('ui-input--icons')
    expect(wrapper.find('.ui-input__prefix').exists()).toBe(true)
    expect(wrapper.find('.ui-input__suffix').exists()).toBe(true)
  })

  it('prepend / prefix / suffix / append 四个插槽按顺序渲染', () => {
    const wrapper = mount(Input, {
      props: { modelValue: 'a' },
      slots: {
        prepend: () => 'https://',
        prefix: () => '用户',
        suffix: () => '.com',
        append: () => '后置'
      }
    })
    expect(wrapper.find('.ui-input__prepend').text()).toBe('https://')
    expect(wrapper.find('.ui-input__slot-prefix').text()).toBe('用户')
    expect(wrapper.find('.ui-input__slot-suffix').text()).toBe('.com')
    expect(wrapper.text()).toBe('https://用户.com后置')
  })

  it('textarea 同样支持四个插槽', () => {
    const wrapper = mount(Input, {
      props: { type: 'textarea', modelValue: '内容' },
      slots: { prepend: () => '前', prefix: () => 'P', suffix: () => 'S', append: () => '后' }
    })
    expect(wrapper.find('textarea.ui-input__inner').exists()).toBe(true)
    expect(wrapper.find('.ui-input__prepend').text()).toBe('前')
    expect(wrapper.find('.ui-input__slot-prefix').text()).toBe('P')
    expect(wrapper.find('.ui-input__slot-suffix').text()).toBe('S')
    expect(wrapper.text()).toContain('后')
  })

  it('prefix / suffix 与 clearable / password / suffixIcon / word-limit 共存', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 'secret',
        type: 'password',
        showPassword: true,
        clearable: true,
        suffixIcon: 'Star',
        maxlength: 20,
        showWordLimit: true
      },
      slots: { prefix: () => 'P', suffix: () => 'S' }
    })
    expect(wrapper.find('.ui-input__slot-prefix').text()).toBe('P')
    expect(wrapper.find('.ui-input__slot-suffix').text()).toBe('S')
    expect(wrapper.find('.ui-input__suffix').exists()).toBe(true)
    expect(wrapper.find('.ui-input__clear').exists()).toBe(true)
    expect(wrapper.find('.ui-input__password').exists()).toBe(true)
    expect(wrapper.find('.ui-input__count').text()).toBe('6/20')
  })
})
