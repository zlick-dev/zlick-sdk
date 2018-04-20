const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/zlick.js',
    output: {
        filename: 'zlick.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'zlick',
    }
};