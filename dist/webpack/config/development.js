"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
function config(env) {
    const entry = {};
    if (env.hmr) {
        entry.hmr = 'webpack-hot-middleware/client?reload=true';
    }
    return {
        entry,
        watch: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 600,
            ignored: /node_modules/
        },
        plugins: [
            env.hmr && new webpack.HotModuleReplacementPlugin()
        ].filter(Boolean),
        devServer: {
            publicPath: `/apps/${env.app.contextPath}/`,
            port: env.port || 8080,
            proxy: {
                '/**!(apps)/**/*': {
                    target: env.url || 'https://demos.cumulocity.com',
                    changeOrigin: true,
                    secure: false
                }
            }
        }
    };
}
exports.config = config;
//# sourceMappingURL=development.js.map