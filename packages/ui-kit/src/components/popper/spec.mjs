export default {
  id: 'popper',
  title: 'Popper 弹出层',
  description: '对齐主流组件库的 Popper / PopperArrow / PopperContent / PopperTrigger，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'Popper',
      module: 'packages/ui-kit/src/components/popper/core.ts',
      createExport: 'createPopper',
      coreProps: [
        {
          name: 'gpuAcceleration',
          type: 'boolean',
          default: true,
          description: 'gpuAcceleration'
        },
        {
          name: 'strategy',
          type: 'string',
          default: 'absolute',
          description: 'strategy'
        },
        {
          name: 'role',
          type: 'string',
          default: 'tooltip',
          description: 'role'
        }
      ],
      features: {}
    },
    {
      name: 'PopperArrow',
      module: 'packages/ui-kit/src/components/popper/core.ts',
      createExport: 'createPopperArrow',
      coreProps: [
        {
          name: 'arrowOffset',
          type: 'number',
          default: 5,
          description: 'arrowOffset'
        }
      ],
      features: {}
    },
    {
      name: 'PopperContent',
      module: 'packages/ui-kit/src/components/popper/core.ts',
      createExport: 'createPopperContent',
      coreProps: [
        {
          name: 'gpuAcceleration',
          type: 'boolean',
          default: true,
          description: 'gpuAcceleration'
        },
        {
          name: 'strategy',
          type: 'string',
          default: 'absolute',
          description: 'strategy'
        },
        {
          name: 'arrowOffset',
          type: 'number',
          default: 5,
          description: 'arrowOffset'
        },
        {
          name: 'id',
          type: 'string',
          description: 'id'
        },
        {
          name: 'style',
          type: 'string | any[] | Record<string, any> | boolean',
          default: null,
          description: 'style'
        },
        {
          name: 'className',
          type: 'string | any[] | Record<string, any> | boolean',
          description: 'className'
        },
        {
          name: 'content',
          type: 'string | number | Record<string, any> | (...args: any[]) => any',
          description: '缺省内容'
        },
        {
          name: 'label',
          type: 'string | number | Record<string, any> | (...args: any[]) => any',
          description: '缺省内容回退位'
        },
        {
          name: 'title',
          type: 'string | number | Record<string, any> | (...args: any[]) => any',
          description: '缺省内容回退位'
        },
        {
          name: 'description',
          type: 'string | number | Record<string, any> | (...args: any[]) => any',
          description: '缺省内容回退位'
        },
        {
          name: 'value',
          type: 'string | number | Record<string, any> | (...args: any[]) => any',
          description: '缺省内容回退位'
        },
        {
          name: 'effect',
          type: 'string',
          default: 'dark',
          description: 'effect'
        },
        {
          name: 'visible',
          type: 'boolean',
          description: 'visible'
        },
        {
          name: 'virtualTriggering',
          type: 'boolean',
          description: 'virtualTriggering'
        },
        {
          name: 'zIndex',
          type: 'number',
          description: 'zIndex'
        },
        {
          name: 'ariaLabel',
          type: 'string',
          description: 'ariaLabel'
        }
      ],
      features: {}
    },
    {
      name: 'PopperTrigger',
      module: 'packages/ui-kit/src/components/popper/core.ts',
      createExport: 'createPopperTrigger',
      coreProps: [
        {
          name: 'virtualTriggering',
          type: 'boolean',
          description: 'virtualTriggering'
        },
        {
          name: 'onClick',
          type: '(...args: any[]) => any',
          description: 'onClick'
        },
        {
          name: 'id',
          type: 'string',
          description: 'id'
        },
        {
          name: 'expanded',
          type: 'boolean',
          description: 'expanded'
        }
      ],
      features: {}
    }
  ]
}
