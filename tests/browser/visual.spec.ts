import { describe, expect, it } from 'vitest'
import { ANCHORS, diffFingerprint, fingerprint, platformKey, readSnapshot, writeSnapshot } from './_geometry'
import { openScene } from './_session'

/**
 * 布局指纹回归（第五道门禁）。
 *
 * 单位层看不到尺寸，浏览器层的功能断言又只覆盖"动作—结果"；
 * 纯 CSS 与布局的漂移（冻结列宽度算错、外边距塌陷、面板把页面撑出横向滚动条）
 * 需要一个不依赖像素基线的锚点：固定视口下的元素矩形序列。
 *
 * 基线按平台分桶（字体度量与滚动条宽度按系统不同），录入命令：
 *   npm run snap:layout
 * 平台没有基线时本用例自动跳过，不会在别的机器上凭空报错；
 * 录入时若某个锚点在页面上找不到（类名被改、场景被重构），会当场失败。
 */
const scenes = Object.keys(ANCHORS)
const updating = process.env.UIKIT_UPDATE_SNAPSHOTS === '1'
const platform = platformKey()
const missing = (current: Record<string, any>) =>
  Object.entries(current)
    .filter(([, value]) => value === 'MISSING')
    .map(([selector]) => selector)

describe.each(scenes)('浏览器层 · 布局指纹 %s', (scene) => {
  const baseline = readSnapshot()[platform]?.[scene]

  it.skipIf(!updating && !baseline)(updating ? '录入基线' : '锚点矩形与基线一致（容差 1px）', async () => {
    const session = await openScene(scene)
    try {
      const current = await fingerprint(session.page, scene)
      expect(missing(current)).toEqual([])

      if (updating) {
        const file = readSnapshot()
        file[platform] = { ...(file[platform] ?? {}), [scene]: current }
        writeSnapshot(file)
        return
      }

      const problems = diffFingerprint(baseline!, current)
      if (problems.length) {
        throw new Error(
          `${scene} 布局漂移（${problems.length} 处，容差 1px）：\n${problems.slice(0, 12).join('\n')}\n` +
            `确认是预期变化后执行 npm run snap:layout 重新录入基线`
        )
      }
    } finally {
      await session.close()
    }
  })
})
