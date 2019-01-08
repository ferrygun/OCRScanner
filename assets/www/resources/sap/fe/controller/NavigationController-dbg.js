/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/MessagePage",
	"sap/m/Link"
], function (jQuery, BaseObject, MessageBox, MessageToast, MessagePage, Link) {
	"use strict";

	function getMethods(oTemplateContract, oTemplateUtils) {
		// Please note: oTemplateUtils is undefined in case the navigation controller is used before any template
		// is instantiated - so be prepared for this

		var oMessagePage;

		function navigateToMessagePage(mParameters) {
			if (!oMessagePage) {
				oMessagePage = new MessagePage({
					showHeader: false
				});

				oTemplateContract.oNavContainer.addPage(oMessagePage);
			}

			oMessagePage.setText(mParameters.text);
			oMessagePage.setIcon("sap-icon://message-error");
			if (mParameters.technicalMessage) {
				oMessagePage.setCustomDescription(
					new Link({
						text: mParameters.description,
						press: function() {
							MessageBox.show(mParameters.technicalMessage, {
								icon: MessageBox.Icon.ERROR,
								title: "Error",
								actions: [MessageBox.Action.OK],
								defaultAction: MessageBox.Action.OK,
								details: mParameters.technicalDetails || "",
								contentWidth: "60%"
							});
						}
					})
				);
			} else {
				oMessagePage.setDescription(mParameters.description || '');
			}
			oTemplateContract.oNavContainer.to(oMessagePage);

		}

		return {
			navigateToMessagePage: navigateToMessagePage
		};
	}

	return BaseObject.extend(
		"sap.fe.controller.NavigationController.js", {
			constructor: function (oTemplateContract, oTemplateUtils) {
				jQuery.extend(this, getMethods(oTemplateContract, oTemplateUtils));
			}
		});
});
