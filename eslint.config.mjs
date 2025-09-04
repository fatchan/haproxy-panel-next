import { defineConfig, globalIgnores } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(['**/node_modules/', '**/openapi/', '.next/']),
  {
    extends: [...compat.extends('next/core-web-vitals')],

    languageOptions: {
      ecmaVersion: 13,
      sourceType: 'module',

      parserOptions: {
        tsconfigRootDir: '__dirname',
      },
    },

    rules: {
      'function-call-argument-newline': ['error', 'consistent'],

      'no-multi-spaces': ['error', { ignoreEOLComments: false }],

      'max-len': [
        'error',
        {
          code: 100,
          tabWidth: 1,
          ignoreComments: true,
          ignoreTrailingComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],

      'brace-style': [
        'error',
        '1tbs',
        {
          allowSingleLine: true,
        },
      ],

      indent: ['error', 'tab', {
        SwitchCase: 1,
        ignoreComments: true,
        MemberExpression: 1,
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        flatTernaryExpressions: true,
      }],

      'linebreak-style': ['error', 'unix'],
      'jsx-quotes': ['error', 'prefer-single'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      curly: ['error'],

      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
        },
      ],

      'no-template-curly-in-string': ['error'],
      'no-trailing-spaces': ['error'],

      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'react-hooks/exhaustive-deps': [0],

      'no-undef': ['error'],

      'no-use-before-define': [
        'error',
        {
          functions: false, // allow function hoisting
          classes: true,
          variables: true,
        },
      ],

      'no-shadow': ['error'],

      'no-const-assign': ['error'],

      'no-redeclare': ['error'],

      'prefer-const': [
        'error',
        {
          destructuring: 'all',
          ignoreReadBeforeAssign: true,
        },
      ],

      'no-implicit-globals': ['error'],
    },
  },
]);
