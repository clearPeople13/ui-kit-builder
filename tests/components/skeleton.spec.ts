import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { Skeleton, SkeletonItem } from '@ui-kit-full'

// 统一构造 Skeleton，收敛公共 props
function mountSkeleton(props: Record<string, unknown> = {}) {
  return mount(Skeleton, { props })
}

function groups(wrapper: ReturnType<typeof mountSkeleton>) {
  return wrapper.findAll('.ui-skeleton__group')
}

describe('Skeleton 骨架屏', () => {
  it('缺省渲染 1 组 3 行占位并标记最后一行', () => {
    const wrapper = mountSkeleton()
    expect(wrapper.classes()).toEqual(['ui-skeleton', 'ui-skeleton--loading'])
    expect(groups(wrapper)).toHaveLength(1)
    const items = wrapper.findAll('.ui-skeleton__item')
    expect(items).toHaveLength(3)
    expect(items[0].classes()).toEqual(['ui-skeleton__item', 'is-text'])
    expect(items[2].classes()).toContain('is-last')
    expect(items[0].classes()).not.toContain('is-last')
  })

  it('rows 与 count 决定占位行列', () => {
    const wrapper = mountSkeleton({ rows: 2, count: 2 })
    expect(groups(wrapper)).toHaveLength(2)
    expect(wrapper.findAll('.ui-skeleton__item')).toHaveLength(4)
    // 每组最后一行带 is-last
    expect(groups(wrapper)[0].findAll('.is-last')).toHaveLength(1)
    expect(groups(wrapper)[1].findAll('.is-last')).toHaveLength(1)
  })

  it('animated 追加动画类名', () => {
    expect(mountSkeleton({ animated: true }).classes()).toContain('is-animated')
    expect(mountSkeleton().classes()).not.toContain('is-animated')
  })

  it('loading=false 且无插槽时渲染为空', () => {
    const wrapper = mountSkeleton({ loading: false })
    expect(wrapper.classes()).not.toContain('ui-skeleton--loading')
    expect(wrapper.find('.ui-skeleton__item').exists()).toBe(false)
  })

  it('loading=false 时渲染默认插槽作为真实内容', () => {
    const wrapper = mount(Skeleton, {
      props: { loading: false },
      slots: { default: '<p class="real">真实内容</p>' }
    })
    expect(wrapper.find('.real').text()).toBe('真实内容')
    expect(wrapper.find('.ui-skeleton__item').exists()).toBe(false)
  })

  it('带默认插槽时插槽被用作自定义模板直接渲染', () => {
    const wrapper = mount(Skeleton, {
      props: { animated: true },
      slots: { default: '<div class="tpl"><i class="ui-skeleton-item"></i></div>' }
    })
    expect(wrapper.find('.tpl').exists()).toBe(true)
    expect(wrapper.findAll('.ui-skeleton__group')).toHaveLength(0)
  })

  it('rows / count 为 0 时夹到最小 1', () => {
    expect(mountSkeleton({ rows: 0 }).findAll('.ui-skeleton__item')).toHaveLength(1)
    expect(groups(mountSkeleton({ count: 0 }))).toHaveLength(1)
  })

  it('throttle 延迟占位渲染', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Skeleton, { props: { throttle: 200, rows: 2 }, attachTo: document.body })
    await nextTick()
    expect(wrapper.find('.ui-skeleton__item').exists()).toBe(false)
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(wrapper.findAll('.ui-skeleton__item')).toHaveLength(2)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('throttle 对象形式按 trailing 延时', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Skeleton, { props: { throttle: { trailing: 300 } }, attachTo: document.body })
    await nextTick()
    expect(wrapper.find('.ui-skeleton__item').exists()).toBe(false)
    vi.advanceTimersByTime(299)
    await nextTick()
    expect(wrapper.find('.ui-skeleton__item').exists()).toBe(false)
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.findAll('.ui-skeleton__item')).toHaveLength(3)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('rows 变化后即时重排占位行数', async () => {
    const wrapper = mountSkeleton({ rows: 2 })
    await wrapper.setProps({ rows: 5 })
    expect(wrapper.findAll('.ui-skeleton__item')).toHaveLength(5)
    expect(wrapper.findAll('.ui-skeleton__item')[4].classes()).toContain('is-last')
  })
})

describe('SkeletonItem 骨架元素', () => {
  it('缺省为文本型', () => {
    const wrapper = mount(SkeletonItem)
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toEqual(['ui-skeleton-item', 'is-text'])
    expect(wrapper.text()).toBe('')
  })

  it('variant 落到 is-{variant} 类名', () => {
    expect(mount(SkeletonItem, { props: { variant: 'circle' } }).classes()).toContain('is-circle')
    expect(mount(SkeletonItem, { props: { variant: 'rect' } }).classes()).toContain('is-rect')
  })

  it('image 变体渲染内置图标', () => {
    const wrapper = mount(SkeletonItem, { props: { variant: 'image' } })
    expect(wrapper.classes()).toContain('is-image')
    expect(wrapper.find('.ui-skeleton-item__icon').exists()).toBe(true)
    expect(wrapper.find('.ui-skeleton-item__icon svg').exists()).toBe(true)
  })

  it('非 image 变体不带图标', () => {
    expect(
      mount(SkeletonItem, { props: { variant: 'text' } })
        .find('.ui-skeleton-item__icon')
        .exists()
    ).toBe(false)
  })
})
