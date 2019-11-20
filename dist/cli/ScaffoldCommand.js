"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Commands_1 = require("./Commands");
const path = require("path");
const pacote = require("pacote");
const options_1 = require("../options");
const util_1 = require("util");
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const sanitizeFilename = require("sanitize-filename");
class ScaffoldCommand extends Commands_1.Commands {
    constructor() {
        super(...arguments);
        this.name = 'new [name] [template]';
        this.description = options_1.options['TXT.NEW'];
        this.defaultAppPackage = options_1.options['PACKAGE.BASE_TEMPLATE'];
        this.options = [
            {
                name: '-r, --registry <registryUrl>',
                description: options_1.options['TXT.NPM_REGISTRY']
            },
            {
                name: '-a, --appPackage <packageName>',
                description: options_1.options['TXT.NPM_PACKAGE_NAME'](this.defaultAppPackage)
            }
        ];
        this.appName = 'My application';
        this.appToCopy = 'application';
        this.tempFolder = '__appsTemp';
    }
    get sanatizedName() {
        return sanitizeFilename(this.appName).toLowerCase().replace(/\s+/g, '-');
    }
    get brandingPackage() {
        return options_1.options['PACKAGE.BASE_BRANDING'];
    }
    get pkgApps() {
        return options_1.options['PACKAGE.APPS'];
    }
    get cliPackage() {
        return options_1.options['PACKAGE.CLI'];
    }
    get registry() {
        return this.getOption('registry') || options_1.options.NPM_REGISTRY;
    }
    get appPackage() {
        return this.getOption('appPackage') || this.defaultAppPackage;
    }
    async action(appName, template, commander) {
        this.appName = appName || this.appName;
        this.appToCopy = template || this.appToCopy;
        try {
            await this.ensureDir();
            await this.downloadAppsToTemp();
            await this.copyFiles();
            await this.npmInit();
            await this.updatePackageJson();
            await this.removeTemp();
            console.log(options_1.options['TXT.NEW_APPLICATION'](this.sanatizedName));
        }
        catch (e) {
            console.log(e);
        }
        finally {
            await this.removeTemp();
        }
    }
    async ensureDir() {
        return await fs_extra_1.ensureDir(this.sanatizedName);
    }
    async downloadAppsToTemp() {
        const tempFolder = path.resolve(this.tempFolder);
        return await pacote.extract(this.appPackage, tempFolder, {
            registry: this.registry,
            proxy: process.env.HTTPS_PROXY,
            noProxy: process.env.NO_PROXY,
        });
    }
    async copyFiles() {
        const origin = path.resolve(this.tempFolder, this.appToCopy);
        const dest = path.resolve(this.sanatizedName);
        const pkgJson = path.resolve(this.sanatizedName, 'package.json');
        await fs_extra_1.copy(origin, dest);
        return await fs_extra_1.remove(pkgJson);
    }
    async removeTemp() {
        const tempFolder = path.resolve(this.tempFolder);
        return await fs_extra_1.remove(tempFolder);
    }
    async npmInit() {
        const dest = path.resolve(this.sanatizedName);
        await util_1.promisify(child_process_1.exec)('npm init -f', { cwd: dest });
    }
    async updatePackageJson() {
        const appsManifestPath = path.resolve(this.tempFolder, 'package.json');
        const appsManifest = await fs_extra_1.readJson(appsManifestPath);
        const appToCopyManifestPath = path.resolve(this.tempFolder, this.appToCopy, 'package.json');
        const appToCopyManifest = await fs_extra_1.readJson(appToCopyManifestPath);
        const newAppManifestPath = path.resolve(this.sanatizedName, 'package.json');
        const newAppManifest = await fs_extra_1.readJson(newAppManifestPath);
        // TODO: add version for possible branded sdk
        // Version alignment is an issue, we probably will have to  partners to use the same versoning
        const packagesVersion = appsManifest.dependencies['@c8y/ngx-components'];
        newAppManifest.dependencies = Object.assign({}, appsManifest.dependencies, appToCopyManifest.dependencies);
        let brandingPackageVersion = packagesVersion;
        let cliPackageVersion = packagesVersion;
        try {
            await pacote.manifest(`${this.brandingPackage}@${brandingPackageVersion}`, { registry: this.registry });
        }
        catch (e) {
            const latestPackage = await pacote.manifest(this.brandingPackage, { registry: this.registry });
            brandingPackageVersion = latestPackage.version;
        }
        try {
            const a = await pacote.manifest(`${this.cliPackage}@${cliPackageVersion}`, { registry: this.registry });
        }
        catch (e) {
            const latestPackage = await pacote.manifest(this.cliPackage, { registry: this.registry });
            cliPackageVersion = latestPackage.version;
        }
        newAppManifest.dependencies[this.brandingPackage] = brandingPackageVersion;
        newAppManifest.devDependencies = appsManifest.devDependencies;
        newAppManifest.devDependencies[this.cliPackage] = cliPackageVersion;
        newAppManifest.scripts = appToCopyManifest.scripts;
        for (const script in newAppManifest.scripts) {
            if (newAppManifest.scripts.hasOwnProperty(script)) {
                newAppManifest.scripts[script] = newAppManifest.scripts[script].replace(/c8ycli/, options_1.options.BIN);
            }
        }
        newAppManifest.c8y = appToCopyManifest.c8y || {};
        newAppManifest.c8y.application = newAppManifest.c8y.application || {};
        Object.assign(newAppManifest.c8y.application, {
            name: this.appName,
            contextPath: this.sanatizedName,
            key: `${this.sanatizedName}-application-key`
        });
        newAppManifest.c8y.cli = newAppManifest.c8y.cli || {};
        if (this.getOption('url')) {
            Object.assign(newAppManifest.c8y.cli, {
                url: this.getOption('url')
            });
        }
        return await fs_extra_1.writeJson(newAppManifestPath, newAppManifest, { spaces: 2 });
    }
}
exports.ScaffoldCommand = ScaffoldCommand;
//# sourceMappingURL=ScaffoldCommand.js.map