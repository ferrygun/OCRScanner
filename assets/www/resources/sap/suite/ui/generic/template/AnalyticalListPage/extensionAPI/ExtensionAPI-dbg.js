sap.ui.define(["jquery.sap.global", "sap/ui/base/Object",
		"sap/suite/ui/generic/template/extensionAPI/NavigationController"],
		function(jQuery, BaseObject, NavigationController) {
	"use strict";
	/**
	 * API to be used in extensions of AnalyticalListPage. Breakout coding can access an instance of this class via
	 * <code>this.extensionAPI</code>. Do not instantiate yourself.
	 * @class
	 * @name sap.suite.ui.generic.template.AnalyticalListPage.extensionAPI.ExtensionAPI
	 * @public
	 */

	function getMethods(oTemplateUtils, oController, oState) {
		var oNavigationController;
		return /** @lends sap.suite.ui.generic.template.AnalyticalListPage.extensionAPI.ExtensionAPI.prototype */ {
			/**
			 * Get the list entries currently selected
			 * @param {string} sUiElementId the id identifying the ui element the selected context is requested for
			 * @return {sap.ui.model.Context[]} contains the entries selected
			 * @public
			 */
			getSelectedContexts: function(sUiElementId) {
				// Incase no ElementId is passed from the function call, we default oControl to smartTable and fetch the context of smartTable
				var oControl = oState.oSmartTable;
				if (sUiElementId) {
					oControl = oController.byId(sUiElementId);
				}
				return oTemplateUtils.oCommonUtils.getSelectedContexts(oControl);
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
			 * Refreshes the SmartTable
			 *
			 * @public
			 */
			refreshTable: function() {
				if (oState.oSmartTable) {
					//Filters from SmartChart should be considered by table
					oState.oController.getOwnerComponent().getModel("_templPriv").setProperty('/alp/_ignoreChartSelections', false);
					oTemplateUtils.oCommonUtils.refreshSmartTable(oState.oSmartTable);
				}
			},
			/**
			* Refreshes the SmartChart Binding
			*
			* @private
			*/
			_refreshChart: function() {
				// Rebind chart
				if (oState.oSmartChart && oState.oSmartChart.rebindChart) {
					oState.oSmartChart.rebindChart();
				}
			},
			/**
			* Refreshes chart Items in SmartVisualFilterBar
			*
			* @private
			*/
			_refreshFilters: function() {
				//Update Binding in chart Items in Smart Filter Bar
				if (oState.alr_visualFilterBar && oState.alr_visualFilterBar.updateVisualFilterBindings) {
					oState.alr_visualFilterBar.updateVisualFilterBindings(true);
				}
			},
			/**
			* Refreshes KPI tags
			*
			* @private
			*/
			_refreshKpi: function() {

				if (oState.oKpiTagContainer) {
					var aContent = oState.oKpiTagContainer.mAggregations.content;
					for (var i in aContent){
						if (aContent[i].getModelName && aContent[i].getModelName() === "kpi"){
							aContent[i]._firstTime = true;
							aContent[i].onBeforeRendering();
						}
					}
				}
			},
			/**
			* Refreshes All controls in ALP
			*
			* @public
			*/
			refresh: function() {
				this._refreshFilters();
				this._refreshChart();
				this.refreshTable();
				this._refreshKpi();
			},
			/**
			 * Attaches a control to the current View. Should be called whenever a new control is created and used in the
			 * context of this view. This applies especially for dialogs, action sheets, popovers, ... This method cares for
			 * defining dependency and handling device specific style classes
			 *
			 * @param {sap.ui.core.Control} oControl the control to be attached to the view
			 * @public
			 */
			attachToView: function(oControl){
				oTemplateUtils.oCommonUtils.attachControlToView(oControl);
			},
			/**
			 * TODO : Need to bring this to same level as LR
			 * Invokes multiple time the action with the given name and submits changes to the back-end.
			 *
			 * @param {string} sFunctionName The name of the function or action
			 * @param {array|sap.ui.model.Context} vContext The given binding contexts
			 * @param {map} [mUrlParameters] The URL parameters (name-value pairs) for the function or action
			 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the action
			 * @throws {Error} Throws an error if the OData function import does not exist or the action input parameters are invalid
			 */
			invokeActions: function(sFunctionName, vContext, mUrlParameters){
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
			 * Secured execution of the given function. Ensures that the function is only executed when certain conditions
			 * are fulfilled
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
			 * @param {map} [mParameters.mConsiderObjectsAsDeleted] Tells the framework that objects will be deleted by <code>fnFunction</code>.
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
			* This method should be called when any custom ui state handled by the getCustomAppStateDataExtension method changes.
			* Note that changes applied to custom filters need not to be propagated this way, since the change event of the SmartFilterBar 
			* will automatically be handled by the smart template framework.
			* @public
			*/
			onCustomAppStateChange: function(){
				oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
			}
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.extensionAPI.ExtensionAPI", {
		constructor: function(oTemplateUtils, oController, oState) {
			jQuery.extend(this, getMethods(oTemplateUtils, oController, oState));

		}
	});
});