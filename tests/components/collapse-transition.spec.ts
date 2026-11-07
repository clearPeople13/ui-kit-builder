import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { CollapseTransition } from '@ui-kit-full'

function stub(wrapper: VueWrapper) {
  return wrapper.find('transition-stub')
}

describe('CollapseTransition 折叠动画', () => {
  it('渲染为过渡容器并使用缺省名称', () => {
    const wrapper = mount(CollapseTransition, { slots: { default: () => h('div', { class: 'ct-body' }, '内容') } })
    expect(wrapper.element.tagName).toBe('TRANSITION-STUB')
    expect(stub(wrapper).exists()).toBe(true)
    expect(stub(wrapper).attributes('name')).toBe('ui-collapse-transition')
  })

  it('name 属性覆盖过渡名称', () => {
    const wrapper = mount(CollapseTransition, { props: { name: 'custom' }, slots: { default: () => h('div', 'x') } })
    expect(stub(wrapper).attributes('name')).toBe('custom')
  })

  it('默认插槽内容被包裹渲染', () => {
    const wrapper = mount(CollapseTransition, { slots: { default: () => h('p', { class: 'inner' }, '正文') } })
    expect(wrapper.find('p.inner').text()).toBe('正文')
  })

  it('多个子节点全部渲染', () => {
    const wrapper = mount(CollapseTransition, { slots: { default: () => [h('span', '甲'), h('span', '乙')] } })
    expect(wrapper.findAll('span')).toHaveLength(2)
    expect(wrapper.text()).toBe('甲乙')
  })

  it('空插槽时过渡容器仍在但无内容', () => {
    const wrapper = mount(CollapseTransition, { slots: { default: () => null } })
    expect(stub(wrapper).exists()).toBe(true)
    expect(wrapper.text()).toBe('')
  })

  it('过渡容器不带 appear 且默认持久化关闭', () => {
    const wrapper = mount(CollapseTransition, { slots: { default: () => h('div', 'x') } })
    expect(stub(wrapper).attributes('appear')).toBe('false')
    expect(stub(wrapper).attributes('persisted')).toBe('false')
  })

  it('name 变化时响应式更新过渡名称', async () => {
    const wrapper = mount(CollapseTransition, { props: { name: 'a' }, slots: { default: () => h('div', 'x') } })
    expect(stub(wrapper).attributes('name')).toBe('a')
    await wrapper.setProps({ name: 'b' })
    expect(stub(wrapper).attributes('name')).toBe('b')
  })

  it('内容元素保留自身类名', () => {
    const wrapper = mount(CollapseTransition, {
      slots: { default: () => h('div', { class: 'keep-me' }, 'x') }
    })
    expect(wrapper.find('.keep-me').exists()).toBe(true)
  })

  it('受控显隐：内容可见时可查询', async () => {
    const wrapper = await toggleHost(true)
    expect(wrapper.find('.ct-body').exists()).toBe(true)
  })

  it('受控显隐：收起后内容移除', async () => {
    const wrapper = await toggleHost(true)
    expect(wrapper.find('.ct-body').exists()).toBe(true)
    await wrapper.setProps({ show: false })
    await nextTick()
    expect(wrapper.find('.ct-body').exists()).toBe(false)
    await wrapper.setProps({ show: true })
    await nextTick()
    expect(wrapper.find('.ct-body').exists()).toBe(true)
  })

  it('无插槽参数时使用缺省过渡名', () => {
    const wrapper = mount(CollapseTransition)
    expect(stub(wrapper).attributes('name')).toBe('ui-collapse-transition')
  })

  it('嵌套组件作为内容也能渲染', () => {
    const Child = defineComponent({ setup: () => () => h('b', '粗体') })
    const wrapper = mount(CollapseTransition, { slots: { default: () => h(Child) } })
    expect(wrapper.find('b').text()).toBe('粗体')
  })

  it('不额外产出普通包装元素', () => {
    const wrapper = mount(CollapseTransition, { slots: { default: () => h('div', { class: 'only' }, 'x') } })
    expect(wrapper.element.tagName).toBe('TRANSITION-STUB')
    expect(wrapper.findAll('.only')).toHaveLength(1)
  })
})

// 用一个宿主组件驱动 CollapseTransition 内部内容的显示/隐藏
function toggleHost(show: boolean) {
  const Host = defineComponent({
    props: { show: { type: Boolean, default: true } },
    setup(props) {
      return () =>
        h(CollapseTransition, null, {
          default: () => (props.show ? h('div', { class: 'ct-body' }, '内容') : null)
        })
    }
  })
  return mount(Host, { props: { show } })
}
