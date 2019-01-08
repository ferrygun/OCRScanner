/**
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(['jquery.sap.global','sap/ui/base/Object'], 
	function(jQuery, Object) {
	"use strict";
	/**
	 * Language bundle for Collaboration
	 *
	 * @class
	 * Language bundle for Collaboration 
	 * @extends sap.ui.base.Object
	 *
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @constructor
	 * @public
	 */
	var resourceUrl = jQuery.sap.getModulePath("sap.collaboration.components") + "/resources/i18n/messagebundle.properties";
	var LanguageBundle = Object.extend("sap.collaboration.components.util.LanguageBundle", {
		constructor: function(){
			
			this.i18nModel =  new sap.ui.model.resource.ResourceModel({
				bundleUrl: resourceUrl
			});
			
			this.oLangBundle = this.i18nModel.getResourceBundle();
		},
		getText: function(textId, variables) {
			return this.oLangBundle.getText(textId, variables);
		},
		createResourceModel: function() {

			return this.i18nModel;
		}
	});
	
	return LanguageBundle;
},/* bExport= */ true );

