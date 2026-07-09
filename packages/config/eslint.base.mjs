// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export const baseRules = {
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-unsafe-argument': 'warn',
  'no-console': ['warn', { allow: ['info', 'warn', 'error', 'time', 'timeEnd'] }],
  'prettier/prettier': ['error', { endOfLine: 'auto' }],
};

export const baseConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    rules: baseRules,
  }
);
