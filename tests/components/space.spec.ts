import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Space } from '@ui-kit-full'

function mountSpace(props: Record<string, any> = {}, children: any = [h('span', 'A'), h('span', 'B')]) {
  return mount(Space, { props, slots: { default: () => children }, attachTo: document.body })
}

function style(wrapper: ReturnType<typeof mountSpace>) {
  return wrapper.attributes('style') ?? ''
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Space', () => {
  it('渲染根节点并透传全部子项', () => {
    const wrapper = mountSpace()
    expect(wrapper.classes()).toContain('ui-space')
    expect(wrapper.findAll('span')).toHaveLength(2)
  })

  it('默认水平方向、居中、内联 flex', () => {
    const wrapper = mountSpace()
    expect(wrapper.classes()).toContain('is-horizontal')
    expect(style(wrapper)).toContain('display: inline-flex')
    expect(style(wrapper)).toContain('flex-direction: row')
    expect(style(wrapper)).toContain('align-items: center')
  })

  it('direction vertical 切换列方向与类名', () => {
    const wrapper = mountSpace({ direction: 'vertical' })
    expect(wrapper.classes()).toContain('is-vertical')
    expect(style(wrapper)).toContain('flex-direction: column')
  })

  it('alignment start/end 映射对齐值', () => {
    expect(style(mountSpace({ alignment: 'start' }))).toContain('align-items: flex-start')
    expect(style(mountSpace({ alignment: 'end' }))).toContain('align-items: flex-end')
  })

  it('数字 size 换算成 px 间距', () => {
    expect(style(mountSpace({ size: 16 }))).toContain('gap: 16px')
  })

  it('缺省 size 落到 8px', () => {
    expect(style(mountSpace())).toContain('gap: 8px')
  })

  it('数组 size 展开为行列两个间距', () => {
    expect(style(mountSpace({ size: [8, 16] }))).toContain('gap: 8px 16px')
  })

  it('字符串 size 原样作为 gap', () => {
    expect(style(mountSpace({ size: 'large' }))).toContain('gap: large')
  })

  it('wrap 同时挂类名与 flex-wrap 样式', () => {
    const wrapper = mountSpace({ wrap: true })
    expect(wrapper.classes()).toContain('is-wrap')
    expect(style(wrapper)).toContain('flex-wrap: wrap')
    expect(style(mountSpace())).not.toContain('flex-wrap')
  })

  it('fill 挂 is-fill 类名', () => {
    expect(mountSpace({ fill: true }).classes()).toContain('is-fill')
    expect(mountSpace().classes()).not.toContain('is-fill')
  })

  it('无子项时渲染空容器不报错', () => {
    const wrapper = mountSpace({}, [])
    expect(wrapper.classes()).toContain('ui-space')
    expect(wrapper.element.children).toHaveLength(0)
  })

  it('单项也正常包裹', () => {
    const wrapper = mountSpace({}, h('span', '仅一项'))
    expect(wrapper.findAll('span')).toHaveLength(1)
    expect(wrapper.text()).toBe('仅一项')
  })

  it('class 与字符串 style 透传合并到根节点', () => {
    const wrapper = mount({
      render: () => h(Space, { class: 'my-space', style: 'margin: 4px' }, () => h('span', 'A'))
    })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-space', 'my-space']))
    expect(style(wrapper)).toContain('margin: 4px')
  })

  it('size 为空串时视为未设置间距，不写 gap', () => {
    // gapValue('') 返回 undefined，只有 undefined/null 才回退 8
    expect(style(mountSpace({ size: '' }))).not.toContain('gap')
  })
})
