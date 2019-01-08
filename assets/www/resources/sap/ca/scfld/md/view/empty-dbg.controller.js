/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");

jQuery.sap.require("sap.ca.ui.images.images");
//
sap.ca.scfld.md.controller.BaseDetailController.extend("sap.ca.scfld.md.view.empty", {

	onInit : function() {
		var oImage = this.byId("flower");
		if (oImage){
			oImage.setSrc(sap.ca.ui.images.images.Flower);
		}
		jQuery.sap.includeStyleSheet(jQuery.sap.getModulePath("sap.ca.scfld.md")
			+ "/css/flower.css", "emptyView_stylesheet");

		this.getView().addEventDelegate(this, this);
		this.getView().addEventDelegate({
			onBeforeShow : jQuery.proxy(function(oEvent) {
				 if (oEvent.data && (oEvent.data.viewTitle || oEvent.data.languageKey || oEvent.data.infoText)){
			     this.setTitleAndMessage(oEvent.data.viewTitle, oEvent.data.languageKey, oEvent.data.infoText);
				 }
			}, this)
		});

		//the route handler is only here for backwards compatibility
		this.oRouter.attachRouteMatched(function(oEvent) {
			if (oEvent.getParameter("name") === "noData") {
				var oArgument = oEvent.getParameter("arguments");

				this.setTitleAndMessage(oArgument.viewTitle, oArgument.languageKey);
			}
		}, this);


	},

	setTitleAndMessage : function (sViewTitle, sLanguageKey, sInfoText) {
	// set view title
		var oPage = this.byId("sap.ca.scfld.md.view.empty");
		var sTitle = this.oApplicationFacade.oApplicationImplementation.getResourceBundle().getText(sViewTitle);
		if (!sTitle || sTitle === sViewTitle) {
			//fallback: show message also as title
			if (!sInfoText) {
				sTitle = this.oApplicationFacade.oApplicationImplementation.getUiLibResourceBundle().getText(this.oApplicationFacade.oApplicationImplementation.oConfiguration.getDefaultEmptyMessageKey());
			} else {
				sTitle = sInfoText;
			}
		}
		oPage.setTitle(sTitle);
		oPage.setTitleLevel(sap.ui.core.TitleLevel.H2);

		// set message text
		var oLabel = this.byId("emptyLabel");
		if (!sInfoText) {
			var sMessage = this.oApplicationFacade.oApplicationImplementation.getResourceBundle().getText(sLanguageKey);
			if (!sMessage || sMessage === sLanguageKey) {
				//fallback
				sMessage = this.oApplicationFacade.oApplicationImplementation.getUiLibResourceBundle().getText(this.oApplicationFacade.oApplicationImplementation.oConfiguration.getDefaultEmptyMessageKey());
			}
			oLabel.setText(sMessage);
		} else {
			oLabel.setText(sInfoText);
		}
	}
});
