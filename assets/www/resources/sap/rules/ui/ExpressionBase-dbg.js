/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides the sap.rules.ui.ExpressionBase control
sap.ui.define([
	"sap/ui/core/Control" 
], function (Control) {
    "use strict";
     
    /**
    * Constructor for a new ExpressionBase.
    *
    * @param {string} [sId] ID for the new control, generated automatically if no ID is given
    * @param {object} [mSettings] Initial settings for the new control
    *
    * @class
    * The <code>sap.rules.ui.ExpressionBase</code> control provides text editor capabilities for expressions that are based on an expression language.
    * @extends sap.ui.core.Control
    *
    * @author SAP SE
    * @version 1.52.8
    *
    * @constructor
    * @private
    * @experimental Only for internal use.
    * 
    * @alias sap.rules.ui.ExpressionBase
    * @ui5-metamodel This control also will be described in the UI5 (legacy) designtime metamodel
    */
     
    var ExpressionBase = Control.extend("sap.rules.ui.ExpressionBase", {

        metadata: {
            "abstract": true,
            properties: {

                /**
                * Defines the value of the control.
                */
                value: {
                    type: "string",
                    defaultValue: "",
                    bindable: "bindable"
                },

                /**
                * Defines whether the control can be modified by the user or not.
                * <b>Note:<b> A user can tab to a non-editable control, highlight it, and copy the text from it.
                */
                editable: {
                    type: "boolean",
                    defaultValue: true
                },

                /**
                * Defines whether the control's value is validated upon loading.
                */
                validateOnLoad: {
                    type: "boolean",
                    defaultValue: false
                },

                /**
                 * Defines the text that appears in the value state message pop-up.
                 */
                valueStateText: {
                    type: "string",
                    defaultValue: null,
                    bindable: "bindable"
                }
            },
            associations: {

                /**
                * Association to the expression language element.
                */
                expressionLanguage: {
                    type: "sap.rules.ui.services.ExpressionLanguage",
                    multiple: false,
                    singularName: "expressionLanguage"
                }
            },
            publicMethods: ["validate"]
        },
        renderer: null
    });

    ExpressionBase.prototype.init = function () {

    };

    return ExpressionBase;

}, /* bExport= */true);
