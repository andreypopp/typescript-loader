# TypeScript Webpack Loader

TypeScript loader for Webpack.

Example `webpack.config.js` configuration:

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
            loader: 'typescript-loader'
          }
        ],
      }
    };
