import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Loading } from '@ui-kit-full'

// Loading 为纯渲染组件：可见性由 modelValue 控制内容移除，全屏层用自增 z-index。
// 断言只覆盖类名/样式落地与结构，不涉及真实布局
const mounted: Array<ReturnType<typeof mount>> = []

function mountLoading(props: Record<string, any> = {}) {
  const wrapper = mount(Loading, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function spinner(wrapper: VueWrapper) {
  return wrapper.element.querySelector('.ui-loading__spinner')
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

describe('Loading', () => {
  it('默认显示：modelValue 缺省为 true，只渲染 spinner', async () => {
    const wrapper = mountLoading({})
    await nextTick()
    expect(wrapper.classes()).toContain('ui-loading')
    expect(wrapper.classes()).not.toContain('is-hidden')
    expect(spinner(wrapper)).not.toBeNull()
    expect(wrapper.element.querySelector('.ui-loading__text')).toBeNull()
    expect(spinner(wrapper)?.getAttribute('style')).toBeNull()
  })

  it('modelValue=false 移除全部内部节点并挂 is-hidden', async () => {
    const wrapper = mountLoading({ modelValue: false, text: '不该出现' })
    await nextTick()
    expect(wrapper.classes()).toContain('is-hidden')
    expect(spinner(wrapper)).toBeNull()
    expect(wrapper.text()).toBe('')
  })

  it('反复切换 modelValue 不残留重复节点', async () => {
    const wrapper = mountLoading()
    for (let i = 0; i < 3; i++) {
      await wrapper.setProps({ modelValue: false })
      expect(spinner(wrapper)).toBeNull()
      await wrapper.setProps({ modelValue: true })
      expect(wrapper.element.querySelectorAll('.ui-loading__spinner')).toHaveLength(1)
    }
  })

  it('text 文案渲染在独立节点', async () => {
    const wrapper = mountLoading({ text: '加载中请稍候' })
    await nextTick()
    expect(wrapper.element.querySelector('.ui-loading__text')?.textContent).toBe('加载中请稍候')
  })

  it('size 数字转 px、字符串原样落到 spinner', async () => {
    const numeric = mountLoading({ size: 42 })
    await nextTick()
    const numericStyle = spinner(numeric)?.getAttribute('style') ?? ''
    expect(numericStyle).toContain('width: 42px')
    expect(numericStyle).toContain('height: 42px')
    const raw = mountLoading({ size: '3rem' })
    await nextTick()
    expect(spinner(raw)?.getAttribute('style') ?? '').toContain('width: 3rem')
  })

  it('color 写入 --ui-loading-color CSS 变量', async () => {
    const wrapper = mountLoading({ color: '#ff0000' })
    await nextTick()
    expect(wrapper.element.getAttribute('style') ?? '').toContain('--ui-loading-color: #ff0000')
  })

  it('background 与 target 分别落背景与绝对定位', async () => {
    const box = document.createElement('div')
    box.id = 'loading-target'
    document.body.appendChild(box)
    const wrapper = mountLoading({ background: 'rgba(0, 0, 0, .5)', target: '#loading-target' })
    await nextTick()
    const style = wrapper.element.getAttribute('style') ?? ''
    expect(style).toContain('background: rgba(0, 0, 0, .5)')
    expect(style).toContain('position: absolute')
    box.remove()
  })

  it('fullscreen 叠加 is-fullscreen 类与自增 z-index', async () => {
    const wrapper = mountLoading({ fullscreen: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-fullscreen')
    const style = wrapper.element.getAttribute('style') ?? ''
    expect(style).toMatch(/z-index:\s*2\d{3}/)
    const z1 = Number(style.match(/z-index:\s*(\d+)/)?.[1])
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    const z2 = Number((wrapper.element.getAttribute('style') ?? '').match(/z-index:\s*(\d+)/)?.[1])
    expect(z2).toBeGreaterThan(z1)
  })

  it('lock 只落 is-lock 类（不触碰文档滚动锁）', async () => {
    const wrapper = mountLoading({ lock: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-lock')
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('customClass 与基础类并存', async () => {
    const wrapper = mountLoading({ customClass: 'mine' })
    await nextTick()
    expect(wrapper.classes()).toContain('mine')
    expect(wrapper.classes()).toContain('ui-loading')
  })

  it('非全屏不写 z-index 样式', async () => {
    const wrapper = mountLoading()
    await nextTick()
    const style = wrapper.element.getAttribute('style') ?? ''
    expect(style).not.toContain('z-index')
  })

  it('卸载后 body 无残留', async () => {
    const wrapper = mountLoading({ fullscreen: true })
    await nextTick()
    wrapper.unmount()
    expect(document.querySelector('.ui-loading')).toBeNull()
  })
})
