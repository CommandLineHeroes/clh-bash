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
})({"node_modules/three/examples/js/loaders/OBJLoader.js":[function(require,module,exports) {
/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.OBJLoader = ( function () {

	// o object_name | g group_name
	var object_pattern = /^[og]\s*(.+)?/;
	// mtllib file_reference
	var material_library_pattern = /^mtllib /;
	// usemtl material_name
	var material_use_pattern = /^usemtl /;

	function ParserState() {

		var state = {
			objects: [],
			object: {},

			vertices: [],
			normals: [],
			colors: [],
			uvs: [],

			materialLibraries: [],

			startObject: function ( name, fromDeclaration ) {

				// If the current object (initial from reset) is not from a g/o declaration in the parsed
				// file. We need to use it for the first parsed g/o to keep things in sync.
				if ( this.object && this.object.fromDeclaration === false ) {

					this.object.name = name;
					this.object.fromDeclaration = ( fromDeclaration !== false );
					return;

				}

				var previousMaterial = ( this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined );

				if ( this.object && typeof this.object._finalize === 'function' ) {

					this.object._finalize( true );

				}

				this.object = {
					name: name || '',
					fromDeclaration: ( fromDeclaration !== false ),

					geometry: {
						vertices: [],
						normals: [],
						colors: [],
						uvs: []
					},
					materials: [],
					smooth: true,

					startMaterial: function ( name, libraries ) {

						var previous = this._finalize( false );

						// New usemtl declaration overwrites an inherited material, except if faces were declared
						// after the material, then it must be preserved for proper MultiMaterial continuation.
						if ( previous && ( previous.inherited || previous.groupCount <= 0 ) ) {

							this.materials.splice( previous.index, 1 );

						}

						var material = {
							index: this.materials.length,
							name: name || '',
							mtllib: ( Array.isArray( libraries ) && libraries.length > 0 ? libraries[ libraries.length - 1 ] : '' ),
							smooth: ( previous !== undefined ? previous.smooth : this.smooth ),
							groupStart: ( previous !== undefined ? previous.groupEnd : 0 ),
							groupEnd: - 1,
							groupCount: - 1,
							inherited: false,

							clone: function ( index ) {

								var cloned = {
									index: ( typeof index === 'number' ? index : this.index ),
									name: this.name,
									mtllib: this.mtllib,
									smooth: this.smooth,
									groupStart: 0,
									groupEnd: - 1,
									groupCount: - 1,
									inherited: false
								};
								cloned.clone = this.clone.bind( cloned );
								return cloned;

							}
						};

						this.materials.push( material );

						return material;

					},

					currentMaterial: function () {

						if ( this.materials.length > 0 ) {

							return this.materials[ this.materials.length - 1 ];

						}

						return undefined;

					},

					_finalize: function ( end ) {

						var lastMultiMaterial = this.currentMaterial();
						if ( lastMultiMaterial && lastMultiMaterial.groupEnd === - 1 ) {

							lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
							lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
							lastMultiMaterial.inherited = false;

						}

						// Ignore objects tail materials if no face declarations followed them before a new o/g started.
						if ( end && this.materials.length > 1 ) {

							for ( var mi = this.materials.length - 1; mi >= 0; mi -- ) {

								if ( this.materials[ mi ].groupCount <= 0 ) {

									this.materials.splice( mi, 1 );

								}

							}

						}

						// Guarantee at least one empty material, this makes the creation later more straight forward.
						if ( end && this.materials.length === 0 ) {

							this.materials.push( {
								name: '',
								smooth: this.smooth
							} );

						}

						return lastMultiMaterial;

					}
				};

				// Inherit previous objects material.
				// Spec tells us that a declared material must be set to all objects until a new material is declared.
				// If a usemtl declaration is encountered while this new object is being parsed, it will
				// overwrite the inherited material. Exception being that there was already face declarations
				// to the inherited material, then it will be preserved for proper MultiMaterial continuation.

				if ( previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function' ) {

					var declared = previousMaterial.clone( 0 );
					declared.inherited = true;
					this.object.materials.push( declared );

				}

				this.objects.push( this.object );

			},

			finalize: function () {

				if ( this.object && typeof this.object._finalize === 'function' ) {

					this.object._finalize( true );

				}

			},

			parseVertexIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;

			},

			parseNormalIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;

			},

			parseUVIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 2 ) * 2;

			},

			addVertex: function ( a, b, c ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addVertexPoint: function ( a ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );

			},

			addVertexLine: function ( a ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );

			},

			addNormal: function ( a, b, c ) {

				var src = this.normals;
				var dst = this.object.geometry.normals;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addColor: function ( a, b, c ) {

				var src = this.colors;
				var dst = this.object.geometry.colors;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addUV: function ( a, b, c ) {

				var src = this.uvs;
				var dst = this.object.geometry.uvs;

				dst.push( src[ a + 0 ], src[ a + 1 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ] );

			},

			addUVLine: function ( a ) {

				var src = this.uvs;
				var dst = this.object.geometry.uvs;

				dst.push( src[ a + 0 ], src[ a + 1 ] );

			},

			addFace: function ( a, b, c, ua, ub, uc, na, nb, nc ) {

				var vLen = this.vertices.length;

				var ia = this.parseVertexIndex( a, vLen );
				var ib = this.parseVertexIndex( b, vLen );
				var ic = this.parseVertexIndex( c, vLen );

				this.addVertex( ia, ib, ic );

				if ( ua !== undefined && ua !== '' ) {

					var uvLen = this.uvs.length;
					ia = this.parseUVIndex( ua, uvLen );
					ib = this.parseUVIndex( ub, uvLen );
					ic = this.parseUVIndex( uc, uvLen );
					this.addUV( ia, ib, ic );

				}

				if ( na !== undefined && na !== '' ) {

					// Normals are many times the same. If so, skip function call and parseInt.
					var nLen = this.normals.length;
					ia = this.parseNormalIndex( na, nLen );

					ib = na === nb ? ia : this.parseNormalIndex( nb, nLen );
					ic = na === nc ? ia : this.parseNormalIndex( nc, nLen );

					this.addNormal( ia, ib, ic );

				}

				if ( this.colors.length > 0 ) {

					this.addColor( ia, ib, ic );

				}

			},

			addPointGeometry: function ( vertices ) {

				this.object.geometry.type = 'Points';

				var vLen = this.vertices.length;

				for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {

					this.addVertexPoint( this.parseVertexIndex( vertices[ vi ], vLen ) );

				}

			},

			addLineGeometry: function ( vertices, uvs ) {

				this.object.geometry.type = 'Line';

				var vLen = this.vertices.length;
				var uvLen = this.uvs.length;

				for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {

					this.addVertexLine( this.parseVertexIndex( vertices[ vi ], vLen ) );

				}

				for ( var uvi = 0, l = uvs.length; uvi < l; uvi ++ ) {

					this.addUVLine( this.parseUVIndex( uvs[ uvi ], uvLen ) );

				}

			}

		};

		state.startObject( '', false );

		return state;

	}

	//

	function OBJLoader( manager ) {

		this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

		this.materials = null;

	}

	OBJLoader.prototype = {

		constructor: OBJLoader,

		load: function ( url, onLoad, onProgress, onError ) {

			var scope = this;

			var loader = new THREE.FileLoader( scope.manager );
			loader.setPath( this.path );
			loader.load( url, function ( text ) {

				onLoad( scope.parse( text ) );

			}, onProgress, onError );

		},

		setPath: function ( value ) {

			this.path = value;

			return this;

		},

		setMaterials: function ( materials ) {

			this.materials = materials;

			return this;

		},

		parse: function ( text ) {

			console.time( 'OBJLoader' );

			var state = new ParserState();

			if ( text.indexOf( '\r\n' ) !== - 1 ) {

				// This is faster than String.split with regex that splits on both
				text = text.replace( /\r\n/g, '\n' );

			}

			if ( text.indexOf( '\\\n' ) !== - 1 ) {

				// join lines separated by a line continuation character (\)
				text = text.replace( /\\\n/g, '' );

			}

			var lines = text.split( '\n' );
			var line = '', lineFirstChar = '';
			var lineLength = 0;
			var result = [];

			// Faster to just trim left side of the line. Use if available.
			var trimLeft = ( typeof ''.trimLeft === 'function' );

			for ( var i = 0, l = lines.length; i < l; i ++ ) {

				line = lines[ i ];

				line = trimLeft ? line.trimLeft() : line.trim();

				lineLength = line.length;

				if ( lineLength === 0 ) continue;

				lineFirstChar = line.charAt( 0 );

				// @todo invoke passed in handler if any
				if ( lineFirstChar === '#' ) continue;

				if ( lineFirstChar === 'v' ) {

					var data = line.split( /\s+/ );

					switch ( data[ 0 ] ) {

						case 'v':
							state.vertices.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] ),
								parseFloat( data[ 3 ] )
							);
							if ( data.length === 8 ) {

								state.colors.push(
									parseFloat( data[ 4 ] ),
									parseFloat( data[ 5 ] ),
									parseFloat( data[ 6 ] )

								);

							}
							break;
						case 'vn':
							state.normals.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] ),
								parseFloat( data[ 3 ] )
							);
							break;
						case 'vt':
							state.uvs.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] )
							);
							break;

					}

				} else if ( lineFirstChar === 'f' ) {

					var lineData = line.substr( 1 ).trim();
					var vertexData = lineData.split( /\s+/ );
					var faceVertices = [];

					// Parse the face vertex data into an easy to work with format

					for ( var j = 0, jl = vertexData.length; j < jl; j ++ ) {

						var vertex = vertexData[ j ];

						if ( vertex.length > 0 ) {

							var vertexParts = vertex.split( '/' );
							faceVertices.push( vertexParts );

						}

					}

					// Draw an edge between the first vertex and all subsequent vertices to form an n-gon

					var v1 = faceVertices[ 0 ];

					for ( var j = 1, jl = faceVertices.length - 1; j < jl; j ++ ) {

						var v2 = faceVertices[ j ];
						var v3 = faceVertices[ j + 1 ];

						state.addFace(
							v1[ 0 ], v2[ 0 ], v3[ 0 ],
							v1[ 1 ], v2[ 1 ], v3[ 1 ],
							v1[ 2 ], v2[ 2 ], v3[ 2 ]
						);

					}

				} else if ( lineFirstChar === 'l' ) {

					var lineParts = line.substring( 1 ).trim().split( " " );
					var lineVertices = [], lineUVs = [];

					if ( line.indexOf( "/" ) === - 1 ) {

						lineVertices = lineParts;

					} else {

						for ( var li = 0, llen = lineParts.length; li < llen; li ++ ) {

							var parts = lineParts[ li ].split( "/" );

							if ( parts[ 0 ] !== "" ) lineVertices.push( parts[ 0 ] );
							if ( parts[ 1 ] !== "" ) lineUVs.push( parts[ 1 ] );

						}

					}
					state.addLineGeometry( lineVertices, lineUVs );

				} else if ( lineFirstChar === 'p' ) {

					var lineData = line.substr( 1 ).trim();
					var pointData = lineData.split( " " );

					state.addPointGeometry( pointData );

				} else if ( ( result = object_pattern.exec( line ) ) !== null ) {

					// o object_name
					// or
					// g group_name

					// WORKAROUND: https://bugs.chromium.org/p/v8/issues/detail?id=2869
					// var name = result[ 0 ].substr( 1 ).trim();
					var name = ( " " + result[ 0 ].substr( 1 ).trim() ).substr( 1 );

					state.startObject( name );

				} else if ( material_use_pattern.test( line ) ) {

					// material

					state.object.startMaterial( line.substring( 7 ).trim(), state.materialLibraries );

				} else if ( material_library_pattern.test( line ) ) {

					// mtl file

					state.materialLibraries.push( line.substring( 7 ).trim() );

				} else if ( lineFirstChar === 's' ) {

					result = line.split( ' ' );

					// smooth shading

					// @todo Handle files that have varying smooth values for a set of faces inside one geometry,
					// but does not define a usemtl for each face set.
					// This should be detected and a dummy material created (later MultiMaterial and geometry groups).
					// This requires some care to not create extra material on each smooth value for "normal" obj files.
					// where explicit usemtl defines geometry groups.
					// Example asset: examples/models/obj/cerberus/Cerberus.obj

					/*
					 * http://paulbourke.net/dataformats/obj/
					 * or
					 * http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf
					 *
					 * From chapter "Grouping" Syntax explanation "s group_number":
					 * "group_number is the smoothing group number. To turn off smoothing groups, use a value of 0 or off.
					 * Polygonal elements use group numbers to put elements in different smoothing groups. For free-form
					 * surfaces, smoothing groups are either turned on or off; there is no difference between values greater
					 * than 0."
					 */
					if ( result.length > 1 ) {

						var value = result[ 1 ].trim().toLowerCase();
						state.object.smooth = ( value !== '0' && value !== 'off' );

					} else {

						// ZBrush can produce "s" lines #11707
						state.object.smooth = true;

					}
					var material = state.object.currentMaterial();
					if ( material ) material.smooth = state.object.smooth;

				} else {

					// Handle null terminated files without exception
					if ( line === '\0' ) continue;

					throw new Error( 'THREE.OBJLoader: Unexpected line: "' + line + '"' );

				}

			}

			state.finalize();

			var container = new THREE.Group();
			container.materialLibraries = [].concat( state.materialLibraries );

			for ( var i = 0, l = state.objects.length; i < l; i ++ ) {

				var object = state.objects[ i ];
				var geometry = object.geometry;
				var materials = object.materials;
				var isLine = ( geometry.type === 'Line' );
				var isPoints = ( geometry.type === 'Points' );
				var hasVertexColors = false;

				// Skip o/g line declarations that did not follow with any faces
				if ( geometry.vertices.length === 0 ) continue;

				var buffergeometry = new THREE.BufferGeometry();

				buffergeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( geometry.vertices, 3 ) );

				if ( geometry.normals.length > 0 ) {

					buffergeometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( geometry.normals, 3 ) );

				} else {

					buffergeometry.computeVertexNormals();

				}

				if ( geometry.colors.length > 0 ) {

					hasVertexColors = true;
					buffergeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( geometry.colors, 3 ) );

				}

				if ( geometry.uvs.length > 0 ) {

					buffergeometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( geometry.uvs, 2 ) );

				}

				// Create materials

				var createdMaterials = [];

				for ( var mi = 0, miLen = materials.length; mi < miLen; mi ++ ) {

					var sourceMaterial = materials[ mi ];
					var material = undefined;

					if ( this.materials !== null ) {

						material = this.materials.create( sourceMaterial.name );

						// mtl etc. loaders probably can't create line materials correctly, copy properties to a line material.
						if ( isLine && material && ! ( material instanceof THREE.LineBasicMaterial ) ) {

							var materialLine = new THREE.LineBasicMaterial();
							THREE.Material.prototype.copy.call( materialLine, material );
							materialLine.color.copy( material.color );
							materialLine.lights = false;
							material = materialLine;

						} else if ( isPoints && material && ! ( material instanceof THREE.PointsMaterial ) ) {

							var materialPoints = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
							THREE.Material.prototype.copy.call( materialPoints, material );
							materialPoints.color.copy( material.color );
							materialPoints.map = material.map;
							materialPoints.lights = false;
							material = materialPoints;

						}

					}

					if ( ! material ) {

						if ( isLine ) {

							material = new THREE.LineBasicMaterial();

						} else if ( isPoints ) {

							material = new THREE.PointsMaterial( { size: 1, sizeAttenuation: false } );

						} else {

							material = new THREE.MeshPhongMaterial();

						}

						material.name = sourceMaterial.name;

					}

					material.flatShading = sourceMaterial.smooth ? false : true;
					material.vertexColors = hasVertexColors ? THREE.VertexColors : THREE.NoColors;

					createdMaterials.push( material );

				}

				// Create mesh

				var mesh;

				if ( createdMaterials.length > 1 ) {

					for ( var mi = 0, miLen = materials.length; mi < miLen; mi ++ ) {

						var sourceMaterial = materials[ mi ];
						buffergeometry.addGroup( sourceMaterial.groupStart, sourceMaterial.groupCount, mi );

					}

					if ( isLine ) {

						mesh = new THREE.LineSegments( buffergeometry, createdMaterials );

					} else if ( isPoints ) {

						mesh = new THREE.Points( buffergeometry, createdMaterials );

					} else {

						mesh = new THREE.Mesh( buffergeometry, createdMaterials );

					}

				} else {

					if ( isLine ) {

						mesh = new THREE.LineSegments( buffergeometry, createdMaterials[ 0 ] );

					} else if ( isPoints ) {

						mesh = new THREE.Points( buffergeometry, createdMaterials[ 0 ] );

					} else {

						mesh = new THREE.Mesh( buffergeometry, createdMaterials[ 0 ] );

					}

				}

				mesh.name = object.name;

				container.add( mesh );

			}

			console.timeEnd( 'OBJLoader' );

			return container;

		}

	};

	return OBJLoader;

} )();

},{}],"node_modules/three/examples/js/controls/OrbitControls.js":[function(require,module,exports) {
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

THREE.OrbitControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Set to false to disable panning
	this.enablePan = true;
	this.panSpeed = 1.0;
	this.screenSpacePanning = false; // if true, pan in screen-space
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { LEFT: THREE.MOUSE.LEFT, MIDDLE: THREE.MOUSE.MIDDLE, RIGHT: THREE.MOUSE.RIGHT };

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

	};

	this.saveState = function () {

		scope.target0.copy( scope.target );
		scope.position0.copy( scope.object.position );
		scope.zoom0 = scope.object.zoom;

	};

	this.reset = function () {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function () {

		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update() {

			var position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();


			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location
			scope.target.add( panOffset );

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

				panOffset.multiplyScalar( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

				panOffset.set( 0, 0, 0 );

			}

			scale = 1;

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function () {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		window.removeEventListener( 'keydown', onKeyDown, false );

		//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4 };

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	var panLeft = function () {

		var v = new THREE.Vector3();

		return function panLeft( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	var panUp = function () {

		var v = new THREE.Vector3();

		return function panUp( distance, objectMatrix ) {

			if ( scope.screenSpacePanning === true ) {

				v.setFromMatrixColumn( objectMatrix, 1 );

			} else {

				v.setFromMatrixColumn( objectMatrix, 0 );
				v.crossVectors( scope.object.up, v );

			}

			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function () {

		var offset = new THREE.Vector3();

		return function pan( deltaX, deltaY ) {

			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

			if ( scope.object.isPerspectiveCamera ) {

				// perspective
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

				// we use only clientHeight here so aspect ratio does not distort speed
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

			} else if ( scope.object.isOrthographicCamera ) {

				// orthographic
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

			} else {

				// camera neither orthographic nor perspective
				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
				scope.enablePan = false;

			}

		};

	}();

	function dollyIn( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	function dollyOut( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {

		//console.log( 'handleMouseDownRotate' );

		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

		//console.log( 'handleMouseDownDolly' );

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		//console.log( 'handleMouseDownPan' );

		panStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		//console.log( 'handleMouseMoveRotate' );

		rotateEnd.set( event.clientX, event.clientY );

		rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		//console.log( 'handleMouseMoveDolly' );

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {

		//console.log( 'handleMouseMovePan' );

		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleMouseUp( event ) {

		// console.log( 'handleMouseUp' );

	}

	function handleMouseWheel( event ) {

		// console.log( 'handleMouseWheel' );

		if ( event.deltaY < 0 ) {

			dollyOut( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			dollyIn( getZoomScale() );

		}

		scope.update();

	}

	function handleKeyDown( event ) {

		//console.log( 'handleKeyDown' );

		switch ( event.keyCode ) {

			case scope.keys.UP:
				pan( 0, scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.BOTTOM:
				pan( 0, - scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.LEFT:
				pan( scope.keyPanSpeed, 0 );
				scope.update();
				break;

			case scope.keys.RIGHT:
				pan( - scope.keyPanSpeed, 0 );
				scope.update();
				break;

		}

	}

	function handleTouchStartRotate( event ) {

		//console.log( 'handleTouchStartRotate' );

		rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchStartDollyPan( event ) {

		//console.log( 'handleTouchStartDollyPan' );

		if ( scope.enableZoom ) {

			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

			var distance = Math.sqrt( dx * dx + dy * dy );

			dollyStart.set( 0, distance );

		}

		if ( scope.enablePan ) {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			panStart.set( x, y );

		}

	}

	function handleTouchMoveRotate( event ) {

		//console.log( 'handleTouchMoveRotate' );

		rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleTouchMoveDollyPan( event ) {

		//console.log( 'handleTouchMoveDollyPan' );

		if ( scope.enableZoom ) {

			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

			var distance = Math.sqrt( dx * dx + dy * dy );

			dollyEnd.set( 0, distance );

			dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );

			dollyIn( dollyDelta.y );

			dollyStart.copy( dollyEnd );

		}

		if ( scope.enablePan ) {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			panEnd.set( x, y );

			panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );

			pan( panDelta.x, panDelta.y );

			panStart.copy( panEnd );

		}

		scope.update();

	}

	function handleTouchEnd( event ) {

		//console.log( 'handleTouchEnd' );

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( event.button ) {

			case scope.mouseButtons.LEFT:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( scope.enablePan === false ) return;

					handleMouseDownPan( event );

					state = STATE.PAN;

				} else {

					if ( scope.enableRotate === false ) return;

					handleMouseDownRotate( event );

					state = STATE.ROTATE;

				}

				break;

			case scope.mouseButtons.MIDDLE:

				if ( scope.enableZoom === false ) return;

				handleMouseDownDolly( event );

				state = STATE.DOLLY;

				break;

			case scope.mouseButtons.RIGHT:

				if ( scope.enablePan === false ) return;

				handleMouseDownPan( event );

				state = STATE.PAN;

				break;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( state ) {

			case STATE.ROTATE:

				if ( scope.enableRotate === false ) return;

				handleMouseMoveRotate( event );

				break;

			case STATE.DOLLY:

				if ( scope.enableZoom === false ) return;

				handleMouseMoveDolly( event );

				break;

			case STATE.PAN:

				if ( scope.enablePan === false ) return;

				handleMouseMovePan( event );

				break;

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;

		handleMouseUp( event );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		scope.dispatchEvent( startEvent );

		handleMouseWheel( event );

		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;

				handleTouchStartRotate( event );

				state = STATE.TOUCH_ROTATE;

				break;

			case 2:	// two-fingered touch: dolly-pan

				if ( scope.enableZoom === false && scope.enablePan === false ) return;

				handleTouchStartDollyPan( event );

				state = STATE.TOUCH_DOLLY_PAN;

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return; // is this needed?

				handleTouchMoveRotate( event );

				break;

			case 2: // two-fingered touch: dolly-pan

				if ( scope.enableZoom === false && scope.enablePan === false ) return;
				if ( state !== STATE.TOUCH_DOLLY_PAN ) return; // is this needed?

				handleTouchMoveDollyPan( event );

				break;

			default:

				state = STATE.NONE;

		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		handleTouchEnd( event );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start

	this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties( THREE.OrbitControls.prototype, {

	center: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .center has been renamed to .target' );
			return this.target;

		}

	},

	// backward compatibility

	noZoom: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			return ! this.enableZoom;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			this.enableZoom = ! value;

		}

	},

	noRotate: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			return ! this.enableRotate;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			this.enableRotate = ! value;

		}

	},

	noPan: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			return ! this.enablePan;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			this.enablePan = ! value;

		}

	},

	noKeys: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			return ! this.enableKeys;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			this.enableKeys = ! value;

		}

	},

	staticMoving: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			return ! this.enableDamping;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			this.enableDamping = ! value;

		}

	},

	dynamicDampingFactor: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			return this.dampingFactor;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			this.dampingFactor = value;

		}

	}

} );

},{}],"node_modules/three/examples/js/controls/TrackballControls.js":[function(require,module,exports) {
/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 */

THREE.TrackballControls = function ( object, domElement ) {

	var _this = this;
	var STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.screen = { left: 0, top: 0, width: 0, height: 0 };

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals

	this.target = new THREE.Vector3();

	var EPS = 0.000001;

	var lastPosition = new THREE.Vector3();

	var _state = STATE.NONE,
		_prevState = STATE.NONE,

		_eye = new THREE.Vector3(),

		_movePrev = new THREE.Vector2(),
		_moveCurr = new THREE.Vector2(),

		_lastAxis = new THREE.Vector3(),
		_lastAngle = 0,

		_zoomStart = new THREE.Vector2(),
		_zoomEnd = new THREE.Vector2(),

		_touchZoomDistanceStart = 0,
		_touchZoomDistanceEnd = 0,

		_panStart = new THREE.Vector2(),
		_panEnd = new THREE.Vector2();

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();

	// events

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };


	// methods

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.screen.left = 0;
			this.screen.top = 0;
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;

		} else {

			var box = this.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = this.domElement.ownerDocument.documentElement;
			this.screen.left = box.left + window.pageXOffset - d.clientLeft;
			this.screen.top = box.top + window.pageYOffset - d.clientTop;
			this.screen.width = box.width;
			this.screen.height = box.height;

		}

	};

	var getMouseOnScreen = ( function () {

		var vector = new THREE.Vector2();

		return function getMouseOnScreen( pageX, pageY ) {

			vector.set(
				( pageX - _this.screen.left ) / _this.screen.width,
				( pageY - _this.screen.top ) / _this.screen.height
			);

			return vector;

		};

	}() );

	var getMouseOnCircle = ( function () {

		var vector = new THREE.Vector2();

		return function getMouseOnCircle( pageX, pageY ) {

			vector.set(
				( ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / ( _this.screen.width * 0.5 ) ),
				( ( _this.screen.height + 2 * ( _this.screen.top - pageY ) ) / _this.screen.width ) // screen.width intentional
			);

			return vector;

		};

	}() );

	this.rotateCamera = ( function () {

		var axis = new THREE.Vector3(),
			quaternion = new THREE.Quaternion(),
			eyeDirection = new THREE.Vector3(),
			objectUpDirection = new THREE.Vector3(),
			objectSidewaysDirection = new THREE.Vector3(),
			moveDirection = new THREE.Vector3(),
			angle;

		return function rotateCamera() {

			moveDirection.set( _moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0 );
			angle = moveDirection.length();

			if ( angle ) {

				_eye.copy( _this.object.position ).sub( _this.target );

				eyeDirection.copy( _eye ).normalize();
				objectUpDirection.copy( _this.object.up ).normalize();
				objectSidewaysDirection.crossVectors( objectUpDirection, eyeDirection ).normalize();

				objectUpDirection.setLength( _moveCurr.y - _movePrev.y );
				objectSidewaysDirection.setLength( _moveCurr.x - _movePrev.x );

				moveDirection.copy( objectUpDirection.add( objectSidewaysDirection ) );

				axis.crossVectors( moveDirection, _eye ).normalize();

				angle *= _this.rotateSpeed;
				quaternion.setFromAxisAngle( axis, angle );

				_eye.applyQuaternion( quaternion );
				_this.object.up.applyQuaternion( quaternion );

				_lastAxis.copy( axis );
				_lastAngle = angle;

			} else if ( ! _this.staticMoving && _lastAngle ) {

				_lastAngle *= Math.sqrt( 1.0 - _this.dynamicDampingFactor );
				_eye.copy( _this.object.position ).sub( _this.target );
				quaternion.setFromAxisAngle( _lastAxis, _lastAngle );
				_eye.applyQuaternion( quaternion );
				_this.object.up.applyQuaternion( quaternion );

			}

			_movePrev.copy( _moveCurr );

		};

	}() );


	this.zoomCamera = function () {

		var factor;

		if ( _state === STATE.TOUCH_ZOOM_PAN ) {

			factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			_eye.multiplyScalar( factor );

		} else {

			factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

			if ( factor !== 1.0 && factor > 0.0 ) {

				_eye.multiplyScalar( factor );

			}

			if ( _this.staticMoving ) {

				_zoomStart.copy( _zoomEnd );

			} else {

				_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

			}

		}

	};

	this.panCamera = ( function () {

		var mouseChange = new THREE.Vector2(),
			objectUp = new THREE.Vector3(),
			pan = new THREE.Vector3();

		return function panCamera() {

			mouseChange.copy( _panEnd ).sub( _panStart );

			if ( mouseChange.lengthSq() ) {

				mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

				pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
				pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );

				_this.object.position.add( pan );
				_this.target.add( pan );

				if ( _this.staticMoving ) {

					_panStart.copy( _panEnd );

				} else {

					_panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

				}

			}

		};

	}() );

	this.checkDistances = function () {

		if ( ! _this.noZoom || ! _this.noPan ) {

			if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );
				_zoomStart.copy( _zoomEnd );

			}

			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );
				_zoomStart.copy( _zoomEnd );

			}

		}

	};

	this.update = function () {

		_eye.subVectors( _this.object.position, _this.target );

		if ( ! _this.noRotate ) {

			_this.rotateCamera();

		}

		if ( ! _this.noZoom ) {

			_this.zoomCamera();

		}

		if ( ! _this.noPan ) {

			_this.panCamera();

		}

		_this.object.position.addVectors( _this.target, _eye );

		_this.checkDistances();

		_this.object.lookAt( _this.target );

		if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

			_this.dispatchEvent( changeEvent );

			lastPosition.copy( _this.object.position );

		}

	};

	this.reset = function () {

		_state = STATE.NONE;
		_prevState = STATE.NONE;

		_this.target.copy( _this.target0 );
		_this.object.position.copy( _this.position0 );
		_this.object.up.copy( _this.up0 );

		_eye.subVectors( _this.object.position, _this.target );

		_this.object.lookAt( _this.target );

		_this.dispatchEvent( changeEvent );

		lastPosition.copy( _this.object.position );

	};

	// listeners

	function keydown( event ) {

		if ( _this.enabled === false ) return;

		window.removeEventListener( 'keydown', keydown );

		_prevState = _state;

		if ( _state !== STATE.NONE ) {

			return;

		} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && ! _this.noRotate ) {

			_state = STATE.ROTATE;

		} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && ! _this.noZoom ) {

			_state = STATE.ZOOM;

		} else if ( event.keyCode === _this.keys[ STATE.PAN ] && ! _this.noPan ) {

			_state = STATE.PAN;

		}

	}

	function keyup( event ) {

		if ( _this.enabled === false ) return;

		_state = _prevState;

		window.addEventListener( 'keydown', keydown, false );

	}

	function mousedown( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.NONE ) {

			_state = event.button;

		}

		if ( _state === STATE.ROTATE && ! _this.noRotate ) {

			_moveCurr.copy( getMouseOnCircle( event.pageX, event.pageY ) );
			_movePrev.copy( _moveCurr );

		} else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

			_zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_zoomEnd.copy( _zoomStart );

		} else if ( _state === STATE.PAN && ! _this.noPan ) {

			_panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_panEnd.copy( _panStart );

		}

		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

		_this.dispatchEvent( startEvent );

	}

	function mousemove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.ROTATE && ! _this.noRotate ) {

			_movePrev.copy( _moveCurr );
			_moveCurr.copy( getMouseOnCircle( event.pageX, event.pageY ) );

		} else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

			_zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		} else if ( _state === STATE.PAN && ! _this.noPan ) {

			_panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		}

	}

	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		_state = STATE.NONE;

		document.removeEventListener( 'mousemove', mousemove );
		document.removeEventListener( 'mouseup', mouseup );
		_this.dispatchEvent( endEvent );

	}

	function mousewheel( event ) {

		if ( _this.enabled === false ) return;

		if ( _this.noZoom === true ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.deltaMode ) {

			case 2:
				// Zoom in pages
				_zoomStart.y -= event.deltaY * 0.025;
				break;

			case 1:
				// Zoom in lines
				_zoomStart.y -= event.deltaY * 0.01;
				break;

			default:
				// undefined, 0, assume pixels
				_zoomStart.y -= event.deltaY * 0.00025;
				break;

		}

		_this.dispatchEvent( startEvent );
		_this.dispatchEvent( endEvent );

	}

	function touchstart( event ) {

		if ( _this.enabled === false ) return;
		
		event.preventDefault();

		switch ( event.touches.length ) {

			case 1:
				_state = STATE.TOUCH_ROTATE;
				_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_movePrev.copy( _moveCurr );
				break;

			default: // 2 or more
				_state = STATE.TOUCH_ZOOM_PAN;
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panStart.copy( getMouseOnScreen( x, y ) );
				_panEnd.copy( _panStart );
				break;

		}

		_this.dispatchEvent( startEvent );

	}

	function touchmove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1:
				_movePrev.copy( _moveCurr );
				_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				break;

			default: // 2 or more
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panEnd.copy( getMouseOnScreen( x, y ) );
				break;

		}

	}

	function touchend( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 0:
				_state = STATE.NONE;
				break;

			case 1:
				_state = STATE.TOUCH_ROTATE;
				_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_movePrev.copy( _moveCurr );
				break;

		}

		_this.dispatchEvent( endEvent );

	}

	function contextmenu( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();

	}

	this.dispose = function () {

		this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
		this.domElement.removeEventListener( 'mousedown', mousedown, false );
		this.domElement.removeEventListener( 'wheel', mousewheel, false );

		this.domElement.removeEventListener( 'touchstart', touchstart, false );
		this.domElement.removeEventListener( 'touchend', touchend, false );
		this.domElement.removeEventListener( 'touchmove', touchmove, false );

		document.removeEventListener( 'mousemove', mousemove, false );
		document.removeEventListener( 'mouseup', mouseup, false );

		window.removeEventListener( 'keydown', keydown, false );
		window.removeEventListener( 'keyup', keyup, false );

	};

	this.domElement.addEventListener( 'contextmenu', contextmenu, false );
	this.domElement.addEventListener( 'mousedown', mousedown, false );
	this.domElement.addEventListener( 'wheel', mousewheel, false );

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', keydown, false );
	window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

	// force an update at start
	this.update();

};

