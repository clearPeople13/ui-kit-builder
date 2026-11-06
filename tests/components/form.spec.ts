import { mount } from '@vue/test-utils'
import { h, nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { Form, FormItem, Input } from '@ui-kit-full'

// FormItem 需要读 model 才能取到字段值，用例统一用 Form + FormItem 组合
const model = () => ({ name: '', mail: '' })

describe('Form', () => {
  it('渲染 form 容器与 label 布局类名', () => {
    const wrapper = mount(Form, { props: { model: model(), labelPosition: 'top', inline: true, size: 'small' } })
    expect(wrapper.classes()).toContain('ui-form')
    expect(wrapper.classes()).toContain('is-label-top')
    expect(wrapper.classes()).toContain('is-inline')
    expect(wrapper.classes()).toContain('is-size-small')
    expect(wrapper.find('form.ui-form__inner').exists()).toBe(true)
  })

  it('labelWidth 写入 CSS 变量', () => {
    const wrapper = mount(Form, { props: { model: model(), labelWidth: 120 } })
    expect(wrapper.attributes('style')).toContain('--ui-form-label-width: 120px')
    expect(mount(Form, { props: { model: model() } }).attributes('style')).toContain('--ui-form-label-width: 96px')
  })

  it('整表 disabled 落到类名', () => {
    expect(mount(Form, { props: { model: model(), disabled: true } }).classes()).toContain('is-disabled')
  })

  it('提交事件被阻止默认行为', async () => {
    const wrapper = mount(Form, { props: { model: model() } })
    const submit = wrapper.find('form').element as HTMLFormElement
    let defaultPrevented = false
    submit.addEventListener('submit', (event) => {
      defaultPrevented = event.defaultPrevented
    })
    submit.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await nextTick()
    expect(defaultPrevented).toBe(true)
  })
})

describe('FormItem', () => {
  it('渲染 label、内容与 for 关联', () => {
    const wrapper = mount(Form, {
      props: { model: model() },
      slots: { default: () => [h(FormItem, { prop: 'name', label: '名称', for: 'kw' }, () => h(Input))] }
    })
    const item = wrapper.find('.ui-form-item')
    expect(item.exists()).toBe(true)
    expect(wrapper.find('.ui-form-item__label').text()).toContain('名称')
    expect(wrapper.find('label').attributes('for')).toBe('kw')
  })

  it('labelWidth 覆盖整表设置', () => {
    const wrapper = mount(Form, {
      props: { model: model(), labelWidth: 80 },
      slots: { default: () => [h(FormItem, { prop: 'name', label: '名称', labelWidth: 200 }, () => h(Input))] }
    })
    expect(wrapper.find('.ui-form-item').attributes('style')).toContain('--ui-form-item-label-width: 200px')
  })

  it('labelSuffix 渲染在文案之后', () => {
    const wrapper = mount(Form, {
      props: { model: model(), labelSuffix: ' :' },
      slots: { default: () => [h(FormItem, { prop: 'name', label: '名称' }, () => h(Input))] }
    })
    expect(wrapper.find('.ui-form-item__label-suffix').text()).toBe(':')
  })

  it('required 标记星号类名，可用 hideRequiredAsterisk 隐藏', () => {
    const wrapper = mount(Form, {
      props: { model: model() },
      slots: { default: () => [h(FormItem, { prop: 'name', label: '名称', required: true }, () => h(Input))] }
    })
    expect(wrapper.find('.ui-form-item').classes()).toContain('is-required')
    const hidden = mount(Form, {
      props: { model: model(), hideRequiredAsterisk: true },
      slots: { default: () => [h(FormItem, { prop: 'name', label: '名称', required: true }, () => h(Input))] }
    })
    expect(hidden.find('.ui-form-item').classes()).toContain('is-hide-asterisk')
  })

  it('requireAsteriskPosition=right 切换星号位置类名', () => {
    const wrapper = mount(Form, {
      props: { model: model(), requireAsteriskPosition: 'right' },
      slots: { default: () => [h(FormItem, { prop: 'name', label: '名称', required: true }, () => h(Input))] }
    })
    expect(wrapper.find('.ui-form-item').classes()).toContain('is-asterisk-right')
  })
})

describe('Form 校验', () => {
  it('required 规则命中空值时显示错误文案', async () => {
    const wrapper = mount(Form, {
      props: { model: { name: '' }, rules: { name: [{ required: true, message: '请输入名称' }] } },
      slots: { default: () => [h(FormItem, { prop: 'name', label: '名称' }, () => h(Input, { modelValue: '' }))] }
    })
    await nextTick()
    const item = wrapper.find('.ui-form-item')
    expect(item.classes()).toContain('is-error')
    expect(wrapper.find('.ui-form-item__error').text()).toBe('请输入名称')
  })

  it('缺省错误文案使用内置提示', async () => {
    const wrapper = mount(Form, {
      props: { model: { name: '' }, rules: { name: [{ required: true }] } },
      slots: { default: () => [h(FormItem, { prop: 'name' }, () => h(Input))] }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').text()).toBe('该字段为必填项')
  })

  it('填值后错误自动消除', async () => {
    // model / rules 必须是响应式对象，否则 Form 的深层 watch 不会触发再校验
    const state = reactive({ name: '' })
    const wrapper = mount(
      {
        setup() {
          return () =>
            h(Form, { model: state, rules: { name: [{ required: true, message: '必填' }] } }, () => [
              h(FormItem, { prop: 'name', label: '名称' }, () => h(Input, { modelValue: state.name }))
            ])
        }
      },
      { attachTo: document.body }
    )
    await nextTick()
    expect(wrapper.find('.ui-form-item').classes()).toContain('is-error')
    state.name = '张三'
    await nextTick()
    await nextTick()
    expect(wrapper.find('.ui-form-item').classes()).not.toContain('is-error')
    expect(wrapper.find('.ui-form-item__error').exists()).toBe(false)
    wrapper.unmount()
  })

  it('min / max 按长度校验', async () => {
    const wrapper = mount(Form, {
      props: { model: { name: 'ab' }, rules: { name: [{ min: 3, message: '至少 3 个字符' }] } },
      slots: { default: () => [h(FormItem, { prop: 'name' }, () => h(Input))] }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').text()).toBe('至少 3 个字符')
  })

  it('pattern 校验格式', async () => {
    const wrapper = mount(Form, {
      props: { model: { mail: 'no-at' }, rules: { mail: [{ pattern: /^.*@.*$/, message: '邮箱格式不正确' }] } },
      slots: { default: () => [h(FormItem, { prop: 'mail' }, () => h(Input))] }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').text()).toBe('邮箱格式不正确')
  })

  it('whitespace 规则把纯空格视为空值', async () => {
    const wrapper = mount(Form, {
      props: { model: { name: '   ' }, rules: { name: [{ required: true, whitespace: true, message: '不能为空' }] } },
      slots: { default: () => [h(FormItem, { prop: 'name' }, () => h(Input))] }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').text()).toBe('不能为空')
  })

  it('FormItem 自身 rules 优先于整表 rules', async () => {
    const wrapper = mount(Form, {
      props: { model: { name: '' }, rules: { name: [{ required: true, message: '表级规则' }] } },
      slots: {
        default: () => [h(FormItem, { prop: 'name', rules: [{ required: true, message: '项级规则' }] }, () => h(Input))]
      }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').text()).toBe('项级规则')
  })

  it('嵌套路径校验', async () => {
    const wrapper = mount(Form, {
      props: { model: { user: { name: '' } }, rules: { 'user.name': [{ required: true, message: '请填写姓名' }] } },
      slots: { default: () => [h(FormItem, { prop: 'user.name' }, () => h(Input))] }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').text()).toBe('请填写姓名')
  })

  it('showMessage=false 隐藏错误文案', async () => {
    const wrapper = mount(Form, {
      props: { model: { name: '' }, rules: { name: [{ required: true, message: '必填' }] }, showMessage: false },
      slots: { default: () => [h(FormItem, { prop: 'name' }, () => h(Input))] }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item').classes()).toContain('is-error')
    expect(wrapper.find('.ui-form-item__error').exists()).toBe(false)
  })

  it('inlineMessage 切换错误展示位置', async () => {
    const wrapper = mount(Form, {
      props: { model: { name: '' }, rules: { name: [{ required: true, message: '必填' }] }, inlineMessage: true },
      slots: { default: () => [h(FormItem, { prop: 'name' }, () => h(Input))] }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item').classes()).toContain('is-inline-message')
  })

  it('statusIcon 渲染状态图标', async () => {
    const wrapper = mount(Form, {
      props: { model: { name: '' }, rules: { name: [{ required: true, message: '必填' }] }, statusIcon: true },
      slots: { default: () => [h(FormItem, { prop: 'name' }, () => h(Input))] }
    })
    await nextTick()
    expect(wrapper.find('.ui-form-item').classes()).toContain('is-status-icon')
    expect(wrapper.find('.ui-form-item__status').exists()).toBe(true)
  })

  it('外部 error / validateStatus 直接受控', () => {
    const wrapper = mount(Form, {
      props: { model: {} },
      slots: {
        default: () => [h(FormItem, { label: '静态', error: '外部错误', validateStatus: 'error' }, () => h(Input))]
      }
    })
    expect(wrapper.find('.ui-form-item').classes()).toContain('is-error')
    expect(wrapper.find('.ui-form-item__error').text()).toBe('外部错误')
  })

  it('rules 变化时重新校验', async () => {
    const rules = reactive<{ name: Record<string, unknown>[] }>({ name: [{ required: false }] })
    const wrapper = mount(
      {
        setup() {
          return () => h(Form, { model: { name: '' }, rules }, () => [h(FormItem, { prop: 'name' }, () => h(Input))])
        }
      },
      { attachTo: document.body }
    )
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').exists()).toBe(false)
    rules.name = [{ required: true, message: '新增必填' }]
    await nextTick()
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').text()).toBe('新增必填')
    wrapper.unmount()
  })

  it('validateOnRuleChange=false 时规则变化不触发校验', async () => {
    const rules = reactive<{ name: Record<string, unknown>[] }>({ name: [{ required: false }] })
    const wrapper = mount(
      {
        setup() {
          return () =>
            h(Form, { model: { name: '' }, rules, validateOnRuleChange: false }, () => [
              h(FormItem, { prop: 'name' }, () => h(Input))
            ])
        }
      },
      { attachTo: document.body }
    )
    await nextTick()
    rules.name = [{ required: true, message: '不该立即报错' }]
    await nextTick()
    await nextTick()
    expect(wrapper.find('.ui-form-item__error').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('Form 组合辅助', () => {
  it('作用域插槽透出 model / size / labelWidth', () => {
    const wrapper = mount(Form, {
      props: { model: { name: 'x' }, size: 'large', labelWidth: 100 },
      slots: {
        default: (scope: Record<string, unknown>) => h('div', { class: 'slot-probe' }, JSON.stringify(scope.model))
      }
    })
    expect(wrapper.find('.slot-probe').text()).toContain('"name":"x"')
  })

  it('未启用校验特性时不渲染 validate 类名', () => {
    // full 包默认开启 form.validate，此处用 rules 缺省确认不会误报错
    const wrapper = mount(Form, {
      props: { model: { name: '' } },
      slots: { default: () => [h(FormItem, { prop: 'name' }, () => h(Input))] }
    })
    expect(wrapper.find('.ui-form-item').classes()).not.toContain('is-error')
    expect(wrapper.find('.ui-form-item__error').exists()).toBe(false)
  })
})
