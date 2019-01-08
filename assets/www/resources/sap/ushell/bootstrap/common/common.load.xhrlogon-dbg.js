sap.ui.define([
], function () {
    var module = {};
    var exports = {};

// --- DO NOT EDIT THE CODE BELOW!
/*!
 * SAP XHR Library v1.3.0
 * (c) Copyright 2013-2017 SAP SE or an SAP affiliate company.
*/
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xhrlib = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var EventHandlers = require("./EventHandlers.js");
var events = require("./events.js");
var FrameProxy = require("./FrameProxy.js");
//var xhrLogger = require("./Log.js").logger;

/**
 * @classdesc Frame provider working with an auxiliary window to support IdP blocking framing
 * @param {FrameProxy} [proxyClass] FrameProxy class to use, default to FrameProxy
 * @constructor
 */
function AuxWindowFrameProvider(proxyClass) {
    this.handlers = new EventHandlers(["windowfailed"]);
    this.FrameProxyClass = proxyClass || FrameProxy;
}
module.exports = AuxWindowFrameProvider;

AuxWindowFrameProvider.prototype.create = function () {
    this.frameProxy = new this.FrameProxyClass(this);
    return this.frameProxy;
};
AuxWindowFrameProvider.prototype.destroy = function () {
    if (this.frameProxy) {
        this.frameProxy.close();
        this.frameProxy = undefined;
    }
};
AuxWindowFrameProvider.prototype.show = function () {
};
AuxWindowFrameProvider.prototype.addEventListener = function (type, callback) {
    this.handlers.add(type, callback);
};
AuxWindowFrameProvider.prototype.removeEventListener = function (type, callback) {
    this.handlers.remove(type, callback);
};
AuxWindowFrameProvider.prototype.dispatchWindowFailedEvent = function () {
    var self = this, event = events.createEvent("windowfailed");
    setTimeout(function () {
        self.handlers.dispatch(event);
    }, 0);
};

},{"./EventHandlers.js":5,"./FrameProxy.js":7,"./events.js":14}],2:[function(require,module,exports){
"use strict";
var ChannelPrototype;

/**
 * @classdesc Request pipeline enhancement
 * @desc Request channel
 * @param {XMLHttpRequest} xhr Parent request
 * @param {string} method HTTP method
 * @param {string} url Request URL
 * @param {boolean} async Asynchronous flag
 * @param {string} username
 * @param {string} password
 * @properties {object[]} filters Registered channel filters
 * @constructor
 */
function Channel(xhr, method, url, async, username, password) {
    this.filters = [];
    this.xhr = xhr;
    this.method = method;
    this.url = url;
    this.async = !!async;
    if (username !== undefined) {
        this.username = username;
    }
    if (password !== undefined) {
        this.password = password;
    }
}
module.exports = Channel;
ChannelPrototype = Channel.prototype;
ChannelPrototype._process = function (method) {
    var filters, filter, i, n;
    filters = this.filters;
    n = filters.length;
    for (i = 0; i < n; ++i) {
        filter = filters[i];
        if (typeof filter[method] === "function") {
            filter[method](this);
        }
    }
};
ChannelPrototype.aborting = function () {
    this._process("aborting");
};
ChannelPrototype.aborted = function () {
    this._process("aborted");
};
ChannelPrototype.opening = function () {
    this._process("opening");
};
ChannelPrototype.opened = function () {
    this._process("opened");
};
ChannelPrototype.sending = function () {
    this._process("sending");
};
ChannelPrototype.sent = function () {
    this._process("sent");
};
ChannelPrototype.reopening = function () {
    this._process("reopening");
};
ChannelPrototype["catch"] = function (error) {
    var filters, i, n;
    filters = this.filters;
    n = filters.length;
    for (i = 0; i < n; ++i) {
        if (typeof filters[i]["catch"] === "function") {
            try {
                filters[i]["catch"](error, this);
                error = null;
                break;
            }
            catch (err) {
                error = err;
            }
        }
    }
    if (error) {
        throw error;
    }
};
},{}],3:[function(require,module,exports){
"use strict";
var ChannelFactoryPrototype;
var Channel = require("./Channel.js");
var IgnoreList = require("./IgnoreList.js");

/**
 * @classdesc ChannelFactory creates the channel enhancing an XMLHttpRequest
 * @desc ChannelFactory Built-in channel factory
 * @constructor
 */
function ChannelFactory() {
    this._filterFactories = [];
    this.ignore = new IgnoreList();
}
module.exports = ChannelFactory;
ChannelFactoryPrototype = ChannelFactory.prototype;

function isFactory(x) {
    var t;
    t = typeof x;
    return (t === "function") || ((t === "object") && (x !== null) && (typeof x.addFilter === "function"));
}
function invokeFactory(x, channel) {
    if (typeof x === "function") {
        x(channel);
    }
    else {
        x.addFilter(channel);
    }
}
ChannelFactoryPrototype.reset = function () {
    this._filterFactories = [];
    this.ignore = new IgnoreList();
};
ChannelFactoryPrototype.addFilterFactory = function (factory) {
    var add, factories, i, n;
    if (!isFactory(factory)) {
        throw new TypeError("addFilterFactory expects a FilterFactory or a function parameter");
    }
    factories = this._filterFactories;
    add = true;
    n = factories.length;
    for (i = 0; i < n; ++i) {
        if (factories[i] === factory) {
            add = false;
            break;
        }
    }
    if (add) {
        this._filterFactories.push(factory);
    }
};
ChannelFactoryPrototype.removeFilterFactory = function (factory) {
    var factories, i, n;
    factories = this._filterFactories;
    n = factories.length;
    for (i = 0; i < n; ++i) {
        if (factories[i] === factory) {
            factories.splice(i, 1);
            break;
        }
    }
};
ChannelFactoryPrototype.getFilterFactories = function () {
    return this._filterFactories.slice();
};

/**
 * Creates the channel for a given HTTP request
 * @param xhr
 * @param method
 * @param url
 * @param async
 * @param username
 * @param password
 * @returns {Channel}
 */
ChannelFactoryPrototype.create = function (xhr, method, url, async, username, password) {
    var channel, factories, i, n;
    channel = new Channel(xhr, method, url, async, username, password);
    if (!this.ignore.ignored(url)) {
        factories = this._filterFactories;
        n = factories.length;
        for (i = 0; i < n; ++i) {
            invokeFactory(factories[i], channel);
        }
    }
    return channel;
};
},{"./Channel.js":2,"./IgnoreList.js":8}],4:[function(require,module,exports){
"use strict";
var events = require("./events.js");
var EventHandlers = require("./EventHandlers.js");
var DefaultLogonFrameProviderPrototype;
var AUTH_REQUIRED = "authenticationrequired";

/**
 * @classdesc Default implementation for creating, showing, and destroying a logon iframe.
 * @desc DefaultLogonFrameProvider
 * @constructor
 */
function DefaultLogonFrameProvider() {
    this.frameCounter = 0;
    this.handlers = new EventHandlers([AUTH_REQUIRED]);
}
module.exports = DefaultLogonFrameProvider;
DefaultLogonFrameProviderPrototype = DefaultLogonFrameProvider.prototype;

DefaultLogonFrameProviderPrototype.addEventListener = function (type, callback) {
    this.handlers.add(type, callback);
};
DefaultLogonFrameProviderPrototype.removeEventListener = function (type, callback) {
    this.handlers.remove(type, callback);
};
DefaultLogonFrameProviderPrototype.dispatchAuthenticationRequired = function () {
    var self = this, event = events.createEvent(AUTH_REQUIRED);
    setTimeout(function () {
        self.handlers.dispatch(event);
    }, 0);
};
DefaultLogonFrameProviderPrototype.create = function () {
    var frameId, onReadyStateChanged, self = this;
    this.destroy();
    // don't create frame if simple reload mode is used
    if (this.handlers.hasSubscribers(AUTH_REQUIRED)) {
        this.dispatchAuthenticationRequired();
        return null;
    }
    this.frameCounter += 1;
    frameId = "xhrLogonFrame" + this.frameCounter;
    this.frame = document.createElement("iframe");
    this.frame.id = frameId;
    this.frame.style.display = "none";
    if (document.readyState === "complete") {
        document.body.appendChild(this.frame);
    }
    else {
        // wait until document has been loaded
        onReadyStateChanged = function () {
            if (document.readyState === "complete") {
                document.body.appendChild(self.frame);
                events.removeEventListener(document, "readystatechange", onReadyStateChanged);
            }
        };
        events.addEventListener(document, "readystatechange", onReadyStateChanged);
    }
    return this.frame;
};
DefaultLogonFrameProviderPrototype.destroy = function () {
    if (this.frame) {
        document.body.removeChild(this.frame);
        this.frame = null;
    }
};
DefaultLogonFrameProviderPrototype.show = function (forceDisplay) {
    var frame = this.frame;
    if (!forceDisplay && this.handlers.hasSubscribers(AUTH_REQUIRED)) {
        this.dispatchAuthenticationRequired();
    }
    else if (frame) {
        frame.style.display = "block";
        frame.style.position = "absolute";
        frame.style.top = 0;
        frame.style.left = 0;
        frame.style.width = "100%";
        frame.style.height = "100%";
        frame.style.zIndex = 99999;
        frame.style.border = 0;
        frame.style.background = "white"; // Note: else it is transparent!
    }
};
},{"./EventHandlers.js":5,"./events.js":14}],5:[function(require,module,exports){
"use strict";
var EventHandlersPrototype;
var xhrLogger = require("./Log.js").logger;
function EventHandlers(events) {
    var i, n;
    n = events.length;
    for (i = 0; i < n; ++i) {
        this[events[i]] = [];
    }
    this.subscriptions = {};
    this.bufferedEvents = [];
}
module.exports = EventHandlers;

function isHandler(x) {
    var t;
    t = typeof x;
    return (t === "function") || ((t === "object") && (x !== null) && (typeof x.handleEvent === "function"));
}
function fireEvent(x, e, logger) {
    try {
        if (typeof x === "function") {
            // DOM4: if listener's callback is a Function object, its callback this value is the event's currentTarget attribute value.
            x.call(e.currentTarget, e);
        }
        else {
            x.handleEvent(e);
        }
    }
    catch (error) {
        if (logger) {
            logger.warning("Exception in " + e.type + " event handler: " + error.message);
        }
        throw error;
    }
}
EventHandlersPrototype = EventHandlers.prototype;
EventHandlersPrototype.add = function (type, callback) {
    var add, h, i, n;
    if (isHandler(callback)) {
        h = this[type];
        if (h) {
            add = true;
            n = h.length;
            for (i = 0; i < n; ++i) {
                if (h[i] === callback) {
                    add = false;
                    break;
                }
            }
            if (add) {
                h.push(callback);
            }
        }
    }
};
EventHandlersPrototype.remove = function (type, callback) {
    var h, i, n;
    if (isHandler(callback)) {
        h = this[type];
        if (h) {
            n = h.length;
            for (i = 0; i < n; ++i) {
                if (h[i] === callback) {
                    if (n === 1) {
                        this[type] = [];
                    }
                    else {
                        h.splice(i, 1);
                    }
                    break;
                }
            }
        }
    }
};
EventHandlersPrototype.dispatch = function (event) {
    var h, on, type, i, n;
    if (this.suspend) {
        this.bufferedEvents.push(event);
    }
    else {
        type = event.type;
        h = this[type];
        if (h) {
            h = h.slice(); // Copy handlers in case an event handler would mess with the subscriptions
            n = h.length;
            for (i = 0; i < n; ++i) {
                fireEvent(h[i], event, xhrLogger);
            }
        }
        on = this["on" + type];
        if (on) {
            try {
                // DOM4: if listener's callback is a Function object, its callback this value is the event's currentTarget attribute value.
                on.call(event.currentTarget, event);
            }
            catch (error) {
                xhrLogger.warning("Exception in on" + type + " callback: " + error.message);
                throw error;
            }
        }
    }
};
EventHandlersPrototype.clearEvents = function () {
    this.bufferedEvents = [];
};
EventHandlersPrototype.releaseEvents = function () {
    var k, n, events;
    events = this.bufferedEvents;
    n = events.length;
    if (n > 0) {
        this.clearEvents();
        for (k = 0; k < n; ++k) {
            this.dispatch(events[k]);
        }
    }
};
EventHandlersPrototype.hasSubscribers = function (type) {
    var h, res;
    h = this[type];
    if (h) {
        res = (h.length > 0) || this["on" + type];
    }
    else {
        res = false;
    }
    return res;
};
EventHandlersPrototype.subscribed = function (type) {
    return (this.subscriptions[type] ? true : false);
};
EventHandlersPrototype.subscribe = function (type) {
    this.subscriptions[type] = true;
};
EventHandlersPrototype.unsubscribe = function (type) {
    delete this.subscriptions[type];
};
},{"./Log.js":9}],6:[function(require,module,exports){
// Frame logon management
"use strict";

var DefaultLogonFrameProvider = require("./DefaultLogonFrameProvider.js");
var LogonManager = require("./LogonManager.js");
var URL = require("./URL.js");
var frameLogonManager, FrameLogonManagerPrototype;

/*
 * For a sorted set a, returns the largest element smaller or equal to x or -1 if such an element does not exist
 */
function lowerBound(x, a) {
    var i, v, s = 0, e = a.length - 1;
    if (e < 0 || x < a[0]) {
        return -1;
    }
    if (x >= a[e]) {
        return e;
    }
    while (s < e) {
        i = (s + e + 1) >> 1; // integer division by 2, s < i <= e
        v = a[i];
        if (x === v) {
            return i;
        }
        if (x < v) {
            e = i - 1;
        }
        else {
            s = i;
        }
    }
    return s;
}

/**
 * @classdesc Simple frame logon management
 * @desc FrameLogonManager
 * @param {LogonManager} logonManager
 * @constructor
 * @property logonFrameProvider Registered frame provider
 */
function FrameLogonManager(logonManager) {
    this.logonManager = logonManager;
    this._lfp = new DefaultLogonFrameProvider();
    this._timeout = {};
    this._idxTimeout = [];
    this.defaultTimeout = 600;
    logonManager.addEventListener("xhrlogon", this);
    logonManager.addEventListener("xhrlogoncomplete", this);
    logonManager.addEventListener("xhrlogonfailed", this);
}
module.exports = FrameLogonManager;
FrameLogonManager.getInstance = function () {
    return frameLogonManager;
};
FrameLogonManager.startup = function () {
    if (!frameLogonManager) {
        frameLogonManager = new FrameLogonManager(LogonManager.startup());
    }
    return frameLogonManager;
};
FrameLogonManager.shutdown = function () {
    if (frameLogonManager) {
        frameLogonManager.shutdown();
        frameLogonManager = null;
    }
};

FrameLogonManagerPrototype = FrameLogonManager.prototype;
Object.defineProperties(FrameLogonManagerPrototype, {
    logonFrameProvider: {
        get: function () {
            return this._lfp;
        },
        set: function (lfp) {
            if (lfp) {
                this._lfp = lfp;
            }
            else {
                // Setting null or undefined will reset to the default LogonFrameProvider
                this._lfp = new DefaultLogonFrameProvider();
            }
        }
    }
});
FrameLogonManager.prototype._indexTimeouts = function () {
    var k, index = [], timeout = this._timeout;
    for (k in timeout) {
        if (timeout.hasOwnProperty(k)) {
            index.push(k);
        }
    }
    this._idxTimeout = index.sort();
};
FrameLogonManager.prototype.getTimeout = function (path) {
    var p, i = lowerBound(path, this._idxTimeout);
    if (i >= 0) {
        p = this._idxTimeout[i];
        if (path.substring(0, p.length) === p) {
            return this._timeout[p];
        }
    }
    return this.defaultTimeout;
};
FrameLogonManager.prototype.setTimeout = function (path, value) {
    if (!path) {
        return;
    }
    if (value) {
        this._timeout[path] = value;
    }
    else {
        delete this._timeout[path];
    }
    this._indexTimeouts();
};
FrameLogonManagerPrototype.shutdown = function () {
    var logonManager;
    logonManager = this.logonManager;
    if (logonManager) {
        logonManager.removeEventListener("xhrlogon", this);
        logonManager.removeEventListener("xhrlogoncomplete", this);
        logonManager.removeEventListener("xhrlogonfailed", this);
    }
};
FrameLogonManagerPrototype.getFrameLoadHandler = function (provider, frameId, timeout) {
    var loadHandler, cancelId;
    timeout = timeout || this.defaultTimeout;
    loadHandler = function () {
        if (cancelId) {
            // Frame has loaded a new page, reset previous timer
            clearTimeout(cancelId);
        }
        cancelId = setTimeout(function () {
            provider.show();
        }, timeout);
    };
    return loadHandler;
};
FrameLogonManagerPrototype.onXHRLogon = function (request) {
    var url, provider, frame, timeout;
    this.cancelXHRLogon();
    timeout = this.getTimeout(request.channel.url);
    url = new URL(request.channel.url);
    url.setParameter("xhr-logon", "iframe");
    provider = this.logonFrameProvider;
    frame = provider.create();
    if (frame) {
        if (!frame.onload) {
            frame.onload = this.getFrameLoadHandler(provider, frame.id, timeout);
        }
        frame.xhrTimeout = timeout;
        frame.src = url.href;
    }
    this.pending = provider;
};
FrameLogonManagerPrototype.onXHRLogonComplete = function () {
    if (this.pending) {
        this.pending.destroy();
        this.pending = undefined;
    }
};
FrameLogonManagerPrototype.cancelXHRLogon = function () {
    if (this.pending) {
        LogonManager.getInstance().abortXHRLogon();
        this.onXHRLogonComplete();
    }
};
FrameLogonManagerPrototype.handleEvent = function (event) {
    var request;
    switch (event.type) {
        case "xhrlogon":
            request = event.request;
            if (request) {
                this.onXHRLogon(request);
            }
            break;
        case "xhrlogoncomplete":
            this.onXHRLogonComplete();
            break;
        case "xhrlogonfailed":
            this.onXHRLogonComplete();
            break;
    }
};

},{"./DefaultLogonFrameProvider.js":4,"./LogonManager.js":10,"./URL.js":11}],7:[function(require,module,exports){
"use strict";
var events = require("./events.js");
var FrameLogonManager = require("./FrameLogonManager.js");
var xhrLogger = require("./Log.js").logger;
var FrameProxyPrototype;

/**
 * @classdesc FrameProxy
 * @desc FrameProxy
 * @param provider
 * @constructor
 */
function FrameProxy(provider) {
    this.provider = provider;
    this.xhrTimeout = 600;
}
module.exports = FrameProxy;
FrameProxyPrototype = FrameProxy.prototype;
FrameProxy.frameCounter = 0;

var htmlContainer = "<div>Authentication required</div><div><a id=\"POPUP_LOGIN_LINK\" target=\"_blank\" href=\"javascript:void(0)\">Proceed to sign in</a></div>";

Object.defineProperty(FrameProxyPrototype, "src", {
    get: function () {
        return this.url;
    },
    set: function (url) {
        this.initialize(url);
    }
});
function waitForFrame(self, timeout) {
    return setTimeout(function () {
        if (!self.window) {
            self.createWindow();
        }
    }, timeout);
}
FrameProxyPrototype.initialize = function (url) {
    var cancelId, self = this;
    this.close();
    this.closed = false;
    this.url = url;
    this.createPollingFrame();
    cancelId = waitForFrame(self, self.xhrTimeout);
    events.addEventListener(this.frame, "load", function () {
        if (cancelId) {
            // Frame has loaded a new page, reset previous timer
            clearTimeout(cancelId);
        }
        cancelId = waitForFrame(self, self.xhrTimeout);
    });
};
FrameProxyPrototype.closeFrame = function () {
    if (this.frame) {
        document.body.removeChild(this.frame);
        this.frame = undefined;
    }
};
FrameProxyPrototype.close = function () {
    try {
        this.closed = true;
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
            this.pollIntervalId = undefined;
        }
        if (this.windowIntervalId) {
            clearInterval(this.windowIntervalId);
            this.windowIntervalId = undefined;
        }
        this.closeAlertWindow();
        this.closeFrame();
        if (this.window) {
            setTimeout(function () {
                window.focus();
            }, 100);
            this.window.close();
            this.window = undefined;
        }
    }
    catch (err) {
        xhrLogger.warning("Error while closing logon window: " + err.message);
    }
};
FrameProxyPrototype.cancelLogon = function () {
    if (!this.closed) {
        xhrLogger.warning("XHR Logon cancelled");
        this.close();
        FrameLogonManager.getInstance().cancelXHRLogon();
    }
};
FrameProxyPrototype.createPollingFrame = function () {
    var frame, frameId;
    if (this.closed) {
        return;
    }
    FrameProxy.frameCounter += 1;
    frameId = "xhrLogonFrame" + FrameProxy.frameCounter;
    frame = document.createElement("iframe");
    frame.id = frameId;
    frame.style.display = "none";
    function onReadyStateChanged() {
        if (document.readyState === "complete") {
            document.body.appendChild(frame);
        }
    }

    if (document.readyState === "complete") {
        document.body.appendChild(frame);
    } else {
        // wait until document has been loaded
        events.addEventListener(document, "readystatechange", onReadyStateChanged);
    }
    this.frame = frame;
    frame.src = this.url;
};
FrameProxyPrototype.onWindowOpenFailed = function () {
    xhrLogger.warning("Failed to open logon window");
    this.cancelLogon();
    this.provider.dispatchWindowFailedEvent();
};

FrameProxyPrototype.createAlertWindow = function () {
    var self = this;
    if (this.alertContainer) {
        this.closeAlertWindow();
    }
    this.alertContainer = document.createElement("div");
    this.alertContainer.className = "alertContainer";
    this.alertContainer.innerHTML = htmlContainer;
    document.body.appendChild(this.alertContainer);
    setTimeout(function () {
        var link = document.getElementById("POPUP_LOGIN_LINK");
        link.onclick = function () {
            self.createWindow();
        };
    });
};

FrameProxyPrototype.closeAlertWindow = function () {
    if (this.alertContainer) {
        this.alertContainer.parentNode.removeChild(this.alertContainer);
        this.alertContainer = null;
    }
};

FrameProxyPrototype.createWindow = function () {
    var auxWindow, self = this;
    auxWindow = window.open(this.url);
    if (!auxWindow || auxWindow.closed) {
        xhrLogger.warning("Failed to open logon window, alerting user");
        this.createAlertWindow();
    }
    this.window = auxWindow;
    events.addEventListener(auxWindow, "load", function () {
        xhrLogger.info("Logon window opened");
        if (self.pollIntervalId) {
            clearInterval(self.pollIntervalId);
        }
        if (self.closed) {
            return;
        }
        self.pollIntervalId = setInterval(function () {
            // Robust coarse-grained polling
            self.poll();
        }, 5000);

        if (!self.windowIntervalId) {
            self.windowIntervalId = setInterval(function () {
                // Fine-grained polling
                var auxWindow = self.window;
                try {
                    if (!auxWindow || auxWindow.closed) {
                        self.cancelLogon();
                    }
                    else if (typeof auxWindow.notifyParent === "function") {
                        self.poll();
                    }
                }
                catch (err) {
                    xhrLogger.warning("Logon polling failed: " + err.message);
                }
            }, 300);
        }
        setTimeout(function () {
            self.poll();
        }, 300);
    });
    events.addEventListener(auxWindow, "close", function () {
        self.cancelLogon();
    });
    setTimeout(function () {
        try {
            if (self.window) {
                self.window.focus();
            }
        }
        catch (err) {
            xhrLogger.warn("Failed to switch focus to logon window");
        }
    }, 300);
};
FrameProxyPrototype.poll = function () {
    // Force frame destruction and recreation as forcing reload seems not to be working
    if (this.window && this.window.closed) {
        this.cancelLogon(); // Window has been closed and we did not receive the close event
    }
    else {
        this.closeFrame();
        this.createPollingFrame();
    }
};

},{"./FrameLogonManager.js":6,"./Log.js":9,"./events.js":14}],8:[function(require,module,exports){
"use strict";
var IgnoreListPrototype;
/**
 * @classdesc IgnoreList maintains a list ignore rules as prefixes, regular expressions or matching functions.
 * @desc IgnoreList constructor
 * @constructor
 */
function IgnoreList() {
    this.p = [];
    this.r = [];
    this.f = [];
}
module.exports = IgnoreList;
IgnoreListPrototype = IgnoreList.prototype;

// Polyfill for String.prototype.startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return (this.substr(position, searchString.length) === searchString);
    };
}
/**
 * Adds an ignore rule
 * @param {string|RegExp|function} rule Ignore rule
 * @throws {TypeError} Throws a TypeError for an unsupported rule type
 */
