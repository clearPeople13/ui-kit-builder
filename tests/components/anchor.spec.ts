import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Anchor, AnchorLink } from '@ui-kit-full'

// 锚点激活判定依赖 document.getElementById，需把目标节点挂进真实文档
function addTarget(id: string) {
  const el = document.createElement('div')
  el.id = id
  document.body.appendChild(el)
  return el
}

// 激活集合在 Anchor 的 onMounted 里计算，会触发一次子项重渲染，需等一帧
async function mountAnchor(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  const wrapper = mount(Anchor, { props, slots, attachTo: document.body })
  await nextTick()
  return wrapper
}

function links(wrapper: Awaited<ReturnType<typeof mountAnchor>>) {
  return wrapper.findAll('.ui-anchor-link')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Anchor 锚点导航', () => {
  it('渲染导航容器与默认类名', async () => {
    addTarget('a1')
    const wrapper = await mountAnchor({}, { default: () => h(AnchorLink, { href: '#a1', title: '第一节' }) })
    expect(wrapper.classes()).toContain('ui-anchor')
    expect(wrapper.classes()).toContain('ui-anchor--default')
    expect(wrapper.find('.ui-anchor__list').attributes('role')).toBe('navigation')
    expect(links(wrapper)).toHaveLength(1)
    expect(links(wrapper)[0].element.tagName).toBe('A')
    expect(links(wrapper)[0].attributes('href')).toBe('#a1')
    expect(links(wrapper)[0].text()).toBe('第一节')
  })

  it('type 切换导轨形态类名', async () => {
    addTarget('a1')
    const line = await mountAnchor({ type: 'line' }, { default: () => h(AnchorLink, { href: '#a1' }) })
    expect(line.classes()).toContain('ui-anchor--line')
    const dot = await mountAnchor({ type: 'dot' }, { default: () => h(AnchorLink, { href: '#a1' }) })
    expect(dot.classes()).toContain('ui-anchor--dot')
  })

  it('滚动偏移特性类名恒挂', async () => {
    const wrapper = await mountAnchor({}, { default: () => h(AnchorLink, { href: '#a1' }) })
    expect(wrapper.classes()).toContain('ui-anchor--popper')
  })

  it('目标存在的页内锚点在挂载后标记激活', async () => {
    addTarget('a1')
    const wrapper = await mountAnchor({}, { default: () => h(AnchorLink, { href: '#a1', title: '第一节' }) })
    expect(links(wrapper)[0].classes()).toContain('is-active')
  })

  it('目标缺失时不高亮', async () => {
    const wrapper = await mountAnchor({}, { default: () => h(AnchorLink, { href: '#missing', title: '缺失' }) })
    expect(links(wrapper)[0].classes()).not.toContain('is-active')
  })

  it('外链锚点不参与内部激活判定', async () => {
    addTarget('a1')
    const wrapper = await mountAnchor(
      {},
      {
        default: () => [
          h(AnchorLink, { href: '#a1', title: '页内' }),
          h(AnchorLink, { href: 'https://example.com', title: '外链' })
        ]
      }
    )
    expect(links(wrapper)[1].classes()).not.toContain('is-active')
    expect(links(wrapper)[1].attributes('href')).toBe('https://example.com')
  })

  it('嵌套链接沿祖先链同时激活', async () => {
    addTarget('parent')
    addTarget('child')
    const wrapper = await mountAnchor(
      {},
      {
        default: () =>
          h(
            AnchorLink,
            { href: '#parent', title: '父' },
            () => h(AnchorLink, { href: '#child', title: '子' })
          )
      }
    )
    expect(links(wrapper)).toHaveLength(2)
    expect(links(wrapper)[0].classes()).toContain('is-active')
    expect(links(wrapper)[1].classes()).toContain('is-active')
  })

  it('子项目标缺失时仅父项激活', async () => {
    addTarget('parent')
    const wrapper = await mountAnchor(
      {},
      {
        default: () =>
          h(
            AnchorLink,
            { href: '#parent', title: '父' },
            () => h(AnchorLink, { href: '#gone', title: '子' })
          )
      }
    )
    expect(links(wrapper)[0].classes()).toContain('is-active')
    expect(links(wrapper)[1].classes()).not.toContain('is-active')
  })

  it('underline 关闭时挂 is-underline-hidden', async () => {
    addTarget('a1')
    const hidden = await mountAnchor(
      {},
      { default: () => h(AnchorLink, { href: '#a1', underline: false, title: '无下划线' }) }
    )
    expect(links(hidden)[0].classes()).toContain('is-underline-hidden')
    const shown = await mountAnchor({}, { default: () => h(AnchorLink, { href: '#a1', title: '默认' }) })
    expect(links(shown)[0].classes()).not.toContain('is-underline-hidden')
  })

  it('默认插槽内容优先于 title', async () => {
    addTarget('a1')
    const wrapper = await mountAnchor(
      {},
      { default: () => h(AnchorLink, { href: '#a1', title: '属性' }, () => '插槽标题') }
    )
    expect(links(wrapper)[0].text()).toBe('插槽标题')
  })

  it('target 落到原生链接属性', async () => {
    const wrapper = await mountAnchor(
      {},
      { default: () => h(AnchorLink, { href: '#a1', target: '_blank', title: '新窗口' }) }
    )
    expect(links(wrapper)[0].attributes('target')).toBe('_blank')
  })

  it('href 为空不写出 href 属性也不激活', async () => {
    const wrapper = await mountAnchor({}, { default: () => h(AnchorLink, { title: '无地址' }) })
    expect(links(wrapper)[0].attributes('href')).toBeUndefined()
    expect(links(wrapper)[0].classes()).not.toContain('is-active')
  })

  it('脱离 Anchor 独立使用 AnchorLink 也不激活', () => {
    addTarget('a1')
    const wrapper = mount(AnchorLink, { props: { href: '#a1', title: '独立' } })
    expect(wrapper.classes()).toContain('ui-anchor-link')
    expect(wrapper.classes()).not.toContain('is-active')
  })

  it('无子链接时只渲染空导航容器', async () => {
    const wrapper = await mountAnchor({}, { default: () => [] })
    expect(wrapper.find('.ui-anchor__list').exists()).toBe(true)
    expect(links(wrapper)).toHaveLength(0)
  })
})
