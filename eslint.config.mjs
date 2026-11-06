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
      '.trae-html-share-packages/**',
      '**/*.d.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.mjs', '**/*.js'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
)
