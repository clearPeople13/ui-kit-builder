import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 主题令牌落地的最后一道文本层守卫：产物 CSS 里每一个 var(--x) 都必须有出处。
 *
 * "出处"有三种，缺一即视为悬空引用：
 * 1. 同一份 profile CSS 里有 `--x:` 声明（主题令牌落盘）
 * 2. var() 自带回退值 `var(--x, 8px)`（组件写了兜底，缺令牌也不塌）
 * 3. 组件源码里用内联 style 写入该变量（如波浪动画的 --ui-button-wave-origin-x）
 *
 * 悬空引用是静默失效：CSS 整条声明被浏览器丢掉，不报错、不进控制台，
 * 只有真渲染才看得见，而 20 份 profile 不可能逐份起浏览器，所以在文本层拦下来。
 */

const profiles = readdirSync(resolve(process.cwd(), 'profiles'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full))
    } else if (/\.(ts|vue)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

/** 源码里以字符串字面量出现的自定义属性：由组件通过内联 style 写入，算已有出处 */
const inlineWrittenVars = new Set<string>()
for (const file of sourceFiles(resolve(process.cwd(), 'packages/ui-kit/src'))) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/['"`](--[A-Za-z0-9_-]+)['"`]/g)) {
    inlineWrittenVars.add(m[1])
  }
}

function declarations(css: string): Set<string> {
  const defs = new Set<string>()
  for (const m of css.matchAll(/(?:^|[{\s;])(--[A-Za-z0-9_-]+)\s*:/g)) {
    defs.add(m[1])
  }
  return defs
}

function references(css: string): { name: string; hasFallback: boolean }[] {
  const out: { name: string; hasFallback: boolean }[] = []
  for (const m of css.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*(,)?/g)) {
    out.push({ name: m[1], hasFallback: Boolean(m[2]) })
  }
  return out
}

describe('产物 CSS 的自定义属性引用全部有出处', () => {
  it('profile 名单非空，且审计真的读到了引用（防止空转绿）', () => {
    expect(profiles.length).toBeGreaterThanOrEqual(20)
    let total = 0
    for (const profile of profiles) {
      const css = readFileSync(resolve(process.cwd(), 'dist', profile, 'ui-kit.css'), 'utf8')
      total += references(css).length
    }
    expect(total).toBeGreaterThan(1000)
  })

  for (const profile of profiles) {
    it(`${profile}：无悬空 var() 引用`, () => {
      const css = readFileSync(resolve(process.cwd(), 'dist', profile, 'ui-kit.css'), 'utf8')
      const defs = declarations(css)
      const dangling = new Set<string>()
      for (const { name, hasFallback } of references(css)) {
        if (defs.has(name) || hasFallback || inlineWrittenVars.has(name)) {
          continue
        }
        dangling.add(name)
      }
      expect([...dangling], `${profile} 存在无声明、无回退、也无内联写入出处的 var() 引用`).toEqual([])
    })
  }
})
