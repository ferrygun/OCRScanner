/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides control sap.rules.ui.DecisionTableConfiguration
sap.ui.define([
	"jquery.sap.global", 
	"./library", 
	"sap/ui/core/Element"
], function(jQuery, library, Element) {
	"use strict";

	/**
	 * Constructor for a new DecisionTableConfiguration.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * The <code>sap.rules.ui.DecisionTableConfiguration</code>  element provides the ability to define specific properties that will be applied when rendering the <code>sap.rules.ui.RuleBuilder</code> in decision table mode.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @public
	 * @since 1.4
	 * @alias sap.rules.ui.DecisionTableConfiguration
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var DecisionTableConfiguration = Element.extend("sap.rules.ui.DecisionTableConfiguration", { 
	
		metadata : {
			library : "sap.rules.ui",
			properties : {
				/**
				 * The value determines the user input mode for the corresponding rule cells when creating or editing a rule.
				 * @deprecated This attribute is deprecated since version 1.52.8, use the decisionTableFormat property.
				 */
				cellFormat: {
					type: "sap.rules.ui.DecisionTableCellFormat",
					defaultValue: sap.rules.ui.DecisionTableCellFormat.Both,
					deprecated: true
				},
			    /**
				 * The value determines how the results of the decision table are evaluated when more than one rule is matched for a given set of inputs.
				 */
				hitPolicies: {
					type: "sap.rules.ui.RuleHitPolicy[]",
					defaultValue: [sap.rules.ui.RuleHitPolicy.FirstMatch, sap.rules.ui.RuleHitPolicy.AllMatch]
				},
//Specifies if the 'Settings' button is available in the toolbar of the decision table; the Settings button launches the Settings popup which allows the user creating the rule to configure the layout and columns of the decision table. 
				/**
				 * The value determines whether the Settings button is displayed in a decision table when the control is used with S/4 HANA 17.05 (Cloud) or 17.09 (On Premise) and higher (On Premise).
				 */
				enableSettings: {
					type: "boolean",
					defaultValue: false 
				},
				/**
                 * The value determines whether the user can set the rendering of the decision Table to be based on cellFormat or rule Format
                 */
                 decisionTableFormat: {
                     type: "sap.rules.ui.DecisionTableFormat",
                     defaultValue: sap.rules.ui.DecisionTableFormat.CellFormat
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
		
		setCellFormat: function (sValue){
			return this._handlePropertySetter("cellFormat", sValue);	
		},
		
		setHitPolicies: function (aValue){
			return this._handlePropertySetter("hitPolicies", aValue);	
		},
		
		setEnableSettings: function(bValue){
			return this._handlePropertySetter("enableSettings", bValue);
		},
		setDecisionTableFormat: function(bValue){
            return this._handlePropertySetter("decisionTableFormat", bValue);
        },
	});

	return DecisionTableConfiguration;

}, /* bExport= */ true);
