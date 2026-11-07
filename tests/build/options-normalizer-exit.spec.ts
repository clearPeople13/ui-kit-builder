import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

/**
 * G7-A23 防复发守卫：normalizeOptions 只允许有 shared/options.ts 一个出口。
 *
 * segmented / select / behavior 历史上各有一份函数体相同的 normalizeOptions，
 * 收拢之后组件侧只能 import，不能再出现本地定义（函数声明与函数表达式都算）。
 * 调用与 import 是允许的，扫描只针对定义点。
 */

const componentsDir = path.join(repoRoot, 'packages/ui-kit/src/components')

function collectTsFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...collectTsFiles(full))
    } else if (entry.name.endsWith('.ts')) {
      result.push(full)
    }
  }
  return result
}

describe('G7-A23：normalizeOptions 单一出口守卫', () => {
  it('components/ 下不再出现 normalizeOptions 的本地定义', () => {
    const definitions: string[] = []
    for (const file of collectTsFiles(componentsDir)) {
      const text = fs.readFileSync(file, 'utf8')
      if (/function\s+normalizeOptions\s*\(/.test(text) || /(?:const|let|var)\s+normalizeOptions\s*=[^=]/.test(text)) {
        definitions.push(path.relative(repoRoot, file))
      }
    }
    expect(
      definitions,
      `normalizeOptions 必须收拢到 packages/ui-kit/src/shared/options.ts 单一出口，` +
        `以下组件文件又出现了本地定义：${definitions.join(', ')}`
    ).toEqual([])
  })
})
