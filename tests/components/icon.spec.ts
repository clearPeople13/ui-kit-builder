import { h, markRaw } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Icon } from '@ui-kit-full'

function mountIcon(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Icon, { props, slots })
}

function styleOf(wrapper: ReturnType<typeof mountIcon>) {
  return wrapper.attributes('style') || ''
}

describe('Icon 图标', () => {
  it('缺省渲染空 <i> 且隐藏于无障碍树', () => {
    const wrapper = mountIcon()
    expect(wrapper.element.tagName).toBe('I')
    expect(wrapper.classes()).toContain('ui-icon')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('name 命中内置图标渲染对应 svg', () => {
    const wrapper = mountIcon({ name: 'close' })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('svg').classes()).toContain('lucide-x')
  })

  it('icon 字符串名优先于 name', () => {
    const wrapper = mountIcon({ icon: 'check', name: 'close' })
    expect(wrapper.find('svg').classes()).toContain('lucide-check')
  })

  it('未知 name 回退空 <i>', () => {
    const wrapper = mountIcon({ name: 'not-a-real-icon' })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.classes()).toContain('ui-icon')
  })

  it('icon 传入组件时直接渲染并接收 1em 尺寸', () => {
    const MyIcon = {
      props: ['size'],
      setup(props: { size?: string }) {
        return () => h('span', { class: 'my-icon', 'data-size': props.size })
      }
    }
    const wrapper = mountIcon({ icon: markRaw(MyIcon) })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.find('.my-icon').exists()).toBe(true)
    expect(wrapper.find('.my-icon').attributes('data-size')).toBe('1em')
  })

  it('size 为数字按 px 落到宽高与字号', () => {
    const style = styleOf(mountIcon({ name: 'close', size: 24 }))
    expect(style).toContain('width: 24px')
    expect(style).toContain('height: 24px')
    expect(style).toContain('font-size: 24px')
  })

  it('size 为纯数字字符串同样补 px', () => {
    expect(styleOf(mountIcon({ name: 'close', size: '16' }))).toContain('width: 16px')
  })

  it('size 为带单位字符串原样透传', () => {
    expect(styleOf(mountIcon({ name: 'close', size: '2em' }))).toContain('width: 2em')
  })

  it('未传 size 不落宽高样式', () => {
    expect(styleOf(mountIcon({ name: 'close' }))).not.toContain('width')
  })

  it('color 落到 style，缺省不落', () => {
    expect(styleOf(mountIcon({ name: 'close', color: 'red' }))).toContain('color: red')
    expect(styleOf(mountIcon({ name: 'close' }))).not.toContain('color')
  })

  it('spinning 切换 is-loading 类名', () => {
    expect(mountIcon({ name: 'close', spinning: true }).classes()).toContain('is-loading')
    expect(mountIcon({ name: 'close' }).classes()).not.toContain('is-loading')
    expect(mountIcon({ name: 'close', spinning: false }).classes()).not.toContain('is-loading')
  })

  it('strokeWidth 缺省为 2 落在内层 svg', () => {
    expect(mountIcon({ name: 'close' }).find('svg').attributes('stroke-width')).toBe('2')
  })

  it('strokeWidth 自定义落在内层 svg', () => {
    expect(mountIcon({ name: 'close', strokeWidth: 3 }).find('svg').attributes('stroke-width')).toBe('3')
  })

  it('内层 svg 尺寸恒为 1em 与外层 size 解耦', () => {
    const wrapper = mountIcon({ name: 'close', size: 48 })
    expect(wrapper.find('svg').attributes('width')).toBe('1em')
    expect(styleOf(wrapper)).toContain('width: 48px')
  })

  it('默认插槽覆盖内置图标内容', () => {
    const wrapper = mountIcon({}, { default: () => h('b', { class: 'slot-icon' }) })
    expect(wrapper.find('.slot-icon').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