THREE.TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.TrackballControls.prototype.constructor = THREE.TrackballControls;

},{}],"node_modules/three/examples/js/objects/Fire.js":[function(require,module,exports) {
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

},{}],"src/MTLLoaderPhysical.js":[function(require,module,exports) {
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
},{}],"src/palette.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var palette = {};

function cssVar(prop) {
  return window.getComputedStyle(document.body).getPropertyValue(prop).trim();
}

palette.white = cssVar("--clh-white");
palette.black = cssVar("--clh-black");
palette.purple = cssVar("--clh-purple");
palette.purple_light = cssVar("--clh-purple-light");
palette.yellow = cssVar("--clh-yellow");
palette.yellow_light = cssVar("--clh-yellow-light");
palette.orange = cssVar("--clh-orange");
palette.orange_light = cssVar("--clh-orange-light");
palette.blue = cssVar("--clh-blue");
palette.blue_light = cssVar("--clh-blue-light");
var _default = palette;
exports.default = _default;
},{}],"src/states.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  loading: "loading",
  title: "title",
  play: "play",
  score: "score",
  leaderboard: "leaderboard"
};
exports.default = _default;
},{}],"src/keycodes.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Useful keycodes!
 */
var _default = {
  // TODO: number row punctuation is included in one of these ranges.
  nums: {
    start: 48,
    end: 57
  },
  alpha: {
    start: 65,
    end: 90
  },
  punct: {
    start: 186,
    end: 222
  },
  enter: 13,
  left_arrow: 37,
  right_arrow: 39,
  backspace: 8,
  ctrl: 17
};
exports.default = _default;
},{}],"src/console-canvas.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _palette = _interopRequireDefault(require("./palette.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ConsoleCanvas =
/*#__PURE__*/
function () {
  function ConsoleCanvas() {
    _classCallCheck(this, ConsoleCanvas);

    this.conf = {
      WIDTH: 2 * 2048,
      HEIGHT: 2 * 2048,
      ASPECT: 0.7222,
      PAD_LEFT: 4 * 54,
      PAD_BOTTOM: 4 * 82,
      FONT_SIZE: 4 * 64,
      // px
      FONT_FAM: "overpass-mono",
      FONT_WEIGHT: "bold",
      LINE_SPACING: 4 * 14,
      // px
      PLAY_CHARS_PER_LINE: 44 // this will need to change if the font size in play mode changes

    }; // find the maximum number of lines of text that can be drawn (to avoid
    // performance problems if there are hundreds of thousands of lines

    this.conf.MAX_LINES = Math.ceil(this.conf.WIDTH / (this.conf.FONT_SIZE + this.conf.LINE_SPACING));
    console.log("maximum possible display lines: ".concat(this.conf.MAX_LINES)); // text on the screen

    var text = ""; // set up canvas element

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.conf.WIDTH;
    this.canvas.height = this.conf.HEIGHT;
    this.canvas.id = "console-canvas"; // set up canvas drawing context

    this.ctx = this.canvas.getContext("2d"); // scale the canvas pixel sizes so that the square canvas (must be sized to
    // powers of two) get scaled to the correct ratio for the 3D computer screen's
    // size.

    this.ctx.scale(this.conf.ASPECT, 1);
    document.body.appendChild(this.canvas);
  }
  /**
   * Write text onto the screen.  Also draws the score. If you don't want the
   * score to appear at the top-right, pass in score `false` (for instance,
   * on the title screen or leaderboard screen).
   */


  _createClass(ConsoleCanvas, [{
    key: "write",
    value: function write(text) {
      var score = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var timer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      this.ctx.font = "".concat(this.conf.FONT_WEIGHT, " ").concat(this.conf.FONT_SIZE, "px ").concat(this.conf.FONT_FAM);
      this.ctx.fillStyle = _palette.default.black;
      this.ctx.fillRect(0, 0, this.canvas.width / this.conf.ASPECT, this.canvas.height);
      this.ctx.fillStyle = _palette.default.yellow_light; // fillText doesn't do multi-line, so split the text and call fill text
      // multiple times

      var y_offset = 0;
      var line_count = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = text.split("\n").reverse()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var line = _step.value;
          this.ctx.fillText(line, this.conf.PAD_LEFT, this.canvas.height - this.conf.PAD_BOTTOM - y_offset);
          y_offset += this.conf.FONT_SIZE + this.conf.LINE_SPACING; // break if we've drawn the max number of display lines

          line_count += 1;
          if (line_count > this.conf.MAX_LINES) break;
        } // black out the top line whenever score or timer is being displayed

      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (score !== false || timer !== false) {
        this.ctx.fillStyle = _palette.default.black;
        this.ctx.fillRect(0, 0, this.canvas.width * 2, this.conf.FONT_SIZE * 2); // this.ctx.fillRect(0, 0, 1000, 1000);

        this.ctx.fillStyle = _palette.default.yellow_light;
      } // draw score and time remaining


      if (score !== false) {
        this.ctx.fillText("score: ".concat(score), this.conf.PAD_LEFT, this.conf.PAD_BOTTOM);
      }

      if (timer !== false) {
        this.ctx.fillText("timer: ".concat(timer), this.canvas.width - this.conf.PAD_LEFT, this.conf.PAD_BOTTOM);
      }
    }
  }]);

  return ConsoleCanvas;
}();

