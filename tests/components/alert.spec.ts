import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Alert } from '@ui-kit-full'

// 统一构造 Alert，标题走 title 属性、描述走默认插槽
function mountAlert(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Alert, { props, slots })
}

function content(wrapper: VueWrapper) {
  return wrapper.find('.ui-alert__content')
}

describe('Alert 警告提示', () => {
  it('根节点带类型与明暗态类名', () => {
    const wrapper = mountAlert({ title: '提示内容', type: 'warning' })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('ui-alert')
    expect(wrapper.classes()).toContain('ui-alert--warning')
    expect(wrapper.classes()).toContain('ui-alert--light')
    expect(content(wrapper).find('.ui-alert__title').text()).toBe('提示内容')
  })

  it('缺省 type 是 info、effect 是 light', () => {
    const wrapper = mountAlert({ title: '默认' })
    expect(wrapper.classes()).toContain('ui-alert--info')
    expect(wrapper.classes()).toContain('ui-alert--light')
    expect(wrapper.classes()).not.toContain('is-center')
  })

  it('四种 type 各自映射色彩类名', () => {
    expect(mountAlert({ title: 'a', type: 'success' }).classes()).toContain('ui-alert--success')
    expect(mountAlert({ title: 'a', type: 'warning' }).classes()).toContain('ui-alert--warning')
    expect(mountAlert({ title: 'a', type: 'error' }).classes()).toContain('ui-alert--error')
    expect(mountAlert({ title: 'a', type: 'info' }).classes()).toContain('ui-alert--info')
  })

  it('effect dark 切换主题类名', () => {
    expect(mountAlert({ title: 'a', effect: 'dark' }).classes()).toContain('ui-alert--dark')
  })

  it('center 追加 is-center', () => {
    expect(mountAlert({ title: 'a', center: true }).classes()).toContain('is-center')
  })

  it('description 属性渲染描述行', () => {
    const wrapper = mountAlert({ title: '标题', description: '这是描述文案' })
    expect(wrapper.find('.ui-alert__description').text()).toBe('这是描述文案')
  })

  it('默认插槽承载描述内容并优先于 description 属性', () => {
    const wrapper = mountAlert({ title: '标题', description: '属性描述' }, { default: () => '插槽描述' })
    expect(wrapper.find('.ui-alert__description').text()).toBe('插槽描述')
  })

  it('title 插槽优先于 title 属性', () => {
    const wrapper = mountAlert({ title: '属性标题' }, { title: () => '插槽标题' })
    expect(wrapper.find('.ui-alert__title').text()).toBe('插槽标题')
  })

  it('showIcon 渲染语义图标并追加特性类名', () => {
    const wrapper = mountAlert({ title: 'a', type: 'success', showIcon: true })
    expect(wrapper.classes()).toContain('ui-alert--icons')
    const icon = wrapper.find('.ui-alert__icon')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('ui-icon')
    expect(icon.find('svg').classes()).toContain('lucide-circle-check')
  })

  it('不同 type 命中不同图标', () => {
    expect(
      mountAlert({ title: 'a', type: 'error', showIcon: true }).find('svg').classes()
    ).toContain('lucide-circle-x')
    expect(
      mountAlert({ title: 'a', type: 'info', showIcon: true }).find('svg').classes()
    ).toContain('lucide-info')
  })

  it('缺省不显示图标也不挂特性类名', () => {
    const wrapper = mountAlert({ title: 'a' })
    expect(wrapper.find('.ui-alert__icon').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('ui-alert--icons')
  })

  it('closable 默认渲染关闭按钮', () => {
    const wrapper = mountAlert({ title: 'a' })
    expect(wrapper.classes()).toContain('ui-alert--closable')
    const close = wrapper.find('.ui-alert__close')
    expect(close.exists()).toBe(true)
    expect(close.attributes('aria-label')).toBe('Close')
    expect(close.attributes('type')).toBe('button')
  })

  it('closable false 且无 closeText 时不渲染按钮', () => {
    const wrapper = mountAlert({ title: 'a', closable: false })
    expect(wrapper.find('.ui-alert__close').exists()).toBe(false)
  })

  it('点击关闭抛出 close 并收起整块', async () => {
    const wrapper = mountAlert({ title: '标题', description: '描述' })
    await wrapper.find('.ui-alert__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.classes()).toContain('is-hidden')
    expect(wrapper.classes()).not.toContain('ui-alert--closable')
    expect(wrapper.find('.ui-alert__close').exists()).toBe(false)
    // 标题仍在，只是关闭入口消失
    expect(wrapper.find('.ui-alert__title').text()).toBe('标题')
  })

  it('closeText 用文字替换关闭图标', () => {
    const wrapper = mountAlert({ title: 'a', closeText: '知道了' })
    expect(wrapper.find('.ui-alert__close').text()).toBe('知道了')
    expect(wrapper.find('.ui-alert__close').find('svg').exists()).toBe(false)
  })

  it('closeText 单独存在时也能渲染按钮', () => {
    const wrapper = mountAlert({ title: 'a', closable: false, closeText: '关闭它' })
    expect(wrapper.find('.ui-alert__close').text()).toBe('关闭它')
  })

  it('标题与描述都为空时不渲染内容容器', () => {
    const wrapper = mountAlert({})
    expect(content(wrapper).exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })

  it('仅有描述没有标题时只渲染描述行', () => {
    const wrapper = mountAlert({ description: '只有描述' })
    expect(wrapper.find('.ui-alert__title').exists()).toBe(false)
    expect(wrapper.find('.ui-alert__description').text()).toBe('只有描述')
  })

  it('超长标题文本完整保留', () => {
    const long = '警告'.repeat(40)
    expect(mountAlert({ title: long }).find('.ui-alert__title').text()).toBe(long)
  })

  it('未知 type 原样落类名并回退 info 图标', () => {
    const wrapper = mountAlert({ title: 'a', type: 'custom', showIcon: true })
    expect(wrapper.classes()).toContain('ui-alert--custom')
    expect(wrapper.find('svg').classes()).toContain('lucide-info')
  })
})
