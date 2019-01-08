/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.StepNavigation.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control", "sap/ui/core/ResizeHandler", "./Loco", "./ViewportHandler",
	"sap/ui/core/Popup", "sap/ui/core/IconPool", "./Messages", "./DvlException", "./ContentConnector"
], function(jQuery, library, Control, ResizeHandler, Loco, ViewportHandler,
            Popup, IconPool, Messages, DvlException, ContentConnector) {
	"use strict";

	/**
	 *  Constructor for a new StepNavigation.
	 *
	 * @class
	 * Enables capabilities for navigating and activating procedures and steps contained in a single 3D scene.
	 *
	 * @param {string} [sId] ID for the new control. This ID is generated automatically if no ID is provided.
	 * @param {object} [mSettings] Initial settings for the new Step Navigation control.
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.core.Control
	 * @alias sap.ui.vk.StepNavigation
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var StepNavigation = Control.extend("sap.ui.vk.StepNavigation", /** @lends sap.ui.vk.StepNavigation.prototype */ {
		metadata: {
			library: "sap.ui.vk",
			properties: {
				/**
				 * Managed settings and properties for Step Navigation events.
				 */
				settings: "object",

				/**
				 * Width of the Step Navigation control.
				 */
				width: {
					type: "sap.ui.core.CSSSize",
					defaultValue: "100%"
				},

				/**
				 * Height of the Step Navigation control.
				 */
				height: {
					type: "sap.ui.core.CSSSize",
					defaultValue: "100%"
				},

				/**
				 * Indicates that the Step Navigation control should display thumbnails.
				 * If set to <code>true</code>, then thumbnails are rendered. If set to <code>false</code>, then thumbnails are hidden.
				 */
				showThumbnails: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * Indicates that the Step Navigation control should display a toolbar.
				 * If set to <code>true</code>, then the toolbar is rendered. If set to <code>false</code>, then the toolbar is hidden.
				 */
				showToolbar: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * Indicates that the Step Navigation control should display a popup containing information around the step that is playing.
				 * If set to <code>true</code>, then the popup is rendered. If set to <code>false</code>, the popup is hidden.
				 */
				showStepInfo: {
					type: "boolean",
					group: "Appearance",
					defaultValue: false
				}
			},

			publicMethods: [
				"setScene",
				"playStep",
				"pauseStep",
				"playAllSteps",
				"getStep",
				"getNextStep",
				"getPreviousStep",
				"getProceduresAndSteps",
				"refresh",
				"clear"
			],

			associations: {
				contentConnector: {
					type: "sap.ui.vk.ContentConnector"
				}
			},

			aggregations: {
				/**
				 * Template control for Procedure items.
				 */
				procedureItemTemplate: {
					type: "sap.ui.core.Item",
					multiple: false
				},

				/**
				 * sap.ui.core.Popup used to render step information in a popup.
				 */
				stepInfoPopup: {
					type: "sap.ui.core.Control",
					multiple: false
				},

				/**
				 * sap.m.Panel used to render the entire Step Navigation control's content.
				 */
				layout: {
					type: "sap.m.Toolbar",
					multiple: false
				},
				/**
				 * sap.m.Panel used to render a list of thumbnails for the available steps.
				 */
				thumbnailsContainer: {
					type: "sap.m.Panel",
					multiple: false
				}
			},

			events: {
				"resize": {
					parameters: {
						oldSize: "object",
						size: "object"
					}
				},

				/**
				 * Raised each time a step starts, changes, or finishes.
				 */
				"stepChanged": {
					parameters: {
						/**
						 * The ID of the rendering client that raised the event.
						 */
						clientId: "object",

						/**
						 * The type of sap.ve.dvl.DVLSTEPEVENT that has been raised; for example, DVLSTEPEVENT_FINISHED, DVLSTEPEVENT_SWITCHED, DVLSTEPEVENT_STARTED.
						 */
						type: "object",

						/**
						 * The ID of the step affected by this stepId event.
						 */
						stepId: "object"
					}
				}
			}
		}
	});

	StepNavigation.prototype._onStepEvent = function(parameters) {
		var oSettings = this.getSettings();
		this.instanceSettings.currentStepId = parameters.stepId;
		switch (parameters.type) {
			case sap.ve.dvl.DVLSTEPEVENT.DVLSTEPEVENT_FINISHED:
				oSettings.currentStepFinished = true;
				oSettings.currentStepPaused = false;
				oSettings.playAllActive = false;
				oSettings.isPlaying = false;
				this._togglePlayPause(true);
				break;
			case sap.ve.dvl.DVLSTEPEVENT.DVLSTEPEVENT_SWITCHED: // WARNING
			case sap.ve.dvl.DVLSTEPEVENT.DVLSTEPEVENT_STARTED:
				oSettings.currentStepId = parameters.stepId;
				oSettings.currentStepFinished = false;
				this._highlightStep(parameters.stepId);
					// The user may have attempted to pause the step as it changed.
					// The following attempts to honor the intent by pausing the current step
					if (oSettings.currentStepPaused) {
						this.pauseStep();
					}
				break;
			default:
				jQuery.sap.log.error(sap.ui.vk.getResourceBundle().getText(Messages.VIT12.summary), Messages.VIT12.code, "sap.ui.vk.StepNavigation");
		}

		this.fireStepChanged({
			clientId: parameters.clientId,
			type: parameters.type,
			stepId: parameters.stepId
		});
	};

	/**
	 * Attaches a Scene object to the Step Navigation control so that it can access the Scene’s procedures and steps.
	 *
	 * @param {object} scene The Scene object to attach to the Step Navigation control.
	 * @public
	 */
	StepNavigation.prototype.setScene = function(scene) {
		if (this._scene) {
			this.oDvl.Client.detachStepEvent(this._onStepEvent, this);
			this.oDvl = null;
		}

		// temporary fix to prevent crash for non-dvl scene. Need proper fix
		if (scene) {
			var sceneType = scene.getMetadata().getName();
			if (sceneType !== "sap.ui.vk.dvl.Scene") {
				return;
			}
		}

		this._scene = scene;
		this.instanceSettings = {};

		if (this._scene) {
			this.oDvl = scene.getGraphicsCore().getApi(sap.ui.vk.dvl.GraphicsCoreApi.LegacyDvl);
			this.oDvl.Client.attachStepEvent(this._onStepEvent, this);
		}

		delete this._procedures;
		var oProcedureList = this.getProcedureList();
		var oSettings = this.getSettings();
		oSettings.reset();
		oProcedureList.unbindItems();
		oProcedureList.setSelectedItem(oProcedureList.getFirstItem()); // oProcedureList.setSelectedItem(null);

		// Destroy the step info popup if it exists
		if (oSettings.stepInfo.stepMessagePopup) {
			if (!oSettings.stepInfo.stepMessagePopup.isOpen()) {
				oSettings.stepInfo.stepMessagePopup.close();
			}
			oSettings.stepInfo.stepMessagePopup.destroy();
			oSettings.stepInfo.stepMessagePopup = null;
			this.getShowStepInfoButton().setText(sap.ui.vk.getResourceBundle().getText("STEP_NAV_STEPDESCRIPTIONHEADING"));
		}

		// Get Steps and decide whether to enable/disable controls
		var data = this._getStepThumbnails();
		this.oModel.setData(data);
		this._togglePlayPause(true);
		this._refreshControl();
		this.refresh();
	};

	StepNavigation.prototype.init = function() {
		if (Control.prototype.init) {
			Control.prototype.init.call(this);
		}

		if (this.getSettings() == undefined) {
			this.setSettings(new this._settings());
		}
		this._scene = null;

		// Create JSON data model
		this.oModel = new sap.ui.model.json.JSONModel();
		// Create layout panel

		this._layout = new sap.m.Toolbar({
			design: sap.m.ToolbarDesign.Solid
		});

		// this._layout.addContent();
		this.setAggregation("layout", this._layout);

		if (this.getShowThumbnails()) {
			this._thumbnailsScroller = new sap.m.ScrollContainer(this.getId() + "-scroller", {
				width: "100%",
				horizontal: true,
				vertical: false,
				focusable: true
			});
			this._thumbnailsContainer = new sap.m.Panel({
				expandable: false,
				content: [
					this._thumbnailsScroller
				]
			});
			this.setAggregation("thumbnailsContainer", this._thumbnailsContainer);
		}
		// Create the play previous button
		this.playPreviousButton = new sap.m.Button(this.getId() + "-playPreviousButton", {
			type: sap.m.ButtonType.Transparent,
			icon: "sap-icon://slim-arrow-left",
			tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PREVIOUSSTEPBUTTON"),
			visible: true,
			press: function(e) {
				var oSettings = this.getSettings();
				var prevStep = this.getPreviousStep(oSettings.currentProcedureIndex);
				if (prevStep) {
					oSettings.currentStepPaused = false;
					this.playStep(prevStep.id, true, oSettings.playAllActive);
					this._togglePlayPause(false);
				}
			}.bind(this)
		});

		// Create the play next button
		this.playNextButton = new sap.m.Button(this.getId() + "-playNextButton", {
			type: sap.m.ButtonType.Transparent,
			icon: "sap-icon://slim-arrow-right",
			tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_NEXTSTEPBUTTON"),
			visible: true,
			press: function(e) {
				var oSettings = this.getSettings();
				var nextStep = this.getNextStep(oSettings.currentProcedureIndex);
				if (nextStep) {
					oSettings.currentStepPaused = false;
					this.playStep(nextStep.id, true, oSettings.playAllActive);
					this._togglePlayPause(false);
				}
			}.bind(this)
		});

		// Create the play next button
		this.playOptionButton = new sap.m.Button(this.getId() + "-playOptionButton", {
			type: sap.m.ButtonType.Transparent,
			icon: "sap-icon://media-play",
			tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYBUTTON_PLAY"),
			visible: true,
			press: function(e) {
				var key = this.getPlayMenuButton().getSelectedKey(); // e.oSource.getSelectedKey();
				var oSettings = this.getSettings();
				var firstStep = null;
				switch (key) {
					case "0":
						// Play
						if (!oSettings.currentStepId) {
							firstStep = this.getNextStep(oSettings.currentProcedureIndex);
							if (firstStep) {
								oSettings.currentStepId = firstStep.id;
							} else {
								return; // If there is no first step then do nothing
							}

						}
						oSettings.playAllActive = false;
						this.playStep(oSettings.currentStepId, !oSettings.currentStepPaused, oSettings.playAllActive);
						oSettings.isPlaying = true;
						oSettings.currentStepPaused = false;
						this._togglePlayPause(false);
						break;
					case "1":
						oSettings.playAllActive = true;
						oSettings.currentStepPaused = false;
						this.playAllSteps(oSettings.currentProcedureId);
						oSettings.isPlaying = true;
						this._togglePlayPause(false);
						break;
					case "2":
						if (!oSettings.currentStepId) {
							firstStep = this.getNextStep(oSettings.currentProcedureIndex);
							if (firstStep) {
								oSettings.currentStepId = firstStep.id;
							} else {
								return; // If there is no first step then do nothing
							}
						}
						oSettings.playAllActive = true;
						var playFromBeginning = !oSettings.currentStepPaused;
						oSettings.currentStepPaused = false;
						this.playStep(oSettings.currentStepId, playFromBeginning, oSettings.playAllActive);
						oSettings.isPlaying = true;
						this._togglePlayPause(false);
						break;
					default:
						break;
				}
			}.bind(this)
		});


		// Create the procedures dropdown list
		this.procedureList = new sap.m.Select(this.getId() + "-procedureList", {
			tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PROCEDURESLISTHEADING"),
			selectedKey: "0",
			type: sap.m.SelectType.Default,
			enabled: true,
			width: "30%",
			autoAdjustWidth: true,
			change: function(oControlEvent) {
				// Reset the control info when they change the selected procedure
				var oProcedureList = this.getProcedureList();
				var oSettings = this.getSettings();
				oSettings.currentProcedureIndex = 0; // Set the default to the first procedure
				oSettings.currentProcedureId = this.instanceSettings.currentProcedureId = oProcedureList.getSelectedKey();
				oSettings.currentStepId = this.instanceSettings.currentStepId = null;
				for (var ip = 0; ip < this.oModel.oData.procedures.length; ip++) {
					if (this.oModel.oData.procedures[ip].id == oSettings.currentProcedureId) {
						oSettings.currentProcedureIndex = ip;
						oSettings.currentProcedure = this.oModel.oData.procedures[ip];
						break;
					}
				}

				// Destroy the step info popup if it exists
				if (oSettings.stepInfo.stepMessagePopup) {
					if (!oSettings.stepInfo.stepMessagePopup.isOpen()) {
						oSettings.stepInfo.stepMessagePopup.close();
					}
					oSettings.stepInfo.stepMessagePopup.destroy();
					oSettings.stepInfo.stepMessagePopup = null;
				}

				this._refreshItems();
			}.bind(this)
		});

		this.procedureList.addStyleClass("sapVizKitStepNavigationProcedureList");

		// Create the item template for the procedure drop down list
		this.setAggregation("procedureItemTemplate", (
			new sap.ui.core.ListItem()
			.bindProperty("text", "name")
			.bindProperty("key", "id")
			.bindProperty("tooltip", "name")));

		// Create the play menu
		this.playMenuButton = (new sap.m.Select(this.getId() + "-playMenuButtonIcon", {
			selectedKey: "0",
			type: sap.m.SelectType.Default,
			tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYMENU_PLAYOPTIONS"),
			enabled: true,
			autoAdjustWidth: false,
			items: [
				new sap.ui.core.ListItem({
					key: "0",
					icon: "sap-icon://media-play",
					text: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYMENU_PLAY"),
					tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYMENU_PLAY")
				}),
				new sap.ui.core.ListItem({
					key: "1",
					icon: "sap-icon://media-play",
					text: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYMENU_PLAYALL"),
					tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYMENU_PLAYALL")
				}),
				new sap.ui.core.ListItem({
					key: "2",
					icon: "sap-icon://media-play",
					text: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYMENU_PLAYALLREMAINING"),
					tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYMENU_PLAYALLREMAINING")
				})
			]
		}));

		this.playMenuButton.addStyleClass("sapVizKitStepNavigationPlayOptionsSelect");


		// Create the pause button
		this.pauseButton = new sap.m.Button(this.getId() + "-pauseButton", {
			type: sap.m.ButtonType.Transparent,
			icon: "sap-icon://media-pause",
			visible: false,
			tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_PLAYMENU_PAUSE"),
			press: function(e) {
				var oSettings = this.getSettings();
				this.pauseStep();
				oSettings.currentStepPaused = true;
				oSettings.isPlaying = false;
				this._togglePlayPause(true);
			}.bind(this)
		});

		this.showStepInfoButton = new sap.m.ToggleButton(this.getId() + "-showStepInfoButton", {
			icon: "sap-icon://hide",
			type: sap.m.ButtonType.Transparent,
			pressed: false,
			text: sap.ui.vk.getResourceBundle().getText("STEP_NAV_STEPDESCRIPTIONHEADING"),
			tooltip: sap.ui.vk.getResourceBundle().getText("STEP_NAV_STEPDESCRIPTIONHEADING"),
			press: function(oEvent) {
				var target = oEvent.getSource();
				if (target.getPressed()) {
					this.setShowStepInfo(true);
					target.setIcon("sap-icon://show");
					target.setTooltip(sap.ui.vk.getResourceBundle().getText("STEP_NAV_HIDESTEPDESCRIPTIONBUTTON"));
				} else {
					this.setShowStepInfo(false);
					target.setIcon("sap-icon://hide");
					target.setTooltip(sap.ui.vk.getResourceBundle().getText("STEP_NAV_SHOWSTEPDESCRIPTIONBUTTON"));
				}
			}.bind(this)
		});


		this._layout.addContent(this.playPreviousButton)
		            .addContent(this.playOptionButton)
		            .addContent(this.pauseButton)
		            .addContent(this.playMenuButton)
		            .addContent(this.procedureList)
		            .addContent(this.showStepInfoButton)
		            .addContent(new sap.m.ToolbarSpacer())
		            .addContent(this.playNextButton);
	};

	StepNavigation.prototype.destroy = function() {
		return Control.prototype.destroy.call(this);
	};

	StepNavigation.prototype.getScroller = function() {
		return this._thumbnailsScroller;
	};

	StepNavigation.prototype.getProcedureList = function() {
		var id = this.getId() + "-procedureList";
		var ht = this._layout;
		var cnt = sap.ui.getCore().byId(id);
		return ht.getContent()[ht.indexOfContent(cnt)];
	};

	StepNavigation.prototype.getPlayMenuButton = function() {
		var id = this.getId() + "-playMenuButtonIcon";
		var ht = this._layout;
		var cnt = sap.ui.getCore().byId(id);
		return ht.getContent()[ht.indexOfContent(cnt)];
	};

	StepNavigation.prototype.getPlayOptionButton = function() {
		var id = this.getId() + "-playOptionButton";
		var ht = this._layout;
		var cnt = sap.ui.getCore().byId(id);
		return ht.getContent()[ht.indexOfContent(cnt)];
	};

	StepNavigation.prototype.getPauseButton = function() {
		var id = this.getId() + "-pauseButton";
		var ht = this._layout;
		var cnt = sap.ui.getCore().byId(id);
		return ht.getContent()[ht.indexOfContent(cnt)];
	};

	StepNavigation.prototype.getPlayNextButton = function() {
		var id = this.getId() + "-playNextButton";
		var ht = this._layout;
		var cnt = sap.ui.getCore().byId(id);
		return ht.getContent()[ht.indexOfContent(cnt)];
	};

	StepNavigation.prototype.getPlayPreviousButton = function() {
		var id = this.getId() + "-playPreviousButton";
		var ht = this._layout;
		var cnt = sap.ui.getCore().byId(id);
		return ht.getContent()[ht.indexOfContent(cnt)];
	};

	StepNavigation.prototype.getShowStepInfoButton = function() {
		var id = this.getId() + "-showStepInfoButton";
		var ht = this._layout;
		var cnt = sap.ui.getCore().byId(id);
		return ht.getContent()[ht.indexOfContent(cnt)];
	};

	StepNavigation.prototype.exit = function() {
		if (this._resizeListenerId) {
			ResizeHandler.deregister(this._resizeListenerId);
			this._resizeListenerId = null;
		}
		if (Control.prototype.exit) {
			Control.prototype.exit.apply(this);
		}
	};

	/**
	 * Control runtime settings (intended as internal/read-only).
	 * @return {object} It returns the control runtime settings.
	 * @private
	 */
	StepNavigation.prototype._settings = function() {
		return {
			enabled: false,
			toggle: {
				addCss: function(key, property, onValue, offValue) {
					if (!this.targets[key]) {
						this.targets[key] = {
							"type": "css",
							"property": property,
							"onValue": onValue,
							"offValue": offValue
						};
					}
				},

				addMethod: function(target, method, onValue, offValue, useJQuery) {
					var key = target.getId();
					if (!this.targets[key]) {
						this.targets[key] = {
							"type": "method",
							"target": target,
							"method": method,
							"onValue": onValue,
							"offValue": offValue,
							"useJQuery": useJQuery
						};
					}
				},

				targets: {}
			},

			currentProcedureIndex: 0,
			currentProcedureId: "",
			currentProcedure: null, // Managed and used by popup step info
			currentStepId: null,
			currentStep: null, // Managed and used by popup step info
			currentStepPaused: false,
			isPlaying: false,
			currentStepFinished: true,
			playAllActive: false,
			showToolbar: true,
			showThumbnails: true,
			portfolioMode: false,
			reset: function() {
				this.currentStep = null;
				this.currentProcedure = null;
				this.currentProcedureIndex = 0;
				this.currentProcedureId = "";
				this.currentStepId = null;
				this.currentStepPaused = false;
				this.currentStepFinished = true;
				this.playAllActive = false;
				this.portfolioMode = false;
			},

			stepInfo: {
				lastTop: null,
				lastLeft: null,
				stepMessagePopup: null,
				openPopup: function(popupTitle, textContent, target, placement) {

					this._customHeaderText = this._customHeaderText || new sap.m.Text({
						width: "100%",
						textAlign: sap.ui.core.TextAlign.Center
					}).addStyleClass("sapVizKitStepNavigationPopoverTitle");
					this._customHeaderText.setText(popupTitle);
					this._customHeaderText.setTooltip(popupTitle);

					// We are creating a custom header for the popup title.
					// If the title is too long, we show only what it fits in the popup,
					// the rest is hidden using ellipsis.
					// If you hover your mouse over the truncated title, a tooltip will be displayed
					// showing the entire title.
					this._customHeader = this._customHeader || new sap.m.Bar({
						contentLeft: [
							this._customHeaderText
						]
					});

					this._textContent = this._textContent || new sap.m.Text({});
					this._textContent.addStyleClass("sapVizKitStepNavigationPopoverContent");
					this._textContent.setText(textContent);

					// If the popup hasn't been created so far,
					// we create a new instance and populate it.
					this.stepMessagePopup = this.stepMessagePopup || new sap.m.ResponsivePopover({
						placement: placement,
						showCloseButton: true,
						verticalScrolling: true,
						contentHeight: "10%",
						contentWidth: "30%",
						content: [
							this._textContent
						],
						customHeader: this._customHeader
					});
					this.stepMessagePopup.addStyleClass("sapVizKitStepNavigationPopoverStepInfo");

					this.stepMessagePopup.openBy(target);
				}
			}
		};
	};

	/**
	 * Rebuilds the content of the Step Navigation control from the current Scene.
	 * @param {object} oScene The scene object to be used.
	 * @return {boolean} Returns <code>true</code> if the content of the Step Navigation control was rebuilt successfully.
	 * @public
	 */
	StepNavigation.prototype.refresh = function(oScene) {
		jQuery.sap.log.info("StepNavigation refresh() called.");
		if (this.getVisible() && (this["_getStepThumbnails"] && this._scene != null)) {
			var oProcedureList = this.getProcedureList();
			var oSettings = this.getSettings();
			oSettings.reset();
			oProcedureList.setSelectedItem(oProcedureList.getFirstItem());

			// Get Steps and decide whether to enable/disable controls
			var data = this._getStepThumbnails();

			// Destroy the step info popup if it exists
			if (oSettings.stepInfo.stepMessagePopup) {
				if (!oSettings.stepInfo.stepMessagePopup.isOpen()) {
					oSettings.stepInfo.stepMessagePopup.close();
				}
				oSettings.stepInfo.stepMessagePopup.destroy();
				oSettings.stepInfo.stepMessagePopup = null;
			}

			//
			this.oModel.setData(data);
			this._togglePlayPause(true);
			this._refreshControl();
		} else if (this.getVisible()) {
			this._refreshControl();
		}
		return true;
	};

	/**
	 * Clears the content of the Step Navigation control.
	 *
	 * @return {boolean} Returns <code>true</code> if the method was called successfully.
	 * @public
	 */
	StepNavigation.prototype.clear = function() {
		jQuery.sap.log.info("StepNavigation clear() called.");
		return true;
	};

	StepNavigation.prototype.onBeforeRendering = function() {
		if (this._resizeListenerId) {
			ResizeHandler.deregister(this._resizeListenerId);
			this._resizeListenerId = null;
		}

		// **********************************************************************
		// **** CONFIGURE THE DROP DOWN LIST OF PROCEDURES					****
		// **********************************************************************
		if (this.getShowToolbar()) {
			var oProcedureList = this.getProcedureList();
			oProcedureList.setModel(this.oModel);
			var oProcedureItemTemplate = this.getProcedureItemTemplate();
			oProcedureList.bindItems("/procedures", oProcedureItemTemplate);
		}
	};

	StepNavigation.prototype.onAfterRendering = function() {
		if (this._canvas) {
			var domRef = this.getDomRef();
			domRef
				.appendChild(this._canvas);
			this._resizeListenerId = ResizeHandler
				.register(
					this,
					this._handleResize
					.bind(this));
			this._bestFit();
			this
				.fireResize({
					size: {
						width: domRef.clientWidth,
						height: domRef.clientHeight
					}
				});
		}

		// Events like the Toggle Step Info button are causing a re-render. The following workaround
		// ensures that the play/pause button do not get reset to incorrect defaults. This should be handled differently and will be updated in the future.
		var oSettings = this.getSettings();
		this._togglePlayPause(!oSettings.isPlaying);
		if (oSettings.currentStepId) {
			this._highlightStep(oSettings.currentStepId);
		}
	};

	/**
	 * @param {object} event The resize event object.
	 * @private
	 */
	StepNavigation.prototype._handleResize = function(event) {
		this.fireResize({
			oldSize: event.oldSize,
			size: event.size
		});
		this._update();
	};

	/**
	 * @private
	 */
	StepNavigation.prototype._reset = function() {
		this._x = 0;
		this._y = 0;
		this._s = 1.0;
		this._r = 0;
	};

	/**
	 * @private
	 */
	StepNavigation.prototype._update = function() {
		var x = this._x - (this._imageW - this._canvas.clientWidth) / 2;
		var y = this._y - (this._imageH - this._canvas.clientHeight) / 2;
		var transform = "matrix(" + this._s + ",0,0," + this._s + "," + x + "," + y + ")";

		this._img.style.transform = transform;
		this._img.style.webkitTransform = transform;
		this._img.style.msTransform = transform;
		this._img.style.MozTransform = transform;
		this._img.style.OTransform = transform;
	};

	StepNavigation.prototype._bestFit = function() {
		this._reset();
		var sx = this._canvas.clientWidth / this._img.width;
		var sy = this._canvas.clientHeight / this._img.height;
		this._s = sx < sy ? sx : sy;
		if (this._s == 0) {
			this._s = 1.0;
		}
		this._x = 0;
		this._y = 0;
		this._update();
	};

	// This delegate is called to set focus on controls that are not rendered yet.
	var deferredFocusDelegate = {
		onAfterRendering: function(event) {
			event.srcControl.focus();
			event.srcControl.removeEventDelegate(this); // Here 'this' equals the delegate itself.
		}
	};

	/**
	 * Toggle Play/Pause button visibility.
	 * @param {boolean} pauseActive Parameter that tells whether the pause is active or not.
	 * @private
	 */
	StepNavigation.prototype._togglePlayPause = function(pauseActive) {
		this.togglePlayPauseActive = true;
		if (this.getSettings().showToolbar) {
			var playOptionButton = this.getPlayOptionButton(),
				pauseButton = this.getPauseButton();
			if (pauseActive) {
				if (sap.ui.getCore().getCurrentFocusedControlId() === pauseButton.getId()) {
					playOptionButton.addEventDelegate(deferredFocusDelegate); // Do not pass the 'oThis' parameter, so that it would be equal to the delegate itself.
				}
				pauseButton.setVisible(false);
				playOptionButton.setVisible(true);
			} else {
				if (sap.ui.getCore().getCurrentFocusedControlId() === playOptionButton.getId()) {
					pauseButton.addEventDelegate(deferredFocusDelegate); // Do not pass the 'oThis' parameter, so that it would be equal to the delegate itself.
				}
				playOptionButton.setVisible(false);
				pauseButton.setVisible(true);
			}
		}
	};

	/**
	 * Used internally to refresh and update the controls and their data.
	 *
	 * @private
	 */
	StepNavigation.prototype._refreshControl = function() {

		// temporary fix to prevent crash when scene is not dvl scene
		if (!this.oModel.oData.procedures) {
			return;
		}

		// var that = this;
		var oProcedureList = this.getProcedureList();
		var oProcedureItemTemplate = this.getProcedureItemTemplate();
		var oSettings = this.getSettings();

		// Destroy the step info popup if it exists
		if (oSettings.stepInfo.stepMessagePopup) {
			if (!oSettings.stepInfo.stepMessagePopup.isOpen()) {
				oSettings.stepInfo.stepMessagePopup.close();
			}
			oSettings.stepInfo.stepMessagePopup.destroy();
			oSettings.stepInfo.stepMessagePopup = null;
			this.getShowStepInfoButton().setText(sap.ui.vk.getResourceBundle().getText("STEP_NAV_STEPDESCRIPTIONHEADING"));
		}

		oProcedureList.unbindItems();
		if (this.oModel.oData.procedures.length > 0) {
			var first = this.oModel.oData.procedures[0];
			if (this.getShowToolbar()) {
				oProcedureList.bindItems("/procedures", oProcedureItemTemplate);
				oProcedureList.selectedKey = first.id;
				oProcedureList.enabled = true;
			}
			this._refreshItems();
		} else {
			if (this.getShowToolbar()) {
				oProcedureList.bindItems("/procedures", oProcedureItemTemplate);
				oProcedureList.enabled = false;
			}

			if (this.getShowThumbnails()) {
				var oScroller = this.getScroller();
				oScroller.destroyContent();
			}
		}
	};

	/**
	 * Refreshes the step thumbnail list items.
	 *
	 * @private
	 */
	StepNavigation.prototype._refreshItems = function() {
		var that = this;
		var steps = [];
		var oProcedureList = this.getProcedureList();
		var oSettings = that.getSettings();
		var itemLayout = new sap.m.HBox();

		// Get the procedure info
		if (!oSettings.currentProcedure) {
			oSettings.currentProcedure = that.oModel.oData.procedures[oSettings.currentProcedureIndex];
			oProcedureList.setSelectedItem(oProcedureList.getFirstItem());
		}

		if (oSettings.currentProcedureId != "" || that.oModel.oData.procedures.length > 0) {
			if (that.getShowThumbnails()) {
				var oScroller = that.getScroller();
				// Clear the current controller layout
				oScroller.removeAllContent();
				steps = that.oModel.oData.procedures[oSettings.currentProcedureIndex].steps;
				var imagePress = function(ev) {
					oSettings.currentStepPaused = false;
					var cnt = sap.ui.getCore().byId(ev.getSource().getId());
					that.playStep(cnt.getCustomData()[0].getValue("stepId"));
					oSettings.playAllActive = false;
					that._togglePlayPause(false);
				};

				for (var i = 0; i < steps.length; i++) {
					var img = new sap.m.Image({
						alt: steps[i].name,
						src: "data:image/" + steps[i].thumbnailType + ";base64," + steps[i].thumbnailData,
						densityAware: false,
						tooltip: steps[i].name,
						press: imagePress.bind(that),
						layoutData: new sap.m.FlexItemData({
							shrinkFactor: 0
						})
					});

					img.data("stepId", steps[i].id); // Use for jQuery to change style - possibly refactor to iterate through sap.m.Image objects instead
					img.addCustomData(new sap.ui.core.CustomData({
						key: "stepId",
						value: steps[i].id
					}));
					img.addStyleClass("sapVizKitStepNavigationStepItem");
					itemLayout.addItem(img);
				}
				oScroller.addContent(itemLayout);
			}
		}
	};

	/**
	 * Calculates the distance between the Step Description button and the top of the DOCUMENT.
	 * If there is enough room, place the pop-up at the top.
	 * If there isn't, place it right under the Step Description button.
	 * @param {object} element The DOM element next to which the popup will be placed.
	 * @return {string} It returns the popup position as a string which will be passed to the popup renderer.
	 * @private
	 */
	StepNavigation.prototype._getPopupPlacement = function(element) {
		var placement = null;
		var yPos = 0;
		while (element) {
			yPos += element.offsetTop;
			element = element.offsetParent;
		}
		if (yPos > 200) {
			placement = sap.m.PlacementType.Top;
		} else {
			placement = sap.m.PlacementType.Bottom;
		}
		return placement;
	};

	/**
	 * It checks if it's necessary to scroll the container which holds
	 * the step thumbnails. We only need to scroll when the selected item is close to the margin.
	 * @param {object} item The currently active step navigation thumbnails item.
	 * @param {object} scroller The thumbnail scroller from the step navigation.
	 * @return {boolean} It returns <code>true</code> or <code>false</code> depending on whether the scrolling is necessary or not.
	 * @private
	 */
	StepNavigation.prototype._isScrollingNecessary = function(item, scroller) {
		var isNecessary;
		// if item or scroller are not defined, it means the step navigation
		// is not rendered so we don't need to do any scrolling.
		if (item && scroller) {
			var itemLeftPosition = jQuery(item).offset().left + jQuery(item).width();
			var totalWidth = jQuery(scroller).width();
			if (itemLeftPosition - jQuery(item).width() < 0) {
				// the thumbnail is too much to the left (thumbnail not fully visible)
				isNecessary = true;
			} else	if ((totalWidth - itemLeftPosition) < jQuery(item).width()) {
				// the thumbnail is too much to the right
				isNecessary = true;
			} else {
				// the thumbnail is visibile, no scrolling needed
				isNecessary = false;
			}
		} else {
			isNecessary = false;
		}
		return isNecessary;
	};

	/**
	 * It moves the scroller for the step thumbnails container
	 * so we can have the current step in sight.
	 * @param {object} item The item that we need to scroll to.
	 * @param {object} scrollableElement The thumbnail scroller from the step navigation.
	 * @private
	 */
	StepNavigation.prototype._scrollToItem = function(item, scrollableElement) {
		var properties = {},
			originalOffset = jQuery(item).offset(),
			containerScrollLeft = jQuery(scrollableElement).scrollLeft();

		properties.scrollLeft = originalOffset.left + (containerScrollLeft - jQuery(scrollableElement).offset().left);
		properties.scrollLeft -= parseInt(jQuery(item).css("marginLeft"), 10) || 0;
		properties.scrollLeft -= parseInt(jQuery(item).css("borderLeftWidth"), 10) || 0;
		// apply the scrolling effect
		jQuery(scrollableElement).animate(properties, 50);
	};

	/**
	 * Highlights a step - used to indicate that a step has recently played or is playing.
	 * @param {string} stepId The ID of the step that we want to highlight.
	 * @private
	 */
	StepNavigation.prototype._highlightStep = function(stepId) {
		var that = this;
		if (that.getVisible()) {
			var oSettings = that.getSettings();

			// Logic for connecting popup to step changed event
			var stepInfo = that.getStep(0, oSettings.currentProcedureIndex, stepId);
			if (!oSettings.currentProcedure) {
				oSettings.currentProcedure = that.oModel.oData.procedures[that.oSettings.currentProcedureIndex];
			}

			var oShowStepInfoButton = that.getShowStepInfoButton();

			// Placement refers to the Popup position in relation to the Step Description button .
			// It can be "Top" (default) or "Bottom" (in case there isn't enough room at the top.
			var placement;
			var stepDescriptionButton = document.getElementById(oShowStepInfoButton.getId());
			placement = that._getPopupPlacement(stepDescriptionButton);

			// oShowStepInfoButton.setText(title);
			if (that.getShowStepInfo()) {
				oSettings.stepInfo.openPopup.call(this, stepInfo.name, stepInfo.description, oShowStepInfoButton, placement);
			} else if (oSettings.stepInfo.stepMessagePopup && oSettings.stepInfo.stepMessagePopup.isOpen()) {
				oSettings.stepInfo.stepMessagePopup.close();
			}

			// Highlight the selected thumbnail
			if (that.getShowThumbnails()) {
				var oScroller = that.getScroller();
				var oThumbnailItems = oScroller.getContent()[0].getItems();
				for (var i = 0; i < oThumbnailItems.length; i++) {
					if (oThumbnailItems[i].getCustomData()[0].getValue("stepId") == stepId) {
						oThumbnailItems[i].addStyleClass("selected");
						if (that._isScrollingNecessary(oThumbnailItems[i].$()[0], jQuery("#" + oScroller.sId)[0])) {
							that._scrollToItem(oThumbnailItems[i].$()[0], jQuery("#" + oScroller.sId)[0]);
						}
					} else {
						oThumbnailItems[i].removeStyleClass("selected");
					}
				}
			}
		}
	};

	/**
	 * Returns the procedures list with steps for the current scene, and appends base64 data as thumbnailData and an
	 * image type as thumbnailType.
	 *
	 * @return {JSON} <this> For example:
	 * <code>{sceneId : string, hasThumbnails : boolean, "procedures" : [id:string, name: string, steps: [{id: string, name: string, thumnailData: string, thumbnailType: string}], "portfolios": [] }</code>
	 * @public
	 */
	StepNavigation.prototype.getProceduresAndSteps = function() {
		return this._getStepThumbnails();
	};

	/**
	 * Obtains the procedures and portfolios list for the current scene and appends base64 data as thumbnailData and an
	 * image type as thumbnailType.
	 *
	 * @return {JSON} procs
	 * @private
	 */
	StepNavigation.prototype._getStepThumbnails = function() {

		// This function gets passed as argument to forEach when we iterate
		// through all steps from all procedures and all portfolios.
		var processStepThumbnail = function(sceneId, dvl, step) {
			var thumbDataRaw,
				imgType,
				prefix;

			try {
				// Trying to retrieve the thumbnail image for this particular step from DVL
				thumbDataRaw = sap.ui.vk.dvl.getPointer(dvl.Scene.RetrieveThumbnail(sceneId, step.id));

				// Check the prefix to detect whether this is a PNG or JPG
				prefix = thumbDataRaw.substring(0, 3);
				if (prefix === "iVB") {
					imgType = "png";
				} else {
					imgType = "jpg";
				}

				// Mutating the original step object by assigning the thumbnail information
				// that we retrieved from DVL
				step.thumbnailData = thumbDataRaw;
				step.thumbnailType = imgType;
			} catch (error) {
				// If the code is NOTFOUND, it means the step doesn't have a thumbnail
				if (error.code !== sap.ve.dvl.DVLRESULT.NOTFOUND) {
					jQuery.sap.log.error(error.message, error.code, "sap.ui.vk.StepNavigation");
				}
				step.thumbnailData = null;
				step.thumbnailType = null;
			}
		};

		var procs = this._retrieveProcedures();
		if (procs.sceneId != null) {
			// Get thumbnails for procedures
			// Iterating through each step from each procedure
			procs.procedures.forEach(function(procedure) {
				procedure.steps.forEach(processStepThumbnail.bind(this, procs.sceneId, this.oDvl));
			}, this);

			// Get thumbnails for portfolios
			// Iterating through each step from each portfolio
			procs.portfolios.forEach(function(portfolio) {
				portfolio.steps.forEach(processStepThumbnail.bind(this, procs.sceneId, this.oDvl));
			}, this);

			procs.hasThumbnails = true;
		}
		this._procedures = procs;
		return procs;
	};

	/**
	 * Returns or retrieves the list of procedures and portfolios for the current scene.
	 *
	 * @param {string} sceneId ID of the scene from which to retrieve procedures and portfolios.
	 * @return {JSON} procs
	 * @private
	 */
	StepNavigation.prototype._retrieveProcedures = function(sceneId) {
		var that = this;
		var procs = {};
		if (!that._procedures) {
			procs = {
				sceneId: null,
				hasThumbnails: false,
				"procedures": [],
				"portfolios": []
			};
		} else {
			procs = that._procedures;
		}

		if (that._scene && (procs.sceneId != (sceneId || that._scene._dvlSceneRef))) {
			var s = sceneId || that._scene._dvlSceneRef;
			if (s != null) {
				procs = {
					sceneId: null,
					hasThumbnails: false,
					"procedures": [],
					"portfolios": []
				};
				try {
					var ps = sap.ui.vk.dvl.getJSONObject(that.oDvl.Scene.RetrieveProcedures(s));
					if (ps != null) {
						procs.hasThumbnails = false;
						procs.sceneId = that._scene._dvlSceneRef;
						procs.procedures = ps.procedures;
						procs.portfolios = ps.portfolios;
					}
				} catch (e) {
					if (!(e instanceof DvlException && e.code === sap.ve.dvl.DVLRESULT.NOTIMPLEMENTED)) {
						throw e;
					}
				}
			}
		}

		return procs;
	};

	/**
	 * Gets a step based on a positive or negative integer, which is used as an index relative to the index of the current step.
	 * An index value of <code>0</code> can be used to retrieve the details of the current step.
	 *
	 * @param {number}
	 *          relIndex Positive or negative integer representing the number to add or subtract from the index of the
	 *          current step to return the desired step; for example, //next 1, current 0, previous -1
	 * @param {number} [procedureIndex] Optional integer representing the index of the target procedure in the procedures list.
	 * @param {string} specificStepId The ID of the step that we want to retrieve.
	 * @return {JSON} step
	 * @public
	 */
	StepNavigation.prototype.getStep = function(relIndex, procedureIndex, specificStepId) {
		var that = this;
		var sc = that.oDvl.Settings.LastLoadedSceneId;
		var step = null;
		if (sc != null) {
			procedureIndex = procedureIndex != null ? procedureIndex : 0;
			var curs = specificStepId ? specificStepId : that.instanceSettings.currentStepId;
			var p = that._retrieveProcedures(sc);
			var curProc = p.procedures[procedureIndex];

			// If current or next step requested with no current step requested then return first
			if (curProc && curProc.steps.length > 0) {
				step = curProc.steps[0];
			} else {
				// If curProc is false, we the function returns null; it means there are no steps.
				// If we don't do this, curProc.steps will throw an exception
				return null;
			}

			if (curs != "") {
				// Look for the current step in the specified procedure return the requested relative step
				for (var si = 0; si < curProc.steps.length; si++) {
					var _s = curProc.steps[si];
					if (_s.id == curs) {
						var x = si + relIndex;
						if (x < curProc.steps.length && x >= 0) {
							step = curProc.steps[x];
						} else {
							step = null;
						}
						break;
					}
				}
			}
		}
		return step;
	};

	/**
	 * Pauses the step that is currently playing.
	 *
	 * @return {void}
	 * @public
	 */
	StepNavigation.prototype.pauseStep = function() {
		var that = this;
		var s = that.oDvl.Settings.LastLoadedSceneId;
		if (s != null) {
			that.oDvl.Scene.PauseCurrentStep(s);
		}
	};

	/**
	 * Gets the total number of steps for a specified procedure, or for all procedures.
	 *
	 * @param {string} [procedureId] An optional ID for a procedure for which to retrieve a count.
	 * If a value for <code>procedureId</code> is specified, then get a count of the steps for the specified procedure.
	 * Otherwise, get the total number of steps in all of the procedures for the Scene.
	 * @return {number} The number of steps for the specified procedure.
	 * @private
	 */
	StepNavigation.prototype._stepCount = function(procedureId) {
		var that = this;
		var sc = that.oDvl.Settings.LastLoadedSceneId;
		var stepCount = 0;
		if (sc != null) {
			var p = that._retrieveProcedures(sc);
			for (var pi = 0; pi < p.procedures.length; pi++) {
				if (p.procedures[pi].id == procedureId) {
					stepCount = p.procedures[pi].steps.length;
					break;
				} else if (procedureId == null) {
					stepCount += p.procedures[pi].steps.length;
				}
			}
		}
		return stepCount;
	};

	/**
	 * Cycles through steps and procedures for the last loaded scene (<code>lastLoadedScene</code>), and returns the step preceding the current step (currentStepId.
	 *
	 * @param {number} [procedureIndex] Optional integer representing the index of the target procedure in the procedures list.
	 * @return {JSON} The step preceding the current step.
	 * @public
	 */
	StepNavigation.prototype.getPreviousStep = function(procedureIndex) {
		var that = this;
		return that.getStep(-1, procedureIndex);
	};

	/**
	 * Cycles through steps and procedures for the lastLoadedScene and returns the step that follows after the currentStepId.
	 *
	 * @param {number} [procedureIndex] Optional integer representing the index of the target procedure in the procedures list.
	 * @return {JSON} The step that follows after the current step.
	 * @public
	 */
	StepNavigation.prototype.getNextStep = function(procedureIndex) {
		var that = this;
		return that.getStep(1, procedureIndex);
	};

	/**
	 * Plays the specified procedure step.
	 *
	 * @param {string} stepId The ID of the procedure step to play.
	 * @param {boolean} fromTheBeginning Default: true If <code>true</code>, tells the Viewer to play the step from the first frame.
	 * @param {boolean} continueToTheNext Default: false If <code>true</code>, tells the Viewer to play the next step in sequence.
	 * @return {void}
	 * @public
	 */
	StepNavigation.prototype.playStep = function(stepId, fromTheBeginning, continueToTheNext) {
		var that = this;
		var s = that.oDvl.Settings.LastLoadedSceneId;
		if (s != null) {
			that.instanceSettings.currentStepId = stepId;

			// call ActivateStep(sceneId, dvlid, fromTheBeginning, continueToTheNext)
			that.oDvl.Scene.ActivateStep(s, stepId, fromTheBeginning != null ? fromTheBeginning : true,
				continueToTheNext != null ? continueToTheNext : false);
		}
	};

	/**
	 * Plays all the steps in the specified procedure.
	 *
	 * @param {string} [procedureId] The ID of the procedure for which to play all steps. If <code>procedureId == null</code>, then only the first step is played.
	 * @return {void}
	 * @public
	 */
	StepNavigation.prototype.playAllSteps = function(procedureId) {
		var that = this;
		var sc = that.oDvl.Settings.LastLoadedSceneId;
		if (sc != null) {
			var ps = that._retrieveProcedures(sc);
			var procedureIndex = 0;
			if (procedureId != null && ps.procedures.length > 1) {
				for (var ip = 0; ip < ps.procedures.length; ip++) {
					if (ps.procedures[ip].id == procedureId) {
						procedureIndex = ip;
						break;
					}
				}
			}

			if (ps.procedures.length > 0) {
				var s = ps.procedures[procedureIndex].steps[0];
				if (s) {
					that.instanceSettings.currentStepId = s.id;
					that.oDvl.Scene.ActivateStep(sc, s.id, true, true);
				}
			}
		}
	};

	////////////////////////////////////////////////////////////////////////
	// Content connector handling begins.

	StepNavigation.prototype._setContent = function(content) {
		var scene = null;
		if (content && content.scene instanceof sap.ui.vk.dvl.Scene) {
			scene = content.scene;
		}
		this.setScene(scene);
	};

	StepNavigation.prototype._onAfterUpdateContentConnector = function() {
		this._setContent(this._contentConnector.getContent());
	};

	StepNavigation.prototype._onBeforeClearContentConnector = function() {
		this.setScene(null);
	};

	StepNavigation.prototype._handleContentReplaced = function(event) {
		var content = event.getParameter("newContent");
		this._setContent(content);
	};

	// Content connector handling ends.
	////////////////////////////////////////////////////////////////////////

	ContentConnector.injectMethodsIntoClass(StepNavigation);

	return StepNavigation;

});
