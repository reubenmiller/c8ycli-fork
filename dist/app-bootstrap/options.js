var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import cssVars from 'css-vars-ponyfill';
var CACHE_KEY = 'OPTIONS';
var staticOptionsCache;
var urlOptionsCache;
export function loadOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var urlOptions, staticOptions, dynamicOptions, languages, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    urlOptions = loadUrlOptions();
                    staticOptions = loadStaticOptions();
                    return [4 /*yield*/, loadDynamicOptions()];
                case 1:
                    dynamicOptions = _a.sent();
                    languages = __assign({}, (staticOptions.languages || {}), (dynamicOptions.languages || {}), (urlOptions.languages || {}));
                    options = __assign({ versions: {
                            ng1: __VERSION_NG1__,
                            ngx: __VERSION_NGX__
                        } }, staticOptions, dynamicOptions, urlOptions, { languages: languages });
                    options.C8Y_INSTANCE_OPTIONS = __assign({}, options); // for compatability with c8yBase.getOptions in ng1-modules
                    return [2 /*return*/, options];
            }
        });
    });
}
function loadStaticOptions() {
    if (!staticOptionsCache) {
        staticOptionsCache = JSON.parse(document.querySelector('#static-options').innerText) || {};
    }
    return __assign({}, staticOptionsCache, loadUrlOptions());
}
export function loginOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var hostName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    hostName = location.origin;
                    return [4 /*yield*/, requestRemoteOptions(hostName + '/tenant/loginOptions')];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function loadUrlOptions() {
    if (!urlOptionsCache) {
        var query = location.search.substr(1).split('&');
        urlOptionsCache = query.reduce(function (options, keyValuePair) {
            if (keyValuePair) {
                if (keyValuePair.match(/=/)) {
                    var _a = keyValuePair.split(/=/), key = _a[0], value = _a[1];
                    options[key] = value;
                }
                else {
                    options[keyValuePair] = true;
                }
            }
            return options;
        }, {});
    }
    return urlOptionsCache;
}
function loadDynamicOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var cachedRemoteOptions, dynamicOptionsUrl, remoteOptions, request, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    cachedRemoteOptions = window.localStorage.getItem(CACHE_KEY);
                    dynamicOptionsUrl = loadStaticOptions().dynamicOptionsUrl;
                    remoteOptions = {};
                    if (!dynamicOptionsUrl) return [3 /*break*/, 4];
                    dynamicOptionsUrl = dynamicOptionsUrl.match(/\?/) ?
                        dynamicOptionsUrl : dynamicOptionsUrl + "?nocache=" + String(Math.random()).substr(2);
                    request = requestRemoteOptions(dynamicOptionsUrl);
                    request.then(cacheRemoteOptions);
                    if (!cachedRemoteOptions) return [3 /*break*/, 1];
                    _a = JSON.parse(cachedRemoteOptions);
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, request];
                case 2:
                    _a = _b.sent();
                    _b.label = 3;
                case 3:
                    remoteOptions = _a;
                    _b.label = 4;
                case 4: return [2 /*return*/, remoteOptions];
            }
        });
    });
}
function requestRemoteOptions(url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var request = new XMLHttpRequest();
                    var options = {};
                    var onload = function () {
                        if (request.status >= 200 && request.status < 400) {
                            try {
                                options = JSON.parse(request.responseText);
                            }
                            catch (e) {
                                // do nothing
                            }
                            Object.keys(options).forEach(function (key) {
                                var value = options[key];
                                if (typeof value === 'string') {
                                    try {
                                        var parsed = JSON.parse(value);
                                        if (typeof parsed === 'object') {
                                            options[key] = parsed;
                                        }
                                    }
                                    catch (e) {
                                        // do nothing
                                    }
                                }
                            });
                        }
                        resolve(options);
                    };
                    request.open('GET', url, true);
                    request.setRequestHeader('UseXBasic', 'true');
                    request.onload = onload;
                    request.onerror = function (e) { return reject(e); };
                    request.send();
                })];
        });
    });
}
function cacheRemoteOptions(options) {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(options));
}
export function applyOptions(options) {
    var _a = options.c8yAppVarName, c8yAppVarName = _a === void 0 ? 'C8Y_APP' : _a;
    options = window.C8Y_APP = window[c8yAppVarName] = __assign({ modules: [] }, options);
    setVersion(options);
    updateTitle(options, document);
    updateFavicon(options, document);
    updateBrandingUrl(options, document);
    updateCss(options, document);
    updateTranslations(options);
    return options;
}
export function setVersion(options) {
    var _a = options.c8yVersionName, c8yVersionName = _a === void 0 ? 'UI_VERSION' : _a;
    window[c8yVersionName] = options.versions.ng1 || options.versions.ngx;
}
export function updateTitle(_a, document) {
    var globalTitle = _a.globalTitle;
    if (!globalTitle) {
        return;
    }
    var titleEl = document.querySelector('title');
    titleEl.innerText = globalTitle + " - " + titleEl.innerText;
}
export function updateFavicon(_a, document) {
    var _b = _a.faviconUrl, faviconUrl = _b === void 0 ? 'favicon.ico' : _b;
    var link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    link.setAttribute('href', faviconUrl);
    document.querySelector('head').appendChild(link);
}
export function updateBrandingUrl(_a, document) {
    var brandingUrl = _a.brandingUrl;
    if (!brandingUrl) {
        if (__ENTRY_BRANDING__) {
            import(/* webpackChunkName: "branding" */ __ENTRY_BRANDING__);
        }
        else {
            throw new Error('Branding definition missing.');
        }
    }
    else {
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', brandingUrl);
        document.querySelector('head').appendChild(link);
    }
    setTimeout(cssVars); // for ie11. needs to run after the style elemensts have been included
}
export function updateCss(_a, document) {
    var brandingCssVars = _a.brandingCssVars, extraCssUrls = _a.extraCssUrls;
    if (Array.isArray(extraCssUrls)) {
        extraCssUrls.forEach(function (url) {
            var link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', url);
            document.querySelector('head').appendChild(link);
        });
    }
    if (brandingCssVars) {
        var vars = Object.keys(brandingCssVars).map(function (key) { return "--" + key + ": " + brandingCssVars[key] + ";"; });
        var style = document.createElement('style');
        style.appendChild(document.createTextNode(":root{\n" + vars.join('\n') + "\n}"));
        document.querySelector('head').appendChild(style);
    }
}
export function updateTranslations(options) {
    if (options.i18nExtra) {
        options.langsDetails = __assign({}, options.langsDetails, options.i18nExtra);
    }
}
//# sourceMappingURL=options.js.map