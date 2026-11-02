import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.build/**',
      'node_modules/**',
      'examples/consumer/node_modules/**',
      'examples/consumer/dist/**',
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
