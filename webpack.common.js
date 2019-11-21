const path = require('path')

module.exports = {
  entry: {
    zlick: './src/zlick.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'zlick'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  }
}
