import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Divider } from '@ui-kit-full'

function mountDivider(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Divider, { props, slots })
}

function text(wrapper: ReturnType<typeof mountDivider>) {
  return wrapper.find('.ui-divider__text')
}

describe('Divider 分割线', () => {
  it('缺省为水平居中且无文案', () => {
    const wrapper = mountDivider()
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('ui-divider')
    expect(wrapper.classes()).toContain('is-horizontal')
    expect(wrapper.classes()).toContain('is-content-center')
    expect(text(wrapper).exists()).toBe(false)
  })

  it('direction vertical 切换方向类名', () => {
    expect(mountDivider({ direction: 'vertical' }).classes()).toContain('is-vertical')
  })

  it('未知 direction 原样落类名', () => {
    expect(mountDivider({ direction: 'diagonal' }).classes()).toContain('is-diagonal')
  })

  it('direction 空串回退水平', () => {
    expect(mountDivider({ direction: '' }).classes()).toContain('is-horizontal')
  })

  it('contentPosition 三档映射', () => {
    expect(mountDivider({ contentPosition: 'left' }).classes()).toContain('is-content-left')
    expect(mountDivider({ contentPosition: 'right' }).classes()).toContain('is-content-right')
    expect(mountDivider({ contentPosition: 'center' }).classes()).toContain('is-content-center')
  })

  it('borderStyle 落到 CSS 变量', () => {
    expect(mountDivider({ borderStyle: 'dashed' }).attributes('style')).toContain('--ui-divider-border-style: dashed')
    expect(mountDivider({ borderStyle: 'dotted' }).attributes('style')).toContain('--ui-divider-border-style: dotted')
  })

  it('borderStyle 缺省回退 solid', () => {
    expect(mountDivider({ borderStyle: '' }).attributes('style')).toContain('--ui-divider-border-style: solid')
  })

  it('content 属性渲染文案节点', () => {
    const wrapper = mountDivider({ content: '或' })
    expect(text(wrapper).exists()).toBe(true)
    expect(text(wrapper).text()).toBe('或')
  })

  it('默认插槽优先于 content 属性', () => {
    const wrapper = mountDivider({ content: '属性文案' }, { default: () => '插槽文案' })
    expect(text(wrapper).text()).toBe('插槽文案')
  })

  it('空内容不渲染文案节点', () => {
    expect(mountDivider({ content: '' }).find('.ui-divider__text').exists()).toBe(false)
  })

  it('文案节点是 span', () => {
    expect(text(mountDivider({ content: '中间文字' })).element.tagName).toBe('SPAN')
  })

  it('超长文案完整保留', () => {
    const long = '分隔'.repeat(30)
    expect(text(mountDivider({ content: long })).text()).toBe(long)
  })

  it('竖向分割线仍可带方向与文案', () => {
    const wrapper = mountDivider({ direction: 'vertical', content: 'V' })
    expect(wrapper.classes()).toContain('is-vertical')
    expect(text(wrapper).text()).toBe('V')
  })

  it('样式变量与类名同时落在根节点', () => {
    const wrapper = mountDivider({ direction: 'vertical', borderStyle: 'dashed' })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-divider', 'is-vertical', 'is-content-center']))
    expect(wrapper.attributes('style')).toContain('--ui-divider-border-style: dashed')
  })
})
