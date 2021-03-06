"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const merge = require("webpack-merge");
const path_1 = require("path");
const base_1 = require("./base");
const angular_1 = require("./angular");
const styles_1 = require("./styles");
const legacy_1 = require("./legacy");
const production_1 = require("./production");
const development_1 = require("./development");
const translation_1 = require("./translation");
const plugin_1 = require("./plugin");
const favicon_1 = require("./favicon");
const babel_1 = require("./babel");
function configFactory(extraConfigs = []) {
    return function config(env) {
        env.mode = env.mode || 'development';
        env.sourceMapLess =
            typeof env.sourceMapLess === 'undefined'
                ? env.mode === 'development'
                : env.sourceMapLess !== 'false';
        env.isLegacy = /cumulocity[^/\\]*.json/.test(env.entry);
        if (env.mode === 'production') {
            env.babel = true;
        }
        return [
            base_1.config,
            plugin_1.config,
            angular_1.config,
            styles_1.config,
            favicon_1.config,
            legacy_1.config,
            translation_1.config,
            env.babel && babel_1.config,
            env.mode === 'development' && development_1.config,
            env.mode === 'production' && production_1.config,
            typeof env.sourceMap !== 'undefined' ? () => ({ devtool: env.sourceMap }) : undefined,
            ...extraConfigs,
            getExtraWebpackConfigFromEnv(env)
        ]
            .filter(Boolean)
            .reduce((finalConfig, configFn) => {
            const mergeFn = configFn.mergeFn || merge;
            return mergeFn(finalConfig, configFn(env));
        }, {});
    };
    function getExtraWebpackConfigFromEnv(env) {
        if (env.extraWebpackConfig) {
            const extraWebPackConfig = require(path_1.resolve(process.cwd(), env.extraWebpackConfig));
            if (typeof extraWebPackConfig === 'function') {
                return extraWebPackConfig;
            }
            return () => extraWebPackConfig;
        }
        return undefined;
    }
}
exports.configFactory = configFactory;
//# sourceMappingURL=index.js.map