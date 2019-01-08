sap.ui.define(
	["jquery.sap.global", "sap/ui/base/Object", "sap/suite/ui/generic/template/extensionAPI/NavigationController"],
	function(jQuery, BaseObject, NavigationController) {
		"use strict";
		/**
		 * API to be used in extensions of Canvas. Breakout coding can access an instance of this class via
		 * <code>this.extensionAPI</code>. Do not instantiate yourself.
		 * @class
		 * @name sap.suite.ui.generic.template.Canvas.extensionAPI.ExtensionAPI
		 * @public
		 */

		function getMethods(oTemplateUtils, oController, oBase) {
			return /** @lends sap.suite.ui.generic.template.Canvas.extensionAPI.ExtensionAPI.prototype */ {
				/**
				 * Get the transaction controller for editing actions on the page.
				 * Note that the methods provided by this transaction controller depend on whether the object supports drafts or not.
				 * @return {sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController|sap.suite.ui.generic.template.ObjectPage.extensionAPI.NonDraftTransactionController} 
				 * the transaction controller
				 * @public
				 * @function
				 */
				getTransactionController: oBase.extensionAPI.getTransactionControllerFunction(),
				/**
				 * Attaches a control to the current View. Should be called whenever a new control is created and used in the
				 * context of this view. This applies especially for dialogs, action sheets, popovers, ... This method cares
				 * for defining dependency and handling device specific style classes
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
					return oTemplateUtils.oServices.oApplicationController.invokeActions(sFunctionName, aContext, mParameters);
				},
				/**
				 * Attach a handler to the PageDataLoaded event.
				 * This event is fired each time the object page is navigated to or the object to be displayed is changed
				 * Note, that the event will not be fired before:
				 * <ul compact>
				 * <li>the navigation to the page has been completed
				 * <li>the header data of the object are available
				 * </ul>
				 * @param {function} fnFunction the handler function. Note that the event passed to this function possesses an attribute <code>context</code>
				 * which contains the current header context
				 * @public
				 */
				attachPageDataLoaded: function(fnFunction) {
					oTemplateUtils.oComponentUtils.attach(oController, "PageDataLoaded", fnFunction);
				},
				/**
				 * Detach a handler from the PageDataLoaded event
				 * 
				 * @param {function} fnFunction the handler function
				 * @public
				 */
				detachPageDataLoaded: function(fnFunction) {
					oTemplateUtils.oComponentUtils.detach(oController, "PageDataLoaded", fnFunction);
				},
				/**
				 * Registers a filter provider for the the message popover
				 * 
				 * @param {function} fnProviderCallback function which will be called each time a new context
				 * is set for the object page. The function should return an instance of sap.ui.model.Filter,
				 * an array of sap.ui.model.Filter or a Promise which resolves to one of these.
				 * @public
				 */
				registerMessageFilterProvider: function(fnProvider) {
					oBase.state.messageButtonHelper.registerMessageFilterProvider(fnProvider);
				},
				/**
				 * Get the navigation controller for navigation actions
				 *
				 * @return {sap.suite.ui.generic.template.extensionAPI.NavigationController} the navigation controller
				 * @public
				 * @function
				 */
				getNavigationController: oBase.extensionAPI.getNavigationControllerFunction(),
				/**
				 * @experimental
				 */
				getCommunicationObject: function(iLevel){
					return oTemplateUtils.oComponentUtils.getCommunicationObject(iLevel);	
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
				 * @returns {Promise} A <code>Promise</code> that is rejected, if execution is prohibited, and settled equivalent to the one returned by fnFunction
				 * @public
				 * @experimental 
				 */
				securedExecution: function(fnFunction, mParameters) {
					return oTemplateUtils.oCommonUtils.securedExecution(fnFunction, mParameters, oBase.state);
				},

				/**
				 * Can be used to add the standard footer bar for detail pages to this canvas page
				 * Note that the usage of the standard footer bar must have been switched on in the settings of the page
				 * @param oPage {sap.m.Page | sap.uxap.ObjectPageLayout} the page the standard footer bar should be set for
				 * @public
				 */				
				addFooterBarToPage: function(oPage){
					var oFooterBar = oController.byId("template::ObjectPage::FooterToolbar");
					if (oFooterBar){
						var oI18NModel = oController.getView().getModel("i18n");
						oFooterBar.setModel(oI18NModel, "i18n");
						oPage.setFooter(oFooterBar);
					}
				},
				
				/**
				 * @experimental
				 */
				getPaginatorButtons: function(){
					var oPaginatorButtons = oController.byId("template::UpAndDownNavigation");
					if (oPaginatorButtons){
						var oI18NModel = oController.getView().getModel("i18n");
						oPaginatorButtons.setModel(oI18NModel, "i18n");
						return oPaginatorButtons;
					}					
				}
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.Canvas.extensionAPI.ExtensionAPI", {
			constructor: function(oTemplateUtils, oController, oBase) {
				jQuery.extend(this, getMethods(oTemplateUtils, oController, oBase));

			}
		});
	});