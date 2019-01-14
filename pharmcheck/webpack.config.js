const webpack = require('webpack');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');
const { DefinePlugin } = webpack;

module.exports = (env, argv) => {
  return {
    entry: './src/index.js',
    output: {
      path: __dirname + '/dist',
      publicPath: '/',
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            env !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader'
          ],
        },
        {
          // ASSET LOADER
          // Reference: https://github.com/webpack/file-loader
          // Copy png, jpg, jpeg, gif, svg, woff, woff2, ttf, eot files to output
          // Rename the file using the asset hash
          // Pass along the updated reference to your code
          // You can add here any file extension you want to get copied to your output
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
          loader: 'file-loader',
          exclude: /index\.html$/
        },
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json', '.css', '.scss'],
      alias: {
        '@components': path.resolve(__dirname, 'src', 'components'),
        '@stores': path.resolve(__dirname, 'src', 'stores'),
        '@utils': path.resolve(__dirname, 'src', 'utils'),
        '@routes': path.resolve(__dirname, 'src', 'routes'),
        '@styles': path.resolve(__dirname, 'src', 'styles')
      },
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        template: `./src/index.html`,
        inject: 'body',
        filename: `index.html`
      }),
      new HtmlWebpackHarddiskPlugin(),
      new CleanWebpackPlugin(['dist'], {
        verbose: true,
        dry: false
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "[name].css",
        chunkFilename: "[id].css"
      }),
      new DefinePlugin({
        'process.env': {
          NODE_ENV: env,
          MOCK: process.env.MOCK || false,
          HOST: process.env.HOST ? JSON.stringify(process.env.HOST) : JSON.stringify('')
        },
      }),
      /*new PostCompile(() => {

      })*/
      // new BundleAnalyzerPlugin()
    ],
    devServer: {
      historyApiFallback: true,
      contentBase: './dist',
      hot: true
    }
  }
};