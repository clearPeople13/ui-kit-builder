import { describe, expect, it } from 'vitest'

type Stage = { name: string; script: string; fast?: boolean; fullOnly?: boolean; fullScript?: string }
const ciModule = (await import('../../scripts/ci.mjs')) as {
  STAGES: Stage[]
  selectStages: (options?: { fast?: boolean; only?: string | null }) => Stage[]
}
const { STAGES, selectStages } = ciModule

/**
 * 门禁选择器（B10）的回归用例。
 *
 * `selectStages()` 是 `ci.mjs` 与 pre-commit / CI 共用的一段分支逻辑，
 * 以前只跟着脚本一起"跑起来"，没有独立用例。四种入口组合各锁一条：
 * 全量、fast、`--stage build`、无匹配；数字与现网门禁保持一致。
 */

describe('门禁阶段选择器', () => {
  it('全量模式选中十三段，且顺序就是执行顺序', () => {
    expect(selectStages().map((stage) => stage.name)).toEqual([
      'build',
      'format',
      'typecheck',
      'lint',
      'verify',
      'governance',
      'test',
      'test:build',
      'test:profiles',
      'test:browser',
      'visual',
      'test:coverage',
      'consumer'
    ])
    expect(STAGES).toHaveLength(13)
  })

  it('fast 模式只留带 fast 标记的非 fullOnly 段（build 与五层用例都不跑）', () => {
    expect(selectStages({ fast: true }).map((stage) => stage.name)).toEqual([
      'format',
      'typecheck',
      'lint',
      'verify',
      'governance'
    ])
    const fastNames = selectStages({ fast: true }).map((stage) => stage.name)
    expect(fastNames).not.toContain('build')
    for (const name of ['test', 'test:build', 'test:profiles', 'test:browser', 'test:coverage', 'consumer']) {
      expect(fastNames).not.toContain(name)
    }
  })

  it('--stage build 按名字与脚本子串匹配，行为与现网一致', () => {
    // build 本身 + 名字里同样含 build 的 test:build，二者都由现网选择器保留
    expect(selectStages({ only: 'build' }).map((stage) => stage.name)).toEqual(['build', 'test:build'])
  })

  it('没有匹配阶段时返回空数组，由调用方给出退出码 2', () => {
    expect(selectStages({ only: 'nope' })).toEqual([])
  })
})
