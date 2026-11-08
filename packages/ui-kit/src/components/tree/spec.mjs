export default {
  id: 'tree',
  title: 'Tree 树形控件',
  description: '对齐主流组件库的 Tree，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'Tree',
      module: 'packages/ui-kit/src/components/tree/core.ts',
      createExport: 'createTree',
      coreProps: [
        {
          name: 'data',
          type: 'any[]',
          description: 'data'
        },
        {
          name: 'emptyText',
          type: 'string',
          description: 'emptyText'
        },
        {
          name: 'defaultExpandAll',
          type: 'boolean',
          description: 'defaultExpandAll'
        },
        {
          name: 'defaultCheckedKeys',
          type: 'any[]',
          description: 'defaultCheckedKeys'
        },
        {
          name: 'defaultExpandedKeys',
          type: 'any[]',
          description: 'defaultExpandedKeys'
        },
        {
          name: 'currentNodeKey',
          type: 'string | number',
          description: 'currentNodeKey'
        },
        {
          name: 'renderContent',
          type: '(...args: any[]) => any',
          description: 'renderContent'
        },
        {
          name: 'showCheckbox',
          type: 'boolean',
          description: 'showCheckbox'
        },
        {
          name: 'props',
          type: 'Record<string, any>',
          description: 'props'
        },
        {
          name: 'highlightCurrent',
          type: 'boolean',
          description: 'highlightCurrent'
        },
        {
          name: 'filterNodeMethod',
          type: '(...args: any[]) => any',
          description: 'filterNodeMethod'
        },
        {
          name: 'accordion',
          type: 'boolean',
          description: 'accordion'
        },
        {
          name: 'indent',
          type: 'number',
          default: 18,
          description: 'indent'
        },
        {
          name: 'expandOnClickNode',
          type: 'boolean',
          default: true,
          description:
            '点击节点文本区域是否切换该节点的展开/收起，仅当该节点存在子节点时才生效；关闭后只能通过点击展开箭头展开'
        },
        {
          name: 'checkOnClickNode',
          type: 'boolean',
          default: false,
          description:
            '仅在 showCheckbox 为真时生效：点击节点文本区域是否切换该节点的勾选状态；开启时勾选优先，会短路 expandOnClickNode 的展开行为'
        },
        {
          name: 'checkStrictly',
          type: 'boolean',
          description: 'checkStrictly'
        }
      ],
      slots: [
        {
          name: 'default',
          scope: {
            node: 'any',
            data: 'any',
            level: 'number'
          },
          fallback: true,
          description:
            '节点内容，渲染在 ui-tree__label 内；作用域含原始节点 node/data 与层级 level，无插槽时回退 renderContent 或节点 label'
        }
      ],
      features: {
        'tree.icons': {
          title: '图标',
          description: '图标：icon',
          module: 'packages/ui-kit/src/components/tree/features/icons/index.ts',
          exportName: 'treeIconsFeature',
          requires: [],
          props: [
            {
              name: 'icon',
              type: 'string | Record<string, any> | (...args: any[]) => any'
            }
          ]
        },
        'tree.draggable': {
          title: '拖拽排序',
          description: '拖拽排序：draggable、allowDrag、allowDrop（拖到节点前/后/内部）',
          module: 'packages/ui-kit/src/components/tree/features/draggable/index.ts',
          exportName: 'treeDraggableFeature',
          requires: [],
          props: [
            {
              name: 'draggable',
              type: 'boolean'
            },
            {
              name: 'allowDrag',
              type: '(...args: any[]) => any'
            },
            {
              name: 'allowDrop',
              type: '(...args: any[]) => any'
            }
          ]
        },
        'tree.selection': {
          title: '高亮与勾选',
          description: '高亮与勾选：checkStrictly、checkOnClickLeaf',
          module: 'packages/ui-kit/src/components/tree/features/selection/index.ts',
          exportName: 'treeSelectionFeature',
          requires: [],
          props: [
            {
              name: 'checkOnClickLeaf',
              type: 'boolean',
              default: true
            }
          ]
        },
        'tree.methods': {
          title: '实例方法',
          description: '通过 ref 操作树：getCheckedNodes、setCheckedKeys、filter。',
          module: 'packages/ui-kit/src/components/tree/features/methods/index.ts',
          exportName: 'treeMethodsFeature',
          requires: [],
          props: [],
          methods: [
            {
              name: 'getCheckedNodes',
              signature: '(leafOnly?: boolean) => any[]',
              description: '获取勾选节点的原始数据'
            },
            {
              name: 'setCheckedKeys',
              signature: '(keys: Array<string | number>) => void',
              description: '设置勾选节点'
            },
            {
              name: 'filter',
              signature: '(value: string) => void',
              description: '按关键字过滤节点'
            }
          ]
        }
      }
    }
  ]
}
