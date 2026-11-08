import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Scrollbar } from '@ui-kit-full'

function mountScrollbar(props: Record<string, any> = {}, content: any = h('div', { class: 'box' }, '内容')) {
  return mount(Scrollbar, { props, slots: { default: () => content }, attachTo: document.body })
}

function setScrollSize(
  el: HTMLElement,
  size: { clientHeight: number; scrollHeight: number; clientWidth: number; scrollWidth: number }
) {
  for (const [key, value] of Object.entries(size)) {
    Object.defineProperty(el, key, { value, configurable: true })
  }
}

function stubRect(el: Element, rect: { height?: number; width?: number; top?: number; left?: number }) {
  const width = rect.width ?? 0
  const height = rect.height ?? 0
  const left = rect.left ?? 0
  const top = rect.top ?? 0
  el.getBoundingClientRect = () =>
    ({
      width,
      height,
      top,
      left,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({})
    }) as DOMRect
}

type ScrollbarApi = {
  update: () => void
  handleScroll: () => void
  setScrollTop: (value: number) => void
  setScrollLeft: (value: number) => void
}

function apiOf(wrapper: ReturnType<typeof mountScrollbar>) {
  return wrapper.vm as unknown as ScrollbarApi
}

function wrapOf(wrapper: ReturnType<typeof mountScrollbar>) {
  return wrapper.find('.ui-scrollbar__wrap').element as HTMLElement
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Scrollbar', () => {
  it('渲染根/wrap/view 三层结构与基类名', () => {
    const wrapper = mountScrollbar()
    expect(wrapper.classes()).toContain('ui-scrollbar')
    expect(wrapper.find('.ui-scrollbar__wrap').exists()).toBe(true)
    expect(wrapper.find('.ui-scrollbar__view .box').exists()).toBe(true)
  })

  it('默认 view 标签为 div，tag 属性可切换', () => {
    expect(mountScrollbar().find('.ui-scrollbar__view').element.tagName).toBe('DIV')
    expect(mountScrollbar({ tag: 'ul' }).find('.ui-scrollbar__view').element.tagName).toBe('UL')
  })

  it('height/maxHeight 写入 wrap 内联样式', () => {
    const wrap = mountScrollbar({ height: 100, maxHeight: 200 }).find('.ui-scrollbar__wrap')
    expect(wrap.attributes('style') ?? '').toContain('height: 100px')
    expect(wrap.attributes('style') ?? '').toContain('max-height: 200px')
  })

  it('distance 落成根节点 CSS 变量并偏移滑块轨道', () => {
    const wrapper = mountScrollbar({ distance: 8 })
    expect(wrapper.attributes('style') ?? '').toContain('--ui-scrollbar-distance: 8px')
    expect(wrapper.find('.ui-scrollbar__bar.is-vertical').attributes('style') ?? '').toContain('right: 10px')
  })

  it('非原生模式渲染横竖两条滑块轨道', () => {
    const wrapper = mountScrollbar()
    expect(wrapper.find('.ui-scrollbar__bar.is-vertical').exists()).toBe(true)
    expect(wrapper.find('.ui-scrollbar__bar.is-horizontal').exists()).toBe(true)
  })

  it('native 模式挂原生类名且移除自定义轨道', () => {
    const wrapper = mountScrollbar({ native: true })
    expect(wrapper.classes()).toContain('ui-scrollbar--native')
    expect(wrapper.findAll('.ui-scrollbar__bar')).toHaveLength(0)
  })

  it('always 给轨道追加 is-always 类名', () => {
    expect(mountScrollbar({ always: true }).find('.ui-scrollbar__bar').classes()).toContain('is-always')
    expect(mountScrollbar().find('.ui-scrollbar__bar').classes()).not.toContain('is-always')
  })

  it('wrapClass / viewClass 追加到对应层', () => {
    const wrapper = mountScrollbar({ wrapClass: 'my-wrap', viewClass: 'my-view' })
    expect(wrapper.find('.ui-scrollbar__wrap').classes()).toContain('my-wrap')
    expect(wrapper.find('.ui-scrollbar__view').classes()).toContain('my-view')
  })

  it('id/role/tabindex/aria-* 落到根节点', () => {
    const wrapper = mountScrollbar({
      id: 'sb1',
      role: 'region',
      tabindex: 0,
      ariaLabel: '滚动区',
      ariaOrientation: 'vertical'
    })
    expect(wrapper.attributes('id')).toBe('sb1')
    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.attributes('aria-label')).toBe('滚动区')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
  })

  it('wrapStyle/viewStyle 分别落到 wrap 与 view', () => {
    const wrapper = mountScrollbar({ wrapStyle: 'padding: 3px', viewStyle: { margin: '2px' } })
    expect(wrapper.find('.ui-scrollbar__wrap').attributes('style') ?? '').toContain('padding: 3px')
    expect(wrapper.find('.ui-scrollbar__view').attributes('style') ?? '').toContain('margin: 2px')
  })

  it('对外暴露 update/handleScroll/setScrollTop/setScrollLeft 方法', () => {
    const api = mountScrollbar().vm as unknown as Record<string, any>
    expect(typeof api.update).toBe('function')
    expect(typeof api.handleScroll).toBe('function')
    expect(typeof api.setScrollTop).toBe('function')
    expect(typeof api.setScrollLeft).toBe('function')
  })

  it('滚动时抛出 scroll 事件并回传 scrollTop/scrollLeft', async () => {
    const wrapper = mountScrollbar()
    await wrapper.find('.ui-scrollbar__wrap').trigger('scroll')
    const payload = (wrapper.emitted('scroll')?.[0]?.[0] ?? {}) as Record<string, unknown>
    expect(payload).toEqual(expect.objectContaining({ scrollTop: expect.any(Number), scrollLeft: expect.any(Number) }))
  })

  it('无内容时仍渲染空 view 容器不报错', () => {
    const wrapper = mountScrollbar({}, null)
    expect(wrapper.find('.ui-scrollbar__view').exists()).toBe(true)
  })

  it('class 透传与基类名共存', () => {
    expect(mountScrollbar({ class: 'extra' }).classes()).toEqual(expect.arrayContaining(['ui-scrollbar', 'extra']))
  })

  it('字符串 style 与内部 CSS 变量合并落根节点', () => {
    const wrapper = mount({ render: () => h(Scrollbar, { style: 'width: 220px' }, () => h('div', 'x')) })
    expect(wrapper.attributes('style') ?? '').toContain('width: 220px')
    expect(wrapper.attributes('style') ?? '').toContain('--ui-scrollbar-distance')
  })

  it('minSize 缺省 20 且自定义后仍渲染滑块', () => {
    const wrapper = mountScrollbar({ minSize: 40 })
    expect(wrapper.find('.ui-scrollbar__thumb').exists()).toBe(true)
  })

  it('update 按视口与内容尺寸换算滑块比例并取消隐藏态', async () => {
    const wrapper = mountScrollbar()
    const wrap = wrapOf(wrapper)
    setScrollSize(wrap, { clientHeight: 100, scrollHeight: 400, clientWidth: 200, scrollWidth: 400 })
    apiOf(wrapper).update()
    await nextTick()
    const vertical = wrapper.find('.ui-scrollbar__bar.is-vertical')
    expect(vertical.classes()).not.toContain('is-hidden')
    expect(vertical.find('.ui-scrollbar__thumb').attributes('style')).toContain('height: 25%')
    const horizontal = wrapper.find('.ui-scrollbar__bar.is-horizontal')
    expect(horizontal.find('.ui-scrollbar__thumb').attributes('style')).toContain('width: 50%')
  })

  it('setScrollTop / setScrollLeft 写入滚动位置并同步滑块位移', async () => {
    const wrapper = mountScrollbar()
    const wrap = wrapOf(wrapper)
    setScrollSize(wrap, { clientHeight: 100, scrollHeight: 400, clientWidth: 200, scrollWidth: 400 })
    const api = apiOf(wrapper)
    api.setScrollTop(120)
    api.setScrollLeft(60)
    await nextTick()
    expect(wrap.scrollTop).toBe(120)
    expect(wrap.scrollLeft).toBe(60)
    expect(wrapper.find('.ui-scrollbar__bar.is-vertical .ui-scrollbar__thumb').attributes('style')).toContain(
      'translateY(120%)'
    )
    expect(wrapper.find('.ui-scrollbar__bar.is-horizontal .ui-scrollbar__thumb').attributes('style')).toContain(
      'translateX(30%)'
    )
  })

  it('点击竖向轨道跳转，拖动时按位移换算并夹在滚动范围内', async () => {
    const wrapper = mountScrollbar()
    const wrap = wrapOf(wrapper)
    setScrollSize(wrap, { clientHeight: 100, scrollHeight: 400, clientWidth: 200, scrollWidth: 400 })
    const api = apiOf(wrapper)
    api.update()
    const bar = wrapper.find('.ui-scrollbar__bar.is-vertical')
    stubRect(bar.element, { height: 100, top: 0 })
    await bar.trigger('pointerdown', { button: 0, clientY: 50 })
    expect(wrap.scrollTop).toBe(150)
    expect(bar.classes()).toContain('is-dragging')
    window.dispatchEvent(new MouseEvent('pointermove', { clientY: 80 }))
    expect(wrap.scrollTop).toBe(270)
    window.dispatchEvent(new MouseEvent('pointermove', { clientY: 1000 }))
    expect(wrap.scrollTop).toBe(300)
    window.dispatchEvent(new MouseEvent('pointerup'))
    await nextTick()
    expect(wrapper.find('.ui-scrollbar__bar.is-vertical').classes()).not.toContain('is-dragging')
  })

  it('横向轨道支持点击与拖动，pointercancel 同样结束拖动', async () => {
    const wrapper = mountScrollbar()
    const wrap = wrapOf(wrapper)
    setScrollSize(wrap, { clientHeight: 100, scrollHeight: 400, clientWidth: 200, scrollWidth: 400 })
    apiOf(wrapper).update()
    const bar = wrapper.find('.ui-scrollbar__bar.is-horizontal')
    stubRect(bar.element, { width: 200, left: 0 })
    await bar.trigger('pointerdown', { button: 0, clientX: 100 })
    expect(wrap.scrollLeft).toBe(100)
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 150 }))
    expect(wrap.scrollLeft).toBe(200)
    window.dispatchEvent(new MouseEvent('pointercancel'))
    await nextTick()
    expect(wrapper.find('.ui-scrollbar__bar.is-horizontal').classes()).not.toContain('is-dragging')
  })

  it('非主键按下与在滑块上按下都不触发轨道跳转', async () => {
    const wrapper = mountScrollbar()
    const wrap = wrapOf(wrapper)
    setScrollSize(wrap, { clientHeight: 100, scrollHeight: 400, clientWidth: 200, scrollWidth: 400 })
    apiOf(wrapper).update()
    const bar = wrapper.find('.ui-scrollbar__bar.is-vertical')
    stubRect(bar.element, { height: 100, top: 0 })
    await bar.trigger('pointerdown', { button: 2, clientY: 50 })
    expect(wrap.scrollTop).toBe(0)
    await bar.find('.ui-scrollbar__thumb').trigger('pointerdown', { button: 0, clientY: 20 })
    expect(wrap.scrollTop).toBe(0)
    window.dispatchEvent(new MouseEvent('pointerup'))
  })

  it('卸载后命令式方法安全空操作', () => {
    const wrapper = mountScrollbar()
    const api = apiOf(wrapper)
    wrapper.unmount()
    expect(() => {
      api.update()
      api.handleScroll()
      api.setScrollTop(10)
      api.setScrollLeft(10)
    }).not.toThrow()
  })

  it('noresize 跳过尺寸观察器仍正常渲染', () => {
    const wrapper = mountScrollbar({ noresize: true })
    expect(wrapper.find('.ui-scrollbar__bar').exists()).toBe(true)
  })
})
