import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Affix } from '@ui-kit-full'

// happy-dom 没有真实布局：getBoundingClientRect 恒为 0、滚动位置不可用，
// 因此本文件只覆盖非几何部分（结构 / 类名归一化 / 插槽 / props 响应 / 监听器生命周期），
// 固钉触发（is-fixed）、吸附后的尺寸占位与定位样式全部归入 tests/browser/** 的浏览器层。
function mountAffix(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Affix, { props, slots, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Affix 固钉', () => {
  it('缺省渲染哨兵与内层容器，内容落在内层', () => {
    const wrapper = mountAffix({}, { default: () => '固住的工具条' })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toEqual(['ui-affix', 'is-top'])
    const sentinel = wrapper.get('.ui-affix__sentinel')
    expect(sentinel.element.tagName).toBe('SPAN')
    expect(sentinel.attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.ui-affix__inner').text()).toBe('固住的工具条')
  })

  it('无默认插槽时内层容器仍然渲染且为空', () => {
    const wrapper = mountAffix()
    const inner = wrapper.get('.ui-affix__inner')
    expect(inner.text()).toBe('')
  })

  it('position 为 bottom 时落 is-bottom 类名', () => {
    expect(mountAffix({ position: 'bottom' }).classes()).toEqual(['ui-affix', 'is-bottom'])
  })

  it('position 为空串回退 is-top，未知值原样落 is-{position}', () => {
    expect(mountAffix({ position: '' }).classes()).toContain('is-top')
    expect(mountAffix({ position: 'middle' }).classes()).toContain('is-middle')
  })

  it('改写 position / offset / zIndex 后类名跟随且不报错', async () => {
    const wrapper = mountAffix({ position: 'top', offset: 0, zIndex: 100 })
    await wrapper.setProps({ position: 'bottom', offset: 24, zIndex: '2200' })
    await nextTick()
    expect(wrapper.classes()).toContain('is-bottom')
    expect(wrapper.classes()).not.toContain('is-top')
    expect(wrapper.find('.ui-affix__inner').exists()).toBe(true)
  })

  it('target 指向存在与不存在的容器都能挂载，结构不变', () => {
    const box = document.createElement('div')
    box.id = 'affix-host'
    document.body.appendChild(box)
    const attached = mountAffix({ target: '#affix-host' }, { default: () => '容器内固钉' })
    expect(attached.classes()).toEqual(['ui-affix', 'is-top'])
    expect(attached.find('.ui-affix__inner').text()).toBe('容器内固钉')
    const ghost = mountAffix({ target: '#affix-ghost' })
    expect(ghost.find('.ui-affix__sentinel').exists()).toBe(true)
    expect(ghost.find('.ui-affix__inner').exists()).toBe(true)
  })

  it('卸载后继续派发 scroll / resize 不报错', () => {
    const wrapper = mountAffix()
    wrapper.unmount()
    expect(() => {
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('resize'))
    }).not.toThrow()
  })

  it('spec.mjs 未声明任何可选特性：产物根节点只带核心类名', () => {
    const wrapper = mountAffix()
    // 核心类名之外不应混入 ui-affix--* 特性类
    expect(wrapper.classes().filter((name) => name.startsWith('ui-affix--'))).toEqual([])
  })

  it.skip('【浏览器层覆盖】滚动越过 offset 后追加 is-fixed 并按吸附前尺寸占位', () => {
    // 依赖 getBoundingClientRect 与真实滚动位置，happy-dom 恒为 0，归 tests/browser/**
  })

  it.skip('【浏览器层覆盖】zIndex / offset 落到固钉后的内联定位样式', () => {
    // position/top/bottom/left/z-index 内联值仅在 is-fixed 状态下产生，属几何路径，归 tests/browser/**
  })
})