var consoleCanvas = new ConsoleCanvas();
window.consoleCanvas = consoleCanvas;
var _default = consoleCanvas;
exports.default = _default;
},{"./palette.js":"src/palette.js"}],"assets/cmds/bash.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/** Generated from generateBashCmds.js **/
var _default = {
  name: "bash",
  commonCmds: ["ls", "cd", "mv", "rm", "mkdir", "pwd", "cp", "file", "cat", "less", "wc", "du", "df", "dd", "touch", "sudo", "chown", "chgrp", "chmod", "rpm", "yum", "dnf", "grep", "find", "tar", "wget", "curl", "top", "cat", "vi", "passwd", "systemctl", "awk", "sed"],
  cmds: ["", "!", ".", "411toppm", ":", "GET", "HEAD", "Mail", "ModemManager", "NetworkManager", "POST", "VBoxClient", "VBoxClient-all", "VBoxControl", "VBoxService", "VGAuthService", "WebKitWebDriver", "X", "Xephyr", "Xorg", "Xvnc", "Xwayland", "[", "[[", "]]", "__HOSTNAME", "__SIZE", "__SLAVEURL", "__VOLNAME", "__expand_tilde_by_ref", "__get_cword_at_cursor_by_ref", "__grub_dir", "__grub_get_last_option", "__grub_get_options_from_help", "__grub_get_options_from_usage", "__grub_list_menuentries", "__grub_list_modules", "__grubcomp", "__load_completion", "__ltrim_colon_completions", "__parse_options", "__reassemble_comp_words_by_ref", "__vte_osc7", "__vte_prompt_command", "__vte_ps1", "__vte_urlencode", "_allowed_groups", "_allowed_users", "_apport-bug", "_apport-cli", "_apport-collect", "_apport-unpack", "_apport_parameterless", "_apport_symptoms", "_available_fcoe_interfaces", "_available_interfaces", "_cd", "_cd_devices", "_command", "_command_offset", "_complete_as_root", "_completion_loader", "_configured_interfaces", "_count_args", "_dkms", "_dog", "_dog_benchmark", "_dog_benchmark_io", "_dog_cluster", "_dog_cluster_alter-copy", "_dog_cluster_check", "_dog_cluster_format", "_dog_cluster_info", "_dog_cluster_recover", "_dog_cluster_reweight", "_dog_cluster_shutdown", "_dog_cluster_snapshot", "_dog_node", "_dog_node_format", "_dog_node_info", "_dog_node_kill", "_dog_node_list", "_dog_node_log", "_dog_node_md", "_dog_node_recovery", "_dog_node_stat", "_dog_node_vnodes", "_dog_upgrade", "_dog_upgrade_config-convert", "_dog_upgrade_epoch-convert", "_dog_upgrade_inode-convert", "_dog_upgrade_object-location", "_dog_vdi", "_dog_vdi_alter-copy", "_dog_vdi_backup", "_dog_vdi_check", "_dog_vdi_clone", "_dog_vdi_create", "_dog_vdi_delete", "_dog_vdi_getattr", "_dog_vdi_graph", "_dog_vdi_list", "_dog_vdi_lock", "_dog_vdi_object", "_dog_vdi_read", "_dog_vdi_resize", "_dog_vdi_restore", "_dog_vdi_rollback", "_dog_vdi_setattr", "_dog_vdi_snapshot", "_dog_vdi_track", "_dog_vdi_tree", "_dog_vdi_write", "_dvd_devices", "_expand", "_fcoeadm_options", "_fcoemon_options", "_filedir", "_filedir_xspec", "_filename_parts", "_fstypes", "_get_comp_words_by_ref", "_get_cword", "_get_first_arg", "_get_pword", "_gids", "_gluster_completion", "_gluster_does_match", "_gluster_form_list", "_gluster_goto_child", "_gluster_goto_end", "_gluster_handle_list", "_gluster_parse", "_gluster_pop", "_gluster_push", "_gluster_throw", "_grub_editenv", "_grub_install", "_grub_mkconfig", "_grub_mkfont", "_grub_mkimage", "_grub_mkpasswd_pbkdf2", "_grub_mkrescue", "_grub_probe", "_grub_script_check", "_grub_set_entry", "_grub_setup", "_have", "_included_ssh_config_files", "_init_completion", "_installed_modules", "_ip_addresses", "_kernel_versions", "_kernels", "_known_hosts", "_known_hosts_real", "_lldpad_options", "_lldptool_options", "_longopt", "_mac_addresses", "_minimal", "_module", "_module_avail", "_module_long_arg_list", "_module_not_yet_loaded", "_module_raw", "_module_savelist", "_modules", "_ncpus", "_parse_help", "_parse_usage", "_pci_ids", "_pgids", "_pids", "_pnames", "_quote_readline_by_ref", "_realcommand", "_rl_enabled", "_root_command", "_scl", "_service", "_services", "_shells", "_signals", "_split_longopt", "_subdirectories", "_sysvdirs", "_terms", "_tilde", "_uids", "_upvar", "_upvars", "_usb_ids", "_user_at_host", "_usergroup", "_userland", "_variables", "_xfunc", "_xinetd_services", "aa-enabled", "aa-exec", "aa-remove-unknown", "aa-status", "ab", "abrt-action-analyze-backtrace", "abrt-action-analyze-c", "abrt-action-analyze-ccpp-local", "abrt-action-analyze-core", "abrt-action-analyze-java", "abrt-action-analyze-oops", "abrt-action-analyze-python", "abrt-action-analyze-vmcore", "abrt-action-analyze-vulnerability", "abrt-action-analyze-xorg", "abrt-action-check-oops-for-alt-component", "abrt-action-check-oops-for-hw-error", "abrt-action-find-bodhi-update", "abrt-action-generate-backtrace", "abrt-action-generate-core-backtrace", "abrt-action-install-debuginfo", "abrt-action-list-dsos", "abrt-action-notify", "abrt-action-perform-ccpp-analysis", "abrt-action-save-package-data", "abrt-action-trim-files", "abrt-applet", "abrt-auto-reporting", "abrt-bodhi", "abrt-cli", "abrt-configuration", "abrt-dbus", "abrt-dump-journal-core", "abrt-dump-journal-oops", "abrt-dump-journal-xorg", "abrt-dump-oops", "abrt-dump-xorg", "abrt-handle-upload", "abrt-harvest-pstoreoops", "abrt-harvest-vmcore", "abrt-install-ccpp-hook", "abrt-merge-pstoreoops", "abrt-retrace-client", "abrt-server", "abrt-watch-log", "abrtd", "ac", "accept", "accessdb", "accton", "aconnect", "acpi", "acpi_available", "acpi_listen", "acpid", "adcli", "add-apt-repository", "add-shell", "add.modules", "addgnupghome", "addgroup", "addpart", "addr2line", "adduser", "adsl-start", "adsl-stop", "afs5log", "agetty", "akmods", "akmods-shutdown", "akmodsbuild", "alert", "alias", "alsa", "alsa-info", "alsa-info.sh", "alsabat", "alsabat-test", "alsactl", "alsaloop", "alsamixer", "alsatplg", "alsaucm", "alsaunmute", "alternatives", "amidi", "amixer", "amuFormat.sh", "anaconda", "anaconda-cleanup", "anaconda-disable-nm-ibft-plugin", "anacron", "analog", "animate", "animate-im6", "animate-im6.q16", "annocheck", "anytopnm", "apachectl", "apg", "apgbfm", "aplay", "aplaymidi", "apm_available", "apparmor_parser", "apparmor_status", "applycal", "applydeltarpm", "applygnupgdefaults", "apport-bug", "apport-cli", "apport-collect", "apport-unpack", "appres", "appstream-compose", "appstream-util", "appstreamcli", "apropos", "apt", "apt-add-repository", "apt-cache", "apt-cdrom", "apt-config", "apt-extracttemplates", "apt-ftparchive", "apt-get", "apt-key", "apt-mark", "apt-sortpkgs", "aptd", "aptdcon", "apturl", "apturl-gtk", "ar", "arch", "arecord", "arecordmidi", "arm2hpdl", "arp", "arpaname", "arpd", "arping", "as", "asciitopgm", "aseqdump", "aseqnet", "aserver", "aspell", "aspell-autobuildhash", "aspell-import", "at", "atd", "atktopbm", "atobm", "atq", "atrm", "atrun", "attr", "audit2allow", "audit2why", "auditctl", "auditd", "augenrules", "aulast", "aulastlog", "aureport", "ausearch", "ausyscall", "authconfig", "authselect", "auvirt", "avahi-autoipd", "avahi-browse", "avahi-browse-domains", "avahi-daemon", "avahi-publish", "avahi-publish-address", "avahi-publish-service", "avahi-resolve", "avahi-resolve-address", "avahi-resolve-host-name", "avahi-set-host-name", "avcstat", "average", "awk", "axfer", "b2sum", "b43-fwcutter", "badblocks", "baobab", "base32", "base64", "basename", "bash", "bashbug", "bashbug-64", "batch", "bc", "bcache-status", "bcache-super-show", "bccmd", "bdftopcf", "bdftruncate", "bg", "bind", "bioradtopgm", "biosdecode", "bitmap", "blivet-gui", "blivet-gui-daemon", "blkdeactivate", "blkdiscard", "blkid", "blkmapd", "blkzone", "blockdev", "bluemoon", "bluetooth-sendto", "bluetoothctl", "bluetoothd", "bmptopnm", "bmptoppm", "bmtoa", "boltctl", "bond2team", "bootctl", "brctl", "break", "bridge", "brltty", "brltty-atb", "brltty-config", "brltty-ctb", "brltty-ktb", "brltty-lsinc", "brltty-setup", "brltty-trtxt", "brltty-ttb", "brltty-tune", "broadwayd", "brotli", "browse", "brushtopbm", "bsd-from", "bsd-write", "btattach", "btmgmt", "btmon", "btrfs", "btrfs-convert", "btrfs-find-root", "btrfs-image", "btrfs-map-logical", "btrfs-select-super", "btrfsck", "btrfstune", "built-by", "builtin", "bumblebee-bugreport", "bumblebeed", "bunzip2", "busctl", "busybox", "bwrap", "bzcat", "bzcmp", "bzdiff", "bzegrep", "bzexe", "bzfgrep", "bzgrep", "bzip2", "bzip2recover", "bzless", "bzmore", "c++filt", "c89", "c99", "c_rehash", "ca-legacy", "cache_check", "cache_dump", "cache_metadata_size", "cache_repair", "cache_restore", "cache_writeback", "cairo-sphinx", "cal", "calendar", "calibrate_ppa", "caller", "canberra-boot", "canberra-gtk-play", "cancel", "cancel.cups", "capsh", "captoinfo", "case", "cat", "catchsegv", "catman", "cautious-launcher", "cb2ti3", "cbq", "cc", "cctiff", "ccttest", "ccxxmake", "cd", "cd-convert", "cd-create-profile", "cd-drive", "cd-fix-profile", "cd-iccdump", "cd-info", "cd-it8", "cd-paranoia", "cd-read", "cdda-player", "celtdec051", "celtenc051", "cfdisk", "cgdisk", "chacl", "chage", "chardet3", "chardetect3", "chartread", "chat", "chattr", "chcat", "chcon", "chcpu", "check-abi", "check-language-support", "checkisomd5", "checkmodule", "checkpolicy", "checksctp", "cheese", "chfn", "chgpasswd", "chgrp", "chkconfig", "chmem", "chmod", "chown", "chpasswd", "chrome-gnome-shell", "chronyc", "chronyd", "chroot", "chrt", "chsh", "chvt", "cifs.idmap", "cifs.upcall", "cifscreds", "cifsdd", "ciptool", "cisco-decrypt", "ckbcomp", "cksum", "clear", "clear_console", "clock", "clockdiff", "cmp", "cmuwmtopbm", "codepage", "col", "colcrt", "collink", "colormgr", "colprof", "colrm", "column", "colverify", "combinedeltarpm", "combinediff", "comm", "command", "command_not_found_handle", "compare", "compare-im6", "compare-im6.q16", "compgen", "complete", "compopt", "compose", "composite", "composite-im6", "composite-im6.q16", "conjure", "conjure-im6", "conjure-im6.q16", "consolehelper", "consoletype", "continue", "convert", "convert-im6", "convert-im6.q16", "convertquota", "coproc", "coredumpctl", "corelist", "coverage-3.7", "coverage3", "cp", "cpan", "cpan5.26-x86_64-linux-gnu", "cpgr", "cpio", "cpp", "cpp-8", "cppw", "cpustat", "cracklib-check", "cracklib-format", "cracklib-packer", "cracklib-unpacker", "crc32", "crda", "create-cracklib-dict", "createmodule.py", "createmodule.sh", "createrepo", "createrepo_c", "cron", "crond", "cronnext", "crontab", "cryptsetup", "csplit", "csslint-0.6", "cstool", "ctrlaltdel", "ctstat", "cups-browsed", "cups-calibrate", "cups-genppd.5.2", "cups-genppdupdate", "cupsaccept", "cupsaddsmb", "cupsctl", "cupsd", "cupsdisable", "cupsenable", "cupsfilter", "cupsreject", "cupstestdsc", "cupstestppd", "curl", "cut", "cvt", "cvtsudoers", "dash", "date", "dazzle-list-counters", "db_archive", "db_checkpoint", "db_deadlock", "db_dump", "db_dump185", "db_hotbackup", "db_load", "db_log_verify", "db_printlog", "db_recover", "db_replicate", "db_stat", "db_tuner", "db_upgrade", "db_verify", "dbus-binding-tool", "dbus-cleanup-sockets", "dbus-daemon", "dbus-launch", "dbus-monitor", "dbus-run-session", "dbus-send", "dbus-test-tool", "dbus-update-activation-environment", "dbus-uuidgen", "dbwrap_tool", "dbxtool", "dc", "dcbtool", "dconf", "dd", "ddns-confgen", "ddstdecode", "deallocvt", "deb-systemd-helper", "deb-systemd-invoke", "debconf", "debconf-apt-progress", "debconf-communicate", "debconf-copydb", "debconf-escape", "debconf-set-selections", "debconf-show", "debugfs", "declare", "dehtmldiff", "deja-dup", "delgroup", "delpart", "deluser", "delv", "depmod", "dequote", "desktop-file-edit", "desktop-file-install", "desktop-file-validate", "devdump", "devlink", "df", "dfu-tool", "dh_bash-completion", "dh_perl_openssl", "dhclient", "dhclient-script", "diff", "diff3", "diffstat", "dig", "dir", "dircolors", "dirmngr", "dirmngr-client", "dirname", "dirs", "dirsplit", "disown", "dispcal", "display", "display-im6", "display-im6.q16", "dispread", "dispwin", "distro", "dkms", "dm_dso_reg_tool", "dmesg", "dmevent_tool", "dmeventd", "dmfilemapd", "dmidecode", "dmraid", "dmraid.static", "dmsetup", "dmstats", "dnf", "dnf-3", "dnsdomainname", "dnsmasq", "dnssec-checkds", "dnssec-coverage", "dnssec-dsfromkey", "dnssec-importkey", "dnssec-keyfromlabel", "dnssec-keygen", "dnssec-keymgr", "dnssec-revoke", "dnssec-settime", "dnssec-signzone", "dnssec-verify", "do", "do-release-upgrade", "dog", "domainname", "done", "dos2unix", "dosfsck", "dosfslabel", "dotlockfile", "dpkg", "dpkg-deb", "dpkg-divert", "dpkg-maintscript-helper", "dpkg-preconfigure", "dpkg-query", "dpkg-reconfigure", "dpkg-split", "dpkg-statoverride", "dpkg-trigger", "dracut", "driverless", "du", "dump-acct", "dump-utmp", "dumpe2fs", "dumpiso", "dumpkeys", "dvcont", "dvipdf", "dwp", "dwz", "e2freefrag", "e2fsck", "e2image", "e2label", "e2mmpstatus", "e2undo", "e4crypt", "e4defrag", "eapol_test", "easy_install-3.7", "ebtables", "ebtables-legacy", "ebtables-restore", "ebtables-save", "echo", "ed", "edid-decode", "edit", "editdiff", "editor", "editres", "edquota", "efibootdump", "efibootmgr", "egrep", "eject", "elfedit", "elif", "else", "enable", "enc2xs", "enca", "encguess", "enchant", "enchant-2", "enchant-lsmod", "enchant-lsmod-2", "enconv", "env", "envml", "envsubst", "eog", "epiphany", "eps2eps", "eqn", "era_check", "era_dump", "era_invalidate", "era_restore", "esac", "esc-m", "escputil", "esmtp", "esmtp-wrapper", "espdiff", "espeak-ng", "ether-wake", "ethtool", "eu-addr2line", "eu-ar", "eu-elfcmp", "eu-elfcompress", "eu-elflint", "eu-findtextrel", "eu-make-debug-archive", "eu-nm", "eu-objdump", "eu-ranlib", "eu-readelf", "eu-size", "eu-stack", "eu-strings", "eu-strip", "eu-unstrip", "eutp", "eval", "evince", "evince-previewer", "evince-thumbnailer", "evmctl", "evolution", "ex", "exec", "exempi", "exit", "exiv2", "expand", "expiry", "export", "exportfs", "expr", "extlinux", "extracticc", "extractttag", "eyuvtoppm", "factor", "faillock", "faillog", "fakeCMY", "faked", "faked-sysv", "faked-tcp", "fakeread", "fakeroot", "fakeroot-sysv", "fakeroot-tcp", "fallocate", "false", "fatlabel", "fc", "fc-cache", "fc-cache-64", "fc-cat", "fc-conflist", "fc-list", "fc-match", "fc-pattern", "fc-query", "fc-scan", "fc-validate", "fcgistarter", "fcnsq", "fcoeadm", "fcoemon", "fcping", "fcrls", "fdformat", "fdisk", "fg", "fgconsole", "fgrep", "fi", "fiascotopnm", "file", "file-roller", "file2brl", "filefrag", "filterdiff", "fincore", "find", "findfs", "findmnt", "findsmb", "fips-finish-install", "fips-mode-setup", "fipscheck", "fipshmac", "fipvlan", "firefox", "firewall-cmd", "firewall-offline-cmd", "firewalld", "fitstopnm", "fix-info-dir", "fix-qdf", "fixcvsdiff", "fixfiles", "fixparts", "flatpak", "flatpak-bisect", "flatpak-coredumpctl", "flipdiff", "flock", "fmt", "fold", "fonttosfnt", "foo2ddst", "foo2ddst-wrapper", "foo2hbpl2", "foo2hbpl2-wrapper", "foo2hiperc", "foo2hiperc-wrapper", "foo2hp", "foo2hp2600-wrapper", "foo2lava", "foo2lava-wrapper", "foo2oak", "foo2oak-wrapper", "foo2qpdl", "foo2qpdl-wrapper", "foo2slx", "foo2slx-wrapper", "foo2xqx", "foo2xqx-wrapper", "foo2zjs", "foo2zjs-icc2ps", "foo2zjs-pstops", "foo2zjs-wrapper", "foomatic-addpjloptions", "foomatic-cleanupdrivers", "foomatic-combo-xml", "foomatic-compiledb", "foomatic-configure", "foomatic-datafile", "foomatic-extract-text", "foomatic-fix-xml", "foomatic-getpjloptions", "foomatic-kitload", "foomatic-nonumericalids", "foomatic-perl-data", "foomatic-ppd-options", "foomatic-ppd-to-xml", "foomatic-ppdfile", "foomatic-preferred-driver", "foomatic-printermap-to-gutenprint-xml", "foomatic-printjob", "foomatic-replaceoldprinterids", "foomatic-rip", "foomatic-searchprinter", "for", "fpaste", "fprintd-delete", "fprintd-enroll", "fprintd-list", "fprintd-verify", "free", "fribidi", "from", "fros", "fsadm", "fsck", "fsck.btrfs", "fsck.cramfs", "fsck.ext2", "fsck.ext3", "fsck.ext4", "fsck.fat", "fsck.hfs", "fsck.hfsplus", "fsck.minix", "fsck.msdos", "fsck.ntfs", "fsck.vfat", "fsck.xfs", "fsfreeze", "fstab-decode", "fstopgm", "fstrim", "ftp", "function", "funzip", "fuse2fs", "fuser", "fusermount", "fusermount-glusterfs", "fwupdmgr", "g13", "g13-syshelp", "g3topbm", "gamma4scanimage", "gapplication", "gatttool", "gawk", "gawklibpath_append", "gawklibpath_default", "gawklibpath_prepend", "gawkpath_append", "gawkpath_default", "gawkpath_prepend", "gcalccmd", "gcc", "gcc-ar", "gcc-nm", "gcc-ranlib", "gcm-calibrate", "gcm-import", "gcm-inspect", "gcm-picker", "gcm-viewer", "gconf-merge-tree", "gconftool-2", "gcore", "gcov", "gcov-dump", "gcov-tool", "gcr-viewer", "gdb", "gdb-add-index", "gdbserver", "gdbtui", "gdbus", "gdialog", "gdisk", "gdk-pixbuf-csource", "gdk-pixbuf-pixdata", "gdk-pixbuf-query-loaders-64", "gdk-pixbuf-thumbnailer", "gdm", "gdm-screenshot", "gdm3", "gdmflexiserver", "gedit", "gemtopbm", "gemtopnm", "gencat", "gendiff", "genhomedircon", "genhostid", "genisoimage", "genl", "genl-ctrl-list", "genrandom", "geoiplookup", "geoiplookup6", "geqn", "getcap", "getcifsacl", "getconf", "geteltorito", "getenforce", "getent", "getfacl", "getfattr", "gethostip", "getkeycodes", "getopt", "getopts", "getpcaps", "getsebool", "gettext", "gettext.sh", "gettextize", "getty", "getweb", "ghostscript", "giftopnm", "ginstall-info", "gio", "gio-launch-desktop", "gio-querymodules", "gio-querymodules-64", "gipddecode", "git", "git-receive-pack", "git-shell", "git-upload-archive", "git-upload-pack", "gjs", "gjs-console", "gkbd-keyboard-display", "glib-compile-schemas", "glreadtest", "gluster", "glusterfs", "glusterfsd", "glxgears", "glxinfo", "glxinfo64", "glxspheres64", "gmake", "gneqn", "gnome-abrt", "gnome-boxes", "gnome-calculator", "gnome-calendar", "gnome-characters", "gnome-clocks", "gnome-contacts", "gnome-control-center", "gnome-disk-image-mounter", "gnome-disks", "gnome-documents", "gnome-font-viewer", "gnome-help", "gnome-keyring", "gnome-keyring-3", "gnome-keyring-daemon", "gnome-language-selector", "gnome-logs", "gnome-mahjongg", "gnome-maps", "gnome-menus-blacklist", "gnome-mines", "gnome-photos", "gnome-power-statistics", "gnome-screenshot", "gnome-session", "gnome-session-custom-session", "gnome-session-inhibit", "gnome-session-properties", "gnome-session-quit", "gnome-session-remmina", "gnome-shell", "gnome-shell-extension-prefs", "gnome-shell-extension-tool", "gnome-shell-perf-tool", "gnome-software", "gnome-software-editor", "gnome-sudoku", "gnome-system-monitor", "gnome-terminal", "gnome-terminal.real", "gnome-terminal.wrapper", "gnome-text-editor", "gnome-thumbnail-font", "gnome-todo", "gnome-tweaks", "gnome-weather", "gnome-www-browser", "gnroff", "gold", "google-chrome", "google-chrome-stable", "gouldtoppm", "gpasswd", "gpg", "gpg-agent", "gpg-connect-agent", "gpg-error", "gpg-wks-server", "gpg-zip", "gpg2", "gpgconf", "gpgme-json", "gpgparsemail", "gpgsm", "gpgsplit", "gpgv", "gpgv2", "gpic", "gprof", "gpu-manager", "gr2fonttest", "grep", "grepdiff", "gresource", "greytiff", "grilo-test-ui-0.3", "grl-inspect-0.3", "grl-launch-0.3", "groff", "grog", "grops", "grotty", "groupadd", "groupdel", "groupmems", "groupmod", "groups", "grpck", "grpconv", "grpunconv", "grub-bios-setup", "grub-editenv", "grub-file", "grub-fstest", "grub-glue-efi", "grub-install", "grub-kbdcomp", "grub-macbless", "grub-menulst2cfg", "grub-mkconfig", "grub-mkdevicemap", "grub-mkfont", "grub-mkimage", "grub-mklayout", "grub-mknetdir", "grub-mkpasswd-pbkdf2", "grub-mkrelpath", "grub-mkrescue", "grub-mkstandalone", "grub-mount", "grub-ntldr-img", "grub-probe", "grub-reboot", "grub-render-label", "grub-script-check", "grub-set-default", "grub-syslinux2cfg", "grub2-bios-setup", "grub2-editenv", "grub2-file", "grub2-fstest", "grub2-get-kernel-settings", "grub2-glue-efi", "grub2-install", "grub2-kbdcomp", "grub2-macbless", "grub2-menulst2cfg", "grub2-mkconfig", "grub2-mkfont", "grub2-mkimage", "grub2-mklayout", "grub2-mknetdir", "grub2-mkpasswd-pbkdf2", "grub2-mkrelpath", "grub2-mkrescue", "grub2-mkstandalone", "grub2-ofpathname", "grub2-probe", "grub2-reboot", "grub2-render-label", "grub2-rpm-sort", "grub2-script-check", "grub2-set-bootflag", "grub2-set-default", "grub2-set-password", "grub2-setpassword", "grub2-sparc64-setup", "grub2-switch-to-blscfg", "grub2-syslinux2cfg", "grubby", "gs", "gsbj", "gsdj", "gsdj500", "gsettings", "gsettings-data-convert", "gsf-office-thumbnailer", "gslj", "gslp", "gsnd", "gsoelim", "gsound-play", "gssproxy", "gst-device-monitor-1.0", "gst-discoverer-1.0", "gst-inspect-1.0", "gst-launch-1.0", "gst-play-1.0", "gst-stats-1.0", "gst-typefind-1.0", "gstack", "gstreamer-codec-install", "gtar", "gtbl", "gtf", "gtk-builder-tool", "gtk-launch", "gtk-query-immodules-2.0-64", "gtk-query-immodules-3.0-64", "gtk-query-settings", "gtk-update-icon-cache", "gtroff", "guild", "guile", "guile-tools", "guile2", "guile2-tools", "gunzip", "gupnp-dlna-info-2.0", "gupnp-dlna-ls-profiles-2.0", "gvfs-cat", "gvfs-copy", "gvfs-info", "gvfs-less", "gvfs-ls", "gvfs-mime", "gvfs-mkdir", "gvfs-monitor-dir", "gvfs-monitor-file", "gvfs-mount", "gvfs-move", "gvfs-open", "gvfs-rename", "gvfs-rm", "gvfs-save", "gvfs-set-attribute", "gvfs-trash", "gvfs-tree", "gzexe", "gzip", "h2ph", "h2xs", "halt", "handle-sshpw", "hangul", "hardened", "hardlink", "hash", "hbpldecode", "hciattach", "hciconfig", "hcidump", "hcitool", "hd", "hdparm", "head", "help", "helpztags", "hex2hcd", "hexdump", "hfs-bless", "highlight", "hipercdecode", "hipstopgm", "history", "host", "hostid", "hostname", "hostnamectl", "hp-align", "hp-check", "hp-clean", "hp-colorcal", "hp-config_usb_printer", "hp-diagnose_plugin", "hp-diagnose_queues", "hp-doctor", "hp-fab", "hp-firmware", "hp-info", "hp-levels", "hp-logcapture", "hp-makeuri", "hp-pkservice", "hp-plugin", "hp-plugin-ubuntu", "hp-probe", "hp-query", "hp-scan", "hp-sendfax", "hp-setup", "hp-testpage", "hp-timedate", "hp-unload", "hpcups-update-ppds", "hpijs", "htcacheclean", "htdbm", "htdigest", "htpasswd", "httpd", "httxt2dbm", "hunspell", "hwclock", "hwe-support-status", "hypervfcopyd", "hypervkvpd", "hypervvssd", "i386", "ibus", "ibus-daemon", "ibus-setup", "ibus-table-createdb", "iccdump", "iccgamut", "icclu", "icctest", "iceauth", "ico", "icontopbm", "iconv", "iconvconfig", "id", "identify", "identify-im6", "identify-im6.q16", "idiag-socket-details", "idn", "iecset", "if", "ifcfg", "ifconfig", "ifdown", "ifenslave", "ifquery", "ifrename", "ifstat", "ifup", "iio-sensor-proxy", "ijs_pxljr", "ilbmtoppm", "illumread", "im-config", "im-launch", "imagetops", "imgtoppm", "implantisomd5", "import", "import-im6", "import-im6.q16", "in", "info", "infobrowser", "infocmp", "infotocap", "init", "inputattach", "insmod", "install", "install-info", "install-printerdriver", "installkernel", "instmodsh", "instperf", "intel-virtual-output", "interdiff", "invoke-rc.d", "invprofcheck", "ionice", "ip", "ip6tables", "ip6tables-apply", "ip6tables-legacy", "ip6tables-legacy-restore", "ip6tables-legacy-save", "ip6tables-restore", "ip6tables-save", "ipcalc", "ipcmk", "ipcrm", "ipcs", "ipmaddr", "ipod-read-sysinfo-extended", "ipod-time-sync", "ippfind", "ippserver", "ipptool", "ippusbxd", "ipset", "iptables", "iptables-apply", "iptables-legacy", "iptables-legacy-restore", "iptables-legacy-save", "iptables-restore", "iptables-save", "iptables-xml", "iptc", "iptstate", "iptunnel", "irqbalance", "irqbalance-ui", "isc-hmac-fixup", "ischroot", "iscsi-iname", "iscsiadm", "iscsid", "iscsistart", "iscsiuio", "isdv4-serial-debugger", "isdv4-serial-inputattach", "iso-info", "iso-read", "isodebug", "isodump", "isohybrid", "isoinfo", "isosize", "isovfy", "ispell-autobuildhash", "ispell-wrapper", "iucode-tool", "iucode_tool", "iw", "iwconfig", "iwevent", "iwgetid", "iwlist", "iwpriv", "iwspy", "jackd", "jackrec", "java", "jimsh", "jjs", "jobs", "join", "journalctl", "jpegtopnm", "jpgicc", "json_pp", "json_reformat", "json_verify", "jwhois", "kbd_mode", "kbdinfo", "kbdrate", "kbxutil", "kdumpctl", "kernel-install", "kerneloops", "kerneloops-submit", "kexec", "key.dns_resolver", "keyctl", "keyring", "keytool", "kill", "killall", "killall5", "kmod", "kmodsign", "kmodtool", "kodak2ti3", "kpartx", "l", "l.", "l2ping", "l2test", "la", "laptop-detect", "last", "lastb", "lastcomm", "lastlog", "lavadecode", "lcf", "lchage", "lchfn", "lchsh", "ld", "ld.bfd", "ld.gold", "ldattach", "ldconfig", "ldconfig.real", "ldd", "leaftoppm", "less", "lessecho", "lessfile", "lesskey", "lesspipe", "lesspipe.sh", "let", "lexgrog", "lgroupadd", "lgroupdel", "lgroupmod", "libieee1284_test", "libinput", "libnetcfg", "libreoffice", "libtar", "libvirtd", "libwacom-list-local-devices", "lid", "link", "linkicc", "lintian", "lintian-info", "lintian-lab-tool", "linux-boot-prober", "linux-check-removal", "linux-update-symlinks", "linux-version", "linux32", "linux64", "lispmtopgm", "listres", "liveinst", "ll", "lldpad", "lldptool", "ln", "lnewusers", "lnstat", "load_policy", "loadkeys", "loadunimap", "local", "localc", "locale", "locale-check", "locale-gen", "localectl", "localedef", "locate", "lockdev", "lodraw", "loffice", "lofromtemplate", "logger", "login", "loginctl", "logname", "logout", "logresolve", "logrotate", "logsave", "loimpress", "lomath", "look", "lorder", "losetup", "loweb", "lowntfs-3g", "lowriter", "lp", "lp.cups", "lp_solve", "lpadmin", "lpasswd", "lpc", "lpc.cups", "lpinfo", "lpmove", "lpoptions", "lpq", "lpq.cups", "lpr", "lpr.cups", "lprm", "lprm.cups", "lpstat", "lpstat.cups", "ls", "lsattr", "lsb_release", "lsblk", "lscpu", "lsdiff", "lshw", "lsinitramfs", "lsinitrd", "lsipc", "lslocks", "lslogins", "lsmem", "lsmod", "lsns", "lsof", "lspci", "lspcmcia", "lspgpot", "lsusb", "lsusb.py", "ltrace", "lua", "luac", "luit", "luseradd", "luserdel", "lusermod", "lvchange", "lvconvert", "lvcreate", "lvdisplay", "lvextend", "lvm", "lvmconf", "lvmconfig", "lvmdiskscan", "lvmdump", "lvmetad", "lvmpolld", "lvmsadc", "lvmsar", "lvreduce", "lvremove", "lvrename", "lvresize", "lvs", "lvscan", "lwp-download", "lwp-dump", "lwp-mirror", "lwp-request", "lxpolkit", "lz", "lz4", "lz4c", "lz4cat", "lzcat", "lzcmp", "lzdiff", "lzegrep", "lzfgrep", "lzgrep", "lzless", "lzma", "lzmainfo", "lzmore", "lzop", "m17n-conv", "m2300w", "m2300w-wrapper", "m2400w", "m4", "mac2unix", "machinectl", "macptopbm", "mail", "mailq", "mailx", "make", "make-bcache", "make-dummy-cert", "make-ssl-cert", "makedb", "makedeltarpm", "makedumpfile", "man", "mandb", "manpath", "mapfile", "mapscrn", "matchpathcon", "mattrib", "mawk", "mbadblocks", "mbim-network", "mbimcli", "mcat", "mcd", "mcelog", "mcheck", "mclasserase", "mcomp", "mcookie", "mcopy", "mcpp", "md5sum", "md5sum.textutils", "mdadm", "mdatopbm", "mdel", "mdeltree", "mdig", "mdir", "mdmon", "mdu", "memdiskfind", "memtest-setup", "mergerepo", "mergerepo_c", "mesg", "meshctl", "mformat", "mgrtopbm", "migrate-pubring-from-classic-gpg", "mii-diag", "mii-tool", "mimeopen", "mimetype", "min12xxw", "minfo", "mk_modmap", "mkdict", "mkdir", "mkdosfs", "mkdumprd", "mke2fs", "mkfifo", "mkfontdir", "mkfontscale", "mkfs", "mkfs.bfs", "mkfs.btrfs", "mkfs.cramfs", "mkfs.ext2", "mkfs.ext3", "mkfs.ext4", "mkfs.fat", "mkfs.hfsplus", "mkfs.minix", "mkfs.msdos", "mkfs.ntfs", "mkfs.vfat", "mkfs.xfs", "mkhomedir_helper", "mkhybrid", "mkinitramfs", "mkinitrd", "mkisofs", "mklost+found", "mkmanifest", "mknod", "mkntfs", "mkrfc2734", "mkroot", "mksquashfs", "mkswap", "mktemp", "mkzftree", "mlabel", "mlocate", "mmc-tool", "mmcli", "mmd", "mmount", "mmove", "modifyrepo", "modifyrepo_c", "modinfo", "modprobe", "module", "modulecmd", "modulemd-validator-v1", "mogrify", "mogrify-im6", "mogrify-im6.q16", "mokutil", "monitor-sensor", "montage", "montage-im6", "montage-im6.q16", "more", "mount", "mount.cifs", "mount.fuse", "mount.glusterfs", "mount.lowntfs-3g", "mount.nfs", "mount.nfs4", "mount.ntfs", "mount.ntfs-3g", "mount.ntfs-fuse", "mount.zfs", "mountpoint", "mountstats", "mousetweaks", "mpage", "mpartition", "mpathconf", "mpathpersist", "mppcheck", "mpplu", "mppprof", "mpris-proxy", "mrd", "mren", "mscompress", "msexpand", "msgattrib", "msgcat", "msgcmp", "msgcomm", "msgconv", "msgen", "msgexec", "msgfilter", "msgfmt", "msggrep", "msginit", "msgmerge", "msgunfmt", "msguniq", "mshortname", "mshowfat", "mt", "mt-gnu", "mtools", "mtoolstest", "mtr", "mtr-packet", "mtvtoppm", "mtype", "multipath", "multipathd", "mutter", "mv", "mvxattr", "mxtar", "mzip", "nail", "named-checkzone", "named-compilezone", "namei", "nameif", "nano", "nautilus", "nautilus-autorun-software", "nautilus-desktop", "nautilus-sendto", "nawk", "nc", "nc.openbsd", "ncal", "ncat", "ndctl", "ndptool", "neotoppm", "neqn", "netcat", "netkit-ftp", "netplan", "netstat", "nettest", "networkctl", "networkd-dispatcher", "new-kernel-pkg", "newgidmap", "newgrp", "newuidmap", "newusers", "nf-ct-add", "nf-ct-list", "nf-exp-add", "nf-exp-delete", "nf-exp-list", "nf-log", "nf-monitor", "nf-queue", "nfnl_osf", "nfsconf", "nfsdcltrack", "nfsidmap", "nfsiostat", "nfsstat", "nft", "ngettext", "nice", "nisdomainname", "nl", "nl-addr-add", "nl-addr-delete", "nl-addr-list", "nl-class-add", "nl-class-delete", "nl-class-list", "nl-classid-lookup", "nl-cls-add", "nl-cls-delete", "nl-cls-list", "nl-fib-lookup", "nl-link-enslave", "nl-link-ifindex2name", "nl-link-list", "nl-link-name2ifindex", "nl-link-release", "nl-link-set", "nl-link-stats", "nl-list-caches", "nl-list-sockets", "nl-monitor", "nl-neigh-add", "nl-neigh-delete", "nl-neigh-list", "nl-neightbl-list", "nl-pktloc-lookup", "nl-qdisc-add", "nl-qdisc-delete", "nl-qdisc-list", "nl-route-add", "nl-route-delete", "nl-route-get", "nl-route-list", "nl-rule-list", "nl-tctree-list", "nl-util-addr", "nm", "nm-applet", "nm-connection-editor", "nm-online", "nmblookup", "nmcli", "nmtui", "nmtui-connect", "nmtui-edit", "nmtui-hostname", "node", "nohup", "nologin", "notify-send", "npm", "nproc", "npx", "nroff", "nsec3hash", "nsenter", "nslookup", "nstat", "nsupdate", "ntfs-3g", "ntfs-3g.probe", "ntfscat", "ntfsck", "ntfsclone", "ntfscluster", "ntfscmp", "ntfscp", "ntfsdecrypt", "ntfsdump_logfile", "ntfsfallocate", "ntfsfix", "ntfsinfo", "ntfslabel", "ntfsls", "ntfsmftalloc", "ntfsmount", "ntfsmove", "ntfsrecover", "ntfsresize", "ntfssecaudit", "ntfstruncate", "ntfsundelete", "ntfsusermap", "ntfswipe", "numad", "numfmt", "nvidia-bug-report.sh", "nvidia-detector", "nvidia-settings", "oLschema2ldif", "oakdecode", "obexctl", "objcopy", "objdump", "oclock", "od", "oddjob_request", "oddjobd", "oeminst", "oldrdist", "on_ac_power", "oocalc", "oodraw", "ooffice", "ooimpress", "oomath", "ooviewdoc", "oowriter", "open", "openconnect", "openoffice.org", "openssl", "openvpn", "openvt", "opldecode", "optirun", "orc-bugreport", "orca", "orca-dm-wrapper", "os-prober", "osinfo-db-export", "osinfo-db-import", "osinfo-db-path", "osinfo-db-validate", "osinfo-detect", "osinfo-install-script", "osinfo-query", "ostree", "ownership", "p11-kit", "pacat", "pack200", "packer", "pacmd", "pactl", "padsp", "padsp-32", "pager", "palmtopnm", "pam-auth-update", "pam_console_apply", "pam_extrausers_chkpwd", "pam_extrausers_update", "pam_getenv", "pam_tally", "pam_tally2", "pam_timestamp_check", "pamcut", "pamdeinterlace", "pamdice", "pamfile", "pamoil", "pamon", "pamstack", "pamstretch", "pamstretch-gen", "panelctl", "pango-list", "pango-view", "paperconf", "paperconfig", "paplay", "paps", "parec", "parecord", "parsechangelog", "parted", "partprobe", "partx", "passwd", "paste", "pasuspender", "patch", "pathchk", "pathplot", "pax", "pax11publish", "pbmclean", "pbmlife", "pbmmake", "pbmmask", "pbmpage", "pbmpscale", "pbmreduce", "pbmtext", "pbmtextps", "pbmto10x", "pbmtoascii", "pbmtoatk", "pbmtobbnbg", "pbmtocmuwm", "pbmtoepsi", "pbmtoepson", "pbmtog3", "pbmtogem", "pbmtogo", "pbmtoicon", "pbmtolj", "pbmtomacp", "pbmtomda", "pbmtomgr", "pbmtonokia", "pbmtopgm", "pbmtopi3", "pbmtoplot", "pbmtoppa", "pbmtopsg3", "pbmtoptx", "pbmtowbmp", "pbmtox10bm", "pbmtoxbm", "pbmtoybm", "pbmtozinc", "pbmupc", "pccardctl", "pcimodules", "pcxtoppm", "pdata_tools", "pdb3", "pdb3.6", "pdf2dsc", "pdf2ps", "pdfdetach", "pdffonts", "pdfimages", "pdfinfo", "pdfseparate", "pdfsig", "pdftocairo", "pdftohtml", "pdftoppm", "pdftops", "pdftotext", "pdfunite", "peekfd", "perl", "perl5.26-x86_64-linux-gnu", "perl5.26.2", "perl5.28.1", "perlbug", "perldoc", "perli11ndoc", "perlivp", "perlthanks", "pf2afm", "pfbtopfa", "pftp", "pgmbentley", "pgmcrater", "pgmedge", "pgmenhance", "pgmhist", "pgmkernel", "pgmnoise", "pgmnorm", "pgmoil", "pgmramp", "pgmslice", "pgmtexture", "pgmtofs", "pgmtolispm", "pgmtopbm", "pgmtoppm", "pgrep", "pi1toppm", "pi3topbm", "pic", "pico", "piconv", "pidof", "pigz", "pinentry", "pinentry-curses", "pinentry-gnome3", "pinentry-gtk", "pinentry-gtk-2", "pinentry-x11", "pinfo", "ping", "ping4", "ping6", "pinky", "pip-3", "pip-3.7", "pip3", "pip3.7", "pipewire", "pitchplay", "pivot_root", "pjtoppm", "pkaction", "pkcheck", "pkcon", "pkexec", "pkg-config", "pkgconf", "pkill", "pkla-admin-identities", "pkla-check-authorization", "pkmon", "pkttyagent", "pl2pm", "pldd", "plipconfig", "plistutil", "plog", "pluginviewer", "plymouth", "plymouth-set-default-theme", "plymouthd", "pmap", "pngtopnm", "pnm2ppa", "pnmalias", "pnmarith", "pnmcat", "pnmcolormap", "pnmcomp", "pnmconvol", "pnmcrop", "pnmcut", "pnmdepth", "pnmenlarge", "pnmfile", "pnmflip", "pnmgamma", "pnmhisteq", "pnmhistmap", "pnmindex", "pnminterp", "pnminterp-gen", "pnminvert", "pnmmargin", "pnmmontage", "pnmnlfilt", "pnmnoraw", "pnmnorm", "pnmpad", "pnmpaste", "pnmpsnr", "pnmquant", "pnmremap", "pnmrotate", "pnmscale", "pnmscalefixed", "pnmshear", "pnmsmooth", "pnmsplit", "pnmtile", "pnmtoddif", "pnmtofiasco", "pnmtofits", "pnmtojpeg", "pnmtopalm", "pnmtoplainpnm", "pnmtopng", "pnmtops", "pnmtorast", "pnmtorle", "pnmtosgi", "pnmtosir", "pnmtotiff", "pnmtotiffcmyk", "pnmtoxwd", "pod2html", "pod2man", "pod2text", "pod2usage", "podchecker", "podselect", "poff", "pon", "popcon-largest-unused", "popd", "popularity-contest", "post-grohtml", "poweroff", "ppdc", "ppdhtml", "ppdi", "ppdmerge", "ppdpo", "pphs", "ppm3d", "ppmbrighten", "ppmchange", "ppmcie", "ppmcolormask", "ppmcolors", "ppmdim", "ppmdist", "ppmdither", "ppmfade", "ppmflash", "ppmforge", "ppmhist", "ppmlabel", "ppmmake", "ppmmix", "ppmnorm", "ppmntsc", "ppmpat", "ppmquant", "ppmquantall", "ppmqvga", "ppmrainbow", "ppmrelief", "ppmshadow", "ppmshift", "ppmspread", "ppmtoacad", "ppmtobmp", "ppmtoeyuv", "ppmtogif", "ppmtoicr", "ppmtoilbm", "ppmtojpeg", "ppmtoleaf", "ppmtolj", "ppmtomap", "ppmtomitsu", "ppmtompeg", "ppmtoneo", "ppmtopcx", "ppmtopgm", "ppmtopi1", "ppmtopict", "ppmtopj", "ppmtopuzz", "ppmtorgb3", "ppmtosixel", "ppmtotga", "ppmtouil", "ppmtowinicon", "ppmtoxpm", "ppmtoyuv", "ppmtoyuvsplit", "ppmtv", "ppp-watch", "pppconfig", "pppd", "pppdump", "pppoe", "pppoe-connect", "pppoe-discovery", "pppoe-relay", "pppoe-server", "pppoe-setup", "pppoe-sniff", "pppoe-start", "pppoe-status", "pppoe-stop", "pppoeconf", "pppstats", "pptp", "pptpsetup", "pr", "pre-grohtml", "precat", "preconv", "preunzip", "prezip", "prezip-bin", "primusrun", "print", "printafm", "printcal", "printenv", "printer-profile", "printerbanner", "printf", "printtarg", "prlimit", "profcheck", "prove", "prtstat", "ps", "ps2ascii", "ps2epsi", "ps2pdf", "ps2pdf12", "ps2pdf13", "ps2pdf14", "ps2pdfwr", "ps2ps", "ps2ps2", "ps2txt", "psfaddtable", "psfgettable", "psfstriptable", "psfxtable", "psicc", "psidtopgm", "pslog", "pstack", "pstopnm", "pstree", "pstree.x11", "ptar", "ptardiff", "ptargrep", "ptx", "pulseaudio", "pushd", "pvchange", "pvck", "pvcreate", "pvdisplay", "pvmove", "pvremove", "pvresize", "pvs", "pvscan", "pwck", "pwconv", "pwd", "pwdx", "pwhistory_helper", "pwmake", "pwqcheck", "pwqgen", "pwscore", "pwunconv", "py3clean", "py3compile", "py3versions", "pydoc3", "pydoc3.6", "pydoc3.7", "pygettext3", "pygettext3.6", "pyjwt3", "python3", "python3-chardetect", "python3-coverage", "python3-mako-render", "python3-pyinotify", "python3.6", "python3.6m", "python3.7", "python3.7m", "python3m", "pyvenv", "pyvenv-3.7", "pzstd", "qb-blackbox", "qdbus", "qemu-ga", "qemu-img", "qemu-io", "qemu-keymap", "qemu-kvm", "qemu-nbd", "qemu-pr-helper", "qemu-system-i386", "qemu-system-x86_64", "qmi-firmware-update", "qmi-network", "qmicli", "qpdf", "qpdldecode", "qrttoppm", "quirks-handler", "quot", "quota", "quotacheck", "quotaoff", "quotaon", "quotastats", "quotasync", "quote", "quote_readline", "radvd", "radvdump", "raid-check", "ranlib", "rapper", "rasttopnm", "raw", "rawtopgm", "rawtoppm", "rb", "rbash", "rcp", "rctest", "rdfproc", "rdisc", "rdist", "rdistd", "rdma", "rdma-ndd", "read", "readarray", "readelf", "readlink", "readmult", "readonly", "readprofile", "realm", "realpath", "reboot", "recode-sr-latin", "recountdiff", "red", "rediff", "redland-db-upgrade", "refine", "regdbdump", "regdiff", "regpatch", "regshell", "regtree", "reject", "remmina", "remmina-gnome", "remove-default-ispell", "remove-default-wordlist", "remove-shell", "rename", "rename.ul", "rendercheck", "renew-dummy-cert", "renice", "report-cli", "report-gtk", "reporter-bugzilla", "reporter-kerneloops", "reporter-print", "reporter-systemd-journal", "reporter-upload", "reporter-ureport", "repquota", "request-key", "reset", "resize2fs", "resizecons", "resizepart", "resolvconf", "resolvectl", "restorecon", "restorecon_xattr", "return", "rev", "revfix", "rfcomm", "rfkill", "rgb3toppm", "rgrep", "rhythmbox", "rhythmbox-client", "rletopnm", "rlogin", "rm", "rmdir", "rmid", "rmiregistry", "rmmod", "rmt", "rmt-tar", "rnano", "rngd", "rngtest", "rofiles-fuse", "roqet", "rotatelogs", "route", "routef", "routel", "rpc.gssd", "rpc.idmapd", "rpc.mountd", "rpc.nfsd", "rpc.statd", "rpcbind", "rpcclient", "rpcdebug", "rpcinfo", "rpm", "rpm2archive", "rpm2cpio", "rpmargs", "rpmbuild", "rpmdb", "rpmdev-bumpspec", "rpmdev-checksig", "rpmdev-cksum", "rpmdev-diff", "rpmdev-extract", "rpmdev-md5", "rpmdev-newinit", "rpmdev-newspec", "rpmdev-packager", "rpmdev-rmdevelrpms", "rpmdev-setuptree", "rpmdev-sha1", "rpmdev-sha224", "rpmdev-sha256", "rpmdev-sha384", "rpmdev-sha512", "rpmdev-sort", "rpmdev-sum", "rpmdev-vercmp", "rpmdev-wipetree", "rpmdumpheader", "rpmelfsym", "rpmfile", "rpminfo", "rpmkeys", "rpmls", "rpmpeek", "rpmquery", "rpmsodiff", "rpmsoname", "rpmspec", "rpmverify", "rsh", "rstart", "rstartd", "rsync", "rsyslogd", "rtacct", "rtcwake", "rtkitctl", "rtmon", "rtpr", "rtstat", "run-mailcap", "run-on-binaries-in", "run-parts", "run-with-aspell", "runcon", "runlevel", "runuser", "rvi", "rview", "rx", "rxe_cfg", "rygel", "rygel-preferences", "rz", "sa", "samba-regedit", "sandbox", "sane-find-scanner", "saned", "saslauthd", "sasldblistusers2", "saslpasswd2", "satyr", "savelog", "sb", "sbattach", "sbcdec", "sbcenc", "sbcinfo", "sbigtopgm", "sbkeysync", "sbsiglist", "sbsign", "sbvarsign", "sbverify", "scanimage", "scanin", "scl", "scl_enabled", "scl_source", "scp", "scp-dbus-service", "screendump", "script", "scriptreplay", "sctp_darn", "sctp_status", "sctp_test", "sdiff", "sdptool", "seahorse", "secon", "secret-tool", "sed", "sedismod", "sedispol", "see", "sefcontext_compile", "selabel_digest", "selabel_lookup", "selabel_lookup_best_match", "selabel_partial_match", "select", "select-default-ispell", "select-default-iwrap", "select-default-wordlist", "select-editor", "selinux_check_access", "selinuxconlist", "selinuxdefcon", "selinuxenabled", "selinuxexeccon", "semanage", "semodule", "semodule_expand", "semodule_link", "semodule_package", "semodule_unpackage", "sendiso", "sendmail", "sensible-browser", "sensible-editor", "sensible-pager", "seq", "service", "session-migration", "sessreg", "sestatus", "set", "setarch", "setcap", "setcifsacl", "setenforce", "setfacl", "setfattr", "setfiles", "setfont", "setkeycodes", "setleds", "setlogcons", "setmetamode", "setpci", "setpriv", "setquota", "setregdomain", "setsebool", "setsid", "setterm", "setup-nsssysinit", "setup-nsssysinit.sh", "setupcon", "setvesablank", "setvtrgb", "setxkbmap", "sfdisk", "sftp", "sg", "sgdisk", "sgitopnm", "sgpio", "sh", "sh.distrib", "sha1hmac", "sha1sum", "sha224hmac", "sha224sum", "sha256hmac", "sha256sum", "sha384hmac", "sha384sum", "sha512hmac", "sha512sum", "shadowconfig", "sharesec", "shasum", "sheep", "sheepfs", "shepherd", "shift", "shopt", "shotwell", "showconsolefont", "showkey", "showmount", "showrgb", "shred", "shuf", "shutdown", "simple-scan", "simpprof", "sirtopnm", "size", "skdump", "skill", "sktest", "slabtop", "slattach", "sldtoppm", "sleep", "slogin", "slxdecode", "sm-notify", "smbcacls", "smbclient", "smbcquotas", "smbget", "smbspool", "smbtar", "smbtree", "smproxy", "snap", "snapctl", "snapfuse", "sndfile-resample", "snice", "soelim", "soffice", "software-properties-gtk", "sol", "sort", "sosreport", "sotruss", "soundstretch", "source", "spax", "spctoppm", "spd-conf", "spd-say", "speak-ng", "speaker-test", "spec2cie", "specplot", "spectool", "speech-dispatcher", "spellintian", "spellout", "spice-vdagent", "spice-vdagentd", "splain", "split", "splitdiff", "splitfont", "splitti3", "spotread", "sprof", "sputoppm", "sqlite3", "sqliterepo_c", "ss", "ssh", "ssh-add", "ssh-agent", "ssh-argv0", "ssh-copy-id", "ssh-keygen", "ssh-keyscan", "sshd", "sshpass", "sss_cache", "sss_ssh_authorizedkeys", "sss_ssh_knownhostsproxy", "sssd", "st4topgm", "start-pulseaudio-x11", "start-statd", "start-stop-daemon", "startx", "stat", "static-sh", "stdbuf", "strace", "strace-log-merge", "stream", "stream-im6", "stream-im6.q16", "strings", "strip", "stty", "stunbdc", "stund", "su", "sudo", "sudoedit", "sudoreplay", "sulogin", "sum", "sushi", "suspend", "swaplabel", "swapoff", "swapon", "switch_root", "switcheroo-control", "switchml", "sx", "symcryptrun", "symlinks", "sync", "synthcal", "synthread", "sysctl", "syslinux", "syslinux-legacy", "system-config-abrt", "system-config-printer", "system-config-printer-applet", "systemctl", "systemd", "systemd-analyze", "systemd-ask-password", "systemd-cat", "systemd-cgls", "systemd-cgtop", "systemd-delta", "systemd-detect-virt", "systemd-escape", "systemd-firstboot", "systemd-hwdb", "systemd-inhibit", "systemd-machine-id-setup", "systemd-mount", "systemd-notify", "systemd-nspawn", "systemd-path", "systemd-resolve", "systemd-run", "systemd-socket-activate", "systemd-stdio-bridge", "systemd-sysusers", "systemd-tmpfiles", "systemd-tty-ask-password-agent", "systemd-umount", "sz", "t1ascii", "t1asm", "t1binary", "t1disasm", "t1mac", "t1unmac", "tabs", "tac", "tail", "tar", "tarcat", "targen", "taskset", "tbl", "tc", "tcbench", "tclsh", "tclsh8.6", "tcpdump", "tcpslice", "tcptraceroute", "tcsd", "teamd", "teamdctl", "teamnl", "tee", "telinit", "telnet", "telnet.netkit", "tempfile", "test", "testlibraw", "testsaslauthd", "tgatoppm", "tgz", "then", "thermald", "thin_check", "thin_delta", "thin_dump", "thin_ls", "thin_metadata_size", "thin_repair", "thin_restore", "thin_rmap", "thin_trim", "thinkjettopbm", "thunderbird", "tic", "tiffgamut", "tifftopnm", "tificc", "time", "timedatectl", "timedatex", "timeout", "times", "tipc", "tload", "tmux", "toe", "top", "totem", "totem-video-thumbnailer", "touch", "tpm2-abrmd", "tpm2_activatecredential", "tpm2_certify", "tpm2_create", "tpm2_createpolicy", "tpm2_createprimary", "tpm2_dictionarylockout", "tpm2_encryptdecrypt", "tpm2_evictcontrol", "tpm2_getcap", "tpm2_getmanufec", "tpm2_getpubak", "tpm2_getpubek", "tpm2_getrandom", "tpm2_hash", "tpm2_hmac", "tpm2_listpersistent", "tpm2_load", "tpm2_loadexternal", "tpm2_makecredential", "tpm2_nvdefine", "tpm2_nvlist", "tpm2_nvread", "tpm2_nvreadlock", "tpm2_nvrelease", "tpm2_nvwrite", "tpm2_pcrevent", "tpm2_pcrextend", "tpm2_pcrlist", "tpm2_quote", "tpm2_rc_decode", "tpm2_readpublic", "tpm2_rsadecrypt", "tpm2_rsaencrypt", "tpm2_send", "tpm2_sign", "tpm2_startup", "tpm2_takeownership", "tpm2_unseal", "tpm2_verifysignature", "tput", "tr", "tracepath", "tracepath6", "traceroute", "traceroute6", "traceroute6.iputils", "tracker", "transicc", "transmission-gtk", "transset", "trap", "tree", "troff", "true", "truncate", "trust", "tset", "tsig-keygen", "tsort", "ttfread", "tty", "tune2fs", "txt2ti3", "type", "typeset", "tzconfig", "tzselect", "u-d-c-print-pci-ids", "ua", "ubuntu-advantage", "ubuntu-bug", "ubuntu-core-launcher", "ubuntu-drivers", "ubuntu-report", "ubuntu-software", "ubuntu-support-status", "ucf", "ucfq", "ucfr", "ucs2any", "udevadm", "udisksctl", "ufw", "ul", "ulimit", "ulockmgr_server", "umask", "umax_pp", "umount", "umount.nfs", "umount.nfs4", "umount.udisks2", "unalias", "uname", "uname26", "unattended-upgrade", "unattended-upgrades", "unbound-anchor", "uncompress", "unexpand", "unicode_start", "unicode_stop", "uniq", "unity-scope-loader", "unix2dos", "unix2mac", "unix_chkpwd", "unix_update", "unlink", "unlz4", "unlzma", "unmkinitramfs", "unoconv", "unopkg", "unpack200", "unpigz", "unset", "unshare", "unsquashfs", "until", "unwrapdiff", "unxz", "unzip", "unzipsfx", "unzstd", "update-alternatives", "update-ca-certificates", "update-ca-trust", "update-cracklib", "update-crypto-policies", "update-default-aspell", "update-default-ispell", "update-default-wordlist", "update-desktop-database", "update-dictcommon-aspell", "update-dictcommon-hunspell", "update-fonts-alias", "update-fonts-dir", "update-fonts-scale", "update-grub", "update-grub-gfxpayload", "update-grub2", "update-gsfontmap", "update-gtk-immodules", "update-icon-caches", "update-inetd", "update-info-dir", "update-initramfs", "update-locale", "update-manager", "update-mime", "update-mime-database", "update-notifier", "update-passwd", "update-pciids", "update-perl-sax-parsers", "update-rc.d", "update-secureboot-policy", "update-usbids", "updatedb", "updatedb.mlocate", "upgrade-from-grub-legacy", "upower", "uptime", "usb-creator-gtk", "usb-devices", "usb_modeswitch", "usb_modeswitch_dispatcher", "usb_printerid", "usbhid-dump", "usbmuxd", "useradd", "userdel", "userhelper", "usermod", "users", "usleep", "utmpdump", "uuidd", "uuidgen", "uuidparse", "uz", "validlocale", "vconfig", "vcstime", "vdir", "vdptool", "vgcfgbackup", "vgcfgrestore", "vgchange", "vgck", "vgconvert", "vgcreate", "vgdisplay", "vgexport", "vgextend", "vgimport", "vgimportclone", "vglclient", "vglconfig", "vglconnect", "vglgenkey", "vgllogin", "vglrun", "vglserver_config", "vglxinfo", "vgmerge", "vgmknodes", "vgreduce", "vgremove", "vgrename", "vgs", "vgscan", "vgsplit", "vi", "via_regs_dump", "view", "viewgam", "viewres", "vigr", "vim.tiny", "vipw", "virtfs-proxy-helper", "virtlockd", "virtlogd", "visudo", "vlock", "vm-support", "vmcore-dmesg", "vmhgfs-fuse", "vmstat", "vmtoolsd", "vmware-checkvm", "vmware-guestproxycerttool", "vmware-hgfsclient", "vmware-namespace-cmd", "vmware-rpctool", "vmware-toolbox-cmd", "vmware-user", "vmware-user-suid-wrapper", "vmware-vgauth-cmd", "vmware-vmblock-fuse", "vmware-xferlogs", "vmwarectrl", "vncconfig", "vncpasswd", "volname", "vpddecode", "vpnc", "vpnc-disconnect", "vstp", "w", "w.procps", "wait", "wall", "watch", "watchgnupg", "wavpack", "wbmptopbm", "wc", "wdctl", "weak-modules", "wget", "whatis", "whereis", "which", "while", "whiptail", "who", "whoami", "whois", "whoopsie", "whoopsie-preferences", "winicontoppm", "wipefs", "withsctp", "wnck-urgency-monitor", "word-list-compress", "wpa_action", "wpa_cli", "wpa_passphrase", "wpa_supplicant", "write", "wvgain", "wvtag", "wvunpack", "x-session-manager", "x-terminal-emulator", "x-window-manager", "x-www-browser", "x11perf", "x11perfcomp", "x86_64", "x86_64-linux-gnu-addr2line", "x86_64-linux-gnu-ar", "x86_64-linux-gnu-as", "x86_64-linux-gnu-c++filt", "x86_64-linux-gnu-cpp", "x86_64-linux-gnu-cpp-8", "x86_64-linux-gnu-dwp", "x86_64-linux-gnu-elfedit", "x86_64-linux-gnu-gold", "x86_64-linux-gnu-gprof", "x86_64-linux-gnu-ld", "x86_64-linux-gnu-ld.bfd", "x86_64-linux-gnu-ld.gold", "x86_64-linux-gnu-nm", "x86_64-linux-gnu-objcopy", "x86_64-linux-gnu-objdump", "x86_64-linux-gnu-ranlib", "x86_64-linux-gnu-readelf", "x86_64-linux-gnu-size", "x86_64-linux-gnu-strings", "x86_64-linux-gnu-strip", "x86_64-redhat-linux-gcc", "x86_64-redhat-linux-gcc-8", "x86_64-redhat-linux-gnu-pkg-config", "xargs", "xauth", "xbiff", "xbmtopbm", "xbrlapi", "xcalc", "xclipboard", "xclock", "xcmsdb", "xconsole", "xcursorgen", "xcutsel", "xdg-desktop-icon", "xdg-desktop-menu", "xdg-email", "xdg-icon-resource", "xdg-mime", "xdg-open", "xdg-screensaver", "xdg-settings", "xdg-user-dir", "xdg-user-dirs-gtk-update", "xdg-user-dirs-update", "xditview", "xdpyinfo", "xdriinfo", "xedit", "xev", "xeyes", "xfd", "xfontsel", "xfs_admin", "xfs_bmap", "xfs_copy", "xfs_db", "xfs_estimate", "xfs_freeze", "xfs_fsr", "xfs_growfs", "xfs_info", "xfs_io", "xfs_logprint", "xfs_mdrestore", "xfs_metadump", "xfs_mkfile", "xfs_ncheck", "xfs_quota", "xfs_repair", "xfs_rtcp", "xfs_scrub", "xfs_scrub_all", "xfs_spaceman", "xgamma", "xgc", "xgettext", "xhost", "xicclu", "ximtoppm", "xinit", "xinput", "xkbbell", "xkbcomp", "xkbevd", "xkbprint", "xkbvleds", "xkbwatch", "xkeystone", "xkill", "xload", "xlogo", "xlsatoms", "xlsclients", "xlsfonts", "xmag", "xman", "xmessage", "xmlcatalog", "xmllint", "xmlsec1", "xmlwf", "xmodmap", "xmore", "xpmtoppm", "xprop", "xqmstats", "xqxdecode", "xrandr", "xrdb", "xrefresh", "xset", "xsetmode", "xsetpointer", "xsetroot", "xsetwacom", "xsltproc", "xsm", "xstdcmap", "xsubpp", "xtables-legacy-multi", "xtables-multi", "xvidtune", "xvinfo", "xvminitoppm", "xwd", "xwdtopnm", "xwininfo", "xwud", "xxd", "xz", "xzcat", "xzcmp", "xzdec", "xzdiff", "xzegrep", "xzfgrep", "xzgrep", "xzless", "xzmore", "ybmtopbm", "yelp", "yes", "ypdomainname", "yum", "yuvsplittoppm", "yuvtoppm", "zcat", "zcmp", "zdb", "zdiff", "zdump", "zegrep", "zeisstopnm", "zeitgeist-daemon", "zenity", "zfgrep", "zforce", "zfs", "zfs-fuse", "zfs-fuse-helper", "zgrep", "zic", "zip", "zipcloak", "zipdetails", "zipgrep", "zipinfo", "zipnote", "zipsplit", "zjsdecode", "zless", "zlib-flate", "zmore", "znew", "zpool", "zramctl", "zramstart", "zramstop", "zsoelim", "zstd", "zstdcat", "zstdgrep", "zstdless", "zstdmt", "zstreamdump", "ztest", "{", "}"]
};
exports.default = _default;
},{}],"assets/cmds/js.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * This is a list of JavaScript keywords, "standard library" objects, etc.
 *
 * See the README in this directory for more on how this list is assembled.
 *
 * There are duplicates, and that's okay.  But if you are removing items, be sure to look for multiple entries!
 */
