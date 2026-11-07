import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { Col, Row } from '@ui-kit-full'

// 独立列：无 Row 注入时 gutter 视作 [0,0]
function mountCol(props: Record<string, any> = {}, text = '内容') {
  return mount(Col, { props, slots: { default: () => text } })
}

// 在 Row 内使用列，以验证 gutter 内外边距分配
function mountColInRow(rowProps: Record<string, any>, colProps: Record<string, any>) {
  return mount(Row, { props: rowProps, slots: { default: () => h(Col, colProps, () => 'x') } })
}

function styleOf(wrapper: { attributes: (k: string) => string | undefined }) {
  return wrapper.attributes('style') ?? ''
}

describe('Col 栅格列', () => {
  it('缺省 span 24 占满整行', () => {
    const wrapper = mountCol({})
    expect(wrapper.classes()).toContain('ui-col')
    expect(wrapper.element.tagName).toBe('DIV')
    const style = styleOf(wrapper)
    expect(style).toContain('max-width: 100%')
    expect(style).toContain('flex-basis: 100%')
  })

  it('span 按 1/24 换算百分比宽度', () => {
    expect(styleOf(mountCol({ span: 12 }))).toContain('max-width: 50%')
    expect(styleOf(mountCol({ span: 6 }))).toContain('max-width: 25%')
    expect(styleOf(mountCol({ span: 8 }))).toContain('33.33333333333333%')
  })

  it('popper 特性类名恒挂', () => {
    expect(mountCol({}).classes()).toContain('ui-col--popper')
    expect(mountCol({ offset: 3 }).classes()).toContain('ui-col--popper')
  })

  it('offset 换算成左外边距百分比', () => {
    expect(styleOf(mountCol({ offset: 3 }))).toContain('margin-left: 12.5%')
    expect(styleOf(mountCol({ offset: 6 }))).toContain('margin-left: 25%')
  })

  it('offset 为 0 不写左外边距', () => {
    expect(styleOf(mountCol({ offset: 0 }))).not.toContain('margin-left')
  })

  it('pull/push 触发相对定位与左右偏移', () => {
    const style = styleOf(mountCol({ pull: 1, push: 2 }))
    expect(style).toContain('position: relative')
    expect(style).toContain('right: 4.166666666666666%')
    expect(style).toContain('left: 8.333333333333332%')
  })

  it('无 pull/push 时不写相对定位', () => {
    const style = styleOf(mountCol({ pull: 0, push: 0 }))
    expect(style).not.toContain('position')
    expect(style).not.toContain('right')
    expect(style).not.toContain('left')
  })

  it('tag 替换元素标签', () => {
    expect(mountCol({ tag: 'span' }).element.tagName).toBe('SPAN')
  })

  it('独立列不含 gutter 内边距', () => {
    const style = styleOf(mountCol({ span: 12 }))
    expect(style).not.toContain('padding-left')
    expect(style).not.toContain('padding-right')
  })

  it('Row gutter 在列两侧各分一半', () => {
    const wrapper = mountColInRow({ gutter: 16 }, { span: 12 })
    const colStyle = wrapper.find('.ui-col').attributes('style') ?? ''
    expect(colStyle).toContain('padding-left: 8px')
    expect(colStyle).toContain('padding-right: 8px')
  })

  it('Row gutter 为 0 时列无内边距', () => {
    const wrapper = mountColInRow({ gutter: 0 }, { span: 12 })
    expect(wrapper.find('.ui-col').attributes('style') ?? '').not.toContain('padding-left')
  })

  it('列内容落在默认插槽', () => {
    expect(mountCol({ span: 12 }, '栅格内容').text()).toBe('栅格内容')
  })

  it('span 0 归零宽度', () => {
    const style = styleOf(mountCol({ span: 0 }))
    expect(style).toContain('max-width: 0%')
  })
})
