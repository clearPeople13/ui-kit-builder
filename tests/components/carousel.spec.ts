import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Carousel, CarouselItem } from '@ui-kit-full'

interface ItemSpec {
  name?: string
  label?: string | number
  text?: string
}

const items: ItemSpec[] = [
  { name: 'a', label: '第一张', text: '内容A' },
  { name: 'b', text: '内容B' },
  { label: 3, text: '内容C' }
]

// CarouselItem 在自身 setup 里向 Carousel 注册，注册时机晚于 Carousel 首次渲染，
// 因此指示器与条目状态要等多一次 tick 才完整
async function mountCarousel(props: Record<string, unknown> = {}, list = items) {
  const wrapper = mount(Carousel, {
    props,
    slots: {
      default: () =>
        list.map((item) => h(CarouselItem, { name: item.name, label: item.label }, { default: () => item.text }))
    },
    attachTo: document.body
  })
  await nextTick()
  return wrapper
}

function slides(wrapper: ReturnType<typeof mountCarousel>) {
  return wrapper.findAll('.ui-carousel-item')
}

function indicators(wrapper: ReturnType<typeof mountCarousel>) {
  return wrapper.findAll('.ui-carousel__indicator')
}

// 只保留 is-* 状态类，便于比较条目与激活项的相对位置
function stateClasses(wrapper: ReturnType<typeof mountCarousel>) {
  return slides(wrapper).map((slide) => slide.classes().filter((name) => name.startsWith('is-')))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Carousel', () => {
  it('渲染轨道、箭头与指示器并输出条目内容', async () => {
    const wrapper = await mountCarousel()
    expect(wrapper.classes()).toContain('ui-carousel')
    expect(wrapper.classes()).toContain('is-horizontal')
    expect(wrapper.find('.ui-carousel__track').exists()).toBe(true)
    expect(wrapper.findAll('.ui-carousel__arrow')).toHaveLength(2)
    expect(slides(wrapper)).toHaveLength(3)
    expect(indicators(wrapper)).toHaveLength(3)
    expect(wrapper.find('.ui-carousel-item__inner').text()).toBe('内容A')
  })

  it('height 映射到根节点内联样式，缺省不输出', async () => {
    const fixed = await mountCarousel({ height: '300px' })
    expect(fixed.attributes('style')).toContain('height: 300px')
    const percent = await mountCarousel({ height: '50%' })
    expect(percent.attributes('style')).toContain('height: 50%')
    const plain = await mountCarousel()
    expect(plain.attributes('style') ?? '').not.toContain('height')
  })

  it('indicatorPosition、arrow、type、direction 映射为状态类名', async () => {
    const wrapper = await mountCarousel({
      indicatorPosition: 'outside',
      arrow: 'always',
      type: 'card',
      direction: 'vertical'
    })
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['is-indicator-outside', 'is-arrow-always', 'is-card', 'is-vertical'])
    )
    const plain = await mountCarousel()
    expect(plain.classes().filter((name: string) => name.startsWith('is-'))).toEqual(['is-horizontal'])
  })

  it('arrow=never 仅输出类名钩子，箭头仍在 DOM 且点击仍可切换', async () => {
    const wrapper = await mountCarousel({ arrow: 'never' })
    expect(wrapper.classes()).toContain('is-arrow-never')
    expect(wrapper.findAll('.ui-carousel__arrow')).toHaveLength(2)
    await wrapper.find('.ui-carousel__arrow.is-right').trigger('click')
    await nextTick()
    expect(stateClasses(wrapper)).toEqual([['is-prev'], ['is-active'], ['is-next']])
  })

  it('指示器 aria-label 优先取 label 再取 name（数字 label 转字符串）', async () => {
    const wrapper = await mountCarousel()
    expect(indicators(wrapper).map((item) => item.attributes('aria-label'))).toEqual(['第一张', 'b', '3'])
  })

  it('未传 name 与 label 时指示器以自动生成的条目名作为 aria-label', async () => {
    const wrapper = await mountCarousel({}, [{ text: 'A' }, { text: 'B' }])
    const labels = indicators(wrapper).map((item) => item.attributes('aria-label') ?? '')
    expect(labels).toHaveLength(2)
    expect(labels.every((label) => /^item-[a-z0-9]+$/.test(label))).toBe(true)
  })

  it('激活指示器标记 is-active 与 aria-current', async () => {
    const wrapper = await mountCarousel()
    expect(indicators(wrapper)[0].classes()).toContain('is-active')
    expect(indicators(wrapper)[0].attributes('aria-current')).toBe('true')
    expect(
      indicators(wrapper)
        .map((item) => item.attributes('aria-current'))
        .filter(Boolean)
    ).toEqual(['true'])
  })

  it('点击指示器切换到对应条目', async () => {
    const wrapper = await mountCarousel()
    await indicators(wrapper)[2].trigger('click')
    await nextTick()
    expect(indicators(wrapper)[2].classes()).toContain('is-active')
    // 三项环状排列：激活项的下一项是 is-next，上一项是 is-prev
    expect(stateClasses(wrapper)).toEqual([['is-next'], ['is-prev'], ['is-active']])
  })

  it('trigger 默认为 hover，悬停指示器即切换', async () => {
    const wrapper = await mountCarousel()
    await indicators(wrapper)[1].trigger('mouseenter')
    await nextTick()
    expect(indicators(wrapper)[1].classes()).toContain('is-active')
  })

  it('trigger=click 时悬停指示器不切换，点击仍可切换', async () => {
    const wrapper = await mountCarousel({ trigger: 'click' })
    await indicators(wrapper)[1].trigger('mouseenter')
    await nextTick()
    expect(indicators(wrapper)[0].classes()).toContain('is-active')
    await indicators(wrapper)[1].trigger('click')
    await nextTick()
    expect(indicators(wrapper)[1].classes()).toContain('is-active')
  })

  it('箭头逐项切换并在两端回绕', async () => {
    const wrapper = await mountCarousel()
    await wrapper.find('.ui-carousel__arrow.is-right').trigger('click')
    await nextTick()
    expect(indicators(wrapper)[1].classes()).toContain('is-active')
    // 从第一项按左箭头回绕到最后一项
    await wrapper.find('.ui-carousel__arrow.is-left').trigger('click')
    await wrapper.find('.ui-carousel__arrow.is-left').trigger('click')
    await nextTick()
    expect(indicators(wrapper)[2].classes()).toContain('is-active')
  })

  it('实例方法 next/prev/setActiveItem 控制切换且越界回绕', async () => {
    const wrapper = await mountCarousel({ autoplay: false })
    const vm = wrapper.vm as unknown as {
      next: () => void
      prev: () => void
      setActiveItem: (index: number) => void
    }
    vm.setActiveItem(2)
    await nextTick()
    expect(indicators(wrapper)[2].classes()).toContain('is-active')
    vm.setActiveItem(9)
    await nextTick()
    expect(indicators(wrapper)[0].classes()).toContain('is-active')
    vm.prev()
    await nextTick()
    expect(indicators(wrapper)[2].classes()).toContain('is-active')
    vm.next()
    await nextTick()
    expect(indicators(wrapper)[0].classes()).toContain('is-active')
  })

  it('水平模式按相对位置输出状态类，且不带纵向位移样式', async () => {
    const wrapper = await mountCarousel({}, [
      { name: 'a', text: 'A' },
      { name: 'b', text: 'B' },
      { name: 'c', text: 'C' },
      { name: 'd', text: 'D' }
    ])
    expect(stateClasses(wrapper)).toEqual([['is-active'], ['is-next'], ['is-rest'], ['is-prev']])
    expect(slides(wrapper).map((slide) => slide.attributes('style') ?? '')).toEqual(['', '', '', ''])
  })

  it('纵向模式非激活条目按相对位置输出 translateY 位移', async () => {
    const wrapper = await mountCarousel({ direction: 'vertical' })
    const slidesNow = slides(wrapper)
    expect(slidesNow[0].classes()).toContain('is-slide')
    expect(slidesNow[0].attributes('style') ?? '').not.toContain('translateY')
    expect(slidesNow[1].attributes('style')).toContain('transform: translateY(100%)')
    expect(slidesNow[2].attributes('style')).toContain('transform: translateY(-100%)')
    // 切换后按最短路径重算位移
    await wrapper.find('.ui-carousel__arrow.is-right').trigger('click')
    await nextTick()
    expect(slides(wrapper)[0].attributes('style')).toContain('transform: translateY(-100%)')
    expect(slides(wrapper)[1].attributes('style') ?? '').not.toContain('translateY')
    expect(slides(wrapper)[2].attributes('style')).toContain('transform: translateY(100%)')
  })

  it('autoplay 按 interval 自动逐项切换并循环', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = await mountCarousel({ interval: 1000 })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(indicators(wrapper)[1].classes()).toContain('is-active')
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(indicators(wrapper)[2].classes()).toContain('is-active')
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(indicators(wrapper)[0].classes()).toContain('is-active')
    } finally {
      vi.useRealTimers()
    }
  })

  it('interval 低于 500ms 被夹到 500ms', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = await mountCarousel({ interval: 100 })
      vi.advanceTimersByTime(400)
      await nextTick()
      expect(indicators(wrapper)[0].classes()).toContain('is-active')
      vi.advanceTimersByTime(100)
      await nextTick()
      expect(indicators(wrapper)[1].classes()).toContain('is-active')
    } finally {
      vi.useRealTimers()
    }
  })

  it('autoplay=false 时不轮播，改为 true 后恢复计时', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = await mountCarousel({ autoplay: false, interval: 500 })
      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(indicators(wrapper)[0].classes()).toContain('is-active')
      await wrapper.setProps({ autoplay: true })
      vi.advanceTimersByTime(500)
      await nextTick()
      expect(indicators(wrapper)[1].classes()).toContain('is-active')
      await wrapper.setProps({ autoplay: false })
      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(indicators(wrapper)[1].classes()).toContain('is-active')
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauseOnHover 默认开启：悬停轨道暂停、离开恢复', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = await mountCarousel({ interval: 500 })
      await wrapper.find('.ui-carousel__track').trigger('mouseenter')
      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(indicators(wrapper)[0].classes()).toContain('is-active')
      await wrapper.find('.ui-carousel__track').trigger('mouseleave')
      vi.advanceTimersByTime(500)
      await nextTick()
      expect(indicators(wrapper)[1].classes()).toContain('is-active')
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauseOnHover=false 时悬停轨道不暂停', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = await mountCarousel({ interval: 500, pauseOnHover: false })
      await wrapper.find('.ui-carousel__track').trigger('mouseenter')
      vi.advanceTimersByTime(500)
      await nextTick()
      expect(indicators(wrapper)[1].classes()).toContain('is-active')
    } finally {
      vi.useRealTimers()
    }
  })

  it('内部切换不对外抛出 modelValue/change 事件（不支持 v-model）', async () => {
    const wrapper = await mountCarousel({ autoplay: false })
    await wrapper.find('.ui-carousel__arrow.is-right').trigger('click')
    await indicators(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('空走马灯只渲染空轨道与箭头，不渲染指示器', async () => {
    const wrapper = await mountCarousel({}, [])
    expect(wrapper.find('.ui-carousel__track').text()).toBe('')
    expect(wrapper.find('.ui-carousel__indicators').exists()).toBe(false)
    expect(wrapper.findAll('.ui-carousel__arrow')).toHaveLength(2)
  })

  it('单项时条目恒为激活且箭头不改状态', async () => {
    const wrapper = await mountCarousel({ autoplay: false }, [{ name: 'only', text: 'A' }])
    expect(stateClasses(wrapper)).toEqual([['is-active']])
    expect(indicators(wrapper)).toHaveLength(1)
    await wrapper.find('.ui-carousel__arrow.is-right').trigger('click')
    await nextTick()
    expect(stateClasses(wrapper)).toEqual([['is-active']])
  })
})

describe('CarouselItem', () => {
  it('脱离 Carousel 独立渲染时视为激活，内容回退到 label', () => {
    const wrapper = mount(CarouselItem, { props: { label: '独立文案' }, attachTo: document.body })
    expect(wrapper.classes()).toContain('ui-carousel-item')
    expect(wrapper.classes()).toContain('is-active')
    expect(wrapper.find('.ui-carousel-item__inner').text()).toBe('独立文案')
  })
})
