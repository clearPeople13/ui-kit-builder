import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Badge } from '@ui-kit-full'

// 统一构造 Badge，收敛公共 props
function mountBadge(props: Record<string, any> = {}) {
  return mount(Badge, { props: { value: 5, ...props } })
}

function sup(wrapper: VueWrapper) {
  return wrapper.find('sup.ui-badge__content')
}

describe('Badge 徽章', () => {
  it('根节点是带缺省危险色的 span', () => {
    const wrapper = mountBadge()
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('ui-badge')
    expect(wrapper.classes()).toContain('ui-badge--danger')
  })

  it('数字 value 渲染为 sup 内容', () => {
    expect(sup(mountBadge()).text()).toBe('5')
  })

  it('缺省空 value 不渲染 sup', () => {
    const wrapper = mount(Badge)
    expect(sup(wrapper).exists()).toBe(false)
  })

  it('字符串 value 原样展示且不受 max 截断', () => {
    expect(sup(mountBadge({ value: 'new' })).text()).toBe('new')
    expect(sup(mountBadge({ value: '1234', max: 10 })).text()).toBe('1234')
  })

  it('超过 max 折叠为 max+，恰等于 max 不折叠', () => {
    expect(sup(mountBadge({ value: 200 })).text()).toBe('99+')
    expect(sup(mountBadge({ value: 20, max: 10 })).text()).toBe('10+')
    expect(sup(mountBadge({ value: 99 })).text()).toBe('99')
  })

  it('type 切换色彩类名', () => {
    expect(mountBadge({ type: 'primary' }).classes()).toContain('ui-badge--primary')
  })

  it('type 为空串时不产生色彩类名', () => {
    const wrapper = mountBadge({ type: '' })
    expect(wrapper.classes().filter((c) => c.startsWith('ui-badge--'))).toEqual(['ui-badge--popper'])
  })

  it('isDot 渲染空内容的圆点并追加 is-dot', () => {
    const wrapper = mountBadge({ isDot: true })
    expect(wrapper.classes()).toContain('is-dot')
    const dot = sup(wrapper)
    expect(dot.exists()).toBe(true)
    expect(dot.text()).toBe('')
    // 圆点不受 showZero=false 影响
    expect(sup(mountBadge({ isDot: true, showZero: false })).exists()).toBe(true)
  })

  it('hidden 隐藏 sup 并追加 is-hidden', () => {
    const wrapper = mountBadge({ hidden: true })
    expect(wrapper.classes()).toContain('is-hidden')
    expect(sup(wrapper).exists()).toBe(false)
    // 与 isDot 同开时仍不渲染
    const both = mountBadge({ isDot: true, hidden: true })
    expect(both.classes()).toContain('is-dot')
    expect(both.classes()).toContain('is-hidden')
    expect(sup(both).exists()).toBe(false)
  })

  it('showZero 控制 value=0 的显隐', () => {
    expect(sup(mountBadge({ value: 0 })).text()).toBe('0')
    expect(sup(mountBadge({ value: 0, showZero: false })).exists()).toBe(false)
  })

  it('color 写入 sup 背景色', () => {
    expect(sup(mountBadge({ color: 'rgb(9, 9, 9)' })).attributes('style')).toContain('background-color: rgb(9, 9, 9)')
  })

  it('offset 控制 sup 的位移，[0,0] 时不写入样式', () => {
    const style = sup(mountBadge({ offset: [10, 20] })).attributes('style')
    expect(style).toContain('right: -10px')
    expect(style).toContain('margin-top: 20px')
    expect(sup(mountBadge({ offset: [0, 0] })).attributes('style')).toBeUndefined()
  })

  it('默认插槽渲染被包裹的内容且 sup 随后', () => {
    const wrapper = mount(Badge, {
      props: { value: 5 },
      slots: { default: '<span class="box">内容</span>' }
    })
    expect(wrapper.find('.box').exists()).toBe(true)
    expect(wrapper.element.textContent).toContain('内容')
    expect(sup(wrapper).exists()).toBe(true)
  })

  it('value 变化时响应式更新展示', async () => {
    const wrapper = mountBadge({ value: 1 })
    await wrapper.setProps({ value: 120 })
    expect(sup(wrapper).text()).toBe('99+')
    await wrapper.setProps({ hidden: true })
    expect(sup(wrapper).exists()).toBe(false)
  })
})
