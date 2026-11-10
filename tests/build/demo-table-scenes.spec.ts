import { describe, expect, it } from 'vitest'
import { loadRegistry } from '../../registry.mjs'
import { SCENE_PRESETS, resolvePresetValue } from '../../examples/consumer/src/demo/presets'

const MIN_ROWS = 5000
const scenes = SCENE_PRESETS.Table ?? []

function countRows(rows: unknown): number {
  if (!Array.isArray(rows)) {
    return 0
  }
  let total = 0
  const walk = (list: unknown) => {
    if (!Array.isArray(list)) {
      return
    }
    for (const row of list) {
      total += 1
      const record = row as { children?: unknown; subs?: unknown }
      walk(record?.children)
      walk(record?.subs)
    }
  }
  walk(rows)
  return total
}

describe('调试台表格示例大数据契约', () => {
  it('每个示例都声明了惰性大数据工厂', () => {
    expect(scenes.length).toBeGreaterThanOrEqual(40)
    for (const scene of scenes) {
      expect(typeof scene.values.data, `${scene.id} 的 data 必须是惰性工厂`).toBe('function')
      const rows = resolvePresetValue(scene.values.data)
      expect(countRows(rows), `${scene.id} 的行数`).toBeGreaterThanOrEqual(MIN_ROWS)
    }
  })

  it('每个示例都窗口化渲染或明确使用 auto 布局', () => {
    for (const scene of scenes) {
      const autoLayout = scene.values.tableLayout === 'auto'
      if (autoLayout) {
        continue
      }
      expect(scene.values.virtual, `${scene.id} 需要开启 virtual`).toBe(true)
      expect(scene.values.height ?? scene.values.maxHeight, `${scene.id} 缺少可视高度`).toBeTruthy()
      expect(scene.values.rowKey, `${scene.id} 缺少稳定 rowKey`).toBe('id')
    }
  })

  it('表格现有特性都能在示例里找到入口', async () => {
    const registry = await loadRegistry()
    const table = registry.components.table
    const features = new Set<string>()
    for (const entry of table.exports) {
      for (const feature of Object.keys(entry.features ?? {})) {
        features.add(feature)
      }
    }
    for (const feature of features) {
      const covered = scenes.some((scene) => {
        const requires = scene.requires
        const list = Array.isArray(requires) ? requires : requires ? [requires] : []
        return list.includes(feature)
      })
      expect(covered, `${feature} 没有对应示例`).toBe(true)
    }
  })
})
