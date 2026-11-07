import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { Breadcrumb, BreadcrumbItem } from '@ui-kit-full'

const items = [{ text: '首页', to: '/' }, { text: '列表页', to: '/list' }, { text: '当前页' }]

// 面包屑条目通过默认插槽注册，逐项渲染分隔符与内容
function mountBreadcrumb(props: Record<string, any> = {}, list: Array<Record<string, any>> = items) {
  return mount(Breadcrumb, {
    props,
    slots: { default: () => list.map((item) => h(BreadcrumbItem, { to: item.to }, () => item.text)) }
  })
}

function itemWrappers(wrapper: ReturnType<typeof mountBreadcrumb>) {
  return wrapper.findAll('.ui-breadcrumb-item')
}

function separators(wrapper: ReturnType<typeof mountBreadcrumb>) {
  return wrapper.findAll('.ui-breadcrumb-item__separator')
}

describe('Breadcrumb 面包屑', () => {
  it('根节点是 nav 并挂基础类名', () => {
    const wrapper = mountBreadcrumb()
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.classes()).toContain('ui-breadcrumb')
    expect(itemWrappers(wrapper)).toHaveLength(3)
  })

  it('含 to 的条目渲染为链接并标记 is-link', () => {
    const wrapper = mountBreadcrumb()
    expect(itemWrappers(wrapper)[0].element.tagName).toBe('A')
    expect(itemWrappers(wrapper)[0].attributes('href')).toBe('/')
    expect(itemWrappers(wrapper)[0].classes()).toContain('is-link')
  })

  it('无 to 的末级条目渲染为普通文本', () => {
    const wrapper = mountBreadcrumb()
    const last = itemWrappers(wrapper)[2]
    expect(last.element.tagName).toBe('SPAN')
    expect(last.classes()).not.toContain('is-link')
    expect(last.attributes('href')).toBeUndefined()
  })

  it('内容落在 __inner 文本节点', () => {
    const wrapper = mountBreadcrumb()
    expect(itemWrappers(wrapper)[0].find('.ui-breadcrumb-item__inner').text()).toBe('首页')
  })

  it('缺省分隔符是斜杠且每个条目都带分隔符', () => {
    const wrapper = mountBreadcrumb()
    const seps = separators(wrapper)
    expect(seps).toHaveLength(3)
    expect(seps[0].text()).toBe('/')
    expect(seps[0].attributes('aria-hidden')).toBe('true')
  })

  it('separator 自定义分隔文本', () => {
    const wrapper = mountBreadcrumb({ separator: '>' })
    expect(separators(wrapper)[1].text()).toBe('>')
  })

  it('separatorIcon 用图标替换文本分隔符', () => {
    const wrapper = mountBreadcrumb({ separatorIcon: 'home' })
    const sep = separators(wrapper)[0]
    const icon = sep.find('.ui-breadcrumb-item__separator-icon')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('ui-icon')
    expect(sep.text()).toBe('')
  })

  it('to 为对象时按 href 或 path 生成链接', () => {
    const wrapper = mountBreadcrumb({}, [
      { text: '对象A', to: { href: '/a' } },
      { text: '对象B', to: { path: '/b' } }
    ])
    expect(itemWrappers(wrapper)[0].attributes('href')).toBe('/a')
    expect(itemWrappers(wrapper)[1].attributes('href')).toBe('/b')
  })

  it('空对象 to 不生成链接', () => {
    const wrapper = mountBreadcrumb({}, [{ text: '空' }])
    expect(itemWrappers(wrapper)[0].classes()).not.toContain('is-link')
  })

  it('无条目时只渲染空的 nav', () => {
    const wrapper = mountBreadcrumb({}, [])
    expect(wrapper.classes()).toContain('ui-breadcrumb')
    expect(itemWrappers(wrapper)).toHaveLength(0)
  })

  it('replace 条目点击时拦截默认跳转', async () => {
    const replaceSpy = vi.spyOn(window.location, 'replace').mockImplementation(() => {})
    const wrapper = mount(Breadcrumb, {
      slots: { default: () => h(BreadcrumbItem, { to: '/x', replace: true }, () => '替换') }
    })
    await itemWrappers(wrapper)[0].trigger('click')
    expect(itemWrappers(wrapper)[0].classes()).toContain('is-link')
    replaceSpy.mockRestore()
  })

  it('超长文本原样保留在内容节点', () => {
    const long = '分类'.repeat(30)
    const wrapper = mountBreadcrumb({}, [{ text: long }])
    expect(itemWrappers(wrapper)[0].find('.ui-breadcrumb-item__inner').text()).toBe(long)
  })
})
