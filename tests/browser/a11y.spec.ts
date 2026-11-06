import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { expectSilent, openScene, type Session } from './_session'

/**
 * 键盘与焦点只有真浏览器能证：happy-dom 没有焦点管理，
 * :focus-visible 样式、Tab 序、Enter/Space 激活、Escape 归还焦点全部测不到。
 */
describe('浏览器层 · 键盘可达性', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('a11y')
  })

  afterAll(async () => {
    await session?.close()
  })

  const active = (page: Session['page']) =>
    page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null
      if (!element) {
        return { tag: '', id: '', cls: '', outline: '', expanded: '', role: '' }
      }
      return {
        tag: element.tagName,
        id: element.id,
        cls: String(element.className),
        outline: getComputedStyle(element).outlineWidth,
        expanded: element.getAttribute('aria-expanded') ?? '',
        role: element.getAttribute('role') ?? ''
      }
    })

  it('Tab -first 落进真实输入框，而不是容器', async () => {
    const { page } = session
    await page.keyboard.press('Tab')
    const first = await active(page)
    expect(first.tag).toBe('INPUT')
    expect(first.id).toBe('a11y-input')
  })

  it('Tab 序覆盖下拉触发器、标签页与对话框按钮', async () => {
    const { page } = session
    const seen: string[] = []
    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press('Tab')
      const current = await active(page)
      seen.push(current.id || current.cls.split(' ')[0])
    }
    expect(seen).toContain('ui-dropdown__trigger')
    expect(seen).toContain('ui-tabs__nav-item')
    expect(seen).toContain('a11y-dialog')
    expect(seen).toContain('ui-switch__inner')
  })

  it('聚焦在下拉触发器上按 Enter 展开面板，aria-expanded 同步', async () => {
    const { page } = session
    await page.evaluate(() => (document.querySelector('.ui-dropdown__trigger') as HTMLElement).focus())
    expect((await active(page)).expanded).toBe('false')

    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    expect((await active(page)).expanded).toBe('true')
    const panel = await page.evaluate(
      () => document.querySelector('.panel-a11y-drop')?.getBoundingClientRect().height ?? 0
    )
    expect(panel).toBeGreaterThan(0)
  })

  it('Space 关闭已展开的面板，Escape 收起并留在触发器上', async () => {
    const { page } = session
    await page.keyboard.press('Space')
    await page.waitForTimeout(300)
    expect((await active(page)).expanded).toBe('false')

    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    expect((await active(page)).cls).toContain('ui-dropdown__trigger')
    const panel = await page.evaluate(
      () => document.querySelector('.panel-a11y-drop')?.getBoundingClientRect().height ?? 0
    )
    expect(panel).toBe(0)
  })

  it('对话框按钮可用键盘打开，Escape 关闭', async () => {
    const { page } = session
    await page.locator('#a11y-dialog').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    const opened = await page.evaluate(() => {
      const dialog = document.querySelector('.ui-dialog')
      return { height: Math.round(dialog?.getBoundingClientRect().height ?? 0), cls: String(dialog?.className) }
    })
    expect(opened.height).toBeGreaterThan(0)
    expect(opened.cls).not.toContain('is-hidden')

    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    const closed = await page.evaluate(() => {
      const dialog = document.querySelector('.ui-dialog')
      return { height: Math.round(dialog?.getBoundingClientRect().height ?? 0), cls: String(dialog?.className) }
    })
    expect(closed.height).toBe(0)
    expect(closed.cls).toContain('is-hidden')
  })

  it('键盘焦点有可见描边', async () => {
    const { page } = session
    await page.evaluate(() => (document.querySelector('.ui-switch__inner') as HTMLElement)?.focus())
    const current = await active(page)
    expect(current.tag).toBe('INPUT')
    expect(current.outline).not.toBe('0px')
  })

  it('全流程控制台无告警', () => {
    expectSilent(session.messages, 'a11y 场景')
  })
})
