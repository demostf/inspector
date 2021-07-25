const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = [{
    entry: "./bootstrap.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bootstrap.js",
    },
    mode: "development",
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
    plugins: [
        new CopyWebpackPlugin({patterns: [{from: 'index.html'}]})
    ],
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
