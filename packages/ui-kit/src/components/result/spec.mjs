export default {
  id: 'result',
  title: 'Result 结果',
  description: '对齐主流组件库的 Result，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'Result',
      module: 'packages/ui-kit/src/components/result/core.ts',
      createExport: 'createResult',
      coreProps: [
        {
          name: 'title',
          type: 'string',
          default: '',
          description: 'title'
        },
        {
          name: 'subTitle',
          type: 'string',
          default: '',
          description: 'subTitle'
        },
        {
          name: 'tag',
          type: 'string',
          default: null,
          description: '根节点标签，缺省为 div'
        }
      ],
      slots: [
        {
          name: 'default',
          scope: null,
          fallback: false,
          description: '额外操作区，渲染在副标题之后（无默认内容）'
        },
        {
          name: 'icon',
          scope: null,
          fallback: true,
          description: '图标区，未提供时按 icon 属性渲染内置图标'
        }
      ],
      features: {
        'result.icons': {
          title: '图标',
          description: '图标：icon',
          module: 'packages/ui-kit/src/components/result/features/icons/index.ts',
          exportName: 'resultIconsFeature',
          requires: [],
          props: [
            {
              name: 'icon',
              type: 'string',
              default: 'info'
            }
          ]
        }
      }
    }
  ]
}
