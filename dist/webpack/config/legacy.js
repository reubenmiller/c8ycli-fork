"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const LegacyManifestResolver_1 = require("../LegacyManifestResolver");
function config(env) {
    const toDir = (...args) => path.resolve(__dirname, ...args);
    const jsRules = [
        {
            test: /node_modules.?zip-js/,
            use: ['imports-loader?this=>window']
        },
        {
            test: /node_modules.?leaflet\.label.*\.js$/,
            use: ['imports-loader?window=>{}']
        },
        {
            test: /\.js$/,
            /**
             * We have to exluce these modules to prevents the duplicate modules that are loading in the core/index.js
             * and in the cumulocity.json
             */
            exclude: /node_modules\/((?!@c8y)|@c8y.ng1-modules.node_modules)/,
            issuer: /cumulocity\.json$/,
            use: ['c8y-pluginpath']
        }
    ];
    const htmlRules = {
        test: /\.html$/,
        oneOf: [
            {
                issuer: /cumulocity\.json$/,
                type: 'javascript/auto',
                use: ['c8y-ngtemplate', 'c8y-pluginpath']
            },
            {
                use: 'raw-loader'
            }
        ]
    };
    const jsonRules = [
        {
            test: /cumulocity(\.\w+)?.json$/,
            type: 'javascript/auto',
            use: ['c8y-manifest']
        },
        {
            test: /(devicecommands|devicetypes|properties|trackers)(.+)\.json$/,
            issuer: /cumulocity\.json$/,
            use: ['c8y-data'],
            type: 'javascript/auto',
        }
    ];
    return {
        module: {
            rules: [
                ...jsonRules,
                ...jsRules,
                htmlRules,
            ]
        },
        resolve: {
            alias: {
                '@angular/upgrade/static': '@angular/upgrade/bundles/upgrade-static.umd.js',
                'jquery-ui': 'jquery-ui/ui',
                'schemaForm': 'angular-schema-form/dist/schema-form.js'
            },
            plugins: [
                new LegacyManifestResolver_1.LegacyManifestResolver()
            ]
        },
        resolveLoader: {
            alias: [
                'less',
                'manifest',
                'ngtemplate',
                'pluginpath',
                'data',
            ].reduce((obj, name) => (Object.assign({ [`c8y-${name}`]: toDir('..', 'loaders', `loader-${name}`) }, obj)), {}),
            modules: ['node_modules', toDir('..', '..', '..', 'node_modules')],
        },
    };
}
exports.config = config;
//# sourceMappingURL=legacy.js.map