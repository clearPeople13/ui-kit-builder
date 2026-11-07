import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// 测试对象是构建产物 dist/full/ui-kit.js，与消费方 examples/consumer 的引用方式保持一致：
// 用例覆盖的是"打包后真正被使用的那份代码"，特性开关全开的完整版
// 构建器侧的 20 份产物契约另走 vitest.build.config.ts（npm run test:build），保持 npm test 秒级
export default defineConfig({
  resolve: {
    alias: {
      '@ui-kit-full': fileURLToPath(new URL('./dist/full/ui-kit.js', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    // findings.spec.ts 是临时的 it.fails 守卫，常驻 include：根目录不在默认发现范围里，
    // 不显式列出就会出现"守卫挂了却全绿"。守卫降级进组件层后本条目不影响发现，
    // 下次重建守卫也不必再改配置。
    include: ['tests/components/**/*.spec.ts', 'tests/findings.spec.ts'],
    testTimeout: 15000,
    reporters: ['default']
  }
})
