"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = require("../webpack");
const fast_glob_1 = require("fast-glob");
const fs = require("fs-extra");
const path = require("path");
const options_1 = require("../options");
class Commands {
    constructor(cli) {
        this.cli = cli;
        this.hidden = false;
        this.description = '';
        this.options = [];
    }
    initCommander() {
        if (this.hidden && this.cli.argv.indexOf(this.name) === -1) {
            return;
        }
        const cmd = this.commander = this.cli.commander.command(this.name);
        if (this.alias) {
            cmd.alias(this.alias);
        }
        cmd.description(this.description)
            .action(this.action.bind(this));
        if (this.options.length) {
            this.options.forEach((option) => {
                cmd.option(option.name, option.description);
            });
        }
        this.commander = cmd;
    }
    getWebpackExtraOptions() {
        return Object.assign({}, this.cli.options.env, { output: this.commander.output });
    }
    getOption(key) {
        return process.env[`${options_1.options.ENV_PREFIX}${key.toUpperCase()}`] ||
            this.commander[key] ||
            this.commander.parent[key] ||
            this.cli.options.cli[key];
    }
    async action(...args) {
        // empty block
    }
    async getApps(folderGlobs) {
        let filePaths = [];
        let folderPaths = [];
        let apps = [];
        for (const g of folderGlobs) {
            folderPaths = folderPaths.concat(await fast_glob_1.async(g, { onlyDirectories: true }));
        }
        for (const g of folderGlobs) {
            filePaths = filePaths.concat(await fast_glob_1.async(g, { onlyFiles: true, absolute: true }));
        }
        for (const p of filePaths) {
            let app;
            if (/package.json$/.test(p)) {
                app = await this.getPackageApp(p);
            }
            if (/cumulocity\..*json$/.test(p)) {
                app = await this.getManifestApp(p);
            }
            if (app) {
                apps.push(app);
            }
        }
        for (const p of folderPaths) {
            apps = apps.concat(await this.getPackageApps(p));
            apps = apps.concat(await this.getManifestApps(p));
        }
        if (!apps.length) {
            throw (options_1.options['TXT.NO_APP']);
        }
        return apps;
    }
    async getManifestApps(cwd) {
        const manifestPaths = await fast_glob_1.async(options_1.options['GLOB.LEGACY_APP_MANIFESTS'], { absolute: true, cwd });
        const apps = [];
        for (const filePath of manifestPaths) {
            apps.push(await this.getManifestApp(filePath));
        }
        return apps;
    }
    async getManifestApp(filePath) {
        const legacyManifest = await fs.readJson(filePath);
        const appOptions = this.cli.options.app;
        const app = new webpack_1.Application(Object.assign({}, legacyManifest, appOptions), filePath);
        return app;
    }
    async getPackageApps(cwd) {
        const packagePaths = await fast_glob_1.async('package.json', { absolute: true, cwd });
        const apps = [];
        for (const filePath of packagePaths) {
            const app = await this.getPackageApp(filePath);
            if (app) {
                apps.push(app);
            }
        }
        return apps;
    }
    async getPackageApp(filePath) {
        const packageJson = await fs.readJson(filePath);
        const entryPoint = path.dirname(filePath);
        const appOptions = this.cli.options.app;
        const packageAppOptions = (packageJson.c8y && packageJson.c8y.application);
        if (packageAppOptions.entryModule) {
            const { entryModule } = packageAppOptions;
            const split = entryModule.split('#');
            split[0] = path.relative(process.cwd(), path.resolve(path.dirname(filePath), (split[0]))).replace(/\\/g, '/');
            packageAppOptions.entryModule = split.join('#');
        }
        return packageAppOptions && new webpack_1.Application(Object.assign({}, packageAppOptions, appOptions), entryPoint);
    }
}
exports.Commands = Commands;
//# sourceMappingURL=Commands.js.map