var _default = {
  name: "JavaScript",
  commonCmds: ["if", "else", "for", "function", "let", "var", "const", "JSON", "Date", "window"],
  cmds: [// keywords
  "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield", // some literals
  "null", "true", "false", // global object properties
  "infinity", "nan", "undefined", "eval", "isfinite", "isnan", "parsefloat", "parseint", "decodeuri", "decodeuricomponent", "encodeuri", "encodeuricomponent", "array", "arraybuffer", "boolean", "dataview", "date", "error", "evalerror", "float32array", "float64array", "function", "int8array", "int16array", "int32array", "map", "number", "object", "promise", "proxy", "rangeerror", "referenceerror", "regexp", "set", "sharedarraybuffer", "string", "symbol", "syntaxerror", "typeerror", "uint8array", "uint8clampedarray", "uint16array", "uint32array", "urierror", "weakmap", "weakset", // fundamental objects (ch 19)
  "object", "function", "boolean", "symbol", "error", // numbers and dates (ch 20)
  "number", "math", "date", // text processing (ch 21)
  "string", "regexp", // indexed collections (ch 22)
  "array", "typedarray", // keyed collections (ch 23)
  "map", "set", "weakmap", "weakset", // structured data (ch 24)
  "arraybuffer", "sharedarraybuffer", "dataview", "atomics", "json", // control abstraction objects (ch 25)
  "generator", "asyncgenerator", "promise", // reflection (ch 26)
  "reflect", "proxy", // some curiously hard to find ones in the spec
  "async", "let", "static", "else", "document", "window", "navigator", "then", "set", "get", "of", // Object.keys(window) in chrome
  "postMessage", "blur", "focus", "close", "parent", "opener", "top", "length", "frames", "closed", "location", "self", "window", "document", "name", "customElements", "history", "locationbar", "menubar", "personalbar", "scrollbars", "statusbar", "toolbar", "status", "frameElement", "navigator", "origin", "external", "screen", "innerWidth", "innerHeight", "scrollX", "pageXOffset", "scrollY", "pageYOffset", "visualViewport", "screenX", "screenY", "outerWidth", "outerHeight", "devicePixelRatio", "clientInformation", "screenLeft", "screenTop", "defaultStatus", "defaultstatus", "styleMedia", "onanimationend", "onanimationiteration", "onanimationstart", "onsearch", "ontransitionend", "onwebkitanimationend", "onwebkitanimationiteration", "onwebkitanimationstart", "onwebkittransitionend", "isSecureContext", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting", "onwheel", "onauxclick", "ongotpointercapture", "onlostpointercapture", "onpointerdown", "onpointermove", "onpointerup", "onpointercancel", "onpointerover", "onpointerout", "onpointerenter", "onpointerleave", "onselectstart", "onselectionchange", "onafterprint", "onbeforeprint", "onbeforeunload", "onhashchange", "onlanguagechange", "onmessage", "onmessageerror", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onrejectionhandled", "onstorage", "onunhandledrejection", "onunload", "performance", "stop", "open", "alert", "confirm", "prompt", "print", "queueMicrotask", "requestAnimationFrame", "cancelAnimationFrame", "captureEvents", "releaseEvents", "requestIdleCallback", "cancelIdleCallback", "getComputedStyle", "matchMedia", "moveTo", "moveBy", "resizeTo", "resizeBy", "getSelection", "find", "webkitRequestAnimationFrame", "webkitCancelAnimationFrame", "fetch", "btoa", "atob", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "createImageBitmap", "scroll", "scrollTo", "scrollBy", "onappinstalled", "onbeforeinstallprompt", "crypto", "ondevicemotion", "ondeviceorientation", "ondeviceorientationabsolute", "indexedDB", "webkitStorageInfo", "sessionStorage", "localStorage", "chrome", "speechSynthesis", "webkitRequestFileSystem", "webkitResolveLocalFileSystemURL", "openDatabase"]
};
exports.default = _default;
},{}],"assets/cmds/python.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * This is a list of Python3+ keywords and built in functions
 *
 * See the README in this directory for more on how this list is assembled.
 *
 * There are duplicates, and that's okay.  But if you are removing items, be sure to look for multiple entries!
 */
