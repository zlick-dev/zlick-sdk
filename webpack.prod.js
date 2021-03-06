const merge = require('webpack-merge')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const common = require('./webpack.common.js')
const packageInfo = require('./package.json')
const Dotenv = require('dotenv-webpack')

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: `[name]-${packageInfo.version}.js`
  },
  plugins: [
    new Dotenv({
      path: './.env'
    }),
    new UglifyJSPlugin()
  ]
})
