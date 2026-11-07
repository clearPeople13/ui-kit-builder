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
    reporters: ['default'],
    // 这批用例会真的改仓库源文件（build-cache 模拟改动后还原）、真的打一次包（dev-api），
    // 与只读断言并发时会互相污染：指纹断言读到变异中的源码、类型契约读到正在重写的产物。
    // 表现为"用例全通过、文件级报错"的偶发红。串行代价约 +13s，换确定性。
    fileParallelism: false
  }
})
