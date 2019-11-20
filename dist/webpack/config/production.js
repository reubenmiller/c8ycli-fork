"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
function config(env) {
    return {
        devtool: false,
        output: {
            filename: '[name].[hash].js',
            chunkFilename: '[name].[hash].js',
        },
        optimization: {
            splitChunks: {
                chunks(chunk) {
                    return chunk.name !== 'bootstrap';
                }
            },
            minimizer: [
                new UglifyJsPlugin({
                    uglifyOptions: {
                        output: {
                            comments: false
                        }
                    },
                    cache: true,
                    parallel: true,
                    sourceMap: false
                }),
                new OptimizeCSSAssetsPlugin({})
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({ filename: '[name].[hash].css' })
        ]
    };
}
exports.config = config;
//# sourceMappingURL=production.js.map