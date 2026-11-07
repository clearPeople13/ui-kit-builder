import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Watermark } from '@ui-kit-full'

function mountWatermark(props: Record<string, any> = {}, content: any = h('div', { class: 'inner' }, '被水印覆盖的内容')) {
  return mount(Watermark, { props, slots: { default: () => content }, attachTo: document.body })
}

function layerStyle(wrapper: ReturnType<typeof mountWatermark>) {
  return wrapper.find('.ui-watermark__layer').attributes('style') ?? ''
}

function rootStyle(wrapper: ReturnType<typeof mountWatermark>) {
  return wrapper.attributes('style') ?? ''
}

afterEach(() => {
  document.body.innerHTML = ''
})

// 说明：水印文字通过 SVG data-uri 背景图渲染，happy-dom 的 CSSStyleDeclaration
// 会整体丢弃该 background-image 声明（既不在 style 属性也不在 .style 上），
// 属纯 CSS 驱动路径，真实像素由 tests/browser 负责，这里只断言可观察的结构与盒式样式。
describe('Watermark', () => {
  it('渲染内容层与水印层结构', () => {
    const wrapper = mountWatermark()
    expect(wrapper.classes()).toContain('ui-watermark')
    expect(wrapper.find('.ui-watermark__content .inner').text()).toBe('被水印覆盖的内容')
    expect(wrapper.find('.ui-watermark__layer').exists()).toBe(true)
  })

  it('根节点固定 position relative + overflow hidden', () => {
    expect(rootStyle(mountWatermark())).toContain('position: relative')
    expect(rootStyle(mountWatermark())).toContain('overflow: hidden')
  })

  it('popper 特性类名恒挂（结构性类名，offset 为数组开关）', () => {
    expect(mountWatermark().classes()).toContain('ui-watermark--popper')
    expect(mountWatermark({ offset: [10, 10] }).classes()).toContain('ui-watermark--popper')
  })

  it('水印层绝对定位、铺满并屏蔽指针事件', () => {
    const style = layerStyle(mountWatermark())
    expect(style).toContain('position: absolute')
    expect(style).toContain('inset: 0')
    expect(style).toContain('pointer-events: none')
    expect(style).toContain('background-repeat: repeat')
  })

  it('zIndex 缺省 9 且自定义后写到水印层', () => {
    expect(layerStyle(mountWatermark())).toContain('z-index: 9')
    expect(layerStyle(mountWatermark({ zIndex: 20 }))).toContain('z-index: 20')
  })

  it('background-size 缺省 160x120', () => {
    expect(layerStyle(mountWatermark())).toContain('background-size: 160px 120px')
  })

  it('background-size 由 width/height 与 gap 累加得出', () => {
    expect(layerStyle(mountWatermark({ width: 200, height: 100, gap: [20, 30] }))).toContain('background-size: 220px 130px')
  })

  it('offset 存在时写入 background-position，缺省不写', () => {
    expect(layerStyle(mountWatermark({ offset: [5, 6] }))).toContain('background-position: 5px 6px')
    expect(layerStyle(mountWatermark())).not.toContain('background-position')
  })

  it('仅设 offset 横坐标时纵坐标补 0', () => {
    expect(layerStyle(mountWatermark({ offset: [8] }))).toContain('background-position: 8px 0px')
  })

  it('content 字符串形态仍渲染水印层', () => {
    expect(mountWatermark({ content: '机密' }).find('.ui-watermark__layer').exists()).toBe(true)
  })

  it('content 数组多行仍渲染水印层', () => {
    expect(mountWatermark({ content: ['第一行', '第二行'] }).find('.ui-watermark__layer').exists()).toBe(true)
  })

  it('image 与 rotate、font 配置不改变可观察结构', () => {
    const wrapper = mountWatermark({ image: 'https://example.com/logo.png', rotate: 30, font: { color: '#f00', fontSize: 24 } })
    expect(wrapper.find('.ui-watermark__layer').exists()).toBe(true)
    expect(wrapper.find('.ui-watermark__content').exists()).toBe(true)
  })

  it('无默认内容时仍渲染内容层与水印层', () => {
    const wrapper = mountWatermark({}, null)
    expect(wrapper.find('.ui-watermark__content').exists()).toBe(true)
    expect(wrapper.find('.ui-watermark__layer').exists()).toBe(true)
    expect(wrapper.find('.ui-watermark__content').text()).toBe('')
  })

  it('class 透传与基类名共存', () => {
    expect(mountWatermark({ class: 'my-mark' }).classes()).toEqual(expect.arrayContaining(['ui-watermark', 'my-mark']))
  })

  it('字符串 style 与内部定位样式合并到根节点', () => {
    expect(rootStyle(mountWatermark({ class: 'x' }))).toContain('position: relative')
  })
})
