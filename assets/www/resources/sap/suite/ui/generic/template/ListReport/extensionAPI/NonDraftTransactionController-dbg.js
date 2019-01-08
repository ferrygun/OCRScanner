sap.ui.define(["jquery.sap.global", "sap/ui/base/Object"], function(jQuery, BaseObject) {
	"use strict";
	/**
	 * Non draft transaction controller to be used in extensions of ListReport. Breakout coding can access an instance of
	 * this class via <code>ExtensionAPI.getTransactionController</code>. Do not instantiate yourself.
	 * 
	 * Note: Only one object can be edited at a given point in time.
	 * 
	 * @class
	 * @name sap.suite.ui.generic.template.ListReport.extensionAPI.NonDraftTransactionController
	 * @public
	 */

	function getMethods(oTemplateUtils, oController, oState) {
		var sEditingStatus = "none";

		function fnEditFinished() {
			sEditingStatus = "none";
		}

		return /** @lends sap.suite.ui.generic.template.ListReport.extensionAPI.NonDraftTransactionController.prototype */ {
			/**
			 * Start editing one list entry
			 * 
			 * @param {sap.ui.model.Context} oContext the context identifying the entry to be edited
			 * @public
			 */
			edit: function(oContext) {
				if (!oContext) {
					throw new Error("Nothing to edit provided");
				}
				if (sEditingStatus !== "none") {
					throw new Error("Attempt to edit multiple contexts (" + oContext + ")");
				}
				if (oController.getView().getModel().hasPendingChanges()) {
					throw new Error("Attempt to edit while already pending changes exist");
				}
				sEditingStatus = "editing";
			},
			/**
			 * Cancel editing
			 * 
			 * @public
			 */
			cancel: function() {
				if (sEditingStatus !== "editing") {
					throw new Error("Nothing edited");
				}
				oTemplateUtils.oServices.oTransactionController.resetChanges();
				fnEditFinished();
			},
			/**
			 * Save the changes which have been applied to the OData model. Sets the application busy during execution 
			 * and doesn't execute if application is already busy when called (i.e. don't use <code>ExtensionAPI.securedExecution</code>
			 * to call this method).
			 * 
			 * @return {Promise} is resolved when entry is successfully saved and rejected when saving fails
			 * @public
			 */
			save: function() {
				
				var fnFunction = function() {
					if (sEditingStatus !== "editing") { throw new Error("Nothing edited"); }
					sEditingStatus = "saving";
					var oPromise = oTemplateUtils.oServices.oTransactionController.triggerSubmitChanges();
					oPromise.then(fnEditFinished, function() {
						sEditingStatus = "editing";
					});
					return oPromise;
				};

				// set default values for parameters
				var mParameters = {};
				mParameters = jQuery.extend(true, {
					busy: {
						set: true,
						check: true
					},
					dataloss: {
						popup: false,
						navigation: false
					}
				}, mParameters);

				return oTemplateUtils.oCommonUtils.securedExecution(fnFunction, mParameters, oState);
			}
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ListReport.extensionAPI.NonDraftTransactionController", {
		constructor: function(oTemplateUtils, oController, oState) {
			jQuery.extend(this, getMethods(oTemplateUtils, oController, oState));

		}
	});
});