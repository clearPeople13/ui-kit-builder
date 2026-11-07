import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Segmented } from '@ui-kit-full'

function mountSegmented(props: Record<string, any> = {}) {
  return mount(Segmented, {
    props: { options: ['日', '月', '年'], modelValue: '日', ...props },
    attachTo: document.body
  })
}

function items(wrapper: ReturnType<typeof mountSegmented>) {
  return wrapper.findAll('.ui-segmented__item')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Segmented', () => {
  it('渲染 radiogroup 与逐项按钮', () => {
    const wrapper = mountSegmented()
    expect(wrapper.classes()).toContain('ui-segmented')
    expect(wrapper.find('.ui-segmented__group').attributes('role')).toBe('radiogroup')
    expect(items(wrapper)).toHaveLength(3)
    expect(items(wrapper).map((item) => item.text())).toEqual(['日', '月', '年'])
  })

  it('当前项挂 is-active 且 aria-checked 为 true', () => {
    const wrapper = mountSegmented()
    expect(items(wrapper)[0].classes()).toContain('is-active')
    expect(items(wrapper)[0].attributes('aria-checked')).toBe('true')
    expect(items(wrapper)[1].attributes('aria-checked')).toBe('false')
  })

  it('点击项抛出 update:modelValue 与 change', async () => {
    const wrapper = mountSegmented()
    await items(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['年'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['年'])
  })

  it('受控模式下点击不自行改写激活态', async () => {
    const wrapper = mountSegmented({ modelValue: '日' })
    await items(wrapper)[1].trigger('click')
    await nextTick()
    expect(items(wrapper)[1].classes()).not.toContain('is-active')
    expect(items(wrapper)[0].classes()).toContain('is-active')
  })

  it('对象选项按 label/value 渲染', () => {
    const wrapper = mountSegmented({
      options: [
        { label: '周一', value: 'mon' },
        { label: '周二', value: 'tue' }
      ],
      modelValue: 'tue'
    })
    expect(items(wrapper).map((item) => item.text())).toEqual(['周一', '周二'])
    expect(items(wrapper)[1].classes()).toContain('is-active')
  })

  it('props 映射自定义字段名', () => {
    const wrapper = mountSegmented({
      options: [
        { name: '甲', code: 1 },
        { name: '乙', code: 2 }
      ],
      props: { label: 'name', value: 'code' },
      modelValue: 1
    })
    expect(items(wrapper)[0].text()).toBe('甲')
    expect(items(wrapper)[0].classes()).toContain('is-active')
  })

  it('单个禁用选项点击不抛事件', async () => {
    const wrapper = mountSegmented({
      options: [
        { label: '可点', value: 'a' },
        { label: '禁用', value: 'b', disabled: true }
      ],
      modelValue: 'a'
    })
    expect(items(wrapper)[1].attributes('disabled')).toBeDefined()
    await items(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('整体 disabled 挂 is-disabled 且全部按钮禁用、点击不抛事件', async () => {
    const wrapper = mountSegmented({ disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(items(wrapper).every((item) => item.attributes('disabled') !== undefined)).toBe(true)
    await items(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('布尔值 modelValue 按字符串比较命中选项', () => {
    const wrapper = mountSegmented({ options: [{ label: '开', value: true }], modelValue: true })
    expect(items(wrapper)[0].classes()).toContain('is-active')
  })

  it('size 枚举落 is-size-* 类名', () => {
    expect(mountSegmented({ size: 'large' }).classes()).toContain('is-size-large')
    expect(mountSegmented({ size: 'small' }).classes()).toContain('is-size-small')
    expect(mountSegmented().classes()).not.toContain('is-size-large')
  })

  it('direction 默认水平，可切垂直', () => {
    expect(mountSegmented().classes()).toContain('is-horizontal')
    expect(mountSegmented({ direction: 'vertical' }).classes()).toContain('is-vertical')
  })

  it('block 与 id、label 落属性', () => {
    const wrapper = mountSegmented({ block: true, id: 'seg-1', label: '周期选择' })
    expect(wrapper.classes()).toContain('is-block')
    expect(wrapper.attributes('id')).toBe('seg-1')
    expect(wrapper.find('.ui-segmented__group').attributes('aria-label')).toBe('周期选择')
  })

  it('空数组选项只渲染空分组', () => {
    const wrapper = mountSegmented({ options: [] })
    expect(items(wrapper)).toHaveLength(0)
    expect(wrapper.find('.ui-segmented__group').exists()).toBe(true)
  })

  it('非数组选项按空列表处理不报错', () => {
    const wrapper = mountSegmented({ options: 'oops' as any })
    expect(items(wrapper)).toHaveLength(0)
  })

  it('数字/字符串 modelValue 跨类型仍匹配', () => {
    const wrapper = mountSegmented({ options: [1, 2, 3], modelValue: '2' })
    expect(items(wrapper)[1].classes()).toContain('is-active')
  })

  // 疑似缺陷：Segmented 的 modelValue 类型含 Boolean 却缺 default: undefined（segmented/core.ts:9），
  // 未传时被 Vue 归一化成 false，而契约 spec.mjs 声明其 default 为 null。
  // 于是 value 为布尔 false 的选项在未受控时被误判为选中（is-active / aria-checked=true）。
  // F-37 回归：modelValue 缺 default: undefined 时，未受控也会把 value:false 的选项点亮
  it('未受控（不传 modelValue）时不应有任何选项高亮', () => {
    const wrapper = mount(Segmented, {
      props: {
        options: [
          { label: '否', value: false },
          { label: '是', value: true }
        ]
      },
      attachTo: document.body
    })
    expect(items(wrapper).some((item) => item.classes().includes('is-active'))).toBe(false)
  })
})
