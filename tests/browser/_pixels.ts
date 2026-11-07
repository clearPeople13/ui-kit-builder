import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pixelmatch from 'pixelmatch'
import type { Page } from 'playwright'
import { PNG } from 'pngjs'
import { platformKey } from './_geometry'

/**
 * 像素基线的存取与比较。
 *
 * 几何指纹（geometry.json）盯的是"元素在哪、多大"，挡不住颜色、字号粗细、
 * 圆角、阴影、图标缺失这类纯视觉漂移；这一层补上真实截图的逐像素对比。
 *
 * 两条防误报的约定：
 * 1. 基线按平台分桶（`__snapshots__/pixels/<platform>/`）——字体度量与滚动条
 *    渲染在 Windows / macOS / Linux 上不同，跨平台直比必然整片红；
 * 2. 比较时忽略抗锯齿像素（`includeAA: false`），并允许 0.1% 的比例余量，
 *    挡的是"颜色错了 / 少了块结构"，不是渲染器的一两个像素抖动。
 *
 * 差异图写到 `shots/pixels-diff/`（已 gitignore），失败时直接给出文件路径。
 */

const repoRoot = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
const pixelRoot = path.join(repoRoot, 'tests/browser/__snapshots__/pixels')
const diffRoot = path.join(repoRoot, 'shots/pixels-diff')

/** 允许的差异像素占比：1280×720 下约 921 像素 */
export const DIFF_RATIO_LIMIT = 0.001

export function baselinePath(scene: string, platform = platformKey()): string {
  return path.join(pixelRoot, platform, `${scene}.png`)
}

export function hasBaseline(scene: string, platform = platformKey()): boolean {
  return fs.existsSync(baselinePath(scene, platform))
}

export function readBaseline(scene: string, platform = platformKey()): Buffer {
  return fs.readFileSync(baselinePath(scene, platform))
}

export function writeBaseline(scene: string, buffer: Buffer, platform = platformKey()): string {
  const file = baselinePath(scene, platform)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, buffer)
  return file
}

/**
 * 截图前把页面收敛到确定状态：停掉 CSS 动画与过渡、复位滚动与鼠标位置、
 * 等字体加载完再等两帧。JS 驱动的自动播放不在这一层处理——
 * 场景页本身没有自动轮播，固定 Date 由 openScene 的 fixedTime 负责。
 */
export async function stabilize(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}'
  })
  await page.mouse.move(0, 0)
  await page.evaluate(async () => {
    window.scrollTo(0, 0)
    await document.fonts.ready
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })
}

export async function capture(page: Page): Promise<Buffer> {
  return page.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css' })
}

export type PixelResult = { changed: number; total: number; ratio: number; diff: Buffer }

/** 逐像素比较；尺寸不一致直接抛错（视口或基线录错平台会先撞这里） */
export function comparePng(actual: Buffer, expected: Buffer): PixelResult {
  const a = PNG.sync.read(actual)
  const b = PNG.sync.read(expected)
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`截图尺寸不一致：实测 ${a.width}×${a.height}，基线 ${b.width}×${b.height}（视口或基线平台录错了）`)
  }
  const diff = new PNG({ width: a.width, height: a.height })
  const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.1,
    includeAA: false
  })
  const total = a.width * a.height
  return { changed, total, ratio: changed / total, diff: PNG.sync.write(diff) }
}

export function writeDiff(scene: string, buffer: Buffer): string {
  const file = path.join(diffRoot, `${platformKey()}-${scene}.png`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, buffer)
  return file
}
