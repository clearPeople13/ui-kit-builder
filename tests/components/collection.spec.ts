import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { Collection, CollectionItem } from '@ui-kit-full'

const alpha = { id: 'alpha' }
const beta = { id: 'beta' }

function makeData() {
  return [alpha, beta]
}

function mountCollection(items = makeData()) {
  return mount(Collection, {
    slots: { default: () => items.map((item) => h(CollectionItem, { item }, () => item.id)) }
  })
}

describe('Collection 集合注册', () => {
  it('渲染各子项且不额外包裹容器', () => {
    const wrapper = mountCollection()
    expect(wrapper.findAll('.ui-collection__item')).toHaveLength(2)
    // Collection 自身不产出任何包装元素，只有子项 div
    expect(wrapper.find('.ui-collection').exists()).toBe(false)
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('子项使用 display:contents 不占布局', () => {
    const item = mountCollection().findAll('.ui-collection__item')[0]
    expect(item.element.tagName).toBe('DIV')
    expect(item.attributes('style')).toContain('display: contents')
  })

  it('子项默认插槽内容落位', () => {
    const wrapper = mountCollection()
    expect(wrapper.findAll('.ui-collection__item')[0].text()).toBe('alpha')
    expect(wrapper.findAll('.ui-collection__item')[1].text()).toBe('beta')
  })

  it('暴露 getItem 命中已注册元素', () => {
    const vm = mountCollection().vm as unknown as Record<string, any>
    expect(vm.getItem(alpha).constructor.name).toBe('HTMLDivElement')
    expect(vm.getItem(beta).constructor.name).toBe('HTMLDivElement')
    expect(vm.getItem(alpha).classList.contains('ui-collection__item')).toBe(true)
  })

  it('getItem 对未登记对象返回 null', () => {
    const vm = mountCollection().vm as unknown as Record<string, any>
    expect(vm.getItem({ id: 'ghost' })).toBeNull()
  })

  it('itemRefs 记录条目数量', () => {
    const vm = mountCollection().vm as unknown as Record<string, any>
    expect(vm.itemRefs.size).toBe(2)
  })

  it('空集合时不渲染子项且映射为空', () => {
    const wrapper = mount(Collection, { slots: { default: () => [] } })
    expect(wrapper.findAll('.ui-collection__item')).toHaveLength(0)
    expect((wrapper.vm as unknown as Record<string, any>).itemRefs.size).toBe(0)
  })

  it('单条目集合大小为一', () => {
    const vm = mountCollection([alpha]).vm as unknown as Record<string, any>
    expect(vm.itemRefs.size).toBe(1)
    expect(vm.getItem(alpha)).toBeTruthy()
  })

  it('独立 CollectionItem 脱离集合仍渲染', () => {
    const wrapper = mount(CollectionItem, { props: { item: alpha }, slots: { default: () => '孤立项' } })
    expect(wrapper.classes()).toContain('ui-collection__item')
    expect(wrapper.text()).toBe('孤立项')
  })

  it('子项卸载时从映射中移除', async () => {
    const Host = defineComponent({
      props: { two: { type: Boolean, default: true } },
      setup(props) {
        const a = { id: 'a' }
        const b = { id: 'b' }
        return () =>
          h(Collection, null, {
            default: () => [
              h(CollectionItem, { item: a }, () => 'A'),
              props.two ? h(CollectionItem, { item: b }, () => 'B') : null
            ]
          })
      }
    })
    const wrapper = mount(Host)
    const collection = wrapper.findComponent(Collection)
    expect((collection.vm as unknown as Record<string, any>).itemRefs.size).toBe(2)
    await wrapper.setProps({ two: false })
    expect((collection.vm as unknown as Record<string, any>).itemRefs.size).toBe(1)
    expect(wrapper.findAll('.ui-collection__item')).toHaveLength(1)
  })

  it('嵌套子项各自独立注册', () => {
    const outer = { id: 'outer' }
    const inner = { id: 'inner' }
    const wrapper = mount(Collection, {
      slots: {
        default: () => h(CollectionItem, { item: outer }, () => h(CollectionItem, { item: inner }, () => '内'))
      }
    })
    expect(wrapper.findAll('.ui-collection__item')).toHaveLength(2)
    const vm = wrapper.vm as unknown as Record<string, any>
    expect(vm.itemRefs.size).toBe(2)
    expect(vm.getItem(inner)).toBeTruthy()
  })
})
