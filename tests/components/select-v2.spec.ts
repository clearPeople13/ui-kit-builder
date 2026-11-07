import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SelectV2 } from '@ui-kit-full'

/**
 * SelectV2：面板按需挂载、默认 teleport 到 body；展开态只看触发器 is-open 与面板是否存在。
 * 选项列表来自 options 归一化（含 props 字段映射、分组、虚拟窗口），筛选走本地或 remote 两条通道。
 */
const options = [
  { value: 1, label: '选项一' },
  { value: 2, label: '选项二' },
  { value: 3, label: '禁用项', disabled: true }
]

let wrappers: VueWrapper[] = []

function mountSelectV2(props: Record<string, any> = {}) {
  const wrapper = mount(SelectV2, { props, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

function reset() {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers = []
  document.body.innerHTML = ''
}

function panel() {
  return document.querySelector('.ui-select-v2__dropdown')
}

function optionNodes() {
  return Array.from(document.querySelectorAll('.ui-select-v2__option'))
}

async function open(wrapper: ReturnType<typeof mountSelectV2>) {
  await wrapper.find('.ui-select-v2__trigger').trigger('click')
  await nextTick()
}

async function clickNode(node: Element | null | undefined) {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

async function typeFilter(value: string) {
  const input = document.querySelector('.ui-select-v2__search-input') as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  reset()
})

describe('SelectV2', () => {
  it('默认渲染触发器、占位文案与收起态（面板不挂载）', () => {
    const wrapper = mountSelectV2({ options })
    expect(wrapper.classes()).toContain('ui-select-v2')
    const trigger = wrapper.find('.ui-select-v2__trigger')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.classes()).toEqual(['ui-select-v2__trigger'])
    expect(wrapper.find('.ui-select-v2__placeholder').text()).toBe('请选择')
    expect(wrapper.find('.ui-select-v2__arrow').exists()).toBe(true)
    expect(wrapper.find('.ui-select-v2__clear').exists()).toBe(false)
    expect(panel()).toBeNull()
  })

  it('placeholder 可自定义；命中选项回显 label，未命中回显字符串', () => {
    expect(mountSelectV2({ options, placeholder: '请选择城市' }).find('.ui-select-v2__placeholder').text()).toBe(
      '请选择城市'
    )
    expect(mountSelectV2({ options, modelValue: 1 }).find('.ui-select-v2__selected').text()).toBe('选项一')
    expect(mountSelectV2({ options, modelValue: 99 }).find('.ui-select-v2__selected').text()).toBe('99')
  })

  it('点击触发器展开：teleport 到 body、箭头与面板状态同步', async () => {
    const wrapper = mountSelectV2({ options })
    await open(wrapper)
    expect(wrapper.find('.ui-select-v2__trigger').classes()).toContain('is-open')
    expect(wrapper.find('.ui-select-v2__arrow').classes()).toContain('is-open')
    expect(panel()?.className).toContain('is-light')
    expect(wrapper.element.contains(panel())).toBe(false)
    expect(optionNodes().map((item) => item.textContent)).toEqual(['选项一', '选项二', '禁用项'])
    await open(wrapper)
    expect(wrapper.find('.ui-select-v2__trigger').classes()).not.toContain('is-open')
    expect(panel()).toBeNull()
  })

  it('选项点击：启用项抛出受控值并收起，禁用项不提交', async () => {
    const wrapper = mountSelectV2({ options })
    await open(wrapper)
    const disabled = optionNodes()[2]
    expect(disabled.className).toContain('is-disabled')
    await clickNode(disabled)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await clickNode(optionNodes()[1])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2])
    expect(wrapper.emitted('change')?.[0]).toEqual([2])
    expect(panel()).toBeNull()
  })

  it('disabled 时不展开、不聚焦，clear 也不渲染', async () => {
    const wrapper = mountSelectV2({ options, modelValue: 1, clearable: true, disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('.ui-select-v2__trigger').classes()).toContain('is-disabled')
    expect(wrapper.find('.ui-select-v2__trigger').attributes('tabindex')).toBeUndefined()
    expect(wrapper.find('.ui-select-v2__clear').exists()).toBe(false)
    await open(wrapper)
    expect(panel()).toBeNull()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('size 落类名，fitWidth / maxWidth 落根节点内联样式', () => {
    const sized = mountSelectV2({ options, size: 'small' })
    expect(sized.classes()).toContain('ui-select-v2--small')
    const fitted = mountSelectV2({ options, fitWidth: true, maxWidth: 320 })
    expect(fitted.attributes('style')).toContain('width: fit-content')
    expect(fitted.attributes('style')).toContain('max-width: 320px')
    const percent = mountSelectV2({ options, maxWidth: '50%' })
    expect(percent.attributes('style')).toContain('max-width: 50%')
  })

  it('clearable 有值时渲染清除按钮并抛出 undefined', async () => {
    const wrapper = mountSelectV2({ options, modelValue: 1, clearable: true })
    const clear = wrapper.find('.ui-select-v2__clear')
    expect(clear.exists()).toBe(true)
    await clear.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([undefined])
    expect(wrapper.emitted('change')?.[0]).toEqual([undefined])
  })

  it('multiple 渲染标签并可逐项移除', async () => {
    const wrapper = mountSelectV2({ options, multiple: true, modelValue: [1, 2] })
    expect(wrapper.classes()).toContain('is-multiple')
    const tags = wrapper.findAll('.ui-select-v2__tag')
    expect(tags).toHaveLength(2)
    expect(tags[0].find('.ui-select-v2__tag-label').text()).toBe('选项一')
    await tags[0].find('.ui-select-v2__tag-close').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[2]])
    expect(wrapper.emitted('change')?.[0]).toEqual([[2]])
  })

  it('collapseTags + maxCollapseTags 折叠多余标签并显示 +N', () => {
    const wrapper = mountSelectV2({
      options,
      multiple: true,
      modelValue: [1, 2, 3],
      collapseTags: true,
      maxCollapseTags: 2
    })
    expect(wrapper.findAll('.ui-select-v2__tag:not(.ui-select-v2__tag--more)')).toHaveLength(2)
    expect(wrapper.find('.ui-select-v2__tag--more').text()).toBe('+1')
  })

  it('props 字段映射决定选项文案、禁用态与提交值', async () => {
    const wrapper = mountSelectV2({
      options: [
        { id: 'a', text: '甲' },
        { id: 'b', text: '乙', off: true }
      ],
      props: { label: 'text', value: 'id', disabled: 'off' }
    })
    await open(wrapper)
    expect(optionNodes().map((item) => item.textContent)).toEqual(['甲', '乙'])
    expect(optionNodes()[1].className).toContain('is-disabled')
    await clickNode(optionNodes()[0])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
  })

  it('filterable 按关键字过滤，抛出 filter-change，无匹配显示 noMatchText', async () => {
    const wrapper = mountSelectV2({ options, filterable: true })
    await open(wrapper)
    expect(wrapper.classes()).toContain('is-filterable')
    expect(document.querySelector('.ui-select-v2__search-input')).not.toBeNull()
    await typeFilter('选项二')
    expect(optionNodes().map((item) => item.textContent)).toEqual(['选项二'])
    expect(wrapper.emitted('filter-change')?.[0]).toEqual(['选项二'])
    await typeFilter('zzz')
    expect(optionNodes()).toHaveLength(0)
    expect(document.querySelector('.ui-select-v2__empty')?.textContent).toBe('无匹配数据')
  })

  it('filterMethod 与 remote 两条过滤通道', async () => {
    const filterMethod = vi.fn((query: string, option: { label: string }) => option.label.includes(query))
    const wrapper = mountSelectV2({ options, filterable: true, filterMethod })
    await open(wrapper)
    await typeFilter('禁用')
    expect(optionNodes().map((item) => item.textContent)).toEqual(['禁用项'])
    expect(filterMethod.mock.calls[0]?.[0]).toBe('禁用')

    reset()
    const remoteMethod = vi.fn()
    const remote = mountSelectV2({ options, filterable: true, remote: true, remoteMethod })
    await open(remote)
    await typeFilter('zz')
    expect(remoteMethod.mock.calls[0]?.[0]).toBe('zz')
    expect(optionNodes()).toHaveLength(3)
  })

  it('loading 显示加载文案，空列表显示 noDataText', async () => {
    const loading = mountSelectV2({ options, loading: true, loadingText: '拼命加载' })
    await open(loading)
    expect(document.querySelector('.ui-loader')?.textContent).toContain('拼命加载')

    reset()
    const empty = mountSelectV2({ options: [], noDataText: '暂无数据' })
    await open(empty)
    expect(document.querySelector('.ui-select-v2__empty')?.textContent).toBe('暂无数据')
    expect(optionNodes()).toHaveLength(0)
  })

  it('分组选项渲染分组标题，子项仍可选中', async () => {
    const wrapper = mountSelectV2({
      options: [
        {
          label: '分组一',
          options: [
            { value: 'a', label: '甲' },
            { value: 'b', label: '乙' }
          ]
        }
      ]
    })
    await open(wrapper)
    expect(document.querySelector('.ui-select-v2__group')?.textContent).toBe('分组一')
    expect(optionNodes()).toHaveLength(2)
    await clickNode(document.querySelector('.ui-select-v2__group'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await clickNode(optionNodes()[0])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
  })

  it('超过 100 项的扁平列表走虚拟窗口，只渲染可视区', async () => {
    const big = Array.from({ length: 120 }, (_, index) => ({ value: index, label: `选项${index}` }))
    const wrapper = mountSelectV2({ options: big })
    await open(wrapper)
    const virtual = document.querySelector('.ui-select-v2__virtual')
    expect(virtual).not.toBeNull()
    expect(virtual?.getAttribute('style')).toContain('height: 4080px')
    expect(document.querySelector('.ui-select-v2__virtual-window')?.getAttribute('style')).toContain('translateY(0px)')
    expect(optionNodes()).toHaveLength(14)
  })

  it('effect / popperClass / popperStyle / teleported=false 落到面板', async () => {
    const wrapper = mountSelectV2({
      options,
      teleported: false,
      effect: 'dark',
      popperClass: 'my-panel',
      popperStyle: { padding: '2px' }
    })
    await open(wrapper)
    const dropdown = panel()
    expect(wrapper.element.contains(dropdown)).toBe(true)
    expect(dropdown?.className).toContain('is-dark')
    expect(dropdown?.className).toContain('my-panel')
    expect(dropdown?.getAttribute('style')).toContain('padding: 2px')
  })

  it('面板内 Escape 与外部 pointerdown 都能收起', async () => {
    const wrapper = mountSelectV2({ options })
    await open(wrapper)
    const dropdown = panel()
    dropdown?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(panel()).toBeNull()

    await open(wrapper)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(panel()).toBeNull()
  })

  // 预期：非过滤态下焦点在触发器上按 Escape 应收起面板（Select 与浮层家族均如此）。
  it('非过滤态下 Escape 从触发器收起面板', async () => {
    const wrapper = mountSelectV2({ options })
    await open(wrapper)
    await wrapper.find('.ui-select-v2__trigger').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(panel()).toBeNull()
  })
})
