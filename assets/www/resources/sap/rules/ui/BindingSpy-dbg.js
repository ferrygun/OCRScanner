/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

sap.ui.define([
    "jquery.sap.global", 
    "./library", 
    "sap/ui/base/ManagedObject"
], function(jQuery, library, ManagedObject) {
	"use strict";

	/**
	 * Constructor for a new BindingSpy.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Private helper creature.
	 * It is intended to provide an ability to get model's property change notifications to some UI5 entity 
	 * that are not binded to this specific model's property by itself. 
	 * @extends  ManagedObject
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @private
	 * @alias sap.rules.ui.BindingSpy
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var oShpion = ManagedObject.extend("sap.rules.ui.BindingSpy", {
		metadata: {
		    
		    properties: {
				
				propertyToSpy: {
                    type: "any",
                    group: "Misc",
                    bindable: "bindable"
                }
		    },

			library: "sap.rules.ui",
			
			events: {
				"change": {}
			}
		}
	});
	
	sap.rules.ui.BindingSpy.prototype.setPropertyToSpy = function(oValue) {
		this.setProperty("propertyToSpy", oValue);
		
		// null means the property was unbinded
		if (oValue !== null) {
			this.fireChange({
				value: oValue
			});	
		}
	};

	return oShpion;

}, /* bExport= */ true);