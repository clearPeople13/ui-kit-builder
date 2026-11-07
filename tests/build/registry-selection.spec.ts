import { describe, expect, it } from 'vitest'
import { resolveSelection } from './_helpers'
import type { Registry } from './_helpers'

/**
 * resolveSelection 展开特性 requires 时的健壮性（A4）。
 * 旧实现 visit 在递归之后才入 seen：同组件内 A↔B 互 requires（如 table 的
 * table.filter ↔ table.sort 这类组合）会无限递归直到 RangeError 爆栈。
 * 用内存里的合成注册表覆盖，不碰 dist / 真实组件源码。
 */
function featureSpec(title: string, requires?: string[]) {
  return { title, exportName: title, module: `./features/${title}`, requires }
}

function registryWith(features: Record<string, { title: string; requires?: string[] }>): Registry {
  return {
    name: '@demo/ui-kit',
    version: '0.0.0-probe',
    order: ['alpha'],
    components: {
      alpha: {
        id: 'alpha',
        exports: [
          {
            name: 'Alpha',
            createExport: 'createAlpha',
            module: './core',
            coreProps: [],
            features: Object.fromEntries(
              Object.entries(features).map(([id, spec]) => [id, featureSpec(spec.title, spec.requires)])
            )
          }
        ]
      }
    }
  } as unknown as Registry
}

function catchStatus(run: () => unknown) {
  try {
    run()
  } catch (error) {
    return error
  }
  return null
}

describe('resolveSelection 的 requires 展开（A4）', () => {
  it('互 requires 成环时抛带 status=400 的清晰错误，而不是 RangeError 爆栈', () => {
    const registry = registryWith({
      'alpha.x': { title: 'AlphaX', requires: ['alpha.y'] },
      'alpha.y': { title: 'AlphaY', requires: ['alpha.x'] }
    })
    const caught = catchStatus(() => resolveSelection(registry, { alpha: ['alpha.x'] }))
    expect(caught, '成环必须抛错，而不是无限递归').toBeTruthy()
    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).constructor.name).not.toBe('RangeError')
    expect((caught as { status?: number }).status).toBe(400)
    expect(String((caught as Error).message)).toContain('循环')
  })

  it('自引用（requires 自己）同样按循环依赖处理', () => {
    const registry = registryWith({ 'alpha.x': { title: 'AlphaX', requires: ['alpha.x'] } })
    const caught = catchStatus(() => resolveSelection(registry, { alpha: ['alpha.x'] }))
    expect(caught).toBeInstanceOf(Error)
    expect((caught as { status?: number })?.status).toBe(400)
  })

  it('不成环的 requires（含菱形依赖）仍正常展开且去重', () => {
    const registry = registryWith({
      'alpha.a': { title: 'AlphaA', requires: ['alpha.b', 'alpha.c'] },
      'alpha.b': { title: 'AlphaB', requires: ['alpha.c'] },
      'alpha.c': { title: 'AlphaC' }
    })
    // 深度优先：alpha.c 先被 alpha.b 拉进来，alpha.a 直接依赖它时命中 seen 去重
    expect(resolveSelection(registry, { alpha: ['alpha.a'] })).toEqual({
      alpha: ['alpha.c', 'alpha.b', 'alpha.a']
    })
  })
})
