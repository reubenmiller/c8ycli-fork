"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
let angularCompilerPlugin;
try {
    // tslint:disable-next-line:no-var-requires
    angularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;
}
catch (e) {
    angularCompilerPlugin = undefined;
}
function config(env) {
    let angularCompilerluginInstance;
    const plugins = [];
    const rules = [];
    const tsRule = {
        test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
        use: ['@ngtools/webpack']
    };
    try {
        angularCompilerluginInstance = new angularCompilerPlugin({
            tsConfigPath: env.tsConfigPath || env.app.tsConfigPath || path.resolve('tsconfig.json'),
            entryModule: env.app.entryModule && path.resolve(env.app.entryModule),
            skipCodeGeneration: true,
            sourceMap: env.mode !== 'production' && env.sourceMap !== 'false',
        });
    }
    catch (e) {
        // probably we should log this
    }
    if (angularCompilerluginInstance) {
        plugins.push(angularCompilerluginInstance);
        rules.push(tsRule);
    }
    return {
        module: { rules },
        plugins
    };
}
exports.config = config;
//# sourceMappingURL=angular.js.map