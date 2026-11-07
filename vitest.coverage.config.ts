import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import base from './vitest.config'

/**
 * 覆盖率层：与 `npm test` 跑同一批组件用例，但把 `@ui-kit-full` 指向
 * `.build/full/entry.ts`（源码入口）而不是 `dist/full/ui-kit.js`。
 *
 * 为什么不能直接给主配置开 --coverage：
 * 主配置加载的是打包产物，V8 只能统计到那一个 bundle 文件的行覆盖，
 * 分不出"哪个组件没被测到"，数字好看但没有可行动性。
 * full profile 下产物与源码行为一致（前缀同为 `ui-`、特性全开），
 * 所以同一批用例可以在源码上重放，覆盖到 `packages/ui-kit/src/**`；
 * `npm run test:coverage` 同时也成了"源码与产物行为同构"的旁证。
 *
 * `all: true` 让没被任何用例 import 的源文件也计入分母——
 * 否则删掉一个组件的用例，覆盖率反而会上升（分母也少了）。
 */
export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      alias: {
        '@ui-kit-full': fileURLToPath(new URL('./.build/full/entry.ts', import.meta.url))
      }
    },
    test: {
      include: ['tests/components/**/*.spec.ts', 'tests/findings.spec.ts'],
      testTimeout: 15000,
      coverage: {
        provider: 'v8',
        all: true,
        include: ['packages/ui-kit/src/**/*.ts'],
        exclude: ['packages/ui-kit/src/**/*.d.ts'],
        reporter: ['text', 'json-summary'],
        reportsDirectory: 'coverage',
        // 阈值只允许往上走：新增没带用例的代码会把总比例拉下来，门禁当场变红。
        // 基线（2026-11-07 首次全量测量，1570 条用例全过）：
        //   statements 88.35% / branches 84.78% / functions 89.20% / lines 88.35%
        // B4 起全局各 +1（88 / 84 / 89 / 88），仍贴着实测值，抖动余量 <1 点。
        thresholds: {
          statements: 88,
          branches: 84,
          functions: 89,
          lines: 88,
          // 组件级下限：取当前实测最小值向下取整（tree draggable 21.67% / time-select clearable 33.33%），
          // 任一组件文件跌破就失败；等低覆盖清单逐项补齐后再抬线（B4）
          'packages/ui-kit/src/components/**': {
            statements: 21,
            branches: 33,
            lines: 21
          }
        }
      }
    }
  })
)
