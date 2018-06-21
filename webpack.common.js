const path = require('path')
const Dotenv = require('dotenv-webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  entry: {
    'zlick': ['babel-polyfill', './src/zlick.js']
  },
  output: {
    filename: '[name]-2.0.1.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'zlick'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  },
  plugins: [
    new Dotenv({
      path: './.env'
    }),
    new CleanWebpackPlugin(['dist'])
  ]
}
