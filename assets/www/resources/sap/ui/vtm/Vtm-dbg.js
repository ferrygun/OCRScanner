/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element", "./Panel", "./Scene", "./ArrayUtilities", "./Viewable", "sap/m/Toolbar"],
    function (jQuery, SapUiCoreElement, SapUiVtmPanel, SapUiVtmScene, SapUiVtmArrayUtilities, SapUiVtmViewable, SapMToolbar) {

        "use strict";

        /**
         * Constructor for a new Vtm.
         * This constructor can be used to construct an instance of {@link sap.ui.vtm.Vtm} with a specific set of extensions.
         * Alternatively {@link sap.ui.vtm.createVtm} can be used to create a {@link sap.ui.vtm.Vtm} instance with a default set of extensions.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.Vtm
         * @public
         * @class
         * The main entry point for constructing VTM controls.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId The id to use for the {@link sap.ui.vtm.Vtm} instance.
         * @param {object?} mSettings A set of settings for the {@link sap.ui.vtm.Vtm} instance (normally used to populate the <code>extensions</code> aggregation).
         * @extends sap.ui.core.Element
         */
        var Vtm = SapUiCoreElement.extend("sap.ui.vtm.Vtm", /** @lends sap.ui.vtm.Vtm.prototype */ {

            metadata: {
                properties: {
                    /**
                     * When true populates the <code>extensions</code> aggregation with the default set of extensions in the default configuration.
                     */
                    addDefaultExtensions: {type: "boolean"}
                },
                events: {
                    /**
                     * Raised when a panel has been added.
                     */
                    panelAdded: {
                        parameters: {
                            panel: { type: "sap.ui.vtm.Panel" }
                        }
                    },

                    /**
                     * Raised when the active panel has changed.
                     */
                    activePanelChanged: {},

                    /**
                     * Raised when this {@link sap.ui.vtm.Vtm} instance and its extensions have been initialized.
                     * 
                     * Applications should add event handlers after the {@link sap.ui.vtm.Vtm} instance has initialized so that
                     * the extensions can attach event handlers before the application attempts to attach event handlers to the same events.
                     */
                    initialized: {}
                },
                aggregations: {
                    /**
                     * The set of VTM extensions. Extensions are used to provide extensibility.
                     * Default behaviors are implemented as extensions that can be replaced.
                     */
                    extensions: {
                        type: "sap.ui.vtm.Extension",
                        multiple: true
                    }
                },
                defaultAggregation: "extensions"
            },

            constructor: function (sId, mSettings) {
                SapUiCoreElement.apply(this, arguments);
                this._panels = [];
                this._scene = new sap.ui.vtm.Scene(this.getId() + "_scene");
                this.addDependent(this._scene);
                this._dragStartParameters = {};

                var extensionInitializedPromises = this.getExtensions().map(function(extension) {
                    return extension.getInitializedPromise();
                });
                Promise.all(extensionInitializedPromises).then(function() {
                    sap.ui.vtm.measure(this, "fireInitialized", function() {
                        this.fireInitialized();
                    }.bind(this));
                }.bind(this));
            },

            setAddDefaultExtensions: function(bAddDefaultExtensions) {
                if (bAddDefaultExtensions) {
                    [
                        new sap.ui.vtm.extensions.SyncSelectionOnTreeChangeExtension(),
                        new sap.ui.vtm.extensions.LoadProgressExtension(),
                        new sap.ui.vtm.extensions.MessageStatusCalculationExtension(),
                        new sap.ui.vtm.extensions.MessageStatusIconClickExtension(),
                        new sap.ui.vtm.extensions.ViewportSelectionLinkingExtension(),
                        new sap.ui.vtm.extensions.VisibilityIconClickExtension(),
                        new sap.ui.vtm.extensions.DisplayStateCalculationExtension(),
                        new sap.ui.vtm.extensions.SelectionLinkingExtension({ enabled: false }),
                        new sap.ui.vtm.extensions.SelectionKeepingExtension(),
                        new sap.ui.vtm.extensions.ViewLinkingExtension({ enabled: false }),
                        new sap.ui.vtm.extensions.InitialViewExtension(),
                        new sap.ui.vtm.extensions.SceneNodeHoverHighlightExtension(),
                        new sap.ui.vtm.extensions.SceneNodeHoverTooltipExtension()
                    ].forEach(function(extension) {
                        this.addExtension(extension);
                    }.bind(this));
                }
            },

            /**
             * Gets the set of created panels.
             * Do not modify the returned array.
             * @public
             * @function
             * @returns {sap.ui.vtm.Panel[]} The created panels.
             */
            getPanels: function () {
                return this._panels;
            },

            /**
             * Gets a panel given its id. Returns undefined if no match is found.
             * @public
             * @function
             * @param {string} panelId The id of the panel to find.
             * @returns {sap.ui.vtm.Panel|undefined} The matching panel or undefined if no match is found.
             */
            getPanel: function (panelId) {
                return sap.ui.vtm.ArrayUtilities.find(this._panels, function (panel) {
                    return panel.getId() === panelId;
                });
            },

            /**
             * Gets the scene.
             * @public
             * @function
             * @returns {sap.ui.vtm.Scene} The scene.
             */
            getScene: function () {
                return this._scene;
            },

            /**
             * Creates a VTM panel associated with this {@link sap.ui.vtm.Vtm} instance.
             * @public
             * @function
             * @param {string?} sId The ID to pass to the panel constructor.
             * @param {object?} mSettings The settings to pass to the panel constructor.
             * @returns {sap.ui.vtm.Panel} The created panel.
             */
            createPanel: function (sId, mSettings) {
                mSettings = jQuery.extend(mSettings, {
                    vtmId: this
                });
                return new sap.ui.vtm.Panel(sId, mSettings);
             },

            /**
             * Sets the active panel
             * @function
             * @private
             * @param {sap.ui.vtm.Panel} oActivePanel The active panel.
             * @param {boolean} bSetFocus If <code>true</code> the focus will be set to the active panel.
             * @fires activePanelChanged
             */
            _setActivePanel: function(oActivePanel, bSetFocus) {
                if (this._activePanel === oActivePanel) {
                    return;
                }
                this._activePanel = oActivePanel;
                var panels = this.getPanels();
                panels.forEach(function(panel) {
                    var isActive = panel === oActivePanel;
                    panel._setIsActive(isActive);
                    if (bSetFocus) {
                        oActivePanel.focus();
                    }
                });

                sap.ui.vtm.measure(this, "fireActivePanelChanged", function() {
                    this.fireActivePanelChanged();
                }.bind(this));
            },

            /**
             * Gets the active panel.
             * @function
             * @public
             * @returns {sap.ui.vtm.Panel|null} The active panel, or null if there is no active panel.
             */
            getActivePanel: function() {
               return this._activePanel || null;
            },

            /**
             * Sets the active panel.
             * @function
             * @public
             * @param {sap.ui.vtm.Panel} oActivePanel The active panel.
             * @returns {sap.ui.vtm.Vtm} A reference to <code>this</code> for method chaining.
             * @fires activePanelChanged
             */
            setActivePanel: function(oActivePanel) {
                this._setActivePanel(oActivePanel, true);
                return this;
            },

            /**
             * Adds a panel to the panels collection.
             * @private
             * @function
             * @param {sap.ui.vtm.Panel} panel The panel to add.
             * @returns {sap.ui.vtm.Vtm} <code>this</code> for method chaining.
             * @fires panelAdded
             */
            _addPanel: function(panel) {
                var panels = this.getPanels();
                panels.push(panel);

                sap.ui.vtm.measure(this, "firePanelAdded", function() {
                    this.firePanelAdded({panel: panel});
                }.bind(this));

                return this;
            },

            /**
             * Gets the extensions with a specified class name.
             * @public
             * @function
             * @param {string} sExtensionName The fully qualified class name of the extension.
             * @returns {sap.ui.vtm.Extension[]} The matching extensions.
             */
            getExtensionsByName: function(sExtensionName) {
                return this.getExtensions().filter(function(extension) {
                    return extension.getMetadata().getName() === sExtensionName;
                });
            },

            /**
             * Gets an extension with a specified class name.
             *
             * Returns <code>undefined</code> if there is not exactly one matching extension.
             * @public
             * @function
             * @param {string} sExtensionName The fully qualified class name of the extension.
             * @returns {sap.ui.vtm.Extension|undefined} The matching extension or <code>undefined</code> if there is not exactly one matching extension.
             */
            getExtensionByName: function(sExtensionName) {
                var extensions = this.getExtensionsByName(sExtensionName);
                return extensions.length === 1 ? extensions[0] : undefined;
            },

            /**
             * Gets the extensions implementing a specified interface.
             * @public
             * @function
             * @param {string} sInterfaceName The fully qualified name of the interface.
             * @returns {sap.ui.vtm.Extension[]} The matching extensions.
             */
            getExtensionsByInterface: function(sInterfaceName) {
                return this.getExtensions().filter(function(extension) {
                    return extension.getMetadata().isInstanceOf(sInterfaceName);
                });
            },

            /**
             * Gets the extension implementing a specified interface.
             *
             * Returns <code>undefined</code> if there is not exactly one matching extension.
             * @public
             * @function
             * @param {string} sInterfaceName The fully qualified name of the interface.
             * @returns {sap.ui.vtm.Extension|undefined} The matching extension or <code>undefined</code> if there is not exactly one matching extension.
             */
            getExtensionByInterface: function(sInterfaceName) {
                var extensions = this.getExtensionsByInterface(sInterfaceName);
                return extensions.length === 1 ? extensions[0] : undefined;
            }
        });

        return Vtm;
    });
