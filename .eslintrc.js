module.exports = {
    extends: "standard",
    env: {
      browser: true,
      node: true
    },
    plugins: [
        "security"
    ],
    extends: [
        "plugin:security/recommended"
    ],
    rules: {
        // allow async-await
        'generator-star-spacing': 'off',
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    },
    parserOptions: {
        "sourceType": "module",
        "ecmaVersion": 8,
        "ecmaFeatures": {
            "jsx": true,
            "experimentalObjectRestSpread": true
        }
    },
    globals: {
        Image: true
    }
};