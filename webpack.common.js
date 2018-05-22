const path = require('path')
const Dotenv = require('dotenv-webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  entry: './src/Zlick.js',
  output: {
    filename: 'zlick.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'zlick'
  },
  plugins: [
    new Dotenv({
      path: './.env'
    }),
    new CleanWebpackPlugin(['dist'])
  ]
}
