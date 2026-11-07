import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
const componentsDir = path.join(repoRoot, 'packages/ui-kit/src/components')

/**
 * A24 写法收敛守卫：组件 core.ts 只许走 createUiComponent 基座，
 * 手写 defineComponent 必须登记豁免并带理由（治理校验，拦新增）。
 * 豁免理由聚焦"语义不在基座覆盖范围"，不是"来不及改"。
 */
const EXEMPTIONS: Record<string, string> = {
  // Transition 包装壳，不是 ui-kit 元素节点（无 baseClass/特性体系语义）
  'collapse-transition': 'Transition 过渡壳，非元素组件',
  // 纯注册/逻辑节点：provide 上下文与 vnode 收集，不渲染自有元素
  collection: '纯注册节点（display:contents），无渲染语义',
  // 焦点管理 headless 逻辑组，DOM 结构由消费方决定，不走基座渲染
  'roving-focus-group': 'headless 焦点组，无自有渲染结构',
  // 原生滚动能力封装： expose/事件面与基座 render 管线不重合
  scrollbar: '原生滚动封装，自有 expose/事件面与基座不重合',
  // 渲染工具（render-utility），把内容吐到指定出口，非元素组件
  slot: '渲染工具节点，非元素组件',
  // 表格渲染管线（表头/表体/虚拟滚动/特性挂载点）与基座单节点模型差距大，迁移单列波次
  table: '渲染管线复杂（表头/表体/虚拟滚动），迁移单列波次'
}

describe('写法收敛守卫（A24）', () => {
  it('手写 defineComponent 的组件必须全部登记豁免且理由非空', () => {
    const offenders: string[] = []
    const undocumented: string[] = []
    for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue
      }
      const core = path.join(componentsDir, entry.name, 'core.ts')
      if (!fs.existsSync(core)) {
        continue
      }
      const source = fs.readFileSync(core, 'utf8')
      // createUiComponent 基座内部就是 defineComponent，只看组件目录的实现文件
      if (!/defineComponent\s*\(/.test(source)) {
        continue
      }
      const reason = EXEMPTIONS[entry.name]
      if (!reason) {
        offenders.push(entry.name)
      } else if (!reason.trim()) {
        undocumented.push(entry.name)
      }
    }
    expect(offenders, `以下组件手写 defineComponent 但未登记豁免：${offenders.join('、')}`).toEqual([])
    expect(undocumented).toEqual([])
  })

  it('豁免清单里的组件确实仍手写 defineComponent（防豁免漂移成死登记）', () => {
    const stale: string[] = []
    for (const [componentId, reason] of Object.entries(EXEMPTIONS)) {
      const core = path.join(componentsDir, componentId, 'core.ts')
      expect(reason.trim().length, `${componentId} 豁免理由不能为空`).toBeGreaterThan(0)
      if (!fs.existsSync(core)) {
        stale.push(`${componentId}（目录不存在）`)
        continue
      }
      if (!/defineComponent\s*\(/.test(fs.readFileSync(core, 'utf8'))) {
        stale.push(`${componentId}（已迁基座，豁免应移除）`)
      }
    }
    expect(stale, `豁免清单漂移：${stale.join('、')}`).toEqual([])
  })
})
