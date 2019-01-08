/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element", "sap/ui/vk/NodeProxy", "./ArrayUtilities", "./MatrixUtilities"],
    function (jQuery, SapUiCoreElement, SapUiVkNodeProxy, SapUiVtmArrayUtilities, SapUiVtmMatrixUtilities) {

        "use strict";

        /**
         * This class is not intended to be directly instantiated by application code.
         * The scene traversal methods ({@link sap.ui.vtm.Scene#traverseTree traverseTree}, {@link sap.ui.vtm.Scene#traverseBranch traverseBranch}, {@link sap.ui.vtm.Scene#traverseNodes traverseNodes}) should be used to access scene nodes
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.SceneNode
         * @public
         * @class
         * This class provides access to the data for a scene node.
         * Objects of this type are transient. Long lived references to such objects should not be kept.
         * A single {@link sap.ui.vtm.SceneNode} object can be reused to refer to a different scene node by changing the value of the <code>sceneNodeId</code> property.
         * Scene traversal methods typically reuse a single {@link sap.ui.vtm.SceneNode} object to avoid construction and destruction.
         * Applications are expected to use their own data structures to store data extracted from scene nodes that needs to be accessed efficiently.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string] sId An optional ID for the {@link sap.ui.vtm.SceneNode}.
         * @param {object} [mSettings] An optional object with initial settings for the new {@link sap.ui.vtm.SceneNode} instance.
         * @extends sap.ui.core.Element
         */
        var SceneNode = SapUiCoreElement.extend("sap.ui.vtm.SceneNode", /** @lends sap.ui.vtm.SceneNode.prototype */ {
            metadata: {
                properties: {
                    /**
                     * The scene node id.
                     *
                     * This is a transient identifier that exists in the context of the current scene. It should not be persisted.
                     */
                    sceneNodeId: {
                        type: "string"
                    },

                    /**
                     * The {@link sap.ui.vtm.Scene} for the scene node.
                     */
                    scene: {
                        type: "object"
                    }
                }
            },

            /**
             * Frees the underlying node proxy.
             * @private
             * @function
             */
            _destroy: function() {
                if (this._vkNodeProxy) {
                    this.getScene()._getNodeHierarchy().destroyNodeProxy(this.getSceneNodeId());
                    this._vkNodeProxy = null;
                }
            },

            exit: function() {
                this._destroy();
            },

            /**
             * Throws an exception if the node proxy has been deleted.
             * @private
             * @function
             */
            _checkValidity: function() {
                if (!this._vkNodeProxy) {
                    throw "Node has been destroyed";
                }
            },

            setSceneNodeId: function(sSceneNodeId) {
                this._destroy();
                this.setProperty("sceneNodeId", sSceneNodeId);
                var oScene = this.getScene();
                if (oScene) {
                    this._vkNodeProxy = oScene._getNodeHierarchy().createNodeProxy(sSceneNodeId);
                }
                return this;
            },

            setScene: function(oScene) {
                this._destroy();
                this.setProperty("scene", oScene);
                var sSceneNodeId = this.getSceneNodeId();
                if (sSceneNodeId) {
                    this._vkNodeProxy = oScene._getNodeHierarchy().createNodeProxy(sSceneNodeId);
                }
                return this;
            },

            /**
             * Gets the name of the scene node.
             * @function
             * @public
             * @returns {string} The scene node name.
             */
            getName: function () {
                this._checkValidity();
                return this._vkNodeProxy.getName();
            },

            /**
             * Gets whether this scene node is closed.
             * When a scene node is closed, the closed scene node and its descendants are treated as a single scene node (at least in terms of selection).
             * @function
             * @public
             * @returns {boolean} Whether this scene node is closed.
             */
            getClosed: function () {
                this._checkValidity();
                return this._vkNodeProxy.getClosed();
            },

            /**
             * Gets the relative transformation matrix that applies to the scene node in ISO 10303-42 format.
             * @function
             * @public
             * @returns {sap.ui.vtm.Matrix} The relative transformation matrix that applies to the scene node in ISO 10303-42 format.
             */
            getRelativeMatrix: function () {
                this._checkValidity();
                var vkMatrix = this._vkNodeProxy.getLocalMatrix();
                return vkMatrix ? sap.ui.vtm.MatrixUtilities.fromVkMatrix(vkMatrix) : null;
            },

            /**
             * Sets the relative transformation matrix that applies to the scene node in ISO 10303-42 format.
             * @function
             * @public
             * @param {sap.ui.vtm.Matrix} matrix The relative transformation matrix that applies to the scene node in ISO 10303-42 format.
             * @returns {sap.ui.vtm.SceneNode} <code>this</code> for method chaining.
             */
            setRelativeMatrix: function (matrix) {
                this._checkValidity();
                var vkMatrix = sap.ui.vtm.MatrixUtilities.toVkMatrix(matrix);
                this._vkNodeProxy.setLocalMatrix(vkMatrix);
                return this;
            },

            /**
             * Gets the absolute transformation matrix that applies to the scene node in ISO 10303-42 format.
             * @function
             * @public
             * @returns {sap.ui.vtm.Matrix} The absolute transformation matrix that applies to the scene node in ISO 10303-42 format.
             */
            getAbsoluteMatrix: function () {
                this._checkValidity();
                var vkMatrix = this._vkNodeProxy.getWorldMatrix();
                return vkMatrix ? sap.ui.vtm.MatrixUtilities.fromVkMatrix(vkMatrix) : null;
            },

            /**
             * Sets the absolute transformation matrix that applies to the scene node in ISO 10303-42 format.
             * @function
             * @public
             * @param {sap.ui.vtm.Matrix} matrix The absolute transformation matrix that applies to the scene node in ISO 10303-42 format.
             * @returns {sap.ui.vtm.SceneNode} <code>this</code> for method chaining.
             */
            setAbsoluteMatrix: function (matrix) {
                this._checkValidity();
                var vkMatrix = sap.ui.vtm.MatrixUtilities.toVkMatrix(matrix);
                this._vkNodeProxy.setWorldMatrix(vkMatrix);
                return this;
            },
           
            /**
             * Converts metadata in the representation used by {@link sap.ui.vk.NodeProxy} to the VTM representation.
             * @function
             * @private
             * @param {any} vkMetadata The metadata in the representation used by {@link sap.ui.vk.NodeProxy}.
             * @return {Map} The VTM metadata map.
             */
            _fromVkMetadata: function (vkMetadata) {
                var result = {};
                var categoryNames = Object.getOwnPropertyNames(vkMetadata);
                categoryNames.forEach(function(categoryName) {
                    var metadataCategory = vkMetadata[categoryName];
                    var fieldNames = Object.getOwnPropertyNames(metadataCategory);

                    fieldNames.forEach(function(fieldName) {
                        var metadataValue = metadataCategory[fieldName];
                        var descriptor = {category: categoryName, field: fieldName};
                        result[JSON.stringify(descriptor)] = metadataValue;
                    });
                });
                return result;
            },

            /**
             * Gets a plain JavaScript object map of metadata values.
             * <p>Keys are in the form: <code>'{"category":"SAP","field":"MATERIAL"}'</code>.</p>
             * <p>Values are in the form of strings or arrays of strings.</p>
             * @function
             * @public
             * @returns {object} The plain JavaScript object map of metadata values.
             */
            getNodeMetadata: function () {
                this._checkValidity();
                var vkMetadata = this._vkNodeProxy.getNodeMetadata();
                return vkMetadata ? this._fromVkMetadata(vkMetadata) : {};
            },

            /**
             * Converts from VE IDs in the representation used by {@link sap.ui.vk.NodeProxy} to VTM style identifier values.
             * @private
             * @function
             * @param {object[]} vkIdentifiers A set of identifiers in the format used by {@link sap.ui.vk.NodeProxy}.
             * @return {string|string[]} A VTM identifier or array of VTM identifiers.
             */
            _fromVkVeIds: function (vkIdentifiers) {
                var result = {};
                vkIdentifiers.forEach(function(identifier) {
                    var key = JSON.stringify({
                        source: identifier.source,
                        type: identifier.type
                    });
                    var value = JSON.stringify(identifier.fields);
                    var existingValue = result[key];
                    if (existingValue){
                        var valueArray = sap.ui.vtm.ArrayUtilities.wrap(existingValue);
                        valueArray.push(value);
                        result[key] = valueArray;
                    } else {
                        result[key] = value;
                    }
                });
                return result;
            },

            /**
             * Gets a plain JavaScript object map of identifier values.
             * <p>Keys are in the form: <code>['{"source":"SAP","type":"VE_COMPONENT"}'</code>.</p>
             * <p>Values are strings or arrays of strings in the form: <code>'[{"name":"ID", "value":"_moto_x_asm"},{"name":"version", "value": "00"},{"name": "timestamp", "value":"2016-05-18 03:44:53.93"}]'</code>.</p>
             * @function
             * @public
             * @returns {object} The plain JavaScript object map of identifier values.
             */
            getIdentifiers: function () {
                this._checkValidity();
                var vkIdentifiers = this._vkNodeProxy.getVeIds();
                return vkIdentifiers ? this._fromVkVeIds(vkIdentifiers) : {};
            }
        });

        return SceneNode;
    },
    true);