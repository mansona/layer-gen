'use strict';

module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2021,
    requireConfigFile: false,
  },
  plugins: ['prettier'],
  extends: ['eslint:recommended', 'plugin:n/recommended', 'plugin:prettier/recommended'],
  env: {
    browser: false,
    node: true,
    es6: true,
  },
  globals: {},
  rules: {},
};
