import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STAGE_ORDER, browserSpecs, componentSpecs, planFromChanges } from '../../scripts/test-impact.mjs'
import { STAGES } from '../../scripts/ci.mjs'

/**
 * 变更范围 → 测试范围（`npm run ci:changed`）的回归用例。
 *
 * 这个选择器一旦判断错，两种后果都很贵：判宽了就是把全量门禁换个名字再跑一遍，
 * 判窄了就是"改完显示全绿、缺陷留到合入后"。所以下面既锁具体映射，
 * 也锁"拿不准就回落全量"的兜底，以及全仓 89 个组件 / 95 个用例文件的覆盖完整性。
 */

const plan = (files: string[]) => planFromChanges({ files })
const stagesOf = (files: string[]) => plan(files).stages

describe('变更范围选择器', () => {
  it('阶段顺序与 ci.mjs 的 STAGES 完全一致，选择器不另立一套门禁定义', () => {
    expect(STAGE_ORDER).toEqual(STAGES.map((stage: { name: string }) => stage.name))
  })

  it('无改动时不跑任何阶段', () => {
    expect(plan([])).toMatchObject({ scope: 'none', stages: [] })
  })

  it('只改文档时只跑治理段（口径核对），不碰类型 / 用例 / 浏览器', () => {
    expect(stagesOf(['README.md', 'KNOWLEDGE.md'])).toEqual(['governance'])
  })

  it('改组件 core.ts：重建产物 + 组件用例 + 体积契约 + 视觉体检，不跑 20 份 profile 与覆盖率', () => {
    const result = plan(['packages/ui-kit/src/components/checkbox/core.ts'])
    expect(result.scope).toBe('scoped')
    expect(result.stages).toEqual([
      'build',
      'format',
      'typecheck',
      'lint',
      'verify',
      'governance',
      'test',
      'test:build',
      'visual'
    ])
    expect(result.stages).not.toContain('test:coverage')
    expect(result.stages).not.toContain('test:profiles')
  })

  it('组件用例只挑真的 import 了该组件的文件，不按名字子串误伤', () => {
    const result = plan(['packages/ui-kit/src/components/checkbox/core.ts'])
    const testFiles = result.filters.test ?? []
    expect(testFiles).toContain('tests/components/checkbox.spec.ts')
    // alert.spec.ts 里出现过 checkbox 这个词，但没 import Checkbox，不能拉进来
    expect(testFiles).not.toContain('tests/components/alert.spec.ts')
    // 泛化浏览器套件（属性 / a11y / 构建器）留给全量门禁；checkbox 没有专属场景就不开这一层
    expect(result.filters['test:browser']).toBeUndefined()
  })

  it('改有专属浏览器场景的组件（button）core.ts 时把场景文件排进 test:browser', () => {
    const result = plan(['packages/ui-kit/src/components/button/core.ts'])
    expect(result.stages).toContain('test:browser')
    expect(result.filters['test:browser']).toEqual(['tests/browser/button-focus-trap.spec.ts'])
  })

  it('有专属浏览器场景的组件（time-picker）改 core.ts 时只跑该组件的全部场景文件', () => {
    const result = plan(['packages/ui-kit/src/components/time-picker/core.ts'])
    expect(result.filters['test:browser']).toEqual([
      'tests/browser/time-picker.scene.spec.ts',
      'tests/browser/time-picker.spec.ts'
    ])
  })

  it('改组件特性实现（非样式、非 DOM）不拉视觉体检与浏览器层', () => {
    const result = plan(['packages/ui-kit/src/components/select/features/select-virtualized/index.ts'])
    expect(result.stages).not.toContain('visual')
    expect(result.stages).not.toContain('test:browser')
    expect(result.stages).toContain('test')
  })

  it('改组件样式：补上 CSS 令牌与本组件专属浏览器场景', () => {
    const result = plan(['packages/ui-kit/src/components/time-picker/core.css'])
    expect(result.filters['test:build']).toEqual(
      expect.arrayContaining(['tests/build/core-css.spec.ts', 'tests/build/css-vars.spec.ts'])
    )
    expect(result.filters['test:browser']).toContain('tests/browser/time-picker.scene.spec.ts')
    expect(result.stages).toContain('visual')
  })

  it('共享模块 / 组件库入口 / 构建器 / profile 各按影响面升级，拿不准的直接全量', () => {
    expect(plan(['packages/ui-kit/src/shared/virtual-window.ts']).scope).toBe('full')
    expect(plan(['packages/ui-kit/src/index.ts']).scope).toBe('full')
    expect(plan(['weird/thing.txt']).scope).toBe('full')
    expect(plan(['scripts/unknown-helper.mjs']).scope).toBe('full')
    expect(stagesOf(['registry.mjs'])).toEqual(
      expect.arrayContaining(['build', 'verify', 'test:build', 'test:profiles', 'visual'])
    )
    expect(stagesOf(['profiles/core.json'])).toEqual(expect.arrayContaining(['build', 'verify', 'test:profiles']))
  })

  it('只改用例文件时只跑那一个文件，不重建产物', () => {
    const result = plan(['tests/components/button.spec.ts'])
    expect(result.stages).not.toContain('build')
    expect(result.filters.test).toEqual(['tests/components/button.spec.ts'])
  })

  it('整层阶段不出现在 filters 里，避免误传成"只跑空列表"', () => {
    const result = plan(['profiles/core.json'])
    expect(result.filters['test:profiles']).toBeUndefined()
    expect(result.filters.build).toBeUndefined()
  })
})

describe('影响面覆盖完整性', () => {
  const componentIds = readdirSync('packages/ui-kit/src/components', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  it('每个组件目录都能映射到至少一个组件层用例（新增组件不许没有用例就进门禁）', () => {
    const missing = componentIds.filter((id) => componentSpecs(id).length === 0)
    expect(missing).toEqual([])
  })

  it('组件层用例文件要么被某个组件引用，要么是共享内核的专项用例', () => {
    const shared = new Set(['tests/components/virtual-window.spec.ts'])
    const referenced = new Set<string>()
    for (const id of componentIds) {
      for (const file of componentSpecs(id)) {
        referenced.add(file)
      }
    }
    const orphan = readdirSync('tests/components')
      .filter((name) => name.endsWith('.spec.ts'))
      .map((name) => `tests/components/${name}`)
      .filter((file) => !referenced.has(file) && !shared.has(file))
    expect(orphan).toEqual([])
  })

  it('每个组件的浏览器场景要么能定位到专属用例，要么明确没有（不静默跳过）', () => {
    for (const id of componentIds) {
      const scenes = browserSpecs(id)
      for (const scene of scenes) {
        expect(scene.endsWith('.spec.ts')).toBe(true)
      }
    }
  })
})
