import { defineConfig } from 'vitest/config'

// 每一份 profile 产物都要"装上就跑得起来"。
// npm run test:build 验的是文件存在性与结构（裁剪结果、体积、令牌、类型声明），
// npm test 只在 full 这一份上验组件行为——中间缺的那句话是"另外 19 份裁完之后组件还照常工作吗"。
// 这一层把 dist/<profile>/ui-kit.js 逐个 import 进来真挂一遍，所以单独一份配置：
// 20 份产物同时驻留一个进程的开销没必要让 npm test 背。
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/profiles/**/*.spec.ts'],
    testTimeout: 60_000,
    reporters: ['default']
  }
})
