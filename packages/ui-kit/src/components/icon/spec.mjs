export default {
  id: 'icon',
  title: 'Icon 图标',
  description: '统一图标入口：内置 lucide 图标按语义名管理，支持传入组件或注册的自定义图标。',
  order: 2,
  exports: [
    {
      name: 'Icon',
      module: 'packages/ui-kit/src/components/icon/core.ts',
      createExport: 'createIcon',
      coreProps: [
        { name: 'icon', type: 'Component | string', description: '图标组件或图标名，也可使用默认插槽' },
        { name: 'name', type: 'string', default: '', description: '内置图标名，如 close / check / chevronDown' },
        { name: 'size', type: 'number | string', description: '图标尺寸，数字按 px 处理' },
        { name: 'color', type: 'string', description: '图标颜色' },
        { name: 'spinning', type: 'boolean', default: false, description: '旋转动画' },
        { name: 'strokeWidth', type: 'number', default: 2, description: '描边宽度' },
      ],
      features: {},
    },
  ],
}
