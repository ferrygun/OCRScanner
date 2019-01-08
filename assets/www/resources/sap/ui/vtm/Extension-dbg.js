/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element"],
    function (jQuery, SapUiCoreElement) {

        "use strict";

        /**
         * This class is an abstract class that is not intended to be instantiated directly.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.Extension
         * @public
         * @class
         * A base class for extensions.
         * 
         * Extensions provide an extensibility mechanism through which behaviors can be added, allowing for a default set of behaviors that can be
         * overridden by application developers. Extensions react to events raised by VTM elements/controls or other extensions.
         * 
         * Derived classes should provide their own {@link #initialize} implementation.
         * Extensions are expected to be as independent from one another as possible.
         * 
         * Extensions implement interfaces to indicate the functional role(s) that they fulfill.
         * Extensions can be found by interface calling {@link sap.ui.vtm.Vtm#getExtensionByInterface getExtensionByInterface}.
         * Specific extensions can be found using  {@link sap.ui.vtm.Vtm#getExtensionByName getExtensionByName}.
         * Typically extensions are retrieved using these methods in order to get or set their <code>enabled</code> property.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.m.Extension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.m.Extension} instance.
         * @extends sap.ui.core.Element
         */
        var Extension = SapUiCoreElement.extend("sap.ui.vtm.Extension", /** @lends sap.ui.vtm.Extension.prototype */ {

            metadata: {
                properties: {
                    /**
                     * Controls whether the extension is enabled.
                     */
                    enabled: {
                        type: "boolean",
                        defaultValue: true,
                        bindable: true
                    }
                },
                events: {
                    /**
                     * Fired when the enabled property is changed.
                     */
                    enabledChanged: {
                    },

                    /**
                     * Fired when initialization has completed.
                     */
                    initialized: {
                    }
                }
            },

            constructor: function (sId, mSettings) {
                SapUiCoreElement.apply(this, arguments);
                var fnSetParent = this.setParent;
                this.setParent = function(oParent, sAggregationName, bSuppressInvalidate) {
                    var returnValue = fnSetParent.apply(this, arguments);
                    this.fireEvent("parentSet", { parent: oParent});
                    return returnValue;
                }.bind(this);
            },

            init: function () {
                this.getVtmPromise().then(function(vtm) {
                    this._vtm = vtm;
                    this.initialize(vtm);
                    this.fireInitialized();
                }.bind(this));
            },

            /**
             * Contains initialization code for the extension. Derived classes must redefine this method.
             * @public
             * @function
             * @param {sap.ui.vtm.Vtm} vtm The {@link sap.ui.vtm.Vtm} instance that this extension belongs to.
             */
            initialize: function(vtm) {
                throw "initialize() needs to be redefined";
            },

            setEnabled: function(bEnabled) {
                this.setProperty("enabled", bEnabled);
                this.fireEnabledChanged();
            },

            /**
             * Calls a function once for each panel that is attached (currently or in the future) to the {@link sap.ui.vtm.Vtm} instance that owns this extension.
             *
             * This function should only be used after the Promise returned by {@link #getVtmPromise} has resolved.
             * @public
             * @function
             * @param {function} panelHandler A function that takes one {@link sap.ui.vtm.Panel} argument.
             */
            applyPanelHandler: function(panelHandler) {
                var panels = this._vtm.getPanels();
                panels.forEach(panelHandler);

                this._vtm.attachPanelAdded(function (panelAddedEvent) {
                    panelHandler(panelAddedEvent.getParameter("panel"));
                });
            },

            /**
             * Gets a {@link Promise} that resolves when the extension is added to the <code>extensions</code> aggregation of an {@link sap.ui.vtm.Vtm} instance.
             *
             * The relevant {@link sap.ui.vtm.Vtm} instance is passed to the resolve handler.
             * @public
             * @function
             * @returns {Promise} A {@link Promise} that is resolved when the extension is added to the <code>extensions</code> aggregation of an {@link sap.ui.vtm.Vtm} instance.
             */
            getVtmPromise: function () {
                return new Promise(function(resolve, reject) {
                    this.attachEventOnce("parentSet", function(oEvent) {
                        var parent = oEvent.getParameter("parent");
                        if (parent.getMetadata().getName() === "sap.ui.vtm.Vtm") {
                            sap.ui.vtm.measure(this, "getVtmPromise resolve", function() {
                                resolve(parent);
                            });
                        } else {
                            sap.ui.vtm.measure(this, "getVtmPromise reject", function() {
                                reject(parent);
                            });
                        }
                    }.bind(this));
                }.bind(this));
            },

            /**
             * Gets a {@link Promise} that resolves after the {@link #initialize initialize} method has been called for the extension.
             * 
             * The {@link #initialize initialize} method is called after the {@link Promise} returned by {@link #getVtmPromise getVtmPromise} resolves.
             * @public
             * @function
             * @returns {Promise} A {@link Promise} that is resolved after the {@link #initialize initialize} method has been called for the extension.
             */
            getInitializedPromise: function() {
                return new Promise(function(resolve, reject) {
                    this.attachInitialized(function(oEvent) {
                        sap.ui.vtm.measure(this, "getInitializedPromise resolve", function() {
                            resolve();
                        });
                    }.bind(this));
                }.bind(this));
            }
        });

        return Extension;
    });