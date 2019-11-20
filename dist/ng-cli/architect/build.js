"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_angular_1 = require("@angular-devkit/build-angular");
const shared_1 = require("./shared");
class C8yBuilder extends build_angular_1.BrowserBuilder {
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
}
exports.C8yBuilder = C8yBuilder;
exports.default = C8yBuilder;
//# sourceMappingURL=build.js.map