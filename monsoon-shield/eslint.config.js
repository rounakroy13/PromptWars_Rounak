import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                setTimeout: 'readonly',
                URL: 'readonly'
            }
        },
        rules: {
            // Best Practices
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'off', // Allow console for server logging
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'multi-line'],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            
            // Style
            'indent': ['error', 4, { SwitchCase: 1 }],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'never'],
            'no-trailing-spaces': 'error',
            'eol-last': ['error', 'always'],
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
            
            // ES6+
            'prefer-const': 'error',
            'no-var': 'error',
            'object-shorthand': ['error', 'always'],
            'prefer-arrow-callback': 'error',
            'prefer-template': 'error',
            
            // Security
            'no-new-wrappers': 'error'
        }
    },
    {
        ignores: [
            'node_modules/',
            'dist/',
            'build/',
            'coverage/',
            '*.min.js'
        ]
    }
];