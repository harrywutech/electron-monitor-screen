const path = require('path');

module.exports = {
  target: 'electron-main',
  mode: process.env.NODE_ENV || 'development',
  entry: './src/main/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/main': path.resolve(__dirname, 'src/main'),
      '@/common': path.resolve(__dirname, 'src/common'),
    },
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: {
    'sqlite3': 'commonjs sqlite3'
  }
};