const CopyWebpackPlugin = require("copy-webpack-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = [{
    entry: "./bootstrap.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bootstrap.js",
    },
    mode: isDevelopment ? 'development' : 'production',
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: {
                            plugins: [
                                isDevelopment && require.resolve('react-refresh/babel'),
                            ].filter(Boolean),
                        },
                    },
                    'ts-loader',
                ],
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader", "postcss-loader"],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new CopyWebpackPlugin({patterns: [{from: 'index.html'}]}),
        isDevelopment && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
}, {
    entry: "./src/worker.ts",
    target: 'webworker',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "worker.js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    experiments: {
        syncWebAssembly: true
    },
    mode: "development",
}];
