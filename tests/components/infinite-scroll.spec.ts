import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InfiniteScroll } from '@ui-kit-full'

// happy-dom 里 documentElement.scrollHeight 为 0，getDocumentMetrics 恒为 null，
// 判定“触底”始终成立；通过重定义 scrollHeight/scrollTop 构造可验证的触底模型，
// 只用于驱动滚动逻辑，不断言真实布局尺寸
const mounted: Array<ReturnType<typeof mount>> = []
const scrollHeightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
const scrollTopDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTop')

let fakeScrollHeight = 0

function useDocumentMetrics(scrollHeight: number) {
  fakeScrollHeight = scrollHeight
}

beforeEach(() => {
  document.body.innerHTML = ''
  fakeScrollHeight = 0
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    get: () => fakeScrollHeight
  })
})

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.unmount()
  }
  document.body.innerHTML = ''
  if (scrollHeightDesc) {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeightDesc)
  }
  if (scrollTopDesc) {
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', scrollTopDesc)
  }
})

function mountScroll(props: Record<string, any> = {}, slots: Record<string, () => string> = {}) {
  const wrapper = mount(InfiniteScroll, {
    props,
    slots: { default: () => '列表内容', ...slots },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

async function scrollThenAdvance(ms: number) {
  window.dispatchEvent(new Event('scroll'))
  vi.advanceTimersByTime(ms)
  await nextTick()
}

describe('InfiniteScroll', () => {
  it('默认 immediate 挂载即触发 load', async () => {
    vi.useFakeTimers()
    const wrapper = mountScroll({ immediate: true })
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('load')).toHaveLength(1)
    expect(wrapper.classes()).toContain('ui-infinite-scroll')
    expect(wrapper.text()).toContain('列表内容')
    vi.useRealTimers()
  })

  it('immediate=false 时静默，滚动事件延迟 delay 后触发', async () => {
    vi.useFakeTimers()
    const wrapper = mountScroll({ immediate: false, delay: 300 })
    await nextTick()
    expect(wrapper.emitted('load')).toBeUndefined()
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(299)
    await nextTick()
    expect(wrapper.emitted('load')).toBeUndefined()
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.emitted('load')).toHaveLength(1)
    vi.useRealTimers()
  })

  it('delay 内连续滚动只按最后一次计时（防抖）', async () => {
    vi.useFakeTimers()
    const wrapper = mountScroll({ immediate: false, delay: 200 })
    await nextTick()
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(150)
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(199)
    await nextTick()
    expect(wrapper.emitted('load')).toBeUndefined()
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.emitted('load')).toHaveLength(1)
    vi.useRealTimers()
  })

  it('触发一次后未重新授权不再连发', async () => {
    vi.useFakeTimers()
    const wrapper = mountScroll({ immediate: true, delay: 100 })
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('load')).toHaveLength(1)
    await scrollThenAdvance(100)
    expect(wrapper.emitted('load')).toHaveLength(1)
    vi.useRealTimers()
  })

  it('disabled 屏蔽触发并落 is-disabled 类', async () => {
    vi.useFakeTimers()
    const wrapper = mountScroll({ immediate: true, disabled: true, loading: true })
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('load')).toBeUndefined()
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.classes()).toContain('is-loading')
    await wrapper.setProps({ disabled: false, loading: false })
    ;(wrapper.vm as unknown as { check: () => void }).check()
    expect(wrapper.emitted('load')).toHaveLength(1)
    vi.useRealTimers()
  })

  it('loading=true 时触底吸收授权但不发 load', async () => {
    vi.useFakeTimers()
    const wrapper = mountScroll({ immediate: false, loading: true, delay: 200 })
    await nextTick()
    await scrollThenAdvance(200)
    expect(wrapper.emitted('load')).toBeUndefined()
    expect(wrapper.classes()).toContain('is-loading')
    vi.useRealTimers()
  })

  it('scrollHeight 模型：远离触底重新授权，接近触底再触发', async () => {
    vi.useFakeTimers()
    useDocumentMetrics(2000)
    document.documentElement.scrollTop = 0
    const wrapper = mountScroll({ immediate: false, delay: 100 })
    await nextTick()
    // 0 + 768 < 2000：未触底，不发 load，armed 保持
    await scrollThenAdvance(100)
    expect(wrapper.emitted('load')).toBeUndefined()
    // 1300 + 768 >= 2000：触底，load #1
    document.documentElement.scrollTop = 1300
    await scrollThenAdvance(100)
    expect(wrapper.emitted('load')).toHaveLength(1)
    // 内容变高后又远离触底：重新授权，无 emit
    useDocumentMetrics(3000)
    await scrollThenAdvance(100)
    expect(wrapper.emitted('load')).toHaveLength(1)
    // 再次接近触底：load #2
    document.documentElement.scrollTop = 2300
    await scrollThenAdvance(100)
    expect(wrapper.emitted('load')).toHaveLength(2)
    vi.useRealTimers()
  })

  it('distance 扩大触底判定范围', async () => {
    vi.useFakeTimers()
    useDocumentMetrics(2000)
    document.documentElement.scrollTop = 1000
    const wrapper = mountScroll({ immediate: false, delay: 100, distance: 300 })
    await nextTick()
    // 1000 + 768 + 300 >= 2000：按 distance 判定触底
    await scrollThenAdvance(100)
    expect(wrapper.emitted('load')).toHaveLength(1)
    vi.useRealTimers()
  })

  it('vm.check 可手动触发检测', async () => {
    vi.useFakeTimers()
    const wrapper = mountScroll({ immediate: false })
    await nextTick()
    expect(wrapper.emitted('load')).toBeUndefined()
    ;(wrapper.vm as unknown as { check: () => void }).check()
    expect(wrapper.emitted('load')).toHaveLength(1)
    vi.useRealTimers()
  })

  it('自定义 class 与 ui-infinite-scroll 并存', () => {
    const wrapper = mount(InfiniteScroll, {
      props: { immediate: false },
      attrs: { class: 'mine' },
      attachTo: document.body
    })
    mounted.push(wrapper)
    expect(wrapper.classes()).toContain('mine')
    expect(wrapper.classes()).toContain('ui-infinite-scroll')
  })

  it('卸载清理监听器并丢弃未决计时器', async () => {
    vi.useFakeTimers()
    const wrapper = mountScroll({ immediate: false, delay: 100 })
    await nextTick()
    window.dispatchEvent(new Event('scroll'))
    const spyRemove = vi.spyOn(window, 'removeEventListener')
    wrapper.unmount()
    const removed = spyRemove.mock.calls.map((call) => call[0])
    expect(removed).toContain('scroll')
    expect(removed).toContain('resize')
    spyRemove.mockRestore()
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(wrapper.emitted('load')).toBeUndefined()
    vi.useRealTimers()
  })
})
