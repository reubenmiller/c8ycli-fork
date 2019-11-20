"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const _1 = require("./");
const express = require("express");
const logUpdate = require("log-update");
const proxyServer = require("http-proxy-middleware");
const fs = require("fs");
const https = require("https");
/**
 * Provides a Development Server.
 */
class DevServer {
    /**
     * Creates a new Webpack-Dev-Server configuration.
     *
     * @param proxy Specify the proxy to use.
     * @param port Specify another port to use
     */
    constructor(proxy = _1.BUILD_DEFAULTS.DEFAULT_PROXY, port = _1.BUILD_DEFAULTS.DEFAULT_PORT, ssl = false, localDomain = 'localhost') {
        this.port = port;
        this.ssl = ssl;
        this.localDomain = localDomain;
        this.config = {
            contentBase: path.resolve('dist'),
            proxy: {
                target: _1.BUILD_DEFAULTS.DEFAULT_PROXY,
                changeOrigin: true,
                ws: true,
                secure: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
                logLevel: 'error',
                cookieDomainRewrite: this.localDomain,
                onProxyRes: (proxyResponse) => {
                    if (!this.ssl && proxyResponse.headers['set-cookie']) {
                        const cookies = proxyResponse.headers['set-cookie'].map(cookie => cookie.replace(/;\s{0,}secure/gi, ''));
                        proxyResponse.headers['set-cookie'] = cookies;
                    }
                }
            },
            publicPath: `http${this.ssl ? 's' : ''}://${this.localDomain}:${this.port}/${_1.BUILD_DEFAULTS.DEFAULT_PUBLIC_PATH}/`
        };
        this.expressApp = express();
        this.middleware = {};
        this.log = logUpdate.create(process.stdout);
        this.config.proxy.target = proxy;
    }
    /**
     * Starts a C8Y development server
     *
     * @param apps An array of applications.
     */
    startDevServer(apps) {
        console.log(`Proxying requests to remote instance ${this.config.proxy.target}`);
        this.apps = apps;
        this.appsMap = {};
        apps.forEach((app) => {
            this.appsMap[app.contextPath] = app;
            app.events.on('build.progress', () => this.logStatus());
            app.events.on('build.done', (doneMsg) => {
                setTimeout(() => {
                    this.log.done();
                    this.logStatus();
                });
            });
        });
        if (this.apps.length === 1) {
            this.addMiddleware(this.apps[0]);
        }
        this.expressApp.use(`/${_1.BUILD_DEFAULTS.DEFAULT_PUBLIC_PATH}/:contextPath`, this.serveWebpackBuild.bind(this));
        this.expressApp.use(/^((?!\/apps\/|__webpack_hmr|favicon.ico).)*$/i, proxyServer(this.config.proxy));
        this.expressApp.get(RegExp(`${_1.BUILD_DEFAULTS.DEFAULT_PUBLIC_PATH}\/[^\/]*$`, 'g'), this.redirectRootRequest);
        if (this.ssl) {
            let certPath = './tools/certs/localhost';
            if (typeof this.ssl === 'string') {
                certPath = this.ssl;
            }
            const options = {
                key: fs.readFileSync(`${certPath}.key`),
                cert: fs.readFileSync(`${certPath}.cert`),
                requestCert: false,
                rejectUnauthorized: false
            };
            const server = https.createServer(options, this.expressApp);
            server.listen(this.port);
        }
        else {
            this.expressApp.listen(this.port);
        }
        this.logStatus();
    }
    /**
     * Serve the Webpack build only on navigation.
     */
    serveWebpackBuild(req, res, next) {
        const application = this.appsMap[req.params.contextPath];
        if (application) {
            this.addMiddleware(application);
            next();
            return;
        }
        res.sendStatus(404);
    }
    /**
     * redirect every request which comes
     * -> from :9090/apps/appName  <- without slash!
     * -> to :9090/apps/appName/index.html <- with slash and index.html!
     */
    redirectRootRequest(req, res, next) {
        res.redirect(`${req.url}/index.html`);
    }
    /**
     * Adds the WebpackDevMiddleware to this route.
     *
     * @param app The application to add the dev middleware
     */
    addMiddleware(app) {
        const { middleware, expressApp, extraWebpackEnv } = this;
        const { contextPath } = app;
        if (!middleware[contextPath]) {
            const publicPath = `/${_1.BUILD_DEFAULTS.DEFAULT_PUBLIC_PATH}/${contextPath}/`;
            const appMiddleware = app.createDevelopmentMiddleware(expressApp, extraWebpackEnv);
            expressApp.use(publicPath, appMiddleware);
            middleware[contextPath] = appMiddleware;
        }
    }
    /**
     * Logs the build status.
     */
    logStatus() {
        const { apps } = this;
        const msg = apps
            .map((app) => app.getLogMsg(this.config.publicPath))
            .join('\n');
        this.log(`\n${msg}\n`);
    }
}
exports.DevServer = DevServer;
//# sourceMappingURL=DevServer.js.map