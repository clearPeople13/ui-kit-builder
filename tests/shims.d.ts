// 构建脚本与产物都是未带 .d.ts 的 ESM；用例里一律通过显式类型断言使用，
// 这里用环境声明放行，避免 strict 下 20 条 TS7016 噪声（C9）。
declare module '*.mjs'
declare module '*.js'
