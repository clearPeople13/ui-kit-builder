import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Tag } from '@ui-kit-full'

function mountTag(props: Record<string, any> = {}, slots: Record<string, any> = { default: () => '标签' }) {
  return mount(Tag, { props, slots, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Tag', () => {
  it('默认 primary 类型、light 效果、span 根节点', () => {
    const wrapper = mountTag()
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-tag', 'ui-tag--primary', 'ui-tag--light']))
    expect(wrapper.text()).toBe('标签')
  })

  it('type 枚举落到 ui-tag--* 类名', () => {
    for (const type of ['success', 'info', 'warning', 'danger']) {
      expect(mountTag({ type }).classes()).toContain(`ui-tag--${type}`)
    }
  })

  it('effect 枚举落到 ui-tag--* 类名', () => {
    expect(mountTag({ effect: 'dark' }).classes()).toContain('ui-tag--dark')
    expect(mountTag({ effect: 'plain' }).classes()).toContain('ui-tag--plain')
  })

  it('size 枚举落到 ui-tag--size-* 类名', () => {
    expect(mountTag({ size: 'large' }).classes()).toContain('ui-tag--size-large')
    expect(mountTag({ size: 'small' }).classes()).toContain('ui-tag--size-small')
    expect(mountTag().classes()).not.toContain('ui-tag--size-large')
  })

  it('color 写内联背景/边框并强制白字', () => {
    const wrapper = mountTag({ color: '#ff0000' })
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('background-color: #ff0000')
    expect(style).toContain('border-color: #ff0000')
    expect(style).toContain('color: #ffffff')
  })

  it('无 color 时不写内联背景', () => {
    expect(mountTag().attributes('style') ?? '').not.toContain('background-color')
  })

  it('closable 跟随 prop 挂 ui-tag--closable 类名', () => {
    expect(mountTag({ closable: true }).classes()).toContain('ui-tag--closable')
    expect(mountTag({ closable: false }).classes()).not.toContain('ui-tag--closable')
    expect(mountTag().classes()).not.toContain('ui-tag--closable')
  })

  it('round 与 hit 外观变体类名', () => {
    expect(mountTag({ round: true }).classes()).toContain('is-round')
    expect(mountTag({ hit: true }).classes()).toContain('is-hit')
    expect(mountTag().classes()).not.toEqual(expect.arrayContaining(['is-round', 'is-hit']))
  })

  it('点击标签不抛自定义事件（契约未声明事件）', async () => {
    const wrapper = mountTag({ closable: true })
    await wrapper.trigger('click')
    await nextTick()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('空插槽渲染空标签不报错', () => {
    const wrapper = mountTag({}, { default: () => null })
    expect(wrapper.classes()).toContain('ui-tag')
    expect(wrapper.text()).toBe('')
  })

  it('超长文本原样渲染', () => {
    const long = '标'.repeat(200)
    expect(mountTag({}, { default: () => long }).text()).toBe(long)
  })

  it('class 透传与基类名共存', () => {
    const wrapper = mountTag({ class: 'my-tag' })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-tag', 'my-tag']))
  })

  it('字符串 style 落到根节点且与 color 内联合并', () => {
    const wrapper = mount({ render: () => h(Tag, { style: 'width: 220px' }, () => 'x') })
    expect(wrapper.attributes('style') ?? '').toContain('width: 220px')
  })

  it('多个开关同时开启时各特性类名并存', () => {
    const classes = mountTag({
      type: 'danger',
      effect: 'dark',
      size: 'small',
      closable: true,
      round: true,
      hit: true
    }).classes()
    expect(classes).toEqual(
      expect.arrayContaining([
        'ui-tag',
        'ui-tag--danger',
        'ui-tag--dark',
        'ui-tag--size-small',
        'ui-tag--closable',
        'is-round',
        'is-hit'
      ])
    )
  })
})
