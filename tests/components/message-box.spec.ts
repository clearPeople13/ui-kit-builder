import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageBox } from '@ui-kit-full'

// MessageBox 打开时把遮罩+面板 teleport 到 body，wrapper 根节点只剩传送门注释；
// Escape 监听挂在 document（不是 window），断言需按事件实际挂载点派发
function mask() {
  return document.querySelector('.ui-message-box__mask')
}

function panel() {
  return document.querySelector('.ui-message-box__panel') as HTMLElement | null
}

const mounted: Array<ReturnType<typeof mount>> = []

function mountBox(props: Record<string, any> = {}) {
  const wrapper = mount(MessageBox, {
    props: { modelValue: true, ...props },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

async function click(selector: string) {
  const el = document.querySelector(selector)
  if (!el) {
    throw new Error(`未找到 ${selector}`)
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

describe('MessageBox', () => {
  it('关闭时不渲染遮罩与面板', () => {
    const wrapper = mount(MessageBox, { props: { modelValue: false } })
    expect(wrapper.classes()).toContain('ui-message-box')
    expect(mask()).toBeNull()
    expect(panel()).toBeNull()
  })

  it('打开时渲染遮罩、对话框与标题正文', async () => {
    mountBox({ title: '确认操作', message: '真的要继续吗' })
    await nextTick()
    expect(mask()).not.toBeNull()
    expect(panel()?.getAttribute('role')).toBe('dialog')
    expect(panel()?.getAttribute('aria-modal')).toBe('true')
    expect(document.querySelector('.ui-message-box__title')?.textContent).toBe('确认操作')
    expect(document.querySelector('.ui-message-box__message')?.textContent).toBe('真的要继续吗')
  })

  it('默认只有确定按钮，showCancelButton 开启取消', async () => {
    const wrapper = mountBox()
    await nextTick()
    expect(document.querySelector('.ui-message-box__button.is-primary')?.textContent).toBe('确定')
    expect(document.querySelector('.ui-message-box__button.is-cancel')).toBeNull()
    await wrapper.setProps({ showCancelButton: true, cancelButtonText: '算了' })
    expect(document.querySelector('.ui-message-box__button.is-cancel')?.textContent).toBe('算了')
  })

  it('确认事件序列：update:modelValue、close(动作) 与 confirm', async () => {
    const wrapper = mountBox()
    await nextTick()
    await click('.ui-message-box__button.is-primary')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')?.[0]).toEqual(['confirm'])
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('取消事件序列与自定义按钮文案', async () => {
    const wrapper = mountBox({ showCancelButton: true, confirmButtonText: '好的', cancelButtonText: '不了' })
    await nextTick()
    expect(document.querySelector('.ui-message-box__button.is-primary')?.textContent).toBe('好的')
    await click('.ui-message-box__button.is-cancel')
    expect(wrapper.emitted('close')?.[0]).toEqual(['cancel'])
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('右上角关闭按钮抛两路 close（动作 + 事件本体）', async () => {
    const wrapper = mountBox()
    await nextTick()
    await click('.ui-message-box__close')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(2)
    expect(wrapper.emitted('close')?.[0]).toEqual(['close'])
  })

  it('showClose=false 隐藏关闭图标', async () => {
    mountBox({ showClose: false, title: 'T' })
    await nextTick()
    expect(document.querySelector('.ui-message-box__close')).toBeNull()
  })

  it('点击遮罩关闭，closeOnClickModal=false 时无效', async () => {
    const wrapper = mountBox()
    await nextTick()
    await click('.ui-message-box__mask')
    expect(wrapper.emitted('close')?.[0]).toEqual(['close'])

    const kept = mountBox({ closeOnClickModal: false })
    await nextTick()
    await click('.ui-message-box__mask')
    expect(kept.emitted('update:modelValue')).toBeUndefined()
  })

  it('document 上的 Escape 关闭并可禁用', async () => {
    const wrapper = mountBox()
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('close')?.[0]).toEqual(['close'])

    const kept = mountBox({ closeOnPressEscape: false })
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(kept.emitted('close')).toBeUndefined()
  })

  it('面板 z-index 比遮罩高一层', async () => {
    mountBox()
    await nextTick()
    const maskZ = Number((mask()?.getAttribute('style') ?? '').match(/z-index:\s*(\d+)/)?.[1])
    const panelZ = Number((panel()?.getAttribute('style') ?? '').match(/z-index:\s*(\d+)/)?.[1])
    expect(maskZ).toBeGreaterThanOrEqual(2000)
    expect(panelZ).toBe(maskZ + 1)
  })

  it('center/overflow/customClass/按钮类名全部落地', async () => {
    mountBox({
      center: true,
      overflow: true,
      customClass: 'cb',
      confirmButtonClass: 'cb-confirm',
      cancelButtonClass: 'cb-cancel',
      showCancelButton: true
    })
    await nextTick()
    const root = document.querySelector('[data-v-app] .ui-message-box')!
    expect(Array.from(root.classList)).toContain('is-center')
    const classes = Array.from(panel()?.classList ?? [])
    expect(classes).toContain('cb')
    expect(classes).toContain('is-overflow')
    expect(document.querySelector('.cb-confirm')).not.toBeNull()
    expect(document.querySelector('.cb-cancel')).not.toBeNull()
  })

  it('type 生成面板语义类', async () => {
    mountBox({ type: 'warning' })
    await nextTick()
    expect(Array.from(panel()?.classList ?? [])).toContain('ui-message-box__panel--warning')
  })

  it('输入模式：受控回写 update:inputValue，校验失败展示错误', async () => {
    const validator = vi.fn((v: string) => (v ? true : '内容不能为空'))
    const wrapper = mountBox({
      showInput: true,
      inputValue: '',
      inputPlaceholder: '请输入',
      inputValidator: validator
    })
    await nextTick()
    expect(document.querySelector('.ui-message-box')?.className).toContain('has-input')
    const input = document.querySelector('.ui-message-box__input-inner') as HTMLInputElement
    expect(input.getAttribute('placeholder')).toBe('请输入')
    input.value = 'abc'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:inputValue')?.[0]).toEqual(['abc'])
    await click('.ui-message-box__button.is-primary')
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(document.querySelector('.ui-message-box__input-error')?.textContent).toBe('内容不能为空')
    // 父层回写合法值后再确认应通过
    await wrapper.setProps({ inputValue: 'abc' })
    await click('.ui-message-box__button.is-primary')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(document.querySelector('.ui-message-box__input-error')).toBeNull()
  })

  it('inputType 透传到原生 input', async () => {
    mountBox({ showInput: true, inputType: 'number' })
    await nextTick()
    expect(document.querySelector('.ui-message-box__input-inner')?.getAttribute('type')).toBe('number')
  })

  it('lockScroll 打开锁定、关闭释放，可显式解除', async () => {
    const wrapper = mountBox()
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('hidden')
    await wrapper.setProps({ modelValue: false })
    expect(document.documentElement.style.overflow).toBe('')
    mountBox({ lockScroll: false })
    await nextTick()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('teleported=false 时面板保留在组件根内', async () => {
    const wrapper = mountBox({ teleported: false })
    await nextTick()
    expect(wrapper.element.contains(document.querySelector('.ui-message-box__panel'))).toBe(true)
  })

  it('卸载后遮罩与面板全部移除', async () => {
    const wrapper = mountBox()
    await nextTick()
    wrapper.unmount()
    expect(mask()).toBeNull()
    expect(panel()).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
  })
})
