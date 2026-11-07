import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ImageViewer } from '@ui-kit-full'

// ImageViewer 属于 overlayConfig 家族：默认不传送（teleported 为纯 Boolean，
// 未声明时是 false），根节点留在原位置；打开时面板移除/常驻遵循受控约定
function panel() {
  return document.querySelector('.ui-image-viewer__panel') as HTMLElement | null
}

function container() {
  return document.querySelector('.ui-image-viewer') as HTMLElement | null
}

const mounted: Array<ReturnType<typeof mount>> = []

function mountViewer(props: Record<string, any> = {}, slots: Record<string, () => string> = {}) {
  const wrapper = mount(ImageViewer, {
    props: { modelValue: true, ...props },
    slots: { default: () => '内部', ...slots },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

async function click(el: Element | null) {
  if (!el) {
    throw new Error('目标节点不存在')
  }
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
})

afterEach(async () => {
  while (mounted.length) {
    const wrapper = mounted.pop()
    await wrapper?.unmount()
  }
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
})

describe('ImageViewer', () => {
  it('关闭时根容器隐藏且不渲染面板', () => {
    const wrapper = mount(ImageViewer, { props: { modelValue: false } })
    expect(wrapper.classes()).toContain('ui-image-viewer')
    expect(wrapper.classes()).toContain('is-hidden')
    expect(panel()).toBeNull()
  })

  it('特性类常驻：popper 与 modal 修饰类始终在根上', () => {
    const wrapper = mountViewer()
    expect(wrapper.classes()).toContain('ui-image-viewer--popper')
    expect(wrapper.classes()).toContain('ui-image-viewer--modal')
  })

  it('打开时渲染遮罩与对话框面板', async () => {
    mountViewer()
    await nextTick()
    expect(document.querySelector('.ui-image-viewer__mask')).not.toBeNull()
    expect(panel()?.getAttribute('role')).toBe('dialog')
    expect(document.querySelector('.ui-image-viewer__panel__body')?.textContent).toContain('内部')
  })

  it('默认不传送，根节点保留在挂载容器内', async () => {
    const wrapper = mountViewer()
    await nextTick()
    expect(wrapper.element.parentElement?.parentElement).toBe(document.body)
    expect(container()?.parentElement).not.toBe(document.body)
  })

  it('teleported=true 时整块传到 body', async () => {
    mountViewer({ teleported: true })
    await nextTick()
    expect(container()?.parentElement).toBe(document.body)
    expect(panel()).not.toBeNull()
  })

  it('自动分配 z-index 且显式 zIndex 优先', async () => {
    const auto = mountViewer()
    await nextTick()
    const autoStyle = auto.element.getAttribute('style') ?? ''
    expect(autoStyle).toMatch(/z-index:\s*2\d{3}/)
    auto.unmount()
    document.body.innerHTML = ''
    const explicit = mountViewer({ zIndex: 3000, teleported: true })
    await nextTick()
    expect(container()?.getAttribute('style') ?? '').toContain('z-index: 3000')
  })

  it('点击遮罩抛出 update:modelValue(false) 与 close', async () => {
    const wrapper = mountViewer()
    await nextTick()
    await click(document.querySelector('.ui-image-viewer__mask'))
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('Escape 关闭，closeOnPressEscape=false 时无效', async () => {
    const wrapper = mountViewer()
    await nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])

    const kept = mountViewer({ closeOnPressEscape: false })
    await nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(kept.emitted('update:modelValue')).toBeUndefined()
  })

  it('滚动锁默认为 hidden，lockScroll=false 或关闭后释放', async () => {
    const wrapper = mountViewer()
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('hidden')
    await wrapper.setProps({ modelValue: false })
    expect(document.documentElement.style.overflow).toBe('')

    const unlocked = mountViewer({ lockScroll: false })
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('')
    expect(unlocked.emitted('close')).toBeUndefined()
  })

  it('受控开合往复不残留面板', async () => {
    const wrapper = mountViewer({ teleported: true })
    await nextTick()
    for (let i = 0; i < 3; i++) {
      await wrapper.setProps({ modelValue: false })
      expect(panel()).toBeNull()
      await wrapper.setProps({ modelValue: true })
      expect(panel()).not.toBeNull()
    }
    expect(document.querySelectorAll('.ui-image-viewer')).toHaveLength(1)
  })

  it('空插槽时正文为空', async () => {
    const wrapper = mount(ImageViewer, { props: { modelValue: true }, attachTo: document.body })
    mounted.push(wrapper)
    await nextTick()
    expect(document.querySelector('.ui-image-viewer__panel__body')?.textContent).toBe('')
  })

  it('卸载清理传送节点', async () => {
    const wrapper = mountViewer({ teleported: true })
    await nextTick()
    wrapper.unmount()
    expect(container()).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
  })
})
