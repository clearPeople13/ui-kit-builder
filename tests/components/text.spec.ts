import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Text } from '@ui-kit-full'

function mountText(props: Record<string, any> = {}, slots: Record<string, any> = { default: () => '正文内容' }) {
  return mount(Text, { props, slots, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Text', () => {
  it('默认渲染 span 根节点与基类名', () => {
    const wrapper = mountText()
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('ui-text')
    expect(wrapper.text()).toBe('正文内容')
  })

  it('type 枚举落到 ui-text--* 类名', () => {
    expect(mountText({ type: 'primary' }).classes()).toContain('ui-text--primary')
    expect(mountText({ type: 'danger' }).classes()).toContain('ui-text--danger')
    expect(mountText({ type: '' }).classes()).not.toContain('ui-text--primary')
  })

  it('size 枚举落到 ui-text--size-* 类名', () => {
    expect(mountText({ size: 'large' }).classes()).toContain('ui-text--size-large')
    expect(mountText({ size: 'small' }).classes()).toContain('ui-text--size-small')
  })

  it('truncated 挂 is-truncated 类名', () => {
    expect(mountText({ truncated: true }).classes()).toContain('is-truncated')
    expect(mountText().classes()).not.toContain('is-truncated')
  })

  it('lineClamp 挂 is-line-clamp 且不叠加 is-truncated', () => {
    const wrapper = mountText({ lineClamp: 3, truncated: true })
    expect(wrapper.classes()).toContain('is-line-clamp')
    expect(wrapper.classes()).not.toContain('is-truncated')
    expect(wrapper.attributes('style') ?? '').toContain('overflow: hidden')
  })

  it('lineClamp 与 truncated 都不设时无截断类名', () => {
    const classes = mountText().classes()
    expect(classes).not.toContain('is-line-clamp')
    expect(classes).not.toContain('is-truncated')
  })

  it('tag 属性切换根标签名', () => {
    expect(mountText({ tag: 'p' }).element.tagName).toBe('P')
    expect(mountText({ tag: 'div' }).element.tagName).toBe('DIV')
  })

  it('超长文本原样渲染在默认插槽内', () => {
    const long = '一'.repeat(500)
    expect(mountText({ truncated: true }, { default: () => long }).text()).toBe(long)
  })

  it('空插槽渲染空节点不报错', () => {
    const wrapper = mountText({}, { default: () => null })
    expect(wrapper.classes()).toContain('ui-text')
    expect(wrapper.text()).toBe('')
  })

  it('class 透传与基类名共存', () => {
    const wrapper = mountText({ class: 'extra' })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-text', 'extra']))
  })

  it('字符串 style 落到根节点', () => {
    const wrapper = mount({ render: () => h(Text, { style: 'width: 220px' }, () => 'x') })
    expect(wrapper.attributes('style') ?? '').toContain('width: 220px')
  })

  it('id 落到根节点属性', () => {
    expect(mountText({ id: 't-1' }).attributes('id')).toBe('t-1')
  })

  it('lineClamp 数字与字符串等价命中类名', () => {
    expect(mountText({ lineClamp: 2 }).classes()).toContain('is-line-clamp')
    expect(mountText({ lineClamp: '2' }).classes()).toContain('is-line-clamp')
  })
})
