import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { InputOtp } from '@ui-kit-full'

/**
 * InputOtp 验证码输入框：纯受控，每格输入与按键只抛 update:modelValue / change 不改内部值。
 * 空格、粘贴、焦点迁移都按 props.modelValue 重建字符数组，所以连续断言要先回灌 props。
 */
const mounted: ReturnType<typeof mount>[] = []

function mountOtp(props: Record<string, any> = {}) {
  const wrapper = mount(InputOtp, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

const inputs = (wrapper: ReturnType<typeof mountOtp>) => wrapper.findAll('input.ui-input-otp__input')

async function typeInto(wrapper: ReturnType<typeof mountOtp>, index: number, text: string) {
  const input = inputs(wrapper)[index].element as HTMLInputElement
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('InputOtp 验证码输入框', () => {
  it('默认渲染 6 个单字符输入格与结构类名', () => {
    const wrapper = mountOtp()
    expect(wrapper.classes()).toEqual(['ui-input-otp'])
    expect(inputs(wrapper)).toHaveLength(6)
    inputs(wrapper).forEach((input) => {
      expect(input.attributes('type')).toBe('text')
      expect(input.attributes('inputmode')).toBe('numeric')
      expect(input.attributes('maxlength')).toBe('1')
      expect((input.element as HTMLInputElement).value).toBe('')
    })
    expect(wrapper.findAll('.ui-input-otp__separator')).toHaveLength(0)
  })

  it('length 决定格数，0 回落 6、负数夹到 1', () => {
    expect(inputs(mountOtp({ length: 0 }))).toHaveLength(6)
    expect(inputs(mountOtp({ length: 1 }))).toHaveLength(1)
    expect(inputs(mountOtp({ length: -1 }))).toHaveLength(1)
    expect(inputs(mountOtp({ length: 3 }))).toHaveLength(3)
  })

  it('modelValue 逐位填入各格，字符串与数字同样按字符拆分', () => {
    const wrapper = mountOtp({ modelValue: '123' })
    expect(inputs(wrapper).map((input) => (input.element as HTMLInputElement).value)).toEqual([
      '1',
      '2',
      '3',
      '',
      '',
      ''
    ])
    const numeric = mountOtp({ modelValue: 42, length: 4 })
    expect(inputs(numeric).map((input) => (input.element as HTMLInputElement).value)).toEqual(['4', '2', '', ''])
  })

  it('size 与 disabled 落到根类名和每格输入属性', () => {
    const wrapper = mountOtp({ modelValue: '1', size: 'large', disabled: true })
    expect(wrapper.classes()).toContain('ui-input-otp--large')
    expect(wrapper.classes()).toContain('is-disabled')
    inputs(wrapper).forEach((input) => expect(input.attributes('disabled')).toBeDefined())
  })

  it('mask 改用 password 类型，未开启时自定义 type 生效', () => {
    const masked = mountOtp({ mask: true, type: 'tel' })
    inputs(masked).forEach((input) => expect(input.attributes('type')).toBe('password'))
    const typed = mountOtp({ type: 'tel' })
    inputs(typed).forEach((input) => expect(input.attributes('type')).toBe('tel'))
  })

  it('separator 在相邻两格之间插入分隔符', () => {
    const wrapper = mountOtp({ length: 4, separator: '-' })
    const separators = wrapper.findAll('.ui-input-otp__separator')
    expect(separators).toHaveLength(3)
    separators.forEach((node) => expect(node.text()).toBe('-'))
    // 子节点顺序是"格 - 格 - 格 - 格"
    expect(Array.from(wrapper.element.children).map((node) => (node as HTMLElement).className)).toEqual([
      'ui-input-otp__input',
      'ui-input-otp__separator',
      'ui-input-otp__input',
      'ui-input-otp__separator',
      'ui-input-otp__input',
      'ui-input-otp__separator',
      'ui-input-otp__input'
    ])
  })

  it('pattern 与 ariaLabel 透传到每一格，ariaLabel 自动补序号', () => {
    const wrapper = mountOtp({ length: 3, pattern: '\\d', ariaLabel: '验证码' })
    inputs(wrapper).forEach((input, index) => {
      expect(input.attributes('pattern')).toBe('\\d')
      expect(input.attributes('aria-label')).toBe(`验证码 ${index + 1}`)
    })
    const plain = mountOtp({ length: 2 })
    inputs(plain).forEach((input) => {
      expect(input.attributes('pattern')).toBeUndefined()
      expect(input.attributes('aria-label')).toBeUndefined()
    })
  })

  it('单格输入抛 update:modelValue 与 change，并自动聚焦下一格', async () => {
    const wrapper = mountOtp()
    await typeInto(wrapper, 0, '7')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['7'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['7'])
    expect(inputs(wrapper)[1].classes()).toContain('is-focused')
  })

  it('单格输入只取最后一位，超长文本不会覆盖其他格', async () => {
    const wrapper = mountOtp()
    await typeInto(wrapper, 0, 'ab7')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['7'])
    expect(inputs(wrapper)[1].classes()).toContain('is-focused')
  })

  it('Backspace 有值时清空该格，空位时回退删除前一格', async () => {
    const filled = mountOtp({ modelValue: '123' })
    await inputs(filled)[1].trigger('keydown', { key: 'Backspace' })
    expect(filled.emitted('update:modelValue')?.[0]).toEqual(['13'])

    const empty = mountOtp({ modelValue: '123' })
    await inputs(empty)[3].trigger('keydown', { key: 'Backspace' })
    expect(empty.emitted('update:modelValue')?.[0]).toEqual(['12'])
    expect(inputs(empty)[2].classes()).toContain('is-focused')
  })

  it('Delete 只清空当前格，方向键在格子间移动焦点且不越界', async () => {
    const wrapper = mountOtp({ modelValue: '123' })
    await inputs(wrapper)[0].trigger('keydown', { key: 'Delete' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['23'])

    await inputs(wrapper)[0].trigger('focus')
    await nextTick()
    await inputs(wrapper)[0].trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(inputs(wrapper)[0].classes()).not.toContain('is-focused')
    expect(inputs(wrapper)[1].classes()).toContain('is-focused')

    await inputs(wrapper)[1].trigger('keydown', { key: 'ArrowLeft' })
    await nextTick()
    expect(inputs(wrapper)[0].classes()).toContain('is-focused')

    await inputs(wrapper)[0].trigger('keydown', { key: 'ArrowLeft' })
    await nextTick()
    expect(inputs(wrapper)[0].classes()).toContain('is-focused')
  })

  it('粘贴按当前格铺开并过滤空白，空粘贴不提交', async () => {
    const wrapper = mountOtp()
    await inputs(wrapper)[0].trigger('paste', { clipboardData: { getData: () => ' 12 34 ' } })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['1234'])
    await nextTick()
    expect(inputs(wrapper)[4].classes()).toContain('is-focused')

    const empty = mountOtp()
    await inputs(empty)[0].trigger('paste', { clipboardData: { getData: () => '' } })
    expect(empty.emitted('update:modelValue')).toBeUndefined()
  })

  it('聚焦标记 is-focused，失焦后移除', async () => {
    const wrapper = mountOtp()
    await inputs(wrapper)[2].trigger('focus')
    await nextTick()
    expect(inputs(wrapper)[2].classes()).toContain('is-focused')
    await inputs(wrapper)[2].trigger('blur')
    await nextTick()
    expect(inputs(wrapper)[2].classes()).not.toContain('is-focused')
  })
})
