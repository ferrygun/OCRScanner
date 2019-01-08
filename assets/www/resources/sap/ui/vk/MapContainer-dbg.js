/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.MapContainer.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/vk/ContainerBase", "sap/ui/core/IconPool", "sap/ui/vbm/lib/sapvbi", "sap/ui/Device"
], function(jQuery, library, ContainerBase, IconPool, sapvbi, Device) {
	"use strict";

	/**
	 * Constructor for a new MapContainer.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Abstract Constructor for a new Container.
	 * @extends sap.ui.vk.ContainerBase
	 * @author SAP SE
	 * @constructor
	 * @public
	 * @alias sap.ui.vk.MapContainer
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.38.0 This class is experimental and might be modified or removed in future versions.
	 */
	var MapContainer = ContainerBase.extend("sap.ui.vk.MapContainer", /** @lends sap.ui.vk.MapContainer.prototype */
	{
		metadata: {

			library: "sap.ui.vk",
			properties: {
				/**
				 * Show navbar
				 */
				"showNavbar": {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},
				/**
				 * Controls the visibility of the home button
				 */
				"showHome": {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},
				/**
				 * Controls the visibility of the Map Layer Select
				 */
				"showMapLayer": {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},
				/**
				 * Controls the visibility of the rectangular zoom button
				 */
				"showRectangularZoom": {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},
				/**
				 * Controls the visibility of the zoom buttons
				 */
				"showZoom": {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				}
			},
			aggregations: {
				/**
				 * List Panel aggregation
				 */
				"listPanelStack": {
					type: "sap.ui.vk.ListPanelStack",
					multiple: false
				},
				/**
				 * hidden scroll container aggregation needed for binding
				 */
				"scrollCont": {
					type: "sap.m.ScrollContainer",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {},
			events: {}
		}
	});

	// ...........................................................................//
	// This file defines behavior for the control,...............................//
	// ...........................................................................//
	// Public API functions
	// ............................................................................//

	// ........................................................................//
	// Implementation of UI5 Interface functions
	// ........................................................................//

	MapContainer.prototype.init = function() {
		this._currentText = new sap.m.Text({
		}).addStyleClass("mapLayerSelectedText");
		// call super init
		ContainerBase.prototype.init.apply(this, arguments);

		// create model and set the data
		var oModel = new sap.ui.model.json.JSONModel();
		oModel.setData({
			rectZoom: false
		});
		this.setModel(oModel, "rectZoom");

		// navbar
		this._oNavbar = new sap.m.Toolbar({
			// Use ToolbarDesign.Auto
			width: "auto"
		});
		// scroll container for list panel stack
		this._oScrollCont = new sap.m.ScrollContainer({
			horizontal: false,
			vertical: true,
			focusable: false
		});
		this.setAggregation("scrollCont", this._oScrollCont, /* bSuppressInvalidate= */ true);

		// create potential navbar buttons
		this._oHomeButton = new sap.m.Button({
			icon: "sap-icon://home",
			type: sap.m.ButtonType.Transparent,
			tooltip: sap.ui.vk.getResourceBundle().getText("MAPCONTAINER_HOME"),
			press: this._onNavbarHome.bind(this)
		});
		this._oRectZoomButton = new sap.m.ToggleButton({
			icon: "sap-icon://draw-rectangle",
			type: sap.m.ButtonType.Transparent,
			pressed: "{rectZoom>/rectZoom}",
			tooltip: sap.ui.vk.getResourceBundle().getText("MAPCONTAINER_RECT_ZOOM")
		}).setModel(oModel, "rectZoom");
		this._oZoomInButton = new sap.m.Button({
			icon: "sap-icon://add",
			type: sap.m.ButtonType.Transparent,
			tooltip: sap.ui.vk.getResourceBundle().getText("MAPCONTAINER_ZOOMIN"),
			press: this._onNavbarZoomIn.bind(this)
		});
		this._oZoomOutButton = new sap.m.Button({
			icon: "sap-icon://less",
			type: sap.m.ButtonType.Transparent,
			tooltip: sap.ui.vk.getResourceBundle().getText("MAPCONTAINER_ZOOMOUT"),
			press: this._onNavbarZoomOut.bind(this)
		});

		// Menu buttons for ListPanelStack on mobile phone
		if (Device.system.phone) {
			this._oMenuOpenButton = new sap.m.Button({
				layoutData: new sap.m.OverflowToolbarLayoutData({
					priority: sap.m.OverflowToolbarPriority.NeverOverflow
				}),
				icon: "sap-icon://menu2",
				type: sap.m.ButtonType.Transparent,
				tooltip: sap.ui.vk.getResourceBundle().getText("CONTAINERBASE_MENU"),
				press: function() {
					this._bSegmentedButtonSaveSelectState = true;
					this._showListPanelStack();
				}.bind(this)
			});
			this._oMenuCloseButton = new sap.m.Button({
				type: sap.m.ButtonType.Transparent,
				icon: "sap-icon://nav-back",
				press: function() {
					this._bSegmentedButtonSaveSelectState = true;
					this._hideListPanelStack();
				}.bind(this)
			});
		}
	};

	MapContainer.prototype.exit = function() {
		if (this._oNavbar) {
			this._oNavbar.destroy();
			this._oNavbar = undefined;
		}
		if (this._oScrollCont) {
			this._oScrollCont.destroy();
			this._oScrollCont = undefined;
		}
		// call super exit
		ContainerBase.prototype.exit.apply(this, arguments);
	};

	// delegate listPanelStack aggregation to ScrollContainer content aggregation
	MapContainer.prototype.getListPanelStack = function() {
		return this._oScrollCont.getContent()[0];
	};

	MapContainer.prototype.setListPanelStack = function(oPanel) {
		if (Device.system.phone) {
			// Do not allow to collapse List Panel Stack on mobile phones, since it is rendered in a side container there
			oPanel.setCollapsible(false);
			oPanel.setWidth("100%");
		}
		this._oScrollCont.removeAllContent();
		return this._oScrollCont.addContent(oPanel);
	};

	// ...............................................................................
	// Redefined functions
	// ...............................................................................

	MapContainer.prototype.onBeforeRendering = function() {
		// call super implementation
		ContainerBase.prototype.onBeforeRendering.apply(this, arguments);

		this._oNavbar.removeAllContent();
		// repopulate navbar buttons according current settings

		var content = this.getSelectedContent();
		if (content !== null) {
			var control = content.getContent();
			this._isInstanceGeoAnalytic = control instanceof sap.ui.vbm.GeoMap || control instanceof sap.ui.vbm.AnalyticMap;
			if (this._isInstanceGeoAnalytic) {
				if (this.getShowHome()) {
					this._oNavbar.addContent(this._oHomeButton);
				}
				if (!Device.system.phone && this.getShowRectangularZoom()) {
					this._oNavbar.addContent(this._oRectZoomButton);
				}
				if (this.getShowZoom()) {
					this._oNavbar.addContent(this._oZoomInButton);
					this._oNavbar.addContent(this._oZoomOutButton);
				}
				this._shouldRenderListPanel = true;
			} else {
				this._shouldRenderListPanel = false;
			}
			this._isSupportingMapLayerSwitch = control instanceof sap.ui.vbm.GeoMap && !(control instanceof sap.ui.vbm.AnalyticMap);
			if (this._isSupportingMapLayerSwitch && control.getMapConfiguration() !== null && this.getShowMapLayer()) {

				var config = control.getMapConfiguration();
				var layers = [].concat(config.MapLayerStacks);

				if (layers.length > 1) {

					this._box = new sap.m.HBox({}).addStyleClass("mapContainerHboxPopover");

						this._popover = new sap.m.Popover({
							placement: sap.m.PlacementType.Horizontal,
							content: this._box,
							showHeader: false
						});

						this._selectionMap = new sap.m.Image({
							width: "4.7rem",
							press: function(event) {
								if (this._popover.isOpen()) {
									this._popover.close();
								} else {
									this._popover.openBy(this._selectionMap);
								}
							}.bind(this)
						}).addStyleClass("mapLayerPopoverItem");

				}
				this._shouldRenderMapLayerSwitch = true;
			} else {
				this._shouldRenderMapLayerSwitch = false;
			}
		}
	};

	MapContainer.prototype.onAfterRendering = function() {
		if (Device.system.phone) {
			// append ListPanelStackWrapper to control div to be a sibling of the content wrapper
			var oListPanelWrapperDiv = document.getElementById(this.getId() + "-LPW");
			this.getDomRef().appendChild(oListPanelWrapperDiv);
		}

		// call super implementation
		ContainerBase.prototype.onAfterRendering.apply(this, arguments);

		if (this.getSelectedContent() !== null) {
			var control = this.getSelectedContent().getContent();
			if (this._isSupportingMapLayerSwitch === true && control.getMapConfiguration()) {

				var config = control.getMapConfiguration();
				var layers = [].concat(config.MapLayerStacks);

				if (layers.length > 1) {
					layers.forEach(function(v, index) {

						var verticalLayout = new sap.ui.layout.VerticalLayout({});

						// Access the scene to use getPreviewImage callback
						var scene = control.mVBIContext.GetMainScene();
						var currentMapLayerStack = control.mVBIContext.m_MapLayerStackManager.GetMapLayerStack(v.name);

						var oItem = new sap.m.Image({
							width: "4.5rem",
							press: function(event) {
								this._popover.close();
								oItem.setAlt(v.name);
								var eventSource = event.getSource();
								var text = eventSource.getAlt();
								control.setRefMapLayerStack(text);
								this._currentText.setText(v.name);

								// Call GetPreviewImage with selected map layer stack and set callback image source
								scene.GetPreviewImage(currentMapLayerStack, function(img) {
									// Set the source of selected tile button
									jQuery(".mapLayerPopoverItem").attr("src", img.src);
								});
								this._currentMapLayerStackIndex = index;
							}.bind(this)
						});

						var oItemText = new sap.m.Text({
							text: v.name
						}).addStyleClass("mapLayerPopoverItemText");

						oItem.addStyleClass("layerType");

						// set the source of items in popover
						scene.GetPreviewImage(currentMapLayerStack, function(img) {
							oItem.setSrc(img.src);
						});

						// set tile of selected map layer stack on initial load
						scene.GetPreviewImage(scene.m_MapLayerStack, function(img) {
							jQuery(".mapLayerPopoverItem").attr("src", img.src);
						});

						var name = layers[this._currentMapLayerStackIndex || 0].name;
						this._currentText.setText(name);
						this._box.addItem(verticalLayout);

						verticalLayout.addContent(oItem);
						verticalLayout.addContent(oItemText);
					}, this);
				}
			}
		}
	};

	MapContainer.prototype.setSelectedContent = function(oContent) {
		var oOldControl;
		if (this._oSelectedContent) {
			if ((oOldControl = this._oSelectedContent.getContent()) instanceof sap.ui.vbm.GeoMap) {
				oOldControl.unbindProperty("rectZoom", "rectZoom>/rectZoom");
			}
		}
		// call super implementation
		ContainerBase.prototype.setSelectedContent.apply(this, arguments);

		var oNewControl = this._oSelectedContent.getContent();
		if (oNewControl instanceof sap.ui.vbm.GeoMap) {
			oNewControl.bindProperty("rectZoom", "rectZoom>/rectZoom");
		}
	};

	MapContainer.prototype._addToolbarContent = function() {
		if (Device.system.phone) {
			this._oToolbar.addContent(this._oMenuOpenButton);
		}
		// call super implemetation
		ContainerBase.prototype._addToolbarContent.apply(this, arguments);
	};

	// ...............................................................................
	// Internal functions
	// ...............................................................................

	MapContainer.prototype._onNavbarZoomIn = function(oEvent) {

		var control = this.getSelectedContent().getContent();
		if (control.getZoomlevel && control.setZoomlevel && control.setEnableAnimation) {
			control.setEnableAnimation(true);
			control.setZoomlevel(control.getZoomlevel() + 1);
		}
	};

	MapContainer.prototype._onNavbarZoomOut = function(oEvent) {
		var control = this.getSelectedContent().getContent();
		if (control.getZoomlevel && control.setZoomlevel && control.setEnableAnimation) {
			control.setEnableAnimation(true);
			control.setZoomlevel(control.getZoomlevel() - 1);
		}
	};

	MapContainer.prototype._onNavbarHome = function(oEvent) {
		var control = this.getSelectedContent().getContent();
		if (control.goToStartPosition) {
			control.goToStartPosition();
		}
	};

	MapContainer.prototype._showListPanelStack = function() {
		jQuery("#" + this.getId() + "-LPW").addClass("sapUiVkMapContainerLPWIn");
		jQuery("#" + this.getId() + "-wrapper").addClass("sapUiVkMapContainerMapOut");
	};

	MapContainer.prototype._hideListPanelStack = function() {
		jQuery("#" + this.getId() + "-LPW").removeClass("sapUiVkMapContainerLPWIn");
		jQuery("#" + this.getId() + "-wrapper").removeClass("sapUiVkMapContainerMapOut");
	};

	return MapContainer;

});
