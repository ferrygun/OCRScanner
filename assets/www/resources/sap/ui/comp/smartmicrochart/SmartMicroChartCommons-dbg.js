/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define("sap/ui/comp/smartmicrochart/SmartMicroChartCommons", [
	"jquery.sap.global",
	"sap/ui/comp/library",
	"sap/ui/comp/providers/ChartProvider",
	"sap/m/ValueColor",
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/type/Date"
], function(jQuery, library, ChartProvider, ValueColor, NumberFormat, DateFormat, DateType) {
	"use strict";
	var Commons = {};

	Commons._MINIMIZE = "com.sap.vocabularies.UI.v1.ImprovementDirectionType/Minimize";
	Commons._MAXIMIZE = "com.sap.vocabularies.UI.v1.ImprovementDirectionType/Maximize";
	Commons._TARGET = "com.sap.vocabularies.UI.v1.ImprovementDirectionType/Target";

	/**
	 * Initializes the OData metadata necessary to create the chart.
	 * @private
	 */
	Commons._initializeMetadata = function() {
		if (!this._bIsInitialized) {
			var oModel = this.getModel();
			if (oModel && (oModel.getMetadata().getName() === "sap.ui.model.odata.v2.ODataModel" || oModel.getMetadata().getName() === "sap.ui.model.odata.ODataModel")) {
				if (!this._bMetaModelLoadAttached) {
					oModel.getMetaModel().loaded().then(Commons._onMetadataInitialized.bind(this));
					this._bMetaModelLoadAttached = true;
				}
			} else if (oModel) {
				// Could be a non-ODataModel or a synchronous ODataModel --> just create the necessary helpers
				Commons._onMetadataInitialized.call(this);
			}
		}
	};

	/**
	 * Called once the necessary model metadata are available.
	 * @private
	 */
	Commons._onMetadataInitialized = function() {
		this._bMetaModelLoadAttached = false; //reset variable
		if (this._bIsInitialized) { //nothing to do if already initialized
			return;
		}

		Commons._createChartProvider.call(this);
		this._oChartViewMetadata = this._oChartProvider.getChartViewMetadata();
		this._oDataPointMetadata = this._oChartProvider.getChartDataPointMetadata();
		this._bIsInitialized = true; // Indicates the control is initialized and can be used
		this.fireInitialize();

		if (this.getEnableAutoBinding()) {
			if (this.getChartBindingPath()) {
				this.bindElement(this.getChartBindingPath());
			} else {
				jQuery.sap.log.error("The property chartBindingPath needs to be set in order for property enableAutoBinding to be applied.");
			}
		}

		if (Commons._checkChartMetadata.call(this)) {
			var sQualifier = Commons._getDataPointQualifier.call(this);
			// finds the DataPoint annotation in additionalAnnotations if the qualifier exists, otherwise point to the primaryAnnotation
			if (sQualifier) {
				this._oDataPointAnnotations = this._oDataPointMetadata.additionalAnnotations[sQualifier];
			} else {
				this._oDataPointAnnotations = this._oDataPointMetadata.primaryAnnotation;
			}

			if (Commons._checkDataPointAnnotation(this._oDataPointAnnotations)) {
				this._createAndBindInnerChart(); //only bind the chart if metadata and annotations are complete
			}
		} else {
			jQuery.sap.log.error("Created annotations not valid. Please review the annotations and metadata.");
		}
	};

	/**
	 * Cleans up instances that were created
	 * @private
	 */
	Commons._cleanup = function() {
		if (this._oDateType) { // Destroy the sap.ui.model.type.Date instance which is used to format values
			this._oDateType.destroy();
			this._oDateType = null;
		}
	};

	/**
	 * Creates an instance of the ChartProvider.
	 * @private
	 */
	Commons._createChartProvider = function() {
		var oModel, sEntitySetName;
		sEntitySetName = this.getEntitySet();
		oModel = this.getModel();

		// The SmartMicroChart might also need to work for non ODataModel models, so we now create the chart independent of ODataModel.
		if (oModel && sEntitySetName) {
			this._oChartProvider = new ChartProvider({
				entitySet: sEntitySetName,
				model: oModel,
				chartQualifier: this.data("chartQualifier")
			});
		} else {
			jQuery.sap.log.error("Property entitySet is not set or no model has been attached to the control.");
		}
	};

	/**
	 * Checks the validity of the Chart annotation.
	 * @private
	 * @returns {boolean} True if the metadata check was successful, otherwise false.
	 */
	Commons._checkChartMetadata = function() {
		if (jQuery.isEmptyObject(this._oChartViewMetadata) && jQuery.isEmptyObject(this._oDataPointMetadata)) {
			jQuery.sap.log.error("The Chart or DataPoint annotation is empty.");
			return false;
		}
		if (!this._oChartViewMetadata.fields || this._oChartViewMetadata.fields.length === 0) {
			jQuery.sap.log.error("No fields exist in the metadata.");
			return false;
		}
		if (Commons._hasMember(this, "_oChartViewMetadata.annotation.ChartType")) {
			return Commons._checkChartType.call(this);
		} else {
			jQuery.sap.log.error("The Chart annotation is invalid.");
			return false;
		}
	};

	/**
	 * Checks the validity of the ChartType in Chart annotation.
	 * @private
	 *
	 * @returns {boolean} True if the ChartType in Chart annotation is supported, otherwise false.
	 */
	Commons._checkChartType = function() {
		var aTypes = this._getSupportedChartTypes();
		for (var i = 0; i < aTypes.length; i++) {
			if (this._oChartViewMetadata.annotation.ChartType.EnumMember === "com.sap.vocabularies.UI.v1.ChartType/" + aTypes[i]) {
				return true;
			}
		}
		jQuery.sap.log.error("The ChartType property in the Chart annotation is not part of the list of valid types: \"" + aTypes.toString() + "\".");
		return false;
	};

	/**
	 * Gets the qualifier of DataPoint in Chart annotation
	 * @returns {string} If there are annotations with a valid DataPoint qualifier, the qualifier is
	 *                   returned. If no valid qualifier or no annotations are found, this function
	 *                   returns an empty string.
	 * @private
	 */
	Commons._getDataPointQualifier = function() {
		var oMeasureAttribute;

		if (!Commons._hasMember(this, "_oChartViewMetadata.annotation.MeasureAttributes.length") ||
			!this._oChartViewMetadata.annotation.MeasureAttributes.length) {
			return "";
		}

		oMeasureAttribute = this._oChartViewMetadata.annotation.MeasureAttributes[0];
		if (Commons._hasMember(oMeasureAttribute, "DataPoint.AnnotationPath")) {
			return (oMeasureAttribute.DataPoint.AnnotationPath.match(/\#([^\#]*)$/) || [])[1] || "";
		}
	};

	/**
	 * Checks the validity of the DataPoint annotation.
	 * @param {object} oDataPointAnnotations The DataPoint annotations as an object.
	 * @returns {boolean} True if the annotation check was successful, otherwise false.
	 * @private
	 */
	Commons._checkDataPointAnnotation = function(oDataPointAnnotations) {
		if (jQuery.isEmptyObject(oDataPointAnnotations)) {
			jQuery.sap.log.error("The DataPoint annotation is empty. Please check it!");
			return false;
		}
		// when the Value property does not exist in the DataPoint annotation object, return false
		if (Commons._hasMember(oDataPointAnnotations, "Value.Path")) {
			if (jQuery.isEmptyObject(oDataPointAnnotations.Criticality)) { //only check criticality calculation if no criticality is given directly
				Commons._checkCriticalityMetadata(oDataPointAnnotations.CriticalityCalculation);
			}
			return true; //return true even if no criticality was detected
		} else {
			jQuery.sap.log.error("The Value property does not exist in the DataPoint annotation. This property is essential for creating the smart chart.");
			return false;
		}
	};

	/**
	 * Checks the validity of the CriticalityCalculation annotation.
	 * @param {object} oCriticality The CriticalityCalculation annotation data.
	 * @returns {boolean} Returns true if the metadata check was successful, false otherwise.
	 * @private
	 */
	Commons._checkCriticalityMetadata = function(oCriticality) {
		if (jQuery.isEmptyObject(oCriticality)) {
			jQuery.sap.log.warning("The CriticalityCalculation property in DataPoint annotation is not provided.");
			return false;
		}
		if (Commons._hasMember(oCriticality, "ImprovementDirection.EnumMember")) {
			var sImprovementDirection = oCriticality.ImprovementDirection.EnumMember;

			switch (sImprovementDirection) {
				case Commons._MINIMIZE:
					return Commons._checkCriticalityMetadataForMinimize(oCriticality);
				case Commons._MAXIMIZE:
					return Commons._checkCriticalityMetadataForMaximize(oCriticality);
				case Commons._TARGET:
					return Commons._checkCriticalityMetadataForTarget(oCriticality);
				default:
					jQuery.sap.log.warning("The improvement direction in DataPoint annotation must be either Minimize, Maximize or Target.");
			}
		} else {
			jQuery.sap.log.warning("The ImprovementDirection property in DataPoint annotation is not provided.");
		}
		return false;
	};

	/**
	 * Checks the validity of the CriticalityCalculation annotation for Minimize improvement direction.
	 * @param {object} oCriticality
	 * @returns {boolean} Returns true if the metadata check was successful, false otherwise.
	 * @private
	 */
	Commons._checkCriticalityMetadataForMinimize = function(oCriticality) {
		if (!Commons._hasMember(oCriticality, "ToleranceRangeHighValue.Path")) {
			jQuery.sap.log.warning("The ToleranceRangeHighValue property in DataPoint annotation is missing for Minimize improvement direction.");
			return false;
		}
		if (!Commons._hasMember(oCriticality, "DeviationRangeHighValue.Path")) {
			jQuery.sap.log.warning("The DeviationRangeHighValue property in DataPoint annotation is missing for Minimize improvement direction.");
			return false;
		}
		return true;
	};

	/**
	 * Checks the validity of the CriticalityCalculation annotation for Maximize improvement direction.
	 * @param {object} oCriticality
	 * @returns {boolean} Returns true if the metadata check was successful, false otherwise.
	 * @private
	 */
	Commons._checkCriticalityMetadataForMaximize = function(oCriticality) {
		if (!Commons._hasMember(oCriticality, "ToleranceRangeLowValue.Path")) {
			jQuery.sap.log.warning("The ToleranceRangeLowValue property in DataPoint annotation is missing for Minimize improvement direction.");
			return false;
		}
		if (!Commons._hasMember(oCriticality, "DeviationRangeLowValue.Path")) {
			jQuery.sap.log.warning("The DeviationRangeLowValue property in DataPoint annotation is missing for Minimize improvement direction.");
			return false;
		}
		return true;
	};

	/**
	 * Checks the validity of the CriticalityCalculation annotation for Target improvement direction.
	 * @param {object} oCriticality
	 * @returns {boolean} Returns true if the metadata check was successful, false otherwise.
	 * @private
	 */
	Commons._checkCriticalityMetadataForTarget = function(oCriticality) {
		if (!Commons._hasMember(oCriticality, "ToleranceRangeLowValue.Path")) {
			jQuery.sap.log.warning("The DeviationRangeLowValue property in DataPoint annotation is missing for Target improvement direction.");
			return false;
		}
		if (!Commons._hasMember(oCriticality, "ToleranceRangeHighValue.Path")) {
			jQuery.sap.log.warning("The ToleranceRangeHighValue property in DataPoint annotation is missing for Target improvement direction.");
			return false;
		}
		if (!Commons._hasMember(oCriticality, "DeviationRangeLowValue.Path")) {
			jQuery.sap.log.warning("The ToleranceRangeLowValue property in DataPoint annotation is missing for Target improvement direction.");
			return false;
		}
		if (!Commons._hasMember(oCriticality, "DeviationRangeHighValue.Path")) {
			jQuery.sap.log.warning("The DeviationRangeHighValue property in DataPoint annotation is missing for Target improvement direction.");
			return false;
		}
		return true;
	};

	/**
	 * Retrieve the color for the respective criticality type.
	 * @param {string} type The full criticality type as defined in the vocabulary or just the EnumMember's name
	 * @return {sap.m.ValueColor} The color that is associated with the criticality type
	 * @private
	 */
	Commons._mapCriticalityTypeWithColor = function(type) {
		var sType;
		if (!type) {
			return ValueColor.Neutral;
		} else {
			sType = type.toString();
		}
		sType = (sType.match(/(?:CriticalityType\/)?([^\/]*)$/) || [])[1] || "";
		switch (sType) {
			case "Negative":
			case "1":
				return ValueColor.Error;
			case "Critical":
			case "2":
				return ValueColor.Critical;
			case "Positive":
			case "3":
				return ValueColor.Good;
			default:
				return ValueColor.Neutral;
		}
	};

	/**
	 * Compile all criticality thresholds and decide for each case whether to use the binding path "Path"
	 * or set a number directly via "Decimal".
	 * @param {Object} oCC The criticality calculation data object from the annotations.
	 * @returns {Object} An object containing the parsed criticality thresholds.
	 * @private
	 */
	Commons._getThresholdValues = function(oCC) {
		var oThresholds = {},
			oContext = this.getBindingContext();

		for (var k in oCC) {
			if (oCC.hasOwnProperty(k) && k !== "ImprovementDirection") {
				oThresholds[k] = oCC[k].Path && oContext && oContext.getProperty(oCC[k].Path) || oCC[k].Decimal || 0;
			}
		}
		return oThresholds;
	};

	/**
	 * Determine the circle color for the 'Minimize' value of the ImprovementDirection of the DataPoint annotation
	 * @private
	 * @param {int} iValue The current value to be categorized.
	 * @param {int} iToleranceHigh The ToleranceHighValue from the annotations.
	 * @param {int} iDeviationHigh The DeviationHighValue from the annotations.
	 * @returns {sap.m.ValueColor} The ValueColor associated with the identified criticality
	 */
	Commons._getValueColorForMinimize = function(iValue, iToleranceHigh, iDeviationHigh) {
		if (iValue <= iToleranceHigh) {
			return Commons._mapCriticalityTypeWithColor("Positive");
		} else if (iValue > iToleranceHigh && iValue <= iDeviationHigh) {
			return Commons._mapCriticalityTypeWithColor("Critical");
		} else if (iValue > iDeviationHigh) {
			return Commons._mapCriticalityTypeWithColor("Negative");
		}
	};

	/**
	 * Determine and set the bar color for the 'Maximize' value of the ImprovementDirection of the DataPoint annotation
	 * @private
	 * @param {int} iValue The current value to be categorized.
	 * @param {int} iToleranceLow The ToleranceLowValue from the annotations.
	 * @param {int} iDeviationLow The DeviationLowValue from the annotations.
	 * @returns {sap.m.ValueColor} The ValueColor associated with the identified criticality
	 */
	Commons._getValueColorForMaximize = function(iValue, iToleranceLow, iDeviationLow) {
		if (iValue >= iToleranceLow) {
			return Commons._mapCriticalityTypeWithColor("Positive");
		} else if (iValue < iToleranceLow && iValue >= iDeviationLow) {
			return Commons._mapCriticalityTypeWithColor("Critical");
		} else if (iValue < iDeviationLow) {
			return Commons._mapCriticalityTypeWithColor("Negative");
		}
	};

	/**
	 * Determine and set the bar color for the 'Maximize' value of the ImprovementDirection of the DataPoint annotation
	 * @private
	 * @param {int} iValue The current value to be categorized.
	 * @param {int} iToleranceLow The ToleranceLowValue from the annotations.
	 * @param {int} iDeviationLow The DeviationLowValue from the annotations.
	 * @param {int} iToleranceHigh The ToleranceHighValue from the annotations.
	 * @param {int} iDeviationHigh The DeviationHighValue from the annotations.
	 * @returns {sap.m.ValueColor} The ValueColor associated with the identified criticality
	 */
	Commons._getValueColorForTarget = function(iValue, iToleranceLow, iDeviationLow, iToleranceHigh, iDeviationHigh) {
		if (iValue >= iToleranceLow && iValue <= iToleranceHigh) {
			return Commons._mapCriticalityTypeWithColor("Positive");
		} else if ((iValue >= iDeviationLow && iValue < iToleranceLow) || (iValue > iToleranceHigh && iValue <= iDeviationHigh)) {
			return Commons._mapCriticalityTypeWithColor("Critical");
		} else if (iValue < iDeviationLow || iValue > iDeviationHigh) {
			return Commons._mapCriticalityTypeWithColor("Negative");
		}
	};

	/**
	 * ValueColor formatter function. This function uses the current model value and (optionally) the
	 * directly set criticality to determine the color of the chart it is called on.
	 * @param {float} iValue The current value in the model data.
	 * @param {string} sCriticality The directly set criticality string in the model data.
	 * @returns {sap.m.ValueColor} The corresponding ValueColor for the specified criticality.
	 *                                If no direct criticality is passed, Criticality Calculation is assumed to be required.
	 *                                Defaults to "Neutral" for invalid parameters.
	 * @private
	 */
	Commons._getValueColor = function(iValue, sCriticality) {
		var oCC = this._oDataPointAnnotations.CriticalityCalculation,
			oThresholds,
			sColor;

		iValue = parseFloat(iValue) || 0;

		if (typeof sCriticality === "string") { //directly set criticality has priority
			sColor = Commons._mapCriticalityTypeWithColor(sCriticality);
		} else if (oCC && typeof iValue !== "undefined" && iValue !== null) {
			oThresholds = Commons._getThresholdValues.call(this, oCC);
			sColor = Commons._criticalityCalculation(iValue, oCC.ImprovementDirection.EnumMember, oThresholds);
		}
		return sColor || Commons._mapCriticalityTypeWithColor();
	};

	/**
	 * Uses the current value and criticality thresholds to determine the color of top labels of the chart.
	 * @param {float} value The current value in the model data
	 * @param {object} data A data object to be used for getting criticality threshold values
	 * @returns {sap.m.ValueColor} The corresponding ValueColor for the specified criticality and ImprovementDirection.
	 * @private
	 */
	Commons._getTopLabelColor = function(value, data) {
		var oCC = this._oDataPointAnnotations.CriticalityCalculation,
			iValue = parseFloat(value) || 0,
			oThresholds = {},
			sColor;

		for (var k in oCC) {
			if (oCC.hasOwnProperty(k) && k !== "ImprovementDirection") {
				oThresholds[k] = data[oCC[k].Path];
			}
		}
		if (oCC && typeof iValue !== "undefined" && iValue !== null) {
			sColor = Commons._criticalityCalculation(iValue, oCC.ImprovementDirection.EnumMember, oThresholds);
		}
		return sColor;
	};

	/**
	 * Determines and returns the semantic color based on ImprovementDirection and criticality thresholds of the DataPoint annotation
	 * @param {float} value The current value to be categorized
	 * @param {string} improvementDirection The improvementDirection from the annotations
	 * @param {object} thresholds The threshold values for calculation
	 * @returns {sap.m.ValueColor} The ValueColor associated with the identified criticality
	 * @private
	 */
	Commons._criticalityCalculation = function(value, improvementDirection, thresholds) {
		var sColor;
		switch (improvementDirection) {
			case Commons._MINIMIZE:
				sColor = Commons._getValueColorForMinimize(value, thresholds.ToleranceRangeHighValue, thresholds.DeviationRangeHighValue);
				break;
			case Commons._MAXIMIZE:
				sColor = Commons._getValueColorForMaximize(value, thresholds.ToleranceRangeLowValue, thresholds.DeviationRangeLowValue);
				break;
			case Commons._TARGET:
				sColor = Commons._getValueColorForTarget(value, thresholds.ToleranceRangeLowValue, thresholds.DeviationRangeLowValue,
					thresholds.ToleranceRangeHighValue, thresholds.DeviationRangeHighValue);
				break;
			default:
				jQuery.sap.log.warning("The improvement direction in DataPoint annotation must be either Minimize, Maximize or Target.");
		}
		return sColor;
	};

	Commons._ASSOCIATIONS = ["chartTitle", "chartDescription", "unitOfMeasure", "freeText"];
	Commons._ASSOCIATIONS_ANNOTATIONS_MAP = {
		"chartDescription": "Description",
		"chartTitle": "Title",
		"unitOfMeasure": {
			propertyAnnotationPath: "Value",
			propertyAnnotationProperties: ["ISOCurrency", "Unit"]
		},
		"freeText": {
			propertyAnnotationPath: "Value",
			propertyAnnotationProperties: ["Label"]
		}
	};

	/**
	 * Get the annotation for a specified association.
	 * @param {string} association The association the annotations should be retrieved for.
	 *                             This association has to be mapped in _ASSOC_ANNOT_MAP.
	 * @returns {object} Returns an object containing the annotation for the specified association.
	 *                   If invalid data is encountered, an empty object is returned.
	 * @private
	 */
	Commons._getAnnotation = function(association) {
		var oAnnotation = Commons._ASSOCIATIONS_ANNOTATIONS_MAP[association];
		if (!oAnnotation) {
			jQuery.sap.log.warning("No annotation connected to association \"" + association + "\".");
			return {};
		}

		if (!jQuery.isEmptyObject(this._oChartViewMetadata) && typeof oAnnotation === "string") {
			return this._oChartViewMetadata.annotation[oAnnotation];
		}
		if (!jQuery.isEmptyObject(this._oDataPointAnnotations) &&
			Commons._hasMember(oAnnotation, "propertyAnnotationPath") &&
			Commons._hasMember(oAnnotation, "propertyAnnotationProperties")) {
			var oPropertyAnnotation;
			if (Commons._hasMember(this._oDataPointAnnotations, oAnnotation.propertyAnnotationPath + ".Path")) {
				oPropertyAnnotation = Commons._getPropertyAnnotation.call(this, this._oDataPointAnnotations[oAnnotation.propertyAnnotationPath].Path);
			}
			if (oPropertyAnnotation) {
				return Commons._getValueFromPropertyAnnotation(oPropertyAnnotation, oAnnotation.propertyAnnotationProperties);
			}
		}
		return {};
	};

	/**
	 * Retrieve the first value in the property annotation of a previously determined annotation
	 * term (e.g. ISOCurrency/Label/Unit).
	 * @param {object} oPropertyAnnotation The property annotation object with all annotation terms.
	 * @param {string[]} aProperties An array of all possible terms.
	 * @returns {object} Returns an object containing the annotation binding information (or a String),
	 *                   or an empty object if oPropertyAnnotation does not contain any terms.
	 * @private
	 */
	Commons._getValueFromPropertyAnnotation = function(oPropertyAnnotation, aProperties) {
		for (var sProp in oPropertyAnnotation) {
			for (var i = 0; i < aProperties.length; i++) {
				if (sProp.indexOf(aProperties[i]) > -1) {
					return oPropertyAnnotation[sProp];
				}
			}
		}
		return {};
	};

	/**
	 * Update a specified association on a control bound to this function's context using annotation
	 * data from Chart or DataPoint annotations. This includes re-binding or directly setting the
	 * associated control's text property.
	 * @param {string} associationName The name of the association to be updated.
	 * @param {object} data A data object to be used for setting association texts directly.
	 * @private
	 */
	Commons._updateAssociation = function(associationName, data) {
		var oAssociation, oAnnotation;

		if (this.getMetadata().hasAssociation(associationName)) {
			oAssociation = sap.ui.getCore().byId(this.getAssociation(associationName));
			if (oAssociation && oAssociation.getMetadata().hasProperty("text")) {
				oAnnotation = Commons._getAnnotation.call(this, associationName);
				Commons._setAssociationText(oAssociation, oAnnotation, data);
			}
		}
	};

	/**
	 * Update all of the control's special associations.
	 * @param {object} data A data object to be used for setting association texts directly.
	 * @private
	 */
	Commons._updateAssociations = function(data) {
		var n = Commons._ASSOCIATIONS.length;
		for (var i = 0; i < n; i++) {
			Commons._updateAssociation.call(this, Commons._ASSOCIATIONS[i], data);
		}
	};

	/**
	 * Update all of the chart labels.
	 * @param {object} data A data object to be used for setting label texts directly
	 * @param {string} position A string used to identify the first or last bound points
	 * @private
	 */
	Commons._updateChartLabels = function(data, position) {
		switch (position) {
			case "first":
				Commons._updateTopLabel.call(this, this._getLabelsMap()["leftTop"], data);
				Commons._updateBottomLabel.call(this, this._getLabelsMap()["leftBottom"], data);
				break;
			case "last":
				Commons._updateTopLabel.call(this, this._getLabelsMap()["rightTop"], data);
				Commons._updateBottomLabel.call(this, this._getLabelsMap()["rightBottom"], data);
				break;
		}
	};

	/**
	 * Update the top labels of chart.
	 * @param {string} aggregationName The name of the aggregation to be updated.
	 * @param {object} data A data object to be used for setting label texts directly.
	 * @private
	 */
	Commons._updateTopLabel = function(aggregationName, data) {
		var oLabel = this.getAggregation("_chart").getAggregation(aggregationName),
			iValue = data[this._oDataPointAnnotations.Value.Path],
			sColor = Commons._getTopLabelColor.call(this, iValue, data),
			oFormatter = Commons._getLabelNumberFormatter.call(this, this._oDataPointAnnotations.Value.Path),
			sFormattedValue;

		sFormattedValue = oFormatter.format(iValue);
		oLabel.setProperty("label", sFormattedValue, true);
		oLabel.setProperty("color", sColor, true);
	};

	/**
	 * Update the bottom labels of chart.
	 * @param {string} aggregationName The name of the aggregation to be updated
	 * @param {object} data A data object to be used for setting label texts directly
	 * @private
	 */
	Commons._updateBottomLabel = function(aggregationName, data) {
		var oAnnotation, oDimensionAnnotation, oLabel, sValue, sFormattedValue;

		oAnnotation = this._oChartViewMetadata.dimensionFields[0];
		if (oAnnotation) {
			sValue = data[oAnnotation];
			oLabel = this.getAggregation("_chart").getAggregation(aggregationName);

			oDimensionAnnotation = Commons._getPropertyAnnotation.call(this, this._oChartViewMetadata.dimensionFields[0]);
			if (oDimensionAnnotation.hasOwnProperty("sap:text") || oDimensionAnnotation.hasOwnProperty("com.sap.vocabularies.Common.v1.Text")) {
				var sPropertyName = oDimensionAnnotation["sap:text"] || oDimensionAnnotation["com.sap.vocabularies.Common.v1.Text"].Path;
				sFormattedValue = data[sPropertyName];
			} else {
				sFormattedValue = Commons._formatBottomLabel.call(this, sValue, oDimensionAnnotation);
			}

			if (sFormattedValue) {
				oLabel.setProperty("label", sFormattedValue, true);
			}
		}
	};

	/**
	 * Format values for bottom label.
	 * @param {string|number|Date} value The value needs to be formatted
	 * @param {object} annotation The annotation of a property
	 * @returns {string} The formatted string or null
	 * @private
	 */
	Commons._formatBottomLabel = function(value, annotation) {
		var sPattern = Commons._getSemanticsPattern.call(this, annotation);
		if (sPattern) { // If semantic pattern exists then use it to format value
			return Commons._formatSemanticsValue.call(this, value, sPattern);
		}

		sPattern = Commons._getCalendarPattern.call(this, annotation);
		if (sPattern) { // If Calendar annotation exists then use it to format value
			return Commons._formatSemanticsValue.call(this, value, sPattern);
		}

		// If no pattern is available then format the value according to its type
		return Commons._formatDateAndNumberValue.call(this, value);
	};

	/**
	 * Formats the given value using the provided sap:semantics pattern.
	 * @param {string} value The value which needs to be formatted
	 * @param {string} pattern The pattern which is used to parse the value
	 * @returns {string} The formatted string or null
	 * @private
	 */
	Commons._formatSemanticsValue = function(value, pattern) {
		if (pattern) {
			if (this._oDateType) {
				this._oDateType.setFormatOptions({
					style: "short",
					source: {
						pattern: pattern
					}
				});
			} else {
				this._oDateType = new DateType({
					style: "short",
					source: {
						pattern: pattern
					}
				});
			}
			return this._oDateType.formatValue(value, "string");
		}
		return null;
	};

	/**
	 * Format values when they are date type or number type.
	 * @param {(string|number|Date)} value The value which needs to be formatted
	 * @returns {string} The formatted string or null
	 * @private
	 */
	Commons._formatDateAndNumberValue = function(value) {
		if (value instanceof Date) {
			return Commons._getLabelDateFormatter.call(this).format(value);
		} else if (!isNaN(value)) {
			return Commons._getLabelNumberFormatter.call(this, this._oChartViewMetadata.dimensionFields[0]).format(value);
		} else {
			return null;
		}
	};

	/**
	 * Checks if the annotation of the given property contains sap:semantics, and returns the semantic pattern to parse the value
	 * @param {object} annotation The annotation of a property
	 * @returns {string} The pattern which is used for parsing the string or null
	 * @private
	 */
	Commons._getSemanticsPattern = function(annotation) {
		if (annotation.hasOwnProperty("sap:semantics")) {
			switch (annotation["sap:semantics"]) {
				case "yearmonthday":
					return "yyyyMMdd";
				case "yearmonth":
					return "yyyyMM";
				case "year":
					return "yyyy";
				default:
					return null;
			}
		}
		return null;
	};

	Commons._CALENDAR_TERMS_PATTERNS = {
		"com.sap.vocabularies.Common.v1.IsCalendarYear": "yyyy",
		"com.sap.vocabularies.Common.v1.IsCalendarQuarter": "Q",
		"com.sap.vocabularies.Common.v1.IsCalendarMonth": "MM",
		"com.sap.vocabularies.Common.v1.IsCalendarWeek": "ww",
		"com.sap.vocabularies.Common.v1.IsCalendarDate": "yyyyMMdd",
		"com.sap.vocabularies.Common.v1.IsCalendarYearMonth": "yyyyMM"
	};

	/**
	 * Checks if the annotation of the given property contains calendar annotation terms, and returns the semantic pattern to parse the value.
	 * @param {object} annotation The annotation of a property
	 * @returns {string} The pattern which is used for parsing the string or null
	 * @private
	 */
	Commons._getCalendarPattern = function(annotation) {
		for (var sCalendarTerm in Commons._CALENDAR_TERMS_PATTERNS) {
			if (annotation.hasOwnProperty(sCalendarTerm)) {
				return Commons._CALENDAR_TERMS_PATTERNS[sCalendarTerm];
			}
		}
		return null;
	};

	/**
	 * Creates the number formatter instance with annotation data.
	 * @param {string} path The annotation path.
	 * @returns {sap.ui.core.format.NumberFormat} Formatter to display numbers uniformly.
	 * @private
	 */
	Commons._getLabelNumberFormatter = function(path) {
		var iPrecision = Commons._getPropertyAnnotation.call(this, path).precision || null;

		return NumberFormat.getInstance({
			style: "short",
			showScale: true,
			precision: iPrecision
		});
	};

	/**
	 * Creates a date formatter instance.
	 * @returns {sap.ui.core.format.DateFormat} Formatter to display dates uniformly.
	 * @private
	 */
	Commons._getLabelDateFormatter = function() {
		return DateFormat.getInstance({
			style: "short"
		});
	};

	/**
	 * Bind or set directly the association's text property depending on the given oAnnotation object.
	 * @param {sap.ui.core.Control} association The associated control.
	 * @param {object} annotation The annotation used to set the new binding path or text property.
	 * @param {object} data A data object to be used for setting association texts directly.
	 * @private
	 */
	Commons._setAssociationText = function(association, annotation, data) {
		if (!annotation) {
			return;
		}

		if (annotation.Path && data) {
			association.setProperty("text", data[annotation.Path], false);
		} else if (annotation.Path) {
			association.bindProperty("text", {
				path: annotation.Path
			});
			association.invalidate();
		} else if (annotation.String) {
			if (annotation.String.indexOf("{") === 0) {
				var aParts = annotation.String.split(">");
				association.bindProperty("text", {
					path: aParts[1].substr(0, aParts[1].length - 1),
					model: aParts[0].substr(1)
				});
				association.invalidate();
			} else {
				association.setProperty("text", annotation.String, false);
			}
		}
	};

	/**
	 * Get all annotations for the entityType property
	 * @param {string} propertyName The name of the property in the entity type the annotations are to be retrieved for.
	 * @returns {Object} oPropertyAnnotation The annotations of the specified property
	 * @private
	 */
	Commons._getPropertyAnnotation = function(propertyName) {
		var oMetaModel, sEntityTypeName, oEntityType, oPropertyAnnotation;
		oMetaModel = this.getModel().getMetaModel();
		sEntityTypeName = this._oChartProvider._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.getEntitySet()); //get entity type from entity set name
		oEntityType = oMetaModel.getODataEntityType(sEntityTypeName); //use entity type's name to get detailed information about entity type
		oPropertyAnnotation = oMetaModel.getODataProperty(oEntityType, propertyName); //get annotation for property from entity type object
		return oPropertyAnnotation;
	};

	/**
	 * This method checks whether obj contains members specified by the path following the pattern "a.b.c".
	 *
	 * @param {object} obj The object to be tested for the members.
	 * @param {string} path The string containing the path obj is to be tested for.
	 * @returns {boolean} True if the given object has the members described by the given path, otherwise false.
	 * @private
	 */
	Commons._hasMember = function(obj, path) {
		var sDelim = ".", aParts = path.split(sDelim), sMember = aParts.shift();
		return !!obj && ((aParts.length > 0) ? Commons._hasMember(obj[sMember], aParts.join(sDelim)) : obj.hasOwnProperty(sMember));
	};

	/**
	 * Gets the accessibility information from the underlying (inner) MicroChart instance.
	 *
	 * @returns {Object} The accessibility information object of the underlying MicroChart instance
	 * @private
	 */
	Commons._getAccessibilityInfo = function() {
		var oAccessibilityInformation = {};
		var oInnerChart = this.getAggregation("_chart");

		if (oInnerChart && oInnerChart.getAccessibilityInfo) {
			oAccessibilityInformation = oInnerChart.getAccessibilityInfo();
		}

		return oAccessibilityInformation;
	};

	return Commons;
}, true);
