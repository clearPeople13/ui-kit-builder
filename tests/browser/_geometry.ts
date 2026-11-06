import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from 'playwright'

/**
 * 布局指纹：把"元素在哪、多大"存成 JSON 快照，用真实浏览器复核 CSS 与布局。
 *
 * 单元测试跑在 happy-dom 里，所有矩形的宽高都是 0——样式表写错、外边距塌陷、
 * 冻结列宽度算错、面板撑破视口，这类问题在单测里永远不会红。
 * 像素截图快照依赖字体与抗锯齿，跨机器直比不现实；这里退一步只比几何：
 * 固定 1280×720 视口下取锚点元素的文档坐标与尺寸，容差 1px，
 * 既能抓到布局漂移，又不会因为换台机器就整片误报。
 */

/** 每个场景的锚点选择器：宁可少而准，锚点缺失会被单独记成 MISSING */
export const ANCHORS: Record<string, string[]> = {
  floating: [
    '#pop-scroll',
    '#tip-flow',
    '#select-flow',
    '#tip-bottom',
    '#pop-right',
    '#drop-right',
    '#select-right',
    '.tall-page'
  ],
  table: [
    '#probe-table',
    '.ui-table__wrapper',
    '.ui-table__header-view',
    '.ui-table__summary-row',
    '.ui-table__wrapper colgroup col'
  ],
  tree: ['#tree-box', '#tree-wide-box', '.ui-tree__node', '.ui-tree__label'],
  color: ['#probe-color', '.ui-color-picker__sv', '.ui-color-picker__hue', '.ui-color-picker__hex'],
  a11y: ['#a11y-input', '.ui-dropdown__trigger', '.ui-tabs__nav-item', '.ui-switch__inner'],
  // 全家桶页按默认属性渲染所有组件：这里兜住"某个组件的样式整体塌了"
  gallery: ['[data-gallery]']
}

/** 锚点数量上限：表格 colgroup、树节点这类会成百上千，取头部即可代表布局 */
const MAX_PER_ANCHOR = 60

export type Boxes = number[][]
export type Fingerprint = Record<string, Boxes | string>
export type SnapshotFile = Record<string, Record<string, Fingerprint>>

const repoRoot = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
export const snapshotPath = path.join(repoRoot, 'tests/browser/__snapshots__/geometry.json')

/** 字体度量与滚动条宽度按平台不同，快照按平台分桶，各平台各自基线 */
export const platformKey = (): string => process.platform

export function readSnapshot(): SnapshotFile {
  if (!fs.existsSync(snapshotPath)) {
    return {}
  }
  return JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as SnapshotFile
}

export function writeSnapshot(file: SnapshotFile): void {
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true })
  fs.writeFileSync(snapshotPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
}

/** 在页面里取锚点矩形，坐标换算到文档空间，避免受当前滚动位置影响 */
export async function fingerprint(page: Page, scene: string): Promise<Fingerprint> {
  const anchors = ANCHORS[scene]
  if (!anchors) {
    throw new Error(`场景 ${scene} 没有登记布局锚点`)
  }
  return (await page.evaluate(
    ({ selectors, limit }) => {
      const out: Record<string, any> = {}
      for (const selector of selectors) {
        const nodes = Array.from(document.querySelectorAll(selector))
        if (nodes.length === 0) {
          out[selector] = 'MISSING'
          continue
        }
        out[selector] = nodes.slice(0, limit).map((node) => {
          const box = node.getBoundingClientRect()
          return [
            Math.round(box.left + window.scrollX),
            Math.round(box.top + window.scrollY),
            Math.round(box.width),
            Math.round(box.height)
          ]
        })
      }
      out['<document>'] = [[0, 0, 0, Math.round(document.documentElement.scrollHeight)]]
      return out
    },
    { selectors: anchors, limit: MAX_PER_ANCHOR }
  )) as unknown as Fingerprint
}

const sameNumber = (a: number, b: number) => Math.abs(a - b) <= 1

function sameBox(a: number[], b: number[]) {
  return a.length === b.length && a.every((value, index) => sameNumber(value, b[index]))
}

/** 逐锚点对比，失败信息直接给出"谁从哪儿挪到哪儿" */
export function diffFingerprint(expected: Fingerprint, actual: Fingerprint): string[] {
  const problems: string[] = []
  const selectors = new Set([...Object.keys(expected), ...Object.keys(actual)])
  for (const selector of selectors) {
    const before = expected[selector]
    const after = actual[selector]
    if (typeof before === 'string' || typeof after === 'string') {
      problems.push(`${selector}: 期望 ${JSON.stringify(before)}，实测 ${JSON.stringify(after)}`)
      continue
    }
    if (!before || !after) {
      problems.push(`${selector}: 一侧缺少锚点`)
      continue
    }
    if (before.length !== after.length) {
      problems.push(`${selector}: 命中数量从 ${before.length} 变成 ${after.length}`)
      continue
    }
    before.forEach((box, index) => {
      const current = after[index]
      if (!sameBox(box, current)) {
        problems.push(`${selector}[${index}]: 期望 [${box.join(', ')}]，实测 [${current.join(', ')}]`)
      }
    })
  }
  return problems
}
