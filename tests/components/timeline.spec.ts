import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Timeline, TimelineItem } from '@ui-kit-full'

function mountTimeline(props: Record<string, any> = {}, items: any = [h(TimelineItem, {}, () => 'A'), h(TimelineItem, {}, () => 'B')]) {
  return mount(Timeline, { props, slots: { default: () => items }, attachTo: document.body })
}

function itemNodes(wrapper: ReturnType<typeof mountTimeline>) {
  return wrapper.findAll('.ui-timeline-item')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Timeline / TimelineItem', () => {
  it('默认 start 模式，li 结构渲染子项', () => {
    const wrapper = mountTimeline()
    expect(wrapper.classes()).toContain('ui-timeline')
    expect(wrapper.classes()).toContain('ui-timeline--start')
    expect(itemNodes(wrapper)).toHaveLength(2)
    expect(itemNodes(wrapper)[0].element.tagName).toBe('LI')
  })

  it('mode center / alternate 切换模式类名', () => {
    expect(mountTimeline({ mode: 'center' }).classes()).toContain('ui-timeline--center')
    expect(mountTimeline({ mode: 'alternate' }).classes()).toContain('ui-timeline--alternate')
  })

  it('reverse 挂 is-reverse', () => {
    expect(mountTimeline({ reverse: true }).classes()).toContain('is-reverse')
    expect(mountTimeline().classes()).not.toContain('is-reverse')
  })

  it('item type 落到 ui-timeline-item--*', () => {
    const wrapper = mountTimeline({}, [h(TimelineItem, { type: 'primary' }, () => 'x')])
    expect(itemNodes(wrapper)[0].classes()).toContain('ui-timeline-item--primary')
  })

  it('item size 默认 normal，可切换', () => {
    expect(itemNodes(mountTimeline({}, [h(TimelineItem, {}, () => 'x')]))[0].classes()).toContain('ui-timeline-item--size-normal')
    expect(itemNodes(mountTimeline({}, [h(TimelineItem, { size: 'large' }, () => 'x')]))[0].classes()).toContain('ui-timeline-item--size-large')
  })

  it('color 写入 --ui-timeline-dot-color 变量', () => {
    const wrapper = mountTimeline({}, [h(TimelineItem, { color: '#ff0000' }, () => 'x')])
    expect(itemNodes(wrapper)[0].attributes('style') ?? '').toContain('--ui-timeline-dot-color: #ff0000')
    expect(itemNodes(mountTimeline({}, [h(TimelineItem, {}, () => 'x')]))[0].attributes('style') ?? '').not.toContain('--ui-timeline-dot-color')
  })

  it('hollow 挂 is-hollow', () => {
    expect(itemNodes(mountTimeline({}, [h(TimelineItem, { hollow: true }, () => 'x')]))[0].classes()).toContain('is-hollow')
  })

  it('有 timestamp 时渲染时间戳节点', () => {
    const wrapper = mountTimeline({}, [h(TimelineItem, { timestamp: '2020-01-01' }, () => 'x')])
    expect(wrapper.find('.ui-timeline-item__timestamp').text()).toBe('2020-01-01')
  })

  it('hideTimestamp 移除时间戳节点', () => {
    const wrapper = mountTimeline({}, [h(TimelineItem, { timestamp: '2020', hideTimestamp: true }, () => 'x')])
    expect(wrapper.find('.ui-timeline-item__timestamp').exists()).toBe(false)
  })

  it('timestampPosition top 时时间戳排在内容之前', () => {
    const item = itemNodes(mountTimeline({}, [h(TimelineItem, { timestamp: 'T', timestampPosition: 'top' }, () => 'C')]))[0]
    expect(item.classes()).toContain('is-timestamp-top')
    expect(item.element.children[0].className).toContain('__timestamp')
    expect(item.element.children[1].className).toContain('__content')
  })

  it('默认时间戳在内容下方并挂 is-timestamp-bottom', () => {
    const item = itemNodes(mountTimeline({}, [h(TimelineItem, { timestamp: 'T' }, () => 'C')]))[0]
    expect(item.classes()).toContain('is-timestamp-bottom')
    expect(item.element.children[0].className).toContain('__content')
  })

  it('内容默认插槽渲染到 content 区', () => {
    const wrapper = mountTimeline({}, [h(TimelineItem, {}, () => h('b', { class: 'inner-body' }, '正文'))])
    expect(wrapper.find('.ui-timeline-item__content .inner-body').text()).toBe('正文')
  })

  it('无 timestamp 时不渲染时间戳节点', () => {
    expect(mountTimeline({}, [h(TimelineItem, {}, () => 'x')]).find('.ui-timeline-item__timestamp').exists()).toBe(false)
  })

  it('无子项时容器为空', () => {
    expect(itemNodes(mountTimeline({}, []))).toHaveLength(0)
  })

  it('class 透传与基类名共存', () => {
    expect(mountTimeline({ class: 'my-line' }).classes()).toEqual(expect.arrayContaining(['ui-timeline', 'my-line']))
  })
})
