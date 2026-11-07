import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadTestRegistry, repoRoot } from './_helpers'

type CategoryGroup = { id: string; title: string; hint: string; ids: string[] }
const { CATEGORY_GROUPS, CATEGORY_ORDER, CATEGORY_FALLBACK, categoryOf } = (await import(
  '../../scripts/demo-categories.mjs'
)) as {
  CATEGORY_GROUPS: CategoryGroup[]
  CATEGORY_ORDER: string[]
  CATEGORY_FALLBACK: string
  categoryOf: (componentId: string) => string
}

type DemoMeta = { categories: string[]; components: Array<{ id: string; category: string }> }

/**
 * C5：分类清单以前在构建器与调试台各写一份且已经分叉（7 组 vs 8 组）。
 * 现在只有 scripts/demo-categories.mjs 一份，构造器直接 import；
 * 这条用例守住「90 个组件恰好归属一组」以及 meta.json 的派生结果不漂移。
 */
describe('组件分类的唯一来源（C5）', () => {
  it('分组并集恰好覆盖注册表的 90 个组件，且没有重复归属', async () => {
    const registry = await loadTestRegistry()
    const ids = CATEGORY_GROUPS.flatMap((group) => group.ids)

    for (const group of CATEGORY_GROUPS) {
      expect(group.ids.length, `分组「${group.id}」不能为空`).toBeGreaterThan(0)
    }
    expect(ids, '同一个组件不能出现在两个分组里').toHaveLength(new Set(ids).size)
    expect(new Set(ids)).toEqual(new Set(registry.order))
    expect(CATEGORY_ORDER).toEqual(CATEGORY_GROUPS.map((group) => group.id))
  })

  it('categoryOf 与分组表一致，未知组件落回兜底分类', () => {
    for (const group of CATEGORY_GROUPS) {
      for (const id of group.ids) {
        expect(categoryOf(id)).toBe(group.id)
      }
    }
    expect(categoryOf('not-a-component')).toBe(CATEGORY_FALLBACK)
  })

  it('调试台 meta.json 的分类与同源清单一致', () => {
    const meta = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'examples/consumer/src/demo/meta.json'), 'utf8')
    ) as DemoMeta
    expect(meta.categories).toEqual(CATEGORY_ORDER)
    for (const component of meta.components) {
      expect(component.category, `meta.json 里 ${component.id} 的分类过期，请重新运行 npm run meta:demo`).toBe(
        categoryOf(component.id)
      )
    }
  })
})
