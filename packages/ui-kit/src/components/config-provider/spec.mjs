export default {
  id: 'config-provider',
  title: 'ConfigProvider 全局配置',
  description: '对齐主流组件库的 ConfigProvider，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'ConfigProvider',
      module: 'packages/ui-kit/src/components/config-provider/core.ts',
      createExport: 'createConfigProvider',
      coreProps: [
        {
          name: 'size',
          type: 'string',
          description: '全局尺寸：未显式设置 size 的子组件继承该值'
        }
      ],
      features: {}
    }
  ]
}
