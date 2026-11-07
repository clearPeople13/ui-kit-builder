import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Popper, PopperArrow, PopperContent, PopperTrigger } from '@ui-kit-full'

/**
 * Popper 系列是浮层的定位基座：Popper / PopperArrow 只负责定位与装饰属性，
 * PopperContent / PopperTrigger 管可见态、类名与内容。全部同步渲染，无需 teleport 判定。
 */
const mountPopper = (props: Record<string, any> = {}) => mount(Popper, { props })

describe('Popper 弹出层', () => {
  it('默认渲染 role=tooltip 的 absolute 容器并开启 GPU 加速', () => {
    const wrapper = mountPopper()
    expect(wrapper.classes()).toEqual(['ui-popper'])
    expect(wrapper.attributes('role')).toBe('tooltip')
    expect(wrapper.attributes('style')).toContain('position: absolute')
    expect(wrapper.attributes('style')).toContain('will-change: transform')
    expect(wrapper.attributes('style')).toContain('transform: translateZ(0)')
  })

  it('strategy=fixed 切换定位基准，role 可覆盖且空值回退 tooltip', () => {
    const fixed = mountPopper({ strategy: 'fixed' })
    expect(fixed.attributes('style')).toContain('position: fixed')
    const dialog = mountPopper({ role: 'dialog' })
    expect(dialog.attributes('role')).toBe('dialog')
    const empty = mountPopper({ role: '' })
    expect(empty.attributes('role')).toBe('tooltip')
  })

  it('gpuAcceleration=false 去掉 will-change 与 transform', () => {
    const wrapper = mountPopper({ gpuAcceleration: false })
    expect(wrapper.attributes('style')).toBe('position: absolute;')
    expect(wrapper.attributes('style')).not.toContain('translateZ')
  })

  it('未声明的宿主属性原样透传到根节点', () => {
    const wrapper = mountPopper({ id: 'popper-layer', 'data-layer': 'menu' })
    expect(wrapper.attributes('id')).toBe('popper-layer')
    expect(wrapper.attributes('data-layer')).toBe('menu')
  })

  it('PopperArrow 输出 aria-hidden 与箭头偏移变量，0 值保留 0px', () => {
    const wrapper = mount(PopperArrow)
    expect(wrapper.classes()).toEqual(['ui-popper-arrow'])
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('style')).toBe('--ui-popper-arrow-offset: 5px;')
    const custom = mount(PopperArrow, { props: { arrowOffset: 3 } })
    expect(custom.attributes('style')).toBe('--ui-popper-arrow-offset: 3px;')
    const zero = mount(PopperArrow, { props: { arrowOffset: 0 } })
    expect(zero.attributes('style')).toBe('--ui-popper-arrow-offset: 0px;')
  })

  it('PopperContent 默认 dark 主题、可见且只有结构类名', () => {
    const wrapper = mount(PopperContent)
    expect(wrapper.classes()).toEqual(['ui-popper-content', 'is-dark'])
    expect(wrapper.attributes('role')).toBe('tooltip')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
  })

  it('visible=false 标记 is-hidden 与 aria-hidden，effect / virtualTriggering 落类名', () => {
    const hidden = mount(PopperContent, { props: { visible: false } })
    expect(hidden.classes()).toContain('is-hidden')
    expect(hidden.attributes('aria-hidden')).toBe('true')
    const light = mount(PopperContent, { props: { effect: 'light' } })
    expect(light.classes()).toContain('is-light')
    const virtual = mount(PopperContent, { props: { virtualTriggering: true } })
    expect(virtual.classes()).toContain('is-virtual')
  })

  it('strategy / style / zIndex / arrowOffset 按顺序合并进内联样式', () => {
    const wrapper = mount(PopperContent, {
      props: { strategy: 'fixed', style: { color: 'red' }, zIndex: 7, arrowOffset: 3 }
    })
    const style = wrapper.attributes('style')
    expect(style).toContain('position: fixed')
    expect(style).toContain('color: red')
    expect(style).toContain('z-index: 7')
    expect(style).toContain('--ui-popper-arrow-offset: 3px')
    expect(style).toContain('transform: translateZ(0)')
    const strings = mount(PopperContent, { props: { style: 'width: 10px' } })
    expect(strings.attributes('style')).toContain('width: 10px')
  })

  it('id 与 ariaLabel 透传，role 固定为 tooltip', () => {
    const wrapper = mount(PopperContent, { props: { id: 'tip-1', ariaLabel: '提示' } })
    expect(wrapper.attributes('id')).toBe('tip-1')
    expect(wrapper.attributes('aria-label')).toBe('提示')
    expect(wrapper.attributes('role')).toBe('tooltip')
  })

  it('默认插槽内容渲染在面板内', () => {
    const wrapper = mount(PopperContent, { slots: { default: () => '面板内容' } })
    expect(wrapper.text()).toBe('面板内容')
  })

  it('className 合并到根节点类名', () => {
    const wrapper = mount(PopperContent, { props: { className: 'named' } })
    expect(wrapper.classes()).toContain('named')
  })

  it('content / label / title 任一作为默认内容渲染', () => {
    expect(mount(PopperContent, { props: { content: '浮层文本' } }).text()).toBe('浮层文本')
    expect(mount(PopperContent, { props: { label: '标签内容' } }).text()).toBe('标签内容')
  })

  it('PopperTrigger 默认是未展开的 button 语义容器', () => {
    const wrapper = mount(PopperTrigger)
    expect(wrapper.classes()).toEqual(['ui-popper-trigger'])
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('aria-expanded')).toBe('false')
  })

  it('open / virtualTriggering 落展开态与虚拟触发属性', () => {
    const open = mount(PopperTrigger, { props: { open: true, id: 'trigger-1' } })
    expect(open.classes()).toContain('is-open')
    expect(open.attributes('aria-expanded')).toBe('true')
    expect(open.attributes('id')).toBe('trigger-1')

    const virtual = mount(PopperTrigger, { props: { virtualTriggering: true } })
    expect(virtual.classes()).toContain('is-virtual')
    expect(virtual.attributes('aria-hidden')).toBe('true')
  })

  it('onClick 回调收到原生事件，默认插槽作为触发区内容', async () => {
    const clicks: Event[] = []
    const wrapper = mount(PopperTrigger, {
      props: { onClick: (event: Event) => clicks.push(event) },
      slots: { default: () => '触发区' }
    })
    expect(wrapper.text()).toBe('触发区')
    await wrapper.trigger('click')
    expect(clicks).toHaveLength(1)
    expect(clicks[0]).toBeInstanceOf(Event)
  })
})
