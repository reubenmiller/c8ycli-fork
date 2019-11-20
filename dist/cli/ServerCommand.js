"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = require("../webpack");
const Commands_1 = require("./Commands");
const options_1 = require("../options");
const chalk_1 = require("chalk");
class ServerCommand extends Commands_1.Commands {
    constructor() {
        super(...arguments);
        this.name = 'serve [appPaths...]';
        this.alias = 'server';
        this.description = options_1.options['TXT.SERVER'];
        this.options = [
            {
                name: '-p, --port [port]',
                description: options_1.options['TXT.SERVER.PORT']
            },
            {
                name: '-k, --ssl [path]',
                description: options_1.options['TXT.SERVER.SSL']
            },
            {
                name: '-H, --hot',
                description: options_1.options['TXT.SERVER.HOT_RELOADING']
            },
            {
                name: '-d, --domain [domain]',
                description: options_1.options['TXT.SERVER.LOCAL_DOMAIN']
            }
        ];
    }
    async action(_appPaths, command) {
        try {
            const devServer = new webpack_1.DevServer(this.getOption('url'), this.getOption('port'), this.getOption('ssl'), this.getOption('domain'));
            devServer.extraWebpackEnv = this.getWebpackExtraOptions();
            const appFolderGlobs = _appPaths.length ? _appPaths : options_1.options['PATH.APPS'];
            const apps = await this.getApps(appFolderGlobs);
            apps.forEach((app) => {
                app.isHot = this.getOption('hot');
            });
            devServer.startDevServer(apps);
        }
        catch (ex) {
            console.log(chalk_1.default.red.bold(options_1.options['TXT.SERVER.FAILED']));
            console.log(chalk_1.default.red(ex));
        }
    }
}
exports.ServerCommand = ServerCommand;
//# sourceMappingURL=ServerCommand.js.map