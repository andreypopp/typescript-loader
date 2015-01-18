# TypeScript Webpack plugin

Webpack plugin for TypeScript.

Example `webpack.config.js` configuration:

    var TypeScriptPlugin = require('typescript-webpack-plugin');

    module.exports = {

      // Currently we need to add '.ts' to resolve.extensions array.
      resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
      },

      // Add loader for .ts files.
      module: {
        loaders: [
          {
            test: /\.ts$/,
            loader: 'typescript-webpack-plugin/loader'
          }
        ],
      },

      // Add TypeScriptPlugin
      plugins: [
        new TypeScriptPlugin()
      ]

    };
