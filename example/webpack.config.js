module.exports = {

  entry: __dirname + '/index.ts',

  devtool: 'source-map',

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
        loader: __dirname + '/../index'
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      }
    ],
  }

};
