"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const translation_1 = require("../../webpack/config/translation");
const favicon_1 = require("../../webpack/config/favicon");
const plugin_1 = require("../../webpack/config/plugin");
const options_1 = require("../../options");
const core_1 = require("@angular-devkit/core");
const webpackMerge = require("webpack-merge");
function mergeWebpackConfig(root, options, webpackConfig) {
    const webpackOptions = getWebpackOptions(root, options);
    const translationConfig = translation_1.config(webpackOptions);
    const faviconConfig = favicon_1.config(webpackOptions);
    const pluginConfig = plugin_1.config(webpackOptions);
    const { entry } = webpackConfig;
    entry.main = [core_1.getSystemPath(core_1.join(root, 'node_modules', '@c8y', 'cli', 'dist', 'app-bootstrap', 'index.js'))];
    // using Indexhtmlplugin from @c8y/cli
    webpackConfig.plugins = webpackConfig.plugins
        .filter((plugin) => !plugin.constructor.toString().match('IndexHtmlWebpackPlugin'));
    const finalConfig = webpackMerge([
        webpackConfig,
        translationConfig,
        faviconConfig,
        pluginConfig,
        {
            stats: {
                chunks: true,
                excludeAssets: [/locales.angular/],
                excludeModules: [/locales.angular/]
            }
        }
    ]);
    const { branding: brandingPath } = webpackOptions;
    finalConfig.module.rules.forEach((rule) => {
        if (rule.test.test('.less') && rule.include) {
            rule.include.push(/@c8y.style/);
            rule.include.push(brandingPath);
        }
    });
    // this is just to garantee that there are global styles
    delete finalConfig.entry.c8yBrandingToRemove;
    return finalConfig;
}
exports.mergeWebpackConfig = mergeWebpackConfig;
function getWebpackOptions(root, options) {
    const { app, cli } = c8yConfig(root);
    const indexTemplate = options.index;
    return Object.assign({ mode: options.optimization ? 'production' : 'development', entry: core_1.getSystemPath(core_1.resolve(root, options.main)), app: Object.assign({}, app, { indexTemplate }) }, (cli || {}), { branding: branding(root) });
}
exports.getWebpackOptions = getWebpackOptions;
function branding(root) {
    const { app, cli } = c8yConfig(root);
    let paths;
    if (app.brandingEntry || cli.branding) {
        paths = [app.brandingEntry || cli.branding];
    }
    else {
        paths = ['node_modules', options_1.options['BUILD.BRANDING_PATH']];
    }
    return core_1.getSystemPath(core_1.join(root, ...paths));
}
exports.branding = branding;
function cliPath(root, ...paths) {
    return core_1.getSystemPath(core_1.join(root, 'node_modules', '@c8y', 'cli', 'dist', ...paths));
}
exports.cliPath = cliPath;
function c8yConfig(root) {
    const pkg = require(core_1.getSystemPath(core_1.join(root, 'package.json')));
    const { application: app, cli = {} } = pkg.c8y;
    return { app, cli };
}
exports.c8yConfig = c8yConfig;
//# sourceMappingURL=shared.js.map