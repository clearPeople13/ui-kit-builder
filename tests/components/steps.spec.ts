import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Step, Steps } from '@ui-kit-full'

function mountSteps(
  props: Record<string, any> = {},
  steps: any = [h(Step, { title: '甲', description: '说明甲' }), h(Step, { title: '乙' }), h(Step, { title: '丙' })]
) {
  return mount(Steps, { props, slots: { default: () => steps }, attachTo: document.body })
}

function stepNodes(wrapper: ReturnType<typeof mountSteps>) {
  return wrapper.findAll('.ui-step')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Steps / Step', () => {
  it('默认水平布局并包裹列表容器', () => {
    const wrapper = mountSteps()
    expect(wrapper.classes()).toContain('ui-steps')
    expect(wrapper.classes()).toContain('is-horizontal')
    expect(wrapper.find('.ui-steps__list').exists()).toBe(true)
    expect(stepNodes(wrapper)).toHaveLength(3)
  })

  it('direction vertical 切换类名', () => {
    expect(mountSteps({ direction: 'vertical' }).classes()).toContain('is-vertical')
  })

  it('simple / alignCenter 挂对应类名', () => {
    expect(mountSteps({ simple: true }).classes()).toContain('is-simple')
    expect(mountSteps({ alignCenter: true }).classes()).toContain('is-align-center')
  })

  it('space 数字换算为 gap，字符串原样', () => {
    expect(mountSteps({ space: 20 }).attributes('style') ?? '').toContain('gap: 20px')
    expect(mountSteps({ space: '2rem' }).attributes('style') ?? '').toContain('gap: 2rem')
    expect(mountSteps().attributes('style') ?? '').not.toContain('gap')
  })

  it('active 之前的步骤为 finish、当前为 process、之后为 wait', () => {
    const classes = stepNodes(mountSteps({ active: 1 })).map((node) => node.classes())
    expect(classes[0]).toContain('is-finish')
    expect(classes[1]).toContain('is-process')
    expect(classes[2]).toContain('is-wait')
  })

  it('finishStatus / processStatus 覆盖状态类名', () => {
    const classes = stepNodes(mountSteps({ active: 1, finishStatus: 'success', processStatus: 'warning' })).map(
      (node) => node.classes()
    )
    expect(classes[0]).toContain('is-success')
    expect(classes[1]).toContain('is-warning')
  })

  it('Step 显式 status 优先于按 active 推导', () => {
    const wrapper = mountSteps({ active: 0 }, [h(Step, { title: '甲', status: 'error' })])
    expect(stepNodes(wrapper)[0].classes()).toContain('is-error')
  })

  it('标题与描述渲染到独立节点', () => {
    const first = stepNodes(mountSteps())[0]
    expect(first.find('.ui-step__title').text()).toBe('甲')
    expect(first.find('.ui-step__description').text()).toBe('说明甲')
  })

  it('title 插槽覆盖标题文本', () => {
    const wrapper = mountSteps({}, [h(Step, { title: '原' }, { title: () => h('b', '插槽标题') })])
    expect(wrapper.find('.ui-step__title').text()).toBe('插槽标题')
  })

  it('description 插槽覆盖描述文本', () => {
    const wrapper = mountSteps({}, [
      h(Step, { description: '原说明' }, { description: () => h('em', { class: 'my-desc' }, '插槽说明') })
    ])
    expect(wrapper.find('.ui-step__description .my-desc').text()).toBe('插槽说明')
  })

  it('未传 title / description 插槽时回退到同名属性', () => {
    const first = stepNodes(mountSteps())[0]
    expect(first.find('.ui-step__title').text()).toBe('甲')
    expect(first.find('.ui-step__description').text()).toBe('说明甲')
  })

  it('finish 步骤默认显示对勾图标', () => {
    const wrapper = mountSteps({ active: 1 })
    expect(wrapper.findAll('.ui-step')[0].find('svg').exists()).toBe(true)
  })

  it('非完成步骤显示序号文本', () => {
    const wrapper = mountSteps({ active: 0 })
    expect(wrapper.findAll('.ui-step')[0].find('.ui-step__icon').text()).toBe('1')
  })

  it('icon 属性渲染自定义图标并挂 ui-steps--icons 类名', () => {
    const wrapper = mountSteps({}, [h(Step, { title: '甲', icon: h('i', { class: 'my-icon' }) })])
    const node = stepNodes(wrapper)[0]
    expect(node.find('.my-icon').exists()).toBe(true)
    expect(node.classes()).toContain('ui-steps--icons')
  })

  it('每个步骤都带连接线节点', () => {
    expect(stepNodes(mountSteps()).every((node) => node.find('.ui-step__line').exists())).toBe(true)
  })

  it('无子步骤时列表为空', () => {
    expect(stepNodes(mountSteps({}, []))).toHaveLength(0)
  })

  it('class 透传与基类名共存', () => {
    expect(mountSteps({ class: 'my-steps' }).classes()).toEqual(expect.arrayContaining(['ui-steps', 'my-steps']))
  })
})
