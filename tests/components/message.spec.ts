import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Message } from '@ui-kit-full'

// Message 无 modelValue：可见性生命周期由宿主管理，组件自身只有“关闭后内容移除”
// 一种内部状态；placement 映射为行内样式落点，可安全断言样式字符串而非坐标
const mounted: Array<ReturnType<typeof mount>> = []

function mountMessage(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  const wrapper = mount(Message, { props, slots, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function styleOf(wrapper: ReturnType<typeof mount>) {
  return wrapper.element.getAttribute('style') ?? ''
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.unmount()
  }
  document.body.innerHTML = ''
})

describe('Message', () => {
  it('默认 info 类型：类型类与常驻 popper 类、alert 语义', async () => {
    const wrapper = mountMessage({ message: '操作成功' })
    await nextTick()
    expect(wrapper.classes()).toContain('ui-message')
    expect(wrapper.classes()).toContain('ui-message--info')
    expect(wrapper.classes()).toContain('ui-message--popper')
    expect(wrapper.element.querySelector('.ui-message__panel')?.getAttribute('role')).toBe('alert')
    expect(wrapper.element.querySelector('.ui-message__content')?.textContent).toBe('操作成功')
    expect(wrapper.element.querySelector('.ui-message__icon svg')).not.toBeNull()
  })

  it('type 切换生成类型类与对应图标', async () => {
    const wrapper = mountMessage({ type: 'success', message: 'ok' })
    await nextTick()
    expect(wrapper.classes()).toContain('ui-message--success')
    wrapper.unmount()
    document.body.innerHTML = ''
    const danger = mountMessage({ type: 'error', message: 'bad' })
    await nextTick()
    expect(danger.classes()).toContain('ui-message--error')
    expect(danger.element.querySelector('.ui-message__close')).toBeNull()
  })

  it('无 placement 时样式只有 z-index', async () => {
    const wrapper = mountMessage()
    await nextTick()
    expect(styleOf(wrapper)).toMatch(/z-index:\s*2\d{3}/)
    expect(styleOf(wrapper)).not.toContain('position')
  })

  it('显式 zIndex 直接落盘，缺省走自增层级', async () => {
    const explicit = mountMessage({ zIndex: 4321 })
    await nextTick()
    expect(styleOf(explicit)).toContain('z-index: 4321')
    const auto = mountMessage()
    await nextTick()
    expect(styleOf(auto)).toMatch(/z-index:\s*2\d{3}/)
  })

  it('placement=top 默认 offset 16：固定定位与水平居中样式', async () => {
    const wrapper = mountMessage({ placement: 'top' })
    await nextTick()
    const style = styleOf(wrapper)
    expect(style).toContain('position: fixed')
    expect(style).toContain('top: 16px')
    expect(style).toContain('left: 50%')
    expect(style).toContain('transform: translateX(-50%)')
    expect(style).toContain('max-width: calc(100vw - 32px)')
  })

  it('placement 变体与 offset 覆写落点', async () => {
    const start = mountMessage({ placement: 'left-start', offset: 24 })
    await nextTick()
    expect(styleOf(start)).toContain('left: 24px')
    expect(styleOf(start)).toContain('top: 24px')
    const end = mountMessage({ placement: 'bottom-end' })
    await nextTick()
    expect(styleOf(end)).toContain('bottom: 16px')
    expect(styleOf(end)).toContain('right: 16px')
  })

  it('无法识别的 placement 只保留 z-index', async () => {
    const wrapper = mountMessage({ placement: 'weird' })
    await nextTick()
    expect(styleOf(wrapper)).not.toContain('position')
    expect(styleOf(wrapper)).toContain('z-index')
  })

  it('id 显式落属性（声明过的 prop 不再走 attrs）', async () => {
    const wrapper = mountMessage({ id: 'msg-id' })
    await nextTick()
    expect(wrapper.element.getAttribute('id')).toBe('msg-id')
  })

  it('center 与 customClass、plain 特性类落地', async () => {
    const wrapper = mountMessage({ center: true, customClass: 'mine', plain: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-center')
    expect(wrapper.classes()).toContain('mine')
    expect(wrapper.classes()).toContain('ui-message--plain')
  })

  it('dangerouslyUseHTMLString 渲染 HTML，否则原样文本', async () => {
    const html = mountMessage({ message: '<b>加粗</b>', dangerouslyUseHTMLString: true })
    await nextTick()
    expect(html.element.querySelector('.ui-message__content')?.innerHTML).toContain('<b>')
    const plain = mountMessage({ message: '<b>转义</b>' })
    await nextTick()
    expect(plain.element.querySelector('.ui-message__content')?.innerHTML).not.toContain('<b>')
  })

  it('message 传 VNode 直接渲染', async () => {
    const wrapper = mountMessage({ message: h('em', { class: 'vn' }, '富文本') })
    await nextTick()
    expect(wrapper.element.querySelector('.ui-message__content .vn')?.textContent).toBe('富文本')
  })

  it('icon 覆盖类型默认图标', async () => {
    const wrapper = mountMessage({ type: 'success', icon: () => h('i', { class: 'my-icon' }) })
    await nextTick()
    expect(wrapper.element.querySelector('.ui-message__icon .my-icon')).not.toBeNull()
  })

  it('showClose 渲染按钮，点击后抛 close 并移除面板', async () => {
    const wrapper = mountMessage({ showClose: true, message: '可关' })
    await nextTick()
    expect(wrapper.classes()).toContain('is-closable')
    const btn = wrapper.element.querySelector('.ui-message__close') as HTMLElement
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.element.querySelector('.ui-message__panel')).toBeNull()
    expect(wrapper.element.parentElement).not.toBeNull()
  })

  it('卸载后无残留节点', async () => {
    const wrapper = mountMessage({ message: 'x' })
    await nextTick()
    wrapper.unmount()
    expect(document.querySelector('.ui-message')).toBeNull()
  })
})
