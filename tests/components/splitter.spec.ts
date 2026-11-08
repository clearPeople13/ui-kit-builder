import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Splitter, SplitterPanel } from '@ui-kit-full'
import {
  resolveDragRange,
  resolveKeyboardDelta,
  resolveLimit
} from '../../packages/ui-kit/src/components/splitter/core'

function mountSplitter(
  props: Record<string, any> = {},
  panels: any = [h(SplitterPanel, {}, () => 'A'), h(SplitterPanel, {}, () => 'B')]
) {
  return mount(Splitter, { props, slots: { default: () => panels }, attachTo: document.body })
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.body.innerHTML = ''
})

describe('Splitter / SplitterPanel', () => {
  it('默认水平布局并挂 is-horizontal', () => {
    const wrapper = mountSplitter()
    expect(wrapper.classes()).toContain('ui-splitter')
    expect(wrapper.classes()).toContain('is-horizontal')
  })

  it('layout vertical 切换 is-vertical', () => {
    expect(mountSplitter({ layout: 'vertical' }).classes()).toContain('is-vertical')
  })

  it('两块面板之间插入可聚焦的分隔条', () => {
    const wrapper = mountSplitter()
    const bar = wrapper.find('.ui-splitter__bar')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('role')).toBe('separator')
    expect(bar.attributes('tabindex')).toBe('0')
  })

  it('水平布局的分隔条 aria-orientation 为 vertical，垂直布局为 horizontal', () => {
    expect(mountSplitter().find('.ui-splitter__bar').attributes('aria-orientation')).toBe('vertical')
    expect(mountSplitter({ layout: 'vertical' }).find('.ui-splitter__bar').attributes('aria-orientation')).toBe(
      'horizontal'
    )
  })

  it('两块面板只有一个分隔条，单块面板没有', () => {
    expect(mountSplitter().findAll('.ui-splitter__bar')).toHaveLength(1)
    const single = mountSplitter({}, [h(SplitterPanel, {}, () => '仅一块')])
    expect(single.findAll('.ui-splitter__bar')).toHaveLength(0)
  })

  it('panel size 落成固定 flex-basis', () => {
    const panel = mountSplitter({}, [h(SplitterPanel, { size: 100 }, () => 'A'), h(SplitterPanel, {}, () => 'B')]).find(
      '.ui-splitter-panel'
    )
    expect(panel.attributes('style') ?? '').toContain('flex-basis: 100px')
  })

  it('panel 字符串百分比 size 原样写入 flex', () => {
    const panel = mountSplitter({}, [
      h(SplitterPanel, { size: '30%' }, () => 'A'),
      h(SplitterPanel, {}, () => 'B')
    ]).find('.ui-splitter-panel')
    expect(panel.attributes('style') ?? '').toContain('30%')
  })

  it('无 size 的面板默认等分（flex-grow 1）', () => {
    const panel = mountSplitter().find('.ui-splitter-panel')
    expect(panel.attributes('style') ?? '').toContain('flex-grow: 1')
  })

  it('resizable 默认为真，面板挂 draggable 类名', () => {
    expect(mountSplitter().find('.ui-splitter-panel').classes()).toContain('ui-splitter-panel--draggable')
  })

  it('resizable 为假时移除 draggable 类名', () => {
    const wrapper = mountSplitter({}, [
      h(SplitterPanel, { resizable: false }, () => 'A'),
      h(SplitterPanel, {}, () => 'B')
    ])
    expect(wrapper.findAll('.ui-splitter-panel')[0].classes()).not.toContain('ui-splitter-panel--draggable')
  })

  it('lazy 跟随 prop 挂 ui-splitter--lazy', () => {
    expect(mountSplitter({ lazy: true }).classes()).toContain('ui-splitter--lazy')
    expect(mountSplitter().classes()).not.toContain('ui-splitter--lazy')
  })

  it('无面板时内容区渲染为空', () => {
    const wrapper = mountSplitter({}, [])
    expect(wrapper.findAll('.ui-splitter-panel')).toHaveLength(0)
    expect(wrapper.findAll('.ui-splitter__bar')).toHaveLength(0)
  })

  it('面板内容通过默认插槽渲染', () => {
    const wrapper = mountSplitter({}, [
      h(SplitterPanel, {}, () => h('b', { class: 'in-a' }, '甲')),
      h(SplitterPanel, {}, () => '乙')
    ])
    expect(wrapper.find('.in-a').text()).toBe('甲')
  })

  it('class 透传与基类名共存', () => {
    expect(mountSplitter({ class: 'my-split' }).classes()).toEqual(expect.arrayContaining(['ui-splitter', 'my-split']))
  })

  describe('拖拽与键盘调节', () => {
    function pointer(type: string, init: PointerEventInit = {}) {
      return new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, ...init })
    }

    function rect(size: number): DOMRect {
      return {
        width: size,
        height: size,
        top: 0,
        bottom: size,
        left: 0,
        right: size,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect
    }

    function setContainerSize(wrapper: ReturnType<typeof mountSplitter>, size: number) {
      const container = wrapper.element as HTMLElement
      Object.defineProperty(container, 'clientWidth', { configurable: true, value: size })
      Object.defineProperty(container, 'clientHeight', { configurable: true, value: size })
    }

    function stubPanels(wrapper: ReturnType<typeof mountSplitter>, sizes: number[]) {
      return wrapper.findAll('.ui-splitter-panel').map((node, index) => {
        const spy = vi.spyOn(node.element as HTMLElement, 'getBoundingClientRect')
        spy.mockReturnValue(rect(sizes[index]))
        return spy
      })
    }

    it('limit 解析：空值回退、纯数字直取、百分比按容器换算、非法文本回退', () => {
      expect(resolveLimit(undefined, 400, 12)).toBe(12)
      expect(resolveLimit(null, 400, 12)).toBe(12)
      expect(resolveLimit('', 400, 12)).toBe(12)
      expect(resolveLimit(0, 400, 12)).toBe(0)
      expect(resolveLimit(30, 400, 12)).toBe(30)
      expect(resolveLimit('-10', 400, 12)).toBe(-10)
      expect(resolveLimit('25%', 400, 12)).toBe(100)
      expect(resolveLimit('120px', 400, 12)).toBe(120)
      expect(resolveLimit('abc', 400, 12)).toBe(12)
    })

    it('拖拽区间取两侧 min/max 的交集，键盘增量按轴与方向映射', () => {
      expect(resolveDragRange(0, 0, Infinity, Infinity, 100, 100)).toEqual({ minDelta: -100, maxDelta: 100 })
      expect(resolveDragRange(80, 0, 120, Infinity, 100, 100)).toEqual({ minDelta: -20, maxDelta: 20 })
      expect(resolveDragRange(0, 80, Infinity, 120, 100, 100)).toEqual({ minDelta: -20, maxDelta: 20 })
      expect(resolveDragRange(150, 0, Infinity, Infinity, 100, 100)).toEqual({ minDelta: 50, maxDelta: 100 })
      expect(resolveDragRange(0, 0, Infinity, 50, 100, 100)).toEqual({ minDelta: 50, maxDelta: 100 })

      expect(resolveKeyboardDelta(true, 'ArrowLeft')).toBe(-16)
      expect(resolveKeyboardDelta(true, 'ArrowRight')).toBe(16)
      expect(resolveKeyboardDelta(true, 'ArrowUp')).toBe(0)
      expect(resolveKeyboardDelta(false, 'ArrowUp')).toBe(-16)
      expect(resolveKeyboardDelta(false, 'ArrowDown')).toBe(16)
      expect(resolveKeyboardDelta(false, 'ArrowLeft')).toBe(0)
      expect(resolveKeyboardDelta(true, 'Enter')).toBe(0)
    })

    it('水平拖拽按增量改写两侧面板 flex，并在 pointerup 清理', async () => {
      const wrapper = mountSplitter()
      setContainerSize(wrapper, 400)
      stubPanels(wrapper, [100, 100])
      const bar = wrapper.find('.ui-splitter__bar').element

      bar.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.ui-splitter__bar').classes()).toContain('is-dragging')
      expect(document.body.style.cursor).toBe('col-resize')
      expect(document.body.style.userSelect).toBe('none')

      window.dispatchEvent(pointer('pointermove', { clientX: 140 }))
      await wrapper.vm.$nextTick()
      const panels = wrapper.findAll('.ui-splitter-panel')
      expect(panels[0].attributes('style')).toContain('flex-basis: 140px')
      expect(panels[1].attributes('style')).toContain('flex-basis: 60px')

      window.dispatchEvent(pointer('pointerup'))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.ui-splitter__bar').classes()).not.toContain('is-dragging')
      expect(document.body.style.cursor).toBe('')
      expect(document.body.style.userSelect).toBe('')
    })

    it('超过 max / 低于 min 的拖拽被区间钳制', async () => {
      const wrapper = mountSplitter({}, [
        h(SplitterPanel, { min: 60, max: 150 }, () => 'A'),
        h(SplitterPanel, { min: 60, max: 150 }, () => 'B')
      ])
      setContainerSize(wrapper, 400)
      stubPanels(wrapper, [100, 100])
      const bar = wrapper.find('.ui-splitter__bar').element
      bar.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
      window.dispatchEvent(pointer('pointermove', { clientX: 500 }))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 140px')
      window.dispatchEvent(pointer('pointermove', { clientX: -500 }))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 60px')
      window.dispatchEvent(pointer('pointerup'))
    })

    it('垂直布局按 clientY 与 ArrowUp/ArrowDown 调节', async () => {
      const wrapper = mountSplitter({ layout: 'vertical' })
      setContainerSize(wrapper, 400)
      stubPanels(wrapper, [100, 100])
      const bar = wrapper.find('.ui-splitter__bar').element
      bar.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }))
      expect(document.body.style.cursor).toBe('row-resize')
      window.dispatchEvent(pointer('pointermove', { clientX: 0, clientY: 130 }))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 130px')
      window.dispatchEvent(pointer('pointerup'))

      const down = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
      bar.dispatchEvent(down)
      await wrapper.vm.$nextTick()
      expect(down.defaultPrevented).toBe(true)
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 116px')
      bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 84px')
    })

    it('水平键盘 ArrowLeft/ArrowRight 调节，非方向键不改动也不 preventDefault', async () => {
      const wrapper = mountSplitter()
      setContainerSize(wrapper, 400)
      stubPanels(wrapper, [100, 100])
      const bar = wrapper.find('.ui-splitter__bar').element
      const right = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      bar.dispatchEvent(right)
      await wrapper.vm.$nextTick()
      expect(right.defaultPrevented).toBe(true)
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 116px')

      const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      bar.dispatchEvent(enter)
      await wrapper.vm.$nextTick()
      expect(enter.defaultPrevented).toBe(false)
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 116px')

      bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 84px')
    })

    it('拖到 0 时面板隐藏并标记 is-collapsed，点击同一分隔条恢复原宽', async () => {
      const wrapper = mountSplitter()
      setContainerSize(wrapper, 400)
      const spies = stubPanels(wrapper, [100, 100])
      let bar = wrapper.find('.ui-splitter__bar').element
      bar.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
      window.dispatchEvent(pointer('pointermove', { clientX: -500 }))
      window.dispatchEvent(pointer('pointerup'))
      await wrapper.vm.$nextTick()
      let panels = wrapper.findAll('.ui-splitter-panel')
      expect(panels[0].attributes('style')).toContain('flex-basis: 0px')
      expect(panels[0].attributes('style')).toContain('visibility: hidden')
      expect(wrapper.find('.ui-splitter__bar').classes()).toContain('is-collapsed')

      spies[0].mockReturnValue(rect(0))
      spies[1].mockReturnValue(rect(200))
      bar = wrapper.find('.ui-splitter__bar').element
      bar.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
      window.dispatchEvent(pointer('pointerup', { clientX: 101 }))
      await wrapper.vm.$nextTick()
      panels = wrapper.findAll('.ui-splitter-panel')
      expect(panels[0].attributes('style')).toContain('flex-basis: 100px')
      expect(panels[1].attributes('style')).toContain('flex-basis: 100px')
    })

    it('lazy 模式拖拽期间不落尺寸，pointerup 后一次性应用', async () => {
      const wrapper = mountSplitter({ lazy: true })
      setContainerSize(wrapper, 400)
      stubPanels(wrapper, [100, 100])
      const bar = wrapper.find('.ui-splitter__bar').element
      bar.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
      window.dispatchEvent(pointer('pointermove', { clientX: 160 }))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 100px')
      window.dispatchEvent(pointer('pointerup'))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-basis: 160px')
    })

    it('非左键启动与单面板不进入拖拽', async () => {
      const wrapper = mountSplitter()
      setContainerSize(wrapper, 400)
      stubPanels(wrapper, [100, 100])
      const bar = wrapper.find('.ui-splitter__bar').element
      bar.dispatchEvent(pointer('pointerdown', { button: 2, clientX: 100 }))
      expect(document.body.style.cursor).toBe('')
      expect(wrapper.classes()).not.toContain('is-dragging')
      window.dispatchEvent(pointer('pointermove', { clientX: 200 }))
      expect(wrapper.findAll('.ui-splitter-panel')[0].attributes('style')).toContain('flex-grow: 1')

      const single = mountSplitter({}, [h(SplitterPanel, {}, () => '仅一块')])
      expect(single.findAll('.ui-splitter__bar')).toHaveLength(0)
    })

    it('拖拽中卸载移除监听并恢复 body 样式', async () => {
      const wrapper = mountSplitter()
      setContainerSize(wrapper, 400)
      stubPanels(wrapper, [100, 100])
      const bar = wrapper.find('.ui-splitter__bar').element
      bar.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
      expect(document.body.style.cursor).toBe('col-resize')
      wrapper.unmount()
      expect(document.body.style.cursor).toBe('')
      expect(document.body.style.userSelect).toBe('')
      window.dispatchEvent(pointer('pointermove', { clientX: 200 }))
    })
  })
})
