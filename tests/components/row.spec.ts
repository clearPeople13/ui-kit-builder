import { mount } from '@vue/test-utils'
import { h } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Col, Row } from '@ui-kit-full'

function mountRow(props: Record<string, any> = {}, cols = 1) {
  return mount(Row, {
    props,
    slots: {
      default: () => Array.from({ length: cols }, (_, i) => h(Col, { span: Math.floor(24 / cols) }, () => `列${i + 1}`))
    }
  })
}

function styleOf(wrapper: VueWrapper) {
  return wrapper.attributes('style') ?? ''
}

describe('Row 栅格行', () => {
  it('根节点是 div 并带 flex 基础样式', () => {
    const wrapper = mountRow()
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('ui-row')
    const style = styleOf(wrapper)
    expect(style).toContain('display: flex')
    expect(style).toContain('flex-wrap: wrap')
  })

  it('缺省 justify 落 is-justify-start 且不带负边距', () => {
    const wrapper = mountRow()
    expect(wrapper.classes()).toContain('is-justify-start')
    expect(wrapper.classes()).not.toContain('is-align-middle')
    expect(styleOf(wrapper)).not.toContain('margin-left')
    expect(styleOf(wrapper)).not.toContain('row-gap')
  })

  it('justify 枚举映射对齐类名', () => {
    expect(mountRow({ justify: 'end' }).classes()).toContain('is-justify-end')
    expect(mountRow({ justify: 'center' }).classes()).toContain('is-justify-center')
    expect(mountRow({ justify: 'space-between' }).classes()).toContain('is-justify-space-between')
  })

  it('align 传入时挂 is-align 类名', () => {
    expect(mountRow({ align: 'middle' }).classes()).toContain('is-align-middle')
    expect(mountRow({ align: 'bottom' }).classes()).toContain('is-align-bottom')
  })

  it('水平 gutter 均摊到两侧负边距', () => {
    const style = styleOf(mountRow({ gutter: 16 }))
    expect(style).toContain('margin-left: -8px')
    expect(style).toContain('margin-right: -8px')
  })

  it('数组 gutter 追加 rowGap', () => {
    const style = styleOf(mountRow({ gutter: [20, 10] }))
    expect(style).toContain('margin-left: -10px')
    expect(style).toContain('margin-right: -10px')
    expect(style).toContain('row-gap: 10px')
  })

  it('gutter 为 0 或非法时不写负边距', () => {
    expect(styleOf(mountRow({ gutter: 0 }))).not.toContain('margin-left')
    expect(styleOf(mountRow({ gutter: undefined }))).not.toContain('margin-left')
  })

  it('tag 属性替换根元素', () => {
    expect(mountRow({ tag: 'section' }).element.tagName).toBe('SECTION')
  })

  it('向下透传 gutter 给子列内边距', () => {
    const wrapper = mountRow({ gutter: 16 }, 2)
    const colStyle = wrapper.findAll('.ui-col')[0].attributes('style') ?? ''
    expect(colStyle).toContain('padding-left: 8px')
    expect(colStyle).toContain('padding-right: 8px')
  })

  it('渲染全部子列', () => {
    const wrapper = mountRow({ gutter: 8 }, 3)
    expect(wrapper.findAll('.ui-col')).toHaveLength(3)
    expect(wrapper.text()).toContain('列1')
    expect(wrapper.text()).toContain('列3')
  })

  it('空插槽只渲染行容器', () => {
    const wrapper = mount(Row, { props: {} })
    expect(wrapper.classes()).toContain('ui-row')
    expect(wrapper.findAll('.ui-col')).toHaveLength(0)
  })
})
