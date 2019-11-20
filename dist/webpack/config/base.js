"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
function config(env) {
    return {
        entry: {
            bootstrap: '@c8y/cli/dist/app-bootstrap'
        },
        mode: env.mode,
        devtool: 'cheap-module-eval-source-map',
        output: {
            filename: '[name].js',
            chunkFilename: '[name].js',
            path: path.resolve(env.output || 'dist', 'apps', env.app.contextPath)
        },
        resolve: {
            extensions: ['.ts', '.js', '.json'],
            // always look in the root node_modules first
            // trying to avoid issues with multiple versions of rxjs
            modules: [path.resolve('node_modules'), 'node_modules'],
        },
        module: {
            rules: [
                {
                    test: /(jpe?g|gif|png|woff(2)?|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    exclude: /favicon/,
                    use: [{ loader: 'file-loader', options: { name: '[name].[ext]' } }]
                }
            ]
        }
    };
}
exports.config = config;
//# sourceMappingURL=base.js.map