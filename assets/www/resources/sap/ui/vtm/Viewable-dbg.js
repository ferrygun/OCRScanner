/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element", "sap/ui/vk/ContentResource"],
    function (jQuery, SapUiCoreElement, SapUiVkContentResource) {

        "use strict";

        /**
         * Constructor for a new Viewable.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.Viewable
         * @public
         * @class
         * A viewable containing 3D content that can be loaded into a {@link sap.ui.vtm.Scene}.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string] sId An optional ID for the {@link sap.ui.vtm.Viewable}.
         * @param {object} [mSettings] An optional object with initial settings for the new {@link sap.ui.vtm.Viewable} instance
         * @extends sap.ui.core.Element
         */
        var Viewable = SapUiCoreElement.extend("sap.ui.vtm.Viewable", /** @lends sap.ui.vtm.Viewable.prototype */ {

            metadata: {
                properties: {
                    /**
                     * The source URL (string) or File for this Viewable.
                     */
                    source: {
                        type: "any"
                    },

                    /**
                     * The name for this Viewable.
                     */
                    name: {
                        type: "string"
                    },

                    /**
                     * The root scene node IDs for this viewable.
                     */
                    rootNodeIds: {
                        type: "string[]"
                    },

                    /**
                     * The relative transformation matrix to apply to the scene node created to wrap the contents of the loaded viewable.
                     */
                    relativeMatrix: {
                        type: "sap.ui.vtm.Matrix"
                    }
                }
            },

            init: function () {
                this._vkContentResource = new sap.ui.vk.ContentResource({
                    sourceId: this.getId(),
                    sourceType: "vds"
                });
                this.setRelativeMatrix(sap.ui.vtm.MatrixUtilities.createIdentity());
            },

            /**
             * Gets the unique ID that identifies this Viewable.
             * This is an alias for {@link #getId}
             * @function
             * @public
             * @return {string} The unique ID that identifies this Viewable.
             */
            getSourceId: function () {
                return this.getId();
            },

            /**
             * Sets the source URL or File for this Viewable.
             * @function
             * @public
             * @param {string|File} source The source URL of File for this Viewable.
             * @return {sap.ui.vtm.Viewable} <code>this</code> for method chaining.
             */
            setSource: function (source) {
                this.setProperty("source", source);
                this._vkContentResource.setSource(source);
                return this;
            },

            /**
             * Sets the name for this Viewable.
             * @function
             * @public
             * @param {string} name The name for this Viewable.
             * @return {sap.ui.vtm.Viewable} <code>this</code> for method chaining.
             */
            setName: function (name) {
                this.setProperty("name", name);
                this._vkContentResource.setName(name);
                return this;
            },

            setRelativeMatrix: function(matrix) {
                this.setProperty("relativeMatrix", matrix);
                this._vkContentResource.setLocalMatrix(sap.ui.vtm.MatrixUtilities.toVkMatrix(matrix));
            },

            _getContentResource: function () {
                return this._vkContentResource;
            },

            /**
             * Returns a string representation of the source.
             * If the source is a {@link File} this returns the file name (which is not guaranteed to uniquely identify the file).
             * @function
             * @public
             * @return {string} A string representation of the source.
             */
            getSourceString: function() {
                var source = this.getSource();
                return typeof source === "string" ? source : source.name;
            }
        });

        return Viewable;
    });
