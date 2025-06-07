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
	allConfig: js.configs.all
});

export default defineConfig([globalIgnores(['**/node_modules/', '**/openapi/', '.next/']), {
	extends: compat.extends('next/core-web-vitals'),

	languageOptions: {
		ecmaVersion: 13,
		sourceType: 'module',

		parserOptions: {
			tsconfigRootDir: '__dirname',
		},
	},

	rules: {
		'brace-style': ['error', '1tbs', {
			allowSingleLine: true,
		}],

		indent: ['error', 'tab', {
			SwitchCase: 1,
			ignoreComments: true,
			MemberExpression: 1,
		}],

		'linebreak-style': ['error', 'unix'],
		'jsx-quotes': ['error', 'prefer-single'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		curly: ['error'],

		'no-multiple-empty-lines': ['error', {
			max: 1,
		}],

		'no-template-curly-in-string': ['error'],
		'no-trailing-spaces': ['error'],

		'no-unused-vars': ['error', {
			argsIgnorePattern: '^_',
			varsIgnorePattern: '^_',
		}],

		'react-hooks/exhaustive-deps': [0],
	},
}]);
