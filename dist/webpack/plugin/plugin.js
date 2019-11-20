"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const fg = require("fast-glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const index_content_1 = require("./index-content");
const locales_1 = require("./locales");
const webpack_sources_1 = require("webpack-sources");
const fs_1 = require("fs");
const LocaleCompiler_1 = require("../../utils/LocaleCompiler");
const PLUGIN_NAME = 'CumulocityPlugin';
exports.NG1_PACKAGE = '@c8y/ng1-modules';
exports.LEGACY_MANIFEST = '@c8y-from-manifest/';
class CumulocityPlugin {
    constructor(options = {}) {
        this.options = options;
        this.target = {};
        this.localeCompiler = new LocaleCompiler_1.LocaleCompiler();
        this.setupTarget();
        this.app = Object.assign({}, options.app, this.target.options);
    }
    get groupedPos() {
        return this.localeCompiler.groupedPos;
    }
    getVersion(packageJsonName) {
        try {
            const { version } = require(packageJsonName);
            return version;
        }
        catch (ex) {
            return '--';
        }
    }
    setupTarget() {
        const { target } = this.options;
        if (target) {
            this.target = typeof target === 'string' ?
                JSON.parse(fs_1.readFileSync(path.resolve(target), { encoding: 'utf8' })) : target;
        }
        this.target = Object.assign({ options: {} }, this.target);
    }
    apply(compiler) {
        this.applyOtherPlugins(compiler);
        compiler.c8yPluginInstance = this;
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => this.setCompilation(compilation));
    }
    setCompilation(compilation) {
        this.compilation = compilation;
        compilation.c8yPluginInstance = this;
        compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, (callback) => {
            this.createTranslationAssets(compilation);
            this.createManifest(compilation);
            callback();
        });
        this.setHtmlHook(compilation);
    }
    setHtmlHook(compilation) {
        const { htmlWebpackPluginAlterAssetTags } = compilation.hooks;
        if (htmlWebpackPluginAlterAssetTags) {
            htmlWebpackPluginAlterAssetTags.tapAsync(PLUGIN_NAME, (htmlPluginData, callback) => {
                const { chunks } = compilation;
                htmlPluginData.head.unshift({
                    closeTag: true,
                    tagName: 'title',
                    innerHTML: this.title()
                });
                if (this.csp()) {
                    htmlPluginData.head.push({
                        closeTag: false,
                        tagName: 'meta',
                        attributes: { 'http-equiv': 'Content-Security-Policy', 'content': this.csp() }
                    });
                }
                const preload = chunks.reduce((links, { name, files }) => {
                    if (name && (name.match(/app$/) || name.match(/branding$/))) {
                        return links.concat(files.map(href => ({
                            tagName: 'link',
                            closeTag: false,
                            attributes: {
                                rel: 'preload',
                                href,
                                as: path.extname(href) === '.css' ? 'style' : 'script'
                            }
                        })));
                    }
                    return links;
                }, []);
                htmlPluginData.head.push(...preload);
                const bodyOptions = this.isLegacy() || this.isUpgrade() ? this.indexDataLegacy() : this.indexData();
                // tslint:disable-next-line:max-line-length
                htmlPluginData.body = [
                    this.isLegacy() || this.isUpgrade() ? this.rootElementLegacy() : this.rootElement(),
                    {
                        closeTag: true,
                        tagName: 'script',
                        attributes: {
                            type: 'data',
                            id: 'static-options'
                        },
                        innerHTML: JSON.stringify(bodyOptions)
                    }
                ].concat(htmlPluginData.body);
                callback(null, htmlPluginData);
            });
        }
    }
    isUpgrade() {
        return this.app.upgrade;
    }
    isLegacy() {
        return this.options.isLegacy;
    }
    rootElement() {
        return {
            closeTag: true,
            tagName: 'c8y-bootstrap'
        };
    }
    rootElementLegacy() {
        return {
            closeTag: true,
            tagName: 'c8y-ui-root',
            attributes: {
                class: 'ng-cloak',
                id: 'app'
            }
        };
    }
    indexDataLegacy() {
        return Object.assign({
            modules: [],
            languages: this.languages(),
            core_path: 'assets/',
            data_path: 'c8ydata'
        }, this.app);
    }
    indexData() {
        return Object.assign({}, this.app, { languages: this.languages(this.app.languages) });
    }
    languagesKeys() {
        return Object.keys(this.groupedPos || {}).sort();
    }
    languages(appLanguages = {}) {
        const languages = this.languagesKeys().reduce((out, lang) => {
            const slicedLang = lang.slice(0, 2);
            const data = Object.assign({}, (locales_1.LOCALES[lang] || locales_1.LOCALES[slicedLang]), { url: `./${lang}.json` });
            if (data) {
                return Object.assign(out, { [lang]: data });
            }
            return out;
        }, {});
        Object.keys(appLanguages).forEach(key => {
            if (appLanguages[key]) {
                languages[key] = appLanguages[key];
            }
            else {
                delete languages[key];
            }
        });
        return languages;
    }
    title() {
        return this.humanize(this.app.name === 'devicemanagement' ? 'Device management' : this.app.name);
    }
    humanize(str = '') {
        str = str
            .replace(/\./g, ' ')
            .replace(/c8y[\s,_]*/gi, '')
            .replace(/([A-Z][a-z])/g, ' $1')
            .replace(/^\$\.?/, '')
            .replace(/^\s*/, '')
            .replace(/\s*$/, '')
            .replace(/\s+/g, ' ');
        return _.capitalize(str);
    }
    csp() {
        return this.app.contentSecurityPolicy;
    }
    createManifest(compilation) {
        const { assets } = compilation;
        const FILE = 'cumulocity.json';
        if (this.app && !assets[FILE]) {
            assets[FILE] = new webpack_sources_1.RawSource(JSON.stringify(this.app, null, 2));
        }
    }
    createTranslationAssets(compilation) {
        const { assets } = compilation;
        this.localeCompiler.compile().forEach(({ language, json }) => {
            assets[`${language}.json`] = new webpack_sources_1.RawSource(json);
        });
    }
    loadPo(content) {
        this.localeCompiler.loadPo(content);
        return '';
    }
    async copyDefinitionToImports(copy, context) {
        let importStatements = [];
        let cwd = context;
        if (typeof copy === 'string') {
            copy = { files: [copy] };
        }
        if (!copy.webpackIgnore) {
            cwd = this.copyProcessCwd(copy.cwd, context);
            const files = await fg(copy.files, { cwd, absolute: true });
            importStatements = _.flatMap(files, (file) => {
                let nameOut = path.relative(cwd, file);
                if (copy.output) {
                    nameOut = path.join(copy.output, nameOut);
                }
                const targetFilePath = `./${path.relative(context, file)}`;
                return [
                    `!file-loader?name=${nameOut}!${targetFilePath}`,
                    `!file-loader?name=${path.join(path.basename(context), nameOut)}!${targetFilePath}`
                ].map(this.makeWindowsPathSeparatorHappy);
            });
        }
        return importStatements;
    }
    copyProcessCwd(cwd, context) {
        let cwdOut = context;
        if (cwd) {
            if (path.isAbsolute(cwd)) {
                cwdOut = cwd;
            }
            else if (/node_modules/.test(cwd)) {
                cwdOut = path.resolve(process.cwd(), cwd);
            }
            else {
                cwdOut = path.resolve(context, cwd);
            }
        }
        return cwdOut;
    }
    transformAppManifest(_manifest) {
        const manifest = _.cloneDeep(_manifest);
        const target = this.target;
        if (target) {
            const targetApp = _.find(target.applications, { contextPath: this.app.contextPath }) || {};
            const addImports = _.union(target.addImports, targetApp.addImports);
            const removeImports = _.union(target.removeImports, targetApp.removeImports);
            const replaceImports = _.assign(target.replaceImports, targetApp.replaceImports);
            const _imports = _.reject(_.union(manifest.imports, addImports), (i) => _.includes(removeImports, i));
            manifest.imports = _.uniq(_.map(_imports, (i) => replaceImports[i] || i));
        }
        if (manifest.imports) {
            manifest.imports = manifest.imports.map(this.transformLegacyPluginPath);
        }
        return manifest;
    }
    transformLegacyPluginPath(request) {
        return `${exports.LEGACY_MANIFEST}${request}`;
    }
    isBrandingContext(context) {
        return (/(branding|@c8y\/style)$/i).test(context);
    }
    isC8yBranding(context) {
        return path.basename(context) === 'c8yBranding' || /@c8y\/style$/.test(context);
    }
    indexContent() {
        return index_content_1.default;
    }
    async findModuleFiles(cwd, extraPatterns) {
        let patterns = [
            '{**/,}*.html',
            'locales/*.po',
            '(devicecommands|properties|devicetypes|trackers)/*.json',
        ];
        if (extraPatterns) {
            patterns = patterns.concat(extraPatterns);
        }
        return fg.async(patterns, { cwd });
    }
    applyOtherPlugins(compiler) {
        return [
            new HtmlWebpackPlugin(this.getHtmlWebpackConfig())
        ]
            .concat(this.replacements())
            .forEach((p) => p.apply(compiler));
    }
    getHtmlWebpackConfig() {
        const config = {
            minify: this.options.mode === 'production'
        };
        if (this.options.indexTemplate) {
            config.template = this.options.indexTemplate;
        }
        else {
            config.templateContent = index_content_1.default;
        }
        return config;
    }
    replacements() {
        const cwd = process.cwd();
        // mayb we can remove this
        const filePath = (paths) => {
            let _path = path.resolve(cwd, 'node_modules', ...paths);
            // not very happy about this
            try {
                fs_1.statSync(_path);
            }
            catch (e) {
                _path = path.resolve(cwd, 'node_modules', '@c8y', 'ng1-modules', 'node_modules', ...paths);
            }
            return _path;
        };
        return [
            { pattern: /^(angular$|angular\/)/, paths: ['angular', 'index.js'] },
            { pattern: /^objectpath$/, paths: ['objectpath', 'lib', 'ObjectPath.js'] },
            { pattern: /(^tv4\/?|tv4\/)/, paths: ['tv4', 'tv4.js'] },
            { pattern: /^leaflet$/, paths: ['leaflet', 'dist', 'leaflet-src.js'] },
        ].map(({ pattern, paths }) => new webpack.NormalModuleReplacementPlugin(pattern, filePath(paths)));
    }
    filterIfUpgrade(manifest) {
        const { ignoreIfUpgrade } = manifest;
        return (f) => ((ignoreIfUpgrade && this.isUpgrade()) ? ignoreIfUpgrade.indexOf(f) === -1 : true);
    }
    getBrandingEntry(branding) {
        if (!branding && this.isLegacy()) {
            const { imports = [] } = this.transformAppManifest(this.app);
            branding = imports.find((i) => (/branding/i).test(i));
        }
        return branding;
    }
    makeWindowsPathSeparatorHappy(str) {
        return str.replace(/\\/g, '/');
    }
}
exports.CumulocityPlugin = CumulocityPlugin;
//# sourceMappingURL=plugin.js.map