sap.ui.define(["jquery.sap.global", "sap/ui/base/Object",
		"sap/suite/ui/generic/template/ListReport/extensionAPI/NonDraftTransactionController",
		"sap/suite/ui/generic/template/extensionAPI/NavigationController"	],
	function(jQuery, BaseObject, NonDraftTransactionController, NavigationController) {
		"use strict";
		/**
		 * API to be used in extensions of ListReport. Breakout coding can access an instance of this class via
		 * <code>this.extensionAPI</code>. Do not instantiate yourself.
		 * @class
		 * @name sap.suite.ui.generic.template.ListReport.extensionAPI.ExtensionAPI
		 * @public
		 */

		function getMethods(oTemplateUtils, oController, oState) {
			var oTransactionController;
			var oNavigationController;
			return /** @lends sap.suite.ui.generic.template.ListReport.extensionAPI.ExtensionAPI.prototype */ {
				/**
				 * Get the list entries currently selected
				 * 
				 * @return {sap.ui.model.Context[]} contains one entry per line selected
				 * @public
				 */
				getSelectedContexts: function() {
					return oTemplateUtils.oCommonUtils.getSelectedContexts(oState.oSmartTable);
				},
				/**
				 * Get the transaction controller for editing actions on the list. Note: Currently implemented for non draft case
				 * 
				 * @return {sap.suite.ui.generic.template.ListReport.extensionAPI.NonDraftTransactionController} the transaction controller
				 * @public
				 */
				getTransactionController: function() {
					if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
						throw new Error("Transaction support on ListReport for draft case not implemented yet");
					}
					oTransactionController = oTransactionController ||
						new NonDraftTransactionController(oTemplateUtils, oController, oState);
					return oTransactionController;
				},
				/**
				 * Triggers rebinding on the list
				 * 
				 * @public
				 */
				rebindTable: function(){
					oState.oSmartTable.rebindTable();
				},
				/**
				 * Refreshes the List from the backend
				 * 
				 * @public
				 */
				refreshTable: function() {
					oTemplateUtils.oCommonUtils.refreshModel(oState.oSmartTable);
					oTemplateUtils.oCommonUtils.refreshSmartTable(oState.oSmartTable);
				},
				/**
				 * Attaches a control to the current View. Should be called whenever a new control is created and used in the
				 * context of this view. This applies especially for dialogs, action sheets, popovers, ... This method cares for
				 * defining dependency and handling device specific style classes
				 * 
				 * @param {sap.ui.core.Control} oControl the control to be attached to the view
				 * @public
				 */
				attachToView: function(oControl) {
					oTemplateUtils.oCommonUtils.attachControlToView(oControl);
				},
				/**
				 * Invokes multiple time the action with the given name and submits changes to the back-end.
				 *
				 * @param {string} sFunctionName The name of the function or action
				 * @param {array|sap.ui.model.Context} vContext The given binding contexts
				 * @param {map} [mUrlParameters] The URL parameters (name-value pairs) for the function or action
				 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the action
				 * @throws {Error} Throws an error if the OData function import does not exist or the action input parameters are invalid
				 * @public
				 */
				invokeActions: function(sFunctionName, vContext, mUrlParameters) {
					var aContext, mParameters;
					if (!vContext) {
						aContext = [];
					} else if (vContext instanceof sap.ui.model.Context) {
						aContext = [ vContext ];
					} else {
						aContext = vContext;
					}
					if (mUrlParameters) {
						mParameters = {
							urlParameters: mUrlParameters
						};
					}
					if (oState.oSmartTable) {
						oState.oSmartTable.getTable().attachEventOnce("updateFinished", function () {
							oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oState.oSmartTable);
							oTemplateUtils.oCommonUtils.setEnabledFooterButtons(oState.oSmartTable);
						});
					}
					return oTemplateUtils.oServices.oApplicationController.invokeActions(sFunctionName, aContext, mParameters);
				},
				/**
				 * Get the navigation controller for navigation actions
				 *
				 * @return {sap.suite.ui.generic.template.extensionAPI.NavigationController} the navigation controller
				 * @public
				 */
				getNavigationController: function() {
					if (!oNavigationController) {
						oNavigationController = new NavigationController(oTemplateUtils, oController, oState);
					}
					return oNavigationController;
				},
				/**
				 * @experimental
				 */
				getCommunicationObject: function(iLevel){
					return oTemplateUtils.oComponentUtils.getCommunicationObject(iLevel);	
				},
				/**
				 * Secured execution of the given function. Ensures that the function is only executed when certain conditions
				 * are fulfilled.
				 *
				 * @param {function} fnFunction The function to be executed. Should return a promise that is settled after completion 
				 * of the execution. If nothing is returned, immediate completion is assumed.
				 * @param {object} [mParameters] Parameters to define the preconditions to be checked before execution
				 * @param {boolean} [mParameters.busy.set=true] Triggers a busy indication during function execution. Can be set to 
				 * false in case of immediate completion
				 * @param {boolean} [mParameters.busy.check=true] Checks whether the application is currently busy. Function is only 
				 * executed if not. Has to be set to false, if function is not triggered by direct user interaction, but as result of 
				 * another function, that set the application busy 
				 * @param {boolean} [mParameters.dataloss.popup=true] Provides a dataloss popup before execution of the function if 
				 * needed (i.e. in non-draft case when model or registered methods contain pending changes)
				 * @param {boolean} [mParameters.dataloss.navigation=false] Indicates that execution of the function leads to a navigation, 
				 * i.e. leaves the current page, which induces a slightly different text for the dataloss popup
				 *@param {map} [mParameters.mConsiderObjectsAsDeleted] Tells the framework that objects will be deleted by <code>fnFunction</code>.
				 * Use the BindingContextPath as a key for the map. Fill the map with a <code>Promise</code> for each object which is to be deleted.
				 * The <code>Promise</code> must resolve after the deletion of the corresponding object or reject if the deletion is not successful.
				 * @returns {Promise} A <code>Promise</code> that is rejected, if execution is prohibited, and settled equivalent to the one returned by fnFunction
				 * @public
				 * @experimental 
				 */
				securedExecution: function(fnFunction, mParameters) {
					return oTemplateUtils.oCommonUtils.securedExecution(fnFunction, mParameters, oState);
				},
				/**
				 * If switching between different table views is enabled, this function returns the selected key.
				 *
				 * @returns {string} The key of the variant item that is currently selected. 
				 * @public
				 * @experimental
				 */
				getQuickVariantSelectionKey: function() {
					return oState.oMultipleViewsHandler.getVariantSelectionKey();
				},

				/**
				 * This method should be called when any custom ui state handled by the get/restoreCustomAppStateDataExtension-methods changes.
				 * Note that changes applied to custom filters need not to be propagated this way, since the change event of the SmartFilterBar 
				 * will automatically be handled by the smart template framework.
				 * @public
				 */				
				onCustomAppStateChange: function(){
					var bDataAreShown = oState.oIappStateHandler.areDataShownInTable();
					oState.oIappStateHandler.changeIappState(true, bDataAreShown);
				}
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.ListReport.extensionAPI.ExtensionAPI", {
			constructor: function(oTemplateUtils, oController, oState) {
				jQuery.extend(this, getMethods(oTemplateUtils, oController, oState));

			}
		});
	});