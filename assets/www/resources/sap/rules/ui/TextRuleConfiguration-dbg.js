/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides control sap.rules.ui.TextRuleConfiguration
sap.ui.define([
	"jquery.sap.global", 
	"./library", 
	"sap/ui/core/Element"
], function(jQuery, library, Element) {
	"use strict";

	/**
	 * Constructor for a new TextRuleConfiguration.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * The <code>sap.rules.ui.TextRuleConfiguration</code>  element provides the ability to define specific properties that will be applied when rendering the <code>sap.rules.ui.RuleBuilder</code> in decision table mode.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @public
	 * @since 1.4
	 * @alias sap.rules.ui.TextRuleConfiguration
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var TextRuleConfiguration = Element.extend("sap.rules.ui.TextRuleConfiguration", { 
	
		metadata : {
			library : "sap.rules.ui",
			properties : {				
				//Specifies if the 'Settings' button is available in the toolbar of the Text Rule; the Settings button launches the Settings popup which allows the user creating the rule to configure the Text Rule. 
				/**
				 * The value determines whether the Settings button is displayed in a Text Rule when the control is used with S/4 HANA 17.05 (Cloud) or 17.09 (On Premise) and higher (On Premise).
				 */
				enableSettings: {
					type: "boolean",
					defaultValue: false 
				}
			},
			events:{
				change:{
					parameters :{
						name:{},
						value:{}
					}
				}
			}
		},
		
		_handlePropertySetter: function(sPropertyName, value){
			var result = this.setProperty(sPropertyName, value, true);
			this.fireChange({name: sPropertyName, value: value});
			return result;
		},
		
		setEnableSettings: function(bValue){
			return this._handlePropertySetter("enableSettings", bValue);
		}
	});

	return TextRuleConfiguration;

}, /* bExport= */ true);