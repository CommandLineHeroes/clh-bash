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
})({"src/MTLLoaderPhysical.js":[function(require,module,exports) {
/**
 * Loads a Wavefront .mtl file specifying materials
 *
 * @author angelxuanchang
 */
THREE.MTLLoader = function (manager) {
  this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
};

THREE.MTLLoader.prototype = {
  constructor: THREE.MTLLoader,

  /**
   * Loads and parses a MTL asset from a URL.
   *
   * @param {String} url - URL to the MTL file.
   * @param {Function} [onLoad] - Callback invoked with the loaded object.
   * @param {Function} [onProgress] - Callback for download progress.
   * @param {Function} [onError] - Callback for download errors.
   *
   * @see setPath setResourcePath
   *
   * @note In order for relative texture references to resolve correctly
   * you must call setResourcePath() explicitly prior to load.
   */
  load: function load(url, onLoad, onProgress, onError) {
    var scope = this;
    var path = this.path === undefined ? THREE.LoaderUtils.extractUrlBase(url) : this.path;
    var loader = new THREE.FileLoader(this.manager);
    loader.setPath(this.path);
    loader.load(url, function (text) {
      onLoad(scope.parse(text, path));
    }, onProgress, onError);
  },

  /**
   * Set base path for resolving references.
   * If set this path will be prepended to each loaded and found reference.
   *
   * @see setResourcePath
   * @param {String} path
   * @return {THREE.MTLLoader}
   *
   * @example
   *     mtlLoader.setPath( 'assets/obj/' );
   *     mtlLoader.load( 'my.mtl', ... );
   */
  setPath: function setPath(path) {
    this.path = path;
    return this;
  },

  /**
   * Set base path for additional resources like textures.
   *
   * @see setPath
   * @param {String} path
   * @return {THREE.MTLLoader}
   *
   * @example
   *     mtlLoader.setPath( 'assets/obj/' );
   *     mtlLoader.setResourcePath( 'assets/textures/' );
   *     mtlLoader.load( 'my.mtl', ... );
   */
  setResourcePath: function setResourcePath(path) {
    this.resourcePath = path;
    return this;
  },
  setTexturePath: function setTexturePath(path) {
    console.warn("THREE.MTLLoader: .setTexturePath() has been renamed to .setResourcePath().");
    return this.setResourcePath(path);
  },
  setCrossOrigin: function setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  },
  setMaterialOptions: function setMaterialOptions(value) {
    this.materialOptions = value;
    return this;
  },

  /**
   * Parses a MTL file.
   *
   * @param {String} text - Content of MTL file
   * @return {THREE.MTLLoader.MaterialCreator}
   *
   * @see setPath setResourcePath
   *
   * @note In order for relative texture references to resolve correctly
   * you must call setResourcePath() explicitly prior to parse.
   */
  parse: function parse(text, path) {
    var lines = text.split("\n");
    var info = {};
    var delimiter_pattern = /\s+/;
    var materialsInfo = {};

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      line = line.trim();

      if (line.length === 0 || line.charAt(0) === "#") {
        // Blank line or comment ignore
        continue;
      }

      var pos = line.indexOf(" ");
      var key = pos >= 0 ? line.substring(0, pos) : line;
      key = key.toLowerCase();
      var value = pos >= 0 ? line.substring(pos + 1) : "";
      value = value.trim();

      if (key === "newmtl") {
        // New material
        info = {
          name: value
        };
        materialsInfo[value] = info;
      } else {
        if (key === "ka" || key === "kd" || key === "ks" || key === "ke") {
          var ss = value.split(delimiter_pattern, 3);
          info[key] = [parseFloat(ss[0]), parseFloat(ss[1]), parseFloat(ss[2])];
        } else {
          info[key] = value;
        }
      }
    }

    var materialCreator = new THREE.MTLLoader.MaterialCreator(this.resourcePath || path, this.materialOptions);
    materialCreator.setCrossOrigin(this.crossOrigin);
    materialCreator.setManager(this.manager);
    materialCreator.setMaterials(materialsInfo);
    return materialCreator;
  }
};
/**
 * Create a new THREE-MTLLoader.MaterialCreator
 * @param baseUrl - Url relative to which textures are loaded
 * @param options - Set of options on how to construct the materials
 *                  side: Which side to apply the material
 *                        THREE.FrontSide (default), THREE.BackSide, THREE.DoubleSide
 *                  wrap: What type of wrapping to apply for textures
 *                        THREE.RepeatWrapping (default), THREE.ClampToEdgeWrapping, THREE.MirroredRepeatWrapping
 *                  normalizeRGB: RGBs need to be normalized to 0-1 from 0-255
 *                                Default: false, assumed to be already normalized
 *                  ignoreZeroRGBs: Ignore values of RGBs (Ka,Kd,Ks) that are all 0's
 *                                  Default: false
 * @constructor
 */

THREE.MTLLoader.MaterialCreator = function (baseUrl, options) {
  this.baseUrl = baseUrl || "";
  this.options = options;
  this.materialsInfo = {};
  this.materials = {};
  this.materialsArray = [];
  this.nameLookup = {};
  this.side = this.options && this.options.side ? this.options.side : THREE.FrontSide;
  this.wrap = this.options && this.options.wrap ? this.options.wrap : THREE.RepeatWrapping;
};

THREE.MTLLoader.MaterialCreator.prototype = {
  constructor: THREE.MTLLoader.MaterialCreator,
  crossOrigin: "anonymous",
  setCrossOrigin: function setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  },
  setManager: function setManager(value) {
    this.manager = value;
  },
  setMaterials: function setMaterials(materialsInfo) {
    this.materialsInfo = this.convert(materialsInfo);
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};
  },
  convert: function convert(materialsInfo) {
    if (!this.options) return materialsInfo;
    var converted = {};

    for (var mn in materialsInfo) {
      // Convert materials info into normalized form based on options
      var mat = materialsInfo[mn];
      var covmat = {};
      converted[mn] = covmat;

      for (var prop in mat) {
        var save = true;
        var value = mat[prop];
        var lprop = prop.toLowerCase();

        switch (lprop) {
          case "kd":
          case "ka":
          case "ks":
            // Diffuse color (color under white light) using RGB values
            if (this.options && this.options.normalizeRGB) {
              value = [value[0] / 255, value[1] / 255, value[2] / 255];
            }

            if (this.options && this.options.ignoreZeroRGBs) {
              if (value[0] === 0 && value[1] === 0 && value[2] === 0) {
                // ignore
                save = false;
              }
            }

            break;

          default:
            break;
        }

        if (save) {
          covmat[lprop] = value;
        }
      }
    }

    return converted;
  },
  preload: function preload() {
    for (var mn in this.materialsInfo) {
      this.create(mn);
    }
  },
  getIndex: function getIndex(materialName) {
    return this.nameLookup[materialName];
  },
  getAsArray: function getAsArray() {
    var index = 0;

    for (var mn in this.materialsInfo) {
      this.materialsArray[index] = this.create(mn);
      this.nameLookup[mn] = index;
      index++;
    }

    return this.materialsArray;
  },
  create: function create(materialName) {
    if (this.materials[materialName] === undefined) {
      this.createMaterial_(materialName);
    }

    return this.materials[materialName];
  },
  createMaterial_: function createMaterial_(materialName) {
    // Create material
    var scope = this;
    var mat = this.materialsInfo[materialName];
    var params = {
      name: materialName,
      side: this.side
    };

    function resolveURL(baseUrl, url) {
      if (typeof url !== "string" || url === "") return ""; // Absolute URL

      if (/^https?:\/\//i.test(url)) return url;
      return baseUrl + url;
    }

    function setMapForType(mapType, value) {
      if (params[mapType]) return; // Keep the first encountered texture

      var texParams = scope.getTextureParams(value, params);
      var map = scope.loadTexture(resolveURL(scope.baseUrl, texParams.url));
      map.repeat.copy(texParams.scale);
      map.offset.copy(texParams.offset);
      map.wrapS = scope.wrap;
      map.wrapT = scope.wrap;
      params[mapType] = map;
    }

    for (var prop in mat) {
      var value = mat[prop];
      var n;
      if (value === "") continue;

      switch (prop.toLowerCase()) {
        // Ns is material specular exponent
        case "kd":
          // Diffuse color (color under white light) using RGB values
          params.color = new THREE.Color().fromArray(value);
          break;

        case "ks":
          // Specular color (color when light is reflected from shiny surface) using RGB values
          // params.specular = new THREE.Color().fromArray(value);
          break;

        case "ke":
          // Emissive using RGB values
          params.emissive = new THREE.Color().fromArray(value);
          break;

        case "map_kd":
          // Diffuse texture map
          setMapForType("map", value);
          break;

        case "map_ks":
          // Specular map
          setMapForType("specularMap", value);
          break;

        case "map_ke":
          // Emissive map
          setMapForType("emissiveMap", value);
          break;

        case "norm":
          setMapForType("normalMap", value);
          break;

        case "map_bump":
        case "bump":
          // Bump texture map
          setMapForType("bumpMap", value);
          break;

        case "map_d":
          // Alpha map
          setMapForType("alphaMap", value);
          params.transparent = true;
          break;

        case "ns":
          // The specular exponent (defines the focus of the specular highlight)
          // A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.
          params.reflectivity = parseFloat(value) / 100;
          break;

        case "d":
          n = parseFloat(value);

          if (n < 1) {
            params.opacity = n;
            params.transparent = true;
          }

          break;

        case "tr":
          n = parseFloat(value);
          if (this.options && this.options.invertTrProperty) n = 1 - n;

          if (n > 0) {
            params.opacity = 1 - n;
            params.transparent = true;
          }

          break;

        default:
          break;
      }
    }

    this.materials[materialName] = new THREE.MeshPhysicalMaterial(params);
    return this.materials[materialName];
  },
  getTextureParams: function getTextureParams(value, matParams) {
    var texParams = {
      scale: new THREE.Vector2(1, 1),
      offset: new THREE.Vector2(0, 0)
    };
    var items = value.split(/\s+/);
    var pos;
    pos = items.indexOf("-bm");

    if (pos >= 0) {
      matParams.bumpScale = parseFloat(items[pos + 1]);
      items.splice(pos, 2);
    }

    pos = items.indexOf("-s");

    if (pos >= 0) {
      texParams.scale.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
      items.splice(pos, 4); // we expect 3 parameters here!
    }

    pos = items.indexOf("-o");

    if (pos >= 0) {
      texParams.offset.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
      items.splice(pos, 4); // we expect 3 parameters here!
    }

    texParams.url = items.join(" ").trim();
    return texParams;
  },
  loadTexture: function loadTexture(url, mapping, onLoad, onProgress, onError) {
    var texture;
    var loader = THREE.Loader.Handlers.get(url);
    var manager = this.manager !== undefined ? this.manager : THREE.DefaultLoadingManager;

    if (loader === null) {
      loader = new THREE.TextureLoader(manager);
    }

    if (loader.setCrossOrigin) loader.setCrossOrigin(this.crossOrigin);
    texture = loader.load(url, onLoad, onProgress, onError);
    if (mapping !== undefined) texture.mapping = mapping;
    return texture;
  }
};
},{}],"../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
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
},{}]},{},["../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/hmr-runtime.js","src/MTLLoaderPhysical.js"], null)
//# sourceMappingURL=/MTLLoaderPhysical.7c20d60e.map