var _default = {
  name: "Python",
  commonCmds: ["def", "len", "lambda", "tuple", "elif", "if", "or", "return", "finally", "class", "and", "del", "not", "while", "break", "with", "True", "False"],
  cmds: [// keywords
  "False", "class", "finally", "is", "return", "None", "continue", "for", "lambda", "try", "True", "def", "from", "nonlocal", "while", "and", "del", "global", "not", "with", "as", "elif", "if", "or", "yeild", "assert", "else", "import", "pass", "break", "except", "in", "raise", // funtions
  "abs()", "delattr()", "hash()", "memoryview()", "set()", "all()", "dict()", "help()", "min()", "setattr()", "any()", "dir()", "hex()", "next()", "slice()", "ascii()", "divmod()", "id()", "object()", "sorted()", "bin()", "enumerate()", "input()", "oct()", "staticmethod()", "bool()", "eval()", "int()", "open()", "str()", "breakpoint()", "exec()", "isinstance()", "ord()", "sum()", "bytearray()", "filter()", "issubclass()", "pow()", "super()", "bytes()", "float()", "iter()", "print()", "tuple()", "callable()", "format()", "len()", "property()", "type()", "chr()", "frozenset()", "list()", "range()", "vars()", "classmethod()", "getattr()", "locals()", "repr()", "zip()", "compile()", "globals()", "map()", "reversed()", "__import__()", "complex()", "hasattr()", "max()", "round()", // functions without parens
  "abs", "delattr", "hash", "memoryview", "set", "all", "dict", "help", "min", "setattr", "any", "dir", "hex", "next", "slice", "ascii", "divmod", "id", "object", "sorted", "bin", "enumerate", "input", "oct", "staticmethod", "bool", "eval", "int", "open", "str", "breakpoint", "exec", "isinstance", "ord", "sum", "bytearray", "filter", "issubclass", "pow", "super", "bytes", "float", "iter", "print", "tuple", "callable", "format", "len", "property", "type", "chr", "frozenset", "list", "range", "vars", "classmethod", "getattr", "locals", "repr", "zip", "compile", "globals", "map", "reversed", "__import__", "complex", "hasattr", "max", "round"]
};
exports.default = _default;
},{}],"assets/cmds/html.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  name: "HTML5",
  commonCmds: ["html", "head", "title", "link", "meta", "style", "body", "a", "nav", "h1", "h2", "h3", "p", "hr", "pre", "blockquote", "ol", "ul", "li", "div", "br", "table", "tr", "td"],
  cmds: ["html", "head", "title", "base", "link", "meta", "style", "body", "article", "section", "nav", "aside", "h1", "h2", "h3", "h4", "h5", "h6", "header", "footer", "p", "address", "hr", "pre", "blockquote", "ol", "ul", "li", "dl", "dt", "dd", "figure", "figcaption", "main", "div", "a", "em", "strong", "small", "s", "cite", "q", "dfn", "abbr", "ruby", "rb", "rt", "rtc", "rp", "data", "time", "code", "var", "samp", "kbd", "sub", "sup", "i", "b", "u", "mark", "bdi", "bdo", "span", "br", "wbr", "ins", "del", "picture", "source", "img", "iframe", "embed", "object", "param", "video", "audio", "track", "map", "area", "table", "caption", "colgroup", "col", "tbody", "thead", "tfoot", "tr", "td", "th", "form", "label", "input", "button", "select", "datalist", "optgroup", "option", "textarea", "output", "progress", "meter", "fieldset", "legend", "details", "summary", "dialog", "script", "noscript", "template", "canvas", "slot", "hr", "fieldset", "legend", "button", "details", "summary", "marquee", "meter", "progress", "select", "textarea", "marquee"]
};
exports.default = _default;
},{}],"src/cmds.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.all = all;
exports.bash = bash;
exports.js = js;
exports.py = py;
exports.html = html;
exports.longest = longest;
exports.find = find;
exports.cmdsByLang = void 0;

