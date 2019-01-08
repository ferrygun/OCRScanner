/* Class containing static methods for message handling. */
sap.ui.define(["sap/ui/generic/app/util/ModelUtil", "sap/ui/generic/app/util/MessageUtil", "sap/m/MessageBox"
	],
	function(ModelUtil, GenericMessageUtil, MessageBox) {
		"use strict";

		/**
		 * Logger for this class.
		 *
		 * @type {jQuery.sap.log.Logger}
		 * @static
		 * @private
		 * @ignore
		 */
		var oLogger = new jQuery.sap.log.getLogger("sap.suite.ui.generic.template.lib.MessageUtils");

		/**
		 * Handles errors for all of Smart Templates.
		 *
		 * @param {string} sOperation - String defined by the object sap.ui.generic.app.util.MessageUtil.operations.
		 * @param {sap.ui.core.mvc.Controller} oController - Controller instance of the calling function.
		 * @param {object} oServices - Object containing instances of the calling template's services.
		 * @param {object} oError - Error object fired by a variety of classes.
		 * @param {map} mParameters - Additional parameters that can be of use while handling an error.
		 * @private
		 * @ignore
		 */
		function fnHandleError(sOperation, oController, oServices, oError, mParameters) {
			mParameters = mParameters || {};

			var oErrorResponse = GenericMessageUtil.parseErrorResponse(oError);
			var sMessageText = oErrorResponse.messageText;
			var sMessageDescription;
			var bNavigateToMessagePage = false;

			// This tells this function not to add the
			// transient message at the end. I do this because
			// in the only case where the message popover is shown,
			// the ODataModel has already added the message to the
			// MessageManager's set of messages, and doesn't need to be
			// repeated by calling the GenericMessageUtil.addTransientErrorMessage
			// method at the end of the function.
			var bShowMessagePopover = false;
			var oComponent = oController && oController.getOwnerComponent();
			var oResourceBundle = mParameters.resourceBundle || oComponent.getModel("i18n").getResourceBundle();
			var oNavigationController = mParameters.navigationController || oServices.oNavigationController;
			var oModel = mParameters.model || oComponent.getModel();

			oLogger.debug("handleError has been called with operation " + sOperation + " and HTTP response status code " + oErrorResponse.httpStatusCode);
			switch (oErrorResponse.httpStatusCode) {
				case "400":
					switch (sOperation) {
						case GenericMessageUtil.operations.modifyEntity:
							// if a draft patch failed with a 400 we rely on a meaningful message from the backend
							break;
						case GenericMessageUtil.operations.callAction:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST_ACTION");
							break;
						case GenericMessageUtil.operations.deleteEntity:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST_DELETE");
							break;
						case GenericMessageUtil.operations.editEntity:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST_EDIT");
							break;
						case GenericMessageUtil.operations.saveEntity:
						case GenericMessageUtil.operations.activateDraftEntity:
							if (oServices &&
									oServices.oTemplateCapabilities &&
									oServices.oTemplateCapabilities.oMessageButtonHelper &&
									oServices.oTemplateCapabilities.oMessageButtonHelper.showMessagePopover) {
								oServices.oTemplateCapabilities.oMessageButtonHelper.showMessagePopover();
								bShowMessagePopover = true;
							} else {
								oLogger.info("A MessageButtonHelper class instance could not be found as one of the services' template capabilities.");
							}
							break;
						default:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST");
							break;
					}
					break;
				case "401":
					bNavigateToMessagePage = true;
					sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_AUTHENTICATED_FAILED");
					sMessageDescription = oResourceBundle.getText("ST_GENERIC_ERROR_AUTHENTICATED_FAILED_DESC");
					break;
				case "403":
					switch (sOperation) {
						case GenericMessageUtil.operations.callAction:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_ACTION");
							break;
						case GenericMessageUtil.operations.deleteEntity:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_DELETE");
							break;
						case GenericMessageUtil.operations.editEntity:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_EDIT");
							break;
						default:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED");
							sMessageDescription = oResourceBundle.getText("ST_GENERIC_ERROR_NOT_AUTORIZED_DESC");
							bNavigateToMessagePage = true;
							break;
					}
					break;
				case "404":
					switch (sOperation) {
						case GenericMessageUtil.operations.callAction:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST_ACTION");
							break;
						default:
							sMessageText = oResourceBundle.getText("ST_GENERIC_BAD_REQUEST");
							break;
					}
					break;
				case "409":
				case "412":
					// Conflict, we show the message returned from the backend in a dialog
					break;
				case "500":
				case "501":
				case "502":
				case "503":
				case "504":
				case "505":
					bNavigateToMessagePage = true;
					switch (sOperation) {
						case GenericMessageUtil.operations.callAction:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE_FOR_ACTION");
							break;
						default:
							sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE");
							break;
					}
					sMessageDescription = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE_DESC");
					break;
				case undefined:
					/*adapted to have a reasonable processing for the Apply-Button -
					 * workaround to not leave the page in case of apply */
					bNavigateToMessagePage = false;
					bShowMessagePopover = true;
					break;
				default:
					// Even though the HTTP protocol doesn't specify status codes outside
					// of what is handled in this switch statement, the Checkmarx code scan
					// picks up a missing default case as problematic. This default case
					// is added here for the sake of the Checkmarx scan.
					bNavigateToMessagePage = true;
					sMessageText = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE");
					sMessageDescription = oResourceBundle.getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE_DESC");
					break;
			}

			if (bNavigateToMessagePage) {
				var iViewLevel;
				if (oComponent){
					var oTemplPrivModel = oComponent.getModel("_templPriv");
					iViewLevel = oTemplPrivModel.getProperty("/generic/viewLevel");
				}
				// TODO: we shall remove the transient messages as they might come up later
				oNavigationController.navigateToMessagePage({
					title: oResourceBundle.getText("ST_GENERIC_ERROR_TITLE"),
					text: sMessageText,
					description: sMessageDescription,
					icon: "sap-icon://message-error",
					viewLevel: iViewLevel
				});
			} else {
				// When bShowMessagePopover is true we open the message popover and expect that the service returned either
				// state or transient messages, in case it's false and there's no transient message returned from
				// the backend we add our generic message as transient message
				if (!oErrorResponse.containsTransientMessage && !bShowMessagePopover) {
					GenericMessageUtil.addTransientErrorMessage(sMessageText, sMessageDescription, oModel);
				}
			}
		}

		return {
			operations: GenericMessageUtil.operations,
			handleTransientMessages: GenericMessageUtil.handleTransientMessages,
			handleError: fnHandleError,
			removeTransientMessages: GenericMessageUtil.removeTransientMessages
		};
	});
