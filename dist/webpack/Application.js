"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const path = require("path");
const chalk_1 = require("chalk");
const BuildDefaults_1 = require("./BuildDefaults");
const path_1 = require("path");
const util_1 = require("util");
const options_1 = require("../options");
/**
 * A description for an Cumulocity application.
 */
// tslint:disable-next-line:max-classes-per-file
class Application {
    /**
     * Create a new Cumulocity application.
     */
    constructor(options, entry) {
        this.options = options;
        this.entry = entry;
        this.events = new EventEmitter();
        this.percentage = 0;
        this.msg = '';
        options.globalTitle = options.globalTitle || options_1.options['TXT.GLOBAL_TITLE'];
    }
    get contextPath() {
        return this.options.contextPath;
    }
    get cwd() {
        return this.legacyEntry ? path.dirname(this.entry) : this.entry;
    }
    get branding() {
        const { brandingEntry } = this.options;
        if (!this.hasLegacyBranding) {
            if (brandingEntry) {
                if (path_1.isAbsolute(brandingEntry) || !/^\./.test(brandingEntry)) {
                    return brandingEntry;
                }
                else {
                    return path_1.join(this.cwd, brandingEntry);
                }
            }
            return BuildDefaults_1.BUILD_DEFAULTS.DEFAULT_BRANDING_PATH;
        }
    }
    get hasLegacyBranding() {
        return (this.options.imports || []).some((i) => (/branding/i).test(i));
    }
    get legacyEntry() {
        return (/cumulocity\..*json/).test(this.entry);
    }
    createDevelopmentMiddleware(expressApp, extraWebpackEnv) {
        let webpackDevMiddleware;
        let webpackHotMiddleware;
        try {
            webpackDevMiddleware = require('webpack-dev-middleware');
        }
        catch (e) {
            throw new Error('Webpack dev middleware is not installed');
        }
        try {
            webpackHotMiddleware = require('webpack-hot-middleware');
        }
        catch (e) {
            throw new Error('Webpack dev hot middleware is not installed');
        }
        this.createWebpack(extraWebpackEnv);
        const { compiler } = this;
        if (extraWebpackEnv.hmr) {
            expressApp.use(webpackHotMiddleware(compiler));
        }
        return webpackDevMiddleware(compiler, {
            logLevel: 'info',
            stats: extraWebpackEnv.stats || {
                colors: true,
                entrypoints: false,
                chunks: true,
                chunkModules: false,
                chunkOrigins: false,
                chunkGroups: false,
                assets: false,
                modules: false,
                warningsFilter: (warning) => /@angular.core.fesm5.core.js/.test(warning)
            }
        });
    }
    async build(env) {
        this.createWebpack(env);
        const compilerRun = util_1.promisify(this.compiler.run.bind(this.compiler));
        return await compilerRun();
    }
    createWebpack(extraEnv) {
        let webpack;
        try {
            webpack = require('webpack');
        }
        catch (e) {
            throw new Error('Webpack is not installed');
        }
        const env = Object.assign({ app: this.options, entry: this.entry, branding: this.branding }, extraEnv);
        // Only load here so that the CLI can be used without the peer dependencies
        const webpackConfig = require('./config/index').configFactory();
        this.compiler = webpack(webpackConfig(env));
        let startTime;
        new webpack.ProgressPlugin((percent, msg, addInfo) => {
            if (percent === 0) {
                startTime = process.hrtime();
            }
            this.percentage = Math.floor(percent * 100);
            addInfo = addInfo ? `- ${addInfo}` : '';
            this.msg = msg ? ` - ${msg} ${addInfo}` : ` - finished in ${this.elapsedTime(startTime)}`;
            if (this.percentage === 100) {
                this.events.emit('build.done');
            }
            else {
                this.events.emit('build.progress');
            }
        }).apply(this.compiler);
    }
    /**
     * Returns the log msg
     */
    getLogMsg(prefix = '') {
        const extraInfo = this.legacyEntry ? chalk_1.default.gray(' Legacy Manifest ') : ' ';
        let status = chalk_1.default.yellow(`${this.percentage} %`);
        let app = chalk_1.default.underline(`${prefix}${this.options.contextPath}/`);
        if (!this.compiler) {
            status = chalk_1.default.yellow('waiting');
        }
        if (this.percentage === 100) {
            app = chalk_1.default.green(app);
            status = chalk_1.default.green.bold('done');
        }
        status = this.compiler ? `${status}${chalk_1.default.dim(this.msg)}` : status;
        return `${app}${extraInfo}${status}`;
    }
    /**
     * Prints how much time was used for a build
     * @param start the start time
     */
    elapsedTime(start) {
        const precision = 3;
        const elapsed = process.hrtime(start)[1] / 1000000;
        return process.hrtime(start)[0] + ' s - ' + elapsed.toFixed(precision) + ' ms';
    }
}
exports.Application = Application;
//# sourceMappingURL=Application.js.map