/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// To avoid loading the fl lib in every case it is only "lazy"-loaded on lib level and loaded explicitly here:
sap.ui.getCore().loadLibrary('sap.ui.fl');

/**
 * Connector to layered repository (LRep) APIs.
 *
 * @alias sap.ui.comp.personalization.FlexConnector
 * @author SAP SE
 * @version 1.52.4
 * @private
 * @since 1.44.0
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */

sap.ui.define([
	'sap/ui/comp/library', 'sap/ui/comp/navpopover/flexibility/changes/AddLink', 'sap/ui/comp/navpopover/flexibility/changes/RemoveLink', 'sap/ui/fl/Utils', 'sap/ui/fl/FlexControllerFactory', 'sap/ui/fl/ChangePersistenceFactory'
], function(CompLibrary, AddLink, RemoveLink, FlUtil, FlexControllerFactory, ChangePersistenceFactory) {
	"use strict";

	var FlexConnector = {

		/**
		 * Returns the Component that belongs to given control whose type is "application". If the control has no component, it walks up the control
		 * tree in order to find a control having one.
		 *
		 * @param {sap.ui.core.Control} oControl Control for which changes will be applied
		 * @returns {sap.ui.base.Component} Component
		 * @private
		 */
		getAppComponentForControl: function(oControl) {
			return FlUtil.getAppComponentForControl(oControl);
		},

		/**
		 * Indicates if the VENDOR layer is selected.
		 *
		 * @returns {Boolean} true if it's a VENDOR layer
		 * @private
		 */
		isVendorLayer: function() {
			return FlUtil.isVendorLayer();
		},

		/**
		 * Creates flexibility changes for <code>oMLinks</code> and also saves them in the USER layer.
		 *
		 * @param {object[]} aMAddedLinks Array of objects in format:
		 *
		 * <pre>
		 * [{key: {string}, visible: {boolean}}]
		 * </pre>
		 *
		 * @param {object[]} aMRemovedLinks Array of objects in format:
		 *
		 * <pre>
		 * [{key: {string}, visible: {boolean}}]
		 * </pre>
		 *
		 * @param {sap.ui.core.Control} oControl Control for which changes will be applied
		 * @returns {Promise} A <code>Promise</code> for asynchronous execution
		 * @private
		 */
		createAndSaveChangesForControl: function(aMAddedLinks, aMRemovedLinks, oControl) {
			if (!aMAddedLinks.length && !aMRemovedLinks.length) {
				return Promise.resolve();
			}
			this.createChangesForControl(aMRemovedLinks, oControl, sap.ui.comp.navpopover.ChangeHandlerType.removeLink);
			this.createChangesForControl(aMAddedLinks, oControl, sap.ui.comp.navpopover.ChangeHandlerType.addLink);

			return this.saveChangesForControl(oControl);
		},

		/**
		 * Creates flexibility change for each element of <code>aMLinks</code> array with the <code>sChangeType</code> change type for
		 * <code>oControl</code> in the USER layer.
		 *
		 * @param {object[]} aMLinks Array of objects of format {key: {string}, visible: {boolean}, index: {integer}}
		 * @param {sap.ui.core.Control} oControl Control for which changes will be applied
		 * @param {string} sChangeType Registered type of ChangeHandler in sap.ui.comp.library.js
		 * @private
		 */
		createChangesForControl: function(aMLinks, oControl, sChangeType) {
			if (!aMLinks.length) {
				return;
			}
			if (!sChangeType) {
				throw new Error("sChangeType should be filled");
			}
			var oFlexController = FlexControllerFactory.createForControl(oControl);
			aMLinks.forEach(function(oMLink) {
				oFlexController.createAndApplyChange({
					changeType: sChangeType,
					content: oMLink,
					isUserDependent: true
				}, oControl);
			});
		},

		/**
		 * Saves all flexibility changes.
		 *
		 * @param {sap.ui.core.Control} oControl Control for which changes will be applied
		 * @returns {Promise} A <code>Promise</code> for asynchronous execution
		 * @private
		 */
		saveChangesForControl: function(oControl) {
			return FlexControllerFactory.createForControl(oControl).saveAll();
			// return new Promise(function(resolve, reject) {
			// 	setTimeout(function() {
			// 		FlexControllerFactory.createForControl(oControl).saveAll().then(function() {
			// 			return resolve();
			// 		})['catch'](function(oError) {
			// 			return reject(oError);
			// 		});
			// 		// return reject({
			// 		// 	status: "Dummy save"
			// 		// });
			// 	}, 5000);
			// });
		},

		/**
		 * Reads flexibility changes for the <code>sStableID</code>.
		 *
		 * @param {string} sStableID Stable ID for which changes will be read
		 * @param {sap.ui.core.Control} oControl Control for which changes will be applied
		 * @returns {object[]} Array, empty array if no changes exist
		 * @private
		 */
		readChangesForControl: function(sStableID, oControl) {
			var oAppComponent = this.getAppComponentForControl(oControl);
			var sComponentName = FlUtil.getFlexReference(oAppComponent.getManifestObject());
			var oMapOfChanges = ChangePersistenceFactory.getChangePersistenceForComponent(sComponentName).getChangesMapForComponent();
			return oMapOfChanges.mChanges[sStableID] ? oMapOfChanges.mChanges[sStableID] : [];
		},

		/**
		 * Discards flexibility changes.
		 *
		 * @param {sap.ui.core.Control} oControl Control for which changes will be discarded
		 * @param {boolean} bDiscardPersonalization If <code>true</code> changes of end-user will be discarded
		 * @returns {Promise} A <code>Promise</code> for asynchronous execution
		 * @private
		 */
		discardChangesForControl: function(oControl, bDiscardPersonalization) {
			// return Promise.reject("Dummy discard");
			return FlexControllerFactory.createForControl(oControl).discardChangesForId(oControl.getId(), bDiscardPersonalization).then(function() {
				if (bDiscardPersonalization) {
					AddLink.discardChangesOfLayer("USER", oControl);
					RemoveLink.discardChangesOfLayer("USER", oControl);
				}
			});
		},

		// ---------------------------------------------------------------------------------------------

		/**
		 * Activates a channel in order to collect statistics about flexibility changes which will be applied after the channel has been activated.
		 *
		 * @private
		 */
		activateApplyChangeStatistics: function() {
			var that = this;
			this.aStatistics = [];
			var fWriteStatistics = function(oChange, oNavigationPopover) {
				if (that.aStatistics.findIndex(function(oStatistic) {
					return oStatistic.stableId === oNavigationPopover.getId() && oStatistic.changeId === oChange.getId();
				}) < 0) {
					var oAvailableAction = oNavigationPopover.getAvailableActions().find(function(oAvailableAction_) {
						return oAvailableAction_.getKey() === oChange.getContent().key;
					});
					that.aStatistics.push({
						stableId: oNavigationPopover.getId(),
						changeId: oChange.getId(),
						layer: oChange.getLayer(),
						key: oChange.getContent().key,
						text: oAvailableAction ? oAvailableAction.getText() : '',
						changeType: oChange.getChangeType()
					});
				}
			};

			var fDiscardFromStatistics = function(sLayer) {
				that.aStatistics = that.aStatistics.filter(function(oStatistic) {
					return oStatistic.layer !== sLayer;
				});
			};

			// Monkey patch AddLink.applyChange
			var fAddLinkApplyChangeOrigin = AddLink.applyChange.bind(AddLink);
			AddLink.applyChange = function(oChange, oNavigationPopover, mPropertyBag) {
				fWriteStatistics(oChange, oNavigationPopover);
				fAddLinkApplyChangeOrigin(oChange, oNavigationPopover, mPropertyBag);
			};

			// Monkey patch RemoveLink.applyChange
			var fRemoveLinkApplyChangeOrigin = RemoveLink.applyChange.bind(RemoveLink);
			RemoveLink.applyChange = function(oChange, oNavigationPopover, mPropertyBag) {
				fWriteStatistics(oChange, oNavigationPopover);
				fRemoveLinkApplyChangeOrigin(oChange, oNavigationPopover, mPropertyBag);
			};

			// Monkey patch AddLink.discardChangesOfLayer
			var fAddLinkDiscardChangesOfLayerOrigin = AddLink.discardChangesOfLayer.bind(AddLink);
			AddLink.discardChangesOfLayer = function(sLayer, oNavigationPopover) {
				fDiscardFromStatistics(sLayer);
				fAddLinkDiscardChangesOfLayerOrigin(sLayer, oNavigationPopover);
			};

			// Monkey patch RemoveLink.discardChangesOfLayer
			var fRemoveLinkDiscardChangesOfLayerOrigin = RemoveLink.discardChangesOfLayer.bind(RemoveLink);
			RemoveLink.discardChangesOfLayer = function(sLayer, oNavigationPopover) {
				fDiscardFromStatistics(sLayer);
				fRemoveLinkDiscardChangesOfLayerOrigin(sLayer, oNavigationPopover);
			};
		},

		_formatStatistic: function(oStatistic) {
			var sLayer = oStatistic.layer;
			switch (oStatistic.layer) {
				case "VENDOR":
					sLayer = "" + sLayer;
					break;
				case "CUSTOMER":
					sLayer = "        " + sLayer;
					break;
				case "USER":
					sLayer = "                " + sLayer;
					break;
				default:
					sLayer = "" + sLayer;
			}
			var sValue;
			switch (oStatistic.changeType) {
				case sap.ui.comp.navpopover.ChangeHandlerType.addLink:
					sValue = "On";
					break;
				case sap.ui.comp.navpopover.ChangeHandlerType.removeLink:
					sValue = "Off";
					break;
				default:
					sValue = "";
			}
			return {
				formattedLayer: sLayer,
				formattedValue: sValue
			};
		},

		/**
		 * Shows statistics for all applied links in console collected since the activation has been started.
		 *
		 * @private
		 */
		printStatisticAll: function() {
			if (!this.aStatistics) {
				jQuery.sap.log.info("Please activate with sap.ui.comp.navpopover.FlexConnector.activateApplyChangeStatistics()");
				return;
			}
			var that = this;
			jQuery.sap.log.info("idx - VENDOR ------------ CUSTOMER ----------- USER --------------------------------------");
			this.aStatistics.forEach(function(oStatistic, iIndex) {
				var oFormattedStatistic = that._formatStatistic(oStatistic);
				jQuery.sap.log.info(iIndex + " " + oStatistic.stableId + " " + oFormattedStatistic.formattedLayer + " '" + oStatistic.text + "' " + oFormattedStatistic.formattedValue);
			});
		}
	};
	return FlexConnector;
}, /* bExport= */true);
