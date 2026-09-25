const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const DotenvWebpack = require('dotenv-webpack');

const isProduction = process.env.NODE_ENV === 'production';

// 生产构建缺少后端地址时给出显式提示（前端会退化成相对路径请求后端）
if (isProduction && !process.env.BOYOUQUAN_API_ADDRESS) {
    console.warn('\n[webpack] 警告：未检测到构建环境变量 BOYOUQUAN_API_ADDRESS，前端将改用相对路径请求后端。\n');
}

module.exports = {
    entry: './src/index.tsx', // 入口文件
    output: {
        path: path.resolve(__dirname, 'dist'), // 输出目录
        filename: '[name].[contenthash].js', // 输出文件名
        chunkFilename: '[name].[contenthash].chunk.js',
        publicPath: '/', // 资源的公共路径
        clean: true, // 清理旧的文件
    },
    mode: isProduction ? 'production' : 'development', // 开发模式
    devtool: isProduction ? false : 'eval-source-map', // 生成 source map
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist')
        },
        compress: true,
        port: 3000, // 本地开发服务器端口
        historyApiFallback: {
            disableDotRule: true
        }
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
        minimize: isProduction,
        minimizer: [new TerserPlugin()],
    },
    module: {
        rules: [
            // TypeScript/TSX
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            // CSS
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: { importLoaders: 1 }
                    },
                    'postcss-loader'
                ],
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].[ext]',
                            outputPath: 'images/',
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        // 环境变量注入：
        //   生产（部署平台构建）——只读取构建环境变量（部署平台面板里配的 BOYOUQUAN_API_ADDRESS），
        //                        仓库内不保存任何后端地址，.env.production 不进仓库。
        //   开发（本地）——读取本地 .env（.gitignore 已忽略）。
        isProduction
            ? new webpack.DefinePlugin({
                  'process.env.BOYOUQUAN_API_ADDRESS': JSON.stringify(process.env.BOYOUQUAN_API_ADDRESS || ''),
              })
            : new DotenvWebpack({
                  path: '.env',
                  systemvars: true,
              }),
        new webpack.ProvidePlugin({
            "React": "react",
        }),
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html',
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].[contenthash].css',
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'public/changelog.json'),
                    to: path.resolve(__dirname, 'dist/static/changelog.json'),
                },
            ],
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@pages': path.resolve(__dirname, 'src/pages'),
            '@layouts': path.resolve(__dirname, 'src/layouts'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@services': path.resolve(__dirname, 'src/services'),
            '@types': path.resolve(__dirname, 'src/types'),
            '@utils': path.resolve(__dirname, 'src/utils'),
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
};