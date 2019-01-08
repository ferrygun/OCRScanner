/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides control sap.rules.ui.ExpressionAdvanced.
sap.ui.define([
	"jquery.sap.global",
	"./library",
	"sap/rules/ui/Utils",
	"sap/rules/ui/ExpressionAdvanced"
],	function(jQuery, library, Utils, ExpressionAdvanced) {
		"use strict";

		/**
		 * Constructor for a new DecisionTableCellExpressionAdvanced sap.rules.ui.ExpressionAdvanced.
		 *
		 * @param {string} [sId] id for the new control, generated automatically if no id is given
		 * @param {object} [mSettings] initial settings for the new control
		 *
		 * @class
		 * The <code>sap.rules.ui.DecisionTableCellExpressionAdvanced</code> control provides the ability to define expressions for complex rules in a decision table.
		 * @extends  sap.rules.ui.ExpressionAdvanced
		 *
		 * @author SAP SE
		 * @version 1.52.8
		 *
		 * @constructor
		 * @private
		 * @alias sap.rules.ui.DecisionTableCellExpressionAdvanced
		 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
		 */
		var DecisionTableCellExpressionAdvanced = ExpressionAdvanced.extend("sap.rules.ui.DecisionTableCellExpressionAdvanced", {
			metadata: {

				library: "sap.rules.ui",
				properties: {
					/**
					 * Defines the header value of the control.
					 */
					headerValue: {
						type: "string",
						defaultValue: "",
						bindable: "bindable"
					},
					/**
					 * Defines the fixed operator value of the control.
					 */
					fixedOperator: {
						type: "string",
						defaultValue: "",
						bindable: "bindable"
					},
					type: {
						type: "sap.rules.ui.ExpressionType",
						defaultValue: sap.rules.ui.ExpressionType.BooleanEnhanced,
						bindable: "bindable"
					}
				}
			}
		});

		DecisionTableCellExpressionAdvanced.prototype.validateExpression = function() {
			var expressionValue = this.codeMirror ? this.codeMirror.getValue() : this.getValue();
			if (expressionValue) {
				var sValue = this.getHeaderValue() + " " + this.getFixedOperator() + " " + expressionValue;
				sap.rules.ui.ExpressionAdvanced.prototype.validateExpression.apply(this, [sValue]);
			} else {
				this.setValueStateText("");
			}

		};
    
        DecisionTableCellExpressionAdvanced.prototype.init = function() {
			sap.rules.ui.ExpressionAdvanced.prototype.init.apply(this, arguments);
            this.bFlagForChangeBeforeBlur = false;  
		};

		DecisionTableCellExpressionAdvanced.prototype.onAfterRendering = function() {
			sap.rules.ui.ExpressionAdvanced.prototype.onAfterRendering.apply(this, arguments);
			this.codeMirror.options.fixedOperator = this.getFixedOperator();
			this.codeMirror.options.headerValue = this.getHeaderValue();
			this.codeMirror.options.filterOutStructuredCond = true;      //Structured conditions should not appear in decision table. (e.g "any of the following...")
			this.oDecisionTableCell = (this.getParent() && this.getParent().getParent()) ?  this.getParent().getParent() : null;
			this._handleValidation();
            if (jQuery.sap.byId(this.getId()).closest('td').next().width()) {
				this._showPopUp();
			}
			if (this.oDecisionTableCell) {
				var valueStatePath = this.oDecisionTableCell.getValueStatePath();
				var dtModel = this.oDecisionTableCell.getModel("dtModel");
				var oDisplayedControl = this.oDecisionTableCell.getAggregation("_displayedControl");
				if (oDisplayedControl) {
					dtModel.setProperty(valueStatePath.slice(8), sap.ui.core.ValueState.None);
				}
			}
				this.createEventListeners();
			
			;
		}
		
		DecisionTableCellExpressionAdvanced.prototype._handleValidation = function() {
			this.validateExpression();
			this._showErrorMessage();
			if (this.getProperty("valueStateText") && this.codeMirror) {
				this.codeMirror.options.expressionEditor._showPopUp();
			}
		};
		
		DecisionTableCellExpressionAdvanced.prototype._processValidationResult = function(result){
		sap.rules.ui.ExpressionAdvanced.prototype._processValidationResult.apply(this, arguments);
		if (this.oDecisionTableCell) {
			var valueStateTextPath = this.oDecisionTableCell.getValueStateTextPath();
			var valueStatePath = this.oDecisionTableCell.getValueStatePath();
			var dtModel = this.oDecisionTableCell.getModel("dtModel");
			var oDisplayedControl = this.oDecisionTableCell.getAggregation("_displayedControl");
			if (oDisplayedControl && result.status === sap.rules.ui.ValidationStatus.Error ) {
				var errorDetails = this.getValueStateText();
				dtModel.setProperty(valueStateTextPath.slice(8), errorDetails);
				if (!this.oDecisionTableCell._oPopover || !this.oDecisionTableCell._oPopover.isOpen()) {
					dtModel.setProperty(valueStatePath.slice(8), sap.ui.core.ValueState.Error);
				} else {
					dtModel.setProperty(valueStatePath.slice(8), sap.ui.core.ValueState.None);
				}
				this.setProperty("valueStateText", errorDetails);
			} else if (oDisplayedControl) {
				dtModel.setProperty(valueStateTextPath.slice(8), "null");
				dtModel.setProperty(valueStatePath.slice(8), sap.ui.core.ValueState.None);
				this.setProperty("valueStateText", "");
			}
		}
	};
    
        DecisionTableCellExpressionAdvanced.prototype.exit = function() {
            sap.rules.ui.ExpressionAdvanced.prototype.exit.apply(this, arguments);
            this._handleValidation();
            this._closePopUp();
            this.pop = null;
            var oCodeMirror = this.codeMirror;
            // bug RULES-4391 only in FF after choose hints with mouse sometimes the popover will close and auto complete will stay open
            if (oCodeMirror && oCodeMirror.state.completionActive) {
                oCodeMirror.state.completionActive.onClose();
            }
            // bug RULES-4833 if we pressed escape - we need to focus cell (dotted border)
            if (this.bFocusCellAfterEscape && this.oDecisionTableCell) {
                var oHTMLParent = this.oDecisionTableCell.getDomRef().parentElement.parentElement;
                if (oHTMLParent) {
                    jQuery(oHTMLParent).focus();
                }
            }
            
        };

		DecisionTableCellExpressionAdvanced.prototype.getFormattingTokens = function (oExpressionLanguage) {
					var sExpression = this._liveValue;
					var sHeader = this.getHeaderValue();
					var sFixOperator = this.getFixedOperator();
					var sType = "All";
					var result = oExpressionLanguage.getDecisionTableCellTokens(sHeader, sFixOperator, sExpression, sType);
					var expressionTokens;
					if (result.tokens && result.tokens.cell) {
						expressionTokens = result.tokens.cell;
						this.setExpressionTokens(expressionTokens);
					}
		};
    
        // Event Listeners for integration between [Code Mirror - ExpressionAdvanced - popover - DTCell] to work together in all browsers and OS
        DecisionTableCellExpressionAdvanced.prototype.createEventListeners = function() {   
            
            document.getElementById(this.getId()).addEventListener("keydown", function(oEvent){
                var key = oEvent.keyCode || oEvent.charCode;
                if ( key === 8 ) { //fix bug - after press backspace and choose autocomplete - popover will not closed
                    this.bFlagForChangeBeforeBlur = true;
                } else if (key === 27 ) { // bug RULES-4833 if we pressed escape - we need to focus cell (dotted border)
                    this.bFocusCellAfterEscape = true;
                }
            }.bind(this), true);

            // bug 4848 - touch screen laptops close popover after select autocomplete (trigger touch event)
            var click = ('ontouchstart' in document.documentElement)  ? 'touchstart' : 'mousedown'; 
            
            if (click === 'touchstart') { //if hybrid device
                document.addEventListener("mousedown", function(oEvent) {
                    if (oEvent.target.className.includes("CodeMirror-hint")) {//if click the auto complete
                        oEvent.stopPropagation();
                    }
                }.bind(this), true);
                document.addEventListener("touchstart", function(oEvent) {
                    if (oEvent.target.className.includes("CodeMirror-hint")) {//if tap the auto complete
                        oEvent.stopPropagation();
                    }
                }.bind(this), true);
            }
            
            // EventListeners for IE  
            if (!(window.ActiveXObject) && "ActiveXObject" in window) { //if browser IE  
                // bug RULES-4810 only in IE Code Mirror blur called validate even popover open - not damaged in other browsers and OS
                this.codeMirror.on("blur", function (cm, oEvent) {
                    this.bFlagForPreventBlurWhenPopOverOpen = true;
                }.bind(this));
                
                //bug RULES-2641 only in IE blur called twice - not damaged in other browsers and OS
                document.getElementById(this.getId()).addEventListener("mousedown", function(oEvent){
                    this.bFlagForChangeBeforeBlur = true;
                }.bind(this), true);
            }            

            // EventListeners for FF  
            if ((navigator.userAgent.toLowerCase().indexOf('firefox') > -1)){
                // bug RULES-4391 only in FF after choose hints with mouse sometimes the popover will close
                document.addEventListener("mousedown", function(oEvent){
                    this.bIsClickedOnTheAutoComplete = oEvent.target.className.includes("CodeMirror-hint");
                }.bind(this), true);

                document.addEventListener("blur", function(oEvent){
                    if (this.bIsClickedOnTheAutoComplete || this.ValueHelpRequested === true) {
                        this.bIsClickedOnTheAutoComplete = false;
                        oEvent.stopPropagation();
                    }
                }.bind(this), true);
            }
        };

		return DecisionTableCellExpressionAdvanced;

	}, /* bExport= */ true);