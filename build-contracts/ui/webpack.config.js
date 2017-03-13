const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      "repos-upload": path.resolve(__dirname, '../../')
    }
  }
}
