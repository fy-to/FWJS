import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '**/histoire-dist/',
    '**/generated/',
    '**/public/',
    '**/.svelte-kit/',
  ],
}, {
  rules: {
    'curly': ['error', 'multi-line', 'consistent'],
    'antfu/if-newline': 'off',
    'antfu/no-import-dist': 'off',
    'node/prefer-global/process': 'off',
    'no-console': 'warn',
    'ts/no-use-before-define': 'warn',
    'vue/define-macros-order': 'off', // Bugged
    'ts/no-unsafe-function-type': 'off',
  },
}, {
  files: ['**/*.vue'],
  rules: {
    'import/first': 'off',
  },
})

/*
'vue/eqeqeq': 'warn',
'eqeqeq': 'warn',
'style/max-statements-per-line': 'off',
'style/no-tabs': 'off',
'unused-imports/no-unused-vars': 'warn',
'ts/ban-ts-comment': 'off',
'vue/no-useless-template-attributes': 'warn',
'vue/valid-v-for': 'warn',
'vue/no-unused-refs': 'warn',
'no-unused-expressions': 'warn',
*/