var _bash = _interopRequireDefault(require("../assets/cmds/bash.js"));

var _js = _interopRequireDefault(require("../assets/cmds/js.js"));

var _python = _interopRequireDefault(require("../assets/cmds/python.js"));

var _html = _interopRequireDefault(require("../assets/cmds/html.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// API for interrogating the command "database"
var allCmds = _.union(bash().cmds, js().cmds, py().cmds, html().cmds
/* and other langs as needed */
);

var cmdsByLang = {
  bash: bash(),
  js: js(),
  py: py(),
  html: html()
};
exports.cmdsByLang = cmdsByLang;

function all() {
  return allCmds;
}

function bash() {
  return _bash.default;
}

function js() {
  return _js.default;
}

function py() {
  return _python.default;
}

function html() {
  return _html.default;
}

function longest() {
  return allCmds.reduce(function (a, b) {
    return a.length > b.length ? a : b;
  }).length;
}

function find(cmd) {
  var result = {
    lang: []
  };

  for (var lang in cmdsByLang) {
    if (cmdsByLang[lang].cmds.includes(cmd.trim())) {
      result.cmd = cmd;
      result.lang.push(lang);
    }
  }

  return result;
}
},{"../assets/cmds/bash.js":"assets/cmds/bash.js","../assets/cmds/js.js":"assets/cmds/js.js","../assets/cmds/python.js":"assets/cmds/python.js","../assets/cmds/html.js":"assets/cmds/html.js"}],"src/config.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  GOLDEN_CMDS_COMMON_PER_LANG: 2,
  // Number of very common commands to include
  GOLDEN_CMDS_RANDOM_PER_LANG: 2,
  // Number of totally random commands to include per language
  GOLDEN_CMDS_MAX_LENGTH: 7,
  // Max string length that a golden command can be
  GOLDEN_CMDS_PREVIEW_TIME: 21300,
  SCORE_PER_COMMAND: 10,
  SCORE_OVERALL_MULTIPLIER: 100,
  SCORE_GOLDEN_COMMAND_MULTIPLIER: 10,
  DELAY_BEFORE_FIRE: 15000,
  // Minimum time the game has be be running before fire can display,
  GAME_DURATION: 60000,
  FIRE_CPS_THRESHOLD: 2.5 // Number of valid characters per-second a player must average to get fire

};
exports.default = _default;
},{}],"src/app.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _states = _interopRequireDefault(require("./states.js"));

