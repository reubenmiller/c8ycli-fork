"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fast_glob_1 = require("fast-glob");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const unzip_stream_1 = require("unzip-stream");
const fs_1 = require("fs");
const chalk_1 = require("chalk");
const lodash_1 = require("lodash");
const prompt = require("prompt");
const zipdir = require("zip-dir");
const options_1 = require("../options");
const client_1 = require("@c8y/client");
const Commands_1 = require("./Commands");
const basicOptionsSchema = {
    properties: {
        baseUrl: {
            required: true,
            default: options_1.options.C8Y_BASE_URL_DEFAULT,
            description: options_1.options['TXT.INSTANCE_URL'],
        },
        user: {
            pattern: /^[^\\/\s$:+]*$/,
            description: options_1.options['TXT.USERNAME'],
            message: options_1.options['TXT.USERNAME_MSG'],
            required: true,
            default: options_1.options['TXT.USERNAME_DEFAULT']
        },
        password: {
            hidden: true,
            description: options_1.options['TXT.PASSWORD'],
        },
        tenant: {
            description: options_1.options['TXT.TENANT']
        },
    }
};
class DeployCommand extends Commands_1.Commands {
    constructor() {
        super(...arguments);
        this.name = 'deploy [appPaths...]';
        this.description = 'Deploys apps from the specified paths';
        this.options = [
            {
                name: '-T, --tenant [tenant]',
                description: options_1.options['TXT.TENANT']
            },
            {
                name: '-U, --user [user name]',
                description: options_1.options['TXT.USERNAME']
            },
            {
                name: '-P, --password [password]',
                description: options_1.options['TXT.PASSWORD']
            }
        ];
    }
    async action(inputAppGlobs) {
        try {
            const appFolderGlobs = inputAppGlobs.length ? inputAppGlobs : options_1.options['PATH.DEPLOY_APPS'];
            const appPaths = await fast_glob_1.async(appFolderGlobs, { absolute: true, onlyFiles: false });
            const apps = [];
            for (const p of appPaths) {
                apps.push(await this.pathToApp(p));
            }
            if (apps.length) {
                this.client = await this.createClient();
            }
            else {
                throw (options_1.options['TXT.NO_APP']);
            }
            for (const app of apps) {
                await this.deploy(app.json, app.buffer, app.fileName);
            }
        }
        catch (ex) {
            console.log(chalk_1.default.bold.red(options_1.options['TXT.APP_CREATE_FAILED']));
            console.log(chalk_1.default.red(ex));
        }
    }
    async deploy(json, buffer, fileName) {
        const application = await this.getApplicationOrCreateIfNotExists(json);
        const uploadedFile = await this.uploadApplication(application, buffer, fileName);
        await this.activateBinary(uploadedFile, application);
        if (json.type === 'HOSTED' && json.availability === 'MARKET') {
            const res = await this.appPublic(application);
            console.log(chalk_1.default.blue('Subscribing app to current tenant.'));
        }
        const msg = options_1.options['TXT.APP_DEPLOYED'](application.contextPath);
        console.log(chalk_1.default.green.bold(msg));
    }
    async appPublic(app) {
        const headers = { 'content-type': 'application/json', 'accept': 'application/json' };
        const body = JSON.stringify({ application: { id: app.id } });
        return this.client.core.fetch(`/tenant/tenants/${this.client.core.tenant}/applications`, {
            method: 'POST',
            headers,
            body
        });
    }
    async pathToApp(path) {
        const stat = await fs_extra_1.lstat(path);
        if (stat.isDirectory()) {
            return await this.pathDirectoryToApp(path);
        }
        else if (/\.zip$/.test(path)) {
            return await this.pathZipToApp(path);
        }
        else if (/\.json$/.test(path)) {
            return await this.pathJsonToApp(path);
        }
    }
    async pathDirectoryToApp(path) {
        let fileAppData = {};
        try {
            fileAppData = await this.fileToAppData(path_1.resolve(path, options_1.options['PATH.BUILT_MANIFEST_FILE']));
        }
        catch (e) {
            // do nothing
        }
        try {
            fileAppData = Object.assign(fileAppData, await this.fileToAppData(path_1.resolve(path, 'package.json')));
        }
        catch (e) {
            // do nothing
        }
        return {
            json: this.getAppData(fileAppData),
            buffer: await this.zipApplication(path)
        };
    }
    async pathZipToApp(path) {
        let appData = {};
        let closed = false;
        let pendingFiles = 0;
        let resolve;
        const parseFileData = (data) => {
            try {
                const fileData = JSON.parse(data.toString());
                appData = Object.assign(appData, this.dataToAppData(fileData));
            }
            catch (e) {
                // do nothing;
            }
            pendingFiles--;
            resolveIfReady();
        };
        const onClose = () => {
            closed = true;
            resolveIfReady();
        };
        const resolveIfReady = () => {
            if (pendingFiles === 0 && closed) {
                resolve(appData);
            }
        };
        const json = await new Promise((_resolve) => {
            resolve = _resolve;
            fs_1.createReadStream(path)
                .pipe(unzip_stream_1.Parse())
                .on('entry', (entry) => {
                const fileName = entry.path;
                const isCumulocity = fileName.match(options_1.options['PATH.BUILT_MANIFEST_FILE']);
                const isPackage = fileName.match('package.json');
                const macTrash = fileName.match(/__MACOSX/);
                const readFile = (isCumulocity || isPackage) && !macTrash;
                if (readFile) {
                    pendingFiles++;
                    entry.on('data', parseFileData);
                }
                else {
                    entry.autodrain();
                }
            })
                .on('close', onClose);
        });
        return {
            fileName: path_1.basename(path),
            json,
            buffer: fs_1.createReadStream(path)
        };
    }
    async pathJsonToApp(path) {
        return {
            json: this.getAppData(await this.fileToAppData(path)),
            buffer: await this.zipApplication(path_1.dirname(path))
        };
    }
    async fileToAppData(filePath) {
        const fileData = await fs_extra_1.readJSON(filePath);
        return this.dataToAppData(fileData);
    }
    dataToAppData(fileData) {
        return (fileData.c8y && fileData.c8y.application) ? fileData.c8y.application : fileData;
    }
    getAppData(fileData) {
        const data = Object.assign(fileData, this.cli.options.app);
        const defaults = {
            type: 'HOSTED',
            resourcesUrl: '/'
        };
        const requiredKeys = [
            'contextPath',
            'key',
            'name'
        ];
        const copyKeys = requiredKeys.concat([
            'type',
            'availability',
        ]);
        const appData = Object.assign({}, defaults, lodash_1.pick(data, copyKeys));
        const manifestData = Object.assign(lodash_1.omit(data, copyKeys.concat('manifest'), data.manifest));
        appData.manifest = lodash_1.omit(manifestData, ['imports']); // otherwise it will trigger the old plugin server api
        requiredKeys.forEach((field) => {
            if (!appData[field]) {
                throw new Error(`Application property "${field}" not defined.`);
            }
        });
        return appData;
    }
    async createClient() {
        const basicAuth = {
            user: this.getOption('user'),
            password: this.getOption('password'),
            baseUrl: this.getOption('url'),
            tenant: this.getOption('tenant'),
        };
        prompt.start();
        const { properties } = basicOptionsSchema;
        if (!basicAuth.user || !basicAuth.tenant || !basicAuth.password || !basicAuth.baseUrl) {
            basicAuth.baseUrl = await this.handleBasicOption(basicAuth.baseUrl, properties.baseUrl);
            basicAuth.user = await this.handleBasicOption(basicAuth.user, properties.user);
            basicAuth.password = await this.handleBasicOption(basicAuth.password, properties.password);
        }
        try {
            return await client_1.Client.authenticate(basicAuth, basicAuth.baseUrl);
        }
        catch (ex) {
            try {
                if (!basicAuth.tenant && ex.res.status === 401) {
                    basicAuth.tenant = await this.handleBasicOption(basicAuth.tenant, properties.tenant);
                    return await client_1.Client.authenticate(basicAuth, basicAuth.baseUrl);
                }
                else {
                    throw (new Error(options_1.options['TXT.INVALID_CREDENTIALS_BASEURL'](basicAuth.baseUrl)));
                }
            }
            catch (ex) {
                throw ex;
            }
        }
        finally {
            prompt.stop();
        }
    }
    async handleBasicOption(basicAuthOption, basicOptionProperty) {
        if (basicAuthOption) {
            basicOptionProperty.default = basicAuthOption;
        }
        return new Promise((resolve, reject) => {
            prompt.get(basicOptionProperty, (err, result) => {
                resolve(result.question);
            });
        });
    }
    async uploadApplication(application, buffer, filePath) {
        if (!filePath) {
            filePath = `${application.contextPath}.zip`;
        }
        let remoteData;
        try {
            const msg = options_1.options['TXT.APP_UPLOADING'](buffer.length);
            console.log(chalk_1.default.green(msg));
            const { data } = await this.client.application
                .binary(application)
                .upload(buffer, filePath);
            remoteData = data;
        }
        catch (err) {
            console.log(chalk_1.default.bold.red(`${options_1.options['TXT.APP_UPLOAD_ERROR']} ${err.res.status}`));
            console.log(chalk_1.default.red(JSON.stringify(err.data, null, 2)));
            process.exit(9);
        }
        return remoteData;
    }
    async getApplicationOrCreateIfNotExists(application) {
        const remoteApplication = await this.getApplication(application);
        return !remoteApplication ?
            await this.createApplication(application) :
            Object.assign(remoteApplication, application);
    }
    async createApplication(application) {
        let remoteApp;
        try {
            console.log(chalk_1.default.green(options_1.options['TXT.APP_CREATING']));
            const { res, data } = await this.client.application.create(application);
            remoteApp = data;
        }
        catch (err) {
            console.log(chalk_1.default.red(`${options_1.options['TXT.APP_CREATE_FAILED']} ${err.res.status}`));
            console.log(chalk_1.default.red(JSON.stringify(err.data, null, 2)));
            process.exit(9);
        }
        return remoteApp;
    }
    async getApplication(application) {
        const { tenant } = this.client.core;
        let applications;
        try {
            console.log(chalk_1.default.green(options_1.options['TXT.APP_FETCHING']));
            const { data } = await this.client.application.listByOwner(this.client.core.tenant, { pageSize: 1000 });
            applications = data;
        }
        catch (err) {
            console.log(chalk_1.default.red(`${options_1.options['TXT.APP_FETCHING_FAILED']} ${err.res.status}`));
            console.log(chalk_1.default.red(JSON.stringify(err.data, null, 2)));
            process.exit(9);
        }
        return applications.find((v) => v.owner.tenant.id === tenant &&
            v.contextPath === application.contextPath);
    }
    async activateBinary(uploadedFile, application) {
        application.activeVersionId = `${uploadedFile.id}`;
        delete application.type;
        try {
            console.log(chalk_1.default.green(options_1.options['TXT.APP_ACTIVATING'](uploadedFile.id)));
            const { res } = await this.client.application.update(application);
        }
        catch (err) {
            const msg = options_1.options['TXT.APP_ACTIVATING_FAILED'](application.contextPath);
            console.log(chalk_1.default.red(`${msg} ${err.res.status}`));
            console.log(chalk_1.default.red(JSON.stringify(err.data, null, 2)));
            process.exit(9);
        }
    }
    async zipApplication(applicationPath) {
        return new Promise((resolve, reject) => {
            zipdir(applicationPath, (err, buffer) => {
                if (err) {
                    throw err;
                }
                resolve(buffer);
            });
        });
    }
}
exports.DeployCommand = DeployCommand;
//# sourceMappingURL=DeployCommand.js.map