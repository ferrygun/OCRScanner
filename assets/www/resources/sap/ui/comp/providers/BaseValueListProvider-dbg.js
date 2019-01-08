/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
// -----------------------------------------------------------------------------
// Retrieves the metadata necessary for a value list from the OData metadata
// -----------------------------------------------------------------------------
sap.ui.define([
	'jquery.sap.global', 'sap/ui/base/EventProvider', 'sap/ui/comp/odata/ODataType', 'sap/ui/comp/odata/MetadataAnalyser', 'sap/ui/comp/util/FormatUtil'
], function(jQuery, EventProvider, ODataType, MetadataAnalyser, FormatUtil) {
	"use strict";

	/**
	 * Retrieves the data for a collection from the OData metadata to bind to a given control/aggregation
	 * @constructor
	 * @experimental This module is only for internal/experimental use!
	 * @public
	 * @param {object} mParams - map containing the control,aggregation,annotation and the oODataModel
	 * @author SAP SE
	 */
	var BaseValueListProvider = EventProvider.extend("sap.ui.comp.providers.BaseValueListProvider", {
		constructor: function(mParams) {
			EventProvider.call(this);
			this.sFieldName = mParams.fieldName;
			this.oControl = mParams.control;
			this.sValueListEntitySetName = null;
			this.oODataModel = mParams.model;
			this.oFilterModel = mParams.filterModel;
			this.oFilterProvider = mParams.filterProvider;
			this.sDisplayFormat = mParams.displayFormat;
			this._oDateFormatSettings = mParams.dateFormatSettings;
			this._fieldViewMetadata = mParams.fieldViewMetadata;
			if (!this._oDateFormatSettings) {
				this._oDateFormatSettings = {};
			}
			// Default to UTC true if nothing is provided --> as sap:display-format="Date" should be used without a timezone
			if (!this._oDateFormatSettings.hasOwnProperty("UTC")) {
				this._oDateFormatSettings["UTC"] = true;
			}

			// Default resolution of InOut params when used in standard OData scenarios
			this.bResolveInOutParams = (mParams.resolveInOutParams === false) ? false : true;
			// The configured display behaviour
			this.sDisplayBehaviour = mParams.displayBehaviour;
			// the calculated display behaviour for DDLB
			this.sDDLBDisplayBehaviour = this.sDisplayBehaviour;
			if (!this.sDDLBDisplayBehaviour || this.sDDLBDisplayBehaviour === sap.ui.comp.smartfilterbar.DisplayBehaviour.auto) {
				this.sDDLBDisplayBehaviour = this.oFilterProvider ? this.oFilterProvider.sDefaultDropDownDisplayBehaviour : sap.ui.comp.smartfilterbar.DisplayBehaviour.descriptionOnly;
			}
			// If the property if part of a complex type this would be filled
			this.sPropertyTypePath = "";
			if (this.bResolveInOutParams && !this.oFilterModel && !this.oFilterProvider) {
				this._resolvePropertyPath();
			}

			if (mParams.loadAnnotation && mParams.fullyQualifiedFieldName) {
				this._oMetadataAnalyser = mParams.metadataAnalyser;
				this._sFullyQualifiedFieldName = mParams.fullyQualifiedFieldName;
				this._attachAnnotationLoadOnRender();
			} else {
				this._onAnnotationLoad({
					primaryValueListAnnotation: mParams.annotation,
					additionalAnnotations: mParams.additionalAnnotations
				});
			}

			if (!sap.ui.comp.smartfilterbar || !sap.ui.comp.smartfilterbar.FilterProvider) {
				jQuery.sap.require("sap.ui.comp.smartfilterbar.FilterProvider");
			}
		}
	});

	/**
	 * Attach to control render events to trigger load
	 * @private
	 */
	BaseValueListProvider.prototype._attachAnnotationLoadOnRender = function() {
		/**
		 * Delay the fetch of valuelist metadata until the control is being rendered!
		 */
		this.oBeforeRenderingEventDelegate = {
			onBeforeRendering: function() {
				this.oControl.removeEventDelegate(this.oBeforeRenderingEventDelegate, this);
				delete this.oBeforeRenderingEventDelegate;

				if (!this._bValueListRequested) {

					if (this.bInitialised) {
						if (this._onMetadataInitialised && this.sAggregationName && !this.bTypeAheadEnabled && this.oControl.$()) {
							this._onMetadataInitialised();
						}
					} else {
						this._loadAnnotation();
					}

				}
			}
		};
		this.oControl.addEventDelegate(this.oBeforeRenderingEventDelegate, this);
	};

	/**
	 * Ensure the metadata is loaded. In case the metadata are not yet loaded, the load will be initiated.<br>
	 * <b>Note:</b>the request for metadata is triggered asynchronously.
	 * @private
	 */
	BaseValueListProvider.prototype.loadAnnotation = function() {
		if (this.oBeforeRenderingEventDelegate) {
			this.oControl.removeEventDelegate(this.oBeforeRenderingEventDelegate, this);
			delete this.oBeforeRenderingEventDelegate;
		}

		if (this.oAfterRenderingEventDelegate) {
			this.oControl.removeEventDelegate(this.oAfterRenderingEventDelegate, this);
			delete this.oAfterRenderingEventDelegate;
		}

		this._loadAnnotation();
	};

	/**
	 * Load the annotation from ODataModel
	 * @private
	 */
	BaseValueListProvider.prototype._loadAnnotation = function() {

		if (!this._bValueListRequested) {

			this._bValueListRequested = true;

			if (!this._oMetadataAnalyser) {
				this._oMetadataAnalyser = new MetadataAnalyser(this.oODataModel);
				this._bCleanupMetadataAnalyser = true;
			}

			this._oMetadataAnalyser.getValueListAnnotationLazy(this._sFullyQualifiedFieldName).then(this._onAnnotationLoad.bind(this), function(oError) {
				this._oError = oError;
				this.bInitialised = true;
				jQuery.sap.log.debug(oError);
			}.bind(this));
		}
	};

	/**
	 * Attaches event handler <code>fnFunction</code> to the <code>valueListChanged</code> event.<br>
	 * This event is relevant only while setting data back (OUT parameters) to the ODataModel
	 * @param {function} fnFunction the function to call when the event occurs
	 * @param {object} [oListener] object on which to call the given function
	 * @public
	 * @since 1.32.0
	 */
	BaseValueListProvider.prototype.attachValueListChanged = function(fnFunction, oListener) {
		this.attachEvent("valueListChanged", fnFunction, oListener);
	};

	/**
	 * Detaches event handler <code>fnFunction</code> from the <code>valueListChanged</code> event.<br>
	 * This event is relevant only while setting data back (OUT parameters) to the ODataModel
	 * @param {function} fnFunction the function to call when the event occurs
	 * @param {object} [oListener] object on which to call the given function
	 * @public
	 * @since 1.32.0
	 */
	BaseValueListProvider.prototype.detachValueListChanged = function(fnFunction, oListener) {
		this.detachEvent("valueListChanged", fnFunction, oListener);
	};

	/**
	 * Called once valuelist annotation is loaded!
	 * @private
	 * @param {Object} mValueList - value list annotation from metadata
	 */
	BaseValueListProvider.prototype._onAnnotationLoad = function(mValueList) {
		this.oPrimaryValueListAnnotation = mValueList.primaryValueListAnnotation;
		this.additionalAnnotations = mValueList.additionalAnnotations;
		this._resolveAnnotationData(this.oPrimaryValueListAnnotation);
		this.bInitialised = true;
		if (this._onMetadataInitialised && this.sAggregationName && !this.bTypeAheadEnabled && this.oControl.$()) {
			this._onMetadataInitialised();
		}
	};

	/**
	 * Resolve the path from control's binding info to find out if the property is part of a ComplexType. (This is valid only for ODataModel In/Out
	 * parameter handling)
	 * @private
	 */
	BaseValueListProvider.prototype._resolvePropertyPath = function() {
		var oBindingInfo = this.oControl.getBindingInfo("value"), sPath, sProperty, aPaths;
		if (oBindingInfo && oBindingInfo.parts) {
			sPath = oBindingInfo.parts[0] ? oBindingInfo.parts[0].path : "";
		}
		if (sPath) {
			aPaths = sPath.split("/");
			if (aPaths.length > 1) {
				sProperty = aPaths[aPaths.length - 1];
				this.sPropertyTypePath = sPath.replace("/" + sProperty, "");
			}
		}
	};

	/**
	 * Resolve the annotation data and recalculate the required metadata
	 * @param {Object} oAnnotation - the selected annotation which needs to be processed
	 * @private
	 */
	BaseValueListProvider.prototype._resolveAnnotationData = function(oAnnotation) {
		var iLen = 0, i = 0, aCols, oField, sType, oType, oConstraints, oFormatOptions;
		if (this.oODataModel && oAnnotation) {
			this.bSupportBasicSearch = oAnnotation.isSearchSupported;
			this.sValueListTitle = oAnnotation.valueListTitle || oAnnotation.qualifier;
			this.sKey = oAnnotation.keyField;
			this._aKeys = oAnnotation.keys;
			this.sValueListEntitySetName = oAnnotation.valueListEntitySetName;
			this.mInParams = oAnnotation.inParams;
			this.mOutParams = oAnnotation.outParams;

			// the calculated display behaviour for tokens
			this.sTokenDisplayBehaviour = this.sDisplayBehaviour;
			if (!this.sTokenDisplayBehaviour || this.sTokenDisplayBehaviour === sap.ui.comp.smartfilterbar.DisplayBehaviour.auto) {
				this.sTokenDisplayBehaviour = this.oFilterProvider ? this.oFilterProvider.sDefaultTokenDisplayBehaviour : sap.ui.comp.smartfilterbar.DisplayBehaviour.descriptionAndId;
			}

			// fallback to idOnly if no description is present for tokens
			if (!oAnnotation.descriptionField) {
				this.sTokenDisplayBehaviour = sap.ui.comp.smartfilterbar.DisplayBehaviour.idOnly;
			}

			this.sDescription = oAnnotation.descriptionField || this.sKey; // fall back to key if there is no description

			if (this.sValueListEntitySetName && this.sKey) {
				// Get the Columns information (all fields on the UI)
				this._aCols = [];
				this.aSelect = [];
				aCols = oAnnotation.valueListFields;
				iLen = aCols.length;
				for (i = 0; i < iLen; i++) {
					oField = aCols[i];
					// Type Handling: Special handling for date and boolean fields
					sType = null;
					oType = null;
					oConstraints = undefined;
					oFormatOptions = undefined;
					if (oField.type === "Edm.Boolean") {
						sType = "boolean";
					} else if (oField.type === "Edm.DateTime" && oField.displayFormat === "Date") {
						sType = "date";
						oFormatOptions = this._oDateFormatSettings;
						oConstraints = {
							displayFormat: "Date"
						};
					} else if (oField.type === "Edm.Decimal") {
						sType = "decimal";
						oConstraints = {
							precision: oField.precision,
							scale: oField.scale
						};
					} else if (oField.type === "Edm.String") {
						sType = "string";
					}

					oType = ODataType.getType(oField.type, oFormatOptions, oConstraints);

					// Do not show statically hidden fields (visible = false) as columns
					if (oField.visible) {
						this._aCols.push({
							label: oField.fieldLabel,
							tooltip: oField.quickInfo || oField.fieldLabel,
							type: sType,
							oType: oType,
							width: FormatUtil.getWidth(oField, 15),
							template: oField.name,
							sort: oField.sortable /* oField["sap:sortable"] !== "false" */? oField.name : undefined,
							sorted: oField.sortable && oField.name === this.sKey, // false,
							sortOrder: "Ascending" // sap.ui.table.SortOrder.Ascending
						});
					}
					// Request data for fields regardless of visibility (since it could be needed for OUT param handling)!
					this.aSelect.push(oField.name);
				}
				if (oAnnotation.descriptionField) {
					this.aSelect.push(oAnnotation.descriptionField);
				}
			} else {
				if (!this.sKey) {
					jQuery.sap.log.error("BaseValueListProvider", "key for ValueListEntitySetName '" + this.sValueListEntitySetName + "' missing! Please check your annotations");
				}
			}
		}
	};

	BaseValueListProvider.prototype._getFilterData = function() {
		var oData, oFilterData = {};

		if (this.oFilterProvider && this.oFilterProvider._oSmartFilter) {
			oData = this.oFilterProvider._oSmartFilter.getFilterData();

			if (this._fieldViewMetadata && this._fieldViewMetadata.fieldName && (this._fieldViewMetadata.fieldName.indexOf(sap.ui.comp.ANALYTICAL_PARAMETER_PREFIX) === 0)) {

				Object.keys(oData).forEach(function(sName) {
					var name = sName.split(sap.ui.comp.ANALYTICAL_PARAMETER_PREFIX);
					oFilterData[name[name.length - 1]] = oData[sName];
				});

				return oFilterData;
			}

		}

		return oData;
	};

	BaseValueListProvider.prototype._setFilterData = function(mFilterOutputData) {
		var oData = mFilterOutputData, oFilterData = {};

		if (this.oFilterProvider) {

			if (this._fieldViewMetadata && this._fieldViewMetadata.fieldName && (this._fieldViewMetadata.fieldName.indexOf(sap.ui.comp.ANALYTICAL_PARAMETER_PREFIX) === 0)) {

				Object.keys(mFilterOutputData).forEach(function(sName) {
					oFilterData[sap.ui.comp.ANALYTICAL_PARAMETER_PREFIX + sName] = mFilterOutputData[sName];
				});

				oData = oFilterData;
			}

			this.oFilterProvider.setFilterData(oData);
		}
	};

	/**
	 * Called by the control when needed, to get input data for filtering
	 * @private
	 */
	BaseValueListProvider.prototype._calculateFilterInputData = function() {
		var sLocalFieldName, sValueListFieldName, oData = null;
		// Search view can be switched for collective search help; reset the mFilterInputData in that case.
		delete this.mFilterInputData;
		// Check if the SmartFilter is present and try to get data for only visible fields from SmartFilter
		// else use the filterModel to get data
		if (this.oFilterProvider && this.oFilterProvider._oSmartFilter) {
			oData = this._getFilterData();
			// oData = this.oFilterProvider._oSmartFilter.getFilterData();
		} else if (this.oFilterModel) {
			oData = this.oFilterModel.getData();
		} else if (this.oODataModel && this.bResolveInOutParams) {
			oData = this.oODataModel.getData(this.sPropertyTypePath, this.oControl.getBindingContext());
		}
		if (this.mInParams && oData) {
			this.mFilterInputData = {};
			this.aFilterField = [];
			for (sLocalFieldName in this.mInParams) {
				if (sLocalFieldName) {
					sValueListFieldName = this.mInParams[sLocalFieldName];
					if (sValueListFieldName !== this.sKey) {
						// Only set IN parameter data if it is non empty
						if (oData[sLocalFieldName]) {
							this.mFilterInputData[sValueListFieldName] = oData[sLocalFieldName];
							this.aFilterField.push(sValueListFieldName);
						}
					}
				}
			}
		}
	};

	/**
	 * Called when data needs to be set back to the SmartFilter from ValueHelp/suggest
	 * @param {Array} aData - array of row data that has be set back
	 * @private
	 */
	BaseValueListProvider.prototype._calculateAndSetFilterOutputData = function(aData) {
		var sLocalFieldName, sValueListFieldName, mFilterOutputData = null, oData, oExistingData, oNewData, i, fFilterDuplicates;
		if (this.mOutParams && aData && (this.oFilterProvider || this.oFilterModel)) {
			mFilterOutputData = {};
			fFilterDuplicates = function(obj) {
				return obj.key === oNewData.key;
			};
			for (sLocalFieldName in this.mOutParams) {
				if (sLocalFieldName) {
					sValueListFieldName = this.mOutParams[sLocalFieldName];
					if (sValueListFieldName !== this.sKey) {
						oExistingData = null;
						i = aData.length;
						while (i--) {
							oData = aData[i];
							// Only set Out parameter data if it exists in the passed data
							if (oData[sValueListFieldName]) {
								oNewData = {
									key: oData[sValueListFieldName]
								};
								if (!mFilterOutputData[sLocalFieldName]) {
									// Get Existing filter data
									if (!oExistingData && this.oFilterModel) {
										oExistingData = this.oFilterModel.getData();
									}
									// if existing data already contains the property as a multi-value --> amend to it
									if (oExistingData && oExistingData[sLocalFieldName] && oExistingData[sLocalFieldName].items) {
										mFilterOutputData[sLocalFieldName] = oExistingData[sLocalFieldName];
									} else {
										mFilterOutputData[sLocalFieldName] = {
											items: []
										};
									}
								}
								// Check for duplicates before adding new data
								if (mFilterOutputData[sLocalFieldName].items.filter(fFilterDuplicates).length <= 0) {
									var bFound = false;

									if (this.oFilterProvider && oExistingData && oExistingData[sLocalFieldName] && oExistingData[sLocalFieldName].ranges) {
										/* eslint-disable no-loop-func */
										oExistingData[sLocalFieldName].ranges.some(function(oRange) {
											if (oRange.operation === "EQ" && oRange.value1 === oNewData.key) {
												bFound = true;
											}

											return bFound;
										});
										/* eslint-enable no-loop-func */
									}

									if (!bFound) {
										mFilterOutputData[sLocalFieldName].items.push(oNewData);
									}
								}
							}
						}
					}
				}
			}

			if (mFilterOutputData) {
				// Use API from FilterProvider if it exists
				if (this.oFilterProvider) {
					this._setFilterData(mFilterOutputData);
					// this.oFilterProvider.setFilterData(mFilterOutputData);

					if (!jQuery.isEmptyObject(mFilterOutputData)) {
						this.fireEvent("valueListChanged", {
							"changes": Object.keys(mFilterOutputData)
						});
					}
				} else if (this.oFilterModel) {
					// try to merge data into the filter model
					this.oFilterModel.setData(mFilterOutputData, true);
				}
			}
		} else if (this.oODataModel && this.bResolveInOutParams) {
			// ODataModel --> assume only 1 value can be set back!
			this._calculateAndSetODataModelOutputData(aData[0]);
		}
	};

	/**
	 * Called when data needs to be set back to the Model (ODataModel) from ValueHelp/suggest
	 * @param {Object} oData - the row data that needs to be set back
	 * @private
	 */
	BaseValueListProvider.prototype._calculateAndSetODataModelOutputData = function(oData) {
		var oBindingContext, sLocalFieldName, sValueListFieldName, sPathToResolve, oValue, mChangedFields = {};
		if (oData && this.mOutParams) {
			oBindingContext = this.oControl.getBindingContext();
			for (sLocalFieldName in this.mOutParams) {
				if (sLocalFieldName) {
					sValueListFieldName = this.mOutParams[sLocalFieldName];
					if (sValueListFieldName !== this.sKey) {
						oValue = oData[sValueListFieldName];
						mChangedFields[sLocalFieldName] = oValue;
						sPathToResolve = this.sPropertyTypePath ? this.sPropertyTypePath + "/" + sLocalFieldName : sLocalFieldName;
						this.oODataModel.setProperty(sPathToResolve, oValue, oBindingContext, true);
					}
				}
			}
			if (mChangedFields && !jQuery.isEmptyObject(mChangedFields)) {
				this.fireEvent("valueListChanged", {
					"changes": mChangedFields
				});
			}
		}
	};

	/**
	 * Destroys the object
	 */
	BaseValueListProvider.prototype.destroy = function() {
		sap.ui.base.EventProvider.prototype.destroy.apply(this, arguments);
		if (this._bCleanupMetadataAnalyser && this._oMetadataAnalyser) {
			this._oMetadataAnalyser.destroy();
		}
		this._oMetadataAnalyser = null;
		this.oControl = null;
		this.sFieldName = null;
		this.mFilterInputData = null;
		this.aFilterField = null;
		this.sValueListEntitySetName = null;
		this.oODataModel = null;
		this.oFilterModel = null;
		this.oFilterProvider = null;
		this.oPrimaryValueListAnnotation = null;
		this.additionalAnnotations = null;
		this.sDisplayFormat = null;
		this.bSupportBasicSearch = null;
		this.bInitialised = null;
		this._oError = null;
		this.sValueListTitle = null;
		this.sKey = null;
		this._aKeys = null;
		this.mInParams = null;
		this.mOutParams = null;
		this.sDescription = null;
		this.aSelect = null;
		this._aCols = null;
		this.sDDLBDisplayBehaviour = null;
		this.sTokenDisplayBehaviour = null;
		this._oDateFormatSettings = null;

		this.bIsDestroyed = true;
	};

	return BaseValueListProvider;

}, /* bExport= */true);
