import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { openScene, type Session } from './_session'

const repoRoot = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
const componentsDir = path.join(repoRoot, 'packages/ui-kit/src/components')

const toPascal = (id: string) =>
  id
    .split(/[-_]/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join('')

/** 从 spec.mjs 里读出"对外声明了某个属性"的组件，属性契约以文档为准 */
function componentsDeclaring(propName: string) {
  const found: { componentId: string; exportName: string }[] = []
  for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    const spec = path.join(componentsDir, entry.name, 'spec.mjs')
    if (!fs.existsSync(spec)) {
      continue
    }
    if (new RegExp(`"name":\\s*"${propName}"`).test(fs.readFileSync(spec, 'utf8'))) {
      found.push({ componentId: entry.name, exportName: toPascal(entry.name) })
    }
  }
  return found.sort((a, b) => a.componentId.localeCompare(b.componentId))
}

/**
 * 属性契约的浏览器层扫描：属性一旦在 spec 里对外声明，就必须真的落到 DOM。
 * 单测里 mount 的节点没有布局，属性丢了通常只是"少个属性"，谁都发现不了；
 * 这里以文档为清单逐个挂载并回查，任何声明后失效的属性都会当场露出来。
 *
 * 同批扫描的还有字符串 style：宿主写 style="width: 220px" 是最常见用法，
 * 组件内部用展开合并时会把它拆成 {0:'w',…}，真浏览器里 Vue 直接抛 TypeError。
 */
describe('浏览器层 · 属性落盘契约', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('声明了 id 属性的组件，挂载后 document.getElementById 必须命中', async () => {
    const targets = componentsDeclaring('id')
    // 钉住确知声明了 id 的组件，而不是写死总数：目录增删时不会误红，正则失效时又能立刻发现
    for (const required of ['select', 'message', 'input', 'dropdown', 'input-number']) {
      expect(targets.some((item) => item.componentId === required)).toBe(true)
    }

    const failures = await session.page.evaluate(async (list: { componentId: string; exportName: string }[]) => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const bad: string[] = []
      for (const item of list) {
        const component = kit[item.exportName]
        if (!component) {
          bad.push(`${item.componentId}: 导出 ${item.exportName} 不存在`)
          continue
        }
        const host = document.createElement('div')
        document.body.appendChild(host)
        const marker = `probe-id-${item.componentId}`
        try {
          const app = createApp({ render: () => h(component, { id: marker }) })
          app.mount(host)
          if (!document.getElementById(marker)) {
            bad.push(`${item.componentId}: id 未落到 DOM`)
          }
          app.unmount()
        } catch (error) {
          bad.push(`${item.componentId}: 挂载抛错 ${String((error as Error).message).slice(0, 60)}`)
        }
        host.remove()
      }
      return bad
    }, targets)

    expect(failures).toEqual([])
  })

  it('字符串 style 不会让组件挂载失败，且原样落到根节点', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const names = Object.keys(kit).filter(
        (name) =>
          /^[A-Z]/.test(name) && !name.startsWith('DEFAULT_') && name !== 'UI_ICONS' && !name.startsWith('active')
      )
      // 三个节点的 style 语义本就不在根节点上，逐个说明理由，其余一律要求原样落盘：
      //  - Aside：宽度是 width 属性的职责，组件样式在用户 style 之后合并，属性优先是既有契约
      //  - CollectionItem：inheritAttrs:false 的纯注册节点，style 固定 display:contents，不转发 attrs
      //  - Popover：style/className 按文档路由到面板（面板才有宽度），触发器不拿样式
      const exceptions = ['Aside', 'CollectionItem', 'Popover']
      // 默认属性下根本不渲染元素的节点：只吐 slot 的抽象层与过渡壳，挂载它们没有内容
      const bad: string[] = []
      const empty: string[] = []
      const skipped: string[] = []
      for (const name of names) {
        const component = kit[name]
        const host = document.createElement('div')
        document.body.appendChild(host)
        try {
          const app = createApp({ render: () => h(component, { style: 'width: 220px' }) })
          app.mount(host)
          const root = host.firstElementChild as HTMLElement | null
          if (!root) {
            empty.push(name)
          } else if (exceptions.includes(name)) {
            skipped.push(name)
          } else if (!(root.getAttribute('style') ?? '').includes('220px')) {
            bad.push(`${name}: 根节点未拿到 width:220px（style="${(root.getAttribute('style') ?? '').slice(0, 60)}"）`)
          }
          app.unmount()
        } catch (error) {
          bad.push(`${name}: 字符串 style 挂载抛错 ${String((error as Error).message).slice(0, 60)}`)
        }
        host.remove()
      }
      return { bad, empty, skipped, total: names.length }
    })

    expect(result.total).toBeGreaterThan(90)
    expect(result.bad).toEqual([])
    expect(result.empty.sort()).toEqual(['CollapseTransition', 'Collection', 'OnlyChild'])
    expect(result.skipped.sort()).toEqual(['Aside', 'CollectionItem', 'Popover'])
  })

  it('Popover 的 style 按契约落到面板上，而不是触发器', async () => {
    const panel = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        render: () =>
          h(
            kit.Popover,
            // 用 padding 而不是 width 验证路由：面板宽度是 width 属性的职责（默认 150），
            // 组件样式在用户 style 之后合并，属性优先是既有契约
            { trigger: 'click', style: 'padding: 11px; border-radius: 9px', popperClass: 'probe-popover-style' },
            {
              default: () => h('button', { id: 'probe-popover-trigger' }, '打开'),
              content: () => h('div', {}, '面板内容')
            }
          )
      })
      app.mount(host)
      document.getElementById('probe-popover-trigger')?.click()
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
      const node = document.querySelector<HTMLElement>('.probe-popover-style')
      const detail = {
        style: node?.getAttribute('style') ?? '',
        padding: node ? getComputedStyle(node).paddingTop : '',
        triggerStyle: (host.querySelector('button')?.parentElement?.getAttribute('style') ?? '').slice(0, 60)
      }
      app.unmount()
      host.remove()
      return detail
    })

    expect(panel.style).toContain('padding: 11px')
    expect(panel.style).toContain('border-radius: 9px')
    expect(panel.padding).toBe('11px')
  })
})
