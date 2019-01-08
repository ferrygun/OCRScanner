/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["jquery.sap.global", "sap/ui/base/Object"],
	function(jQuery, BaseObject) {
		"use strict";

		/**
		 *
		 * @class simple item list Provider for FilterField.
		 * @extends sap.ui.base.Object
		 *
		 * @author SAP SE
		 * @version 1.52.4
		 * @since 1.48.0
		 * @alias sap.ui.mdc.base.FixedValueListProvider
		 *
		 * @private
		 * @experimental
		 * @sap-restricted
		 */
		var FixedValueListProvider = BaseObject.extend("sap.ui.mdc.base.FixedValueListProvider", /** @lends sap.ui.mdc.base.FixedValueListProvider.prototype */ {

			constructor: function(mParameters) {
				BaseObject.apply(this);

				this._bShowAll = true;
				this._bShowHint = false;

				if (mParameters) {
					this._fInit = mParameters.init;
					this._fSuggest = mParameters.suggest;
					this._fSelect = mParameters.select;
					this._bShowAll = mParameters.enableShowAll !== undefined ? mParameters.enableShowAll : true;
					this._bShowHint = mParameters.showHint !== undefined ? mParameters.showHint : false;
					this._maxWidth = mParameters.maxWidth;
					this._bEnableFilterSuggest = mParameters.enableFilterSuggest;
					this._keyPath = mParameters.keyPath;
					this._descriptionPath = mParameters.descriptionPath;
					if (mParameters.control) {
						this.associateFilterField(mParameters.control);
					}
				}

			}
		});

		FixedValueListProvider.prototype.destroy = function() {
			this._oFilterField = null;
			this._oInput = null;
			this._oTable = null;
		};

		FixedValueListProvider.prototype.getTable = function() {
			return this._oTable;
		};

		FixedValueListProvider.prototype.setKeyPath = function(sKeyPath) {
			this._keyPath = sKeyPath;
		};

		FixedValueListProvider.prototype.setDescriptionPath = function(sDescriptionPath) {
			this._descriptionPath = sDescriptionPath;
		};

		FixedValueListProvider.prototype.setTable = function(oTable) {
			this._oTable = oTable;

			var oMultiInput = this._oFilterField.getAggregation("_input");

			// remove old suggestion list
			oMultiInput.removeAllSuggestionColumns();
			oMultiInput.removeAllSuggestionRows();

			if (oTable) {
				var oBindingInfo = oTable.getBindingInfo("items");

				var aColumns = oTable.getColumns();
				for (var i = 0; i < aColumns.length; i++) {
					var oColumn = aColumns[i].clone();
					oMultiInput.addSuggestionColumn(oColumn);
				}
				oMultiInput.setMaxSuggestionWidth(this._maxWidth ? this._maxWidth : (aColumns.length * 8 + 2) + "em");

				oMultiInput.setModel(oTable.getModel());

				oMultiInput.bindAggregation("suggestionRows", {
					path: oBindingInfo.path,
					template: oBindingInfo.template,
					parameters: oBindingInfo.parameters
				});
			} else {
				oMultiInput.bindAggregation("suggestionRows", null);
			}
		};

		FixedValueListProvider.prototype.associateFilterField = function(oFilterField) {
			this._oFilterField = oFilterField;
			this._oInput = oFilterField.getAggregation("_input");

			if (!this._oInput) {
				var that = this;
				setTimeout(function() { that.associateFilterField(oFilterField); }, 100);
				return;
			}

			if (!(this._oInput instanceof sap.m.MultiInput)) {
				jQuery.sap.log.error("mdc:FixedValueListProvider", "associateFilterField for " + (this._oInput ? this._oInput.getId() : "none") + " not possible!");
				return;
			}

			this._oInput.setShowSuggestion(true);
			this._oInput.setEnableSuggestionsHighlighting(false);
			this._oInput.setFilterSuggests(this._bEnableFilterSuggest);
			this._oInput.setShowTableSuggestionValueHelp(false);
			if (this._bShowHint) {
				this._oInput.setPlaceholder("press space to get help");
			}

			// if (oFilterField.getMaxConditions() == 1) {
			//TODO workaround to change the valueHelpIcon
			this._oInput._getValueHelpIcon = function() {
				var _oValueHelpIcon = sap.m.MultiInput.prototype._getValueHelpIcon.apply(this, arguments);

				if (_oValueHelpIcon) {
					_oValueHelpIcon.setSrc(sap.ui.core.IconPool.getIconURI("slim-arrow-down"));
				}
				return _oValueHelpIcon;
			};

			//TODO workaround to open the suggest - simulates the open trigger 
			this._oInput.attachValueHelpRequest(function(oEvent) {
				var oInner = oEvent.oSource;
				oInner._$input.val(" ");
				oInner._triggerSuggest(" ");
			});
			// }

			this._oInput.attachSuggest(function(oEvent) {
				if (this._fInit && !this.getTable()) {
					this._fInit(this);
				}
				if (this._fSuggest) {
					this._fSuggest(this, oEvent);
				}
			}.bind(this));

			this._oInput.setFilterFunction(function(sValue, oItem) {
				var bShowAll = (sValue.lastIndexOf(" ") == sValue.length - 1) && this._bShowAll;
				sValue = sValue.trim();
				if (bShowAll) {
					return true;
				}
				return sap.m.Input._DEFAULTFILTER_TABULAR(sValue, oItem);
			}.bind(this));

			this._oInput.addValidator(function(oData) {
				var sText = oData.text,
					oRow = oData.suggestionObject,
					oSource = this._oInput,
					oBinding = this._oFilterField.getBinding("conditions"),
					oType = this._oFilterField._getDataType(),
					type = oType.getMetadata().getName(),
					oOperator, oCondition,
					sFieldPath = this._oFilterField.getFieldPath(),
					oDataModelRow, sKey, sDescription, sValue;

				if (oRow) {
					if (this._fSelect) {
						if (this._fSelect(this, oData)) {
							return null;
						}
					}

					// handle the selected item as EEQ with key
					var bc = oRow.getBindingContext();
					oDataModelRow = bc.getObject();

					sKey = this._keyPath && oDataModelRow[this._keyPath] ? oDataModelRow[this._keyPath] : null;
					sDescription = this._descriptionPath && oDataModelRow[this._descriptionPath] ? oDataModelRow[this._descriptionPath] : null;
					sValue = "==" + sKey;

					oOperator = this._oFilterField.getFilterOperatorConfig().getOperator("EEQ");
					if (oOperator && oOperator.test(sValue, oType)) {
						oCondition = oBinding.getModel().addCondition(oBinding.getModel().createItemCondition(sFieldPath, sKey, sDescription));
						oSource.setValue("");
						this._oFilterField.fireChange({ value: oCondition, type: "added", valid: true });
					}
				} else {
					jQuery.sap.log.info("mdc:FixedValueListProvider", "validator check if one suggestionRow exist for " + sText);

					if (oSource._getIsSuggestionPopupOpen && oSource._getIsSuggestionPopupOpen()) {
						var aSuggestionItems = oSource.getSuggestionRows();
						var n = 0,
							i = -1;
						aSuggestionItems.some(function(oItem, index) {
							if (oItem.getVisible()) {
								n++;
								i = index;
							}
							return n >= 2;
						});
						if (n === 1) {
							oDataModelRow = aSuggestionItems[i].getBindingContext().getObject();

							if (this._fSelect) {
								oData.suggestionObject = aSuggestionItems[i];
								if (this._fSelect(this, oData)) {
									return null;
								}
							}

							sKey = this._keyPath && oDataModelRow[this._keyPath] ? oDataModelRow[this._keyPath] : null;
							sDescription = this._descriptionPath && oDataModelRow[this._descriptionPath] ? oDataModelRow[this._descriptionPath] : null;
							sValue = "==" + sKey;

							oOperator = this._oFilterField.getFilterOperatorConfig().getOperator("EEQ");
							if (oOperator && oOperator.test(sValue, oType)) {
								oCondition = oBinding.getModel().addCondition(oBinding.getModel().createItemCondition(sFieldPath, sKey, sDescription));
								oSource.setValue("");
								this._oFilterField.fireChange({ value: oCondition, type: "added", valid: true });
								return null;
							}
						}
					}

					// first try to check if the input match to an operator
					var aOperators = this._oFilterField.getFilterOperatorConfig().getMatchingOperators(type, sText);

					// use default operator if nothing found
					if (aOperators.length !== 0) {
						oOperator = aOperators[0];
						oCondition = oOperator.getCondition(sText, oType);
						if (oCondition) {
							oCondition.fieldPath = sFieldPath;
							oBinding.getModel().addCondition(oCondition);
							oSource.setValue("");
							this._oFilterField.fireChange({ value: oCondition, type: "added", valid: true });
							return null;
						}
					}

					// handle the input as a full key value and EEQ
					oSource.setValue("");
					jQuery.sap.delayedCall(100, this, function() {
						var sValue = "==" + sText;

						var oOperator = this._oFilterField.getFilterOperatorConfig().getOperator("EEQ");
						if (oOperator && oOperator.test(sValue, oType)) {
							oCondition = oBinding.getModel().addCondition(oBinding.getModel().createItemCondition(sFieldPath, sText, sText));
							this._oFilterField.fireChange({ value: oCondition, type: "added", valid: true });
						}
					});
				}

				return null;
			}.bind(this));

		};

		return FixedValueListProvider;
	},
	/* bExport= */
	true);