import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ANCHORS, platformKey } from './_geometry'
import {
  baselinePath,
  capture,
  comparePng,
  DIFF_RATIO_LIMIT,
  hasBaseline,
  readBaseline,
  stabilize,
  writeBaseline,
  writeDiff
} from './_pixels'
import { openScene } from './_session'

/**
 * 像素基线回归（第六道门禁）。
 *
 * 布局指纹只比矩形，颜色 / 字号粗细 / 圆角 / 阴影 / 图标缺失这些纯视觉漂移
 * 它完全看不见；这一层把 6 个场景页在 1280×720 视口下的首屏截图与基线逐像素对比。
 *
 * 基线按平台分桶，没录过基线的平台自动跳过（与布局指纹同一约定），录入命令：
 *   npm run snap:pixels
 * 场景页本身不跑自动播放；日期用 openScene 的 fixedTime 冻死，截图前再停掉
 * CSS 动画与过渡，所以同一台机器上的结果应当逐次一致。
 */
const scenes = Object.keys(ANCHORS)
const updating = process.env.UIKIT_UPDATE_SNAPSHOTS === '1'
// 固定到一个工作日上午：日期类组件的默认值与"今天"高亮不会随真实日期漂移
const FIXED_TIME = new Date('2026-06-15T10:30:00')

describe('浏览器层 · 像素基线录入状态', () => {
  it('当前平台的基线要么一份没有，要么 6 个场景齐全', () => {
    const platform = platformKey()
    const directory = path.dirname(baselinePath(scenes[0], platform))
    if (!fs.existsSync(directory)) {
      // 新平台尚未录入：本层整体跳过，由 npm run snap:pixels 建立基线
      return
    }
    const missing = scenes.filter((scene) => !hasBaseline(scene, platform))
    expect(missing, `平台 ${platform} 已有基线目录但缺少场景：${missing.join('、')}`).toEqual([])
  })
})

describe.each(scenes)('浏览器层 · 像素基线 %s', (scene) => {
  it.skipIf(!updating && !hasBaseline(scene))(
    updating ? '录入基线' : '首屏截图与基线一致（忽略 AA，容差 0.1%）',
    async () => {
      const session = await openScene(scene, { fixedTime: FIXED_TIME })
      try {
        await stabilize(session.page)
        const actual = await capture(session.page)

        if (updating) {
          writeBaseline(scene, actual)
          return
        }

        const result = comparePng(actual, readBaseline(scene))
        if (result.ratio > DIFF_RATIO_LIMIT) {
          const diffFile = writeDiff(scene, result.diff)
          throw new Error(
            `${scene} 像素漂移：${result.changed}/${result.total} 像素不同（${(result.ratio * 100).toFixed(3)}%，` +
              `上限 ${(DIFF_RATIO_LIMIT * 100).toFixed(1)}%）。差异图：${diffFile}\n` +
              `确认是预期变化后执行 npm run snap:pixels 重新录入基线`
          )
        }
      } finally {
        await session.close()
      }
    }
  )
})
