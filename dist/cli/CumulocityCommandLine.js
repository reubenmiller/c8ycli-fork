"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-unused-expression */
const commander_1 = require("commander");
const yargs = require("yargs");
const ServerCommand_1 = require("./ServerCommand");
const BuildCommand_1 = require("./BuildCommand");
const DeployCommand_1 = require("./DeployCommand");
const LocaleExtractCommand_1 = require("./LocaleExtractCommand");
const LocaleCompileCommand_1 = require("./LocaleCompileCommand");
const options_1 = require("../options");
const ScaffoldCommand_1 = require("./ScaffoldCommand");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const chalk_1 = require("chalk");
class CumulocityCommandLine {
    constructor(argv) {
        this.commander = new commander_1.Command();
        // Generic option that will not be parsed by commander
        this.optionsNamepaces = [
            'env',
            'app' // passed direclty to the apps
        ];
        this.options = {};
        this.cliOptions = [
            {
                name: '-u, --url <url>',
                description: options_1.options['TXT.URL']
            }
        ];
        this.collectOptions(argv);
        this.argv = this.clearArgv(argv);
        this.setupDefaultCliOptionsFromPackage();
        this.setupCli();
        this.setupCliOptions();
        this.setupCliCommands();
        this.setupHelp();
        this.run();
    }
    // These are collected outside of commander, will allow to read
    collectOptions(argv) {
        if (argv.indexOf('--help') > -1) {
            return;
        }
        const parsed = yargs(argv.slice(2)).parse(argv);
        this.optionsNamepaces.forEach((ns) => {
            this.options[ns] = {};
            if (parsed[ns] && typeof parsed[ns] === 'object') {
                this.options[ns] = parsed[ns];
            }
        });
        // options that need processing
        if (this.options.app.brandingEntry && this.options.app.brandingEntry.match(/^./)) {
            this.options.app.brandingEntry = path_1.resolve(this.options.app.brandingEntry);
        }
    }
    clearArgv(argv) {
        return argv.filter((item) => !this.optionsNamepaces.some((ns) => item.match(new RegExp(`^--${ns}\.`))));
    }
    setupDefaultCliOptionsFromPackage() {
        try {
            const pkg = fs_extra_1.readJSONSync('./package.json');
            if (pkg.c8y.cli) {
                this.options.cli = pkg.c8y.cli;
            }
        }
        catch (e) {
            // do nothing
        }
        finally {
            this.options.cli = this.options.cli || {};
        }
    }
    setupCli() {
        this.commander
            .description(options_1.options['TXT.CLI_DESCRIPTION']);
    }
    setupCliOptions() {
        // Default options
        this.cliOptions.forEach((option) => this.commander.option(option.name, option.description));
    }
    setupCliCommands() {
        this.commands = [
            new ScaffoldCommand_1.ScaffoldCommand(this),
            new ServerCommand_1.ServerCommand(this),
            new BuildCommand_1.BuildCommand(this),
            new DeployCommand_1.DeployCommand(this),
            new LocaleExtractCommand_1.LocaleExtractCommand(this),
            new LocaleCompileCommand_1.LocaleCompileCommand(this),
        ];
        this.commands.forEach((cmd) => cmd.initCommander());
    }
    setupHelp() {
        this.commander.on('--help', () => {
            const lines = [];
            lines.push('');
            lines.push('  Application options:');
            lines.push('');
            // tslint:disable-next-line:max-line-length
            lines.push('    Can be defined with --app.<option>=<value>. These will be applied to all applications found in [appPaths]');
            lines.push('    Examples:');
            lines.push('        --app.name="My Application"');
            lines.push('        --app.key=myapp-key');
            lines.push('        --app.contextPath=myapplication');
            lines.push('        --app.brandingEntry="./branding/mybranding.less"');
            lines.push('');
            lines.push('  Environment options:');
            lines.push('');
            lines.push('    Can be defined with --env.<option>=<value>.');
            lines.push('    Examples:');
            lines.push('      --env.mode="production"');
            lines.push('');
            console.log(lines.join('\n'));
        });
    }
    run() {
        this.commander.on('command:*', (args) => {
            console.error(chalk_1.default.red(`Command "${args[0]}" not found`));
            this.commander.help();
        });
        this.commander.parse(this.argv);
        if (!this.commander.args.length) {
            this.commander.help();
        }
    }
}
exports.CumulocityCommandLine = CumulocityCommandLine;
//# sourceMappingURL=CumulocityCommandLine.js.map