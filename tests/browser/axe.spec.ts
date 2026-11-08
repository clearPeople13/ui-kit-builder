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
    'aria-allowed-attr':
      '浮层组件的触发器把 aria-expanded 加在非对应 role 的元素上；触发器可能包裹用户可交互内容，不能一律加 role=button',
    'button-name': '画廊用空 props 渲染 Button，图标按钮的可访问名由消费方提供，属探针场景',
    'color-contrast': '主题色对比度由 20 套主题令牌统一治理，单批只记录不修',
    'image-alt': '画廊用空 props 渲染 Image，占位图没有 alt 属探针场景',
    label: '探针场景没有给输入框配 label，库不强制生成 aria-label',
    listitem: 'TimelineItem 在画廊里孤立渲染，缺少外层 role=list 容器，属探针场景'
  },
  floating: {
    'aria-allowed-attr':
      'Popover / Dropdown 触发器把 aria-expanded 加在非对应 role 的元素上；触发器可能包裹用户可交互内容'
  },
  table: {},
  a11y: {
    'aria-allowed-attr': 'Dropdown 触发器 aria-expanded 的 role 不匹配；触发器可能包裹用户可交互内容',
    label: '滑块 / 数字输入 / 开关没有配 label，属探针场景'
  },
  color: {},
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
