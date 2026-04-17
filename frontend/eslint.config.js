import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'vite.config.js']),
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react': react,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      'arrow-parens': ['error', 'always'],

      'indent': 'off',
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2],

      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],

      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],

      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',

      'react/jsx-curly-spacing': ['error', { 'when': 'never', 'children': true }],
      'react/jsx-tag-spacing': ['error', { 'beforeSelfClosing': 'always' }],
      'react/prop-types': 'off',
      'react-hooks/set-state-in-effect': 'off',

      'no-unused-vars': ['error', {
        'vars': 'all',
        'args': 'after-used',
        'ignoreRestSiblings': true,
        'varsIgnorePattern': '^[A-Z_]',
        'argsIgnorePattern': '^_',
      }],

      'max-len': ['error', { 'code': 200 }],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-console': ['error', { 'allow': ['warn', 'error', 'info'] }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]);
