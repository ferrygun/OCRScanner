/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
sap.ui.define(["jquery.sap.global", "sap/ui/base/ManagedObject"],
	function(jQuery, ManagedObject) {
		"use strict";

		/**
		 * Constructs a class to parse condition values and create token elements inside a MultiInput field
		 * 
		 * @constructor
		 * @experimental This module is only for internal/experimental use!
		 * @private
		 * @param {object} sDefaultOperation - default operation for the token parsing
		 * @author Peter Harbusch
		 */
		var TokenParser = function(sDefaultOperation) {
			this._sDefaultOperation = sDefaultOperation;

			this._aKeyFields = [];

			this._mTypeOperations = {
				"default": ["Contains", "EQ", "BT", "StartsWith", "EndsWith", "LT", "LE", "GT", "GE", "NE"],
				"string": ["Contains", "EQ", "BT", "StartsWith", "EndsWith", "LT", "LE", "GT", "GE", "NE"],
				"date": ["EQ", "BT", "LT", "LE", "GT", "GE", "NE"],
				"time": ["EQ", "BT", "LT", "LE", "GT", "GE", "NE"],
				"numeric": ["EQ", "BT", "LT", "LE", "GT", "GE", "NE"],
				"boolean": ["EQ"]
			};

			this._init();
		};

		/**
		 * initialize all operations
		 * 
		 * @private
		 */
		TokenParser.prototype._init = function() {
			this.createOperation("BT", "foo...bar", "...", /^.+\.\.\..+$/, "$0...$1", function(sText) {
				var s1 = sText.slice(0, sText.indexOf(this.operation));
				var s2 = sText.slice(sText.indexOf(this.operation) + this.operation.length);
				return [s1, s2];
			});
			this.createOperation("EQ", "=foo", "=", /^\=.+$/, "=$0");
			this.createOperation("Contains", "*foo*", "**", /^\*.+\*$/, "*$0*", function(sText) {
				return [sText.slice(1, sText.length - 1).trim()];
			});
			this.createOperation("StartsWith", "foo*", "*", /^([^\*].*)\*$/, "$0*", function(sText) {
				return [sText.slice(0, sText.length - 1).trim()];
			});
			this.createOperation("EndsWith", "*foo", "*", /^\*(.*[^\*])$/, "*$0");
			this.createOperation("LT", "< foo", "<", /^\<([^\=].*)$/, "<$0");
			this.createOperation("LE", "<=foo", "<=", /^\<\=(.+)$/, "<=$0");
			this.createOperation("GT", "> foo", ">", /^\>([^\=].*)$/, ">$0");
			this.createOperation("GE", ">=foo", ">=", /^\>\=(.+)$/, ">=$0");
			this.createOperation("NE", "!=foo", "!=", /^\!\=(.+)$/, "!(=$0)").exclude = true;
		};

		TokenParser.prototype.destroy = function() {
			this._oInput.removeValidator(this._validator);
			this._oInput = null;
			this._aOrgValidators = null;
			this._aKeyFields = null;
			this._mTypeOperations = null;
		};

		/**
		 * Specifies the default operation for the token parser
		 * 
		 * @param {string} sOperationKey - the key of the default operation
		 * @public
		 */
		TokenParser.prototype.setDefaultOperation = function(sOperationKey) {
			this._sDefaultOperation = sOperationKey;
		};

		/**
		 * returns the default operation for the token parser
		 * 
		 * @returns {string} the default operation key
		 * @public
		 */
		TokenParser.prototype.getDefaultOperation = function() {
			return this._sDefaultOperation;
		};

		/**
		 * Specifies the maxLength for a token value. the input of a field will be truncated to this maxLength.  
		 * 
		 * @param {int} iMaxLength - the key of the default operation
		 * @public
		 */
		TokenParser.prototype.setMaxLength = function(iMaxlength) {
			this._iMaxLength = iMaxlength;
		};

		/**
		 * returns the maxLength for the token parser
		 * 
		 * @returns {int} the maxLength value
		 * @public
		 */
		TokenParser.prototype.getMaxLength = function() {
			return this._iMaxLength;
		};

		/**
		 * Specifies the displayFormat for a token value. Currently only UpperCase is supported  
		 * 
		 * @param {string} sDisplayFormat 
		 * @public
		 */
		TokenParser.prototype.setDisplayFormat = function(sDisplayFormat) {
			this._sDisplayFormat = sDisplayFormat;
		};

		/**
		 * returns the displayFormat for the token parser
		 * 
		 * @returns {string} the displayFormat value
		 * @public
		 */
		TokenParser.prototype.getDisplayFormat = function() {
			return this._sDisplayFormat;
		};

		/**
		 * returns the map of all operations
		 * 
		 * @returns {map} 
		 * @public
		 */
		TokenParser.prototype.getOperations = function() {
			return this._mOperations;
		};

		/**
		 * returns a specific operation
		 * 
		 * @param {string} sOperationKey - the key of the operation 
		 * @returns {object} 
		 * @public
		 */
		TokenParser.prototype.getOperation = function(sOperationKey) {
			return this._mOperations && this._mOperations[sOperationKey];
		};

		/**
		 * returns the KeyField by label
		 * 
		 * @param {string} sLabel - the label of the keyfield
		 * @private
		 */
		TokenParser.prototype._getKeyFieldByLabel = function(sLabel) {
			var keyField;
			this._aKeyFields.some(function(oKeyField) {
				if (oKeyField.label.toUpperCase() === sLabel.toUpperCase()) {
					keyField = oKeyField;
				}
			}, this);
			return keyField;
		};

		TokenParser.prototype.addKeyField = function(oKeyField) {
			this._aKeyFields.push(oKeyField);
		};

		TokenParser.prototype.addTypeOperations = function(sType, aOperations) {
			this._mTypeOperations[sType] = aOperations;
		};

		TokenParser.prototype.removeTypeOperations = function(sType) {
			delete this._mTypeOperations[sType];
		};

		TokenParser.prototype.getTypeOperations = function(sType) {
			return this._mTypeOperations[sType];
		};

		/**
		 * create a new operation for the parser
		 * 
		 * @param {string} sOperationKey - operation key
		 * @param {string} sExample - shown as  help text in  suggest
		 * @param {string} sOperation - operation characters
		 * @param {regExp} regEx
		 * @param {string} sTemplate - template for formatter which will be shown as token text
		 * @param {function} fParse - parser callback function
		 * @public
		 */
		TokenParser.prototype.createOperation = function(sOperationKey, sExample, sOperation, regEx, sTemplate, fParse) {
			if (!this._mOperations) {
				this._mOperations = {};
			}

			this._mOperations[sOperationKey] = {
				key: sOperationKey,
				example: sExample,
				operation: sOperation,
				re: regEx,
				template: sTemplate,
				exclude: false,
				parser: this,
				match: function(sText) {
					return this.re.exec(sText);
				},
				parse: fParse || function(sText) {
					return [sText.slice(this.operation.length).trim()];
				},
				getFilledTemplate: function(sText) {
					var aValues = this.parse(sText);
					var sTokenText = this.template;
					for (var i = 0; i < aValues.length; i++) {
						sTokenText = sTokenText.replace("$" + i, this.format(aValues[i]));
					}
					return sTokenText;
				},
				getConditionData: function(sText) {
					var range = {};
					range.exclude = this.exclude;
					range.operation = this.exclude ? "EQ" : this.key;

					var aValues = this.parse(sText);
					for (var i = 0; i < aValues.length; i++) {
						range["value" + (i + 1)] = this.format(aValues[i]);
					}

					return range;
				},
				format: function(sValue) {
					if (this.parser.getMaxLength() >= 0) {
						sValue = sValue.substring(0, this.parser.getMaxLength());
					}
					if (this.parser._sDisplayFormat === "UpperCase") {
						sValue = sValue.toUpperCase();
					}
					return sValue;
				}
			};

			return this._mOperations[sOperationKey];
		};

		/**
		 * remove an operation of the parser
		 * 
		 * @param {string} sOperationKey - key of the operation which will be removed
		 * @public
		 */
		TokenParser.prototype.removeOperation = function(sOperationKey) {
			delete this._mOperations[sOperationKey];
		};

		/**
		 * remove all operations of the parser
		 * 
		 * @public
		 */
		TokenParser.prototype.removeAllOperations = function() {
			var aOperationKeys = Object.keys(this._mOperations);
			aOperationKeys.forEach(function(operationKey) {
				delete this._mOperations[operationKey];
			}, this);
		};

		/**
		 * returns the translated name of the operation
		 * 
		 * @param {string} sType - type of the field
		 * @param {object} oOperation  
		 * @param {string} sResourceBundle - name of the resource bundle 
		 * @returns {string} translated name
		 * @public
		 */
		TokenParser.prototype.getTranslatedText = function(sType, oOperation, sResourceBundle) {
			var sTextKey = oOperation.key;

			sType = sType !== "default" ? "_" + sType.toUpperCase() + "_" : "";

			if (sType === "_STRING_" || sType === "_BOOLEAN_") {
				sType = "";
			}
			if (sType === "_TIME_") {
				sType = "_DATE_";
			}

			if (!sResourceBundle) {
				sResourceBundle = "sap.m";
			}

			sTextKey = "CONDITIONPANEL_OPTION" + sType + sTextKey;
			var sText = sap.ui.getCore().getLibraryResourceBundle(sResourceBundle).getText(sTextKey) || sTextKey;
			if (jQuery.sap.startsWith(sText, "CONDITIONPANEL_OPTION")) {
				// when for the specified type the resource does not exist use the normal string resource text
				sTextKey = "CONDITIONPANEL_OPTION" + oOperation.key;
				sText = sap.ui.getCore().getLibraryResourceBundle(sResourceBundle).getText(sTextKey);
			}

			//TODO NE operation missing in resources
			// if (sText === "CONDITIONPANEL_OPTIONNE") {
			// 	sText = "not equals to";
			// }

			return sText;
		};

		/**
		 * associates an multiInput control with the token parser. The function is adding a validator to the multiInput and creates tokens when the input is matching to an operation
		 * 
		 * @param {control} oInput - multiInput control
		 * @public
		 */
		TokenParser.prototype.associateInput = function(oInput) {
			this._oInput = oInput;

			this._aOrgValidators = this._oInput._tokenizer ? this._oInput._tokenizer._aTokenValidators.slice() : [];
			this._oInput.removeAllValidators();

			this._oInput.addValidator(this._validator.bind(this));
		};

		TokenParser.prototype._validator = function(args) {
			//queue the validator calls
			if (this._aOrgValidators) {
				var oToken;
				this._aOrgValidators.some(function(fValidator) {
					oToken = fValidator(args);
					return oToken;
				}, this);

				if (oToken) {
					return oToken;
				}
			}

			if (args.suggestionObject && args.suggestionObject.getKey) {
				var key = args.suggestionObject.getKey();
				var text = args.suggestionObject.getText();
				var additionalText = args.suggestionObject.getAdditionalText();

				if (additionalText) { //} && additionalText === argsValue) {
					return this._onValidate(additionalText);
				} else {
					return new sap.m.Token({ key: key, text: text + " (" + key + ")", tooltip: text });
				}
			}

			if (args.suggestedToken) {
				var sText = args.suggestedToken.getText();
				var sKey = args.suggestedToken.getKey();
				args.suggestedToken.setText(sText + " (" + sKey + ")");
				args.suggestedToken.setTooltip(args.suggestedToken.getText());

				return args.suggestedToken;
			}

			if (args.text) {
				return this._onValidate(args.text);
			}

			return null;
		};


		/**
		 * called from the muliInput validator 
		 * 
		 * @param {string} sText - the entered text which should be parsed and validated
		 * @private
		 */
		TokenParser.prototype._onValidate = function(sText) {
			var oKeyField = this._aKeyFields.length > 0 ? this._aKeyFields[0] : null;
			
			// Ticket 1780396542
			if (this._oInput._getIsSuggestionPopupOpen && this._oInput._getIsSuggestionPopupOpen() && 
					this._oInput._oSuggestionTable && this._oInput._oSuggestionTable.getSelectedItem()) {
				//avoid the validation handling when the suggest list is open and the user has clicked on a suggest item.
				return null;
			}
			
			if (oKeyField) {
				var akeyFieldMaches = /^\w+\:\s/.exec(sText);
				if (akeyFieldMaches) {
					var sKeyLabel = akeyFieldMaches[0];
					oKeyField = this._getKeyFieldByLabel(sKeyLabel.slice(0, sKeyLabel.indexOf(":")));
					sText = sText.slice(akeyFieldMaches[0].length).trim();
				}
			}

			var type = oKeyField && oKeyField.type || "default";
			var aTypeOperations = this._mTypeOperations[type];

			var fCheck = function(oOperation, sText) {
				if (oOperation.match(sText)) {
					var range = oOperation.getConditionData(sText);
					range.keyField = oKeyField ? oKeyField.key : null;

					var sTokenText = (oKeyField && oKeyField.label && this._aKeyFields.length > 1 ? oKeyField.label + ": " : "") + oOperation.getFilledTemplate(sText);
					sTokenText = ManagedObject.escapeSettingsValue(sTokenText); 
					return new sap.m.Token({ text: sTokenText, tooltip: sTokenText }).data("range", range);
					//return new sap.m.Token().setText(sTokenText).setTooltip(sTokenText).data("range", range);
				}
				return null;
			}.bind(this);

			var token;
			if (aTypeOperations.some(function(operationKey) {
					token = fCheck(this._mOperations[operationKey], sText);
					return token;
				}, this)) {
				return token;
			}

			// check for default operation
			//var sDefaultOperation = "EQ";
			if (this._sDefaultOperation && this._mOperations[this._sDefaultOperation]) {
				sText = this._mOperations[this._sDefaultOperation].template.replace("$0", sText);
				return fCheck(this._mOperations[this._sDefaultOperation], sText);
			}

			return null;
		};

		return TokenParser;
	}, true);