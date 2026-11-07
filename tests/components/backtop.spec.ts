import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Backtop } from '@ui-kit-full'

// happy-dom 没有真实布局：getBoundingClientRect 恒为 0、无法真实滚动，
// 因此本文件只覆盖非几何部分（显隐阈值的手动触发路径 / 类名 / 偏移归一化 / 插槽 / 按钮语义），
// 按钮贴靠容器右下角的 calc 定位与平滑滚动效果归 tests/browser/** 的浏览器层。
function mountBacktop(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Backtop, { props, slots, attachTo: document.body })
}

function classesOf(wrapper: ReturnType<typeof mountBacktop>) {
  return wrapper.classes()
}

let scrollToSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  scrollToSpy = vi.fn()
  ;(window as unknown as Record<string, any>).scrollTo = scrollToSpy
})

afterEach(() => {
  ;(window as unknown as Record<string, any>).scrollY = 0
  document.documentElement.scrollTop = 0
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('Backtop 回到顶部', () => {
  it('缺省隐藏，渲染带无障碍语义的按钮与内置向上箭头', () => {
    const wrapper = mountBacktop()
    expect(classesOf(wrapper)).toEqual(['ui-backtop', 'is-hidden'])
    const button = wrapper.get('.ui-backtop__button')
    expect(button.attributes('role')).toBe('button')
    expect(button.attributes('tabindex')).toBe('0')
    expect(button.attributes('aria-label')).toBe('回到顶部')
    expect(button.find('svg').classes()).toContain('lucide-chevron-up')
  })

  it('window 滚动超过 visibilityHeight 阈值后浮现（手动触发显隐路径）', async () => {
    const wrapper = mountBacktop({ visibilityHeight: 200 })
    expect(wrapper.classes()).toContain('is-hidden')
    ;(window as unknown as Record<string, any>).scrollY = 300
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(wrapper.classes()).toEqual(['ui-backtop', 'is-visible'])
    ;(window as unknown as Record<string, any>).scrollY = 0
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(wrapper.classes()).toContain('is-hidden')
  })

  it('visibilityHeight 为 0 时挂载即可见（阈值的临界取值）', async () => {
    const wrapper = mountBacktop({ visibilityHeight: 0 })
    await nextTick()
    expect(wrapper.classes()).toContain('is-visible')
  })

  it('target 容器的 scrollTop 越过阈值驱动显隐', async () => {
    const box = document.createElement('div')
    box.id = 'bt-scroll-box'
    document.body.appendChild(box)
    const wrapper = mountBacktop({ target: '#bt-scroll-box', visibilityHeight: 100 })
    expect(wrapper.classes()).toContain('is-hidden')
    box.scrollTop = 300
    box.dispatchEvent(new Event('scroll', { bubbles: true }))
    await nextTick()
    expect(wrapper.classes()).toContain('is-visible')
    box.scrollTop = 0
    box.dispatchEvent(new Event('scroll', { bubbles: true }))
    await nextTick()
    expect(wrapper.classes()).toContain('is-hidden')
  })

  it('target 选择器不存在时按 window 处理，不报错', async () => {
    const wrapper = mountBacktop({ target: '#bt-ghost', visibilityHeight: 0 })
    await nextTick()
    expect(wrapper.classes()).toEqual(['ui-backtop', 'is-visible'])
  })

  it('right / bottom 数字补 px、字符串原样、0 落 0px', () => {
    expect(mountBacktop({ right: 80, bottom: 60 }).attributes('style')).toContain('right: 80px')
    expect(mountBacktop({ right: 80, bottom: 60 }).attributes('style')).toContain('bottom: 60px')
    expect(mountBacktop({ right: '10rem', bottom: '2em' }).attributes('style')).toContain('right: 10rem')
    expect(mountBacktop({ right: 0, bottom: 0 }).attributes('style')).toContain('right: 0px')
  })

  it('默认插槽替换内置箭头图标', () => {
    const wrapper = mountBacktop({ visibilityHeight: 0 }, { default: () => '回到顶部文字' })
    const button = wrapper.get('.ui-backtop__button')
    expect(button.text()).toBe('回到顶部文字')
    expect(button.find('svg').exists()).toBe(false)
  })

  it('点击按钮请求滚回顶部（scrollTo 载荷 top:0 平滑）', async () => {
    const wrapper = mountBacktop({ visibilityHeight: 0 })
    await wrapper.get('.ui-backtop__button').trigger('click')
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    expect(scrollToSpy.mock.calls[0][0]).toEqual({ top: 0, behavior: 'smooth' })
  })

  function pressKey(element: Element, key: string) {
    const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    element.dispatchEvent(event)
    return event
  }

  it('Enter 与空格触发滚回并阻止默认，其它键不响应', async () => {
    const wrapper = mountBacktop({ visibilityHeight: 0 })
    await nextTick()
    const button = wrapper.get('.ui-backtop__button').element
    expect(pressKey(button, 'Enter').defaultPrevented).toBe(true)
    expect(pressKey(button, ' ').defaultPrevented).toBe(true)
    expect(scrollToSpy).toHaveBeenCalledTimes(2)
    expect(pressKey(button, 'a').defaultPrevented).toBe(false)
    expect(scrollToSpy).toHaveBeenCalledTimes(2)
  })

  it('spec.mjs 未声明任何可选特性：产物根节点只带核心与显隐类名', () => {
    const wrapper = mountBacktop()
    expect(wrapper.classes().filter((name) => name.startsWith('ui-backtop--'))).toEqual([])
  })
})
