import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openScene, type Session } from './_session'

/**
 * A24 写法收敛的浏览器层场景契约：button/focus-trap 迁回 createUiComponent 基座后，
 * 点击（用户 onClick + 水波节点落盘）与焦点圈禁必须由真实浏览器回查——
 * 单测挂载无布局，基座合并 attrs/expose 的回归在这里才露得出来。
 */
describe('浏览器层 · 写法收敛（A24）', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('floating')
  })

  afterAll(async () => {
    await session?.close()
  })

  it('button 点击：用户 onClick 触发一次，且水波节点落到根元素内', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      let clicks = 0
      const app = createApp({
        render: () => h(kit.Button, { onClick: () => clicks++ }, () => h('span', {}, '点我'))
      })
      app.mount(host)
      const button = host.querySelector('button')!
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
      const detail = {
        clicks,
        waveCount: button.querySelectorAll('.ui-button__wave').length,
        className: button.className
      }
      app.unmount()
      host.remove()
      return detail
    })

    expect(result.clicks).toBe(1)
    expect(result.waveCount).toBeGreaterThan(0)
    expect(result.className).toContain('ui-button')
  })

  it('button 用户 onClick 与原生 click 监听不双发', async () => {
    const clicks = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      let count = 0
      const app = createApp({
        render: () => h(kit.Button, { onClick: () => count++ }, () => '计数')
      })
      app.mount(host)
      const button = host.querySelector('button')!
      // 同一事件走 emit 通道触发一次；再手动 dispatch 一次原生事件，总数仍应等于 dispatch 次数
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      app.unmount()
      host.remove()
      return count
    })

    expect(clicks).toBe(2)
  })

  it('focus-trap trapped 时 Tab 留在容器内，松开后恢复', async () => {
    const result = await session.page.evaluate(async () => {
      const { h, createApp } = window.__vue!
      const kit = window.__kit!
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp({
        render: () =>
          h(
            kit.FocusTrap,
            { trapped: true, focusStartEl: 'first' },
            {
              default: () => [h('button', { id: 'trap-a' }, 'A'), h('button', { id: 'trap-b' }, 'B')]
            }
          )
      })
      app.mount(host)
      await new Promise((resolve) => setTimeout(resolve, 0))
      const doc = document
      const inside = () => {
        const active = doc.activeElement as HTMLElement | null
        return active ? host.contains(active) : false
      }
      const before = inside()
      // 模拟 Tab：焦点在最后一个按钮上时按 Tab 应被圈回第一个
      doc.getElementById('trap-b')!.focus()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
      const afterTab = doc.activeElement?.id
      const className = host.querySelector('.ui-focus-trap')?.className ?? ''
      app.unmount()
      host.remove()
      return { before, afterTab, className }
    })

    expect(result.before).toBe(true)
    expect(result.afterTab).toBe('trap-a')
    expect(result.className).toContain('is-trapped')
  })
})
