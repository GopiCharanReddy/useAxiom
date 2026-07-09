// @ts-check
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig, baseRules } from '@useaxiom/config/eslint.base.mjs';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      ...baseRules,
    },
  },
);
