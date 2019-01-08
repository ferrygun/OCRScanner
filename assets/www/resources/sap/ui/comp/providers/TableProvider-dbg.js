/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// -----------------------------------------------------------------------------
// Generates the view metadata required for SmartTable using SAP-Annotations metadata
// -----------------------------------------------------------------------------
sap.ui.define([
	'jquery.sap.global', 'sap/ui/comp/odata/MetadataAnalyser', './ControlProvider', 'sap/ui/comp/util/FormatUtil'
], function(jQuery, MetadataAnalyser, ControlProvider, FormatUtil) {
	"use strict";

	/**
	 * Constructs a class to generate the view/data model metadata for the SmartTable from the SAP-Annotations metadata
	 * 
	 * @constructor
	 * @experimental This module is only for internal/experimental use!
	 * @public
	 * @param {object} mPropertyBag - PropertyBag having members model, entitySet
	 * @author SAP SE
	 */
	var TableProvider = function(mPropertyBag) {
		if (mPropertyBag) {
			this._oParentODataModel = mPropertyBag.model;
			this.sEntitySet = mPropertyBag.entitySet;
			this._sIgnoredFields = mPropertyBag.ignoredFields;
			this._sInitiallyVisibleFields = mPropertyBag.initiallyVisibleFields;
			this.isEditableTable = mPropertyBag.isEditableTable;
			this._smartTableId = mPropertyBag.smartTableId;
			this._isAnalyticalTable = mPropertyBag.isAnalyticalTable;
			this._isMobileTable = mPropertyBag.isMobileTable;
			this.useSmartField = mPropertyBag.useSmartField;
			this.useSmartToggle = mPropertyBag.useSmartToggle;
			this._bSkipAnnotationParse = mPropertyBag.skipAnnotationParse === "true";
			this._sLineItemQualifier = mPropertyBag.lineItemQualifier;
			this._sPresentationVariantQualifier = mPropertyBag.presentationVariantQualifier;
			this.enableInResultForLineItem = mPropertyBag.enableInResultForLineItem === "true";
			this._oSemanticKeyAdditionalControl = mPropertyBag._semanticKeyAdditionalControl;
			try {
				this._oDateFormatSettings = mPropertyBag.dateFormatSettings ? JSON.parse(mPropertyBag.dateFormatSettings) : undefined;
				this._oCurrencyFormatSettings = mPropertyBag.currencyFormatSettings ? JSON.parse(mPropertyBag.currencyFormatSettings) : undefined;
				this._oDefaultDropDownDisplayBehaviour = mPropertyBag.defaultDropDownDisplayBehaviour;
			} catch (ex) {
				// Invalid dateformat provided!
			}
		}
		if (!this._oDateFormatSettings) {
			this._oDateFormatSettings = {};
		}
		// Default to UTC true if nothing is provided --> as sap:display-format="Date" should be used without a timezone
		if (!this._oDateFormatSettings.hasOwnProperty("UTC")) {
			this._oDateFormatSettings["UTC"] = true;
		}
		this._aODataFieldMetadata = [];
		this._aTableViewMetadata = [];
		this._aIgnoredFields = [];
		this._aInitiallyVisibleFields = [];
		this._oMetadataAnalyser = new MetadataAnalyser(this._oParentODataModel);
		this._oSemanticObjectController = mPropertyBag.semanticObjectController;
		this._intialiseMetadata();
	};

	/**
	 * Initialises the necessary table metadata
	 * 
	 * @private
	 */
	TableProvider.prototype._intialiseMetadata = function() {
		var aTableViewMetadata = [], i, iLen, oField, oTableViewField, fSorter, sSupportedFormats, sFullyQualifiedEntityTypeName;
		this._aODataFieldMetadata = this._oMetadataAnalyser.getFieldsByEntitySetName(this.sEntitySet);
		sFullyQualifiedEntityTypeName = this._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.sEntitySet);
		if (!this._bSkipAnnotationParse) {
			this._oPresentationVariant = this._oMetadataAnalyser.getPresentationVariantAnnotation(sFullyQualifiedEntityTypeName, this._sPresentationVariantQualifier);
			if (this._oPresentationVariant) {
				this._oLineItemAnnotation = this._oPresentationVariant.lineItemAnnotation;
			}
			if (!this._oLineItemAnnotation) {
				this._oLineItemAnnotation = this._oMetadataAnalyser.getLineItemAnnotation(sFullyQualifiedEntityTypeName, this._sLineItemQualifier);
			}
		}
		// for ResponsiveTable - also get SemanticKey and add navigationProperty fields from LineItem annotation to metadata
		if (this._isMobileTable) {
			this._oSemanticKeyAnnotation = this._oMetadataAnalyser.getSemanticKeyAnnotation(sFullyQualifiedEntityTypeName);
			this._addLineItemNavigationFields(sFullyQualifiedEntityTypeName);
		}
		sSupportedFormats = this._oMetadataAnalyser.getEntityContainerAttribute("supported-formats");
		if (sSupportedFormats) {
			this._bSupportsExcelExport = sSupportedFormats.indexOf("xlsx") > -1;
		}
		if (!this._oDefaultDropDownDisplayBehaviour) {
			this._oDefaultDropDownDisplayBehaviour = this._oMetadataAnalyser.getTextArrangementValue(sFullyQualifiedEntityTypeName);
		}

		this._generateArrays();

		this._oControlProvider = new ControlProvider({
			metadataAnalyser: this._oMetadataAnalyser,
			model: this._oParentODataModel,
			fieldsMetadata: this._aODataFieldMetadata,
			lineItemAnnotation: this._oLineItemAnnotation,
			semanticKeyAnnotation: this._oSemanticKeyAnnotation,
			_semanticKeyAdditionalControl: this._oSemanticKeyAdditionalControl,
			isMobileTable: this._isMobileTable,
			isAnalyticalTable: this._isAnalyticalTable,
			smartTableId: this._smartTableId,
			dateFormatSettings: this._oDateFormatSettings,
			currencyFormatSettings: this._oCurrencyFormatSettings,
			defaultDropDownDisplayBehaviour: this._oDefaultDropDownDisplayBehaviour,
			useSmartField: this.useSmartField,
			useSmartToggle: this.useSmartToggle,
			enableDescriptions: !this._isAnalyticalTable,
			entitySet: this.sEntitySet,
			semanticObjectController: this._oSemanticObjectController
		});

		this._oFieldSemanticObjectMap = {};

		if (this._aODataFieldMetadata) {
			iLen = this._aODataFieldMetadata.length;
		}
		for (i = 0; i < iLen; i++) {
			oField = this._aODataFieldMetadata[i];
			// Ignore the fields in the ignored list -or- the one marked with visible="false" in annotation -or- "hidden"-annotated fields that not be
			// rendered on the UI
			if (this._aIgnoredFields.indexOf(oField.name) > -1 || !oField.visible || oField.hidden) {
				continue;
			}

			// Check if field is not a Primitive type --> only generate metadata for primitive/simple type fields
			if (oField.type.indexOf("Edm.") === 0) {
				oTableViewField = this._oControlProvider.getFieldViewMetadata(oField, this.isEditableTable);
				this._enrichWithTableViewMetadata(oTableViewField);
				aTableViewMetadata.push(oTableViewField);
				if (oTableViewField.semanticObject) {
					this._oFieldSemanticObjectMap[oTableViewField.name] = oTableViewField.semanticObject;
				}
			}
		}

		// Sorter function for sorting based on index (undefined has lower prio)
		fSorter = function(field1, field2) {
			if (field1.index || field1.index === 0) {
				if (field2.index || field2.index === 0) {
					// both fields have an index --> return the difference
					return field1.index - field2.index;
				}
				// Only field1 has an index --> it should be shown before field2
				return -1;
			}
			if (field2.index || field2.index === 0) {
				// Only field2 has an index --> field1 should be shown after field2
				return 1;
			}
			// both are equal (in our case no index present) --> keep the existing order
			return 0;
		};
		// Sort the array based on LineItem annotation order
		this._aTableViewMetadata = aTableViewMetadata.sort(fSorter);
	};

	/**
	 * Adds the navigationProperty fields from LineItem annotation to the OData Field array
	 * 
	 * @param {String} sFullyQualifiedEntityTypeName the full path of the entity type (including the namespace)
	 * @private
	 */
	TableProvider.prototype._addLineItemNavigationFields = function(sFullyQualifiedEntityTypeName) {
		var aFields, iLen, sField, oField;
		if (this._aODataFieldMetadata && this._oLineItemAnnotation) {
			aFields = this._oLineItemAnnotation.fields;
			if (aFields) {
				iLen = aFields.length;
			}
			// Check if any LineItem DataField contains a "/" (assumed to be navigationProperty path)
			while (iLen--) {
				sField = aFields[iLen];
				if (sField && sField.indexOf("/") >= 0) {
					oField = this._oMetadataAnalyser.extractNavigationPropertyField(sField, this.sEntitySet);
					// If a navigationProperty field is present - append the path so that binding and other checks work correctly!
					if (oField) {
						oField.name = oField.parentPropertyName + "/" + oField.name;
						if (oField.description) {
							oField.description = oField.parentPropertyName + "/" + oField.description;
						}
						if (oField.unit) {
							oField.unit = oField.parentPropertyName + "/" + oField.unit;
						}
						// Add the navigationProperty data field to the list of fields from the entity
						this._aODataFieldMetadata.push(oField);
					}
				}
			}
		}
	};

	/**
	 * Get the field semantic object map.
	 * 
	 * @returns {object} the semantic object map
	 * @public
	 */
	TableProvider.prototype.getFieldSemanticObjectMap = function() {
		return this._oFieldSemanticObjectMap;
	};

	/**
	 * Get the fields that can be added as Columns
	 * 
	 * @returns {Array} the table view metadata
	 * @public
	 */
	TableProvider.prototype.getTableViewMetadata = function() {
		return this._aTableViewMetadata;
	};

	/**
	 * Returns a flag indicating whether excel export is supported by this table (OData service).
	 * 
	 * @returns {boolean} whether excel export is supported
	 * @public
	 */
	TableProvider.prototype.getSupportsExcelExport = function() {
		return this._bSupportsExcelExport;
	};

	/**
	 * Returns a flag indicating whether date handling with UTC is enabled for the table.
	 * 
	 * @returns {boolean} whether UTC date handling is enabled
	 * @public
	 */
	TableProvider.prototype.getIsUTCDateHandlingEnabled = function() {
		return this._oDateFormatSettings ? this._oDateFormatSettings.UTC : false;
	};

	/**
	 * Get the fields that has to be always requested via $select
	 * 
	 * @returns {Array} the table view metadata
	 * @public
	 */
	TableProvider.prototype.getRequestAtLeastFields = function() {

		return (this._oPresentationVariant && this._oPresentationVariant.requestAtLeastFields) ? this._oPresentationVariant.requestAtLeastFields : [];

	};

	/**
	 * Generate an array of fields that need to be ignored and initially made visible in the SmartTable (if any)
	 * 
	 * @private
	 */
	TableProvider.prototype._generateArrays = function() {
		if (this._sIgnoredFields) {
			this._aIgnoredFields = this._sIgnoredFields.split(",");
		}
		if (this._sInitiallyVisibleFields) {
			this._aInitiallyVisibleFields = this._sInitiallyVisibleFields.split(",");
		}
	};

	/**
	 * Calculates additional flags and attributes for a field e.g. whether TypeAhead is switched on
	 * 
	 * @param {object} oFieldViewMetadata - the table view field
	 * @private
	 */
	TableProvider.prototype._enrichWithTableViewMetadata = function(oFieldViewMetadata) {
		var aAdditionalProperty = [], aNavigationProperty = [], sPath, iLength;
		var fExtractNavigationProperty = function(sProperty) {
			var sNavigationPath, aTemp;
			if (sProperty && sProperty.indexOf("/") > -1) {
				aTemp = sProperty.split("/");
				// Remove the Property part
				aTemp.pop();
				// Extract only the navigationPath
				sNavigationPath = aTemp.join("/");
			}
			return sNavigationPath;
		};
		// Label is already set and can be updated if present in the LineItem annotation
		this._updateLabel(oFieldViewMetadata);
		oFieldViewMetadata.isInitiallyVisible = this._isInitiallyVisible(oFieldViewMetadata);
		oFieldViewMetadata.index = this._getIndex(oFieldViewMetadata);
		oFieldViewMetadata.width = FormatUtil.getWidth(oFieldViewMetadata);

		// additional property handling for table
		if (oFieldViewMetadata.isMeasureField && oFieldViewMetadata.unit) {
			aAdditionalProperty.push(oFieldViewMetadata.unit);
		} else if (oFieldViewMetadata.description) {
			aAdditionalProperty.push(oFieldViewMetadata.description);
		}
		// Include criticality if it exists as field metadata
		if (oFieldViewMetadata.criticality) {
			aAdditionalProperty.push(oFieldViewMetadata.criticality);
		}
		// Include criticality representation if it exists as field metadata
		if (oFieldViewMetadata.criticalityRepresentation) {
			aAdditionalProperty.push(oFieldViewMetadata.criticalityRepresentation);
		}

		// Include link Properties
		if (oFieldViewMetadata.linkProperties && oFieldViewMetadata.linkProperties.length) {
			aAdditionalProperty = aAdditionalProperty.concat(oFieldViewMetadata.linkProperties);
		}

		// Include field control Properties
		if (oFieldViewMetadata.fieldControlProperty) {
			aAdditionalProperty.push(oFieldViewMetadata.fieldControlProperty);
		}

		iLength = aAdditionalProperty.length;
		if (iLength) {
			oFieldViewMetadata.additionalProperty = aAdditionalProperty.join(",");
			while (iLength--) {
				sPath = fExtractNavigationProperty(aAdditionalProperty[iLength]);
				// add the navigationPath, if it exists, to the array
				if (sPath) {
					aNavigationProperty.push(sPath);
				}
			}
		}
		// add the parentProperty (navigationProperty name to the array if it exists
		if (oFieldViewMetadata.parentPropertyName) {
			aNavigationProperty.push(oFieldViewMetadata.parentPropertyName);
		}
		oFieldViewMetadata.navigationProperty = aNavigationProperty.join(",");

		// set the sortOrder from metadata
		this._setSortOrder(oFieldViewMetadata);

		// below properties are only relevant for analytical table
		if (this._isAnalyticalTable) {
			// aggregation-role= "measure" --> columns shall be summed on the UI (analytical table)
			oFieldViewMetadata.summed = oFieldViewMetadata.aggregationRole === "measure";
			// set the inResult from metadata
			this._setInResult(oFieldViewMetadata);
			// set the groupBy from metadata
			this._setGroupBy(oFieldViewMetadata);
		}
	};

	/**
	 * Returns a flag indicating whether the field should be initially visible on the UI *
	 * 
	 * @param {object} oField - OData metadata for the table field
	 * @returns {boolean} if the field should be initially visible
	 * @private
	 */
	TableProvider.prototype._isInitiallyVisible = function(oField) {
		var bInitiallyVisible = false;
		// Check if field exists in LineItem annotation (based on prio)
		if (this._oLineItemAnnotation && this._oLineItemAnnotation.fields) {
			bInitiallyVisible = this._oLineItemAnnotation.fields.indexOf(oField.name) > -1;

			if (bInitiallyVisible && !sap.ui.Device.system.desktop) {
				var sImportance = this._getFieldImportance(oField);
				if (sImportance) {
					if (sap.ui.Device.system.tablet) {
						bInitiallyVisible = sImportance === "High" || sImportance === "Medium"; // on tablets only show initially importance
						// high/medium columns
					} else if (sap.ui.Device.system.phone) {
						bInitiallyVisible = sImportance === "High"; // on phones only show initially importance high columns
					}
				}
			}
		}
		// Also check if field is part of SmartTable configuration
		if (!bInitiallyVisible && this._aInitiallyVisibleFields) {
			bInitiallyVisible = this._aInitiallyVisibleFields.indexOf(oField.name) > -1;
		}
		return bInitiallyVisible;
	};

	/**
	 * Sets inResult on the field metadata if the field exists in the RequestAtLeast of PresentationVariant annotation (or when
	 * enableInResultForLineItem is set, from LineItem annotation)
	 * 
	 * @param {object} oField - OData metadata for the table field
	 * @private
	 */
	TableProvider.prototype._setInResult = function(oField) {
		// first check if field is part of PresentationVariant-->RequestAtLeastFields
		if (this._oPresentationVariant) {
			if (this._oPresentationVariant.requestAtLeastFields && this._oPresentationVariant.requestAtLeastFields.indexOf(oField.name) > -1) {
				oField.inResult = true;
			}
		} else if (this.enableInResultForLineItem) {
			// else set inResult based on LineItem (mainly relevant for AnalyticalTable) only in non PresentationVariant use case
			if (this._oLineItemAnnotation && this._oLineItemAnnotation.fields && this._oLineItemAnnotation.fields.indexOf(oField.name) > -1) {
				oField.inResult = true;
			}
		}
	};

	/**
	 * Sets sorting realted info (sorted and sortOrder) on the field metadata if the field exists in the SortOrder of PresentationVariant annotation
	 * 
	 * @param {object} oField - OData metadata for the table field
	 * @private
	 */
	TableProvider.prototype._setSortOrder = function(oField) {
		var iLen;
		// first check if field is part of PresentationVariant-->SortOrder
		if (this._oPresentationVariant && this._oPresentationVariant.sortOrderFields) {
			iLen = this._oPresentationVariant.sortOrderFields.length;
			for (var i = 0; i < iLen; i++) {
				if (this._oPresentationVariant.sortOrderFields[i].name === oField.name) {
					oField.sorted = true;
					oField.sortOrder = this._oPresentationVariant.sortOrderFields[i].descending ? "Descending" : "Ascending";
					break;
				}
			}
		}
	};

	/**
	 * Sets grouping realted info (grouped) on the field metadata if the field exists in the GroupBy of PresentationVariant annotation
	 * 
	 * @param {object} oField - OData metadata for the table field
	 * @private
	 */
	TableProvider.prototype._setGroupBy = function(oField) {
		// first check if field is part of PresentationVariant-->GroupBy
		if (this._oPresentationVariant && this._oPresentationVariant.groupByFields && this._oPresentationVariant.groupByFields.indexOf(oField.name) >= 0) {
			oField.grouped = true;
		}
	};

	/**
	 * Returns the important annotation for the given field or null
	 * 
	 * @param {object} oField - OData metadata for the table field
	 * @returns {string} the important annotation
	 * @private
	 */
	TableProvider.prototype._getFieldImportance = function(oField) {
		var sReturnValue = null;

		if (this._oLineItemAnnotation && this._oLineItemAnnotation.importance) {
			sReturnValue = this._oLineItemAnnotation.importance[oField.name];
		}

		return sReturnValue;
	};

	/**
	 * Returns the index if the field from LineItem annotation, if it was found
	 * 
	 * @param {object} oField - OData metadata for the table field
	 * @returns {string} the index of the field (or undefined)
	 * @private
	 */
	TableProvider.prototype._getIndex = function(oField) {
		var iIndex = -1, iLength = 0;
		// Get the field order from LineItem annotation
		if (this._oLineItemAnnotation && this._oLineItemAnnotation.fields) {
			iLength = this._oLineItemAnnotation.fields.length;
			iIndex = this._oLineItemAnnotation.fields.indexOf(oField.name);
		}
		// If LineItem exists try to make configuration fields appear at the end
		if (iIndex < 0 && this._aInitiallyVisibleFields) {
			iIndex = this._aInitiallyVisibleFields.indexOf(oField.name);
			// set index only if field is part of configuration
			if (iIndex > -1) {
				iIndex += iLength;
			}
		}
		if (iIndex > -1) {
			return iIndex;
		}
		return undefined;
	};

	/**
	 * Updated the label from LineItem annotation metadata (if it exists)
	 * 
	 * @param {object} oField - OData view metadata of the field
	 * @private
	 */
	TableProvider.prototype._updateLabel = function(oField) {
		var sLabel;
		if (this._oLineItemAnnotation && this._oLineItemAnnotation.labels) {
			sLabel = this._oLineItemAnnotation.labels[oField.name];
		}
		if (sLabel) {
			oField.label = sLabel;

			if (oField.template && oField.template.setSemanticObjectLabel) { // SmartLink needs to know the overwritten name, as it is displayed in
				// the
				// navigation popover
				oField.template.setSemanticObjectLabel(oField.label);
			}
		}
	};

	/**
	 * Destroys the object
	 * 
	 * @public
	 */
	TableProvider.prototype.destroy = function() {
		if (this._oMetadataAnalyser && this._oMetadataAnalyser.destroy) {
			this._oMetadataAnalyser.destroy();
		}
		this._oMetadataAnalyser = null;
		if (this._oControlProvider && this._oControlProvider.destroy) {
			this._oControlProvider.destroy();
		}
		this._oControlProvider = null;
		this._aODataFieldMetadata = null;
		this._aTableViewMetadata = null;
		this._aIgnoredFields = null;
		this._aInitiallyVisibleFields = null;
		this._sIgnoredFields = null;
		this._sInitiallyVisibleFields = null;
		this.bIsDestroyed = true;
	};

	return TableProvider;

}, /* bExport= */true);
