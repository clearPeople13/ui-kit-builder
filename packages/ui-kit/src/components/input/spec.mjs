export default {
  id: 'input',
  title: 'Input 输入框',
  description: '对齐主流组件库的 Input，基础 props 与可选特性拆分。',
  order: 10,
  exports: [
    {
      name: 'Input',
      module: 'packages/ui-kit/src/components/input/core.ts',
      createExport: 'createInput',
      coreProps: [
        {
          name: 'size',
          type: 'string',
          description: 'size'
        },
        {
          name: 'disabled',
          type: 'boolean',
          default: null,
          description: 'disabled'
        },
        {
          name: 'modelValue',
          type: 'string | number | Record<string, any>',
          default: '',
          description: 'modelValue'
        },
        {
          name: 'type',
          type: 'string',
          default: 'text',
          description: 'type'
        },
        {
          name: 'id',
          type: 'string',
          default: null,
          description: 'id'
        },
        {
          name: 'maxlength',
          type: 'string | number',
          description: 'maxlength'
        },
        {
          name: 'minlength',
          type: 'string | number',
          description: 'minlength'
        },
        {
          name: 'resize',
          type: 'string',
          description: 'resize'
        },
        {
          name: 'autocomplete',
          type: 'string',
          default: 'off',
          description: 'autocomplete'
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'placeholder'
        },
        {
          name: 'readonly',
          type: 'boolean',
          description: 'readonly'
        },
        {
          name: 'tabindex',
          type: 'string | number',
          default: 0,
          description: 'tabindex'
        },
        {
          name: 'inputStyle',
          type: 'Record<string, any> | any[] | string | boolean',
          description: 'inputStyle'
        },
        {
          name: 'countGraphemes',
          type: '(...args: any[]) => any',
          description: 'countGraphemes'
        },
        {
          name: 'autofocus',
          type: 'boolean',
          description: 'autofocus'
        },
        {
          name: 'rows',
          type: 'number',
          default: 2,
          description: 'rows'
        },
        {
          name: 'name',
          type: 'string',
          description: 'name'
        }
      ],
      slots: [
        {
          name: 'prepend',
          scope: null,
          fallback: false,
          description: '输入框前置块，渲染在 input/textarea 之前，带底色与右分隔线（无默认内容）'
        },
        {
          name: 'prefix',
          scope: null,
          fallback: false,
          description: '输入框前置内容，渲染在 input/textarea 之前、前置块之后（无默认内容）'
        },
        {
          name: 'suffix',
          scope: null,
          fallback: false,
          description: '输入框后置内容，渲染在 input/textarea 之后、功能图标之前（无默认内容）'
        },
        {
          name: 'append',
          scope: null,
          fallback: false,
          description: '输入框后置内容，渲染在 input/textarea 元素之后（无默认内容）'
        }
      ],
      features: {
        'input.clearable': {
          title: '可清空',
          description: '可清空：clearable、clearIcon',
          module: 'packages/ui-kit/src/components/input/features/clearable/index.ts',
          exportName: 'inputClearableFeature',
          requires: [],
          props: [
            {
              name: 'clearable',
              type: 'boolean'
            },
            {
              name: 'clearIcon',
              type: 'string | Record<string, any> | (...args: any[]) => any',
              default: {
                name: 'CircleClose',
                __name: 'circle-close'
              }
            }
          ],
          methods: [
            {
              name: 'clear',
              signature: '() => void',
              description: '清空输入内容并聚焦'
            }
          ]
        },
        'input.password': {
          title: '密码可见切换',
          description: '密码可见切换：showPassword',
          module: 'packages/ui-kit/src/components/input/features/password/index.ts',
          exportName: 'inputPasswordFeature',
          requires: [],
          props: [
            {
              name: 'showPassword',
              type: 'boolean'
            }
          ]
        },
        'input.word-limit': {
          title: '字数统计',
          description: '字数统计：showWordLimit、wordLimitPosition',
          module: 'packages/ui-kit/src/components/input/features/word-limit/index.ts',
          exportName: 'inputWordLimitFeature',
          requires: [],
          props: [
            {
              name: 'showWordLimit',
              type: 'boolean'
            },
            {
              name: 'wordLimitPosition',
              type: 'string',
              default: 'inside'
            }
          ]
        },
        'input.icons': {
          title: '图标',
          description: '图标：prefixIcon、suffixIcon',
          module: 'packages/ui-kit/src/components/input/features/icons/index.ts',
          exportName: 'inputIconsFeature',
          requires: [],
          props: [
            {
              name: 'prefixIcon',
              type: 'string | Record<string, any> | (...args: any[]) => any'
            },
            {
              name: 'suffixIcon',
              type: 'string | Record<string, any> | (...args: any[]) => any'
            }
          ]
        },
        'input.methods': {
          title: '实例方法',
          description: '通过 ref 调用输入框方法：focus、blur、select。',
          module: 'packages/ui-kit/src/components/input/features/methods/index.ts',
          exportName: 'inputMethodsFeature',
          requires: [],
          props: [],
          methods: [
            {
              name: 'focus',
              signature: '() => void',
              description: '聚焦输入框'
            },
            {
              name: 'blur',
              signature: '() => void',
              description: '失焦输入框'
            },
            {
              name: 'select',
              signature: '() => void',
              description: '选中全部文本'
            }
          ]
        }
      }
    }
  ]
}
