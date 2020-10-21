// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;

function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/css-loader.js":[function(require,module,exports) {
var bundle = require('./bundle-url');

function updateLink(link) {
  var newLink = link.cloneNode();

  newLink.onload = function () {
    link.remove();
  };

  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}

var cssTimeout = null;

function reloadCSS() {
  if (cssTimeout) {
    return;
  }

  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }

    cssTimeout = null;
  }, 50);
}

module.exports = reloadCSS;
},{"./bundle-url":"../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/bundle-url.js"}],"assets/fonts/fonts.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"./overpass-mono-light.eot":[["overpass-mono-light.1706a02a.eot","assets/fonts/overpass-mono-light.eot"],"assets/fonts/overpass-mono-light.eot"],"./overpass-mono-light.woff2":[["overpass-mono-light.f145289c.woff2","assets/fonts/overpass-mono-light.woff2"],"assets/fonts/overpass-mono-light.woff2"],"./overpass-mono-light.woff":[["overpass-mono-light.1cec26db.woff","assets/fonts/overpass-mono-light.woff"],"assets/fonts/overpass-mono-light.woff"],"./overpass-mono-light.ttf":[["overpass-mono-light.eb595172.ttf","assets/fonts/overpass-mono-light.ttf"],"assets/fonts/overpass-mono-light.ttf"],"./overpass-mono-regular.eot":[["overpass-mono-regular.2fbcd4d9.eot","assets/fonts/overpass-mono-regular.eot"],"assets/fonts/overpass-mono-regular.eot"],"./overpass-mono-regular.woff2":[["overpass-mono-regular.f6dd01cd.woff2","assets/fonts/overpass-mono-regular.woff2"],"assets/fonts/overpass-mono-regular.woff2"],"./overpass-mono-regular.woff":[["overpass-mono-regular.c85090d3.woff","assets/fonts/overpass-mono-regular.woff"],"assets/fonts/overpass-mono-regular.woff"],"./overpass-mono-regular.ttf":[["overpass-mono-regular.1b02cd89.ttf","assets/fonts/overpass-mono-regular.ttf"],"assets/fonts/overpass-mono-regular.ttf"],"./overpass-mono-semibold.eot":[["overpass-mono-semibold.da258a97.eot","assets/fonts/overpass-mono-semibold.eot"],"assets/fonts/overpass-mono-semibold.eot"],"./overpass-mono-semibold.woff2":[["overpass-mono-semibold.01995392.woff2","assets/fonts/overpass-mono-semibold.woff2"],"assets/fonts/overpass-mono-semibold.woff2"],"./overpass-mono-semibold.woff":[["overpass-mono-semibold.39f11144.woff","assets/fonts/overpass-mono-semibold.woff"],"assets/fonts/overpass-mono-semibold.woff"],"./overpass-mono-semibold.ttf":[["overpass-mono-semibold.0d918933.ttf","assets/fonts/overpass-mono-semibold.ttf"],"assets/fonts/overpass-mono-semibold.ttf"],"./overpass-mono-bold.eot":[["overpass-mono-bold.b7f99851.eot","assets/fonts/overpass-mono-bold.eot"],"assets/fonts/overpass-mono-bold.eot"],"./overpass-mono-bold.woff2":[["overpass-mono-bold.c9745749.woff2","assets/fonts/overpass-mono-bold.woff2"],"assets/fonts/overpass-mono-bold.woff2"],"./overpass-mono-bold.woff":[["overpass-mono-bold.35795a68.woff","assets/fonts/overpass-mono-bold.woff"],"assets/fonts/overpass-mono-bold.woff"],"./overpass-mono-bold.ttf":[["overpass-mono-bold.fc640369.ttf","assets/fonts/overpass-mono-bold.ttf"],"assets/fonts/overpass-mono-bold.ttf"],"./overpass-thin.eot":[["overpass-thin.f78bcce1.eot","assets/fonts/overpass-thin.eot"],"assets/fonts/overpass-thin.eot"],"./overpass-thin.woff2":[["overpass-thin.03915f29.woff2","assets/fonts/overpass-thin.woff2"],"assets/fonts/overpass-thin.woff2"],"./overpass-thin.woff":[["overpass-thin.308c195f.woff","assets/fonts/overpass-thin.woff"],"assets/fonts/overpass-thin.woff"],"./overpass-thin.ttf":[["overpass-thin.81e9b1fa.ttf","assets/fonts/overpass-thin.ttf"],"assets/fonts/overpass-thin.ttf"],"./overpass-thin-italic.eot":[["overpass-thin-italic.b6ea21a8.eot","assets/fonts/overpass-thin-italic.eot"],"assets/fonts/overpass-thin-italic.eot"],"./overpass-thin-italic.woff2":[["overpass-thin-italic.09867177.woff2","assets/fonts/overpass-thin-italic.woff2"],"assets/fonts/overpass-thin-italic.woff2"],"./overpass-thin-italic.woff":[["overpass-thin-italic.0b475d2d.woff","assets/fonts/overpass-thin-italic.woff"],"assets/fonts/overpass-thin-italic.woff"],"./overpass-thin-italic.ttf":[["overpass-thin-italic.faab0fe2.ttf","assets/fonts/overpass-thin-italic.ttf"],"assets/fonts/overpass-thin-italic.ttf"],"./overpass-extralight.eot":[["overpass-extralight.dee608d1.eot","assets/fonts/overpass-extralight.eot"],"assets/fonts/overpass-extralight.eot"],"./overpass-extralight.woff2":[["overpass-extralight.10f10892.woff2","assets/fonts/overpass-extralight.woff2"],"assets/fonts/overpass-extralight.woff2"],"./overpass-extralight.woff":[["overpass-extralight.fcc55075.woff","assets/fonts/overpass-extralight.woff"],"assets/fonts/overpass-extralight.woff"],"./overpass-extralight.ttf":[["overpass-extralight.14275703.ttf","assets/fonts/overpass-extralight.ttf"],"assets/fonts/overpass-extralight.ttf"],"./overpass-extralight-italic.eot":[["overpass-extralight-italic.6b79bc78.eot","assets/fonts/overpass-extralight-italic.eot"],"assets/fonts/overpass-extralight-italic.eot"],"./overpass-extralight-italic.woff2":[["overpass-extralight-italic.f22528f7.woff2","assets/fonts/overpass-extralight-italic.woff2"],"assets/fonts/overpass-extralight-italic.woff2"],"./overpass-extralight-italic.woff":[["overpass-extralight-italic.d2010bb2.woff","assets/fonts/overpass-extralight-italic.woff"],"assets/fonts/overpass-extralight-italic.woff"],"./overpass-extralight-italic.ttf":[["overpass-extralight-italic.81ed35d6.ttf","assets/fonts/overpass-extralight-italic.ttf"],"assets/fonts/overpass-extralight-italic.ttf"],"./overpass-light.eot":[["overpass-light.5204bc5b.eot","assets/fonts/overpass-light.eot"],"assets/fonts/overpass-light.eot"],"./overpass-light.woff2":[["overpass-light.0d497c99.woff2","assets/fonts/overpass-light.woff2"],"assets/fonts/overpass-light.woff2"],"./overpass-light.woff":[["overpass-light.83884328.woff","assets/fonts/overpass-light.woff"],"assets/fonts/overpass-light.woff"],"./overpass-light.ttf":[["overpass-light.591a1d9e.ttf","assets/fonts/overpass-light.ttf"],"assets/fonts/overpass-light.ttf"],"./overpass-light-italic.eot":[["overpass-light-italic.c0ae959c.eot","assets/fonts/overpass-light-italic.eot"],"assets/fonts/overpass-light-italic.eot"],"./overpass-light-italic.woff2":[["overpass-light-italic.c249d5af.woff2","assets/fonts/overpass-light-italic.woff2"],"assets/fonts/overpass-light-italic.woff2"],"./overpass-light-italic.woff":[["overpass-light-italic.4d5c617f.woff","assets/fonts/overpass-light-italic.woff"],"assets/fonts/overpass-light-italic.woff"],"./overpass-light-italic.ttf":[["overpass-light-italic.d6b85110.ttf","assets/fonts/overpass-light-italic.ttf"],"assets/fonts/overpass-light-italic.ttf"],"./overpass-regular.eot":[["overpass-regular.3e52b2e0.eot","assets/fonts/overpass-regular.eot"],"assets/fonts/overpass-regular.eot"],"./overpass-regular.woff2":[["overpass-regular.5b669dfa.woff2","assets/fonts/overpass-regular.woff2"],"assets/fonts/overpass-regular.woff2"],"./overpass-regular.woff":[["overpass-regular.8c939669.woff","assets/fonts/overpass-regular.woff"],"assets/fonts/overpass-regular.woff"],"./overpass-regular.ttf":[["overpass-regular.a890b8f9.ttf","assets/fonts/overpass-regular.ttf"],"assets/fonts/overpass-regular.ttf"],"./overpass-italic.eot":[["overpass-italic.b107e0c7.eot","assets/fonts/overpass-italic.eot"],"assets/fonts/overpass-italic.eot"],"./overpass-italic.woff2":[["overpass-italic.46de9c41.woff2","assets/fonts/overpass-italic.woff2"],"assets/fonts/overpass-italic.woff2"],"./overpass-italic.woff":[["overpass-italic.9d45d09c.woff","assets/fonts/overpass-italic.woff"],"assets/fonts/overpass-italic.woff"],"./overpass-italic.ttf":[["overpass-italic.ab740625.ttf","assets/fonts/overpass-italic.ttf"],"assets/fonts/overpass-italic.ttf"],"./overpass-semibold.eot":[["overpass-semibold.f4457ea9.eot","assets/fonts/overpass-semibold.eot"],"assets/fonts/overpass-semibold.eot"],"./overpass-semibold.woff2":[["overpass-semibold.9ee62382.woff2","assets/fonts/overpass-semibold.woff2"],"assets/fonts/overpass-semibold.woff2"],"./overpass-semibold.woff":[["overpass-semibold.bb8639ce.woff","assets/fonts/overpass-semibold.woff"],"assets/fonts/overpass-semibold.woff"],"./overpass-semibold.ttf":[["overpass-semibold.c26a6fd3.ttf","assets/fonts/overpass-semibold.ttf"],"assets/fonts/overpass-semibold.ttf"],"./overpass-semibold-italic.eot":[["overpass-semibold-italic.cb6d3355.eot","assets/fonts/overpass-semibold-italic.eot"],"assets/fonts/overpass-semibold-italic.eot"],"./overpass-semibold-italic.woff2":[["overpass-semibold-italic.01361741.woff2","assets/fonts/overpass-semibold-italic.woff2"],"assets/fonts/overpass-semibold-italic.woff2"],"./overpass-semibold-italic.woff":[["overpass-semibold-italic.bb2dd43f.woff","assets/fonts/overpass-semibold-italic.woff"],"assets/fonts/overpass-semibold-italic.woff"],"./overpass-semibold-italic.ttf":[["overpass-semibold-italic.705abbf7.ttf","assets/fonts/overpass-semibold-italic.ttf"],"assets/fonts/overpass-semibold-italic.ttf"],"./overpass-bold.eot":[["overpass-bold.589a7b51.eot","assets/fonts/overpass-bold.eot"],"assets/fonts/overpass-bold.eot"],"./overpass-bold.woff2":[["overpass-bold.3ef037c7.woff2","assets/fonts/overpass-bold.woff2"],"assets/fonts/overpass-bold.woff2"],"./overpass-bold.woff":[["overpass-bold.2e413910.woff","assets/fonts/overpass-bold.woff"],"assets/fonts/overpass-bold.woff"],"./overpass-bold.ttf":[["overpass-bold.ff262c69.ttf","assets/fonts/overpass-bold.ttf"],"assets/fonts/overpass-bold.ttf"],"./overpass-bold-italic.eot":[["overpass-bold-italic.cbfbcbee.eot","assets/fonts/overpass-bold-italic.eot"],"assets/fonts/overpass-bold-italic.eot"],"./overpass-bold-italic.woff2":[["overpass-bold-italic.4e4d409c.woff2","assets/fonts/overpass-bold-italic.woff2"],"assets/fonts/overpass-bold-italic.woff2"],"./overpass-bold-italic.woff":[["overpass-bold-italic.feaed9fb.woff","assets/fonts/overpass-bold-italic.woff"],"assets/fonts/overpass-bold-italic.woff"],"./overpass-bold-italic.ttf":[["overpass-bold-italic.bfae52bb.ttf","assets/fonts/overpass-bold-italic.ttf"],"assets/fonts/overpass-bold-italic.ttf"],"./overpass-extrabold.eot":[["overpass-extrabold.796cc5f4.eot","assets/fonts/overpass-extrabold.eot"],"assets/fonts/overpass-extrabold.eot"],"./overpass-extrabold.woff2":[["overpass-extrabold.efbaac70.woff2","assets/fonts/overpass-extrabold.woff2"],"assets/fonts/overpass-extrabold.woff2"],"./overpass-extrabold.woff":[["overpass-extrabold.99684506.woff","assets/fonts/overpass-extrabold.woff"],"assets/fonts/overpass-extrabold.woff"],"./overpass-extrabold.ttf":[["overpass-extrabold.4852a681.ttf","assets/fonts/overpass-extrabold.ttf"],"assets/fonts/overpass-extrabold.ttf"],"./overpass-extrabold-italic.eot":[["overpass-extrabold-italic.921f4c36.eot","assets/fonts/overpass-extrabold-italic.eot"],"assets/fonts/overpass-extrabold-italic.eot"],"./overpass-extrabold-italic.woff2":[["overpass-extrabold-italic.6053a8c9.woff2","assets/fonts/overpass-extrabold-italic.woff2"],"assets/fonts/overpass-extrabold-italic.woff2"],"./overpass-extrabold-italic.woff":[["overpass-extrabold-italic.6a33fc7e.woff","assets/fonts/overpass-extrabold-italic.woff"],"assets/fonts/overpass-extrabold-italic.woff"],"./overpass-extrabold-italic.ttf":[["overpass-extrabold-italic.ec314ecb.ttf","assets/fonts/overpass-extrabold-italic.ttf"],"assets/fonts/overpass-extrabold-italic.ttf"],"./overpass-heavy.eot":[["overpass-heavy.03bc2074.eot","assets/fonts/overpass-heavy.eot"],"assets/fonts/overpass-heavy.eot"],"./overpass-heavy.woff2":[["overpass-heavy.ef49d679.woff2","assets/fonts/overpass-heavy.woff2"],"assets/fonts/overpass-heavy.woff2"],"./overpass-heavy.woff":[["overpass-heavy.e51b0c11.woff","assets/fonts/overpass-heavy.woff"],"assets/fonts/overpass-heavy.woff"],"./overpass-heavy.ttf":[["overpass-heavy.81877c35.ttf","assets/fonts/overpass-heavy.ttf"],"assets/fonts/overpass-heavy.ttf"],"./overpass-heavy-italic.eot":[["overpass-heavy-italic.1931c464.eot","assets/fonts/overpass-heavy-italic.eot"],"assets/fonts/overpass-heavy-italic.eot"],"./overpass-heavy-italic.woff2":[["overpass-heavy-italic.f4b6c328.woff2","assets/fonts/overpass-heavy-italic.woff2"],"assets/fonts/overpass-heavy-italic.woff2"],"./overpass-heavy-italic.woff":[["overpass-heavy-italic.2ee96d86.woff","assets/fonts/overpass-heavy-italic.woff"],"assets/fonts/overpass-heavy-italic.woff"],"./overpass-heavy-italic.ttf":[["overpass-heavy-italic.d5514f1f.ttf","assets/fonts/overpass-heavy-italic.ttf"],"assets/fonts/overpass-heavy-italic.ttf"],"_css_loader":"../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/css-loader.js"}],"assets/styles.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"./fonts/fonts.css":"assets/fonts/fonts.css","_css_loader":"../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/css-loader.js"}],"../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "33583" + '/');

  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();
      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/hmr-runtime.js"], null)