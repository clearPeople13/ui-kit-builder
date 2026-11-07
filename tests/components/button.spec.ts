import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { Button, ButtonGroup } from '@ui-kit-full'

function mountButton(
  props: Record<string, any> = {},
  options: { text?: string; onClick?: (...args: any[]) => void } = {}
) {
  return mount(Button, {
    props,
    attrs: options.onClick ? { onClick: options.onClick } : {},
    slots: { default: () => options.text ?? '按钮文字' }
  })
}

describe('Button', () => {
  it('默认渲染 button 标签与基础类名', () => {
    const wrapper = mountButton()
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.classes()).toContain('ui-button')
    expect(wrapper.classes()).toContain('ui-button--default')
    expect(wrapper.classes()).toContain('ui-button--size-default')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toContain('按钮')
  })

  it('type 映射到 ui-button--<type> 类名', () => {
    for (const type of ['primary', 'success', 'warning', 'info', 'danger']) {
      expect(mountButton({ type }).classes()).toContain(`ui-button--${type}`)
    }
    // 空串与未设置都回落到 default
    expect(mountButton({ type: '' }).classes()).toContain('ui-button--default')
  })

  it('size 映射到尺寸类名', () => {
    expect(mountButton({ size: 'large' }).classes()).toContain('ui-button--size-large')
    expect(mountButton({ size: 'small' }).classes()).toContain('ui-button--size-small')
  })

  it('disabled 时输出 disabled 属性且不触发点击处理', async () => {
    const onClick = vi.fn()
    const wrapper = mountButton({ disabled: true }, { onClick })
    expect(wrapper.attributes('disabled')).toBeDefined()
    await wrapper.trigger('click')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('未禁用时点击回调收到原生事件对象', async () => {
    const onClick = vi.fn()
    const wrapper = mountButton({}, { onClick })
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toBeInstanceOf(Event)
  })

  it('nativeType 透传到原生 type 属性', () => {
    expect(mountButton({ nativeType: 'submit' }).attributes('type')).toBe('submit')
    expect(mountButton({ nativeType: 'reset' }).attributes('type')).toBe('reset')
  })

  it('autofocus 输出 autofocus 属性', () => {
    expect(mountButton({ autofocus: true }).attributes('autofocus')).toBeDefined()
    expect(mountButton().attributes('autofocus')).toBeUndefined()
  })

  it('tag 支持自定义渲染标签并保留类名', () => {
    const wrapper = mountButton({ tag: 'a', type: 'link' })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.classes()).toContain('ui-button--link')
    // 非 button 标签不再输出 nativeType
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('attrs 透传 href 等额外属性', () => {
    const wrapper = mount(Button, { props: { tag: 'a' }, attrs: { href: '/demo' }, slots: { default: () => '链接' } })
    expect(wrapper.attributes('href')).toBe('/demo')
  })

  it('外观特性映射为对应类名', () => {
    const classes = mountButton({
      plain: true,
      round: true,
      circle: true,
      dashed: true,
      text: true,
      bg: true
    }).classes()
    for (const expected of ['is-plain', 'is-round', 'is-circle', 'is-dashed']) {
      expect(classes).toContain(expected)
    }
  })

  it('color 特性写入背景色与边框色', () => {
    const style = mountButton({ color: '#ff0000' }).attributes('style') ?? ''
    expect(style).toContain('background-color: #ff0000')
    expect(style).toContain('border-color: #ff0000')
  })

  it('icon 特性在内容前渲染图标节点', () => {
    const wrapper = mountButton({ icon: 'Plus' })
    expect(wrapper.find('.ui-button__icon').exists()).toBe(true)
    expect(wrapper.find('.ui-button__icon').attributes('aria-hidden')).toBe('true')
  })

  it('loading 特性渲染加载指示器并自动禁用', () => {
    const wrapper = mountButton({ loading: true })
    expect(wrapper.find('.ui-button__spinner').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('未加载时不渲染加载指示器', () => {
    expect(mountButton().find('.ui-button__spinner').exists()).toBe(false)
  })

  it('两个汉字自动插入空格，可用 autoInsertSpace 关闭', () => {
    expect(mountButton({}, { text: '确定' }).text()).toBe('确 定')
    expect(mountButton({ autoInsertSpace: false }, { text: '确定' }).text()).toBe('确定')
    // 三字与中英混排不处理
    expect(mountButton({}, { text: '提交中' }).text()).toBe('提交中')
    expect(mountButton({}, { text: 'OK' }).text()).toBe('OK')
  })

  it('点击产生水波节点并在动画超时后回收', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mountButton()
      expect(wrapper.find('.ui-button__wave').exists()).toBe(false)
      await wrapper.trigger('click')
      expect(wrapper.findAll('.ui-button__wave').length).toBe(1)
      // 默认淡出 2s + 100ms 兜底回收
      await vi.advanceTimersByTimeAsync(2200)
      expect(wrapper.find('.ui-button__wave').exists()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('卸载后清空未触发的 wave 兜底定时器，无定时器回调残留', async () => {
    vi.useFakeTimers()
    // 须在 useFakeTimers 之后打 spy，包裹的是 fake clearTimeout 且默认透传
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    try {
      const wrapper = mountButton()
      await wrapper.trigger('click')
      expect(wrapper.findAll('.ui-button__wave').length).toBe(1)
      clearSpy.mockClear()
      wrapper.unmount()
      // 未触发的兜底回收定时器必须被 clearTimeout 清掉
      expect(clearSpy).toHaveBeenCalled()
      // 卸载后推进时间：残留的回调若写 ripples 会触发已卸载实例的副作用，
      // 这里不抛错、不再产生渲染即证明无残留回调在跑
      await vi.advanceTimersByTimeAsync(5000)
    } finally {
      clearSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it('禁用时点击不产生水波', async () => {
    const wrapper = mountButton({ disabled: true })
    await wrapper.trigger('click')
    expect(wrapper.find('.ui-button__wave').exists()).toBe(false)
  })
})

describe('ButtonGroup', () => {
  it('渲染组容器并保留子按钮', () => {
    const wrapper = mount(ButtonGroup, {
      slots: { default: () => [h(Button, () => 'A'), h(Button, () => 'B')] }
    })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('ui-button-group')
    expect(wrapper.findAll('button').length).toBe(2)
  })

  it('组内 size / type 透传给未显式设置的子按钮', () => {
    const wrapper = mount(ButtonGroup, {
      props: { size: 'large', type: 'danger' },
      slots: { default: () => [h(Button, () => 'A'), h(Button, { size: 'small' }, () => 'B')] }
    })
    const [inherited, own] = wrapper.findAll('button')
    expect(inherited.classes()).toContain('ui-button--size-large')
    expect(inherited.classes()).toContain('ui-button--danger')
    // 子按钮自身的 size 优先于组内继承
    expect(own.classes()).toContain('ui-button--size-small')
  })

  it('dir 输出到容器 dir 属性', () => {
    const wrapper = mount(ButtonGroup, { props: { dir: 'rtl' }, slots: { default: () => h(Button) } })
    expect(wrapper.attributes('dir')).toBe('rtl')
    expect(mount(ButtonGroup).attributes('dir')).toBeUndefined()
  })
})
