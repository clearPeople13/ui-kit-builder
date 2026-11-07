// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'

/**
 * SSR hydration 补盲（A16）：scripts/verify.mjs 的 SSR 冒烟只走到 renderToString，
 * "服务端渲染出的 HTML 交给客户端 hydrate 时能不能静默接管、事件是否接上"没人验过。
 *
 * 这里按 verify.mjs 同款方式直接 import dist/full 产物，但在 vitest 用例里补完另一半：
 * renderToString → 容器回填 → createSSRApp 在同一容器上 hydrate →
 * 全程 console 零告警（Vue 会把 hydration mismatch 打到 console.warn），
 * 再真实点一次标签页，证明接管后的事件链是活的。
 *
 * DOM 由 happy-dom 提供（vitest 环境注解），不引入新依赖。
 */

type KitModule = Record<string, any>

const kit = (await import('../../dist/full/ui-kit.js')) as KitModule

function createProbeApp(onTabChange?: (name: string) => void) {
  return createSSRApp({
    render: () =>
      h('div', { id: 'ssr-root' }, [
        // bgColor 走 button.bg-color 特性链（verify.mjs 的 SSR 断言同款），
        // 连特性代码一起在 SSR + hydrate 两条路上过一遍
        h(kit.Button, { id: 'ssr-button', bgColor: '#3366ff' }, { default: () => '提交' }),
        h(kit.Input, { id: 'ssr-input', modelValue: '', placeholder: 'Name' }),
        h(
          kit.Tabs,
          {
            modelValue: 'a',
            'onUpdate:modelValue': (name: string) => onTabChange?.(name)
          },
          {
            default: () => [
              h(kit.TabPane, { label: '甲', name: 'a' }, { default: () => '甲内容' }),
              h(kit.TabPane, { label: '乙', name: 'b' }, { default: () => '乙内容' })
            ]
          }
        )
      ])
  })
}

const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

afterEach(() => {
  warnSpy.mockClear()
  errorSpy.mockClear()
  document.body.innerHTML = ''
})

function hydrationNoise(): string[] {
  return [...warnSpy.mock.calls, ...errorSpy.mock.calls]
    .map((args) => args.map(String).join(' '))
    .filter((line) => !line.includes('Download the Vue Devtools'))
}

describe('full 产物的 SSR hydration（renderToString + 客户端接管）', () => {
  it('renderToString 产出完整结构', async () => {
    const html = await renderToString(createProbeApp())
    expect(html).toContain('ui-button')
    expect(html).toContain('ui-button--bg-color')
    expect(html).toContain('placeholder="Name"')
    expect(html).toContain('ui-tabs')
    expect(html).toContain('ui-tab-pane')
    expect(html).toContain('甲内容')
    // F-99：页签栏由父级从 default slot 的 VNode 声明式推导，SSR 首渲即包含导航
    expect(html.match(/ui-tabs__nav-item/g)).toHaveLength(2)
    expect(html).toContain('role="tab"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('甲')
    expect(html).toContain('乙')
  })

  it('hydrate 在同一容器上静默接管：零告警、结构不被改写', async () => {
    const html = await renderToString(createProbeApp())
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)
    const before = container.innerHTML

    const app = createProbeApp()
    app.mount(container)

    expect(hydrationNoise(), 'hydrate 过程不应出现 Vue 告警（mismatch 会打到 console.warn）').toEqual([])
    // hydrate 不是重渲：挂载完成的那一刻，服务端 HTML 逐字原样保留
    expect(container.innerHTML).toBe(before)

    // F-99 修复后页签栏在 SSR HTML 首渲即存在（父级从 slot VNode 声明式推导），
    // 挂载完成时导航已就位，等一个 tick 再核对注册补渲后的最终结构
    expect(container.querySelectorAll('.ui-tabs__nav-item')).toHaveLength(2)
    await nextTick()
    expect(container.querySelectorAll('.ui-tab-pane__content')).toHaveLength(2)
    expect(hydrationNoise(), '补渲过程同样不允许冒出控制台告警').toEqual([])
  })

  it('接管后事件链可用：点选标签页切换活动页', async () => {
    const html = await renderToString(createProbeApp())
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)

    const changed: string[] = []
    const app = createProbeApp((name) => changed.push(name))
    app.mount(container)
    await nextTick()

    const tabButtons = container.querySelectorAll<HTMLButtonElement>('.ui-tabs__nav-item')
    expect(tabButtons).toHaveLength(2)
    tabButtons[1].click()
    await nextTick()

    expect(changed, 'hydrate 之后 update:modelValue 事件应正常触发').toEqual(['b'])
    const navStates = [...container.querySelectorAll('.ui-tabs__nav-item')].map((item) =>
      item.classList.contains('is-active')
    )
    expect(navStates).toEqual([false, true])
    const paneVisibility = [...container.querySelectorAll<HTMLElement>('.ui-tab-pane__content')].map(
      (pane) => pane.style.display !== 'none'
    )
    expect(paneVisibility).toEqual([false, true])
    expect(hydrationNoise(), '交互过程同样不允许冒出控制台告警').toEqual([])
  })
})
