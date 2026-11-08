import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { PageHeader } from '@ui-kit-full'

function mountPageHeader(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(PageHeader, { props, slots })
}

describe('PageHeader 页头', () => {
  it('缺省渲染标题区与默认 arrowLeft 返回按钮', () => {
    const wrapper = mountPageHeader()
    expect(wrapper.classes()).toEqual(['ui-page-header', 'ui-page-header--icons'])
    expect(wrapper.find('.ui-page-header__main').exists()).toBe(true)
    expect(wrapper.find('.ui-page-header__back').exists()).toBe(true)
    expect(wrapper.find('.ui-page-header__back svg').classes()).toContain('lucide-arrow-left')
    expect(wrapper.find('.ui-page-header__heading').exists()).toBe(true)
  })

  it('icon 空串隐藏返回按钮并去掉图标类', () => {
    const wrapper = mountPageHeader({ icon: '' })
    expect(wrapper.find('.ui-page-header__back').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('ui-page-header--icons')
  })

  it('自定义 icon 名替换返回箭头', () => {
    expect(mountPageHeader({ icon: 'chevronLeft' }).find('.ui-page-header__back svg').classes()).toContain(
      'lucide-chevron-left'
    )
  })

  it('点击返回按钮触发 back 事件', async () => {
    const wrapper = mountPageHeader()
    await wrapper.get('.ui-page-header__back').trigger('click')
    expect(wrapper.emitted('back')).toEqual([[]])
  })

  it('返回按钮为带无障碍语义的 button', () => {
    const back = mountPageHeader().get('.ui-page-header__back')
    expect(back.attributes('type')).toBe('button')
    expect(back.attributes('aria-label')).toBe('返回')
  })

  it('title 属性渲染标题节点', () => {
    expect(mountPageHeader({ title: '页面标题' }).find('.ui-page-header__title').text()).toBe('页面标题')
  })

  it('content 属性渲染说明节点', () => {
    expect(mountPageHeader({ content: '说明文字' }).find('.ui-page-header__content').text()).toBe('说明文字')
  })

  it('空 title 与 content 不渲染对应节点', () => {
    const wrapper = mountPageHeader()
    expect(wrapper.find('.ui-page-header__title').exists()).toBe(false)
    expect(wrapper.find('.ui-page-header__content').exists()).toBe(false)
  })

  it('title 插槽优先于 title 属性', () => {
    const wrapper = mountPageHeader({ title: '属性标题' }, { title: () => '插槽标题' })
    expect(wrapper.find('.ui-page-header__title').text()).toBe('插槽标题')
  })

  it('content 插槽优先于 content 属性', () => {
    const wrapper = mountPageHeader({ content: '属性说明' }, { content: () => '插槽说明' })
    expect(wrapper.find('.ui-page-header__content').text()).toBe('插槽说明')
  })

  it('extra 插槽渲染额外操作区', () => {
    const wrapper = mountPageHeader({}, { extra: () => '按钮组' })
    expect(wrapper.find('.ui-page-header__extra').exists()).toBe(true)
    expect(wrapper.find('.ui-page-header__extra').text()).toBe('按钮组')
  })

  it('四个插槽分别渲染到标题、说明、操作区与正文节点', () => {
    const wrapper = mountPageHeader(
      {},
      {
        title: () => h('b', { class: 'my-title' }, '插槽标题'),
        content: () => h('span', { class: 'my-content' }, '插槽说明'),
        extra: () => h('button', { class: 'my-extra' }, '插槽操作'),
        default: () => h('div', { class: 'my-body' }, '插槽正文')
      }
    )
    expect(wrapper.find('.ui-page-header__title .my-title').text()).toBe('插槽标题')
    expect(wrapper.find('.ui-page-header__content .my-content').text()).toBe('插槽说明')
    expect(wrapper.find('.ui-page-header__extra .my-extra').text()).toBe('插槽操作')
    expect(wrapper.find('.ui-page-header__body .my-body').text()).toBe('插槽正文')
  })

  it('未传 title / content 插槽时回退到同名属性', () => {
    const wrapper = mountPageHeader({ title: '属性标题', content: '属性说明' })
    expect(wrapper.find('.ui-page-header__title').text()).toBe('属性标题')
    expect(wrapper.find('.ui-page-header__content').text()).toBe('属性说明')
  })

  it('默认插槽渲染 body，缺省不渲染', () => {
    const withBody = mountPageHeader({}, { default: () => '正文内容' })
    expect(withBody.find('.ui-page-header__body').exists()).toBe(true)
    expect(withBody.find('.ui-page-header__body').text()).toBe('正文内容')
    expect(mountPageHeader().find('.ui-page-header__body').exists()).toBe(false)
  })

  it('超长标题完整保留', () => {
    const long = '标题'.repeat(40)
    expect(mountPageHeader({ title: long }).find('.ui-page-header__title').text()).toBe(long)
  })

  it('各区域可组合出现且顺序稳定', () => {
    const wrapper = mountPageHeader({ title: 'T', content: 'C' }, { extra: () => 'E', default: () => 'B' })
    const classes = wrapper.findAll('.ui-page-header__main > *, .ui-page-header__body').map((node) => node.classes()[0])
    expect(classes).toEqual([
      'ui-page-header__back',
      'ui-page-header__heading',
      'ui-page-header__extra',
      'ui-page-header__body'
    ])
  })
})
