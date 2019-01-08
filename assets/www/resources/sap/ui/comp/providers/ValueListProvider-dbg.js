/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
// -----------------------------------------------------------------------------
// Retrieves the data for a value list from the OData metadata to bind to a given control/aggregation
//
// -----------------------------------------------------------------------------
sap.ui.define([
	'jquery.sap.global', 'sap/m/Column', 'sap/m/ColumnListItem', 'sap/m/Text', 'sap/m/Token', './BaseValueListProvider', 'sap/ui/core/Item', 'sap/ui/model/Filter', 'sap/ui/model/Sorter', 'sap/ui/model/json/JSONModel', 'sap/ui/comp/util/FormatUtil'
], function(jQuery, Column, ColumnListItem, Text, Token, BaseValueListProvider, Item, Filter, Sorter, JSONModel, FormatUtil) {
	"use strict";

	/**
	 * Retrieves the data for a collection from the OData metadata to bind to a given control/aggregation
	 * @constructor
	 * @experimental This module is only for internal/experimental use!
	 * @public
	 * @param {object} mParams - map containing the control,aggregation,annotation and the oODataModel
	 * @author SAP SE
	 */
	var ValueListProvider = BaseValueListProvider.extend("sap.ui.comp.providers.ValueListProvider", {
		constructor: function(mParams) {
			if (mParams) {
				this.sAggregationName = mParams.aggregation;
				this.bTypeAheadEnabled = mParams.typeAheadEnabled;
				this.bEnableShowTableSuggestionValueHelp = mParams.enableShowTableSuggestionValueHelp === undefined ? true : mParams.enableShowTableSuggestionValueHelp;
			}
			BaseValueListProvider.apply(this, arguments);
			this._onInitialise();
		}
	});

	/**
	 * Initialise the relevant stuff
	 * @private
	 */
	ValueListProvider.prototype._onInitialise = function() {

		if (!this.bTypeAheadEnabled) {
			/**
			 * Delay the fetch of data for standard dropdowns until the rendering is done! This inherently causes only the relevant data to be fetched
			 * from the backend!
			 */
			this.oAfterRenderingEventDelegate = {
				onAfterRendering: this._onMetadataInitialised
			};
			this.oControl.addEventDelegate(this.oAfterRenderingEventDelegate, this);

		} else if (this.oControl.attachSuggest) {
			// Check if Suggest is supported by the control
			this._fSuggest = function(oEvent) {
				this.oControl = oEvent.getSource();
				if (!this.bInitialised) {
					return;
				}
				if (!this.oTemplate || !this.oControl.data("_hassuggestionTemplate")) {
					this._createSuggestionTemplate();
				}
				var sSearchText = oEvent.getParameter("suggestValue");
				this._fetchData(sSearchText);
			}.bind(this);
			this.oControl.attachSuggest(this._fSuggest);

			this._handleSelect();
		}
	};

	/**
	 * Metadata is available --> Initialise the relevant stuff
	 * @private
	 */
	ValueListProvider.prototype._onMetadataInitialised = function() {
		if (this.bInitialised) {

			if (this.oAfterRenderingEventDelegate) {
				this.oControl.removeEventDelegate(this.oAfterRenderingEventDelegate, this);
			}
			this._createDropDownTemplate();
			this._fetchData();

			if (this.oAfterRenderingEventDelegate) {
				delete this.oAfterRenderingEventDelegate;
			}
		}
	};

	ValueListProvider.prototype._isSortable = function(sName) {
		if (this.oPrimaryValueListAnnotation) {
			for (var i = 0; i < this.oPrimaryValueListAnnotation.valueListFields.length; i++) {
				if (this.oPrimaryValueListAnnotation.valueListFields[i].name === sName) {
					return this.oPrimaryValueListAnnotation.valueListFields[i].sortable !== false;
				}
			}

			return false;
		}

		return true;
	};

	/**
	 * Creates a template for drop down fields
	 * @private
	 */
	ValueListProvider.prototype._createDropDownTemplate = function() {
		this._oTemplate = new Item({
			key: "{" + this.sKey + "}",
			text: this._getDDLBTextBindingPath()
		});

		this._oSorter = null;

		// ComboBox/MultiComboBox:
		// Sort based on key if displayBehaviour is based on id
		if (this.sDDLBDisplayBehaviour === sap.ui.comp.smartfilterbar.DisplayBehaviour.idOnly || this.sDDLBDisplayBehaviour === sap.ui.comp.smartfilterbar.DisplayBehaviour.idAndDescription) {

			if (this._isSortable(this.sKey)) {
				this._oSorter = new Sorter(this.sKey);
			}
		} else {
			// Sort based on description by default
			if (this._isSortable(this.sDescription)) {
				this._oSorter = new Sorter(this.sDescription);
			} else if ((this.sDescription !== this.sKey) && this._isSortable(this.sKey)) {
				this._oSorter = new Sorter(this.sKey);
			}
		}
	};

	/**
	 * Creates a template for multi-column suggest
	 * @private
	 */
	ValueListProvider.prototype._createSuggestionTemplate = function() {
		var i = 0, iLen = 0, oTooltip, fSuggestWidth = 0;
		// Create a template
		this._oTemplate = new ColumnListItem();
		if (this._aCols) {
			// remove any exiting columns
			this.oControl.removeAllSuggestionColumns();
			iLen = this._aCols.length;
			for (i = 0; i < iLen; i++) {
				var bDemandPopin = false, sMinScreenWidth = "1px", sWidth = this._aCols[i].width;
				// In the phone mode don't set a fixed width for columns;
				// instead enable demand popin when there are over 2 columns, and not enough space
				if (sap.ui.Device.system.phone) {
					sWidth = undefined;
					if (i >= 2) {
						bDemandPopin = true;
						sMinScreenWidth = (i + 1) * 10 + "rem";
					}
				}
				// add Column headers
				this.oControl.addSuggestionColumn(new Column({
					header: new Text({
						wrapping: false,
						text: this._aCols[i].label,
						tooltip: this._aCols[i].tooltip || this._aCols[i].label
					}),
					demandPopin: bDemandPopin,
					popinDisplay: sap.m.PopinDisplay.Inline,
					minScreenWidth: sMinScreenWidth,
					width: sWidth
				}));
				// Tooltip is only possible for certain (string) fields
				// ignore it for all types other than string!
				oTooltip = null;
				if (this._aCols[i].type === "string") {
					oTooltip = {
						path: this._aCols[i].template
					};
				}
				// Add cells to the template
				this._oTemplate.addCell(new Text({
					wrapping: false,
					text: {
						path: this._aCols[i].template,
						type: this._aCols[i].oType
					},
					tooltip: oTooltip
				}));

				// we calculate the sum of all columns width (assumption is that the sWidth is always given in em)
				if (sWidth) {
					fSuggestWidth += parseFloat(sWidth.substring(0, sWidth.length - 2));
				}
			}

			// set the total width of all columns as Width for the suggest popover.
			// Add a small delta based on number of columns since there seems to be a padding added for some browsers
			if (fSuggestWidth > 0) {
				// BCP: 1770294638
				// this.oControl.setMaxSuggestionWidth(fSuggestWidth + iLen + "em");
				this.oControl.setProperty('maxSuggestionWidth', fSuggestWidth + iLen + "em", true);
			}
		}
		this.oControl.data("_hassuggestionTemplate", true);
	};

	/**
	 * Get Text binding path for dropdowns according to the DisplayBehaviour
	 * @private
	 * @returns {String} the DDLB text binding path
	 */
	ValueListProvider.prototype._getDDLBTextBindingPath = function() {
		return FormatUtil.getFormattedBindingExpressionFromDisplayBehaviour(this.sDDLBDisplayBehaviour, this.sKey, this.sDescription);
	};

	/**
	 * Handle validation/selection of Item
	 * @private
	 */
	ValueListProvider.prototype._handleSelect = function() {
		var fHandleRowSelect = function(oDataModelRow, fCallback) {
			var sKey, sText, oToken;
			if (oDataModelRow) {
				sKey = oDataModelRow[this.sKey];
				sText = oDataModelRow[this.sDescription];
			}
			// Key found
			if (sKey || (sKey === "")) {
				// MultiInput field --> Create a token with the selected key
				if (this.oControl.addToken) {
					// Format the text as per the displayBehaviour
					sText = FormatUtil.getFormattedExpressionFromDisplayBehaviour(this.sTokenDisplayBehaviour, sKey, sText);
					oToken = new Token({
						key: sKey,
						text: sText,
						tooltip: sText
					});
					oToken.data("row", oDataModelRow);
					if (fCallback) {
						fCallback(oToken);
					}
					// Clear the ValidationText
					delete this.oControl.__sValidationText;
				} else {
					// normal input field --> just set the value
					this.oControl.setValue(sKey);
					// Manually trigger the change event on sapUI5 control since it doesn't do this internally on setValue!
					this.oControl.fireChange({
						value: sKey,
						validated: true
					});
				}
			}
			// do this last --> since when used in an aggregation - some model updates (setting IN/OUT params to ODataModel) destroy this
			// instance/control!
			this._calculateAndSetFilterOutputData([
				oDataModelRow
			]);

		}.bind(this);
		var fAfterTokenValidate = function() {
			// trigger search on the SmartFilter if search was pending
			if (this.oFilterProvider && this.oFilterProvider._oSmartFilter && this.oFilterProvider._oSmartFilter.bIsSearchPending && this.oFilterProvider._oSmartFilter.search) {
				if (this.oFilterProvider._oSmartFilter.getLiveMode && this.oFilterProvider._oSmartFilter.getLiveMode()) {
					return;
				}

				this.oFilterProvider._oSmartFilter.search();
			}
		}.bind(this);
		// Selection handling has to be done manually for Multi-Column suggest!
		// add Validators --> Only available for Multi-Input
		if (this.oControl.addValidator) {
			var aValidators = this.oControl._tokenizer ? this.oControl._tokenizer._aTokenValidators.slice() : [];
			this.oControl.removeAllValidators();

			this._fValidator = function(oData) {
				if (!this.bInitialised) {
					return;
				}

				// queue the validator calls
				if (aValidators) {
					var oToken;
					aValidators.some(function(fValidator) {
						oToken = fValidator(oData);
						return oToken;
					}, this);

					if (oToken) {
						return oToken;
					}
				}

				var oRow = oData.suggestionObject, oDataModelRow, sInput = oData.text, aFilters = [], mParams;
				// Selection via suggestion row --> no round trip needed
				if (oRow) {
					// Get the actual datamodel row
					oDataModelRow = this.oODataModel.getData(oRow.getBindingContextPath());
					fHandleRowSelect(oDataModelRow, oData.asyncCallback);
				} else if (sInput) {
					// Validation required from backend
					// Check if input needs to be converted to upper case
					if (this.sDisplayFormat === "UpperCase") {
						sInput = sInput.toUpperCase();
					}
					// Check if the entered input text is same as the ValidationText
					if (this.oControl.__sValidationText !== sInput) {
						// Store the input as Validation text
						this.oControl.__sValidationText = sInput;
						// Set flag to indicate token validation is in progress
						this.oControl.__bValidatingToken = true;
						this._calculateFilterInputData();
						if (this.mFilterInputData && this.aFilterField) {
							aFilters = sap.ui.comp.smartfilterbar.FilterProvider.generateFilters(this.aFilterField, this.mFilterInputData);
						}
						aFilters.push(new Filter(this.sKey, sap.ui.model.FilterOperator.EQ, sInput));
						if (this.bSupportBasicSearch) {
							mParams = {
								"search-focus": this.sKey
							};
						}
						this.oODataModel.read("/" + this.sValueListEntitySetName, {
							filters: aFilters,
							urlParameters: mParams,
							success: function(oResponseData, response) {
								var oResultRow = oResponseData;
								// first remove the token validation flag
								delete this.oControl.__bValidatingToken;
								if (oResponseData) {
									// Check if result has rows
									if (oResponseData.results && oResponseData.results.length >= 1) {
										// handle response for creating tokens only if 1 unique result exists!
										if (oResponseData.results.length === 1) {
											oResultRow = oResponseData.results[0];
										}
										if (this.oControl.data("__validationError")) {
											this.oControl.data("__validationError", null);
											this.oControl.setValueState("None");
										}
									} else {
										this.oControl.setValueState("Error");
										this.oControl.data("__validationError", true);
									}
									// If returned row has the key do the selection!
									if (oResultRow && oResultRow[this.sKey]) {
										fHandleRowSelect(oResultRow, oData.asyncCallback);
									}
								}
								// Trigger after token validation handling
								fAfterTokenValidate();
							}.bind(this),
							error: function() {
								// Clear previous validation error state if current validation fails!
								if (this.oControl.data("__validationError")) {
									this.oControl.setValueState("None");
								}
								// Remove the token validation flag
								delete this.oControl.__bValidatingToken;
								// Trigger after token validation handling
								fAfterTokenValidate();
							}.bind(this)
						});
					} else {
						// Re-set the error state if same value is entered again!
						if (this.oControl.data("__validationError")) {
							this.oControl.setValueState(sap.ui.core.ValueState.Error);
						}
					}
				}
			}.bind(this);
			this.oControl.addValidator(this._fValidator);
		} else if (this.oControl.attachSuggestionItemSelected) {
			this._fSuggestionItemSelected = function(oEvent) {
				var oRow = oEvent.getParameter("selectedRow"), oDataModelRow;
				// MultiColumn Suggest
				if (oRow) {
					// Get the actual datamodel row
					oDataModelRow = oRow.getModel().getData(oRow.getBindingContextPath());
					fHandleRowSelect(oDataModelRow);
				}
			};
			// Single-Input --> just enable selection handling
			this.oControl.attachSuggestionItemSelected(this._fSuggestionItemSelected);
		}
		// custom result filter function for tabular suggestions - selection text;
		// the returned result will be shown on the input when the user uses the arrow key on suggest
		this.oControl.setRowResultFunction(function(oSelectedItem) {
			var oContext, sResult = "";
			if (oSelectedItem) {
				oContext = oSelectedItem.getBindingContext();
			}
			if (oContext && this.sKey) {
				sResult = oContext.getProperty(this.sKey);
			}
			return sResult;
		}.bind(this));
	};

	/**
	 * Bind the control to internally read the data (ODataModel takes care of this) from backend with optional search text to filter data
	 * @param {object} sSearchText - the optional search text
	 * @private
	 */
	ValueListProvider.prototype._fetchData = function(sSearchText) {
		var mParams = {}, aFilters = [], length, oEvents;
		if (this.bTypeAheadEnabled) {
			// Convert search text to UpperCase if displayFormat = "UpperCase"
			if (sSearchText && this.sDisplayFormat === "UpperCase") {
				sSearchText = sSearchText.toUpperCase();
			}
			if (this.bSupportBasicSearch) {
				mParams["custom"] = {
					"search-focus": this.sKey,
					"search": sSearchText
				};
			}
			this._calculateFilterInputData();
			if (this.mFilterInputData && this.aFilterField) {
				aFilters = sap.ui.comp.smartfilterbar.FilterProvider.generateFilters(this.aFilterField, this.mFilterInputData, {
					dateSettings: this._oDateFormatSettings
				});
			}
			// If SearchSupported = false; create a $filter for the keyfield with a StartsWith operator for the typed in/search text
			if (!this.bSupportBasicSearch) {
				aFilters.push(new Filter(this.sKey, sap.ui.model.FilterOperator.StartsWith, sSearchText));
			}
			// Restrict to 10 records for type Ahead
			length = 10;
			if (this.bEnableShowTableSuggestionValueHelp) {
				// Hide the Show All Items button if the number if items is less than the length (restriction)
				oEvents = {
					dataReceived: function(oEvent) {
						var oBinding = oEvent.getSource(), iBindingLength;
						if (oBinding) {
							iBindingLength = oBinding.getLength();
							if (iBindingLength && iBindingLength <= length) {
								this.oControl.setShowTableSuggestionValueHelp(false);
							} else {
								this.oControl.setShowTableSuggestionValueHelp(true);
							}
						}
					}.bind(this)
				};
			} else {
				// Hide the Show All Items as per configuration
				this.oControl.setShowTableSuggestionValueHelp(false);
			}
		}

		if (this.aSelect && this.aSelect.length) {
			mParams["select"] = this.aSelect.toString();
		}

		if (!this.sValueListEntitySetName) {
			jQuery.sap.log.error("ValueListProvider", "Empty sValueListEntitySetName for " + this.sAggregationName + " binding! (missing primaryValueListAnnotation)");
		}

		// Bind the specified aggregation with valueList path in the model
		this.oControl.bindAggregation(this.sAggregationName, {
			path: "/" + this.sValueListEntitySetName,
			length: length,
			parameters: mParams,
			filters: aFilters,
			sorter: this._oSorter,
			events: oEvents,
			template: this._oTemplate,
			templateShareable: false
		});
	};

	/**
	 * Destroys the object
	 */
	ValueListProvider.prototype.destroy = function() {
		if (this.oControl) {
			if (this.oControl.detachSuggest) {
				this.oControl.detachSuggest(this._fSuggest);
				this._fSuggest = null;
			}
			if (this.oControl.removeValidator) {
				this.oControl.removeValidator(this._fValidator);
				this._fValidator = null;
			} else if (this.oControl.detachSuggestionItemSelected) {
				this.oControl.detachSuggestionItemSelected(this._fSuggestionItemSelected);
				this._fSuggestionItemSelected = null;
			}
			this.oControl.unbindAggregation(this.sAggregationName);
			this.oControl.data("_hassuggestionTemplate", false);
			delete this.oControl.__sValidationText;
			delete this.oControl.__bValidatingToken;
		}
		BaseValueListProvider.prototype.destroy.apply(this, arguments);
		// Destroy other local data
		if (this.oJsonModel) {
			this.oJsonModel.destroy();
			this.oJsonModel = null;
		}

		if (this._oTemplate) {
			this._oTemplate.destroy();
		}

		this._oTemplate = null;
		this.sAggregationName = null;
		this.bTypeAheadEnabled = null;
		this._oSorter = null;
	};

	return ValueListProvider;

}, /* bExport= */true);
