/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["jquery.sap.global", "sap/ui/base/Object"],
	function(jQuery, BaseObject) {
		"use strict";

		/**
		 *
		 * @class Operator Suggest Provider for FilterField. Makes all type specific operators available via suggest.
		 * @extends sap.ui.base.Object
		 *
		 * @author SAP SE
		 * @version 1.52.4
		 * @since 1.48.0
		 * @alias sap.ui.mdc.base.OperatorSuggestProvider
		 *
		 * @private
		 * @experimental
		 * @sap-restricted
		 */
		var OperatorSuggestProvider = BaseObject.extend("sap.ui.mdc.base.OperatorSuggestProvider", /** @lends sap.ui.mdc.base.OperatorSuggestProvider.prototype */ {

			constructor: function(mParameters) {
				BaseObject.apply(this);

				this._bShowAll = true;
				this._bShowHint = false;

				if (mParameters) {
					this._bShowAll = mParameters.enableShowAll !== undefined ? mParameters.enableShowAll : true;
					this._bShowHint = mParameters.showHint !== undefined ? mParameters.showHint : false;
					if (mParameters.control) {
						this.associateFilterField(mParameters.control);
					}
				}

			}
		});

		OperatorSuggestProvider.prototype.destroy = function() {
			this._oFilterField = null;
			this._oInput = null;
		};

		OperatorSuggestProvider.prototype.associateFilterField = function(oFilterField) {
			this._oFilterField = oFilterField;
			this._oInput = oFilterField.getAggregation("_input");

			if (!this._oInput) {
				var that = this;
				setTimeout(function() { that.associateFilterField(oFilterField); }, 100);
			}

			if (!(this._oInput instanceof sap.m.MultiInput)) {
				jQuery.sap.log.error("mdc:OperatorSuggestProvider", "associateFilterField for " + (this._oInput ? this._oInput.getId() : "null") + " not possible!");
				return;
			}
			this._oInput.setShowSuggestion(true);
			this._oInput.setFilterSuggests(true);
			this._oInput.setEnableSuggestionsHighlighting(false);
			this._oInput.setMaxLength(0);
			this._oInput.setMaxSuggestionWidth("auto");
			if (this._bShowHint) {
				this._oInput.setPlaceholder("press space to get help");
			}
			this._aOperators = [];

			this._oInput.bindAggregation("suggestionItems", {
				path: "suggest>/",
				template: new sap.ui.core.ListItem({
					key: "{suggest>key}",
					text: "{suggest>text}",
					additionalText: "{suggest>additionalText}"
				}),
				templateShareable: false
			});

			this._oInput.attachSuggest(function(oEvent) {

				if (this._aOperators.length === 0) {
					// var sTerm = oEvent.getParameter("suggestValue");
					var oOperatorConfig = this._oFilterField.getFilterOperatorConfig();
					var aOperators = oOperatorConfig.getOperatorsForType(this._oFilterField._getDataType().getMetadata().getName());

					aOperators.forEach(function(element) {
						var oOperator = oOperatorConfig.getOperator(element);
						if (oOperator.showInSuggest !== undefined && oOperator.showInSuggest == false) {
							return;
						}
						var sTxtKey = oOperator.textKey || "operators." + oOperator.name + ".longText";
						var sText = oOperator.getTypeText(sTxtKey, this._oFilterField._getDataType().getName().toLowerCase());
						if (sText === sTxtKey) {
							sText = oOperator.longText;
						}
						this._aOperators.push({
							key: element,
							additionalText: sText
						});
					}, this);

					var oSuggestModel = new sap.ui.model.json.JSONModel();
					oSuggestModel.setData(this._aOperators);
					this._oInput.setModel(oSuggestModel, "suggest");
				}
			}.bind(this));

			this._oInput.addValidator(function(oData) {
				//TODO This empty validator is required!!!
				// if we remove it the multiInpupt will automatically create a token when you enter a simple value without operator.
			});

			this._oInput.setFilterFunction(function(sValue, oItem) {
				var sKey = oItem.getKey();
				var oType = this._oFilterField._getDataType();
				var type = oType.getMetadata().getName();
				var bShowAll = true;
				var sExample;

				sValue = sValue.trim();

				var oOperatorConfig = this._oFilterField.getFilterOperatorConfig();

				var aOperators = oOperatorConfig.getMatchingOperators(type, sValue);
				if (aOperators.length !== 0) {
					bShowAll = false;
				}

				var oOperator = oOperatorConfig.getOperator(sKey);
				if (oOperator) {

					if (bShowAll && this._bShowAll) {
						var v1 = sValue,
							v2 = "";
						if (v1 === "") {
							//TODO workaround for default value in suggest 
							//TODO getName() from the odata.type returns the fullname and not only "Date"
							if (oType.getName() === "Date") {
								v1 = new Date();
							} else if (oType.getName() === "Integer") {
								v1 = 123;
							} else if (oType.getName() === "Float") {
								v1 = 123.45;
							} else if (oType.getName() === "Boolean") {
								v1 = true;
							} else {
								v1 = "abc";
							}
						}
						if (v2 === "") {
							//TODO workaround for default value in suggest 
							//TODO getName() from the odata.type returns the fullname and not only "Date"
							if (oType.getName() === "Date") {
								v2 = new Date();
								if (typeof v1 === "string") {
									v2.setFullYear(v2.getFullYear() + 1);
									v2 = oType.formatValue(v2, "string");
								} else {
									v2.setFullYear(v1.getFullYear() + 1);
								}
							} else if (oType.getName() === "Integer") {
								v2 = v1 + 1000;
							} else if (oType.getName() === "Float") {
								v2 = v1 + 1000;
							} else if (oType.getName() === "Boolean") {
								v2 = false;
							} else {
								v2 = "xyz";
							}
						}

						try {
							sExample = oOperator.format([v1, v2], null, typeof v1 === "string" ? null : oType);
						} catch (error) {
							sExample = oOperator.format([]);
						}
						oItem.setText(sExample);
						return true;
					}

					if (oOperator.test(sValue, oType)) {
						var aValues = oOperator.parse(sValue, oType);
						sExample = oOperator.format(aValues, null, oType);
						oItem.setText(sExample);
						return true;
					}
					return false;
				} else {
					return false;
				}
			}.bind(this));

		};

		return OperatorSuggestProvider;
	},
	/* bExport= */
	true);