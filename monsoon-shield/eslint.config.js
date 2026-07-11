import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    // Node.js files (server, config, etc.)
    {
        files: ['**/*.js'],
        ignores: ['public/**/*.js', 'test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        },
        rules: {
            // Best Practices
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'off',
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
    // Browser files (public/app.js)
    {
        files: ['public/**/*.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'script',
            globals: {
                ...globals.browser
            }
        },
        rules: {
            // Best Practices
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'off',
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
    // Test files
    {
        files: ['test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.vitest
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'off'
        }
    },
    // Global ignores
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
