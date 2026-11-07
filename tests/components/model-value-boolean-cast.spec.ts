import { mount } from '@vue/test-utils'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { SelectV2 } from '@ui-kit-full'

/**
 * 受控值通道的布尔归一守卫。
 *
 * Vue 的 prop 布尔转换有个副作用：只要 `type` 数组里出现 Boolean 且没写 default，
 * "父组件没传" 就会被归一成 `false`，而不是 `undefined`。对 `modelValue` 来说这是
 * 行为缺陷——组件会把 false 当成一个真实选中值：占位符被吃掉、`value: false` 的选项
 * 自动高亮。F-2 / F-4 / F-13 / F-14（选项值类）与 F-37（Segmented）、F-38（SelectV2）
 * 是同一个坑的第 5、6 次出现，所以这里把它固化成一条静态扫描 + 一条真实渲染断言。
 */

const componentsRoot = resolve(process.cwd(), 'packages/ui-kit/src/components')

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full))
    } else if (/\.ts$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

/** 取出 `modelValue: { ... }` 这段声明的原文（靠括号配对，容忍跨行写法） */
function modelValueDeclaration(src: string): string[] {
  const found: string[] = []
  const re = /\bmodelValue:\s*\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    let depth = 0
    let i = m.index + m[0].length - 1
    for (; i < src.length; i++) {
      if (src[i] === '{') {
        depth++
      } else if (src[i] === '}') {
        depth--
        if (depth === 0) {
          break
        }
      }
    }
    found.push(src.slice(m.index, i + 1))
  }
  return found
}

describe('modelValue 布尔联合类型必须显式声明 default', () => {
  it('组件源码里不存在"Boolean 联合类型 + 无 default"的 modelValue 声明', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(componentsRoot)) {
      const src = readFileSync(file, 'utf8')
      if (!src.includes('modelValue')) {
        continue
      }
      for (const decl of modelValueDeclaration(src)) {
        const type = decl.match(/type:\s*\[([^\]]*)\]/)
        const isUnionWithBoolean = !!type && /\bBoolean\b/.test(type[1])
        const hasDefault = /\bdefault\s*:/.test(decl)
        if (isUnionWithBoolean && !hasDefault) {
          offenders.push(`${file.replace(componentsRoot, 'components')} -> ${decl.replace(/\s+/g, ' ')}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('dist 产物里的 SelectV2 也带着这条 default（构建没有把它抹掉）', () => {
    const props = (SelectV2 as unknown as { props: Record<string, { default?: unknown }> }).props
    expect('default' in props.modelValue).toBe(true)
    expect(props.modelValue.default).toBeUndefined()
  })
})

describe('SelectV2 未受控时的布尔选项（F-38 回归）', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const options = [
    { label: '否', value: false },
    { label: '是', value: true }
  ]

  it('未传 modelValue 时显示占位符，而不是把 false 当选中值', () => {
    const wrapper = mount(SelectV2, { props: { options, placeholder: '请选择' }, attachTo: document.body })
    expect(wrapper.find('.ui-select-v2__placeholder').exists()).toBe(true)
    expect(wrapper.find('.ui-select-v2__selected').exists()).toBe(false)
  })

  it('显式传 modelValue=false 时仍然正确回显 false 对应的选项', () => {
    const wrapper = mount(SelectV2, { props: { options, modelValue: false }, attachTo: document.body })
    expect(wrapper.find('.ui-select-v2__selected').text()).toBe('否')
    expect(wrapper.find('.ui-select-v2__placeholder').exists()).toBe(false)
  })

  it('受控切到 true 时高亮跟随，未受控实例不受影响', async () => {
    const wrapper = mount(SelectV2, { props: { options, modelValue: false }, attachTo: document.body })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('.ui-select-v2__selected').text()).toBe('是')
    await wrapper.setProps({ modelValue: undefined })
    expect(wrapper.find('.ui-select-v2__placeholder').exists()).toBe(true)
  })
})
