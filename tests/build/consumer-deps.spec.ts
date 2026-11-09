import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

/**
 * 消费方示例的 @demo 依赖必须与 dist/ 的 profile 产物一一对应（F-73）。
 * 以前这份清单靠手写维护，chinese 产出了却一直没进示例工程，直到第九批才被审计发现。
 * 修法是脚本生成（npm run sync:consumer-deps）+ 这条用例守住漂移。
 */
describe('消费方代码高亮的依赖预构建（F-118）', () => {
  it('Shiki 走 fine-grained 静态入口，Vite 提前预构建 theme/lang/wasm', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'examples/consumer/src/demo/use-highlight.ts'), 'utf8')
    for (const entry of [
      "from 'shiki/core'",
      "from 'shiki/engine/oniguruma'",
      "from '@shikijs/themes/github-light'",
      "from '@shikijs/langs/vue'",
      "from 'shiki/wasm'"
    ]) {
      expect(source).toContain(entry)
    }
    expect(source).not.toMatch(/from 'shiki'/)
    const config = fs.readFileSync(path.join(repoRoot, 'examples/consumer/vite.config.mjs'), 'utf8')
    for (const dependency of [
      'shiki/core',
      'shiki/engine/oniguruma',
      'shiki/wasm',
      '@shikijs/themes/github-light',
      '@shikijs/langs/vue'
    ]) {
      expect(config).toContain(`'${dependency}'`)
    }
  })
})

describe('消费方依赖与 profile 产物一致（C4）', () => {
  it('@demo 依赖覆盖全部 profile 产物，路径指向 dist/', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'examples/consumer/package.json'), 'utf8')) as {
      dependencies: Record<string, string>
    }
    const expected: Record<string, string> = {}
    for (const entry of fs.readdirSync(path.join(repoRoot, 'profiles'))) {
      if (!entry.endsWith('.json')) {
        continue
      }
      const config = JSON.parse(fs.readFileSync(path.join(repoRoot, 'profiles', entry), 'utf8')) as {
        name: string
      }
      const distName = JSON.parse(
        fs.readFileSync(path.join(repoRoot, 'dist', config.name, 'package.json'), 'utf8')
      ) as { name: string }
      expected[distName.name] = `file:../../dist/${config.name}`
    }
    const actual = Object.fromEntries(
      Object.entries(pkg.dependencies).filter(([name]) => name.startsWith('@demo/ui-kit-'))
    )
    expect(actual).toEqual(expected)
  })
})
