module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: [
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "prettier/@typescript-eslint"
    ],
    plugins: ['@typescript-eslint'],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        camelcase: 'off',
        '@typescript-eslint/indent': ["error", 4],
        "space-before-blocks": ["error", "always"],
        "space-before-function-paren": ["error", "always"],
        "eqeqeq": ["error", "always"]
    },
    parserOptions: {
        parser: '@typescript-eslint/parser',
    },
    overrides: [
        {
            files: ['*.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
    ],
};
