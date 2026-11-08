import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Tour, TourStep } from '@ui-kit-full'

// happy-dom 没有真实布局：目标元素 getBoundingClientRect 恒为 0×0，浮层坐标 / 高亮包围盒
// 属于浏览器层断言（归 tests/browser/**）。本文件覆盖：展开收起与传送门、步骤注册聚合、
// 导航事件、关闭路径（按钮 / Escape）、current 夹取、遮罩开关与颜色、placement / type 类名、
// zIndex 与 contentStyle 落盘、插槽体系、滚动定位的调用与否。
const mounted: ReturnType<typeof mount>[] = []

interface StepSpec {
  props?: Record<string, any>
  slots?: Record<string, any>
}

function mountKit(options: { props?: Record<string, any>; steps?: StepSpec[]; slots?: Record<string, any> } = {}) {
  const parent = defineComponent({
    render() {
      const childSlots: Record<string, any> = { ...(options.slots ?? {}) }
      if (options.steps) {
        childSlots.default = () => options.steps!.map((step) => h(TourStep, step.props ?? {}, step.slots ?? {}))
      }
      return h(Tour, { modelValue: true, ...options.props }, childSlots)
    }
  })
  const wrapper = mount(parent, { attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

async function openKit(options: Parameters<typeof mountKit>[0] = {}) {
  const wrapper = mountKit(options)
  await nextTick()
  await nextTick()
  return wrapper
}

function tourOf(wrapper: ReturnType<typeof mount>) {
  return wrapper.findComponent(Tour)
}

function panel(): HTMLElement | null {
  return document.querySelector('.ui-tour__panel')
}

function textOf(selector: string): string | null {
  return document.querySelector(selector)?.textContent ?? null
}

function actions(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('.ui-tour__action'))
}

function action(label: string): HTMLButtonElement | undefined {
  return actions().find((button) => button.textContent === label)
}

function pressEscape() {
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
}

function addTarget(id: string) {
  const element = document.createElement('div')
  element.id = id
  document.body.appendChild(element)
  return element
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
})

describe('Tour 漫游式引导', () => {
  it('未展开时带 is-hidden 原地渲染，特性类名齐全', () => {
    const wrapper = mountKit({ props: { modelValue: false } })
    expect(wrapper.element.classList.contains('ui-tour')).toBe(true)
    expect(wrapper.classes()).toEqual([
      'ui-tour',
      'is-hidden',
      'is-closable',
      'ui-tour--popper',
      'ui-tour--validate',
      'ui-tour--modal'
    ])
    // 收起态面板常驻 DOM，由 .is-hidden 的 display:none 兜底
    expect(wrapper.find('.ui-tour__panel').exists()).toBe(true)
  })

  it('modelValue 为 true 时整块传送到 body 且不再有 is-hidden', async () => {
    await openKit()
    const root = document.body.querySelector('.ui-tour')
    expect(root).not.toBeNull()
    expect(root!.classList.contains('is-hidden')).toBe(false)
  })

  it('步骤模式：注册聚合进隐藏容器，面板呈现首步内容与页脚', async () => {
    await openKit({
      steps: [
        { props: { title: '第一步', description: '说明一' } },
        { props: { title: '第二步', description: '说明二' } }
      ]
    })
    const holder = document.querySelector('.ui-tour__steps')
    expect(holder).not.toBeNull()
    expect((holder as HTMLElement).style.display).toBe('none')
    expect(holder!.querySelectorAll('.ui-tour-step')).toHaveLength(2)
    expect(textOf('.ui-tour__panel__title')).toBe('第一步')
    expect(panel()!.querySelector('.ui-tour__panel__body')!.textContent).toBe('说明一')
    expect(textOf('.ui-tour__progress')).toBe('1 / 2')
    expect(action('下一步')).toBeTruthy()
    expect(action('上一步')).toBeUndefined()
    expect(action('完成')).toBeUndefined()
  })

  it('点下一步抛 current-change，页脚按钮随之切换', async () => {
    const wrapper = await openKit({
      steps: [{ props: { title: '甲', description: '一' } }, { props: { title: '乙', description: '二' } }]
    })
    action('下一步')!.click()
    await nextTick()
    const tour = tourOf(wrapper)
    expect(tour.emitted('current-change')).toEqual([[1]])
    expect(textOf('.ui-tour__progress')).toBe('2 / 2')
    expect(textOf('.ui-tour__panel__title')).toBe('乙')
    expect(action('上一步')).toBeTruthy()
    expect(action('完成')).toBeTruthy()
  })

  it('最后一步点完成抛 finish / close 与 update:modelValue false', async () => {
    const wrapper = await openKit({ steps: [{ props: { title: '独一步' } }] })
    action('完成')!.click()
    await nextTick()
    const tour = tourOf(wrapper)
    expect(tour.emitted('update:modelValue')).toEqual([[false]])
    expect(tour.emitted('close')).toEqual([[]])
    expect(tour.emitted('finish')).toEqual([[]])
  })

  it('点关闭按钮抛 close 与 update:modelValue false，但不抛 finish', async () => {
    const wrapper = await openKit({ steps: [{ props: { title: '甲' } }] })
    ;(document.querySelector('.ui-tour__panel__close') as HTMLButtonElement).click()
    await nextTick()
    const tour = tourOf(wrapper)
    expect(tour.emitted('close')).toEqual([[]])
    expect(tour.emitted('update:modelValue')).toEqual([[false]])
    expect(tour.emitted('finish')).toBeUndefined()
  })

  it('导航与关闭文案来自 ConfigProvider 注入的 locale，未注入键回退中文', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: { tour: { next: 'Next' } } },
      slots: {
        default: () =>
          h(
            Tour,
            { modelValue: true },
            {
              default: () => [h(TourStep, { title: '甲' }), h(TourStep, { title: '乙' })]
            }
          )
      },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await nextTick()
    await nextTick()
    expect(document.querySelector('.ui-tour__panel__close')?.getAttribute('aria-label')).toBe('关闭引导')
    expect(action('Next')).toBeTruthy()
    action('Next')!.click()
    await nextTick()
    expect(action('完成')).toBeTruthy()
  })

  it('showClose 为 false 去掉关闭按钮与 closable 特性类；closeIcon 可自定义', async () => {
    const off = await openKit({ props: { showClose: false }, steps: [{ props: { title: '甲' } }] })
    expect(off.find('.ui-tour__panel__close').exists()).toBe(false)
    expect(document.querySelector('.ui-tour')!.classList.contains('is-closable')).toBe(false)
    while (mounted.length) {
      mounted.pop()!.unmount()
    }
    document.body.innerHTML = ''
    await openKit({ props: { closeIcon: 'star' }, steps: [{ props: { title: '甲' } }] })
    expect(document.querySelector('.ui-tour__panel__close svg')!.classList.contains('lucide-star')).toBe(true)
  })

  it('步骤级 showClose false 覆盖 Tour 缺省；步骤级 type 覆盖面板配色类', async () => {
    await openKit({
      props: { type: 'primary' },
      steps: [{ props: { title: '甲', showClose: false, type: 'default' } }]
    })
    expect(document.querySelector('.ui-tour__panel__close')).toBeNull()
    expect(panel()!.classList.contains('is-type-default')).toBe(true)
    expect(document.querySelector('.ui-tour')!.classList.contains('ui-tour--primary')).toBe(true)
  })

  it('Escape 默认收起：抛 close 与 update:modelValue false', async () => {
    const wrapper = await openKit({ steps: [{ props: { title: '甲' } }] })
    pressEscape()
    await nextTick()
    const tour = tourOf(wrapper)
    expect(tour.emitted('close')).toEqual([[]])
    expect(tour.emitted('update:modelValue')).toEqual([[false]])
  })

  it('closeOnPressEscape 为 false 或面板收起时 Escape 不响应', async () => {
    const wrapper = await openKit({ props: { closeOnPressEscape: false }, steps: [{ props: { title: '甲' } }] })
    pressEscape()
    await nextTick()
    expect(tourOf(wrapper).emitted('close')).toBeUndefined()
    while (mounted.length) {
      mounted.pop()!.unmount()
    }
    document.body.innerHTML = ''
    const closed = mountKit({ props: { modelValue: false } })
    pressEscape()
    await nextTick()
    expect(tourOf(closed).emitted('close')).toBeUndefined()
  })

  it('current 越界夹到首末步：9 落最后一步，-5 落第一步', async () => {
    const steps: StepSpec[] = [{ props: { title: '甲' } }, { props: { title: '乙' } }]
    await openKit({ props: { current: 9 }, steps })
    expect(textOf('.ui-tour__progress')).toBe('2 / 2')
    expect(textOf('.ui-tour__panel__title')).toBe('乙')
    while (mounted.length) {
      mounted.pop()!.unmount()
    }
    document.body.innerHTML = ''
    await openKit({ props: { current: -5 }, steps })
    expect(textOf('.ui-tour__progress')).toBe('1 / 2')
    expect(textOf('.ui-tour__panel__title')).toBe('甲')
  })

  it('mask 为 false 时遮罩节点消失；对象 mask 把颜色写进高亮投影', async () => {
    const bare = await openKit({ props: { mask: false }, steps: [{ props: { title: '甲' } }] })
    expect(bare.find('.ui-tour__mask').exists()).toBe(false)
    while (mounted.length) {
      mounted.pop()!.unmount()
    }
    document.body.innerHTML = ''
    addTarget('tour-mask-target')
    await openKit({
      props: { mask: { color: 'rgb(9, 9, 9)' } },
      steps: [{ props: { title: '甲', target: '#tour-mask-target' } }]
    })
    const highlight = document.querySelector('.ui-tour__highlight') as HTMLElement
    expect(highlight).not.toBeNull()
    expect(highlight.getAttribute('style')).toContain('rgb(9, 9, 9)')
    expect(document.querySelector('.ui-tour__mask')).toBeNull()
  })

  it('步骤级 mask false 时高亮改用虚线描边而非投影', async () => {
    addTarget('tour-step-mask')
    await openKit({ steps: [{ props: { title: '甲', target: '#tour-step-mask', mask: false } }] })
    const highlight = document.querySelector('.ui-tour__highlight') as HTMLElement
    expect(highlight).not.toBeNull()
    expect(highlight.getAttribute('style')).toContain('outline')
    expect(highlight.getAttribute('style')).not.toContain('box-shadow')
  })

  it('placement：Tour 级落面板类名，步骤级覆盖 Tour 级', async () => {
    await openKit({ props: { placement: 'top' }, steps: [{ props: { title: '甲', placement: 'right' } }] })
    expect(panel()!.classList.contains('is-placement-right')).toBe(true)
    while (mounted.length) {
      mounted.pop()!.unmount()
    }
    document.body.innerHTML = ''
    await openKit({ props: { placement: 'top' }, steps: [{ props: { title: '甲' } }] })
    expect(panel()!.classList.contains('is-placement-top')).toBe(true)
    expect(panel()!.classList.contains('is-placement-bottom')).toBe(false)
  })

  it('zIndex 落根节点样式，contentStyle 落面板且步骤级覆盖 Tour 级', async () => {
    await openKit({
      props: { zIndex: 3000, contentStyle: { padding: '12px' } },
      steps: [{ props: { title: '甲', contentStyle: { padding: '20px' } } }]
    })
    expect((document.querySelector('.ui-tour') as HTMLElement).getAttribute('style')).toContain('z-index: 3000')
    expect(panel()!.getAttribute('style')).toContain('padding: 20px')
    while (mounted.length) {
      mounted.pop()!.unmount()
    }
    document.body.innerHTML = ''
    await openKit({ props: { contentStyle: { padding: '12px' } }, steps: [{ props: { title: '甲' } }] })
    expect(panel()!.getAttribute('style')).toContain('padding: 12px')
  })

  it('无步骤时是单面板模式：默认 / header / footer 插槽各得其所', async () => {
    await openKit({ slots: { default: () => '面板正文', header: () => '面板标题', footer: () => '面板页脚' } })
    expect(document.querySelector('.ui-tour__steps')).toBeNull()
    expect(textOf('.ui-tour__panel__title')).toBe('面板标题')
    expect(panel()!.querySelector('.ui-tour__panel__body')!.textContent).toBe('面板正文')
    expect(textOf('.ui-tour__panel__footer')).toBe('面板页脚')
    expect(document.querySelector('.ui-tour__progress')).toBeNull()
  })

  it('步骤的默认与 footer 插槽分别接管正文和页脚', async () => {
    await openKit({
      steps: [{ props: { title: '甲' }, slots: { default: () => '步骤正文', footer: () => '步骤页脚' } }]
    })
    expect(panel()!.querySelector('.ui-tour__panel__body')!.textContent).toBe('步骤正文')
    expect(textOf('.ui-tour__panel__footer')).toBe('步骤页脚')
    expect(document.querySelector('.ui-tour__progress')).toBeNull()
    expect(action('下一步')).toBeUndefined()
  })

  it('slot 契约：header 缺省回退步骤 title，footer 缺省由内置进度与导航接管', async () => {
    await openKit({ steps: [{ props: { title: '步骤标题' } }] })
    expect(textOf('.ui-tour__panel__title')).toBe('步骤标题')
    expect(textOf('.ui-tour__progress')).toBe('1 / 1')
    expect(action('完成')).toBeTruthy()
  })

  it('目标可解析时渲染高亮与箭头，showArrow false 只去箭头', async () => {
    addTarget('tour-arrow-target')
    await openKit({ steps: [{ props: { title: '甲', target: '#tour-arrow-target' } }] })
    expect(document.querySelector('.ui-tour__highlight')).not.toBeNull()
    expect(document.querySelector('.ui-tour__arrow')).not.toBeNull()
    expect(document.querySelector('.ui-tour__mask')).toBeNull()
    while (mounted.length) {
      mounted.pop()!.unmount()
    }
    document.body.innerHTML = ''
    addTarget('tour-arrow-target')
    await openKit({ props: { showArrow: false }, steps: [{ props: { title: '甲', target: '#tour-arrow-target' } }] })
    expect(document.querySelector('.ui-tour__highlight')).not.toBeNull()
    expect(document.querySelector('.ui-tour__arrow')).toBeNull()
  })

  it('scrollIntoView：缺省以居中选项调用目标，false 关闭调用', async () => {
    const target = addTarget('tour-scroll-target')
    const spy = vi.fn()
    ;(target as unknown as { scrollIntoView: typeof spy }).scrollIntoView = spy
    await openKit({ steps: [{ props: { title: '甲', target: '#tour-scroll-target' } }] })
    expect(spy).toHaveBeenCalledWith({ block: 'center', inline: 'nearest' })
    while (mounted.length) {
      mounted.pop()!.unmount()
    }
    document.body.innerHTML = ''
    const silent = addTarget('tour-scroll-off')
    const silentSpy = vi.fn()
    ;(silent as unknown as { scrollIntoView: typeof silentSpy }).scrollIntoView = silentSpy
    await openKit({
      props: { scrollIntoViewOptions: false },
      steps: [{ props: { title: '甲', target: '#tour-scroll-off' } }]
    })
    expect(silentSpy).not.toHaveBeenCalled()
  })

  it('scrollIntoViewOptions 对象与步骤级设置合并进调用参数', async () => {
    const target = addTarget('tour-scroll-merge')
    const spy = vi.fn()
    ;(target as unknown as { scrollIntoView: typeof spy }).scrollIntoView = spy
    await openKit({
      props: { scrollIntoViewOptions: { behavior: 'smooth' } },
      steps: [{ props: { title: '甲', target: '#tour-scroll-merge' } }]
    })
    expect(spy).toHaveBeenCalledWith({ block: 'center', inline: 'nearest', behavior: 'smooth' })
  })

  it('TourStep 脱离 Tour 独立渲染时回退插槽 / 描述 / 标题', () => {
    const slotted = mount(TourStep, {
      props: { title: '标题位', description: '描述位' },
      slots: { default: () => '插槽内容' }
    })
    expect(slotted.text()).toBe('插槽内容')
    expect(slotted.classes()).toEqual(['ui-tour-step', 'ui-tour-step--popper', 'ui-tour-step--validate'])
    expect(mount(TourStep, { props: { description: '仅描述' } }).text()).toBe('仅描述')
    expect(mount(TourStep, { props: { title: '仅标题' } }).text()).toBe('仅标题')
  })
})