IgnoreListPrototype.add = function (rule) {
    switch (typeof rule) {
        case "string":
            this.p.push(rule);
            break;
        case "object":
            if (rule instanceof RegExp) {
                this.r.push(rule);
            }
            else {
                throw new TypeError("Unsupported ignore rule type");
            }
            break;
        case "function":
            this.f.push(rule);
            break;
        default:
            throw new TypeError("Unsupported ignore rule type");
    }
};
/**
 * Tests whether an item should be ignored
 * @param {string} item Item to test
 * @returns {boolean}
 */
IgnoreListPrototype.ignored = function (item) {
    var ignore;
    ignore = this._prefix(item) || this._regexp(item) || this._function(item);
    return ignore;
};
/**
 * Clears all rules
 */
IgnoreListPrototype.clear = function () {
    this.p = [];
    this.r = [];
    this.f = [];
};
/**
 * Tests against registered prefixes
 * @param item
 * @returns {boolean}
 * @private
 */
IgnoreListPrototype._prefix = function (item) {
    var filters, k, n, res;
    res = false;
    filters = this.p;
    n = filters.length;
    for (k = 0; k < n; ++k) {
        if (item.startsWith(filters[k])) {
            res = true;
            break;
        }
    }
    return res;
};
/**
 * Tests against registered prefixes
 * @param item
 * @returns {boolean}
 * @private
 */
