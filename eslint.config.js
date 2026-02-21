// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([globalIgnores(['dist', 'android']), {
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  rules: {
    // Disable strict setState-in-effect rule for animation patterns
    'react-hooks/set-state-in-effect': 'off',
    // Allow empty catch blocks for try-catch error handling
    'no-empty': ['error', { allowEmptyCatch: true }],
    // Allow explicit any in test files
    '@typescript-eslint/no-explicit-any': 'off',
  },
}, {
  // Disable react-refresh rules for test files
  files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
}, ...storybook.configs["flat/recommended"]])
