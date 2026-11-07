import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { InputNumber } from '@ui-kit-full'

/**
 * InputNumber 数字输入框：纯受控，按钮与输入都只抛事件不改内部值。
 * 边界禁用依赖 props.modelValue 与 min/max 的比较，所以必须 setProps 回灌。
 */
let wrappers: any[] = []

const mountNumber = (props: Record<string, any> = {}) => {
  const wrapper = mount(InputNumber, { props })
  wrappers.push(wrapper)
  return wrapper
}

const increase = (wrapper: any) => wrapper.find('.ui-input-number__increase')
const decrease = (wrapper: any) => wrapper.find('.ui-input-number__decrease')

async function type(wrapper: any, value: string) {
  const input = wrapper.find('input').element as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

/** input 事件名与原生事件同名，冒泡到根节点后会被 VTU 追加记录，取自定义的那条 */
function customEmits(wrapper: any, name: string) {
  return (wrapper.emitted(name) ?? []).filter((payload: unknown[]) => !(payload[0] instanceof Event))
}

describe('InputNumber', () => {
  afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
  })

  it('默认渲染原生 number 输入与右侧控制条', () => {
    const wrapper = mountNumber({ modelValue: 1 })
    expect(wrapper.classes()).toEqual(['ui-input-number'])
    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('number')
    expect(input.attributes('min')).toBe('-9007199254740991')
    expect(input.attributes('max')).toBe('9007199254740991')
    expect(input.attributes('step')).toBe('1')
    expect(input.attributes('tabindex')).toBe('0')
    expect(input.attributes('style')).toContain('text-align: center')
    expect((input.element as HTMLInputElement).value).toBe('1')
    expect(wrapper.find('.ui-input-number__controls').exists()).toBe(true)
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(increase(wrapper).attributes('aria-label')).toBe('Increase value')
    expect(decrease(wrapper).attributes('aria-label')).toBe('Decrease value')
  })

  it('点击加减按钮同时抛 update:modelValue / input / change', async () => {
    const wrapper = mountNumber({ modelValue: 5, step: 2 })
    await increase(wrapper).trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([7])
    expect(wrapper.emitted('input')?.[0]).toEqual([7])
    expect(wrapper.emitted('change')?.[0]).toEqual([7])

    await decrease(wrapper).trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3])
    expect(wrapper.emitted('change')).toHaveLength(2)
  })

  // 回归（G2b）：未声明 emits 时 onInput 落入 attrs 被铺到根节点，原生 input 冒泡 +
  // emit('input') 构成双通道；声明 emits 后手动输入必须只回调一次
  it('声明 emits 后手动输入的 input 只触发一次（消除 attrs 双通道）', async () => {
    const onInput = vi.fn()
    const wrapper = mount(InputNumber, { props: { modelValue: undefined, onInput } })
    await wrapper.find('input').setValue('5')
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(onInput).toHaveBeenCalledWith(5)
  })

  it('到达上下限时按钮禁用并停止步进', async () => {
    const wrapper = mountNumber({ modelValue: 8, min: 0, max: 10, step: 2 })
    expect(increase(wrapper).attributes('disabled')).toBeUndefined()
    await increase(wrapper).trigger('click')
    await wrapper.setProps({ modelValue: 10 })
    expect(increase(wrapper).attributes('disabled')).toBeDefined()
    await increase(wrapper).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)

    await wrapper.setProps({ modelValue: 0 })
    expect(decrease(wrapper).attributes('disabled')).toBeDefined()
    expect(increase(wrapper).attributes('disabled')).toBeUndefined()
    await decrease(wrapper).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('越界值会被夹回 min / max', async () => {
    const wrapper = mountNumber({ modelValue: 9, min: 0, max: 10, step: 5 })
    await increase(wrapper).trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([10])

    const low = mountNumber({ modelValue: 3, min: 0, max: 10, step: 5 })
    await decrease(low).trigger('click')
    expect(low.emitted('update:modelValue')?.[0]).toEqual([0])

    const empty = mountNumber({ min: 10, max: 20 })
    await increase(empty).trigger('click')
    expect(empty.emitted('update:modelValue')?.[0]).toEqual([10])
  })

  it('precision 决定步进结果的位数', async () => {
    const wrapper = mountNumber({ modelValue: 1.111, step: 0.1, precision: 1 })
    await increase(wrapper).trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1.2])

    const shown = mountNumber({ modelValue: 2.0001, precision: 2 })
    expect((shown.find('input').element as HTMLInputElement).value).toBe('2')

    const float = mountNumber({ modelValue: 0, step: 0.1, precision: 2 })
    await increase(float).trigger('click')
    expect(float.emitted('update:modelValue')?.[0]).toEqual([0.1])
    await increase(float).trigger('click')
    expect(float.emitted('update:modelValue')?.at(-1)).toEqual([0.1])
  })

  it('手动输入按数字解析，空串抛 undefined', async () => {
    const wrapper = mountNumber({ modelValue: 1 })
    await type(wrapper, '42')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([42])
    expect(customEmits(wrapper, 'input').at(-1)).toEqual([42])

    await type(wrapper, '')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])

    await type(wrapper, 'abc')
    // number 输入框会把非数字文本归一成空串，因此抛的是 undefined 而不是 NaN
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    expect(customEmits(wrapper, 'input')).toHaveLength(3)
  })

  it('modelValue 为 null / undefined / NaN 时展示空值', () => {
    const nil = mountNumber({ modelValue: null })
    expect((nil.find('input').element as HTMLInputElement).value).toBe('')
    const undef = mountNumber({})
    expect((undef.find('input').element as HTMLInputElement).value).toBe('')
    const nan = mountNumber({ modelValue: Number.NaN })
    expect((nan.find('input').element as HTMLInputElement).value).toBe('')
    const zero = mountNumber({ modelValue: 0 })
    expect((zero.find('input').element as HTMLInputElement).value).toBe('0')
  })

  it('disabled 同时禁用输入与按钮，readonly 只锁输入', async () => {
    const wrapper = mountNumber({ modelValue: 1, disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(increase(wrapper).attributes('disabled')).toBeDefined()
    expect(decrease(wrapper).attributes('disabled')).toBeDefined()
    await increase(wrapper).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    const readonly = mountNumber({ modelValue: 1, readonly: true })
    expect(readonly.find('input').attributes('readonly')).toBeDefined()
    expect(readonly.classes()).not.toContain('is-disabled')
    expect(increase(readonly).attributes('disabled')).toBeDefined()
    await increase(readonly).trigger('click')
    expect(readonly.emitted('update:modelValue')).toBeUndefined()
  })

  it('controls=false 隐藏按钮，controlsPosition=both 改变排布', async () => {
    const none = mountNumber({ modelValue: 1, controls: false })
    expect(none.classes()).toContain('is-controls-none')
    expect(none.findAll('button')).toHaveLength(0)
    expect(none.find('.ui-input-number__controls').exists()).toBe(false)
    expect(none.find('input').exists()).toBe(true)

    const both = mountNumber({ modelValue: 1, controlsPosition: 'both' })
    expect(both.classes()).toContain('is-controls-both')
    const order = Array.from(both.element.children).map((n) => (n as HTMLElement).className)
    expect(order).toEqual(['ui-input-number__decrease', 'ui-input-number__inner', 'ui-input-number__increase'])
    await both.find('.ui-input-number__decrease').trigger('click')
    expect(both.emitted('update:modelValue')?.[0]).toEqual([0])
  })

  it('size / align / placeholder / name / id / tabindex 落到输入框', () => {
    const wrapper = mountNumber({
      modelValue: 1,
      size: 'large',
      align: 'left',
      placeholder: '请输入',
      name: 'count',
      id: 'num',
      tabindex: 3
    })
    expect(wrapper.classes()).toContain('ui-input-number--size-large')
    const input = wrapper.find('input')
    expect(input.attributes('style')).toContain('text-align: left')
    expect(input.attributes('placeholder')).toBe('请输入')
    expect(input.attributes('name')).toBe('count')
    expect(input.attributes('id')).toBe('num')
    expect(input.attributes('tabindex')).toBe('3')
    const centered = mountNumber({ modelValue: 1, align: 'right' })
    expect(centered.find('input').attributes('style')).toContain('text-align: right')
  })

  it('step=0 退化为 1，负 step 也能步进', async () => {
    const zero = mountNumber({ modelValue: 1, step: 0 })
    await increase(zero).trigger('click')
    expect(zero.emitted('update:modelValue')?.[0]).toEqual([2])

    const negative = mountNumber({ modelValue: 5, step: -2 })
    await increase(negative).trigger('click')
    expect(negative.emitted('update:modelValue')?.[0]).toEqual([3])
  })

  it('极大 / 极小值被禁用按钮锁死，浮点按 precision 归零', async () => {
    const big = mountNumber({ modelValue: 9007199254740991 })
    expect(increase(big).attributes('disabled')).toBeDefined()
    await increase(big).trigger('click')
    expect(big.emitted('update:modelValue')).toBeUndefined()

    const small = mountNumber({ modelValue: -9007199254740991 })
    expect(decrease(small).attributes('disabled')).toBeDefined()
    await decrease(small).trigger('click')
    expect(small.emitted('update:modelValue')).toBeUndefined()

    const zeroFloat = mountNumber({ modelValue: -0.0001, step: 0.0001, min: -1, max: 1, precision: 2 })
    await increase(zeroFloat).trigger('click')
    expect(zeroFloat.emitted('update:modelValue')?.[0]).toEqual([0])
  })

  it('组件通过 methods 特性暴露 focus 等命令式方法', () => {
    const wrapper = mountNumber({ modelValue: 1 })
    const vm = wrapper.vm as unknown as Record<string, unknown>
    expect(typeof vm.focus).toBe('function')
  })
})
