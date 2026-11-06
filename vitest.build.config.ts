import { defineConfig } from 'vitest/config'

/**
 * 第三批：构建器侧契约用例的独立入口。
 *
 * 这批用例读的是 dist/<profile>/ 全量产物与 .build/<profile>/entry.ts，
 * 必须先跑一次 `npm run build:all`（package.json 的 pretest:build 已挂钩），
 * 与组件单测分开是为了让 `npm test` 保持在秒级。
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/build/**/*.spec.ts'],
    testTimeout: 30000,
    hookTimeout: 120000,
    reporters: ['default']
  }
})
