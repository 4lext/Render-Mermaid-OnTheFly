const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    content: './src/content.ts'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ],
    // Convert dynamic imports to regular imports
    parser: {
      javascript: {
        dynamicImportMode: 'eager'
      }
    }
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/styles.css', to: 'styles.css' },
        { from: 'src/icons', to: 'icons' }
      ]
    })
  ],
  optimization: {
    minimize: false, // Keep code readable for debugging
    splitChunks: false, // Disable code splitting to bundle everything in single files
    runtimeChunk: false // Disable runtime chunk to avoid dynamic loading issues
  }
};