var _keycodes = _interopRequireDefault(require("./keycodes.js"));

var _consoleCanvas = _interopRequireDefault(require("./console-canvas.js"));

var cmds = _interopRequireWildcard(require("./cmds.js"));

var _config = _interopRequireDefault(require("./config.js"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// create some handy aliases for keycodes, for use with Vue's v-on directive.
Vue.config.keyCodes = {
  enter: _keycodes.default.enter
};
var ctrl_down = false;
/**
 * @param {Number} kc the keyCode of the key pressed
 * @param {Array<String>} leftChars the character to the left of the cursor, used to
 * determine whether left arrow is valid (left arrow can't cross over a
 * newline)
 */

function validKeycode(ev, leftChars) {
  var kc = ev.keyCode; // if ctrl is held down, ignore everything

  if (kc == _keycodes.default.ctrl) {
    ctrl_down = true;
  }

  if (ctrl_down) {
    return false;
  } // valid keys are alpha, numeric, punctuation, underscore, hyphen, enter, and right-arrow.
  // left-arrow and backspace areonly accepted when they doesn't cross over a newline
  // (ie, would have made the cursor to up one line).


  var alphanumeric = _.inRange(kc, _keycodes.default.nums.start, _keycodes.default.nums.end + 1) || _.inRange(kc, _keycodes.default.alpha.start, _keycodes.default.alpha.end + 1) || _.inRange(kc, _keycodes.default.punct.start, _keycodes.default.punct.end + 1);

  var valid_other = [_keycodes.default.enter, _keycodes.default.right_arrow].includes(kc);
  var on_newline = leftChars[0] === "\n";
  var on_prompt = leftChars.reverse().join("") === "\n> ";
  var valid_backspace = kc === _keycodes.default.backspace && !(on_newline || on_prompt);
  return alphanumeric || valid_other || valid_backspace;
}

var app = new Vue({
  el: "#game",
  data: {
    state: _states.default.loading,
    showTitle: false,
    showScore: false,
    cmd: "",
    commands: [],
    displayScore: false,
    gameDuration: _config.default.GAME_DURATION,
    timer: 0,
    allowTyping: false,
    score: 0,
    count: {
      js: 0,
      bash: 0,
      html: 0,
      py: 0,
      totalValidCharacters: 0,
      totalValidCommands: 0
    }
  },
  watch: {
    cmd: function cmd(val) {
      // if receiving user input and on a newline, add a prompt
      if (this.allowTyping && val[val.length - 1] === "\n") {
        this.cmd += "> ";
      }
    }
  },
  methods: {
    toState: function toState(state) {
      var change = {
        from: this.state,
        to: state
      };
      this.state = state;
      this.titleState = state === _states.default.title;
      this.onStateChange(change);
    },
    handlePaste: function handlePaste(ev) {
      // disable pasting into the textarea
      ev.preventDefault();
    },
    // this keypress handler can be overridden and changed based on the state of the game.
    onKeyPress: _.noop,
    // this keypress handler is the primary one which controls interaction with the textarea.
    handleKeypress: function handleKeypress(ev) {
      // give onKeyPress first crack at this event
      this.onKeyPress(ev);

      if (!this.allowTyping) {
        ev.preventDefault();
        return;
      } // first get the char to the left of the cursor (it's used when
      // left arrow is pressed to determine if left arrow is valid; left
      // arrow is valid except when it would cross over a newline and
      // move the cursor to the line above)


      var textarea = this.$el.querySelector("#cmd");
      var leftChars = [this.cmd[textarea.selectionStart - 1], this.cmd[textarea.selectionStart - 2], this.cmd[textarea.selectionStart - 3]]; // if it's enter, test the input and return.  also, preventDefault
      // so enter doesn't add a newline.  Instead, add the newline
      // ourselves.  This prevents Enter from splitting a word in half if
      // the cursor is inside a word, like hitting enter on "ca|t" would
      // result in "ca\nt".

      if (ev.keyCode === Vue.config.keyCodes.enter) {
        ev.preventDefault();
        var result = this.testCmd(ev);
        result.lang.forEach(function (lang) {
          return app.count[lang]++;
        });

        if (result.cmd.length !== 0) {
          // scroll to bottom of the textarea
          // gameplay, it just makes the textarea look nicer when the
          // textarea itself is visible during debugging)
          this.$nextTick(function () {
            textarea.blur();
            textarea.focus();
          });
        }

        return;
      } // if keycode is invalid, drop the event.


      if (!validKeycode(ev, leftChars)) {
        ev.preventDefault();
      }
    },
    handleKeyup: function handleKeyup(ev) {
      if (ev.keyCode === _keycodes.default.ctrl) {
        ctrl_down = false;
      }
    },
    testCmd: function testCmd(ev) {
      var _this = this;

      var cmd = _(this.cmd).split("\n").last().trim().replace(/^\> /, ""); // ignore the prompt


      var _cmds$find = cmds.find(cmd),
          matchedCmd = _cmds$find.cmd,
          lang = _cmds$find.lang;

      var result = {
        cmd: cmd,
        valid: !!matchedCmd,
        matchedCmd: matchedCmd,
        lang: lang
      };
      this.$nextTick(function () {
        _this.onResult(result);
      });
      return result;
    },
    onResult: _.noop,
    onStateChange: function onStateChange(change) {
      console.log("state changing from \"".concat(change.from, "\" to \"").concat(change.to, "\" but no handler is registered."));
    },

    /**
     * This function returns a json object with the set of golden command for this game
     */
    pickGoldenCommands: function pickGoldenCommands() {
      // General rules for golden commands
      //   1. 10 char or less
      //   2. don't start with _
      //   3. don't end with ()
      //   4. Pull from a list of well known commands for each lang
      //   5. pick configurable amount of commands from each language type that meet the above rules
      var filterCmds = function filterCmds(cmds) {
        // filter by length
        var filteredCmds = cmds.filter(function (cmd) {
          return cmd.length <= _config.default.GOLDEN_CMDS_MAX_LENGTH;
        }); // Filter out starting with underscore

        filteredCmds = filteredCmds.filter(function (cmd) {
          return !cmd.startsWith("_");
        }); // Filter out ending with parens )

        filteredCmds = filteredCmds.filter(function (cmd) {
          return !cmd.endsWith(")");
        });
        return filteredCmds;
      };

      var bashAll = filterCmds(cmds.cmdsByLang.bash.cmds);
      var bashCommon = cmds.cmdsByLang.bash.commonCmds;
      var jsAll = filterCmds(cmds.cmdsByLang.js.cmds);
      var jsCommon = cmds.cmdsByLang.js.commonCmds;
      var pyAll = filterCmds(cmds.cmdsByLang.py.cmds);
      var pyCommon = cmds.cmdsByLang.py.commonCmds;
      var htmlAll = filterCmds(cmds.cmdsByLang.html.cmds);
      var htmlCommon = filterCmds(cmds.cmdsByLang.html.commonCmds);
      var cn = _config.default.GOLDEN_CMDS_COMMON_PER_LANG;
      var rn = _config.default.GOLDEN_CMDS_RANDOM_PER_LANG;
      var goldenCommands = {
        bash: _.sampleSize(bashCommon, cn).concat(_.sampleSize(_.xor(bashCommon, bashAll), rn)),
        js: _.sampleSize(jsCommon, cn).concat(_.sampleSize(_.xor(jsCommon, jsAll), rn)),
        py: _.sampleSize(pyCommon, cn).concat(_.sampleSize(_.xor(pyCommon, pyAll), rn)),
        html: _.sampleSize(htmlCommon, cn).concat(_.sampleSize(_.xor(htmlCommon, htmlAll), rn))
      };
      goldenCommands.all = goldenCommands.bash.concat(goldenCommands.js, goldenCommands.py, goldenCommands.html);
      return goldenCommands;
    },

    /**
     * Get the golden commands for the console canvas.
     */
    printGoldenCommands: function printGoldenCommands() {
      var out = "";
      var halfScreen = Math.floor(_consoleCanvas.default.conf.PLAY_CHARS_PER_LINE / 2);
      var goldCmds = app.goldenCommands;

      var langs = _.keys(goldCmds); // title of first and second langs


      out += cmds.bash().name.padEnd(halfScreen);
      out += cmds.js().name + "\n"; // interleave commands of first and second langs

      out += _.zip(goldCmds.bash.map(function (c) {
        return " - ".concat(c).padEnd(halfScreen);
      }), goldCmds.js.map(function (c) {
        return "".concat(" - ".concat(c).padEnd(halfScreen), "\n");
      })).map(function (cs) {
        return cs.join("");
      }).join("");
      out += "\n"; // title of third and fourth langs

      out += cmds.py().name.padEnd(Math.floor(_consoleCanvas.default.conf.PLAY_CHARS_PER_LINE / 2));
      out += cmds.html().name + "\n"; // interleave commands of third and fourth langs

      out += _.zip(goldCmds.py.map(function (c) {
        return " - ".concat(c).padEnd(halfScreen);
      }), goldCmds.html.map(function (c) {
        return "".concat(" - ".concat(c).padEnd(halfScreen), "\n");
      })).map(function (cs) {
        return cs.join("");
      }).join("");
      return out;
    },
    updateConsole: _.noop,
    writeToConsole: function writeToConsole() {
      var _this2 = this;

      this.$nextTick(function () {
        var args = [_.clone(_this2.cmd)];
        var showCursor = _this2.allowTyping && performance.now() % 1200 < 600;

        if (showCursor) {
          args[0] += "█";
        }

        if (_this2.showScore) {
          args.push(_this2.score);
          args.push(_this2.timer);
        }

        _consoleCanvas.default.write.apply(_consoleCanvas.default, args);
      });
    },
    resetState: function resetState() {
      // Reset the score and other stat between games:
      this.timer = 0;
      this.allowTyping = false;
      this.score = 0;
      this.count.js = 0;
      this.count.bash = 0;
      this.count.html = 0;
      this.count.py = 0;
      this.count.totalValidCharacters = 0;
      this.count.totalValidCommands = 0;
    }
  },
  mounted: function mounted() {
    // after the entire view has rendered
    this.$nextTick(function () {
      var _this3 = this;

      // put focus on the text input
      this.$refs.cmd.focus(); // and also refocus on the input if the user clicks anywhere with
      // the mouse

      document.body.addEventListener("click", function () {
        return _this3.$refs.cmd.focus();
      });
    });
  }
});
window.app = app;
var _default = app;
exports.default = _default;
},{"./states.js":"src/states.js","./keycodes.js":"src/keycodes.js","./console-canvas.js":"src/console-canvas.js","./cmds.js":"src/cmds.js","./config.js":"src/config.js"}],"src/tween-camera.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = tweenCamera;

/**
 * Tween the camera to a given position and rotation.  Duration and easing are optional.
 */
function tweenCamera(camera, _ref) {
  var position = _ref.position,
      rotation = _ref.rotation,
      _ref$duration = _ref.duration,
      duration = _ref$duration === void 0 ? 2000 : _ref$duration,
      _ref$easing = _ref.easing,
      easing = _ref$easing === void 0 ? TWEEN.Easing.Quartic.Out : _ref$easing;
  return new Promise(function (resolve, reject) {
    // TODO show other title state stuff like text, logo, etc.
    // tween to camera position
    new TWEEN.Tween(camera.rotation) // Create a new tween that modifies 'coords'.
    .to(rotation, duration) // Move to (300, 200) in 1 second.
    .easing(easing) // Use an easing function to make the animation smooth.
    .start(); // Start the tween immediately.

    new TWEEN.Tween(camera.position) // Create a new tween that modifies 'coords'.
    .to(position, duration) // Move to (300, 200) in 1 second.
    .easing(easing) // Use an easing function to make the animation smooth.
    .onComplete(resolve).start(); // Start the tween immediately.
  });
}
},{}],"src/three-utils.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadMesh = loadMesh;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function loadMesh(_x, _x2, _x3) {
  return _loadMesh.apply(this, arguments);
}

function _loadMesh() {
  _loadMesh = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(path, mtl, obj) {
    var onProgress;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            onProgress = function onProgress(name) {
              return function (xhr) {
                if (xhr.lengthComputable) {
                  var percentComplete = xhr.loaded / xhr.total * 100;
                  console.log("".concat(name, " ").concat(Math.round(percentComplete, 2), " % downloaded"));
                }
              };
            };

            return _context.abrupt("return", new Promise(function (resolve, reject) {
              new THREE.MTLLoader().setPath(path).load(mtl, function (materials) {
                materials.preload();
                new THREE.OBJLoader().setMaterials(materials).setPath(path).load(obj, function (object) {
                  resolve({
                    materials: materials,
                    object: object
                  });
                }, onProgress(obj), reject);
              }, onProgress(mtl), reject);
            }));

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _loadMesh.apply(this, arguments);
}
},{}],"src/sleep.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

function _default(ms) {
  return new Promise(function (resolve, reject) {
    return setTimeout(resolve, ms);
  });
}
},{}],"src/sfx.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var sfx = {
  cmdGood: new Howl({
    src: ["assets/sfx/cmd-good.mp3"]
  }),
  cmdGold: new Howl({
    src: ["assets/sfx/cmd-gold.mp3"]
  }),
  cmdBad: new Howl({
    src: ["assets/sfx/cmd-bad.mp3"]
  }),
  keypress: new Howl({
    src: ["assets/sfx/keypress.mp3"]
  }),
  timerRelaxed: new Howl({
    src: ["assets/sfx/timer-relaxed.mp3"],
    volume: 1
  }),
  timerUrgent: new Howl({
    src: ["assets/sfx/timer-urgent.mp3"],
    volume: 1
  }),
  boot: new Howl({
    src: ["assets/sfx/boot.mp3"]
  }),
  menuMusic: new Howl({
    src: ["assets/sfx/menu-music.mp3"],
    volume: 0.3,
    loop: true
  }),
  play: new Howl({
    src: ["assets/sfx/play.mp3"],
    volume: 0.4,
    sprite: {
      golden: [0, 29648, true],
      playing: [29649, 60000 + 39456]
    }
  })
}; // preserve the original volume setting for each sfx

_.forEach(sfx, function (s) {
  return s.originalVolume = s.volume();
}); // when these sfx have finished fading out, stop playing and seek back to the beginning


