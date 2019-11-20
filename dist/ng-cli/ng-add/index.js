"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tasks_1 = require("@angular-devkit/schematics/tasks");
const ast_utils_1 = require("@schematics/angular/utility/ast-utils");
const config_1 = require("@schematics/angular/utility/config");
const dependencies_1 = require("@schematics/angular/utility/dependencies");
const index_content_1 = require("../../webpack/plugin/index-content");
const util_1 = require("../util");
const app_module_1 = require("./app-module");
// tslint:disable-next-line:no-var-requires
const pkg = require('../../../package.json');
function ngAdd(options) {
    return (tree, _context) => {
        addDependencies(tree);
        updatePackageJson(tree, options);
        addReflect(tree);
        updateAppModule(tree);
        deleteAppComponents(tree);
        hashRouteModule(tree);
        angularJson(tree);
        indexHtml(tree);
        _context.addTask(new tasks_1.NodePackageInstallTask());
        return tree;
    };
}
exports.default = ngAdd;
function addDependencies(tree) {
    const dependencies = [
        { name: '@c8y/ngx-components', version: pkg.version, type: dependencies_1.NodeDependencyType.Default },
        { name: '@c8y/style', version: pkg.version, type: dependencies_1.NodeDependencyType.Default },
        { name: '@c8y/cli', version: pkg.version, type: dependencies_1.NodeDependencyType.Dev },
        { name: 'uglifyjs-webpack-plugin', version: '^2.1.1', type: dependencies_1.NodeDependencyType.Dev },
        { name: 'autoprefixer', version: '^7.1.1', type: dependencies_1.NodeDependencyType.Dev },
    ];
    dependencies.forEach((dependency) => dependencies_1.addPackageJsonDependency(tree, dependency));
}
function updatePackageJson(tree, options = {}) {
    const applicationsDefaults = {
        name: 'application',
        contextPath: 'application',
        key: 'application-application-key'
    };
    const workspace = config_1.getWorkspace(tree);
    const project = util_1.getProjectFromWorkspace(workspace);
    const main = `${project.sourceRoot}/main.ts`;
    const currentPackage = JSON.parse(tree.read('package.json').toString());
    currentPackage.main = main;
    currentPackage.c8y = {
        application: Object.assign(applicationsDefaults, options.application)
    };
    tree.overwrite('package.json', JSON.stringify(currentPackage, null, 2));
}
function addReflect(tree) {
    const workspace = config_1.getWorkspace(tree);
    const project = util_1.getProjectFromWorkspace(workspace);
    const polyfillPath = `${project.sourceRoot}/polyfills.ts`;
    const source = util_1.getSourceFile(tree, polyfillPath);
    if (!ast_utils_1.isImported(source, undefined, 'core-js/es7/reflect') || !ast_utils_1.isImported(source, undefined, 'core-js/es6/reflect')) {
        let content = tree.read(polyfillPath).toString();
        content = content.replace(/(\/\/)\s*(import\s+.core-js\/es\d\/reflect)/, (matcher, comment, withoutComment) => withoutComment);
        tree.overwrite(polyfillPath, content);
    }
}
function updateAppModule(tree) {
    const workspace = config_1.getWorkspace(tree);
    const project = util_1.getProjectFromWorkspace(workspace);
    const appModulePath = `${project.sourceRoot}/app/app.module.ts`;
    tree.overwrite(appModulePath, app_module_1.APP_MODULE);
}
function deleteAppComponents(tree) {
    const workspace = config_1.getWorkspace(tree);
    const project = util_1.getProjectFromWorkspace(workspace);
    const appComponent = new RegExp(`${project.sourceRoot}/app/app.component`);
    tree.visit((file) => {
        if (appComponent.test(file)) {
            tree.delete(file);
        }
    });
}
function hashRouteModule(tree) {
    const workspace = config_1.getWorkspace(tree);
    const project = util_1.getProjectFromWorkspace(workspace);
    const routingModulePath = `${project.sourceRoot}/app/app-routing.module.ts`;
    const content = tree.read(routingModulePath).toString();
    const replacedContent = content.replace(/RouterModule\.forRoot\([^)]+\)/, 'RouterModule.forRoot(routes, { useHash: true })');
    tree.overwrite(routingModulePath, replacedContent);
}
function angularJson(tree) {
    const workspace = config_1.getWorkspace(tree);
    const json = JSON.parse(tree.read('angular.json').toString());
    json.projects[workspace.defaultProject].architect.build.builder = '@c8y/cli:build';
    json.projects[workspace.defaultProject].architect.serve.builder = '@c8y/cli:dev-server';
    tree.overwrite('angular.json', JSON.stringify(json, null, 2));
}
function indexHtml(tree) {
    const workspace = config_1.getWorkspace(tree);
    const project = util_1.getProjectFromWorkspace(workspace);
    tree.overwrite(`${project.sourceRoot}/index.html`, index_content_1.default);
}
//# sourceMappingURL=index.js.map