IgnoreListPrototype._regexp = function (item) {
    var filters, k, n, res;
    res = false;
    filters = this.r;
    n = filters.length;
    for (k = 0; k < n; ++k) {
        if (filters[k].test(item)) {
            res = true;
            break;
        }
    }
    return res;
};
/**
 * Tests against registered matchers
 * @param item
 * @returns {boolean}
 * @private
 */
IgnoreListPrototype._function = function (item) {
    var filters, k, n, res;
    res = false;
    filters = this.f;
    n = filters.length;
    for (k = 0; k < n; ++k) {
        try {
            if (filters[k](item)) {
                res = true;
                break;
            }
        }
        // eslint-disable-next-line no-empty
        catch (e) {}
    }
    return res;
};
},{}],9:[function(require,module,exports){
"use strict";
var xhrLogger, nopLogger = {}, logMethods = ["error", "warning", "info", "debug"];
nopLogger.error = nopLogger.warning = nopLogger.info = nopLogger.debug = function () {};

function Log(logger) {
    this.logger = logger;
}
module.exports = Log;
function hasMethods(x, methods) {
    var i, n;
    n = methods.length;
    for (i = 0; i < n; ++i) {
        if (typeof x[methods[i]] !== "function") {
            return false;
        }
    }
    return true;
}
function isLogger(x) {
    return (x && (typeof x === "object") && hasMethods(x, logMethods));
}
Object.defineProperty(Log, "logger", {
    get: function () {
        return xhrLogger;
    },
    set: function (x) {
        if (!x) {
            xhrLogger.logger = nopLogger;
        }
        else if (isLogger(x)) {
            xhrLogger.logger = x;
        }
    }
});
logMethods.forEach(function (method) {
    Log.prototype[method] = function (msg) {
        try {
            return this.logger[method](msg);
        }
        // eslint-disable-next-line no-empty
        catch (e) {}
    };
});
xhrLogger = new Log(nopLogger);
},{}],10:[function(require,module,exports){
"use strict";
require("./xhr.js");
var createEvent = require("./events.js").createEvent;
var EventHandlers = require("./EventHandlers.js");
var IgnoreList = require("./IgnoreList.js");
var xhrLogger = require("./Log.js").logger;
var XHRLogonFilter = require("./XHRLogonFilter.js");
var Status, logonManager, xhrLogonEvents, _XMLHttpRequest = XMLHttpRequest;
Status = {
    AUTHENTICATED: 0,
    UNAUTHENTICATED: 1,
    PENDING: 2
};
xhrLogonEvents = [ "xhrlogon", "xhrlogoncomplete", "xhrlogonfailed", "xhrlogonaborted" ];

/**
 * @classdesc LogonManager handles XHR Logon on the client
 * @desc LogonManager
 * @param customFactory
 * @constructor
 */
function LogonManager(customFactory) {
    if (logonManager) {
        // Enforce singleton
        throw new Error("XHR Logon Manager already created");
    }
    xhrLogger.info("Creating XHR Logon Manager");
    this.queue = [];
    this.realms = {};
    this.handlers = new EventHandlers(xhrLogonEvents);
    if (customFactory) {
        this._filterFactory = customFactory;
    }
    this._initializeTrustedOrigins();
    this._registerFilterFactory();
    window.addEventListener("message", this.getEventHandler());
}
module.exports = LogonManager;

LogonManager.startup = function (customFactory) {
    if (!logonManager) {
        logonManager = new LogonManager(customFactory);
    }
    return logonManager;
};
LogonManager.shutdown = function () {
    if (logonManager) {
        logonManager.shutdown();
        logonManager = undefined;
    }
};
LogonManager.getInstance = function () {
    return logonManager;
};
// Helper functions
function isSuccess(status) {
    return (status >= 200 && status < 300) || (status === 304);
}

// Whether to trigger a logon process if a synchronous request gets an XHR logon challenge
LogonManager.prototype.triggerLogonOnSyncRequest = true;
LogonManager.prototype.addEventListener = function (type, callback) {
    this.handlers.add(type, callback);
};
LogonManager.prototype.removeEventListener = function (type, callback) {
    this.handlers.remove(type, callback);
};
LogonManager.prototype.dispatchEvent = function (event) {
    this.handlers.dispatch(event);
};
LogonManager.prototype.dispatchLogonEvent = function (request) {
    var event;
    event = createEvent("xhrlogon");
    event.request = request;
    this.dispatchEvent(event);
};
LogonManager.prototype.dispatchLogonCompletedEvent = function (xhrLogon) {
    var event;
    event = createEvent("xhrlogoncomplete");
    event.xhrLogon = xhrLogon;
    this.dispatchEvent(event);
};
LogonManager.prototype.dispatchLogonFailedEvent = function(xhrLogon) {
    var event;
    event = createEvent("xhrlogonfailed");
    event.xhrLogon = xhrLogon;
    this.dispatchEvent(event);
};
LogonManager.prototype.dispatchLogonAbortedEvent = function(realm) {
    var event;
    event = createEvent("xhrlogonaborted");
    event.realm = realm;
    this.dispatchEvent(event);
};
LogonManager.prototype.getRealmStatus = function (name) {
    var status;
    status = this.realms[name];
    if (status === undefined) {
        status = Status.UNAUTHENTICATED;
        this.realms[name] = status;
    }
    return status;
};
LogonManager.prototype.isQueued = function (xhr) {
    var i, n, req;
    if (this.pending && this.pending.channel && this.pending.channel.xhr === xhr) {
        return true;
    }
    for (i = 0, n = this.queue.length; i < n; ++i) {
        req = this.queue[i];
        if (req.channel && req.channel.xhr === xhr ) {
            return true;
        }
    }
    return false;
};
LogonManager.prototype.onXHRLogon = function (request) {
    var realm, abort;
    if (!request || !request.channel) {
        xhrLogger.warn("Ignoring invalid XHR Logon request");
        return;
    }
    if (this.isQueued(request.channel.xhr)) {
        xhrLogger.debug("Ignoring authentication request for already queued request " + request.channel.url);
        return;
    }
    xhrLogger.info("Authentication requested for " + request.channel.url);
    if (this.handlers.hasSubscribers("xhrlogon")) {
        // Initiate XHR Logon sequence only if someone handles it :-)
        realm = request.header.realm;
        if (this.pending) {
            xhrLogger.debug("Pending authentication process, queueing request");
            if (this.getRealmStatus(realm) === Status.AUTHENTICATED) {
                this.realms[realm] = Status.UNAUTHENTICATED;
            }
            this.queue.push(request);
        }
        else {
            xhrLogger.debug("Dispatching authentication request");
            this.realms[realm] = Status.PENDING;
            this.pending = request;
            this.dispatchLogonEvent(request);
        }
    }
    else {
        xhrLogger.info("No authentication handler registered");
        abort = this.queue;
        this.queue = [];
        abort.push(request);
        if (this.pending) {
            abort.push(this.pending);
            this.pending = undefined;
        }
        this.abort(abort);
    }
};
LogonManager.prototype.onXHRLogonCompleted = function (xhrLogon) {
    var realm, success, queue, processQueue, waitingQueue, i, n;
    realm = xhrLogon.realm;
    queue = this.queue;
    processQueue = [];
    waitingQueue = [];
    success = isSuccess(xhrLogon.status);
    this.realms[realm] = (success ? Status.AUTHENTICATED : Status.UNAUTHENTICATED);
    if (this.pending) {
        if (realm === this.pending.header.realm) {
            processQueue.push(this.pending);
        }
        else {
            queue.push(this.pending);
        }
    }
    this.pending = undefined;
    n = queue.length;
    for (i = 0; i < n; ++i) {
        if (queue[i].header.realm === realm) {
            processQueue.push(queue[i]);
        }
        else {
            waitingQueue.push(queue[i]);
        }
    }
    this.queue = waitingQueue;
    if (processQueue.length > 0) {
        if (success) {
            xhrLogger.info("Authentication succeeded for realm " + realm + ", repeating requests.");
            this.retry(processQueue);
        }
        else {
            xhrLogger.warning("Authentication failed for realm " + realm);
            this.abort(processQueue);
        }
    }

    // Fire events to complete current logon process before initiating a new one
    if (success) {
        this.dispatchLogonCompletedEvent(xhrLogon);
    }
    else {
        this.dispatchLogonFailedEvent(xhrLogon);
    }

    // Process awaiting requests
    if (this.queue.length > 0) {
        this.onXHRLogon(this.queue.shift());
    }
};
LogonManager.prototype.abortXHRLogon = function (realm) {
    var queue, processQueue, waitingQueue, i, n;
    if (!realm && this.pending) {
        realm = this.pending.header.realm;
    }
    if (realm) {
        queue = this.queue;
        processQueue = [];
        waitingQueue = [];
        this.realms[realm] = Status.UNAUTHENTICATED;
        if (this.pending) {
            if (realm === this.pending.header.realm) {
                processQueue.push(this.pending);
            }
            else {
                queue.push(this.pending);
            }
        }
        this.pending = undefined;
        n = queue.length;
        for (i = 0; i < n; ++i) {
            if (queue[i].header.realm === realm) {
                processQueue.push(queue[i]);
            }
            else {
                waitingQueue.push(queue[i]);
            }
        }
        this.queue = waitingQueue;
        if (processQueue.length > 0) {
            xhrLogger.warning("Authentication aborted for realm " + realm);
            this.abort(processQueue);
        }
    }
    else {
        xhrLogger.info("No pending authentication, ignoring abort");
    }

    // Fire abort event and process awaiting requests
    this.dispatchLogonAbortedEvent(realm);
    if (this.queue.length > 0) {
        this.onXHRLogon(this.queue.shift());
    }
};
LogonManager.prototype.retry = function (queue) {
    var i, n, channel, xhr;
    n = queue.length;
    for (i = 0; i < n; ++i) {
        try {
            channel = queue[i].channel;
            if (channel.async) {
                xhr = channel.xhr;
                xhr.resumeEvents();
                xhr.repeat(); // renew request
            }
        }
        catch (error) {
            xhrLogger.warning("Error while repeating request: " + error.message);
        }
    }
};
LogonManager.prototype.abort = function (queue) {
    var i, n, channel, xhr;
    n = queue.length;
    for (i = 0; i < n; ++i) {
        try {
            channel = queue[i].channel;
            if (channel.async) {
                xhr = channel.xhr;
                xhr.resumeEvents(true); // authentication failed, propagate buffered initial events
            }
        }
        catch (error) {
            xhrLogger.warning("Error while aborting request: " + error.message);
        }
    }
};
LogonManager.prototype.abortAll = function () {
    var abort;
    abort = this.queue;
    this.queue = [];
    if (this.pending) {
        abort.push(this.pending);
        this.pending = undefined;
    }
    this.abort(abort);
};
LogonManager.prototype.shutdown = function () {
    xhrLogger.info("XHR Logon Manager shutdown");
    window.removeEventListener("message", this.getEventHandler());
    this.abortAll();
    this._unregisterFilterFactory();
};
LogonManager.prototype.handleEvent = function (event) {
    var data, xhrLogonRegExp, xhrLogonStatus;
    xhrLogonRegExp = /^\s*\{\s*"xhrLogon"/;
    data = event.data;
    if (xhrLogonRegExp.test(data)) {
        try {
            if (this.isTrusted(event.origin)) {
                xhrLogonStatus = JSON.parse(data);
                this.onXHRLogonCompleted(xhrLogonStatus.xhrLogon);
            }
            else {
                xhrLogger.warning("Received xhrlogon message from untrusted origin " + event.origin);
            }
        }
        catch(error) {
            xhrLogger.warning("Invalid xhrLogon message: " + data);
        }
    }
};
LogonManager.prototype._initializeTrustedOrigins = function () {
    var loc, protocol, origins;
    origins = {};
    loc = window.location;
    protocol = loc.protocol;
    origins[protocol + "//" + loc.host] = true;
    if (loc.port === "") {
        switch (protocol)  {
            case "http":
                origins[protocol + "//" + loc.host + ":80"] = true;
                break;
            case "https":
                origins[protocol + "//" + loc.host + ":443"] = true;
                break;
        }
    }
    this._trustedOrigins = origins;
};
LogonManager.prototype.isTrusted = function (origin) {
    return (!!this._trustedOrigins[origin]);
};
LogonManager.prototype.addTrustedOrigin = function (origin) {
    this._trustedOrigins[origin] = true;
};
LogonManager.prototype.getEventHandler = function () {
    var handler, self;
    handler = this._eventHandler;
    if (!handler) {
        self = this;
        handler = function (event) {
            self.handleEvent(event);
        };
        this._eventHandler = handler;
    }
    return handler;
};
LogonManager.prototype._getFilterFactory = function () {
    var factory, self;
    factory = this._filterFactory;
    if (!factory) {
        self = this;
        factory = function (channel) {
            channel.filters.push(new XHRLogonFilter(self, channel));
        };
        this._filterFactory = factory;
    }
    return factory;
};
LogonManager.prototype._registerFilterFactory = function () {
    if (_XMLHttpRequest.channelFactory) {
        _XMLHttpRequest.channelFactory.addFilterFactory(this._getFilterFactory());
    }
};
LogonManager.prototype._unregisterFilterFactory = function () {
    if (_XMLHttpRequest.channelFactory) {
        _XMLHttpRequest.channelFactory.removeFilterFactory(this._getFilterFactory());
        delete this._filterFactory;
    }
};
LogonManager.prototype.createIgnoreList = function() {
    this.ignore = new IgnoreList();
};
},{"./EventHandlers.js":5,"./IgnoreList.js":8,"./Log.js":9,"./XHRLogonFilter.js":12,"./events.js":14,"./xhr.js":16}],11:[function(require,module,exports){
"use strict";
var URLPrototype, parseRegExp = /([^?#]+)(\?[^#]*)?(#.*)?/;
/**
 * @classdesc Lightweight URL object
 * @desc Creates a new URL object
 * @param {string} url
 * @constructor
 * @property {string} href Returns the URL as string
 */
function URL(url) {
    this._parse(url);
}
module.exports = URL;
URLPrototype = URL.prototype;

URLPrototype._parse = function (url) {
    var matches = parseRegExp.exec(url);
    this.path = matches[1];
    this.hash = matches[3] || "";
    this.parameters = this._parseSearch(matches[2]);
};
URLPrototype._parseSearch = function (search) {
    var paramRegExp, matches, params;
    params = {};
    if (search) {
        paramRegExp = /[?&]([^&=]+)=?([^&]*)/g;
        matches = paramRegExp.exec(search);
        while (matches) {
            params[matches[1]] = matches[2];
            matches = paramRegExp.exec(search);
        }
    }
    return params;
};
URLPrototype.getParameter = function (name) {
    return decodeURIComponent(this.parameters[name]);
};
URLPrototype.removeParameter = function (name) {
    delete this.parameters[name];
};
URLPrototype.setParameter = function (name, value) {
    this.parameters[name] = encodeURIComponent(value);
};
Object.defineProperties(URLPrototype, {
    href: {
        get: function () {
            var href;
            href = this.path + this.search + this.hash;
            return href;
        }
    },
    search: {
        get: function () {
            var search, params, name, value;
            search = "";
            params = this.parameters;
            for (name in params) {
                if (params.hasOwnProperty(name)) {
                    value = params[name];
                    if (search.length > 0) {
                        search += "&";
                    }
                    search += name;
                    if (value) {
                        search += "=";
                        search += value;
                    }
                }
            }
            if (search.length > 0) {
                search = "?" + search;
            }
            return search;
        }
    }
});
},{}],12:[function(require,module,exports){
"use strict";
var XHRLogonFilterPrototype, useCompliantReadyStates, HEADERS_RECEIVED = 2;
var XHRLogonRequest = require("./XHRLogonRequest.js");

function XHRLogonFilter(manager, channel) {
    this.manager = manager;
    this.channel = channel;
    // Listen on the readystatechange event as this is the first one to be fired upon completion
    if (!this.manager.ignore || !this.manager.ignore.ignored(channel.url)) {
        channel.xhr._addEventListener("readystatechange", this);
    }
}
module.exports = XHRLogonFilter;
XHRLogonFilterPrototype = XHRLogonFilter.prototype;
XHRLogonFilterPrototype.sending = function (channel) {
    var xhr;
    if (this.manager.ignore && this.manager.ignore.ignored(channel.url)) {
        return;
    }
    xhr = channel.xhr;
    if (xhr.getRequestHeader("X-XHR-Logon") === undefined) {
        xhr.setRequestHeader("X-XHR-Logon", "accept=\"iframe\"");
    }
    if (xhr.getRequestHeader("X-Requested-With")  === undefined) {
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    }
};
XHRLogonFilterPrototype.handleEvent = function (event) {
    var channel, xhr, httpHeader, status;
    channel = this.channel;
    xhr = channel.xhr;
    if (xhr.readyState < HEADERS_RECEIVED) {
        return;
    }
    if (xhr.readyState === HEADERS_RECEIVED) {
        // Some old IE versions use ready states from old XHR specification
        if (useCompliantReadyStates === undefined) {
            try {
                status = xhr.status;
                useCompliantReadyStates = !!status;
            }
            catch(err) {
                useCompliantReadyStates = false;
            }
            if (!status) {
                return;
            }
        }
        else if (!useCompliantReadyStates) {
            return;
        }
    }
    if (xhr.status === 403) {
        httpHeader = xhr.getResponseHeader("x-xhr-logon");
        if (httpHeader) {
            // prevent event propagation
            if (channel.async) {
                xhr.suspendEvents();
            }
            if (channel.async || this.manager.triggerLogonOnSyncRequest) {
                this.manager.onXHRLogon(new XHRLogonRequest(channel, event, httpHeader));
            }
        }
    }
};
},{"./XHRLogonRequest.js":13}],13:[function(require,module,exports){
"use strict";

function XHRLogonRequest(channel, event, xhrLogonHeader) {
    this.channel = channel;
    this.event = event;
    if (typeof xhrLogonHeader === "string") {
        this.header = XHRLogonRequest.parseHeader(xhrLogonHeader);
    }
    else {
        this.header = xhrLogonHeader;
    }
}
module.exports = XHRLogonRequest;

XHRLogonRequest.parseHeader = function (httpHeader) {
    var parser, result, token, value, xhrLogonHeader;
    parser = /(?:,|^)\s*(\w+)\s*=\s*"((?:[^"\\]|\\.)*)"/g;
    xhrLogonHeader = {};
    result = parser.exec(httpHeader);
    while (result !== null) {
        token = result[1];
        value = result[2].replace(/\\(.)/g, "$1");
        xhrLogonHeader[token] = value;
        result = parser.exec(httpHeader);
    }
    return xhrLogonHeader;
};

},{}],14:[function(require,module,exports){
"use strict";

var useOldEvents;
function createOldEvent(type, bubbles, cancelable) {
    var event;
    event = document.createEvent("Event");
    event.initEvent(type, bubbles, cancelable);
    return event;
}
function createEvent(type, bubbles, cancelable) {
    var event, eventInit;
    if (useOldEvents) {
        event = createOldEvent(type, bubbles, cancelable);
    }
    else {
        try {
            if (bubbles || cancelable) {
                eventInit = {
                    bubbles: bubbles,
                    cancelable: cancelable
                };
            }
            event = new Event(type, eventInit);
        }
        catch(error) {
            useOldEvents = true;
            event = createOldEvent(type, bubbles, cancelable);
        }
    }
    return event;
}
function addEventListener(target, type, listener, useCapture) {
    if (target.addEventListener) {
        target.addEventListener(type, listener, useCapture);
    }
    else if (target.attachEvent) {
        target.attachEvent("on" + type, listener);
    }
}
function removeEventListener(target, type, listener, useCapture) {
    if (target.removeEventListener) {
        target.removeEventListener(type, listener, useCapture);
    }
    else  if (target.detachEvent) {
        target.detachEvent("on" + type, listener);
    }
}
module.exports = {
    createEvent: createEvent,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener
};
},{}],15:[function(require,module,exports){
"use strict";
require("./xhr.js");

/**
 * @alias xhrlib
 * @property {AuxWindowFrameProvider} AuxWindowFrameProvider
 * @property {FrameLogonManager} FrameLogonManager
 * @property {FrameProxy} FrameProxy
 * @property {LogonManager} LogonManager
 */
module.exports = {
    AuxWindowFrameProvider: require("./AuxWindowFrameProvider.js"),
    FrameLogonManager: require("./FrameLogonManager.js"),
    FrameProxy: require("./FrameProxy.js"),
    LogonManager: require("./LogonManager.js")
};

},{"./AuxWindowFrameProvider.js":1,"./FrameLogonManager.js":6,"./FrameProxy.js":7,"./LogonManager.js":10,"./xhr.js":16}],16:[function(require,module,exports){
// ------------------------------------------------------------
// XMLHttpRequest enhancement
// ------------------------------------------------------------
"use strict";

function xhrEnhance() {
    var Log = require("./Log.js");
    var ChannelFactory = require("./ChannelFactory.js");
    var EventHandlers = require("./EventHandlers.js");
    var progressEvents, xhrEvents, _XMLHttpRequest, XMLHttpRequestPrototype, uuid = 0, xhrLogger = Log.logger;
    function NOP(){}
    progressEvents = ["loadstart", "progress", "abort", "error", "load", "timeout", "loadend"];
    xhrEvents = progressEvents.concat("readystatechange");

    // Save reference to original XHR constructor in case it gets overloaded (e.g. by SinonJS)
    _XMLHttpRequest = XMLHttpRequest;
    XMLHttpRequest._SAP_ENHANCED = true;
    XMLHttpRequestPrototype = _XMLHttpRequest.prototype;
    XMLHttpRequest.channelFactory = new ChannelFactory();

    function makeProtected(obj, members) {
        var k, n, member, _fn, _member, fn;
        n = members.length;
        for (k = 0; k < n; ++k) {
            member = members[k];
            fn = obj[member];
            if (fn) {
                _member = "_" + member;
                _fn = obj[_member];
                if (!_fn) {
                    obj[_member] = fn;
                }
            }
        }
    }
    makeProtected(XMLHttpRequestPrototype, ["abort", "open", "setRequestHeader", "send", "addEventListener", "removeEventListener"]);

    XMLHttpRequestPrototype._saveOnEvent = function (type) {
        var methodName, handlers, thisMethod, save;
        methodName = "on" + type;
        thisMethod = this[methodName];
        handlers = this._getHandlers();
        if (handlers[methodName]) {
            save = (thisMethod !== NOP);
        }
        else {
            save = !!thisMethod;
        }
        if (save) {
            handlers[methodName] = thisMethod;
            this[methodName] = NOP;
        }
    };
    XMLHttpRequestPrototype._getHandlers = function () {
        var h;
        h = this._handlers;
        if (!h) {
            h = new EventHandlers(xhrEvents);
            this._handlers = h;
        }
        return h;
    };
    XMLHttpRequestPrototype.handleEvent = function (event) {
        if ((event.type === "readystatechange") && (this.readyState > 2)) {
            // jQuery.ajax attach onreadystatechange handler AFTER having called send!!!
            this._checkEventSubscriptions();
        }
        this._getHandlers().dispatch(event);
    };
    XMLHttpRequestPrototype.suspendEvents = function () {
        this._getHandlers().suspend = true;
    };
    XMLHttpRequestPrototype.resumeEvents = function (release) {
        var handlers;
        handlers = this._getHandlers();
        handlers.suspend = false;
        if (release) {
            handlers.releaseEvents();
        }
    };
    XMLHttpRequestPrototype.getEventHandler = function () {
        var xhr, fnHandler;
        fnHandler = this._fnHandler;
        if (!fnHandler) {
            xhr = this;
            fnHandler = function (event) {
                xhr.handleEvent(event);
            };
            this._fnHandler = fnHandler;
        }
        return fnHandler;
    };
    XMLHttpRequestPrototype._checkEventSubscription = function (type, handlers) {
        // Some browser do not support multiple registrations of the same event handler
        handlers = handlers || this._getHandlers();
        this._saveOnEvent(type);
        if (handlers.hasSubscribers(type)) {
            if (!handlers.subscribed(type)) {
                this._addEventListener(type, this.getEventHandler());
                handlers.subscribe(type);
            }
        }
        else {
            if (handlers.subscribed(type)) {
                this._removeEventListener(type, this.getEventHandler());
                handlers.unsubscribe(type);
            }
        }
    };
    XMLHttpRequestPrototype._checkEventSubscriptions = function () {
        var handlers, i, n;
        handlers = this._getHandlers();
        n = xhrEvents.length;
        for (i = 0; i < n; ++i) {
            this._checkEventSubscription(xhrEvents[i], handlers);
        }
    };

    // ------------------------------------------------------------
    //      XMLHttpRequest override
    // ------------------------------------------------------------
    XMLHttpRequestPrototype.addEventListener = function (type, callback) {
        this._getHandlers().add(type, callback);
        this._checkEventSubscription(type);
    };
    XMLHttpRequestPrototype.removeEventListener = function (type, callback) {
        this._getHandlers().remove(type, callback);
        this._checkEventSubscription(type);
    };

    /**
     * Cancels any network activity.
     * (XMLHttpRequest standard)
     */
    XMLHttpRequestPrototype.abort = function () {
        var channel;
        try {
            channel = this._channel;
            if (channel) {
                xhrLogger.debug("Aborting request " + channel.method + " " + channel.url);
                channel.aborting();
                this._abort();
                channel.aborted();
            }
            else {
                xhrLogger.debug("Aborting request");
                this._abort();
            }
            this._getHandlers().clearEvents();
        }
        catch (error) {
            xhrLogger.warning("Failed to abort request: " + error.message);
            if (channel) {
                channel["catch"](error);
            }
            else {
                throw error;
            }
        }
    };

    /**
     * Sets the request method, request URL, and synchronous flag.
     * Throws a JavaScript TypeError if either method is not a valid HTTP method or url cannot be parsed.
     * Throws a "SecurityError" exception if method is a case-insensitive match for CONNECT, TRACE or TRACK.
     * Throws an "InvalidAccessError" exception if async is false, the JavaScript global environment is a document environment, and either the timeout attribute is not zero, the withCredentials attribute is true, or the responseType attribute is not the empty string.
     * (XMLHttpRequest standard)
     * @param {String} method
     * @param {String} url
     * @param {Boolean} async
     * @param {String} username
     * @param {String} password
     */
    XMLHttpRequestPrototype.open = function (method, url, async, username, password) {
        //  Cf. XHR specification
        //      If the async argument is omitted, set async to true, and set username and password to null.
        //      Due to unfortunate legacy constraints, passing undefined for the async argument is treated differently from async being omitted.
        var channel, arglen, origMethod, origUrl;
        this._id = ++uuid;
        xhrLogger.debug("Opening request #" + this._id + " " + method + " " + url);
        arglen = arguments.length;
        if (arglen <= 2) {
            async = true;
        }
        origMethod = method;
        origUrl = url;
        this._getHandlers().clearEvents(); // Clear possibly lingering events from previous execution
        channel = _XMLHttpRequest.channelFactory.create(this, method, url, async, username, password);
        this._channel = channel;
        this._checkEventSubscription("readystatechange");
        try {
            this._clearParams(); // In case of XHR reuse, delete previously stored replay data
            channel.opening();
            // Allow channels to overload URL and method (e.g. for method tunneling)
            method = channel.method;
            url = channel.url;
            if ((origUrl !== url) || (origMethod !== method)) {
                xhrLogger.debug("Rewriting request #" + this._id + " to " + method + " " + url);
            }
            if (arglen <= 2) {
                this._open(method, url);
            }
            else {
                this._open(method, url, async, username, password);
            }
            channel.opened();

            // Always listen to readystatechange event (AFTER all filters)
            this._addEventListener("readystatechange", this.getEventHandler());
        }
        catch (error) {
            xhrLogger.warning("Failed to open request #" + this._id + " " + method + " " + url + ": " + error.message);
            channel["catch"](error);
        }
    };

    /**
     * Appends an header to the list of author request headers, or if header is already in the list of author request headers, combines its value with value.
     * Throws an "InvalidStateError" exception if the state is not OPENED or if the send() flag is set.
     * Throws a JavaScript TypeError if header is not a valid HTTP header field name or if value is not a valid HTTP header field value.
     * (XMLHttpRequest standard)
     * @param {String} header
     * @param {String} value
     */
    XMLHttpRequestPrototype.setRequestHeader = function (header, value) {
        var headers, normalizedHeader;
        if (typeof value !== "string") {
            value = "" + value;
        }
        this._setRequestHeader(header, value);
        normalizedHeader = header.toLowerCase();
        headers = this.headers;
        if (headers[normalizedHeader] === undefined) {
            headers[normalizedHeader] = value;
        }
        else {
            // If header is in the author request headers list, append ",", followed by U+0020, followed by value, to the value of the header matching header.
            headers[normalizedHeader] += ", " + value;
        }
    };

    /**
     * Performs a setRequestHeader for all own properties of the headers object
     * (non standard)
     * @param {Object} headers
     */
    XMLHttpRequestPrototype.setRequestHeaders = function (headers) {
        var header, headerNames, i, n;
        if (typeof headers === "object") {
            headerNames = Object.getOwnPropertyNames(headers);
            n = headerNames.length;
            for (i = 0; i < n; ++i) {
                header = headerNames[i];
                this.setRequestHeader(header, headers[header]);
            }
        }
    };

    /**
     * Initiates the request. The optional argument provides the request entity body. The argument is ignored if request method is GET or HEAD.
     * Throws an "InvalidStateError" exception if the state is not OPENED or if the send() flag is set.
     * (XMLHttpRequest standard)
     * @param data
     */
    XMLHttpRequestPrototype.send = function (data) {
        var channel, method, url;

        this._checkEventSubscriptions(); // redispatch only events with actual subscribers
        try {
            channel = this._channel;
            if (channel) {
                // channel might not exist if object is not in the right state.
                // We let the native "send" method throw the corresponding exception
                method = channel.method;
                url = channel.url;
                xhrLogger.debug("Sending request #" + this._id + " " + method + " " + url);
                channel.sending();
            }
            this._saveParams(data);
            this._send(data);
            if (channel) {
                channel.sent();
            }
        }
        catch (error) {
            if (method) {
                xhrLogger.warning("Failed to send request #" + this._id + " " + method + " " + url + ": " + error.message);
            }
            else {
                xhrLogger.warning("Failed to send request #" + this._id + ": " + error.message);
            }
            if (channel) {
                channel["catch"](error);
            }
            else {
                throw error;
            }
        }
    };

    // ------------------------------------------------------------
    //      XMLHttpRequest enhancement
    // ------------------------------------------------------------
    /**
     * Retrieves the current value of a request header
     * (non standard)
     * @param {String} header
     * @returns {String}
     */
    XMLHttpRequestPrototype.getRequestHeader = function (header) {
        return this.headers[header.toLowerCase()];
    };

    /**
     * Deletes the repeat data for a given request header @see XMLHttpRequest#repeat
     * (non standard)
     * @param {String} header name of the HTTP header
     */
    XMLHttpRequestPrototype.deleteRepeatHeader = function (header) {
        delete this.headers[header.toLowerCase()];
    };

    /**
     * Changes the repeat data for a given request header @see XMLHttpRequest#repeat
     * (non standard)
     * @param {String} header
     * @param {String} value
     */
    XMLHttpRequestPrototype.setRepeatHeader = function (header, value) {
        this.headers[header.toLowerCase()] = value;
    };

    /**
     * Reopens a request and restores the settings and headers from the previous execution
     * (non standard)
     */
    XMLHttpRequestPrototype.reopen = function () {
        var channel = this._channel, method, url;
        if (channel) {
            method = channel.method;
            url = channel.url;
            xhrLogger.debug("Reopening request #" + this._id + " " + method + " " + url);
        }
        else {
            throw new TypeError("Cannot reopen request");
        }
        this._checkEventSubscription("readystatechange");
        try {
            channel.reopening();
            channel.opening();
            this._open(method, url, channel.async, channel.username, channel.password);
            channel.opened();
            this._restoreParams();
        }
        catch (error) {
            xhrLogger.warning("Failed to reopen request #" + this._id + " " + method + " " + url + ": " + error.message);
            channel["catch"](error);
        }
    };

    /**
     * Repeats a request
     * (non standard)
     */
    XMLHttpRequestPrototype.repeat = function () {
        var channel = this._channel;
        if (!channel) {
            throw new TypeError("Cannot repeat request");
        }
        this.reopen();
        this.send(this._data);
    };

    XMLHttpRequestPrototype.toString = function () {
        var channel = this._channel, str = "[object XMLHttpRequest]";
        if (channel) {
            str += "#" + this._id + " " + channel.method + " " + channel.url;
        }
        return str;
    };

    Object.defineProperties(XMLHttpRequestPrototype, {
        "channel": {
            get: function () {
                return this._channel;
            }
        },
        "headers": {
            get: function () {
                var headers;
                headers = this._headers;
                if (!headers) {
                    headers = {};
                    this._headers = headers;
                }
                return headers;
            }
        },
        "id": {
            get: function () {
                return this._id;
            }
        }
    });

    // ------------------------------------------------------------
    //      Implementation
    // ------------------------------------------------------------
    XMLHttpRequestPrototype._clearParams = function () {
        delete this._headers;
        delete this._withCredentials;
        delete this._timeout;
        delete this._data;
    };
    XMLHttpRequestPrototype._restoreParams = function () {
        var timeout, headers;
        if (this._headers) {
            headers = this._headers;
            this._headers = {};
            this.setRequestHeaders(headers);
        }
        if (this._withCredentials) {
            this.withCredentials = true;
        }
        timeout = this._timeout;
        if (timeout) {
            this.timeout = timeout;
        }
    };
    XMLHttpRequestPrototype._saveParams = function (data) {
        var timeout;
        if ((data !== undefined) && (data !== null)) {
            this._data = data;
        }
        if (this.withCredentials) {
            this._withCredentials = true;
        }
        timeout = this.timeout;
        if (timeout) {
            this._timeout = timeout;
        }
    };
    Object.defineProperties(XMLHttpRequest, {
        "logger": {
            get: function () {
                return Log.logger;
            },
            set: function (logger) {
                Log.logger = logger;
            }
        }
    });
}

if (!XMLHttpRequest._SAP_ENHANCED) {
    xhrEnhance();
}
module.exports = XMLHttpRequest;
},{"./ChannelFactory.js":3,"./EventHandlers.js":5,"./Log.js":9}]},{},[15])(15)
});


    return module.exports;
});
