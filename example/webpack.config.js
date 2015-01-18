var TypeScriptPlugin = require('../index');

var typeScriptPlugin = new TypeScriptPlugin();

module.exports = {

  entry: __dirname + '/index.ts',

  output: {
    filename: __dirname + '/bundle.js'
  },

  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".js"]
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: __dirname + '/../loader'
      }
    ],
  },

  plugins: [
    typeScriptPlugin
  ]

};
