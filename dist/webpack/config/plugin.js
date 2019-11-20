"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
const plugin_1 = require("../plugin/plugin");
function config(env) {
    const cumulocityPlugin = new plugin_1.CumulocityPlugin({
        app: env.app,
        target: env.target,
        isLegacy: env.isLegacy,
        mode: env.mode,
        indexTemplate: env.app.indexTemplate
    });
    return {
        plugins: [
            new webpack.DefinePlugin({
                __WEBPACK__: true,
                __MODE__: JSON.stringify(env.mode),
                __ENTRY_APP__: JSON.stringify(env.entry),
                __ENTRY_BRANDING__: JSON.stringify(cumulocityPlugin.getBrandingEntry(env.branding)),
                __VERSION_NG1__: JSON.stringify(cumulocityPlugin.getVersion('@c8y/ng1-modules/package.json')),
                __VERSION_NGX__: JSON.stringify(cumulocityPlugin.getVersion('@c8y/ngx-components/package.json')),
            }),
            cumulocityPlugin
        ]
    };
}
exports.config = config;
//# sourceMappingURL=plugin.js.map