[sfx.boot, sfx.menuMusic, sfx.play].forEach(function (sound) {
  sound.on("fade", function () {
    sound.stop();
    sound.seek(0);
    sound.volume(sound.originalVolume);
  });
});
window.sfx = sfx;
var _default = sfx;
exports.default = _default;
},{}],"src/main.js":[function(require,module,exports) {
"use strict";

require("../node_modules/three/examples/js/loaders/OBJLoader.js");

require("../node_modules/three/examples/js/controls/OrbitControls.js");

require("../node_modules/three/examples/js/controls/TrackballControls.js");

require("../node_modules/three/examples/js/objects/Fire.js");

require("./MTLLoaderPhysical.js");

var _palette = _interopRequireDefault(require("./palette.js"));

var _app = _interopRequireDefault(require("./app.js"));

var _tweenCamera = _interopRequireDefault(require("./tween-camera.js"));

var _keycodes = _interopRequireDefault(require("./keycodes.js"));

var _threeUtils = require("./three-utils.js");

var _states2 = _interopRequireDefault(require("./states.js"));

var _sleep = _interopRequireDefault(require("./sleep.js"));

var _consoleCanvas = _interopRequireDefault(require("./console-canvas.js"));

var _config = _interopRequireDefault(require("./config.js"));

var _sfx = _interopRequireDefault(require("./sfx.js"));

var _states;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var container;
var camera, scene, renderer, controls;
var mouseX = 0,
    mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var computer; // Fire vars

var fire;
var firePlane;
var allowFire = false;
var stats = new Stats(); // document.body.appendChild(stats.dom);

var states = (_states = {}, _defineProperty(_states, _states2.default.title, {
  enter: function () {
    var _enter = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var camTween;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _app.default.updateConsole = _.noop;

              _app.default.resetState();

              _app.default.cmd = ""; // make font big enough to see from a distance

              _consoleCanvas.default.conf.FONT_SIZE = 4 * 114;
              camTween = (0, _tweenCamera.default)(camera, {
                rotation: {
                  x: -0.5832659522477153,
                  y: 0.4513175431123964,
                  z: 0.28022041929249414
                },
                position: {
                  x: 68.79903504601936,
                  y: 218.79396932448483,
                  z: 432.0475129782785
                },
                duration: 4000
              }); // wait a short time so the CLH test pattern can be seen, then start drawing the console

              _context2.next = 7;
              return (0, _sleep.default)(300);

            case 7:
              _app.default.updateConsole = _app.default.writeToConsole;

              _sfx.default.boot.play(); // let the camera zoom in for a while before moving on to displaying text on screen


              _context2.next = 11;
              return (0, _sleep.default)(1000);

            case 11:
              _app.default.cmd = "LOADING...";
              _context2.next = 14;
              return camTween;

            case 14:
              _context2.next = 16;
              return (0, _sleep.default)(1200);

            case 16:
              _sfx.default.menuMusic.play();

              _app.default.showTitle = true;
              _context2.next = 20;
              return (0, _sleep.default)(600);

            case 20:
              _app.default.cmd += "\n\nTESTING ROUTINE\nINITIATED.";
              _context2.next = 23;
              return (0, _sleep.default)(600);

            case 23:
              _app.default.cmd += "\n\nType PLAY\n";
              _app.default.allowTyping = true;

              _app.default.onResult =
              /*#__PURE__*/
              function () {
                var _ref = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee(result) {
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (!(result.cmd.toLowerCase() == "play")) {
                            _context.next = 12;
                            break;
                          }

                          _app.default.onResult = _.noop();
                          _app.default.allowTyping = false;
                          _app.default.showTitle = false;
                          _app.default.cmd = "";

                          _sfx.default.boot.fade(1, 0, 600);

                          _sfx.default.menuMusic.fade(1, 0, 600);

                          _context.next = 9;
                          return (0, _sleep.default)(200);

                        case 9:
                          _app.default.toState(_states2.default.play);

                          _context.next = 13;
                          break;

                        case 12:
                          _app.default.cmd += "\nType PLAY\n";

                        case 13:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, this);
                }));

                return function (_x) {
                  return _ref.apply(this, arguments);
                };
              }();

            case 26:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function enter() {
      return _enter.apply(this, arguments);
    }

    return enter;
  }()
}), _defineProperty(_states, _states2.default.play, {
  enter: function () {
    var _enter2 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee6() {
      var enteredValidCmds, startPlaying, _startPlaying;

      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _startPlaying = function _ref5() {
                _startPlaying = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee5() {
                  var countdown, blankChars, blankLines, iid;
                  return regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          _app.default.cmd += "\nGet ready to enter commands... ";
                          _context5.next = 3;
                          return (0, _sleep.default)(1000);

                        case 3:
                          countdown = 5;

                        case 4:
                          if (!countdown--) {
                            _context5.next = 11;
                            break;
                          }

                          _app.default.cmd += "".concat(1 + countdown, " "); // play a sound for the last few seconds of the timer

                          if (countdown > 0) {
                            _sfx.default.timerRelaxed.play();
                          } else {
                            _sfx.default.timerUrgent.play();
                          }

                          _context5.next = 9;
                          return (0, _sleep.default)(1000);

                        case 9:
                          _context5.next = 4;
                          break;

                        case 11:
                          _sfx.default.timerUrgent.play();

                          blankChars = _.times(Math.floor(_consoleCanvas.default.conf.PLAY_CHARS_PER_LINE / 2 - 2), _.constant(" ")).join("");
                          blankLines = _.times(Math.floor(_consoleCanvas.default.conf.MAX_LINES / 2), _.constant("\n")).join("");
                          _app.default.cmd = "".concat(blankChars, "TYPE!").concat(blankLines);
                          _app.default.allowTyping = true; // play gameplay music command music
                          // sfx.play.fade(1, 0, 600, "golden");

                          _sfx.default.play.stop();

                          _sfx.default.play.play("playing"); // Reset fire delay timer


                          allowFire = false;
                          setTimeout(function () {
                            return allowFire = true;
                          }, _config.default.DELAY_BEFORE_FIRE);
                          _context5.next = 22;
                          return (0, _sleep.default)(1000);

                        case 22:
                          _app.default.showScore = true;

                          _app.default.onResult =
                          /*#__PURE__*/
                          function () {
                            var _ref3 = _asyncToGenerator(
                            /*#__PURE__*/
                            regeneratorRuntime.mark(function _callee4(result) {
                              var cmdScore;
                              return regeneratorRuntime.wrap(function _callee4$(_context4) {
                                while (1) {
                                  switch (_context4.prev = _context4.next) {
                                    case 0:
                                      if (result.valid && !enteredValidCmds.includes(result.cmd)) {
                                        cmdScore = _config.default.SCORE_PER_COMMAND;
                                        _app.default.cmd += " \u2714  [".concat(result.lang.join(" "), "]"); // See if the command entered was a golden command

                                        if (_app.default.goldenCommands.all.includes(result.cmd)) {
                                          console.log("GOLDEN COMMAND ENTERED!");

                                          _sfx.default.cmdGold.play(); // Give BIG bonus for golden commands


                                          cmdScore *= _config.default.SCORE_GOLDEN_COMMAND_MULTIPLIER;
                                        } else {
                                          _sfx.default.cmdGood.play();
                                        } // Increase score


                                        _app.default.score += (cmdScore + result.cmd.length) * _config.default.SCORE_OVERALL_MULTIPLIER; // Keep log of entered valid commands

                                        enteredValidCmds.push(result.cmd); // Valid command increment counters

                                        _app.default.count.totalValidCommands++;
                                        _app.default.count.totalValidCharacters += result.cmd.length;
                                      } else {
                                        if (result.valid && enteredValidCmds.includes(result.cmd)) {
                                          _app.default.cmd += " x  [duplicate]";
                                        } else {
                                          _app.default.cmd += " x";
                                        }

                                        _sfx.default.cmdBad.play();
                                      } // if the command submitted is not empty string, add a newline


                                      _app.default.cmd += "\n";
                                      console.log("entered \"".concat(result.cmd, "\"... it's ").concat(result.valid ? "valid!" : "invalid :("));

                                    case 3:
                                    case "end":
                                      return _context4.stop();
                                  }
                                }
                              }, _callee4, this);
                            }));

                            return function (_x3) {
                              return _ref3.apply(this, arguments);
                            };
                          }();

                          _app.default.timer = _config.default.GAME_DURATION / 1000;
                          iid = setInterval(function () {
                            _app.default.timer -= 1; // See if we need to turn up the FIRE!

                            var elapsedTime = _config.default.GAME_DURATION / 1000 - _app.default.timer;
                            var cps = 0;
                            if (elapsedTime > 0) cps = _app.default.count.totalValidCharacters / elapsedTime;
                            console.log(elapsedTime, _app.default.count.totalValidCharacters, cps);

                            if (allowFire && cps >= _config.default.FIRE_CPS_THRESHOLD) {
                              turnUpFire();
                            } else if (fire.userData.on === true && cps < _config.default.FIRE_CPS_THRESHOLD) {
                              turnDownFire();
                            } // play a sound for the last few seconds of the timer


                            if (_app.default.timer <= 10 && _app.default.timer >= 3) {
                              _sfx.default.timerRelaxed.play();
                            } else if (_app.default.timer < 3) {
                              _sfx.default.timerUrgent.play();
                            }

                            if (_app.default.timer <= 0) {
                              clearInterval(iid);
                            }
                          }, 1000);
                          console.log("starting game timer");
                          _context5.next = 29;
                          return (0, _sleep.default)(_app.default.gameDuration);

                        case 29:
                          console.log("game timer o'er");

                          _sfx.default.play.fade(1, 0, 600);

                          controls.enabled = false;
                          _app.default.cmd = "";
                          _app.default.showScore = false;
                          _app.default.onResult = _.noop();
                          _app.default.allowTyping = false;

                          _app.default.toState(_states2.default.score);

                        case 37:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5, this);
                }));
                return _startPlaying.apply(this, arguments);
              };

              startPlaying = function _ref4() {
                return _startPlaying.apply(this, arguments);
              };

              // make font appropriate size for when camera is zoomed in
              _consoleCanvas.default.conf.FONT_SIZE = 4 * 48;
              controls.enabled = true; // Keep a record of entered valid commands

              enteredValidCmds = [];
              _app.default.cmd = "\nEntering game...";
              _app.default.goldenCommands = _app.default.pickGoldenCommands(); // play golden command music

              _sfx.default.play.play("golden");

              _context6.next = 10;
              return (0, _tweenCamera.default)(camera, {
                rotation: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: -4.336209717881005,
                  y: 39.566049707444186,
                  z: 155.4934617372831
                }
              });

            case 10:
              _app.default.cmd = "Randomized BONUS commands ".concat(_config.default.SCORE_GOLDEN_COMMAND_MULTIPLIER, "x points each:\n\n");
              _app.default.cmd += _app.default.printGoldenCommands();
              _app.default.cmd += "\nPress Enter to begin."; // wait for Enter to be pressed and then start the countdown

              _app.default.onKeyPress =
              /*#__PURE__*/
              function () {
                var _ref2 = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee3(ev) {
                  return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          // don't let any other event handlers run
                          ev.preventDefault();
                          ev.stopPropagation();

                          if (ev.keyCode === _keycodes.default.enter) {
                            _app.default.onKeyPress = _.noop;
                            startPlaying();
                          }

                        case 3:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3, this);
                }));

                return function (_x2) {
                  return _ref2.apply(this, arguments);
                };
              }();

            case 14:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function enter() {
      return _enter2.apply(this, arguments);
    }

    return enter;
  }()
}), _defineProperty(_states, _states2.default.score, {
  enter: function () {
    var _enter3 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee8() {
      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _app.default.allowTyping = false; // Turn off Fire

              turnDownFire(); // make font appropriate size for when camera is zoomed in

              _consoleCanvas.default.conf.FONT_SIZE = 4 * 90;
              _context8.next = 5;
              return (0, _tweenCamera.default)(camera, {
                rotation: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                position: {
                  x: -4.336209717881005,
                  y: 39.566049707444186,
                  z: 255.4934617372831
                }
              });

            case 5:
              _context8.next = 7;
              return (0, _sleep.default)(500);

            case 7:
              _app.default.cmd = "GAME OVER\n";
              _app.default.cmd += "score: ".concat(_app.default.score, "\n");
              _app.default.cmd += "Bash: ".concat(_app.default.count.bash, "\n");
              _app.default.cmd += "Python: ".concat(_app.default.count.py, "\n");
              _app.default.cmd += "JavaScript: ".concat(_app.default.count.js, "\n");
              _app.default.cmd += "HTML: ".concat(_app.default.count.html, "\n");
              _app.default.cmd += "Press Enter to continue."; // when any key is pressed, go back to the title screen

              _app.default.onKeyPress =
              /*#__PURE__*/
              function () {
                var _ref6 = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee7(ev) {
                  return regeneratorRuntime.wrap(function _callee7$(_context7) {
                    while (1) {
                      switch (_context7.prev = _context7.next) {
                        case 0:
                          // don't let any other event handlers run
                          ev.preventDefault();
                          ev.stopPropagation();

                          if (ev.keyCode === _keycodes.default.enter) {
                            _app.default.onKeyPress = _.noop;
                            _app.default.cmd = "";

                            _app.default.toState(_states2.default.title);
                          }

                        case 3:
                        case "end":
                          return _context7.stop();
                      }
                    }
                  }, _callee7, this);
                }));

                return function (_x4) {
                  return _ref6.apply(this, arguments);
                };
              }();

            case 15:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, this);
    }));

    function enter() {
      return _enter3.apply(this, arguments);
    }

    return enter;
  }()
}), _states);
window.states = states;

function start() {
  return _start.apply(this, arguments);
}

function _start() {
  _start = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee9() {
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            // set up a state change listener so when the Vue app changes state, we
            // also run the 3D world state changes.
            _app.default.onStateChange = function (change) {
              console.log("state change: ".concat(change.from, " -> ").concat(change.to));

              if (states[change.to]) {
                states[change.to].enter();
              } else {
                throw new Error("tried to enter nonexistant state ".concat(change.to));
              }
            };

            _context9.next = 3;
            return init();

          case 3:
            animate(0);

            _app.default.toState(_states2.default.title);

          case 5:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));
  return _start.apply(this, arguments);
}

function init() {
  return _init.apply(this, arguments);
}

function _init() {
  _init = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee10() {
    var ambientLight, SHADOW_MAP_WIDTH, SHADOW_MAP_HEIGHT, whiteSpot, purpleSpot, comp, screen, screenSize, consolePlaneGeo, consolePlane, texture, cyc;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            container = document.createElement("div");
            document.body.appendChild(container); // scene

            scene = new THREE.Scene(); // const envMap = new THREE.CubeTextureLoader()
            //     .setPath("assets/textures/")
            //     .load([
            //         "wall.png",
            //         "wall.png",
            //         "wall.png",
            //         "wall.png",
            //         "wall.png",
            //         "wall.png"
            //     ]);
            // scene.background = envMap;

            scene.background = new THREE.Color(0.52164000272751 / 4.3, 0.08910000324249 / 4.3, 0.81000000238419 / 4.3); // camera

            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000); // camera.position.z = 350;

            camera.position.z = 2000;
            camera.position.y = 300;
            scene.add(camera);
            controls = new THREE.OrbitControls(camera);
            controls.enabled = false; // controls = new THREE.TrackballControls(camera);
            // lighting

            ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambientLight); // spotlights

            SHADOW_MAP_WIDTH = 1024 * 2, SHADOW_MAP_HEIGHT = 1024 * 2;
            whiteSpot = new THREE.SpotLight(0xffffff, 1.0);
            whiteSpot.position.set(-300, 600, 600);
            whiteSpot.angle = Math.PI / 8;
            whiteSpot.penumbra = 0.5;
            whiteSpot.decay = 2;
            whiteSpot.distance = 4000; // whiteSpot.castShadow = true;
            // whiteSpot.shadow.mapSize.width = 1 * SHADOW_MAP_WIDTH;
            // whiteSpot.shadow.mapSize.height = 1 * SHADOW_MAP_HEIGHT;
            // whiteSpot.shadow.camera.near = 10;
            // whiteSpot.shadow.camera.far = 2000;
            // whiteSpot.add(new THREE.SpotLightHelper(whiteSpot));

            scene.add(whiteSpot);
            purpleSpot = new THREE.SpotLight(0xda8aff, 1.0);
            purpleSpot.position.set(200, 200, 200);
            purpleSpot.angle = Math.PI / 4;
            purpleSpot.penumbra = 0.5;
            purpleSpot.decay = 4;
            purpleSpot.distance = 2000;
            purpleSpot.castShadow = true;
            purpleSpot.shadow.mapSize.width = 1 * SHADOW_MAP_WIDTH;
            purpleSpot.shadow.mapSize.height = 1 * SHADOW_MAP_HEIGHT;
            purpleSpot.shadow.camera.near = 200;
            purpleSpot.shadow.camera.far = 1000; // purpleSpot.add(new THREE.SpotLightHelper(purpleSpot));

            scene.add(purpleSpot); // models
            // load computer

            _context10.next = 34;
            return (0, _threeUtils.loadMesh)("assets/models/", "CLH_ep2_computer_high_poly.mtl", "CLH_ep2_computer_high_poly.obj");

          case 34:
            comp = _context10.sent;
            // make the screen reflect a crisp image
            comp.materials.materials.screen.roughness = 0.08;
            comp.materials.materials.purple.roughness = 0.7; // comp.materials.materials.purple
            // comp.materials.materials.red

            comp.object.position.y = -300;
            comp.object.position.x = 0; // enable shadows for each object in the set of computer meshes

            comp.object.children.forEach(function (c) {
              c.castShadow = true;
              c.receiveShadow = true;
            });
            comp.object.castShadow = true;
            comp.object.receiveShadow = true; // set up a special canvas material for the screen

            screen = _.find(comp.object.children, {
              name: "IBM_5150_Monitor_-_glass"
            });
            screen.material = new THREE.MeshBasicMaterial();
            screen.material.map = new THREE.CanvasTexture(_consoleCanvas.default.canvas);
            window.screen = screen;
            computer = comp.object;
            window.comp = comp;
            scene.add(comp.object);
            camera.lookAt(comp.object.position); // create a TEMPORARY flat plane to draw the console on.
            // the comp model we have doesnt' have UV coordinates, so we can't draw a
            // texture onto it.  for now, create a 3d plane, position it just
            // in front of the screen, and draw the console onto it.
            // (TODO: remove this once we have a comp model with UV coords)
            // get the screen position and dimensions and copy them

            screen.geometry.computeBoundingBox();
            screenSize = {
              width: screen.geometry.boundingBox.max.x - screen.geometry.boundingBox.min.x,
              height: screen.geometry.boundingBox.max.y - screen.geometry.boundingBox.min.y
            };
            consolePlaneGeo = new THREE.PlaneGeometry(screenSize.width, screenSize.height);
            consolePlane = new THREE.Mesh(consolePlaneGeo, screen.material);
            consolePlane.position.set(-5.5, 42.8, 26);
            consolePlane.rotation.x = -0.16;
            screen.visible = false;
            window.consolePlane = consolePlane;
            scene.add(consolePlane); // Fire

            firePlane = new THREE.PlaneBufferGeometry(screenSize.width * 1.2, screenSize.height * 1.2);
            fire = new THREE.Fire(firePlane, {
              textureWidth: 512,
              textureHeight: 512,
              debug: false
            });
            texture = new THREE.TextureLoader().load("assets/images/monitor_bezel_outline.png");
            texture.needsUpdate = true;
            fire.clearSources();
            fire.setSourceMap(texture);
            fire.color1.set(0x00bdf7);
            fire.color2.set(0x1b3fb6);
            fire.color3.set(0x18171b);
            fire.position.set(-5.5, 42.8, 26.5);
            fire.rotation.x = -0.16;
            fire.userData.on = false;
            window.fire = fire; // load cyc wall

            _context10.next = 74;
            return (0, _threeUtils.loadMesh)("assets/models/", "CLH_ep2_cyc_wall.mtl", "CLH_ep2_cyc_wall.obj");

          case 74:
            cyc = _context10.sent;
            window.cyc = cyc.object;
            cyc.object.position.y = 50;
            cyc.object.children[0].castShadow = true;
            cyc.object.children[0].receiveShadow = true;
            cyc.materials.materials.purple.metalness = 0.7;
            cyc.materials.materials.purple.roughness = 1.0;
            scene.add(cyc.object); // init renderer

            renderer = new THREE.WebGLRenderer({
              canvas: document.querySelector("#game-canvas"),
              antialias: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;
            container.appendChild(renderer.domElement);
            document.addEventListener("mousemove", onDocumentMouseMove, false); //

            window.addEventListener("resize", onWindowResize, false);

          case 90:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));
  return _init.apply(this, arguments);
}

function turnUpFire() {
  fire.windVector.y = -0.25;
  fire.colorBias = 0.25;
  fire.burnRate = 2.6;
  fire.diffuse = 5.0;
  fire.viscosity = 0.5;
  fire.expansion = 0.75;
  fire.swirl = 30.0;
  fire.drag = 0.0;
  fire.airSpeed = 40.0;
  fire.speed = 500.0;
  fire.userData.on = true;
  scene.add(fire);
}

window.turnUpFire = turnUpFire;

function turnDownFire() {
  new TWEEN.Tween(fire).to({
    airSpeed: 50,
    burnRate: 10,
    speed: 1000,
    expansion: -0.6
  }, 2000).easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth.
  .onComplete(function () {
    fire.userData.on = false;
    scene.remove(fire);
  }).start();
}

window.turnDownFire = turnDownFire;

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) / 2;
  mouseY = (event.clientY - windowHalfY) / 2;
}

function animate(time) {
  requestAnimationFrame(animate);
  render(time);
}

function render(time) {
  stats.begin();
  TWEEN.update(time); // update the canvas-based material

  screen.material.map.needsUpdate = true;

  _app.default.updateConsole();

  renderer.render(scene, camera);
  stats.end();
}

start();
},{"../node_modules/three/examples/js/loaders/OBJLoader.js":"node_modules/three/examples/js/loaders/OBJLoader.js","../node_modules/three/examples/js/controls/OrbitControls.js":"node_modules/three/examples/js/controls/OrbitControls.js","../node_modules/three/examples/js/controls/TrackballControls.js":"node_modules/three/examples/js/controls/TrackballControls.js","../node_modules/three/examples/js/objects/Fire.js":"node_modules/three/examples/js/objects/Fire.js","./MTLLoaderPhysical.js":"src/MTLLoaderPhysical.js","./palette.js":"src/palette.js","./app.js":"src/app.js","./tween-camera.js":"src/tween-camera.js","./keycodes.js":"src/keycodes.js","./three-utils.js":"src/three-utils.js","./states.js":"src/states.js","./sleep.js":"src/sleep.js","./console-canvas.js":"src/console-canvas.js","./config.js":"src/config.js","./sfx.js":"src/sfx.js"}],"../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
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
},{}]},{},["../../.nvm/versions/node/v11.4.0/lib/node_modules/parcel/src/builtins/hmr-runtime.js","src/main.js"], null)
//# sourceMappingURL=/main.1e43358e.map