import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Menu, MenuItem, MenuItemGroup, SubMenu } from '@ui-kit-full'

const mounted: ReturnType<typeof mount>[] = []

// 默认结构：顶级项 + 带分组的子菜单 + 禁用项，覆盖 Menu 的四类节点
function defaultChildren() {
  return [
    h(MenuItem, { index: '1' }, () => '工作台'),
    h(
      SubMenu,
      { index: 's1' },
      {
        title: () => '订单中心',
        default: () => [
          h(MenuItem, { index: '2' }, () => '订单列表'),
          h(MenuItemGroup, { title: '售后' }, { default: () => h(MenuItem, { index: '3' }, () => '退款申请') })
        ]
      }
    ),
    h(MenuItem, { index: '4', disabled: true }, () => '已下线')
  ]
}

function mountMenu(props: Record<string, unknown> = {}, children: () => unknown[] = defaultChildren) {
  const wrapper = mount(Menu, {
    props: { defaultActive: '1', ...props },
    slots: { default: children },
    attachTo: document.body
  })
  mounted.push(wrapper)
  return wrapper
}

// 点击落在 __inner 上，外层容器不响应选中
function clickItem(wrapper: ReturnType<typeof mountMenu>, label: string) {
  const target = wrapper.findAll('.ui-menu-item__inner').find((item) => item.text() === label)
  if (!target) {
    throw new Error(`找不到菜单项：${label}`)
  }
  return target.trigger('click')
}

