import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { expectSilent, openScene, type Session } from './_session'

/**
 * 优化计划第一波 · Form 场景契约（浏览器层）。
 *
 * F-93 把 form 从"deep watch 全量校验"改成按 trigger 增量校验，blur 通路挂在
 * FormItem 内容区的 focusout 冒泡上——happy-dom 没有真实焦点链，这条通路只有
 * 真浏览器能证。组件层用例锁的是"调了几次 validator"，这里锁用户操作序列：
 * change 字段输入即校验、blur 字段失焦才校验、两字段互不牵连。
 */
describe('浏览器层 · Form 场景契约', () => {
  let session: Session

  beforeAll(async () => {
    session = await openScene('form')
  })

  afterAll(async () => {
    await session?.close()
  })

  beforeEach(async () => {
    const { page } = session
    await page.reload({ waitUntil: 'load' })
    await page.waitForFunction(() => (window as unknown as { __probe?: { ready?: boolean } }).__probe?.ready === true)
  })

  const nameError = () =>
    session.page
      .locator('.ui-form-item')
      .nth(0)
      .locator('.ui-form-item__error')
      .textContent()
      .catch(() => null)
  const emailError = () =>
    session.page
      .locator('.ui-form-item')
      .nth(1)
      .locator('.ui-form-item__error')
      .textContent()
      .catch(() => null)

  it('初始整表校验：两个必填字段直接报错（兼容既有行为）', async () => {
    expect(await nameError()).toBe('姓名必填')
    expect(await emailError()).toBe('邮箱必填')
  })

  it('change 字段输入即自清，不牵连 blur 字段的既有错误', async () => {
    const { page } = session
    await page.fill('#scene-form-name', '张三')
    await expect.poll(async () => await nameError()).toBe(null)
    // email 是 blur 规则：name 的输入不得触发它的重校验（既有错误原样保留）
    expect(await emailError()).toBe('邮箱必填')
  })

  it('blur 字段输入过程中不报错，失焦才按格式校验（F-93）', async () => {
    const { page } = session
    await page.fill('#scene-form-email', 'not-an-email')
    // 失焦前：trigger 只含 blur 的规则不运行，初始错误也不动
    expect(await emailError()).toBe('邮箱必填')
    await page.click('#scene-form-outside')
    await expect.poll(async () => await emailError()).toBe('邮箱格式不正确')
  })

  it('blur 报错后改值不立即清除，再次失焦才更新（F-93）', async () => {
    const { page } = session
    await page.fill('#scene-form-email', 'not-an-email')
    await page.click('#scene-form-outside')
    await expect.poll(async () => await emailError()).toBe('邮箱格式不正确')
    await page.fill('#scene-form-email', 'a@b.com')
    // change 通路不碰 blur 规则：错误保持到下一次失焦
    expect(await emailError()).toBe('邮箱格式不正确')
    await page.click('#scene-form-outside')
    await expect.poll(async () => await emailError()).toBe(null)
  })

  it('控制台无告警', () => {
    expectSilent(session.messages, 'form 场景')
  })
})
