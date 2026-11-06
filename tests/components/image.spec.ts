import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Image, ImageViewer } from '@ui-kit-full'

function mountImage(props: Record<string, any> = {}) {
  return mount(Image, { props, attachTo: document.body })
}

// 预览层默认传送到 body，wrapper 根节点查不到，需从 document 读取原生 DOM
function overlay() {
  return document.querySelector('.ui-image__preview')
}

function overlayImg() {
  return document.querySelector('.ui-image__preview-img')
}

async function openPreview(wrapper: ReturnType<typeof mountImage>) {
  await wrapper.trigger('click')
  await nextTick()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Image', () => {
  it('默认渲染 span 容器与内层 img，空属性不输出', async () => {
    const wrapper = mountImage()
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('ui-image')
    const img = wrapper.find('img')
    expect(img.classes()).toContain('ui-image__inner')
    expect(img.attributes('src')).toBeUndefined()
    expect(img.attributes('alt')).toBeUndefined()
    expect(img.attributes('crossorigin')).toBeUndefined()
    expect(img.attributes('loading')).toBeUndefined()
    wrapper.unmount()
  })

  it('src、alt、crossorigin 映射到 img 原生属性', () => {
    const wrapper = mountImage({ src: 'a.png', alt: '描述文本', crossorigin: 'anonymous' })
    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('a.png')
    expect(img.attributes('alt')).toBe('描述文本')
    expect(img.attributes('crossorigin')).toBe('anonymous')
    wrapper.unmount()
  })

  it('fit 映射为 ui-image--fit-* 类名，缺省不附加', () => {
    const cover = mountImage({ src: 'a.png', fit: 'cover' })
    expect(cover.classes()).toContain('ui-image--fit-cover')
    const plain = mountImage({ src: 'a.png' })
    expect(plain.classes().filter((name: string) => name.includes('fit-'))).toEqual([])
    cover.unmount()
    plain.unmount()
  })

  it('loading 字符串输出原生属性与 ui-image--loading 类名', () => {
    const wrapper = mountImage({ src: 'a.png', loading: 'eager' })
    expect(wrapper.find('img').attributes('loading')).toBe('eager')
    expect(wrapper.classes()).toContain('ui-image--loading')
    const plain = mountImage({ src: 'a.png' })
    expect(plain.classes()).not.toContain('ui-image--loading')
    expect(plain.find('img').attributes('loading')).toBeUndefined()
    wrapper.unmount()
    plain.unmount()
  })

  it('lazy=true 输出 loading="lazy" 且优先于 loading 属性', () => {
    const wrapper = mountImage({ src: 'a.png', lazy: true, loading: 'eager' })
    expect(wrapper.find('img').attributes('loading')).toBe('lazy')
    wrapper.unmount()
  })

  it('有 src 即可预览，点击打开传送到 body 的预览层并回退使用当前 src', async () => {
    const wrapper = mountImage({ src: 'a.png' })
    expect(wrapper.classes()).toContain('is-previewable')
    await openPreview(wrapper)
    const layer = overlay()
    expect(layer).not.toBeNull()
    expect(layer!.getAttribute('role')).toBe('dialog')
    expect(layer!.getAttribute('aria-modal')).toBe('true')
    expect(layer!.querySelector('.ui-image__preview-mask')).not.toBeNull()
    expect(overlayImg()!.getAttribute('src')).toBe('a.png')
    // 单图不提供切换箭头
    expect(layer!.querySelector('.ui-image__preview-arrow')).toBeNull()
    wrapper.unmount()
  })

  it('无 src 且无预览列表时不可预览，点击不打开预览层', async () => {
    const wrapper = mountImage()
    expect(wrapper.classes()).not.toContain('is-previewable')
    await openPreview(wrapper)
    expect(overlay()).toBeNull()
    wrapper.unmount()
  })

  it('initialIndex 定位初始图片，showProgress 显示页码', async () => {
    const wrapper = mountImage({
      src: 'a.png',
      previewSrcList: ['a.png', 'b.png', 'c.png'],
      initialIndex: 1,
      showProgress: true
    })
    await openPreview(wrapper)
    expect(overlayImg()!.getAttribute('src')).toBe('b.png')
    expect(overlay()!.querySelector('.ui-image__preview-progress')!.textContent).toBe('2 / 3')
    wrapper.unmount()
    const clamped = mountImage({ src: 'a.png', previewSrcList: ['a.png', 'b.png'], initialIndex: 7 })
    await openPreview(clamped)
    expect(overlayImg()!.getAttribute('src')).toBe('b.png')
    clamped.unmount()
  })

  it('多图预览提供左右箭头并默认首尾循环', async () => {
    const wrapper = mountImage({ src: 'a.png', previewSrcList: ['a.png', 'b.png'] })
    await openPreview(wrapper)
    const next = overlay()!.querySelector<HTMLButtonElement>('.ui-image__preview-arrow.is-next')!
    const prev = overlay()!.querySelector<HTMLButtonElement>('.ui-image__preview-arrow.is-prev')!
    next.click()
    await nextTick()
    expect(overlayImg()!.getAttribute('src')).toBe('b.png')
    next.click()
    await nextTick()
    expect(overlayImg()!.getAttribute('src')).toBe('a.png')
    prev.click()
    await nextTick()
    expect(overlayImg()!.getAttribute('src')).toBe('b.png')
    wrapper.unmount()
  })

  it('infinite=false 时首尾夹住不回绕', async () => {
    const wrapper = mountImage({ src: 'a.png', previewSrcList: ['a.png', 'b.png'], infinite: false })
    await openPreview(wrapper)
    const next = overlay()!.querySelector<HTMLButtonElement>('.ui-image__preview-arrow.is-next')!
    const prev = overlay()!.querySelector<HTMLButtonElement>('.ui-image__preview-arrow.is-prev')!
    prev.click()
    await nextTick()
    expect(overlayImg()!.getAttribute('src')).toBe('a.png')
    next.click()
    next.click()
    await nextTick()
    expect(overlayImg()!.getAttribute('src')).toBe('b.png')
    wrapper.unmount()
  })

  it('滚轮按 zoomRate 缩放并夹在 maxScale 以内', async () => {
    const wrapper = mountImage({ src: 'a.png', previewSrcList: ['a.png'], previewTeleported: false })
    await openPreview(wrapper)
    const img = wrapper.find('.ui-image__preview-img')
    expect(img.attributes('style')).toContain('transform: scale(1)')
    await img.trigger('wheel', { deltaY: -100 })
    expect(img.attributes('style')).toContain('transform: scale(1.2)')
    await img.trigger('wheel', { deltaY: 100 })
    expect(img.attributes('style')).toContain('transform: scale(1)')
    wrapper.unmount()
    const capped = mountImage({
      src: 'a.png',
      previewSrcList: ['a.png'],
      previewTeleported: false,
      maxScale: 1.3,
      zoomRate: 1.5
    })
    await openPreview(capped)
    const cappedImg = capped.find('.ui-image__preview-img')
    await cappedImg.trigger('wheel', { deltaY: -100 })
    await cappedImg.trigger('wheel', { deltaY: -100 })
    expect(cappedImg.attributes('style')).toContain('transform: scale(1.3)')
    capped.unmount()
  })

  it('previewTeleported=false 时预览层渲染在组件内部', async () => {
    const wrapper = mountImage({ src: 'a.png', previewTeleported: false })
    await openPreview(wrapper)
    expect(wrapper.find('.ui-image__preview').exists()).toBe(true)
    await wrapper.find('.ui-image__preview-close').trigger('click')
    await nextTick()
    expect(wrapper.find('.ui-image__preview').exists()).toBe(false)
    wrapper.unmount()
  })

  it('zIndex 作用于预览层而非根节点', async () => {
    const wrapper = mountImage({ src: 'a.png', zIndex: 2000 })
    await openPreview(wrapper)
    expect(wrapper.attributes('style') ?? '').not.toContain('z-index')
    expect(overlay()!.getAttribute('style')).toContain('z-index: 2000')
    wrapper.unmount()
    const plain = mountImage({ src: 'a.png' })
    await openPreview(plain)
    expect(overlay()!.getAttribute('style') ?? '').not.toContain('z-index')
    plain.unmount()
  })

  it('按 Escape 关闭预览，closeOnPressEscape=false 时忽略', async () => {
    const wrapper = mountImage({ src: 'a.png' })
    await openPreview(wrapper)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(overlay()).toBeNull()
    wrapper.unmount()
    const keep = mountImage({ src: 'a.png', closeOnPressEscape: false })
    await openPreview(keep)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(overlay()).not.toBeNull()
    keep.unmount()
  })

  it('点击遮罩默认不关闭，hideOnClickModal 开启后关闭；关闭按钮始终可用', async () => {
    const wrapper = mountImage({ src: 'a.png', previewTeleported: false })
    await openPreview(wrapper)
    await wrapper.find('.ui-image__preview-mask').trigger('click')
    expect(wrapper.find('.ui-image__preview').exists()).toBe(true)
    await wrapper.find('.ui-image__preview-close').trigger('click')
    await nextTick()
    expect(wrapper.find('.ui-image__preview').exists()).toBe(false)
    wrapper.unmount()
    const hide = mountImage({ src: 'a.png', previewTeleported: false, hideOnClickModal: true })
    await openPreview(hide)
    await hide.find('.ui-image__preview-mask').trigger('click')
    await nextTick()
    expect(hide.find('.ui-image__preview').exists()).toBe(false)
    hide.unmount()
  })
})

