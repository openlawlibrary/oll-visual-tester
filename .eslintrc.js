module.exports = {
  env: {
    browser: false,
    node: true
  },
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  extends: [
    'standard',
  ],
  rules: {
    'comma-dangle': ['error', 'only-multiline'],
    'no-tabs': 'off',
    'prefer-spread': 'error',
    'no-unused-vars': 'warn',
  },
}
