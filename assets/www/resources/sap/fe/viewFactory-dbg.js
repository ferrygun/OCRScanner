
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.core.mvc.View.
sap.ui.define(['jquery.sap.global', 'sap/ui/model/json/JSONModel', 'sap/ui/core/mvc/View'], function (jQuery, JSONModel, View) {
	"use strict";

	//TODO do wee need the entitySet parameter
	function create(oViewSettings, oModel) {
		var oMetaModel = oModel.getMetaModel(),
			oDeviceModel = new JSONModel(sap.ui.Device);
		oDeviceModel.setDefaultBindingMode("OneWay");
		//TODO we need to do the first requestObject ourselves it seems. Need to check why?
		return oMetaModel.requestObject("/").then(function() {
			oViewSettings.preprocessors = jQuery.extend(oViewSettings.preprocessors, {
				xml: {
					bindingContexts: {
					},
					models: {
						'sap.fe.metaModel': oMetaModel,
						'sap.fe.deviceModel': oDeviceModel
					}
					//TODO: Clarify if this is needed for freestyle
					//preprocessorsData: oComponent.getComponentData().preprocessorsData
				}
			});
			/* FE supports only type XML */
			oViewSettings.type = "XML";
			var oView = sap.ui.view(oViewSettings),
				//TODO We need to improve the resourcebundle loading mechanism. Maybe it should be done in the library loading already
				//Right now we cannot load async, because it is accessed later in the controller of the table
				oI18nModel = new sap.ui.model.resource.ResourceModel({ bundleName: "sap/fe/messagebundle", async : false });
			//Bind the i18n model to the view so all controls inside the view can access it
			oView.setModel(oI18nModel, "sap.fe.i18n");
			return oView;
		});

	}

	var viewFactory = {
		create: create
	};

	return viewFactory;
});