describe('ImageViewer', () => {
  it('modelValue 未传时保持隐藏，不渲染遮罩与面板', () => {
    const wrapper = mount(ImageViewer)
    expect(wrapper.classes()).toContain('ui-image-viewer')
    expect(wrapper.classes()).toContain('is-hidden')
    expect(wrapper.text()).toBe('')
    expect(wrapper.find('.ui-image-viewer__mask').exists()).toBe(false)
    expect(wrapper.find('.ui-image-viewer__panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('modelValue 为 true 时渲染遮罩与面板并透传默认插槽', async () => {
    const wrapper = mount(ImageViewer, {
      props: { modelValue: true, zIndex: 22 },
      slots: { default: () => '查看器内容' }
    })
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-hidden')
    expect(wrapper.attributes('style')).toContain('z-index: 22')
    expect(wrapper.find('.ui-image-viewer__mask').exists()).toBe(true)
    const panel = wrapper.find('.ui-image-viewer__panel')
    expect(panel.attributes('role')).toBe('dialog')
    expect(panel.text()).toBe('查看器内容')
    wrapper.unmount()
  })

  it('未显式指定 zIndex 时自动取层级，点击遮罩抛出关闭事件', async () => {
    const wrapper = mount(ImageViewer, { props: { modelValue: true } })
    await nextTick()
    const auto = Number((wrapper.attributes('style') ?? '').match(/z-index: (\d+)/)?.[1])
    expect(auto).toBeGreaterThanOrEqual(2001)
    await wrapper.find('.ui-image-viewer__mask').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
