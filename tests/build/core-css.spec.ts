import { describe, expect, it } from 'vitest'
import { bundleOf } from './_helpers'

/**
 * core 产物的结构性 CSS 底线（从 scripts/verify.mjs 迁移，B6）。
 *
 * 这些是"组件基础样式必须收拢在共享层"的历史决策：分割条、对话框、抽屉、滚动条的默认值
 * 只允许出现在 :root / 共享规则里，组件块不能各自复制一份；特性态规则必须待在特性文件里。
 * 原先写在 verify.mjs 末尾的字符串断言里，随 verify 收缩为三类（产物存在性 / 导出冒烟 / SSR 冒烟）
 * 迁到构建器侧用例，报错信息比脚本更直接。
 */

const coreCss = bundleOf('core').css
const coreJs = bundleOf('core').js

describe('core 产物的共享样式边界', () => {
  it('分割条默认值收拢在全局，hover 才出现底色', () => {
    expect(coreCss).toContain('--ui-splitter-bar-bg: transparent')
    expect(coreCss).not.toContain('.ui-splitter{--ui-splitter-bar')
    expect(coreCss).toContain('--ui-splitter-bar-bg: #eef2f8')
  })

  it('对话框头部与抽屉底部默认透明', () => {
    expect(coreCss).toContain('--ui-dialog-header-bg: transparent')
    expect(coreCss).toContain('--ui-drawer-footer-bg: transparent')
  })

  it('滚动条的变量、隐藏工具类与内核选择器都在', () => {
    for (const needle of [
      '--ui-scrollbar-thumb',
      '.ui-scrollbar-hidden',
      '::-webkit-scrollbar',
      '.ui-cascader__column::-webkit-scrollbar',
      '.ui-date-picker__time-list::-webkit-scrollbar',
      '.ui-time-picker__list::-webkit-scrollbar'
    ]) {
      expect(coreCss, `core CSS 缺 ${needle}`).toContain(needle)
    }
  })

  it('InputTag 文本省略与 Radio 内圈半径来自基础样式', () => {
    expect(coreCss).toContain('.ui-input-tag__text')
    expect(coreCss).toContain('radial-gradient(circle,var(--ui-color-primary) 0 4px,transparent 4.5px)')
  })

  it('特性类名与特性变量不进 core', () => {
    for (const needle of [
      '.ui-button--bg-color',
      '.ui-button--gradient',
      '.ui-input--clearable',
      '.ui-input--password'
    ]) {
      expect(coreCss, `core CSS 不应包含 ${needle}`).not.toContain(needle)
    }
  })

  it('core JS 保留基础组件符号，不带任何特性分支', () => {
    for (const token of [
      'ui-button',
      'ui-input',
      'ui-select',
      'ui-scrollbar',
      'ui-table',
      'ui-pagination',
      'ui-tree',
      'ui-icon'
    ]) {
      expect(coreJs, `core JS 缺 ${token}`).toContain(token)
    }
    for (const token of [
      'bgColor',
      'autoContrast',
      'gradientAngle',
      'ui-button--bg-color',
      'ui-button--gradient',
      'ui-input--clearable',
      'showPassword',
      'showWordLimit',
      'setActiveItem',
      'clearSelection',
      'clearFiles',
      'getCheckedNodes'
    ]) {
      expect(coreJs, `core JS 不应包含 ${token}`).not.toContain(token)
    }
  })
})
