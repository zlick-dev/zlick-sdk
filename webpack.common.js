const path = require('path')
const Dotenv = require('dotenv-webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const packageInfo = require('./package.json')

module.exports = {
  entry: {
    zlick: './src/zlick.js'
  },
  output: {
    filename: `[name]-dev-${packageInfo.version}.min.js`,
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