function openSubMenu(wrapper: ReturnType<typeof mountMenu>, index: number) {
  return wrapper.findAll('.ui-sub-menu__title')[index].trigger('click')
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()!.unmount()
  }
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('Menu 菜单', () => {
  it('纵向菜单默认渲染列表容器与方向类名', async () => {
    const wrapper = mountMenu()
    await nextTick()
    expect(wrapper.classes()).toEqual(['ui-menu', 'is-vertical'])
    expect(wrapper.find('.ui-menu__list').exists()).toBe(true)
    expect(wrapper.findAll('.ui-menu-item').map((item) => item.text())).toEqual(['工作台', '已下线'])
  })

  it('horizontal 模式换成 is-horizontal 类名', async () => {
    const wrapper = mountMenu({ mode: 'horizontal' })
    await nextTick()
    expect(wrapper.classes()).toContain('is-horizontal')
    expect(wrapper.classes()).not.toContain('is-vertical')
  })

  it('defaultActive 决定初始高亮项', async () => {
    const wrapper = mountMenu({ defaultActive: '1' })
    await nextTick()
    expect(wrapper.findAll('.ui-menu-item')[0].classes()).toContain('is-active')
  })

  it('点击菜单项高亮并抛出 select', async () => {
    const wrapper = mountMenu()
    await openSubMenu(wrapper, 0)
    await clickItem(wrapper, '订单列表')
    await nextTick()
    expect(wrapper.emitted('select')?.slice(-1)).toEqual([['2']])
    expect(
      wrapper
        .findAll('.ui-menu-item')
        .find((item) => item.text() === '订单列表')!
        .classes()
    ).toContain('is-active')
  })

  it('defaultActive 变化会同步移动高亮', async () => {
    const wrapper = mountMenu({ defaultOpeneds: ['s1'] })
    await wrapper.setProps({ defaultActive: '2' })
    expect(
      wrapper
        .findAll('.ui-menu-item')
        .find((item) => item.text() === '订单列表')!
        .classes()
    ).toContain('is-active')
    expect(wrapper.findAll('.ui-menu-item')[0].classes()).not.toContain('is-active')
  })

  it('禁用项与缺少 index 的项点击后不抛 select', async () => {
    const wrapper = mountMenu({}, () => [
      h(MenuItem, { index: '4', disabled: true }, () => '已下线'),
      h(MenuItem, null, () => '无标识项')
    ])
    await nextTick()
    expect(wrapper.findAll('.ui-menu-item')[0].classes()).toContain('is-disabled')
    await clickItem(wrapper, '已下线')
    await clickItem(wrapper, '无标识项')
    await nextTick()
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.findAll('.ui-menu-item').map((item) => item.classes())).toEqual([
      ['ui-menu-item', 'is-disabled'],
      ['ui-menu-item']
    ])
  })

  it('点击子菜单标题展开并抛 open，再点收起并抛 close', async () => {
    const wrapper = mountMenu()
    await openSubMenu(wrapper, 0)
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).toContain('is-opened')
    expect(wrapper.emitted('open')).toEqual([['s1']])
    expect(wrapper.text()).toContain('订单列表')
    await openSubMenu(wrapper, 0)
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).not.toContain('is-opened')
    expect(wrapper.emitted('open')).toEqual([['s1']])
    expect(wrapper.emitted('close')).toEqual([['s1']])
  })

  it('defaultOpeneds 让子菜单初始就展开', async () => {
    const wrapper = mountMenu({ defaultOpeneds: ['s1'] })
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).toContain('is-opened')
    expect(wrapper.text()).toContain('退款申请')
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('分组渲染标题与小节容器', async () => {
    const wrapper = mountMenu({ defaultOpeneds: ['s1'] })
    await nextTick()
    const group = wrapper.find('.ui-menu-item-group')
    expect(group.exists()).toBe(true)
    expect(group.find('.ui-menu-item-group__title').text()).toBe('售后')
    expect(group.find('.ui-menu-item-group__list').text()).toBe('退款申请')
  })

  it('uniqueOpened 展开新的同级子菜单时收起旧的并抛 close', async () => {
    const wrapper = mountMenu({ uniqueOpened: true }, () => [
      h(SubMenu, { index: 'a' }, { title: () => '甲组', default: () => h(MenuItem, { index: 'a1' }, () => '甲项') }),
      h(SubMenu, { index: 'b' }, { title: () => '乙组', default: () => h(MenuItem, { index: 'b1' }, () => '乙项') })
    ])
    await openSubMenu(wrapper, 0)
    await openSubMenu(wrapper, 1)
    await nextTick()
    expect(wrapper.findAll('.ui-sub-menu').map((item) => item.classes())).toEqual([
      ['ui-sub-menu'],
      ['ui-sub-menu', 'is-opened']
    ])
    expect(wrapper.emitted('open')).toEqual([['a'], ['b']])
    expect(wrapper.emitted('close')).toEqual([['a']])
  })

  it('非手风琴模式下多个子菜单可同时展开', async () => {
    const wrapper = mountMenu({}, () => [
      h(SubMenu, { index: 'a' }, { title: () => '甲组', default: () => h(MenuItem, { index: 'a1' }, () => '甲项') }),
      h(SubMenu, { index: 'b' }, { title: () => '乙组', default: () => h(MenuItem, { index: 'b1' }, () => '乙项') })
    ])
    await openSubMenu(wrapper, 0)
    await openSubMenu(wrapper, 1)
    await nextTick()
    expect(wrapper.findAll('.ui-sub-menu').map((item) => item.classes())).toEqual([
      ['ui-sub-menu', 'is-opened'],
      ['ui-sub-menu', 'is-opened']
    ])
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('折叠态只保留顶级条目，点击与悬停都不展开子菜单', async () => {
    vi.useFakeTimers()
    const wrapper = mountMenu({ collapse: true })
    await nextTick()
    expect(wrapper.classes()).toContain('is-collapse')
    await openSubMenu(wrapper, 0)
    await wrapper.find('.ui-sub-menu').trigger('mouseenter')
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).not.toContain('is-opened')
    expect(wrapper.text()).not.toContain('订单列表')
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('子菜单项被选中时父级标题带上激活标识', async () => {
    const wrapper = mountMenu({ defaultOpeneds: ['s1'] })
    await clickItem(wrapper, '退款申请')
    await nextTick()
    expect(wrapper.emitted('select')).toEqual([['3']])
    expect(wrapper.find('.ui-sub-menu').classes()).toContain('is-active')
  })

  it('悬停到达 showTimeout 后展开，移出 hideTimeout 后收起', async () => {
    vi.useFakeTimers()
    const wrapper = mountMenu()
    const sub = wrapper.find('.ui-sub-menu')
    await sub.trigger('mouseenter')
    vi.advanceTimersByTime(299)
    await nextTick()
    expect(sub.classes()).not.toContain('is-opened')
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).toContain('is-opened')
    expect(wrapper.emitted('open')).toEqual([['s1']])
    await sub.trigger('mouseleave')
    vi.advanceTimersByTime(300)
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).not.toContain('is-opened')
    expect(wrapper.emitted('close')).toEqual([['s1']])
  })

  it('SubMenu 的 showTimeout 覆盖 Menu 的延迟', async () => {
    vi.useFakeTimers()
    const wrapper = mountMenu({ showTimeout: 500 }, () => [
      h(
        SubMenu,
        { index: 'a', showTimeout: 100 },
        { title: () => '甲组', default: () => h(MenuItem, { index: 'a1' }, () => '甲项') }
      )
    ])
    await wrapper.find('.ui-sub-menu').trigger('mouseenter')
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).toContain('is-opened')
  })

  it('点击展开的子菜单移出后保持展开', async () => {
    vi.useFakeTimers()
    const wrapper = mountMenu()
    await openSubMenu(wrapper, 0)
    await wrapper.find('.ui-sub-menu').trigger('mouseleave')
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).toContain('is-opened')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('禁用的子菜单点击与悬停都不展开', async () => {
    vi.useFakeTimers()
    const wrapper = mountMenu({}, () => [
      h(
        SubMenu,
        { index: 'a', disabled: true },
        { title: () => '甲组', default: () => h(MenuItem, { index: 'a1' }, () => '甲项') }
      )
    ])
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).toContain('is-disabled')
    await openSubMenu(wrapper, 0)
    await wrapper.find('.ui-sub-menu').trigger('mouseenter')
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(wrapper.find('.ui-sub-menu').classes()).not.toContain('is-opened')
    expect(wrapper.emitted()).not.toHaveProperty('open')
  })

  it('配色写入内联变量，未传的项保持缺省', async () => {
    const wrapper = mountMenu({
      backgroundColor: '#1f2937',
      textColor: '#f9fafb',
      activeTextColor: '#3b82f6'
    })
    await nextTick()
    const style = wrapper.attributes('style') || ''
    expect(style).toContain('--ui-menu-bg: #1f2937')
    expect(style).toContain('--ui-menu-text-color: #f9fafb')
    expect(style).toContain('--ui-menu-active-color: #3b82f6')
    expect(style).toContain('color: #f9fafb')

    const plain = mountMenu()
    await nextTick()
    expect(plain.attributes('style') || '').not.toContain('--ui-menu-bg')
  })
})
