
/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/comp/library', 'sap/ui/comp/personalization/Controller', 'sap/ui/comp/personalization/Util', './Util', 'sap/ui/comp/navpopover/flexibility/changes/AddLink', 'sap/ui/comp/navpopover/flexibility/changes/RemoveLink', 'sap/ui/fl/changeHandler/JsControlTreeModifier', './Factory'
], function(jQuery, CompLibrary, Controller, PersonalizationUtil, Util, AddLink, RemoveLink, JsControlTreeModifier, Factory) {
	"use strict";

	/**
	 * Runtime adaptation handler.
	 *
	 * @constructor
	 * @private
	 * @since 1.44.0
	 * @alias sap.ui.comp.navpopover.RTAHandler
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var RTAHandler = {};

	RTAHandler.isSettingsAvailable = function() {
		return !!Factory.getService("CrossApplicationNavigation");
	};

	RTAHandler.getStableElements = function(oNavigationPopoverHandler) {
		if (!oNavigationPopoverHandler || !(oNavigationPopoverHandler instanceof sap.ui.comp.navpopover.NavigationPopoverHandler)) {
			return null;
		}
		var sStableID = oNavigationPopoverHandler.getNavigationPopoverStableId();
		if (!sStableID) {
			return null;
		}
		var oAppComponent = oNavigationPopoverHandler._getAppComponent();
		if (!oAppComponent) {
			return null;
		}
		return [
			{
				id: sStableID,
				appComponent: oAppComponent
			}
		];
	};

	RTAHandler.execute = function(oNavigationPopoverHandler, fGetUnsavedChanges, sRtaStyleClass) {
		return new Promise(function(resolve, reject) {
			if (!oNavigationPopoverHandler || !(oNavigationPopoverHandler instanceof sap.ui.comp.navpopover.NavigationPopoverHandler)) {
				return reject(new Error("oNavigationPopoverHandler is not of supported type sap.ui.comp.navpopover.NavigationPopoverHandler"));
			}
			if (!oNavigationPopoverHandler.getNavigationPopoverStableId()) {
				return reject(new Error("StableId is not defined. SemanticObject=" + oNavigationPopoverHandler.getSemanticObject()));
			}
			var oAppComponent = oNavigationPopoverHandler._getAppComponent();
			if (!oAppComponent) {
				return reject(new Error("AppComponent is not defined. oControl=" + oNavigationPopoverHandler.getControl()));
			}

			oNavigationPopoverHandler._getNavigationContainer().then(function(oNavigationContainer) {
				var aAddedLinks = [];
				var aRemovedLinks = [];
				var fCallbackAfterClose = function(aChanges) {
					var aChangesOfAddedLinks = aChanges.filter(function(oMLink) {
						return oMLink.visible === true;
					});
					var aChangesOfRemovedLinks = aChanges.filter(function(oMLink) {
						return oMLink.visible === false;
					});
					aAddedLinks = RTAHandler._prepareResult(aChangesOfAddedLinks, sap.ui.comp.navpopover.ChangeHandlerType.addLink, oNavigationContainer.getId(), oAppComponent);
					aRemovedLinks = RTAHandler._prepareResult(aChangesOfRemovedLinks, sap.ui.comp.navpopover.ChangeHandlerType.removeLink, oNavigationContainer.getId(), oAppComponent);
				};
				// Apply saved changes by creating NavigationContainer

				// Apply unsaved changes to NavigationContainer
				RTAHandler._applyUnsavedChanges(fGetUnsavedChanges, oNavigationContainer, oAppComponent);

				oNavigationContainer.openSelectionDialog(true, false, fCallbackAfterClose, false, sRtaStyleClass).then(function() {
					oNavigationContainer.destroy();
					resolve(aAddedLinks.concat(aRemovedLinks));
				});
			});
		});
	};

	/**
	 * @private
	 */
	RTAHandler._prepareResult = function(aMLinks, sChangeType, sStableID, oAppComponent) {
		return aMLinks.map(function(oMLink) {
			return {
				selectorControl: {
					id: sStableID,
					controlType: "sap.ui.comp.navpopover.NavigationContainer",
					appComponent: oAppComponent
				},
				changeSpecificData: {
					changeType: sChangeType,
					content: oMLink
				}
			};
		});
	};

	/**
	 * @private
	 */
	RTAHandler._applyUnsavedChanges = function(fGetUnsavedChanges, oNavigationContainer, oAppComponent) {
		var aChanges = fGetUnsavedChanges(oNavigationContainer.getId(), [
			sap.ui.comp.navpopover.ChangeHandlerType.addLink, sap.ui.comp.navpopover.ChangeHandlerType.removeLink
		]);
		aChanges.forEach(function(oChange) {
			switch (oChange.getChangeType()) {
				case sap.ui.comp.navpopover.ChangeHandlerType.addLink:
					AddLink.applyChange(oChange, oNavigationContainer, {
						modifier: JsControlTreeModifier,
						appComponent: oAppComponent
					});
					break;
				case sap.ui.comp.navpopover.ChangeHandlerType.removeLink:
					RemoveLink.applyChange(oChange, oNavigationContainer, {
						modifier: JsControlTreeModifier,
						appComponent: oAppComponent
					});
					break;
			}
		});
	};

	return RTAHandler;
},
/* bExport= */true);
