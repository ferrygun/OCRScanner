/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides control sap.rules.ui.
sap.ui.define([
    "jquery.sap.global", 
    "./library", 
    "sap/ui/core/Control"
], function(jQuery, library, Control) {
	"use strict";

	/**
	 * Constructor for a new RuleBase Control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Some class description goes here.
	 * @extends  Control
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @private
	 * @alias sap.rules.ui.RuleBase
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var oRuleBase = Control.extend("sap.rules.ui.RuleBase", {
		metadata: {
		    
		    properties: {
				
				bindingContextPath: {

                    type: "string",
                    group: "Misc", 
                    defaultValue: ""
                },

                modelName: {
                    type: "string",
                    group: "Misc",
                    defaultValue: ""
                },
		       
                /**
                * Flag whether the controls is editable or not
                */
                editable: {
                    type: "boolean",
                    defaultValue: true
                }
		    },

			library: "sap.rules.ui",
			associations: {
                "expressionLanguage": {
                    type: "sap.rules.ui.services.ExpressionLanguage",
                    multiple: false,
                    singularName: "expressionLanguage"
                }
			}
		}
	});

	return oRuleBase;

}, /* bExport= */ true);