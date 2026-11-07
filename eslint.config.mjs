import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.build/**',
      'node_modules/**',
      'examples/consumer/node_modules/**',
      'examples/consumer/dist/**',
      // 本地临时探针与草稿：不进仓库，也不参与质量门禁
      '_scratch/**',
      '.tmp/**',
      '.trae-html-share-packages/**',
      // 类型探针：刻意使用 `{}` 作为 Vue 泛型占位，不属于产品代码
      'examples/consumer/.type-probe/**',
      '**/*.d.ts'
    ]
  },
  // 官方推荐规则：catch 未使用变量、空对象类型、函数类型误用等类型层问题（C8）。
  // 例外：`no-explicit-any` 暂关——组件库的泛型插槽 / 事件载荷在 90 个组件里大面积
  // 使用显式 any，属于 C9 说的"逐步收紧"范畴；本批只清 `as any` 与新增文件，
  // 不把 600+ 处历史类型标注一次性搅进重构，避免改坏运行时行为。
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: ['**/*.ts', '**/*.mjs', '**/*.js'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
)
