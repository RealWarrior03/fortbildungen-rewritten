const { defineConfig } = require('@vue/cli-service');
const path = require('path');
const webpack = require('webpack');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.SERVER_URL': JSON.stringify(process.env.SERVER_URL || ''),
        'process.env.SERVER_PORT': JSON.stringify(process.env.SERVER_PORT || '')
      })
    ]
  }
});
