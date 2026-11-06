import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox, Dialog, Input, Radio, Select, TabPane, Table, TableColumn, Tabs } from '@ui-kit-full'

// 本文件用 it.fails 固定"期望行为"，记录首批用例暴露出的库缺陷。
// it.fails 的语义是"断言失败才算通过"：一旦组件修好，这里会转为失败，
// 提醒维护者把用例迁回 tests/components/<组件>.spec.ts 作为常规回归。
describe('已知缺陷（it.fails 守卫）', () => {
  it.fails('Select：options 的自定义字段映射未生效', async () => {
    // select/core.ts 的 optionList 调用 normalizeOptions(props.options)，
    // 漏传第二个参数 mapping，声明的 props: { label: 'text', value: 'id' } 被忽略，选项文案渲染为空
    const wrapper = mount(Select, {
      props: { options: [{ id: 'a', text: '甲' }], props: { label: 'text', value: 'id' } },
      attachTo: document.body
    })
    await wrapper.find('.ui-select__trigger').trigger('click')
    const labels = Array.from(document.querySelectorAll('.ui-select__option')).map((item) => item.textContent)
    expect(labels).toEqual(['甲'])
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it.fails('Select：完全缺省 modelValue 时回显 false 而非占位文案', () => {
    // modelValue 的类型联合含 Boolean，Vue 对"键不存在"的缺省值做布尔归一化为 false，
    // 与"没有选值"无法区分；显式传 undefined 才能正常显示 placeholder
    const wrapper = mount(Select, { props: {}, attachTo: document.body })
    expect(wrapper.find('.ui-select__placeholder').exists()).toBe(true)
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it.fails('Input：id 未渲染到内部 input 上', () => {
    // inputConfig 组装控件属性时没有带上 id，FormItem 的 for / 外部 label 指向不了真实控件
    const wrapper = mount(Input, { props: { id: 'kw' } })
    expect(wrapper.find('input').attributes('id')).toBe('kw')
  })

  it.fails('Radio：label 单独使用不能作为选项值', () => {
    // value 的类型联合含 Boolean，缺省被归一化为 false，ownValue() 取不到 label，
    // <Radio v-model="'a'" label="a" /> 永不选中；显式传 value 才是可用写法
    const wrapper = mount(Radio, { props: { modelValue: 'a', label: 'a' } })
    expect(wrapper.find('input').element.checked).toBe(true)
  })

  it.fails('Checkbox：label 单独使用不能作为选项值', () => {
    // 同上：resolveCheckedValue 的 value ?? label 回退被 Vue 的 false 缺省值挡住
    const wrapper = mount(Checkbox, { props: { modelValue: 'a', label: 'a' } })
    expect(wrapper.find('input').element.checked).toBe(true)
  })

  it.fails('Tabs：type 只是声明，没有对应类名与样式', () => {
    // core.ts 的 classes() 只输出 is-<tabPosition> / is-stretch，
    // 也没有 ui-tabs--card、ui-tabs--border-card 之类的样式钩子
    const wrapper = mount(Tabs, { props: { type: 'border-card' } })
    expect(wrapper.classes()).toContain('ui-tabs--border-card')
    wrapper.unmount()
  })

  it.fails('Tabs：beforeLeave 声明了但从未调用', async () => {
    // features/tabs-editable 只用它推导 ui-tabs--editable 类名，
    // 切换标签时既不会 await 也不会拦截，Promise.reject 无法阻止激活
    const beforeLeave = vi.fn(() => Promise.reject(new Error('阻止切换')))
    const wrapper = mount(Tabs, {
      props: { modelValue: 'a', beforeLeave },
      slots: {
        default: () => [
          h(TabPane, { label: '一', name: 'a' }, () => 'A'),
          h(TabPane, { label: '二', name: 'b' }, () => 'B')
        ]
      },
      attachTo: document.body
    })
    await nextTick()
    await wrapper.findAll('.ui-tabs__nav-item')[1].trigger('click')
    expect(beforeLeave).toHaveBeenCalled()
    expect(wrapper.emitted('tab-change')).toBeUndefined()
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it.fails('Dialog：beforeClose 声明了但从未调用', async () => {
    // features/closable 只用它推导关闭按钮是否渲染，
    // 点击关闭仍直接抛出 update:modelValue(false)，异步确认逻辑无处生效
    const beforeClose = vi.fn((_done: () => void) => undefined)
    const wrapper = mount(Dialog, { props: { modelValue: true, title: '提示', beforeClose }, attachTo: document.body })
    await nextTick()
    ;(document.querySelector('.ui-dialog__panel__close') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    )
    await nextTick()
    expect(beforeClose).toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it.fails('Table：对外暴露的行对象是内部代理，按调用方引用回传接口会静默失效', async () => {
    // Table 内部对 props.data 做了深层 reactive 包装，渲染、row-click 载荷、
    // getSelectionRows 返回值都是代理对象，与调用方自己的行对象 !==；
    // 而 toggleRowSelection 用 indexOf 定位行，传原始对象时 index < 0 直接 return，
    // 既不勾选也不抛 selection-change，调用方无从察觉
    const data = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' }
    ]
    const wrapper = mount(Table, {
      props: { data, rowKey: 'id' },
      slots: {
        default: () => [h(TableColumn, { type: 'selection' }), h(TableColumn, { prop: 'name', label: '名称' })]
      },
      attachTo: document.body
    })
    await nextTick()
    const api = wrapper.vm as any
    api.toggleRowSelection(data[0], true)
    await nextTick()
    expect(api.getSelectionRows()).toHaveLength(1)
    expect(api.getSelectionRows()[0]).toBe(data[0])
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it.fails('Dialog：modal=false 仍带 ui-dialog--modal 类名', async () => {
    // features/modal 的 className 是无条件常量，没有读 modal 取值；
    // 遮罩节点能正确去掉，但类名恒定，按该类名挂钩的主题样式会误命中
    const wrapper = mount(Dialog, { props: { modelValue: true, modal: false }, attachTo: document.body })
    await nextTick()
    expect(Array.from((document.querySelector('.ui-dialog') as HTMLElement).classList)).not.toContain(
      'ui-dialog--modal'
    )
    wrapper.unmount()
    document.body.innerHTML = ''
  })
})
