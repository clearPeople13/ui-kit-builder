export default {
  id: 'link',
  title: 'Link 链接',
  description: '对齐主流组件库的 Link，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'Link',
      module: 'packages/ui-kit/src/components/link/core.ts',
      createExport: 'createLink',
      coreProps: [
        {
          name: 'type',
          type: 'string',
          default: null,
          description: 'type'
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'disabled'
        },
        {
          name: 'href',
          type: 'string',
          default: '',
          description: 'href'
        },
        {
          name: 'target',
          type: 'string',
          default: '_self',
          description: 'target'
        },
        {
          name: 'tag',
          type: 'string',
          default: null,
          description: '根节点标签，缺省为 a'
        }
      ],
      features: {
        'link.icons': {
          title: '图标',
          description: '图标：icon',
          module: 'packages/ui-kit/src/components/link/features/icons/index.ts',
          exportName: 'linkIconsFeature',
          requires: [],
          props: [
            {
              name: 'icon',
              type: 'string | Record<string, any> | (...args: any[]) => any'
            }
          ]
        },
        'link.appearance': {
          title: '外观变体',
          description: '外观变体：underline',
          module: 'packages/ui-kit/src/components/link/features/appearance/index.ts',
          exportName: 'linkAppearanceFeature',
          requires: [],
          props: [
            {
              name: 'underline',
              type: 'boolean | string',
              default: null
            }
          ]
        }
      }
    }
  ]
}
