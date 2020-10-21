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
})({"node_modules/three/examples/js/objects/Fire.js":[function(require,module,exports) {
/**
 * @author Mike Piecuch / https://github.com/mikepiecuch
 *
 * Based on research paper "Real-Time Fluid Dynamics for Games" by Jos Stam
 * http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf
 *
 */

THREE.Fire = function ( geometry, options ) {

	THREE.Mesh.call( this, geometry );

	this.type = 'Fire';

	this.clock = new THREE.Clock();

	options = options || {};

	var textureWidth = options.textureWidth || 512;
	var textureHeight = options.textureHeight || 512;
	var oneOverWidth = 1.0 / textureWidth;
	var oneOverHeight = 1.0 / textureHeight;

	var debug = ( options.debug === undefined ) ? false : options.debug;
	this.color1 = options.color1 || new THREE.Color( 0xffffff );
	this.color2 = options.color2 || new THREE.Color( 0xffa000 );
	this.color3 = options.color3 || new THREE.Color( 0x000000 );
	this.colorBias = ( options.colorBias === undefined ) ? 0.8 : options.colorBias;
	this.diffuse = ( options.diffuse === undefined ) ? 1.33 : options.diffuse;
	this.viscosity = ( options.viscosity === undefined ) ? 0.25 : options.viscosity;
	this.expansion = ( options.expansion === undefined ) ? - 0.25 : options.expansion;
	this.swirl = ( options.swirl === undefined ) ? 50.0 : options.swirl;
	this.burnRate = ( options.burnRate === undefined ) ? 0.3 : options.burnRate;
	this.drag = ( options.drag === undefined ) ? 0.35 : options.drag;
	this.airSpeed = ( options.airSpeed === undefined ) ? 6.0 : options.airSpeed;
	this.windVector = options.windVector || new THREE.Vector2( 0.0, 0.75 );
	this.speed = ( options.speed === undefined ) ? 500.0 : options.speed;
	this.massConservation = ( options.massConservation === undefined ) ? false : options.massConservation;

	var size = textureWidth * textureHeight;
	this.sourceData = new Uint8Array( 4 * size );

	this.clearSources = function () {

		for ( var y = 0; y < textureHeight; y ++ ) {

			for ( var x = 0; x < textureWidth; x ++ ) {

				var i = y * textureWidth + x;
				var stride = i * 4;

				this.sourceData[ stride ] = 0;
				this.sourceData[ stride + 1 ] = 0;
				this.sourceData[ stride + 2 ] = 0;
				this.sourceData[ stride + 3 ] = 0;

			}

		}

		this.sourceMaterial.uniforms.sourceMap.value = this.internalSource;
		this.sourceMaterial.needsUpdate = true;

		return this.sourceData;

	};

	this.addSource = function ( u, v, radius, density = null, windX = null, windY = null ) {

		var startX = Math.max( Math.floor( ( u - radius ) * textureWidth ), 0 );
		var startY = Math.max( Math.floor( ( v - radius ) * textureHeight ), 0 );
		var endX = Math.min( Math.floor( ( u + radius ) * textureWidth ), textureWidth );
		var endY = Math.min( Math.floor( ( v + radius ) * textureHeight ), textureHeight );

		for ( var y = startY; y < endY; y ++ ) {

			for ( var x = startX; x < endX; x ++ ) {

				var diffX = x * oneOverWidth - u;
				var diffY = y * oneOverHeight - v;

				if ( diffX * diffX + diffY * diffY < radius * radius ) {

					var i = y * textureWidth + x;
					var stride = i * 4;

					if ( density != null ) {

						this.sourceData[ stride ] = Math.min( Math.max( density, 0.0 ), 1.0 ) * 255;

					}
					if ( windX != null ) {

						var wind = Math.min( Math.max( windX, - 1.0 ), 1.0 );
						wind = ( wind < 0.0 ) ? Math.floor( wind * 127 ) + 255 : Math.floor( wind * 127 );
						this.sourceData[ stride + 1 ] = wind;

					}
					if ( windY != null ) {

						var wind = Math.min( Math.max( windY, - 1.0 ), 1.0 );
						wind = ( wind < 0.0 ) ? Math.floor( wind * 127 ) + 255 : Math.floor( wind * 127 );
						this.sourceData[ stride + 2 ] = wind;

					}

				}

			}

		}

		this.internalSource.needsUpdate = true;

		return this.sourceData;

	};

	// When setting source map, red channel is density. Green and blue channels
	// encode x and y velocity respectively as signed chars:
	// (0 -> 127 = 0.0 -> 1.0, 128 -> 255 = -1.0 -> 0.0 )
	this.setSourceMap = function ( texture ) {

		this.sourceMaterial.uniforms.sourceMap.value = texture;

	};

	var parameters = {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false
	};


	this.field0 = new THREE.WebGLRenderTarget( textureWidth, textureHeight, parameters );

	this.field0.background = new THREE.Color( 0x000000 );

	this.field1 = new THREE.WebGLRenderTarget( textureWidth, textureHeight, parameters );

	this.field0.background = new THREE.Color( 0x000000 );

	this.fieldProj = new THREE.WebGLRenderTarget( textureWidth, textureHeight, parameters );

	this.field0.background = new THREE.Color( 0x000000 );

	if ( ! THREE.Math.isPowerOfTwo( textureWidth ) ||
		 ! THREE.Math.isPowerOfTwo( textureHeight ) ) {

		this.field0.texture.generateMipmaps = false;
		this.field1.texture.generateMipmaps = false;
		this.fieldProj.texture.generateMipmaps = false;

	}


	this.fieldScene = new THREE.Scene();
	this.fieldScene.background = new THREE.Color( 0x000000 );

	this.orthoCamera = new THREE.OrthographicCamera( textureWidth / - 2, textureWidth / 2, textureHeight / 2, textureHeight / - 2, 1, 2 );
	this.orthoCamera.position.z = 1;

	this.fieldGeometry = new THREE.PlaneBufferGeometry( textureWidth, textureHeight );

	this.internalSource = new THREE.DataTexture( this.sourceData, textureWidth, textureHeight, THREE.RGBAFormat );

	// Source Shader

	var shader = THREE.Fire.SourceShader;
	this.sourceMaterial = new THREE.ShaderMaterial( {
		uniforms: shader.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		transparent: false
	} );

	this.clearSources();

	this.sourceMesh = new THREE.Mesh( this.fieldGeometry, this.sourceMaterial );
	this.fieldScene.add( this.sourceMesh );

	// Diffuse Shader

	var shader = THREE.Fire.DiffuseShader;
	this.diffuseMaterial = new THREE.ShaderMaterial( {
		uniforms: shader.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		transparent: false
	} );

	this.diffuseMaterial.uniforms.oneOverWidth.value = oneOverWidth;
	this.diffuseMaterial.uniforms.oneOverHeight.value = oneOverHeight;

	this.diffuseMesh = new THREE.Mesh( this.fieldGeometry, this.diffuseMaterial );
	this.fieldScene.add( this.diffuseMesh );

	// Drift Shader

	shader = THREE.Fire.DriftShader;
	this.driftMaterial = new THREE.ShaderMaterial( {
		uniforms: shader.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		transparent: false
	} );

	this.driftMaterial.uniforms.oneOverWidth.value = oneOverWidth;
	this.driftMaterial.uniforms.oneOverHeight.value = oneOverHeight;

	this.driftMesh = new THREE.Mesh( this.fieldGeometry, this.driftMaterial );
	this.fieldScene.add( this.driftMesh );

	// Projection Shader 1

	shader = THREE.Fire.ProjectionShader1;
	this.projMaterial1 = new THREE.ShaderMaterial( {
		uniforms: shader.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		transparent: false
	} );

	this.projMaterial1.uniforms.oneOverWidth.value = oneOverWidth;
	this.projMaterial1.uniforms.oneOverHeight.value = oneOverHeight;

	this.projMesh1 = new THREE.Mesh( this.fieldGeometry, this.projMaterial1 );
	this.fieldScene.add( this.projMesh1 );

	// Projection Shader 2

	shader = THREE.Fire.ProjectionShader2;
	this.projMaterial2 = new THREE.ShaderMaterial( {
		uniforms: shader.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		transparent: false
	} );


	this.projMaterial2.uniforms.oneOverWidth.value = oneOverWidth;
	this.projMaterial2.uniforms.oneOverHeight.value = oneOverHeight;

	this.projMesh2 = new THREE.Mesh( this.fieldGeometry, this.projMaterial2 );
	this.fieldScene.add( this.projMesh2 );

	// Projection Shader 3

	shader = THREE.Fire.ProjectionShader3;
	this.projMaterial3 = new THREE.ShaderMaterial( {
		uniforms: shader.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		transparent: false
	} );


	this.projMaterial3.uniforms.oneOverWidth.value = oneOverWidth;
	this.projMaterial3.uniforms.oneOverHeight.value = oneOverHeight;

	this.projMesh3 = new THREE.Mesh( this.fieldGeometry, this.projMaterial3 );
	this.fieldScene.add( this.projMesh3 );

	// Color Shader

	if ( debug ) {

		shader = THREE.Fire.DebugShader;

	} else {

		shader = THREE.Fire.ColorShader;

	}
	this.material = new THREE.ShaderMaterial( {
		uniforms: shader.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		transparent: true
	} );

	this.material.uniforms.densityMap.value = this.field1.texture;

	this.configShaders = function ( dt ) {

		this.diffuseMaterial.uniforms.diffuse.value = dt * 0.05 * this.diffuse;
		this.diffuseMaterial.uniforms.viscosity.value = dt * 0.05 * this.viscosity;
		this.diffuseMaterial.uniforms.expansion.value = Math.exp( this.expansion * - 1.0 );
		this.diffuseMaterial.uniforms.swirl.value = Math.exp( this.swirl * - 0.1 );
		this.diffuseMaterial.uniforms.drag.value = Math.exp( this.drag * - 0.1 );
		this.diffuseMaterial.uniforms.burnRate.value = this.burnRate * dt * 0.01;
		this.driftMaterial.uniforms.windVector.value = this.windVector;
		this.driftMaterial.uniforms.airSpeed.value = dt * this.airSpeed * 0.001 * textureHeight;
		this.material.uniforms.color1.value = this.color1;
		this.material.uniforms.color2.value = this.color2;
		this.material.uniforms.color3.value = this.color3;
		this.material.uniforms.colorBias.value = this.colorBias;

	};

	this.clearDiffuse = function () {

		this.diffuseMaterial.uniforms.expansion.value = 1.0;
		this.diffuseMaterial.uniforms.swirl.value = 1.0;
		this.diffuseMaterial.uniforms.drag.value = 1.0;
		this.diffuseMaterial.uniforms.burnRate.value = 0.0;

	};

	this.swapTextures = function () {

		var swap = this.field0;
		this.field0 = this.field1;
		this.field1 = swap;

	};

	this.saveRenderState = function ( renderer ) {

		this.savedRenderTarget = renderer.getRenderTarget();
		this.savedVrEnabled = renderer.vr.enabled;
		this.savedShadowAutoUpdate = renderer.shadowMap.autoUpdate;
		this.savedAntialias = renderer.antialias;
		this.savedToneMapping = renderer.toneMapping;

	};

	this.restoreRenderState = function ( renderer ) {

		renderer.vr.enabled = this.savedVrEnabled;
		renderer.shadowMap.autoUpdate = this.savedShadowAutoUpdate;
		renderer.setRenderTarget( this.savedRenderTarget );
		renderer.antialias = this.savedAntialias;
		renderer.toneMapping = this.savedToneMapping;

	};

	this.renderSource = function ( renderer ) {

		this.sourceMesh.visible = true;

		this.sourceMaterial.uniforms.densityMap.value = this.field0.texture;

		renderer.render( this.fieldScene, this.orthoCamera, this.field1 );

		this.sourceMesh.visible = false;

		this.swapTextures();

	};

	this.renderDiffuse = function ( renderer ) {

		this.diffuseMesh.visible = true;

		this.diffuseMaterial.uniforms.densityMap.value = this.field0.texture;

		renderer.render( this.fieldScene, this.orthoCamera, this.field1 );

		this.diffuseMesh.visible = false;

		this.swapTextures();

	};

	this.renderDrift = function ( renderer ) {

		this.driftMesh.visible = true;

		this.driftMaterial.uniforms.densityMap.value = this.field0.texture;

		renderer.render( this.fieldScene, this.orthoCamera, this.field1 );

		this.driftMesh.visible = false;

		this.swapTextures();

	};

	this.renderProject = function ( renderer ) {

		// Projection pass 1

		this.projMesh1.visible = true;

		this.projMaterial1.uniforms.densityMap.value = this.field0.texture;

		renderer.render( this.fieldScene, this.orthoCamera, this.fieldProj );

		this.projMesh1.visible = false;

		this.projMaterial2.uniforms.densityMap.value = this.fieldProj.texture;

		// Projection pass 2

		this.projMesh2.visible = true;

		for ( var i = 0; i < 20; i ++ ) {

			renderer.render( this.fieldScene, this.orthoCamera, this.field1 );

			var temp = this.field1;
			this.field1 = this.fieldProj;
			this.fieldProj = temp;

			this.projMaterial2.uniforms.densityMap.value = this.fieldProj.texture;

		}

		this.projMesh2.visible = false;

		this.projMaterial3.uniforms.densityMap.value = this.field0.texture;
		this.projMaterial3.uniforms.projMap.value = this.fieldProj.texture;

		// Projection pass 3

		this.projMesh3.visible = true;

		renderer.render( this.fieldScene, this.orthoCamera, this.field1 );

		this.projMesh3.visible = false;

		this.swapTextures();

	};

	this.onBeforeRender = function ( renderer, scene, camera ) {

		var delta = this.clock.getDelta();
		if ( delta > 0.1 ) {

			delta = 0.1;

		}
		var dt = delta * ( this.speed * 0.1 );

		this.configShaders( dt );

		this.saveRenderState( renderer );

		renderer.vr.enabled = false; // Avoid camera modification and recursion
		renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows
		renderer.antialias = false;
		renderer.toneMapping = THREE.NoToneMapping;

		this.sourceMesh.visible = false;
		this.diffuseMesh.visible = false;
		this.driftMesh.visible = false;
		this.projMesh1.visible = false;
		this.projMesh2.visible = false;
		this.projMesh3.visible = false;

		this.renderSource( renderer );

		this.clearDiffuse();
		for ( var i = 0; i < 21; i ++ ) {

			this.renderDiffuse( renderer );

		}
		this.configShaders( dt );
		this.renderDiffuse( renderer );

		this.renderDrift( renderer );

		if ( this.massConservation ) {

			this.renderProject( renderer );
			this.renderProject( renderer );

		}

		// Final result out for coloring

		this.material.map = this.field1.texture;
		this.material.transparent = true;
		this.material.minFilter = THREE.LinearFilter,
		this.material.magFilter = THREE.LinearFilter,

		this.restoreRenderState( renderer );

	};

};


THREE.Fire.prototype = Object.create( THREE.Mesh.prototype );
THREE.Fire.prototype.constructor = THREE.Fire;

THREE.Fire.SourceShader = {

	uniforms: {
		'sourceMap': {
			type: 't',
			value: null
		},
		'densityMap': {
			type: 't',
			value: null
		}
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		' 	  vUv = uv;',

		'     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
		'     gl_Position = projectionMatrix * mvPosition;',

		'}'

	].join( "\n" ),

	fragmentShader: [
		'uniform sampler2D sourceMap;',
		'uniform sampler2D densityMap;',

		'varying vec2 vUv;',

		'void main() {',
		'    vec4 source = texture2D( sourceMap, vUv );',
		'    vec4 current = texture2D( densityMap, vUv );',

		'    vec2 v0 = (current.gb - step(0.5, current.gb)) * 2.0;',
		'    vec2 v1 = (source.gb - step(0.5, source.gb)) * 2.0;',

		'    vec2 newVel = v0 + v1;',

		'    newVel = clamp(newVel, -0.99, 0.99);',
		'    newVel = newVel * 0.5 + step(0.0, -newVel);',

		'    float newDensity = source.r + current.a;',
		'    float newTemp = source.r + current.r;',

		'    newDensity = clamp(newDensity, 0.0, 1.0);',
		'    newTemp = clamp(newTemp, 0.0, 1.0);',

		'    gl_FragColor = vec4(newTemp, newVel.xy, newDensity);',

		'}'

	].join( "\n" )
};


THREE.Fire.DiffuseShader = {

	uniforms: {
		'oneOverWidth': {
			type: 'f',
			value: null
		},
		'oneOverHeight': {
			type: 'f',
			value: null
		},
		'diffuse': {
			type: 'f',
			value: null
		},
		'viscosity': {
			type: 'f',
			value: null
		},
		'expansion': {
			type: 'f',
			value: null
		},
		'swirl': {
			type: 'f',
			value: null
		},
		'drag': {
			type: 'f',
			value: null
		},
		'burnRate': {
			type: 'f',
			value: null
		},
		'densityMap': {
			type: 't',
			value: null
		}
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		' 	  vUv = uv;',

		'     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
		'     gl_Position = projectionMatrix * mvPosition;',

		'}'

	].join( "\n" ),

	fragmentShader: [
		'uniform float oneOverWidth;',
		'uniform float oneOverHeight;',
		'uniform float diffuse;',
		'uniform float viscosity;',
		'uniform float expansion;',
		'uniform float swirl;',
		'uniform float burnRate;',
		'uniform float drag;',
		'uniform sampler2D densityMap;',

		'varying vec2 vUv;',

		'void main() {',

		'    vec4 dC = texture2D( densityMap, vUv );',
		'    vec4 dL = texture2D( densityMap, vec2(vUv.x - oneOverWidth, vUv.y) );',
		'    vec4 dR = texture2D( densityMap, vec2(vUv.x + oneOverWidth, vUv.y) );',
		'    vec4 dU = texture2D( densityMap, vec2(vUv.x, vUv.y - oneOverHeight) );',
		'    vec4 dD = texture2D( densityMap, vec2(vUv.x, vUv.y + oneOverHeight) );',
		'    vec4 dUL = texture2D( densityMap, vec2(vUv.x - oneOverWidth, vUv.y - oneOverHeight) );',
		'    vec4 dUR = texture2D( densityMap, vec2(vUv.x + oneOverWidth, vUv.y - oneOverHeight) );',
		'    vec4 dDL = texture2D( densityMap, vec2(vUv.x - oneOverWidth, vUv.y + oneOverHeight) );',
		'    vec4 dDR = texture2D( densityMap, vec2(vUv.x + oneOverWidth, vUv.y + oneOverHeight) );',

		'    dC.yz = (dC.yz - step(0.5, dC.yz)) * 2.0;',
		'    dL.yz = (dL.yz - step(0.5, dL.yz)) * 2.0;',
		'    dR.yz = (dR.yz - step(0.5, dR.yz)) * 2.0;',
		'    dU.yz = (dU.yz - step(0.5, dU.yz)) * 2.0;',
		'    dD.yz = (dD.yz - step(0.5, dD.yz)) * 2.0;',
		'    dUL.yz = (dUL.yz - step(0.5, dUL.yz)) * 2.0;',
		'    dUR.yz = (dUR.yz - step(0.5, dUR.yz)) * 2.0;',
		'    dDL.yz = (dDL.yz - step(0.5, dDL.yz)) * 2.0;',
		'    dDR.yz = (dDR.yz - step(0.5, dDR.yz)) * 2.0;',

		'    vec4 result = (dC + vec4(diffuse, viscosity, viscosity, diffuse) * ( dL + dR + dU + dD + dUL + dUR + dDL + dDR )) / (1.0 + 8.0 * vec4(diffuse, viscosity, viscosity, diffuse)) - vec4(0.0, 0.0, 0.0, 0.001);',

		'    float temperature = result.r;',
		'    temperature = clamp(temperature - burnRate, 0.0, 1.0);',

		'    vec2 velocity = result.yz;',

		'    vec2 expansionVec = vec2(dL.w - dR.w, dU.w - dD.w);',

		'    vec2 swirlVec = vec2((dL.z - dR.z) * 0.5, (dU.y - dD.y) * 0.5);',

		'    velocity = velocity + (1.0 - expansion) * expansionVec + (1.0 - swirl) * swirlVec;',

		'    velocity = velocity - (1.0 - drag) * velocity;',

		'    gl_FragColor = vec4(temperature, velocity * 0.5 + step(0.0, -velocity), result.w);',

		'    gl_FragColor = gl_FragColor * step(oneOverWidth, vUv.x);',
		'    gl_FragColor = gl_FragColor * step(oneOverHeight, vUv.y);',
		'    gl_FragColor = gl_FragColor * step(vUv.x, 1.0 - oneOverWidth);',
		'    gl_FragColor = gl_FragColor * step(vUv.y, 1.0 - oneOverHeight);',

		'}'

	].join( "\n" )
};

THREE.Fire.DriftShader = {

	uniforms: {
		'oneOverWidth': {
			type: 'f',
			value: null
		},
		'oneOverHeight': {
			type: 'f',
			value: null
		},
		'windVector': {
			type: 'v2',
			value: new THREE.Vector2( 0.0, 0.0 )
		},
		'airSpeed': {
			type: 'f',
			value: null
		},
		'densityMap': {
			type: 't',
			value: null
		}
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		' 	  vUv = uv;',

		'     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
		'     gl_Position = projectionMatrix * mvPosition;',

		'}'

	].join( "\n" ),

	fragmentShader: [
		'uniform float oneOverWidth;',
		'uniform float oneOverHeight;',
		'uniform vec2 windVector;',
		'uniform float airSpeed;',
		'uniform sampler2D densityMap;',

		'varying vec2 vUv;',

		'void main() {',
		'    vec2 velocity = texture2D( densityMap, vUv ).gb;',
		'    velocity = (velocity - step(0.5, velocity)) * 2.0;',

		'    velocity = velocity + windVector;',

		'    vec2 sourcePos = vUv - airSpeed * vec2(oneOverWidth, oneOverHeight) * velocity;',

		'    vec2 units = sourcePos / vec2(oneOverWidth, oneOverHeight);',

		'    vec2 intPos = floor(units);',
		'    vec2 frac = units - intPos;',
		'    intPos = intPos * vec2(oneOverWidth, oneOverHeight);',

		'    vec4 dX0Y0 = texture2D( densityMap, intPos + vec2(0.0, -oneOverHeight) );',
		'    vec4 dX1Y0 = texture2D( densityMap, intPos + vec2(oneOverWidth, 0.0) );',
		'    vec4 dX0Y1 = texture2D( densityMap, intPos + vec2(0.0, oneOverHeight) );',
		'    vec4 dX1Y1 = texture2D( densityMap, intPos + vec2(oneOverWidth, oneOverHeight) );',


		'    dX0Y0.gb = (dX0Y0.gb - step(0.5, dX0Y0.gb)) * 2.0;',
		'    dX1Y0.gb = (dX1Y0.gb - step(0.5, dX1Y0.gb)) * 2.0;',
		'    dX0Y1.gb = (dX0Y1.gb - step(0.5, dX0Y1.gb)) * 2.0;',
		'    dX1Y1.gb = (dX1Y1.gb - step(0.5, dX1Y1.gb)) * 2.0;',

		'    vec4 source = mix(mix(dX0Y0, dX1Y0, frac.x), mix(dX0Y1, dX1Y1, frac.x), frac.y);',

		'    source.gb = source.gb * 0.5 + step(0.0, -source.gb);',

		'    gl_FragColor = source;',

		'}'

	].join( "\n" )
};


THREE.Fire.ProjectionShader1 = {

	uniforms: {
		'oneOverWidth': {
			type: 'f',
			value: null
		},
		'oneOverHeight': {
			type: 'f',
			value: null
		},
		'densityMap': {
			type: 't',
			value: null
		}
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		' 	  vUv = uv;',

		'     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
		'     gl_Position = projectionMatrix * mvPosition;',

		'}'

	].join( "\n" ),

	fragmentShader: [
		'uniform float oneOverWidth;',
		'uniform float oneOverHeight;',
		'uniform sampler2D densityMap;',

		'varying vec2 vUv;',

		'void main() {',
		'    float dL = texture2D( densityMap, vec2(vUv.x - oneOverWidth, vUv.y) ).g;',
		'    float dR = texture2D( densityMap, vec2(vUv.x + oneOverWidth, vUv.y) ).g;',
		'    float dU = texture2D( densityMap, vec2(vUv.x, vUv.y - oneOverHeight) ).b;',
		'    float dD = texture2D( densityMap, vec2(vUv.x, vUv.y + oneOverHeight) ).b;',

		'    dL = (dL - step(0.5, dL)) * 2.0;',
		'    dR = (dR - step(0.5, dR)) * 2.0;',
		'    dU = (dU - step(0.5, dU)) * 2.0;',
		'    dD = (dD - step(0.5, dD)) * 2.0;',

		'    float h = (oneOverWidth + oneOverHeight) * 0.5;',
		'    float div = -0.5 * h * (dR - dL + dD - dU);',

		'    gl_FragColor = vec4( 0.0, 0.0, div * 0.5 + step(0.0, -div), 0.0);',

		'}'

	].join( "\n" )
};


THREE.Fire.ProjectionShader2 = {

	uniforms: {
		'oneOverWidth': {
			type: 'f',
			value: null
		},
		'oneOverHeight': {
			type: 'f',
			value: null
		},
		'densityMap': {
			type: 't',
			value: null
		}
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		' 	  vUv = uv;',

		'     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
		'     gl_Position = projectionMatrix * mvPosition;',

		'}'

	].join( "\n" ),

	fragmentShader: [
		'uniform float oneOverWidth;',
		'uniform float oneOverHeight;',
		'uniform sampler2D densityMap;',

		'varying vec2 vUv;',

		'void main() {',
		'    float div = texture2D( densityMap, vUv ).b;',
		'    float pL = texture2D( densityMap, vec2(vUv.x - oneOverWidth, vUv.y) ).g;',
		'    float pR = texture2D( densityMap, vec2(vUv.x + oneOverWidth, vUv.y) ).g;',
		'    float pU = texture2D( densityMap, vec2(vUv.x, vUv.y - oneOverHeight) ).g;',
		'    float pD = texture2D( densityMap, vec2(vUv.x, vUv.y + oneOverHeight) ).g;',

		'    float divNorm = (div - step(0.5, div)) * 2.0;',
		'    pL = (pL - step(0.5, pL)) * 2.0;',
		'    pR = (pR - step(0.5, pR)) * 2.0;',
		'    pU = (pU - step(0.5, pU)) * 2.0;',
		'    pD = (pD - step(0.5, pD)) * 2.0;',

		'    float p = (divNorm + pR + pL + pD + pU) * 0.25;',

		'    gl_FragColor = vec4( 0.0, p * 0.5 + step(0.0, -p), div, 0.0);',

		'}'

	].join( "\n" )
};


THREE.Fire.ProjectionShader3 = {

	uniforms: {
		'oneOverWidth': {
			type: 'f',
			value: null
		},
		'oneOverHeight': {
			type: 'f',
			value: null
		},
		'densityMap': {
			type: 't',
			value: null
		},
		'projMap': {
			type: 't',
			value: null
		}
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		' 	  vUv = uv;',

		'     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
		'     gl_Position = projectionMatrix * mvPosition;',

		'}'

	].join( "\n" ),

	fragmentShader: [
		'uniform float oneOverWidth;',
		'uniform float oneOverHeight;',
		'uniform sampler2D densityMap;',
		'uniform sampler2D projMap;',

		'varying vec2 vUv;',

		'void main() {',
		'    vec4 orig = texture2D(densityMap, vUv);',

		'    float pL = texture2D( projMap, vec2(vUv.x - oneOverWidth, vUv.y) ).g;',
		'    float pR = texture2D( projMap, vec2(vUv.x + oneOverWidth, vUv.y) ).g;',
		'    float pU = texture2D( projMap, vec2(vUv.x, vUv.y - oneOverHeight) ).g;',
		'    float pD = texture2D( projMap, vec2(vUv.x, vUv.y + oneOverHeight) ).g;',

		'    float uNorm = (orig.g - step(0.5, orig.g)) * 2.0;',
		'    float vNorm = (orig.b - step(0.5, orig.b)) * 2.0;',

		'    pL = (pL - step(0.5, pL)) * 2.0;',
		'    pR = (pR - step(0.5, pR)) * 2.0;',
		'    pU = (pU - step(0.5, pU)) * 2.0;',
		'    pD = (pD - step(0.5, pD)) * 2.0;',

		'    float h = (oneOverWidth + oneOverHeight) * 0.5;',
		'    float u = uNorm - (0.5 * (pR - pL) / h);',
		'    float v = vNorm - (0.5 * (pD - pU) / h);',

		'    gl_FragColor = vec4( orig.r, u * 0.5 + step(0.0, -u), v * 0.5 + step(0.0, -v), orig.a);',

		'}'

	].join( "\n" )
};

THREE.Fire.ColorShader = {

	uniforms: {
		'color1': {
			type: 'c',
			value: null
		},
		'color2': {
			type: 'c',
			value: null
		},
		'color3': {
			type: 'c',
			value: null
		},
		'colorBias': {
			type: 'f',
			value: null
		},
		'densityMap': {
			type: 't',
			value: null
		}
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		' 	  vUv = uv;',

		'     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
		'     gl_Position = projectionMatrix * mvPosition;',

		'}'

	].join( "\n" ),

	fragmentShader: [
		'uniform vec3 color1;',
		'uniform vec3 color2;',
		'uniform vec3 color3;',
		'uniform float colorBias;',
		'uniform sampler2D densityMap;',

		'varying vec2 vUv;',

		'void main() {',
		'    float density = texture2D( densityMap, vUv ).a;',
		'    float temperature = texture2D( densityMap, vUv ).r;',

		'    float bias = clamp(colorBias, 0.0001, 0.9999);',

		'    vec3 blend1 = mix(color3, color2, temperature / bias) * (1.0 - step(bias, temperature));',
		'    vec3 blend2 = mix(color2, color1, (temperature - bias) / (1.0 - bias) ) * step(bias, temperature);',

		'    gl_FragColor = vec4(blend1 + blend2, density);',
		'}'

	].join( "\n" )
};


THREE.Fire.DebugShader = {

	uniforms: {
		'color1': {
			type: 'c',
			value: null
		},
		'color2': {
			type: 'c',
			value: null
		},
		'color3': {
			type: 'c',
			value: null
		},
		'colorBias': {
			type: 'f',
			value: null
		},
		'densityMap': {
			type: 't',
			value: null
		}
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		' 	  vUv = uv;',

		'     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
		'     gl_Position = projectionMatrix * mvPosition;',

		'}'

	].join( "\n" ),

	fragmentShader: [
		'uniform sampler2D densityMap;',

		'varying vec2 vUv;',

		'void main() {',
		'    float density;',
		'    density = texture2D( densityMap, vUv ).a;',

		'    vec2 vel = texture2D( densityMap, vUv ).gb;',

		'    vel = (vel - step(0.5, vel)) * 2.0;',

		'    float r = density;',
		'    float g = max(abs(vel.x), density * 0.5);',
		'    float b = max(abs(vel.y), density * 0.5);',
		'    float a = max(density * 0.5, max(abs(vel.x), abs(vel.y)));',

		'    gl_FragColor = vec4(r, g, b, a);',

		'}'

	].join( "\n" )
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
},{}]},{},["../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/hmr-runtime.js","node_modules/three/examples/js/objects/Fire.js"], null)
//# sourceMappingURL=/Fire.e9fb3604.map