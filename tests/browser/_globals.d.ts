// 浏览器层探针页挂到 window 上的三件套：__probe 回传运行期事实，
// __vue / __kit 让用例能在页面里直接 createApp 挂载产物组件。
// 声明放这里而不是 harness/main.ts，是因为 harness 页只跑在 Vite 里、不参与类型检查，
// 而用例侧必须知道这几个全局的存在。
import type * as Vue from 'vue'

declare global {
  interface Window {
    __probe?: Record<string, any> & { ready?: boolean }
    __vue?: { h: typeof Vue.h; createApp: typeof Vue.createApp }
    __kit?: Record<string, any>
  }
}

export {}
