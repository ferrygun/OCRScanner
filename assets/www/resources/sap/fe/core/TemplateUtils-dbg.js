/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/fe/controller/ActionController",
	"sap/fe/controller/NavigationController",
	"sap/fe/core/MessageUtils",
	"sap/fe/core/CommonUtils"
], function (jQuery, BaseObject, ActionController, NavigationController, MessageUtils, CommonUtils) {
	"use strict";

	function getMethods(oComponentRegistry, oTemplateContract) {

		function getMessageUtils() {
			if (!oTemplateContract.oMessageUtils) {
				oTemplateContract.oMessageUtils = new MessageUtils(this);
			}

			return oTemplateContract.oMessageUtils;
		}

		function getActionController() {
			if (!oTemplateContract.oActionController) {
				oTemplateContract.oActionController = new ActionController(this);
			}

			return oTemplateContract.oActionController;
		}

		function getNavigationController() {
			if (!oTemplateContract.oNavigationController) {
				oTemplateContract.oNavigationController = new NavigationController(oTemplateContract, this);
			}

			return oTemplateContract.oNavigationController;
		}

		function getCommonUtils() {
			if (!oTemplateContract.oCommonUtils) {
				oTemplateContract.oCommonUtils = new CommonUtils(this);
			}

			return oTemplateContract.oCommonUtils;
		}

		function getText(sTextId, parameters) {
			var aReplacementParameters;
			if (parameters){
				aReplacementParameters = parameters.constructor === Array ? parameters : [parameters];
			}

			var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.fe");
			return oResourceBundle.getText(sTextId, aReplacementParameters);
		}

		/* App State methods might be moved to an AppStateController */
		function getAppStateContainer(oView) {
				var sContainer = oTemplateContract.oAppStateModel.getProperty("/" + oView.getId());

			if (sContainer) {
				return JSON.parse(sContainer);
			}
		}

		function setAppStateContainer(oData) {
			oTemplateContract.oAppStateModel.setProperty("/" + oComponentRegistry.oController.getView().getId(), JSON.stringify(oData));

			var oAppStateData = oTemplateContract.oAppStateModel.getProperty("/");
			oTemplateContract.oAppState = sap.ushell.Container.getService("CrossApplicationNavigation").createEmptyAppState(oTemplateContract.oAppComponent);

			// we keep it simple now as we know we need to navigate to rootWithAppState but will be more complex in future as we need to know the target route
			oTemplateContract.oAppComponent.getRouter().navTo("rootWithAppState", {iAppState: oTemplateContract.oAppState.getKey()}, true);

			oTemplateContract.oAppState.setData(oAppStateData);
			oTemplateContract.oAppState.save().fail(function () {
				// what shall we do now?
			});
		}

		function attachAppStateChanged(fn) {
			oTemplateContract.aAppStateChangedListener.push(fn);
		}

		function detachAppStateChanged(fn) {
			for (var i = 0; i < oTemplateContract.aAppStateChangedListener.length; i++){
				if (oTemplateContract.aAppStateChangedListener[i] === fn){
					oTemplateContract.aAppStateChangedListener.splice(i, 1);
				}
			}
		}

		return {
			getText: getText,
			getActionController: getActionController,
			getNavigationController: getNavigationController,
			getMessageUtils: getMessageUtils,
			getCommonUtils: getCommonUtils,
			getBusyHelper: function () {
				return oTemplateContract.oBusyHelper;
			},
			getAppStateContainer: getAppStateContainer,
			setAppStateContainer: setAppStateContainer,
			attachAppStateChanged: attachAppStateChanged,
			detachAppStateChanged: detachAppStateChanged,
			getAppStateLoaded: function () {
				return oTemplateContract.oInnerAppStatePromise;
			}
		};
	}

	return BaseObject.extend("sap.fe.core.TemplateUtils.js", {
		constructor: function (oComponentRegistry, oTemplateContract) {
			jQuery.extend(this, getMethods(oComponentRegistry, oTemplateContract));
		}
	});
});
