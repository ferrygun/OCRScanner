/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

/* global THREE */

// Provides the base visual object.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/Object", "./Utilities", "./thirdparty/ColladaLoader"
], function(jQuery, BaseObject, Utilities, dummy /* ColladaLoader */) {
	"use strict";

	var thisModule = "sap.ui.vbm.adapter3d.SceneBuilder";

	var degToRad = THREE.Math.degToRad;
	var log      = jQuery.sap.log;
	var Box3     = THREE.Box3;
	var Face3    = THREE.Face3;
	var Matrix4  = THREE.Matrix4;
	var Vector2  = THREE.Vector2;
	var Vector3  = THREE.Vector3;

	// Each visual object instance has its own Object3D instance.
	// Each Collada model's Object3D has a full copy of Collada model.
	// Box visual objects share the box geometries.
	// There are two box geometries - one with UV coordinates for 4 sided texture, one for 6 sided texture.
	// Each Mesh instance has its own material instance.
	// Materials share textures.
	// Shared three.js objects have the _sapRefCount property to track the lifetime.
	//
	// Visual object instances can have SceneBuilder specific properties to track changes:
	//   _lastModel    - a Collada model resource namem
	//   _lastTexture  - an image resource name,
	//   _lastTexture6 - an indicator to use a 6-sided texture, it affects what box geometry to generate.
	// Technically a delta VBI JSON can assign a new value to the texture or model properties,
	// so we have track that we need to replace three.js objects with new values.
	// All other properties (e.g. color, position etc) will be re-assigned for visual object instances marked as 'updated'.

	var refCountPropertyName = "_sapRefCount";

	// Forward declarations.
	var createBox;
	var removeLightsAndCameras;
	var convertCoordinateSystem;
	var normalizeObject3D;
	var toBoolean    = Utilities.toBoolean;
	var toFloat      = Utilities.toFloat;      // eslint-disable-line no-unused-vars
	var toVector3    = Utilities.toVector3;
	var toColor      = Utilities.toColor;
	var toDeltaColor = Utilities.toDeltaColor; // eslint-disable-line no-unused-vars

	/**
	 * Constructor for a new three.js scene builder.
	 *
	 * @class
	 * Provides a base class for three.js scene builder.
	 *
	 * @private
	 * @author SAP SE
	 * @version 1.52.4
	 * @alias sap.ui.vbm.adapter3d.SceneBuilder
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
	var SceneBuilder = BaseObject.extend("sap.ui.vbm.adapter3d.SceneBuilder", /** @lends sap.ui.vbm.adapter3d.SceneBuilder.prototype */ {
		metadata: {
			publicMethods: [
				"synchronize"
			]
		},

		constructor: function(groups, instances, resources, root) {
			BaseObject.call(this);

			// These three objects are shared with Adapter3D and VBIJSONParser.
			this._groups = groups;
			this._instances = instances;
			this._resources = resources;

			// This object is shared with Adapter3D.
			this._root = root;

			// These two objects are created on first use.
			this._textureLoader = null;
			this._colladaLoader = null;

			// Cached objects.

			// Textures can be shared amongst multiple 3D objects. Their properties are not changed after creation.
			// THREE.Texture objects will have property _sapRefCount.
			this._textures = new Map(); // Texture name -> THREE.Texture;

			// The Box geometry can be shared amongst multiple 3D objects. Its properties are not changed after creation.
			// The Box geometry will have property _sapRefCount.
			this._boxGeometryWith4SidedTexture = null;
			this._boxGeometryWith6SidedTexture = null;
		}
	});

	SceneBuilder.prototype.destroy = function() {
		// Reset references to shared objects.
		this._resources = null;
		this._groups = null;
		this._instances = null;
		this._root = null;

		BaseObject.prototype.destroy.call(this);
	};

	/**
	 * Builds or updates the three.js scene.
	 *
	 * @returns {Promise} A Promise that gets resolved when the scene has been built or updated.
	 * @public
	 */
	SceneBuilder.prototype.synchronize = function() {
		var that = this;

		return new Promise(function(resolve, reject) {
			// More than one Collada model visual object instance can have the same model property.
			// In this case the Collada model is loaded only once.
			// All but the last Collada model visual object instances will get a clone of the Collada model.
			// The last Collada model visual object instance will be assigned the loaded Collada model.
			var models = new Map(); // collada model resource name -> { object3D: THREE.Group, refCount: int }.

			// Adds a model the models map. Counts references to the model.
			// The object3D property will be populated later in the _loadModels method.
			var addModel = function(model) {
				if (models.has(model)) {
					models.get(model).refCount += 1;
				} else {
					models.set(model, { object3D: null, refCount: 1 });
				}
			};

			// A list of textures added during this call to the apply method.
			// The THREE.Texture objects will be created later in the _loadTextures method.
			var textures = new Set(); // image resource names.

			// Visual object instances split by types of changes.
			var toAdd    = that._instances.filter(function(instance) { return instance.isAdded;   });
			var toDelete = that._instances.filter(function(instance) { return instance.isDeleted; });
			var toUpdate = that._instances.filter(function(instance) { return instance.isUpdated; });

			var toAddOrUpdate = [].concat(toAdd, toUpdate);

			toAddOrUpdate
				.filter(function(instance) { return instance.isColladaModel && instance.model && instance.model !== instance._lastModel; })
				.map(function(instance) { return instance.model; })
				.forEach(addModel);

			toAddOrUpdate
				.filter(function(instance) { return instance.texture && instance.texture !== instance._lastTexture; })
				.map(function(instance) { return instance.texture; })
				.forEach(textures.add, textures);

			that._loadTextures(textures)
				.then(function() {
					return that._loadModels(models);
				})
				.then(function() {
					toDelete.forEach(that._destroyVisualObjectInstance.bind(that, that._root));
					toUpdate.forEach(that._updateVisualObjectInstance.bind(that, that._root, models));
					toAdd.forEach(that._addVisualObjectInstance.bind(that, that._root, models));
					that._cleanupCache();
					resolve();
				})
				.catch(function(reason) {
					reject(reason);
				});
		});
	};

	SceneBuilder.prototype._loadTextures = function(textureResourceNames) {
		var promises = [];
		textureResourceNames.forEach(function(textureResourceName) {
			if (!this._textures.has(textureResourceName)) {
				promises.push(this._loadTexture(textureResourceName));
			}
		}, this);
		return Promise.all(promises);
	};

	SceneBuilder.prototype._loadTexture = function(textureResourceName) {
		var that = this;

		// TODO: test that the texture resource exists in this._resources.

		return new Promise(function(resolve, reject) {
			that._getTextureLoader().load(
				that._resources.get(textureResourceName),
				function(texture) {
					texture.flipY = false; // Use the Direct3D texture coordinate space where the origin is in the top left corner.
					texture[refCountPropertyName] = 0;
					that._textures.set(textureResourceName, texture);
					resolve();
				},
				null,
				function(xhr) {
					log.error(
						"Failed to load texture from Data URI: " + textureResourceName,
						"status: " + xhr.status + ", status text: " + xhr.statusText,
						thisModule
					);
					resolve(); // Do not fail.
				}
			);
		});
	};

	SceneBuilder.prototype._loadModels = function(models) {
		var promises = [];
		models.forEach(function(content, modelResourceName) {
			promises.push(this._loadModel(modelResourceName, content));
		}, this);
		return Promise.all(promises);
	};

	SceneBuilder.prototype._loadModel = function(modelResourceName, content) {
		var that = this;

		return new Promise(function(resolve, reject) {
			try {
				that._getColladaLoader().parse(
					that._resources.get(modelResourceName),
					function(collada) {
						removeLightsAndCameras(collada.scene);
						collada.scene.traverse(convertCoordinateSystem);
						collada.scene.rotateX(degToRad(180));
						content.object3D = collada.scene;
						resolve();
					}
				);
			} catch (e) {
				log.error(
					"Failed to load Collada model from resource: " + modelResourceName,
					e instanceof Error ? e.message : "",
					thisModule
				);
				resolve(); // Do not fail.
			}
		});
	};

	SceneBuilder.prototype._releaseTexture = function(texture) {
		if (texture.hasOwnProperty(refCountPropertyName)) {
			texture[refCountPropertyName] -= 1;
		} else {
			texture.dispose();
		}
		return this;
	};

	SceneBuilder.prototype._addRefTexture = function(texture) {
		if (!texture.hasOwnProperty(refCountPropertyName)) {
			texture[refCountPropertyName] = 0;
		}
		texture[refCountPropertyName] += 1;
		return this;
	}

	SceneBuilder.prototype._releaseGeometry = function(geometry) {
		if (geometry.hasOwnProperty(refCountPropertyName)) {
			geometry[refCountPropertyName] -= 1;
		} else {
			geometry.dispose();
		}
		return this;
	}

	SceneBuilder.prototype._addRefGeometry = function(geometry) {
		if (!geometry.hasOwnProperty(refCountPropertyName)) {
			geometry[refCountPropertyName] = 0;
		}
		geometry[refCountPropertyName] += 1;
		return this;
	};

	/**
	 * Cleans up the scene builder's cache.
	 *
	 * If some textures are not referenced from materials anymore they will be disposed of.
	 * If there are no more Box visual object instances the box geometry will be disposed of.
	 *
	 * @returns {sap.ui.vbm.adapter3d.SceneBuilder} <code>this</code> to allow method chaining.
	 * @private
	 */
	SceneBuilder.prototype._cleanupCache = function() {
		this._textures.forEach(function(texture) {
			if (texture[refCountPropertyName] === 0) {
				texture.dispose();
				this._textures.delete(texture);
			}
		});

		if (this._boxGeometryWith4SidedTexture && this._boxGeometryWith4SidedTexture[refCountPropertyName] === 0) {
			this._boxGeometryWith4SidedTexture.dispose();
			this._boxGeometryWith4SidedTexture = null;
		}

		if (this._boxGeometryWith6SidedTexture && this._boxGeometryWith6SidedTexture[refCountPropertyName] === 0) {
			this._boxGeometryWith6SidedTexture.dispose();
			this._boxGeometryWith6SidedTexture = null;
		}

		return this;
	};

	SceneBuilder.prototype._destroyVisualObjectInstance = function(root, instance) {
		var that = this;
		if (instance.object3D) {
			instance.object3D.traverse(function(node) {
				if (node.isMesh) {
					var material = node.material;
					if (material) {
						var texture = material.map;
						if (texture) {
							that._releaseTexture(texture);
							material.map = null;
						}
						material.dispose();
						node.material = null;
					}

					var geometry = node.geometry;
					if (geometry) {
						that._releaseGeometry(geometry);
						node.geometry = null;
					}
				}
			});
			root.remove(instance.object3D);
			instance.object3D = null;
			instance._lastModel = null;
			instance._lastTexture = null;
			instance._lastTexture6 = null;
		}
		return this;
	};

	SceneBuilder.prototype._updateVisualObjectInstance = function(root, models, instance) {
		if (instance.isColladaModel) {
			if (instance.model !== instance._lastModel) {
				// Collada models could be very complex so it is easier to replace the whole sub-tree with a new one
				return this._destroyVisualObjectInstance(root, instance)._addVisualObjectInstance(root, models, instance);
			}
			this._assignColladaModelProperties(instance);
		} else if (instance.isBox) {
			this._assignBoxProperties(instance);
		}
		return this;
	};

	SceneBuilder.prototype._addVisualObjectInstance = function(root, models, instance) {
		if (instance.isColladaModel) {
			instance.object3D = new THREE.Group();
			instance._lastModel = instance.model;
			var content = models.get(instance.model);
			// The last visual object instance re-uses the loaded Collada model.
			var colladaRootNode = --content.refCount === 0 ? content.object3D : content.object3D.clone();
			if (toBoolean(instance.normalize)) {
				normalizeObject3D(colladaRootNode);
			}
			instance.object3D.add(colladaRootNode);
			// Replace materials of all meshes in this sub-tree with a new one.
			this._assignMaterial(instance.object3D, this._createMaterial());
			this._assignColladaModelProperties(instance);
		} else if (instance.isBox) {
			// The geometry will be assigned in the _assignBoxProperties method as it depends on property 'texture6'.
			instance.object3D = new THREE.Group();
			instance.object3D.add(new THREE.Mesh(undefined, this._createMaterial()));
			this._assignBoxProperties(instance);
		}
		if (instance.object3D) {
			root.add(instance.object3D);
		}
		return this;
	};

	SceneBuilder.prototype._assignColladaModelProperties = function(instance) {
		this._assignProperties(instance);
		return this;
	};

	SceneBuilder.prototype._assignBoxProperties = function(instance) {
		if (instance._lastTexture6 !== instance.texture6) {
			// The geometry needs to be re-created or initially created.
			// Initially _lastTexture6 is undefined.
			var boxMesh = instance.object3D.children[0];
			if (boxMesh.geometry) {
				this._releaseGeometry(boxMesh.geometry);
			}
			boxMesh.geometry = this._getBoxGeometry(toBoolean(instance.texture6));
			this._addRefGeometry(boxMesh.geometry);
			boxMesh.scale.set(1, -1, -1);
			if (toBoolean(instance.normalize)) {
				normalizeObject3D(boxMesh);
			}
			boxMesh.rotateX(degToRad(180));
			instance._lastTexture6 = instance.texture6;
		}
		this._assignProperties(instance);
		return this;
	};

	// Assign properties common to Box and Collada Model.
	SceneBuilder.prototype._assignProperties = function(instance) {
		// The texture6 property is not applicable to Collada Model, so handle it in the _assignBoxProperties only.

		if (instance._lastTexture && instance._lastTexture !== instance.texture) {
			this._removeTexture(instance);
		}
		if (instance.texture) {
			this._assignTexture(instance);
		}
		instance._lastTexture = instance.texture;

		var color = toColor(instance.color);
		instance.object3D.traverse(function(node) {
			if (node.isMesh && node.material) {
				node.material.color = color.rgb;
				node.material.opacity = color.opacity;
				node.material.transparent = color.opacity < 1;
			}
		});

		var scale = toVector3(instance.scale);
		instance.object3D.scale.set(scale[0], scale[1], scale[2]);

		var rotation = toVector3(instance.rot);
		instance.object3D.rotation.set(rotation[0], degToRad(-rotation[1]), degToRad(-rotation[2]));

		var position = toVector3(instance.pos);
		instance.object3D.position.set(-position[0], position[1], position[2]);

		instance.object3D.traverse(function(node) {
			node._sapInstance = instance;
		});

		return this;
	};

	SceneBuilder.prototype._removeTexture = function(instance) {
		if (instance.object3D) {
			var that = this;
			instance.object3D.traverse(function(node) {
				if (node.isMesh && node.material && node.material.map) {
					that._releaseTexture(node.material.texture);
					node.material.map = null;
				}
			});
		}
		return this;
	};

	SceneBuilder.prototype._assignTexture = function(instance) {
		if (instance.object3D) {
			var that = this;
			var texture = this._textures.get(instance.texture);
			instance.object3D.traverse(function(node) {
				if (node.isMesh && node.material) {
					node.material.map = texture;
					that._addRefTexture(texture);
				}
			});
		}
		return this;
	};

	SceneBuilder.prototype._createMaterial = function() {
		return new THREE.MeshPhongMaterial();
	};

	SceneBuilder.prototype._assignMaterial = function(object3D, material) {
		object3D.traverse(function(node) {
			if (node.isMesh) {
				// No need to dispose of the old material and textures as the mesh was not rendered yet
				// and there is nothing loaded to the GPU.
				node.material = material;
			}
		});
		return this;
	};

	SceneBuilder.prototype._getBoxGeometry = function(hasSixSidedTexture) {
		var boxGeometryName = hasSixSidedTexture ? "_boxGeometryWith6SidedTexture" : "_boxGeometryWith4SidedTexture";
		return this[boxGeometryName] || (this[boxGeometryName] = createBox(hasSixSidedTexture));
	}

	SceneBuilder.prototype._getTextureLoader = function() {
		return this._textureLoader || (this._textureLoader = new THREE.TextureLoader());
	};

	SceneBuilder.prototype._getColladaLoader = function() {
		return this._colladaLoader || (this._colladaLoader = new THREE.ColladaLoader());
	};

	////////////////////////////////////////////////////////////////////////////

	/**
	 * Removes descendant nodes that are lights or cameras.
	 *
	 * @param {THREE.Object3D} node The node to process.
	 * @returns {THREE.Object3D} The input <code>node</code> parameter to allow method chaining.
	 * @private
	 */
	removeLightsAndCameras = function(node) {
		var objectsToRemove = [];
		node.traverse(function(object) {
			if (object.isLight || object.isCamera) {
				objectsToRemove.push(object);
			}
		});
		objectsToRemove.forEach(function(object) {
			while (object && object !== node) { // Do not remove the top level node.
				var parent = object.parent;
				if (object.children.length === 0) {
					parent.remove(object);
				}
				object = parent;
			}
		});
		return node;
	};

	/**
	 * Converts geometry from the left-hand coordinate system to the right-hand one
	 * to be compatible with the legacy Visual Business code.
	 *
	 * The legacy Visual Business code defines the coordinate axes as follows:
	 *   X points to the west,
	 *   Y points to the south,
	 *   Z points towards the Earth's centre.
	 *
	 * In our right-hand coordinate system the X axis points to the east.
	 *
	 * @param {THREE.Object3D|THREE.Geometry} object The object to process.
	 * @returns {THREE.Object3D|THREE.Geometry} The input <code>object</code> parameter to allow method chaining.
	 * @private
	 */
	convertCoordinateSystem = function(object) {
		// Swap last two indices of each face to convert the winding order to counter-clockwise.
		function toCCW(face, indexA, indexB) {
			indexA = indexA || 1;
			indexB = indexB || 2;
			var temp = face[indexA];
			face[indexA] = face[indexB];
			face[indexB] = temp;
		}

		// Invert the coordinates.
		function invert(v) {
			v.x = -v.x;
		}

		function convert(geometry) {
			geometry.vertices.forEach(invert);

			geometry.faces.forEach(function(face) {
				toCCW(face, "b", "c");
				if (face.normal) {
					invert(face.normal);
				}
				if (face.vertexNormals && face.vertexNormals.length === 3) {
					toCCW(face.vertexNormals);
					invert(face.vertexNormals[0]);
					invert(face.vertexNormals[1]);
					invert(face.vertexNormals[2]);
				}
				if (face.vertexColors && face.vertexColors.length === 3) {
					toCCW(face.vertexColors);
				}
			});

			geometry.faceVertexUvs.forEach(function(uvs) {
				uvs.forEach(function(face) {
					toCCW(face);
				});
			});

			return geometry;
		}

		if (object.isMesh && object.geometry && object.geometry.isGeometry) {
			convert(object.geometry);
		} else if (object.isGeometry) {
			convert(object);
		}
		return object;
	};

	/**
	 * Normalize the object.
	 *
	 * The node is centered and then scaled uniformly so that vertex coordinates fit into the 3D box defined as range [(-1, -1, -1), (+1, +1, +1)].
	 *
	 * @param {THREE.Object3D} node The node to normalize.
	 * @returns {THREE.Object3D} The input <code>node</code> parameter to allow method chaining.
	 * @private
	 */
	normalizeObject3D = function(node) {
		// Re-centre according to the VB ActiveX implementation.
		var center = new Box3().setFromObject(node).getCenter();
		node.position.add(new Vector3(-center.x, -center.y, +center.z)); // NB: sic! the Z move is positive.

		// Normalize coordinates (not the size!) according to the VB ActiveX implementation.
		var box = new Box3().setFromObject(node);
		var scaleFactor = Math.max(
			Math.abs(box.min.x),
			Math.abs(box.min.y),
			Math.abs(box.min.z),
			Math.abs(box.max.x),
			Math.abs(box.max.y),
			Math.abs(box.max.z)
		);
		if (scaleFactor) {
			scaleFactor = 1 / scaleFactor;
		}
		// NB: it's not the same as node.scale.multiplyScalar(scaleFactor) because the node might already be moved at the re-centring step.
		node.applyMatrix(new Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor));

		// Move the object so that its anchor point is at the origin.
		// The anchor point is usually at the bottom of the geometry.
		// See the VB ActiveX implementation. This JS implementation might be an inaccurate copy of the original one.
		box = new Box3().setFromObject(node);
		center = box.getCenter();
		node.translateZ(center.z - (box.max.z < 0 ? box.max.z : box.min.z));

		return node;
	};

	/**
	 * Creates a box.
	 *
	 * We cannot use the three.js BoxGeometry class as its faces, UVs etc are quite different from what is expected in legacy VB.
	 *
	 * The geometry is generated according to the algorithm in the legacy VB ActiveX control.
	 *
	 * @param {boolean} hasSixSidedTexture If equals <code>true</code> assign UV coordinates for 6-sided texture, otherwise for 4-sided texture.
	 * @returns {THREE.Geometry} The box geometry.
	 * @private
	 */
	createBox = function(hasSixSidedTexture) {
		var geometry = new THREE.Geometry();
		var halfSideLength = 0.1;

		geometry.vertices.push(
			// Top
			new Vector3( halfSideLength,  halfSideLength, -halfSideLength),
			new Vector3( halfSideLength, -halfSideLength, -halfSideLength),
			new Vector3(-halfSideLength, -halfSideLength, -halfSideLength),
			new Vector3(-halfSideLength,  halfSideLength, -halfSideLength),

			// Bottom
			new Vector3( halfSideLength,  halfSideLength,  halfSideLength),
			new Vector3(-halfSideLength,  halfSideLength,  halfSideLength),
			new Vector3(-halfSideLength, -halfSideLength,  halfSideLength),
			new Vector3( halfSideLength, -halfSideLength,  halfSideLength),

			// Right
			new Vector3( halfSideLength,  halfSideLength, -halfSideLength),
			new Vector3( halfSideLength,  halfSideLength,  halfSideLength),
			new Vector3( halfSideLength, -halfSideLength,  halfSideLength),
			new Vector3( halfSideLength, -halfSideLength, -halfSideLength),

			// Front
			new Vector3( halfSideLength, -halfSideLength, -halfSideLength),
			new Vector3( halfSideLength, -halfSideLength,  halfSideLength),
			new Vector3(-halfSideLength, -halfSideLength,  halfSideLength),
			new Vector3(-halfSideLength, -halfSideLength, -halfSideLength),

			// Left
			new Vector3(-halfSideLength, -halfSideLength, -halfSideLength),
			new Vector3(-halfSideLength, -halfSideLength,  halfSideLength),
			new Vector3(-halfSideLength,  halfSideLength,  halfSideLength),
			new Vector3(-halfSideLength,  halfSideLength, -halfSideLength),

			// Back
			new Vector3( halfSideLength,  halfSideLength,  halfSideLength),
			new Vector3( halfSideLength,  halfSideLength, -halfSideLength),
			new Vector3(-halfSideLength,  halfSideLength, -halfSideLength),
			new Vector3(-halfSideLength,  halfSideLength,  halfSideLength)
		);

		var defaultColor = new THREE.Color(0.5, 0.5, 0.5);

		geometry.faces.push(
			// Top
			new Face3(0, 2, 3, new Vector3( 0,  0, -1), defaultColor),
			new Face3(0, 1, 2, new Vector3( 0,  0, -1), defaultColor),

			// Bottom
			new Face3(4, 5, 6, new Vector3( 0,  0,  1), defaultColor),
			new Face3(4, 6, 7, new Vector3( 0,  0,  1), defaultColor),

			// Right
			new Face3(8, 10, 11, new Vector3( 1,  0,  0), defaultColor),
			new Face3(8,  9, 10, new Vector3( 1,  0,  0), defaultColor),

			// Front
			new Face3(12, 14, 15, new Vector3( 0, -1,  0), defaultColor),
			new Face3(12, 13, 14, new Vector3( 0, -1,  0), defaultColor),

			// Left
			new Face3(16, 18, 19, new Vector3(-1,  0,  0), defaultColor),
			new Face3(16, 17, 18, new Vector3(-1,  0,  0), defaultColor),

			// Back
			new Face3(20, 22, 23, new Vector3( 0,  1,  0), defaultColor),
			new Face3(20, 21, 22, new Vector3( 0,  1,  0), defaultColor)
		);

		var uvs;

		if (hasSixSidedTexture) {
			uvs = [
				// Top
				new Vector2(2/3, 0.5),
				new Vector2(1.0, 0.5),
				new Vector2(1.0, 1.0),
				new Vector2(2/3, 1.0),

				// Bottom
				// VB ActiveX incorrectly defines bottom the same as right/left, though the comments say it is the same as top.
				new Vector2(2/3, 0.0),
				new Vector2(1.0, 0.0),
				new Vector2(1.0, 0.5),
				new Vector2(2/3, 0.5),

				// Right
				new Vector2(2/3, 0.5),
				new Vector2(2/3, 1.0),
				new Vector2(1/3, 1.0),
				new Vector2(1/3, 0.5),

				// Front
				new Vector2(2/3, 0.0),
				new Vector2(2/3, 0.5),
				new Vector2(1/3, 0.5),
				new Vector2(1/3, 0.0),

				// Left
				new Vector2(1/3, 0.5),
				new Vector2(1/3, 1.0),
				new Vector2(0.0, 1.0),
				new Vector2(0.0, 0.5),

				// Back
				new Vector2(0.0, 0.5),
				new Vector2(0.0, 0.0),
				new Vector2(1/3, 0.0),
				new Vector2(1/3, 0.5)
			];
		} else {
			// Use the Direct3D texture coordinate space where the origin is in the top left corner.
			// If there is a texture with the following quadrants
			// (0,0)                       (1,0)
			//      +----------+----------+
			//      |   BACK   |  FRONT   |
			//      +----------+----------+
			//      |RIGHT/LEFT|TOP/BOTTOM|
			//      +----------+----------+
			// (0,1)                       (1,1)
			// then those quadrants should map to faces as in the comments below.
			uvs = [
				// Top
				new Vector2(0.5, 0.5),
				new Vector2(1.0, 0.5),
				new Vector2(1.0, 1.0),
				new Vector2(0.5, 1.0),

				// Bottom
				// VB ActiveX incorrectly defines bottom the same as right/left, though the comments say it is the same as top.
				new Vector2(0.5, 0.5),
				new Vector2(1.0, 0.5),
				new Vector2(1.0, 1.0),
				new Vector2(0.5, 1.0),

				// Right
				new Vector2(0.5, 0.5),
				new Vector2(0.5, 1.0),
				new Vector2(0.0, 1.0),
				new Vector2(0.0, 0.5),

				// Front
				new Vector2(0.5, 0.5),
				new Vector2(0.5, 0.0),
				new Vector2(1.0, 0.0),
				new Vector2(1.0, 0.5),

				// Left
				new Vector2(0.5, 0.5),
				new Vector2(0.5, 1.0),
				new Vector2(0.0, 1.0),
				new Vector2(0.0, 0.5),

				// Back
				new Vector2(0.0, 0.5),
				new Vector2(0.0, 0.0),
				new Vector2(0.5, 0.0),
				new Vector2(0.5, 0.5)
			];
		}

		geometry.faceVertexUvs[0].push(
			// Top
			[ uvs[0], uvs[2], uvs[3] ],
			[ uvs[0], uvs[1], uvs[2] ],

			// Bottom
			[ uvs[4], uvs[5], uvs[6] ],
			[ uvs[4], uvs[6], uvs[7] ],

			// Right
			[ uvs[8], uvs[10], uvs[11] ],
			[ uvs[8],  uvs[9], uvs[10] ],

			// Front
			[ uvs[12], uvs[14], uvs[15] ],
			[ uvs[12], uvs[13], uvs[14] ],

			// Left
			[ uvs[16], uvs[18], uvs[19] ],
			[ uvs[16], uvs[17], uvs[18] ],

			// Back
			[ uvs[20], uvs[22], uvs[23] ],
			[ uvs[20], uvs[21], uvs[22] ]
		);

		convertCoordinateSystem(geometry);
		return geometry;
	};

	return SceneBuilder;
});
