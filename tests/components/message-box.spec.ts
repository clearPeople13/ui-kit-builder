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

// happy-dom 没有布局引擎，offsetWidth 恒为 0，焦点陷阱的可见性判定会全部落空；
// 与 dialog.spec.ts 同法：只在测试内让原型返回非零尺寸，断言对象仍是"焦点落在哪个元素"
const proto = window.HTMLElement.prototype
let originalOffsetWidth: PropertyDescriptor | undefined

function mountBox(props: Record<string, any> = {}) {
  const wrapper = mount(MessageBox, {
    props: { modelValue: true, ...props },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function mountClosed(props: Record<string, any> = {}) {
  const wrapper = mount(MessageBox, {
    props: { modelValue: false, ...props },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function forget(wrapper: ReturnType<typeof mount>) {
  const index = mounted.indexOf(wrapper)
  if (index >= 0) {
    mounted.splice(index, 1)
  }
}

function applyFocusableWidth() {
  Object.defineProperty(proto, 'offsetWidth', { configurable: true, get: () => 100 })
}

function press(target: Window | Element | null | undefined, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target?.dispatchEvent(event)
  return event
}

async function flush() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function click(selector: string) {
  const el = document.querySelector(selector)
  if (!el) {
    throw new Error(`未找到 ${selector}`)
  }
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

function opener() {
  const button = document.createElement('button')
  button.className = 'opener'
  document.body.appendChild(button)
  button.focus()
  return button
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
  originalOffsetWidth = Object.getOwnPropertyDescriptor(proto, 'offsetWidth')
  applyFocusableWidth()
})

afterEach(async () => {
  while (mounted.length) {
    const wrapper = mounted.pop()
    await wrapper?.unmount()
  }
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
  if (originalOffsetWidth) {
    Object.defineProperty(proto, 'offsetWidth', originalOffsetWidth)
  }
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

  it('输入模式：受控回写 input-value-change，校验失败展示错误', async () => {
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
    expect(wrapper.emitted('input-value-change')?.[0]).toEqual(['abc'])
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
    forget(wrapper)
    expect(mask()).toBeNull()
    expect(panel()).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('标题存在时用 aria-labelledby 锚定标题节点', async () => {
    mountBox({ title: '确认操作' })
    await nextTick()
    const title = document.querySelector('.ui-message-box__title') as HTMLElement
    expect(title.id).toMatch(/^ui-message-box-title-\d+$/)
    expect(panel()?.getAttribute('aria-labelledby')).toBe(title.id)
    expect(panel()?.getAttribute('aria-modal')).toBe('true')
  })

  it('无标题时省略 aria-labelledby 与标题 id', async () => {
    mountBox({ message: '正文' })
    await nextTick()
    const title = document.querySelector('.ui-message-box__title') as HTMLElement
    expect(title.hasAttribute('id')).toBe(false)
    expect(panel()?.getAttribute('aria-labelledby')).toBeNull()
  })

  it('打开时记录触发元素并把焦点送到首个可聚焦节点', async () => {
    const trigger = opener()
    const wrapper = mountClosed()
    await nextTick()
    expect(panel()).toBeNull()
    await wrapper.setProps({ modelValue: true })
    await flush()
    expect(document.activeElement).toBe(document.querySelector('.ui-message-box__close'))
    expect(document.activeElement).not.toBe(trigger)
  })

  it('showClose=false 时初始焦点落在确认按钮', async () => {
    mountBox({ showClose: false, title: '提示' })
    await flush()
    expect(document.activeElement).toBe(document.querySelector('.ui-message-box__button.is-primary'))
  })

  it('Tab 在末位回卷首位，Shift+Tab 在首位回卷末位', async () => {
    mountBox({ showCancelButton: true })
    await flush()
    const close = document.querySelector('.ui-message-box__close') as HTMLElement
    const confirm = document.querySelector('.ui-message-box__button.is-primary') as HTMLElement
    confirm.focus()
    const forward = press(window, 'Tab')
    expect(forward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(close)
    close.focus()
    const backward = press(window, 'Tab', { shiftKey: true })
    expect(backward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(confirm)
  })

  it('焦点在面板外时 Tab 被拉回面板首位', async () => {
    mountBox()
    await flush()
    const outside = opener()
    expect(document.activeElement).toBe(outside)
    const event = press(window, 'Tab')
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(document.querySelector('.ui-message-box__close'))
  })

  it('面板中间的 Tab 不拦截，留给浏览器默认行为', async () => {
    mountBox({ showCancelButton: true })
    await flush()
    const cancel = document.querySelector('.ui-message-box__button.is-cancel') as HTMLElement
    cancel.focus()
    const event = press(window, 'Tab')
    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(cancel)
  })

  it('关闭后焦点归还触发元素', async () => {
    const trigger = opener()
    const wrapper = mountClosed()
    await wrapper.setProps({ modelValue: true })
    await flush()
    await wrapper.setProps({ modelValue: false })
    await flush()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('打开期间卸载同样归还焦点', async () => {
    const trigger = opener()
    const wrapper = mountClosed()
    await wrapper.setProps({ modelValue: true })
    await flush()
    wrapper.unmount()
    forget(wrapper)
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('关闭态下的 Tab 与无关按键都不接管', async () => {
    mountClosed()
    await nextTick()
    expect(press(window, 'Tab').defaultPrevented).toBe(false)
    expect(press(window, 'a').defaultPrevented).toBe(false)
  })

  it('没有可见可聚焦元素时焦点与 Tab 都落在面板本身', async () => {
    Object.defineProperty(proto, 'offsetWidth', { configurable: true, get: () => 0 })
    mountBox({ title: '提示' })
    await flush()
    expect(document.activeElement).toBe(panel())
    const event = press(window, 'Tab')
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(panel())
  })
})
