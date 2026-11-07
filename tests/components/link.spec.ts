import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Link } from '@ui-kit-full'

function mountLink(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Link, { props, slots })
}

function dispatchClick(element: Element) {
  const event = new window.MouseEvent('click', { bubbles: true, cancelable: true })
  element.dispatchEvent(event)
  return event
}

describe('Link 链接', () => {
  it('缺省渲染无 href 的 <a>', () => {
    const wrapper = mountLink()
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.classes()).toContain('ui-link')
    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('href 落属性且 target 缺省为 _self', () => {
    const wrapper = mountLink({ href: '/x' })
    expect(wrapper.attributes('href')).toBe('/x')
    expect(wrapper.attributes('target')).toBe('_self')
  })

  it('target 可自定义', () => {
    expect(mountLink({ href: '/x', target: '_blank' }).attributes('target')).toBe('_blank')
  })

  it('type 映射为修饰类名', () => {
    expect(mountLink({ type: 'primary' }).classes()).toContain('ui-link--primary')
    expect(mountLink({ type: 'danger' }).classes()).toContain('ui-link--danger')
  })

  it('空 type 不落修饰类名', () => {
    expect(mountLink({ type: '' }).classes()).toEqual(['ui-link'])
  })

  it('disabled 落 is-disabled 类与无障碍属性', () => {
    const wrapper = mountLink({ href: '/x', disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.attributes('tabindex')).toBe('-1')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  it('disabled 不产生原生 disabled 属性', () => {
    expect(mountLink({ disabled: true }).attributes('disabled')).toBeUndefined()
  })

  it('disabled 时点击被阻止默认', () => {
    const event = dispatchClick(mountLink({ href: '/x', disabled: true }).get('a').element)
    expect(event.defaultPrevented).toBe(true)
  })

  it('未禁用时点击不阻止默认', () => {
    const event = dispatchClick(mountLink({ href: '/x' }).get('a').element)
    expect(event.defaultPrevented).toBe(false)
  })

  it('underline 为 true 或 always 落常驻下划线类', () => {
    expect(mountLink({ underline: true }).classes()).toContain('ui-link--underline')
    expect(mountLink({ underline: 'always' }).classes()).toContain('ui-link--underline')
  })

  it('underline 为 hover 落悬停下划线类', () => {
    expect(mountLink({ underline: 'hover' }).classes()).toContain('ui-link--underline-hover')
  })

  it('underline 为 false 或未知值不落划线类', () => {
    expect(mountLink({ underline: false }).classes()).toEqual(['ui-link'])
    expect(mountLink({ underline: 'nope' }).classes()).not.toContain('ui-link--underline')
  })

  it('icon 特性在内容前渲染图标 span', () => {
    const wrapper = mountLink({ icon: 'externalLink' }, { default: () => '文本' })
    const icon = wrapper.get('.ui-link__icon')
    expect(icon.classes()).toContain('ui-icon')
    expect(icon.find('svg').exists()).toBe(true)
    expect(icon.find('svg').classes()).toContain('lucide-external-link')
    expect(wrapper.text()).toContain('文本')
  })

  it('未传 icon 时不渲染图标 span', () => {
    expect(mountLink({ href: '/x' }).find('.ui-link__icon').exists()).toBe(false)
  })

  it('默认插槽渲染文本内容', () => {
    expect(mountLink({ href: '/x' }, { default: () => '点我' }).text()).toBe('点我')
  })

  it('超长文本完整保留', () => {
    const long = '链接文字'.repeat(30)
    expect(mountLink({}, { default: () => long }).text()).toBe(long)
  })

  it('tag 属性切换根节点标签且不漏成属性', () => {
    const wrapper = mountLink({ tag: 'span' }, { default: () => '点我' })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('ui-link')
    expect(wrapper.attributes('tag')).toBeUndefined()
  })

  it('不传 tag 时根节点仍是 a', () => {
    expect(mountLink({ href: '/x' }).element.tagName).toBe('A')
  })
})
