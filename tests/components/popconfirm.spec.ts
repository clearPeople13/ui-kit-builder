import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ConfigProvider, Popconfirm } from '@ui-kit-full'

// Popconfirm 属 triggerConfig 家族：收起后面板 DOM 移除（persistent=false 缺省），
// 面板 teleported 缺省 true 落在 body 上；几何坐标不在本层断言
const mounted: Array<ReturnType<typeof mount>> = []

function mountPc(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  const wrapper = mount(Popconfirm, {
    props,
    slots: { default: () => h('button', { class: 'pc-trigger' }, '删除'), ...slots },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

function panel() {
  return document.querySelector('.ui-popconfirm__panel') as HTMLElement | null
}

async function click(el: Element | null | undefined) {
  if (!el) {
    throw new Error('目标节点不存在')
  }
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

async function open(wrapper: ReturnType<typeof mount>) {
  await click(wrapper.element.querySelector('.ui-popconfirm__trigger'))
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(async () => {
  while (mounted.length) {
    const wrapper = mounted.pop()
    await wrapper?.unmount()
  }
  document.body.innerHTML = ''
})

describe('Popconfirm', () => {
  it('默认收起：亮色底部类与触发器语义', async () => {
    const wrapper = mountPc({ title: '删除该行数据？' })
    await nextTick()
    expect(wrapper.classes()).toContain('ui-popconfirm')
    expect(wrapper.classes()).toContain('ui-popconfirm--light')
    expect(wrapper.classes()).toContain('ui-popconfirm--bottom')
    expect(wrapper.classes()).toContain('ui-popconfirm--popper')
    expect(wrapper.element.querySelector('.ui-popconfirm__trigger')?.getAttribute('aria-expanded')).toBe('false')
    expect(panel()).toBeNull()
  })

  it('点击触发器展开面板并抛 show', async () => {
    const wrapper = mountPc({ title: '删除该行数据？' })
    await nextTick()
    await open(wrapper)
    expect(wrapper.emitted('show')).toHaveLength(1)
    expect(wrapper.element.querySelector('.ui-popconfirm__trigger')?.getAttribute('aria-expanded')).toBe('true')
    expect(panel()).not.toBeNull()
    expect(document.querySelector('.ui-popconfirm__title')?.textContent).toContain('删除该行数据？')
  })

  it('面板默认结构：图标、兜底文案、取消/确定按钮与默认宽度', async () => {
    const wrapper = mountPc()
    await open(wrapper)
    expect(panel()?.getAttribute('style') ?? '').toContain('width: 150px')
    expect(
      document.querySelector('.ui-popconfirm__icon style, .ui-popconfirm__icon')?.getAttribute('style') ?? ''
    ).toContain('color: #f90')
    expect(document.querySelector('.ui-popconfirm__title span:last-child')?.textContent).toBe('确定执行此操作吗？')
    const cancel = document.querySelector('.ui-popconfirm__button.is-cancel')
    expect(cancel?.textContent).toBe('取消')
    expect(Array.from(cancel?.classList ?? [])).toEqual(expect.arrayContaining(['is-cancel', 'is-text']))
    const confirm = document.querySelector('.ui-popconfirm__button.is-confirm')
    expect(confirm?.textContent).toBe('确定')
    expect(confirm?.getAttribute('type')).toBe('button')
  })

  it('确认按钮发出 confirm 与 hide 并收起', async () => {
    const wrapper = mountPc()
    await open(wrapper)
    await click(document.querySelector('.ui-popconfirm__button.is-confirm'))
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('hide')).toHaveLength(1)
    expect(panel()).toBeNull()
  })

  it('取消按钮发出 cancel 并收起', async () => {
    const wrapper = mountPc()
    await open(wrapper)
    await click(document.querySelector('.ui-popconfirm__button.is-cancel'))
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('hide')).toHaveLength(1)
    expect(panel()).toBeNull()
  })

  it('点击确认立即收起，hideAfter 只作用于悬停离开的延迟', async () => {
    // 与 Element Plus 口径一致：按钮点击是显式动作，直接收起；
    // hideAfter 是触发器 mouseleave 后延迟收起的时长，不参与按钮路径
    const wrapper = mountPc({ hideAfter: 800 })
    await open(wrapper)
    await click(document.querySelector('.ui-popconfirm__button.is-confirm'))
    expect(panel()).toBeNull()
  })

  it('标题与按钮文案来自 ConfigProvider 注入的 locale，未注入键回退中文', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: { popconfirm: { title: 'Are you sure?', confirm: 'Yes' } } },
      slots: {
        default: () => h(Popconfirm, null, { default: () => h('button', { class: 'pc-trigger' }, '删除') })
      },
      attachTo: document.body
    })
    mounted.push(wrapper)
    await nextTick()
    await click(document.querySelector('.ui-popconfirm__trigger'))
    expect(document.querySelector('.ui-popconfirm__title span:last-child')?.textContent).toBe('Are you sure?')
    expect(document.querySelector('.ui-popconfirm__button.is-confirm')?.textContent).toBe('Yes')
    expect(document.querySelector('.ui-popconfirm__button.is-cancel')?.textContent).toBe('取消')
  })

  it('按钮文案与类型类可覆盖', async () => {
    const wrapper = mountPc({
      confirmButtonText: '继续',
      cancelButtonText: '离开',
      confirmButtonType: 'success',
      cancelButtonType: 'danger'
    })
    await open(wrapper)
    const confirm = document.querySelector('.ui-popconfirm__button.is-confirm')
    expect(confirm?.textContent).toBe('继续')
    expect(confirm?.className).toContain('is-success')
    const cancel = document.querySelector('.ui-popconfirm__button.is-cancel')
    expect(cancel?.textContent).toBe('离开')
    expect(cancel?.className).not.toContain('is-text')
  })

  it('content 插槽渲染补充内容区', async () => {
    const wrapper = mountPc({}, { content: () => h('p', { class: 'pc-content' }, '补充说明') })
    await open(wrapper)
    expect(panel()?.querySelector('.pc-content')?.textContent).toBe('补充说明')
  })

  it('hideIcon 隐藏图标，icon 覆盖并保留 iconColor', async () => {
    const hidden = mountPc({ hideIcon: true })
    await open(hidden)
    expect(document.querySelector('.ui-popconfirm__icon')).toBeNull()
    hidden.unmount()
    document.body.innerHTML = ''

    const custom = mountPc({ icon: () => h('i', { class: 'my-icon' }), iconColor: 'rgb(1, 2, 3)' })
    await open(custom)
    expect(document.querySelector('.ui-popconfirm__panel .my-icon')).not.toBeNull()
    expect(document.querySelector('.ui-popconfirm__icon')?.getAttribute('style')).toContain('color: rgb(1, 2, 3)')
  })

  it('placement 切换根类，width 字符串落样式', async () => {
    const wrapper = mountPc({ placement: 'top', width: '12rem' })
    await open(wrapper)
    expect(wrapper.classes()).toContain('ui-popconfirm--top')
    expect(panel()?.getAttribute('style') ?? '').toContain('width: 12rem')
  })

  it('受控 visible=true 时内部取消不改变显示', async () => {
    const wrapper = mountPc({ visible: true })
    await nextTick()
    expect(panel()).not.toBeNull()
    await click(wrapper.element.querySelector('.ui-popconfirm__trigger'))
    expect(wrapper.emitted('hide')).toBeUndefined()
    expect(panel()).not.toBeNull()
    await click(document.querySelector('.ui-popconfirm__button.is-cancel'))
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('hide')).toBeUndefined()
    expect(panel()).not.toBeNull()
  })

  it('受控 visible=false 强制收起并抛 hide', async () => {
    const wrapper = mountPc({ visible: true })
    await open(wrapper)
    await wrapper.setProps({ visible: false })
    expect(panel()).toBeNull()
    expect(wrapper.emitted('hide')).toHaveLength(1)
  })

  it('persistent=true 收起后面板保留为隐藏态', async () => {
    const wrapper = mountPc({ persistent: true, hideIcon: true })
    await open(wrapper)
    await click(document.querySelector('.ui-popconfirm__button.is-cancel'))
    expect(panel()).not.toBeNull()
    expect(panel()?.getAttribute('aria-hidden')).toBe('true')
  })

  it('外部 pointerdown 收起并抛 hide', async () => {
    const wrapper = mountPc()
    await open(wrapper)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('hide')).toHaveLength(1)
    expect(panel()).toBeNull()
  })

  it('反复开合不残留重复面板', async () => {
    const wrapper = mountPc()
    for (let i = 0; i < 3; i++) {
      await open(wrapper)
      await click(document.querySelector('.ui-popconfirm__button.is-confirm'))
    }
    expect(document.querySelectorAll('.ui-popconfirm__panel')).toHaveLength(0)
    await open(wrapper)
    expect(document.querySelectorAll('.ui-popconfirm__panel')).toHaveLength(1)
  })

  it('卸载后 body 无面板残留', async () => {
    const wrapper = mountPc()
    await open(wrapper)
    wrapper.unmount()
    expect(panel()).toBeNull()
    expect(document.querySelector('.ui-popconfirm')).toBeNull()
  })
})
