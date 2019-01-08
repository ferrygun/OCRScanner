/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "sap/ui/commons/Panel", "sap/ui/core/Title", "sap/m/VBox", "sap/ui/layout/Splitter", "./Tree", "./Viewport"],
    function (jQuery, SapUiCoreControl, SapUiCommonsPanel, SapUiCoreTitle, SapMVBox, SapUiLayoutSplitter, SapUiVtmTree, SapUiVtmViewport) {

        "use strict";

        /**
         * Constructor for a new Panel.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @class
         * A control that represents a VTM panel.
         * Contains:
         * <ul>
         * <li>A header area containing a title and optionally a set of application controls</li>
         * <li>A sap.ui.vtm.Tree and a sap.ui.vtm.Viewport separated by a splitter</li>
         * </ul>
         * @author SAP SE
         * @version 1.52.0
         * @name sap.ui.vtm.Panel
         * @extends sap.ui.core.Control
         * @param {string?} sId id for the new {@link sap.ui.vtm.Panel} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.Panel} instance.<br/>
         * The <code>vtmId</code> association needs to be set in order for the panel to be associated with a {@link sap.ui.vtm.Vtm} instance.<br/>
         * {@link sap.ui.vtm.Vtm#createPanel createPanel} creates a {@link sap.ui.vtm.Panel} instance and populates the <code>vtmId</code> association.
         */
        var Panel = SapUiCoreControl.extend("sap.ui.vtm.Panel", /** @lends sap.ui.vtm.Panel.prototype */ {

            metadata: {
                properties: {
                    /**
                     * The text to show in the title bar for this panel.
                     */
                    title: {
                        type: "string"
                    },

                    /**
                     * Controls whether the viewport will be shown for this panel.
                     */
                    showViewport: {
                        type: "boolean",
                        defaultValue: true
                    },

                    /**
                     * The width of the tree.
                     */
                    treeWidth: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "50%"
                    },
                    
                    /**
                     * The height of the panel.
                     */
                    height: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "inherit"
                    }
                },
                aggregations: {
                    _panel: {
                        type: "sap.m.VBox",
                        multiple: false,
                        visibility: "hidden"
                    },

                    /**
                     * The set of controls to render in the title bar area.
                     */
                    titleControls: {
                        type: "sap.ui.core.Control",
                        multiple: "true"
                    },

                    /**
                     * The set of controls to render in the tree header area.
                     */
                    treeHeaderControls: {
                        type: "sap.ui.core.Control",
                        multiple: "true"
                    },

                    /**
                     * The set of controls to render in the viewport header area.
                     */
                    viewportHeaderControls: {
                         type: "sap.ui.core.Control",
                        multiple: "true"
                    }
                },
                associations : {
                    /**
                     * The {@link sap.ui.vtm.Vtm} instance this panel is associated with.
                     */
                    vtmId : {
                        type : "sap.ui.vtm.Vtm",
                        multiple : false
                    }
                },
                events: {
                    /**
                     * Raised when the panel is initialized.
                     */
                    initialized: {},

                    /**
                     * Raised when the web browser <code>contextmenu</code> event is raised.
                     * To prevent the default browser context menu from being shown call preventDefault() on the event.
                     */
                    contextMenu: {
                        parameters: {
                            /**
                             * The X coordinate of the mouse pointer in local (DOM content) coordinates.
                             */
                            clientX: { type: "int" },

                            /**
                             * The Y coordinate of the mouse pointer in local (DOM content) coordinates.
                             */
                            clientY: { type: "int" },

                            /**
                             * The X coordinate of the mouse pointer in page coordinates.
                             */
                            pageX: { type: "int"},

                            /**
                             * The X coordinate of the mouse pointer in page coordinates.
                             */
                            pageY: { type: "int" },

                            /**
                             * The X coordinate of the mouse pointer in screen coordinates.
                             */
                            screenX: { type: "int"},

                            /**
                             * The X coordinate of the mouse pointer in screen coordinates.
                             */
                            screenY: { type: "int" },

                            /**
                             * The jQuery event object.
                             */
                            eventData: { type: "object" }
                        },
                        allowPreventDefault: true
                    }
                }
            },

            init: function() {
                var sId = this.getId();
                var tree = this._tree = new sap.ui.vtm.Tree(sId + "_tree");
                var viewport = this._viewport = new sap.ui.vtm.Viewport(sId + "_viewport");
                var title = this._title = new sap.m.Title({
                    textAlign: sap.ui.core.TextAlign.Begin
                });

                var panelHeader = this._panelHeader = new sap.m.Bar({
                    contentLeft: [title]
                });

                this._treeLayout = new sap.ui.layout.SplitterLayoutData({
                    minSize: 10
                });
                var treeSplitPane = new sap.ui.layout.SplitPane({
                    content: tree,
                    demandPane: false,
                    requiredParentWidth: 50,
                    layoutData: this._treeLayout
                });

                this._viewportLayout = new sap.ui.layout.SplitterLayoutData({
                    minSize: 10
                });
                var viewportSplitPane = new sap.ui.layout.SplitPane({
                    content: viewport,
                    demandPane: false,
                    requiredParentWidth: 50,
                    layoutData: this._viewportLayout
                });

                var rootPaneContainer = new sap.ui.layout.PaneContainer({
                    panes: [treeSplitPane, viewportSplitPane]
                });

                var splitter = this._splitter = new sap.ui.layout.ResponsiveSplitter({
                    rootPaneContainer: rootPaneContainer,
                    defaultPane: treeSplitPane
                });

                var page = this._page = new sap.m.Page({
                    content: [splitter],
                    customHeader: panelHeader,
                    layoutData: new sap.m.FlexItemData({minHeight: "100%", maxHeight: "100%"})
                });

                var contextMenuEventHandler = function (ev) {
                    var allowDefaultAction;

                    sap.ui.vtm.measure(this, "fireContextMenu", function() {
                        allowDefaultAction = this.fireContextMenu({
                            clientX: ev.clientX,
                            clientY: ev.clientY,
                            pageX: ev.pageX,
                            pageY: ev.pageY,
                            screenX: ev.screenX,
                            screenY: ev.screenY,
                            eventData: ev
                        });
                    }.bind(this));

                    if (!allowDefaultAction) {
                        ev.preventDefault();
                    }
                }.bind(this);

                page.addEventDelegate({
                    oncontextmenu: contextMenuEventHandler
                }, page);

                var panel = new sap.m.VBox({
                    fitContainer: true,
                    renderType: sap.m.FlexRendertype.Bare,
                    items: [page]
                });

                this.setAggregation("_panel", panel);
                this.data("notUsed", "just a bug workaround"); // Workaround for bug in RenderManager.prototype.writeElementData

                this._oldPanes = [];
                this._setIsActive(false);
            },

            onAfterRendering: function() {
                if (!this._initialized) {
                    this._initialize();
                }
            },

            _initialize: function() {
                var vtm = this.getVtm();
                if (vtm) {
                    vtm._addPanel(this);
                    this._initialized = true;

                    sap.ui.vtm.measure(this, "fireInitialized", function() {
                        this.fireInitialized();
                    }.bind(this));
                }
            },

            destroy: function() {
                SapUiCoreControl.prototype.destroy.apply(this);
                this._destroyed = true;

                var allPanelsDestroyed = this.getVtm().getPanels().every(function(panel) {
                    return panel._destroyed === true;
                });
                if (allPanelsDestroyed) {
                    this.getVtm().getScene().destroy();
                }
            },

            onmousedown: function(oEvent) {
                this.getVtm()._setActivePanel(this, false);
            },

            onfocusin:  function(oEvent) {
                this.getVtm()._setActivePanel(this, false);
            },

            onfocusout: function(oEvent){
                var vtm = this.getVtm();
                if (vtm.getActivePanel() === this) {
                    vtm._setActivePanel(null, false);
                }
            },

            addTreeHeaderControl: function(oTreeHeaderControl) {
                return this.getTree().addHeaderControl(oTreeHeaderControl);
            },

            addViewportHeaderControl: function(oViewportHeaderControl) {
                return this.getViewport().addHeaderControl(oViewportHeaderControl);
            },

            destroyTreeHeaderControls: function() {
                return this;
            },

            destroyViewportHeaderControls: function() {
                return this;
            },

            getTreeHeaderControls: function() {
                return this.getTree().getHeaderControls();
            },

            getViewportHeaderControls: function() {
                return this.getViewport().getHeaderControls();
            },

            indexOfTreeHeaderControl: function(oTreeHeaderControl) {
                return this.getTree().indexOfHeaderControl(oTreeHeaderControl);
            },

            indexOfViewportHeaderControl: function(oViewportHeaderControl) {
                return this.getViewport().indexOfHeaderControl(oViewportHeaderControl);
            },

            insertTreeHeaderControl: function(oTreeHeaderControl, iIndex) {
                return this.getTree().insertHeaderControl(oTreeHeaderControl, iIndex);
            },

            insertViewportHeaderControl: function(oViewportHeaderControl, iIndex) {
                return this.getViewport().insertHeaderControl(oViewportHeaderControl, iIndex);
            },

            removeAllTreeHeaderControls: function() {
                return this.getTree().removeAllControls();
            },

            removeAllViewportHeaderControls: function() {
                return this.getViewport().removeAllControls();
            },

            removeTreeHeaderControl: function(vTreeHeaderControl) {
                return this.getTree().removeControl(vTreeHeaderControl);
            },

            removeViewportHeaderControl: function(vViewportHeaderControl) {
                return this.getViewport().removeControl(vViewportHeaderControl);
            },

            _getDelegatedAggregation: function(sAggregationName) {
                switch (sAggregationName) {
                case "treeHeaderControls":
                    return {
                        control: this.getTree(),
                        aggregationName: sAggregationName
                    };
                case "viewportHeaderControls":
                    return {
                        control: this.getViewport(),
                        aggregationName: sAggregationName
                    };
                case "titleControls":
                    return {
                        control: this._panelHeader,
                        name: "contentRight"
                    };
                default:
                    return null;
                }
            },

            addAggregation: function(sAggregationName, oObject, bSuppressInvalidate) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.addAggregation(delegatedAggregation.name, oObject, bSuppressInvalidate);
                } else {
                    return SapUiCoreControl.prototype.addAggregation.apply(this, [sAggregationName, oObject, bSuppressInvalidate]);
                }
            },

            bindAggregation: function(sAggregationName, oBindingInfo) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.bindAggregation(delegatedAggregation.name);
                } else {
                    return SapUiCoreControl.prototype.bindAggregation.apply(this, [sAggregationName]);
                }
            },

            destroyAggregation: function(sAggregationName, bSuppressInvalidate) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return this;
                } else {
                    return SapUiCoreControl.prototype.destroyAggregation.apply(this, [sAggregationName, bSuppressInvalidate]);
                }
            },

            // Don't redefine findAggregatedObjects

            getAggregation: function(sAggregationName, oDefaultForCreation) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.getAggregation(delegatedAggregation.name, oDefaultForCreation);
                } else {
                    return SapUiCoreControl.prototype.getAggregation.apply(this, [sAggregationName, oDefaultForCreation]);
                }
            },

            indexOfAggregation: function(sAggregationName, oObject) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.indexOfAggregation(delegatedAggregation.name, oObject);
                } else {
                    return SapUiCoreControl.prototype.indexOfAggregation.apply(this, [sAggregationName, oObject]);
                }
            },

            insertAggregation: function(sAggregationName, oObject, iIndex, bSuppressInvalidate) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.insertAggregation(delegatedAggregation.name, oObject, iIndex, bSuppressInvalidate);
                } else {
                    return SapUiCoreControl.prototype.insertAggregation.apply(this, [sAggregationName, oObject, iIndex, bSuppressInvalidate]);
                }
            },

            removeAggregation: function(sAggregationName, vObject, bSuppressInvalidate) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.removeAggregation(delegatedAggregation.name, sAggregationName, vObject, bSuppressInvalidate);
                } else {
                    return SapUiCoreControl.prototype.removeAggregation.apply(this, [sAggregationName, vObject, bSuppressInvalidate]);
                }
            },

            removeAllAggregation: function(sAggregationName, bSuppressInvalidate) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.removeAllAggregation(delegatedAggregation.name, sAggregationName, bSuppressInvalidate);
                } else {
                    return SapUiCoreControl.prototype.removeAllAggregation.apply(this, [sAggregationName, bSuppressInvalidate]);
                }
            },

            setAggregation: function(sAggregationName, oObject, bSuppressInvalidate) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.setAggregation(delegatedAggregation.name, oObject, bSuppressInvalidate);
                } else {
                    return SapUiCoreControl.prototype.setAggregation.apply(this, [sAggregationName, oObject, bSuppressInvalidate]);
                }
            },

            unbindAggregation: function(sAggregationName, bSuppressReset) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.unbindAggregation(delegatedAggregation.name, bSuppressReset);
                } else {
                    return SapUiCoreControl.prototype.unbindAggregation.apply(this, [sAggregationName, bSuppressReset]);
                }
            },

            validateAggregation: function(sAggregationName, oObject, bMultiple) {
                var delegatedAggregation = this._getDelegatedAggregation(sAggregationName);
                if (delegatedAggregation) {
                    return delegatedAggregation.control.validateAggregation(delegatedAggregation.name, oObject, bMultiple);
                } else {
                    return SapUiCoreControl.prototype.validateAggregation.apply(this, [sAggregationName, oObject, bMultiple]);
                }
            },

            _getPanel: function () {
                return this.getAggregation("_panel");
            },

            _getTreeLayoutData: function() {
                return this._treeLayout;
            },

            _getViewportLayoutData: function() {
                return this._viewportLayout;
            },

            renderer: function (oRM, oControl) {
                oRM.write("<div");
                oRM.writeControlData(oControl);
                oRM.addStyle("height", oControl.getHeight());
                oRM.writeStyles();
                oRM.writeClasses();
                oRM.write(">");
                var panel = oControl._getPanel();
                oRM.renderControl(panel);
                oRM.write("</div>");
            },

            /**
             * Sets the panel title.
             * @public
             * @function
             * @param {string} title The panel title text
             * @returns {sap.ui.vtm.Panel} Returns <code>this</code> for method chaining.
             */
            setTitle: function (title) {
                this._title.setText(title);
                this.setProperty("title", title);
                return this;
            },

            /**
             * Gets the tree owned by this panel.
             * @public
             * @function
             * @returns {sap.ui.vtm.Tree} The tree owned by this panel.
             */
            getTree: function () {
                return this._tree;
            },

            /**
             * Gets the viewport owned by this panel.
             * @public
             * @function
             * @returns {sap.ui.vtm.Viewport} The viewport owned by this panel.
             */
            getViewport: function () {
                return this._viewport;
            },

            setShowViewport: function(bShowViewport) {
                if (bShowViewport === this.getShowViewport()) {
                    return this;
                }
                var _currentWidth = this.getTreeWidth();
                this.setProperty("showViewport", bShowViewport);
                var defaultPane = this._splitter.getDefaultPane();
                var rootPane = this._splitter.getRootPaneContainer();
                var panes = rootPane.getPanes();
                if (!bShowViewport) {
                    this._oldTreeWidth = _currentWidth;
                    panes.forEach(function(pane) {
                        if (pane.getId() !== defaultPane) {
                            rootPane.removePane(pane);
                            this._oldPanes.push(pane);
                        }
                    }.bind(this));
                    this.setTreeWidth("auto");
                } else {
                    this._oldPanes.forEach(function(pane) {
                        rootPane.addPane(pane);
                    });
                    this._oldPanes = [];
                    this.setTreeWidth(this._oldTreeWidth);
                    this._oldTreeWidth = null;
                }
                return this;
            },

            /**
             * Gets the {@link sap.ui.vtm.Vtm} instance that owns this panel.
             * @public
             * @function
             * @returns {sap.ui.vtm.Vtm} The {@link sap.ui.vtm.Vtm} instance that owns this panel.
             */
            getVtm: function () {
                if (!this._vtm) {
                    this._vtm = sap.ui.getCore().byId(this.getVtmId());
                }
                return this._vtm;
            },

            /**
             * Sets whether this is the active {@link sap.ui.vtm.Panel}.
             * @function
             * @private
             * @param {boolean} bIsActive <true> if this {@link sap.ve.vtm.Panel} is the active {@link sap.ve.vtm.Panel}.
             * @returns {sap.ui.vtm.Panel} Reference to <code>this</code> for method chaining.
             */
            _setIsActive : function (bIsActive) {
                var currentlyActive = this._isActive;
                if (currentlyActive !== bIsActive) {
                    this._isActive = bIsActive;
                    var panel = this._getPanel();
                    if (bIsActive) {
                        panel.addStyleClass("sapUiVtmPanel_ActiveBorder");
                        panel.removeStyleClass("sapUiVtmPanel_InactiveBorder");
                    } else {
                        panel.addStyleClass("sapUiVtmPanel_InactiveBorder");
                        panel.removeStyleClass("sapUiVtmPanel_ActiveBorder");
                    }
                }
                return this;
            },

            /**
             * Gets whether this is the active {@link sap.ui.vtm.Panel}.
             * @function
             * @public
             * @returns {boolean} <code>true</code> if this is the active panel.
             */
            getIsActive: function() {
                return this._isActive;
            },

            getTreeWidth: function() {
                if (!this.getShowViewport()) {
                    return "100%";
                }
                var treeLayoutData = this._getTreeLayoutData();
                var size = treeLayoutData.getSize();
                if (size === "auto") {
                    return "50%"; // default value
                }
                return size;
            },

            setTreeWidth: function(sTreeWidth) {
                if (!sTreeWidth) {
                    return this;
                }

                if (sTreeWidth === "auto") {
                    sTreeWidth = this.getShowViewport() ? "50%" : "100%";
                }

                var percent = sTreeWidth.indexOf("%") > -1;
                var treeLayoutData = this._getTreeLayoutData();
                var viewportLayoutData = this._getViewportLayoutData();

                if (sTreeWidth.indexOf("px") > -1 || percent) {
                    var iSize = parseInt(sTreeWidth, 10);
                    if (iSize < 0) {
                        jQuery.sap.log.error("Negative treeWidth values are not permitted", null, "sap.ui.vtm.Panel");
                        return this;
                    }
                    if (percent && iSize > 100) {
                        sTreeWidth = "100%";
                    }
                } else {
                    var message = "Illegal treeWidth value: " + sTreeWidth;
                    jQuery.sap.log.error(message, null, "sap.ui.vtm.Panel");
                    return this;
                }

                treeLayoutData.setSize(sTreeWidth);
                viewportLayoutData.setSize("auto");
                return this;
            }
        });

        return Panel;
    });
