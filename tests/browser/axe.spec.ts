import AxeBuilder from '@axe-core/playwright'
import { describe, expect, it } from 'vitest'
import type { Page } from 'playwright'
import { expectSilent, openScene } from './_session'

/**
 * 无障碍审计（B3b-B7）：6 个关键场景跑 axe 的 wcag2a / wcag2aa，
 * 只把 serious / critical 当失败——minor / moderate 属于体验优化，不在本批收口范围。
 *
 * 白名单按「场景 + 规则」登记，必须带理由：新出现任何未登记的 serious/critical 仍会报红，
 * 防止一次性的 whitelist 变成永久放行。列出的项归入无障碍专项（见 REQUIREMENTS §19.4）。
 */

const scenes = ['gallery', 'floating', 'table', 'tree', 'a11y', 'color'] as const

const WHITELIST: Record<string, Record<string, string>> = {
  gallery: {
    'aria-allowed-attr': '浮层组件的触发器把 aria-expanded 加在非对应 role 的元素上，待统一 role 方案',
    'aria-command-name': '通用 popper 触发器缺少可访问名，需要组件侧补 aria-label 策略',
    'aria-input-field-name': '触发器类输入（Cascader / ColorPicker / Rate / Select）未提供默认可访问名',
    'aria-required-children': '级联面板列在空数据下渲染无 role 的子节点',
    'aria-tooltip-name': '通用 popper 内容区没有 role=tooltip 文案，属 Tooltip 专项',
    'button-name': '仅图标按钮（日历翻页 / 轮播箭头 / 折叠头 / 穿梭按钮）缺 aria-label',
    'color-contrast': '主题色对比度由 20 套主题令牌统一治理，单批只记录不修',
    'image-alt': '画廊用空 props 渲染 Image，占位图没有 alt 属探针场景',
    label: '探针场景没有给输入框配 label，库不强制生成 aria-label',
    listitem: 'Dropdown / Timeline 列表项用的围栏 role 与 axe 预期不一致，待统一语义'
  },
  floating: {
    'aria-allowed-attr': 'Popover / Dropdown 触发器把 aria-expanded 加在非对应 role 的元素上',
    'aria-input-field-name': '浮层场景里的 Select 触发器未提供可访问名'
  },
  table: {
    'scrollable-region-focusable': '可横向滚动的表格容器没有 tabindex，键盘用户无法滚动，属 Table 专项'
  },
  a11y: {
    'aria-allowed-attr': 'Dropdown 触发器 aria-expanded 的 role 不匹配',
    'button-name': '场景里的仅图标按钮缺 aria-label',
    label: '滑块 / 数字输入 / 开关没有配 label，属探针场景'
  },
  color: {
    'aria-input-field-name': 'ColorPicker 触发器未提供可访问名'
  },
  tree: {}
}

/**
 * 组件入场动画（如 `.ui-tab-pane__content` 的 180ms 淡入）会让 axe 在中间帧读到半透明文字，
 * color-contrast 因此偶发 serious。扫描前等动画收敛到终态；封顶 500ms，避免无限动画把用例挂住。
 */
async function settleAnimations(page: Page) {
  await page.evaluate(() =>
    Promise.race([
      Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
      new Promise<void>((resolve) => setTimeout(resolve, 500))
    ])
  )
}

async function seriousViolations(page: Page) {
  await settleAnimations(page)
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  return result.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target.join(' '))
    }))
}

describe('浏览器层 · axe 无障碍审计', () => {
  it.each(scenes)('场景 %s 无未登记的 serious / critical 违规', async (scene) => {
    const session = await openScene(scene)
    try {
      const allowed = WHITELIST[scene]
      expect(allowed, `${scene} 场景缺白名单条目`).toBeDefined()
      const violations = (await seriousViolations(session.page)).filter((violation) => !allowed[violation.id])
      expect(violations, `${scene} 场景出现未登记的 serious/critical 违规`).toEqual([])
      expectSilent(session.messages, `${scene} 无障碍扫描`)
    } finally {
      await session.close()
    }
  })
})
