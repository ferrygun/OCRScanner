/*global jQuery, sap, localStorage, window */

sap.ui.define([
	"sap/ushell/plugins/BaseRTAPlugin",
	"sap/m/MessageBox",
	"sap/ui/fl/Utils",
	"sap/ui/fl/EventHistory"
],
function(
	BaseRTAPlugin,
	MessageBox,
	FlexUtils,
	EventHistory
) {
	"use strict";

	var fnAdaptButtonVisilibity = function(sId, bVisible, oControl) {
		if (sId) {
			if (sap.ui.getCore().byId(sId)) {
				sap.ui.getCore().byId(sId).setVisible(bVisible);
			}
		} else if (oControl) {
			oControl.setVisible(bVisible);
		}
	};

	var RTAPlugin = BaseRTAPlugin.extend("sap.ushell.plugins.rta-personalize.Component", {
		sType: 'rta-personalize',

		metadata: {
			manifest: "json"
		},

		init: function () {
			var oConfig = {
				sComponentName: "sap.ushell.plugins.rta-personalize",
				layer: "USER",
				developerMode: false,
				id: "PERSONALIZE_Plugin_ActionButton",
				text: "PERSONALIZE_BUTTON_TEXT",
				icon: "sap-icon://edit",
				visible: false
			};

			BaseRTAPlugin.prototype.init.call(this, oConfig);

			this._aPersonalizableControls = [];
			this._aOriginalFooterVisibility = [];

			var fnAddPersonalizableControl = function(oControl) {
				if (this._aPersonalizableControls.indexOf(oControl) === -1) {
					this._aPersonalizableControls.push(oControl);
					fnAdaptButtonVisilibity("PERSONALIZE_Plugin_ActionButton", true);
				}
			}.bind(this);

			var fnRemovePersonalizableControl = function(oControl) {
				var iIndex = this._aPersonalizableControls.indexOf(oControl);
				this._aPersonalizableControls.splice(iIndex, 1);
				this._aOriginalFooterVisibility.splice(iIndex, 1);
				if (this._aPersonalizableControls.length === 0) {
					this._oObserver.disconnect();
					delete this._oObserver;
					fnAdaptButtonVisilibity("PERSONALIZE_Plugin_ActionButton", false);
				}
			}.bind(this);

			var fnOnPersonalizableControlRendered = function(sChannelId, sEventId, oControl){
				if (FlexUtils.checkControlId(oControl)) {
					fnAddPersonalizableControl(oControl);
					if (!this._oObserver) {
						this._oObserver = new MutationObserver(function(mutations) {
							this._aPersonalizableControls.forEach(function(oControl) {
								if (!oControl.getDomRef()) {
									fnRemovePersonalizableControl(oControl);
								}
							});
						}.bind(this));
						var oConfig = { attributes: true, childList: true, characterData: false, subtree : true, attributeFilter : ["style", "class"]};
						this._oObserver.observe(window.document, oConfig);
					}
				}
			}.bind(this);

			sap.ui.getCore().getEventBus().subscribe("sap.ui", "ControlForPersonalizationRendered", fnOnPersonalizableControlRendered, this);
			var aEvents = EventHistory.getHistoryAndStop("ControlForPersonalizationRendered");
			aEvents.forEach(function(oEvent) {
				fnOnPersonalizableControlRendered(oEvent.channelId, oEvent.eventId, oEvent.parameters);
			});
		},

		/**
		 * This function is called when the start event of RTA was fired
		 *
		 * @param {sap.ui.base.Event} oEvent the RTA start event
		 *
		 * @private
		 * @override
		 */
		_onStartHandler: function(oEvent) {
			var iEditablePlugins = oEvent.getParameter("editablePluginsCount");
			if (iEditablePlugins !== undefined && iEditablePlugins <= 0) {
				MessageBox.information(this.i18n.getText("MSG_STARTUP_NO_OVERLAYS"), {
					onClose: function() {
						this._stopRta(true);
					}.bind(this)
				});
			}

			var oViewPort = sap.ui.getCore().byId("viewPortContainer");
			oViewPort.attachAfterSwitchState(function(oData) {
				if (this._oRTA) {
					// Me Area opened
					if (oData.getParameter("to") === "LeftCenter") {
						this._oRTA.getToolbar().addStyleClass("sapUiRtaHideToolbar");
						this._oRTA.setMode("navigation");
					}
				}
			}.bind(this));

			oViewPort.attachAfterSwitchStateAnimationFinished(function(oData) {
				if (this._oRTA) {
					// Me Area closed
					if (oData.getParameter("to") === "Center") {
						this._oRTA.getToolbar().removeStyleClass("sapUiRtaHideToolbar");
						this._oRTA.setMode("adaptation");
					}
				}
			}.bind(this));
		},

		/**
		 * This function should be used when custom plugins are needed
		 *
		 * @param {sap.ui.rta.RuntimeAuthoring} oRTA Instance of RuntimeAuthoring
		 *
		 * @private
		 * @override
		 */
		_loadPlugins: function(oRTA) {

			// only require the needed plugins when RTA is started
			var oPromise = new Promise(function(resolve, reject) {
				sap.ui.require(["sap/ui/rta/plugin/EasyAdd", "sap/ui/rta/plugin/EasyRemove"], function(EasyAddPlugin, EasyRemovePlugin) {
					var mPlugins = oRTA.getDefaultPlugins();
					var oRemovePlugin = mPlugins["remove"];
					mPlugins["remove"] = new EasyRemovePlugin({
						commandFactory: oRemovePlugin.getCommandFactory()
					});

					var oAdditionalElementsPlugin = mPlugins["additionalElements"];
					mPlugins["additionalElements"] = new EasyAddPlugin({
						commandFactory: oAdditionalElementsPlugin.getCommandFactory(),
						analyzer: oAdditionalElementsPlugin.getAnalyzer(),
						dialog: oAdditionalElementsPlugin.getDialog()
					});

					oRTA.setPlugins(mPlugins);
					resolve();
				});
			});
			return oPromise;
		},

		/**
		 * Event handler for the "Adapt" button of the RTA FLP Plugin
		 *
		 * @param {sap.ui.base.Event} oEvent the button click event
		 *
		 * @private
		 * @override
		 */
		_onAdapt: function(oEvent) {
			if (oEvent.getSource().getText() === this.i18n.getText("PERSONALIZE_BUTTON_TEXT")) {
				oEvent.getSource().setText(this.i18n.getText("END_PERSONALIZE_BUTTON_TEXT"));

				fnAdaptButtonVisilibity("RTA_Plugin_ActionButton", false);

				// Store the original values for the Footer Visibility
				this._aPersonalizableControls.forEach(function(oControl) {
					if (oControl.setShowFooter) {
						this._aOriginalFooterVisibility.push(oControl.getShowFooter());
					} else {
						this._aOriginalFooterVisibility.push(undefined);
					}
				}.bind(this));

				this._adaptFooterVisibility(false);

				var oSearchButton = this._getFlpSearchButton();
				this._bOriginalSearchButtonVisibility = oSearchButton && oSearchButton.getVisible();
				if (this._bOriginalSearchButtonVisibility) {
					fnAdaptButtonVisilibity(false, false, oSearchButton);
				}

				BaseRTAPlugin.prototype._onAdapt.call(this, oEvent);
			} else {
				this._stopRta();
			}
		},

		/**
		 * Leaves the RTA adaption mode and destroys the RTA
		 *
		 * @private
		 * @override
		 */
		_switchToDefaultMode: function() {
			sap.ui.getCore().byId("PERSONALIZE_Plugin_ActionButton").setText(this.i18n.getText("PERSONALIZE_BUTTON_TEXT"));

			fnAdaptButtonVisilibity("RTA_Plugin_ActionButton", true);

			this._adaptFooterVisibility(true);

			if (this._bOriginalSearchButtonVisibility !== undefined) {
				fnAdaptButtonVisilibity(false, this._bOriginalSearchButtonVisibility, this._getFlpSearchButton());
				delete this._bOriginalSearchButtonVisibility;
			}

			sap.m.MessageToast.show(this.i18n.getText("SAVE_SUCCESSFUL"), {
				duration: 4000,
				offset: "0 -50"
			});

			BaseRTAPlugin.prototype._switchToDefaultMode.call(this);
		},

		/**
		 * Checks if RTA needs to be restarted, e.g after 'Reset to default'
		 *
		 * @private
		 * @override
		 */
		_checkRestartRTA: function() {
		},

		/**
		 * Sets the Footer visibility of the personalizable Controls
		 *
		 * @param {boolean} bVisible new visibility of the Footer
		 *
		 * @private
		 */
		_adaptFooterVisibility: function(bVisible) {
			this._aPersonalizableControls.forEach(function(oControl, iIndex) {
				if (this._aOriginalFooterVisibility[iIndex]) {
					oControl.setShowFooter(bVisible);
				}
			}.bind(this));
		},

		_getFlpSearchButton: function() {
			return this.oRenderer.getRootControl().getOUnifiedShell().getHeader().getHeadEndItems()[0];
		}
	});

	return RTAPlugin;

}, /* bExport= */true);