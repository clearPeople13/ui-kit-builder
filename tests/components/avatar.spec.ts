import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Avatar, AvatarGroup } from '@ui-kit-full'

// 统一构造 Avatar，收敛公共 props
function mountAvatar(props: Record<string, unknown> = {}, slots?: Record<string, string>) {
  return mount(Avatar, { props, slots })
}

// AvatarGroup 依赖 teleport 到 body 的浮层，统一挂到 document.body
function mountGroup(props: Record<string, unknown> = {}, count = 4) {
  const children = Array.from({ length: count }, (_item, index) => h(Avatar, { src: `${index}.png` }))
  return mount(AvatarGroup, { props, slots: { default: () => children }, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Avatar 头像', () => {
  it('缺省渲染空文本容器', () => {
    const wrapper = mountAvatar()
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toEqual(['ui-avatar'])
    expect(wrapper.find('.ui-avatar__text').exists()).toBe(true)
  })

  it('src 渲染图片并透传 alt / srcset / 缺省 object-fit', () => {
    const wrapper = mountAvatar({ src: 'http://a/b.png', alt: '头像', srcSet: '2x 2x' })
    const img = wrapper.find('img.ui-avatar__image')
    expect(img.attributes('src')).toBe('http://a/b.png')
    expect(img.attributes('alt')).toBe('头像')
    expect(img.attributes('srcset')).toBe('2x 2x')
    expect(img.attributes('style')).toContain('object-fit: cover')
    expect(wrapper.find('.ui-avatar__text').exists()).toBe(false)
  })

  it('fit 覆盖图片填充方式', () => {
    expect(mountAvatar({ src: 'b.png', fit: 'contain' }).find('img').attributes('style')).toContain(
      'object-fit: contain'
    )
  })

  it('数字 size 换算为宽高与字号内联样式，缺省时不写尺寸', () => {
    const style = mountAvatar({ size: 40 }).attributes('style')
    expect(style).toContain('width: 40px')
    expect(style).toContain('height: 40px')
    expect(style).toContain('font-size: calc(40px / 2.6)')
    expect(mountAvatar().attributes('style')).toBeUndefined()
  })

  it('字符串 size 原样作为尺寸', () => {
    const style = mountAvatar({ size: '2rem' }).attributes('style')
    expect(style).toContain('width: 2rem')
    expect(style).toContain('font-size: calc(2rem / 2.6)')
  })

  it('shape 落到 is-circle / is-square 类名', () => {
    expect(mountAvatar({ shape: 'square' }).classes()).toContain('is-square')
    expect(mountAvatar({ shape: 'circle' }).classes()).toContain('is-circle')
    expect(mountAvatar().classes()).not.toContain('is-square')
  })

  it('icon 渲染图标容器并追加 icons 类名', () => {
    const wrapper = mountAvatar({ icon: 'Plus' })
    expect(wrapper.classes()).toContain('ui-avatar--icons')
    expect(wrapper.find('.ui-avatar__text .ui-icon.ui-avatar__icon').exists()).toBe(true)
  })

  it('默认插槽内容渲染在文本容器内', () => {
    const wrapper = mountAvatar({}, { default: '<b class="t">张三</b>' })
    expect(wrapper.find('.ui-avatar__text .t').text()).toBe('张三')
  })

  it('src 变化时响应式重渲染图片', async () => {
    const wrapper = mountAvatar()
    await wrapper.setProps({ src: 'c.png' })
    expect(wrapper.find('img.ui-avatar__image').attributes('src')).toBe('c.png')
  })
})

describe('AvatarGroup 头像组', () => {
  it('未开启折叠时渲染全部子头像', () => {
    const wrapper = mountGroup({}, 3)
    expect(wrapper.classes()).toContain('ui-avatar-group')
    expect(wrapper.findAll('.ui-avatar-group__inner > .ui-avatar')).toHaveLength(3)
    expect(wrapper.find('.ui-avatar--collapse').exists()).toBe(false)
  })

  it('子头像数量不超过 maxCollapseAvatars 时不折叠', () => {
    const wrapper = mountGroup({ collapseAvatars: true, maxCollapseAvatars: 3 }, 3)
    expect(wrapper.find('.ui-avatar--collapse').exists()).toBe(false)
    expect(wrapper.findAll('.ui-avatar-group__inner > .ui-avatar')).toHaveLength(3)
  })

  it('折叠时保留前 N 个并显示剩余数量', () => {
    const wrapper = mountGroup({ collapseAvatars: true, maxCollapseAvatars: 2 }, 4)
    expect(wrapper.findAll('.ui-avatar-group__inner > .ui-avatar')).toHaveLength(3)
    const collapse = wrapper.find('.ui-avatar--collapse')
    expect(collapse.text()).toBe('+2')
    expect(collapse.classes()).toContain('ui-avatar')
  })

  it('悬停折叠项展开 teleport 浮层并列出剩余头像', async () => {
    const wrapper = mountGroup({ collapseAvatars: true, maxCollapseAvatars: 1 })
    await wrapper.find('.ui-avatar--collapse').trigger('mouseenter')
    const panel = document.querySelector('.ui-avatar-group__dropdown')
    expect(panel).not.toBeNull()
    expect(panel?.className).toContain('ui-floating-panel')
    expect(panel?.querySelectorAll('.ui-avatar-group__list .ui-avatar')).toHaveLength(3)
    // 箭头默认开启
    expect(panel?.querySelector('.ui-floating-arrow')).not.toBeNull()
  })

  it('effect=dark 与 showArrow=false 反映到浮层', async () => {
    const wrapper = mountGroup({ collapseAvatars: true, maxCollapseAvatars: 1, effect: 'dark', showArrow: false })
    await wrapper.find('.ui-avatar--collapse').trigger('mouseenter')
    const panel = document.querySelector('.ui-avatar-group__dropdown')
    expect(panel?.className).toContain('is-dark')
    expect(panel?.querySelector('.ui-floating-arrow')).toBeNull()
  })

  it('浮层开启后移出会在延时后收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountGroup({ collapseAvatars: true, maxCollapseAvatars: 1 })
    const collapse = wrapper.find('.ui-avatar--collapse')
    await collapse.trigger('mouseenter')
    expect(document.querySelector('.ui-avatar-group__dropdown')).not.toBeNull()
    await collapse.trigger('mouseleave')
    vi.advanceTimersByTime(150)
    await nextTick()
    expect(document.querySelector('.ui-avatar-group__dropdown')).toBeNull()
    vi.useRealTimers()
  })

  it('关闭 tooltip 后点击折叠项切换浮层，悬停不展开', async () => {
    const wrapper = mountGroup({
      collapseAvatars: true,
      maxCollapseAvatars: 1,
      collapseAvatarsTooltip: false,
      teleported: false
    })
    const collapse = wrapper.find('.ui-avatar--collapse')
    await collapse.trigger('mouseenter')
    expect(document.querySelector('.ui-avatar-group__dropdown')).toBeNull()
    await collapse.trigger('click')
    expect(wrapper.find('.ui-avatar-group__dropdown').exists()).toBe(true)
    await collapse.trigger('click')
    expect(wrapper.find('.ui-avatar-group__dropdown').exists()).toBe(false)
  })

  it('组的 shape / size 类名落在根节点，size=default 时不产生尺寸类名', () => {
    const wrapper = mountGroup({ shape: 'square', size: 'large' })
    expect(wrapper.classes()).toContain('is-square')
    expect(wrapper.classes()).toContain('is-size-large')
    const plain = mountGroup({ size: 'default' })
    expect(plain.classes().filter((c) => c.startsWith('is-size'))).toEqual([])
  })

  it('collapseClass / collapseStyle 作用于折叠项', () => {
    const wrapper = mountGroup({
      collapseAvatars: true,
      maxCollapseAvatars: 1,
      collapseClass: 'cc',
      collapseStyle: 'color: red'
    })
    const collapse = wrapper.find('.ui-avatar--collapse')
    expect(collapse.classes()).toContain('cc')
    expect(collapse.attributes('style')).toContain('color: red')
  })

  it('teleported=false 时浮层内联渲染在组内', async () => {
    const wrapper = mountGroup({ collapseAvatars: true, maxCollapseAvatars: 1, teleported: false })
    await wrapper.find('.ui-avatar--collapse').trigger('mouseenter')
    expect(wrapper.find('.ui-avatar-group__dropdown').exists()).toBe(true)
    expect(document.querySelector('body > .ui-avatar-group__dropdown')).toBeNull()
  })

  it('popperClass 追加到浮层类名', async () => {
    const wrapper = mountGroup({ collapseAvatars: true, maxCollapseAvatars: 1, popperClass: 'mine' })
    await wrapper.find('.ui-avatar--collapse').trigger('mouseenter')
    const panel = document.querySelector('.ui-avatar-group__dropdown')
    expect(panel?.className).toContain('mine')
    expect(panel?.className).toContain('ui-avatar-group__dropdown')
  })
})
