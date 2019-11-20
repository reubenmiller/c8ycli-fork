"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_angular_1 = require("@angular-devkit/build-angular");
const shared_1 = require("./shared");
const options_1 = require("../../options");
const url = require("url");
class C8yDevServerBuilder extends build_angular_1.DevServerBuilder {
    buildWebpackConfig(root, projectRoot, host, options) {
        // to make sure we have at least one item in .styles
        options.styles.push({
            input: 'c8yBrandingToRemove',
            lazy: true,
            moduleName: 'c8yBrandingToRemove'
        });
        const webpackConfig = super.buildWebpackConfig(root, projectRoot, host, options);
        return shared_1.mergeWebpackConfig(root, options, webpackConfig);
    }
    run(builderConfig) {
        const { options } = builderConfig;
        const root = this.context.workspace.root;
        const { app, cli } = shared_1.c8yConfig(root);
        options.proxyConfig = shared_1.cliPath(root, 'ng-cli', 'architect', 'proxy.js');
        options.liveReload = false;
        global.c8yServePath = `/apps/${app.contextPath}`;
        global.c8yUrl = cli.url || options_1.options.C8Y_BASE_URL_DEFAULT;
        global.c8yUrlLocal = url.format({
            protocol: options.ssl ? 'https' : 'http',
            hostname: options.host === '0.0.0.0' ? 'localhost' : options.host,
            port: options.port.toString(),
        });
        return super.run(builderConfig);
    }
}
exports.C8yDevServerBuilder = C8yDevServerBuilder;
exports.default = C8yDevServerBuilder;
//# sourceMappingURL=dev-server.js.map