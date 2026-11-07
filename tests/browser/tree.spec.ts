import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { expectSilent, openScene, probeValue, type Session } from './_session'

/**
 * 树形展开耗时：消费者 demo 的"树形大数据"曾出现点一下卡住很久，
 * 单测里 happy-dom 的渲染是同步且无样式的，测不出真实主线程占用；
 * 这里在真浏览器里量"点击 → 两帧之后 DOM 就绪"的墙钟时间。
 */
describe('浏览器层 · 树形大数据', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('tree')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('展开单个节点的 5000 个子项，主线程占用在预算内', async () => {
    const result = await session.page.evaluate(async () => {
      const nextTwoFrames = () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
      const box = document.querySelector('#tree-wide-box')!
      const before = box.querySelectorAll('.ui-tree__node').length
      const icon = box.querySelector('.ui-tree__expand')!
      const start = performance.now()
      icon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTwoFrames()
      const elapsed = performance.now() - start
      return { before, after: box.querySelectorAll('.ui-tree__node').length, elapsed }
    })

    expect(result.before).toBe(1)
    expect(result.after).toBe(5001)
    // 回归预算：真浏览器里 5000 行展开必须维持在一帧动画的观感内
    expect(result.elapsed).toBeLessThan(800)
  })

  it('逐层展开的多叉树节点数按层累加，子节点渲染出真实标签', async () => {
    const { page } = session
    const result = await page.evaluate(async () => {
      const nextTwoFrames = () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
      const box = document.querySelector('#tree-box')!
      const seen = [box.querySelectorAll('.ui-tree__node').length]
      for (const index of [0, 1]) {
        const icon = box.querySelectorAll('.ui-tree__expand')[index]!
        icon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await nextTwoFrames()
        seen.push(box.querySelectorAll('.ui-tree__node').length)
      }
      const labels = [...box.querySelectorAll('.ui-tree__label')].map((el) => el.textContent)
      return { seen, labels }
    })
    expect(result.seen).toEqual([10, 20, 30])
    expect(result.labels.length).toBe(30)
    expect(result.labels.join('')).toContain('节点 r-1-')
  })

  it('点击节点标签派发 node-click，载荷是被点的节点', async () => {
    const { page } = session
    await page.locator('#tree-box .ui-tree__label').last().click()
    const clicked = await probeValue<{ id?: string; label?: string }>(page, 'treeNode')
    expect(clicked?.label).toContain('节点 r-')
  })

  it('全流程控制台无告警', () => {
    expectSilent(session.messages, 'tree 场景')
  })
})
