// Copyright (c) 2009-2014 SAP SE, All Rights Reserved
/**
 * @fileOverview This file contains miscellaneous utility functions.
 */

(function () {
    "use strict";
    /*global dispatchEvent, document, jQuery, localStorage, sap */

    // ensure that sap.ushell exists
    jQuery.sap.declare("sap.ovp.cards.AnnotationHelper");
    jQuery.sap.require("sap.ui.core.format.NumberFormat");
    jQuery.sap.require("sap.ui.core.format.DateFormat");
    jQuery.sap.require("sap.ovp.cards.CommonUtils");

    sap.ovp.cards.AnnotationHelper = {};
    sap.ovp.cards.AnnotationHelper.formatFunctions = {
        count: 0
    };
    sap.ovp.cards.AnnotationHelper.NumberFormatFunctions = {};
    sap.ovp.cards.AnnotationHelper.DateFormatFunctions = {};
    sap.ovp.cards.AnnotationHelper.CurrencyFormatFunctions = {};

    sap.ovp.cards.AnnotationHelper.criticalityConstants = {
        StateValues: {
            None: "None",
            Negative: "Error",
            Critical: "Warning",
            Positive: "Success"
        },
        ColorValues: {
            None: "Neutral",
            Negative: "Error",
            Critical: "Critical",
            Positive: "Good"
        }
    };

    sap.ovp.cards.AnnotationHelper.AnnotationType = {
        TEXT: "com.sap.vocabularies.Common.v1.Text",
        TEXT_ARRANGEMENT: "com.sap.vocabularies.UI.v1.TextArrangement"
    };

    sap.ovp.cards.AnnotationHelper.TextArrangementType = {
        TEXT_LAST: "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast",
        TEXT_FIRST: "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst",
        TEXT_ONLY: "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly",
        TEXT_SEPARATE: "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate"
    };

    sap.ovp.cards.AnnotationHelper.formatterGeo = function (iContext, collection) {
        var longitude = collection.Longitude.Path;
        var latitude = collection.Latitude.Path;
        return "{path:'" + longitude + "'}; {path:'" + latitude + "'}" + ";0";
    };

    sap.ovp.cards.AnnotationHelper.analyticRegions = function (iContext, collection) {
        return "{path:'" + collection.CountryCode.Path + "'}";
    };

    sap.ovp.cards.AnnotationHelper.getLabelStateFromValue = function (value) {
        var labelState;
        switch (value) {
            case "Default":
                labelState = sap.ui.vbm.SemanticType.Default;
                break;
            case "Error":
                labelState = sap.ui.vbm.SemanticType.Error;
                break;
            case "Warning":
                labelState = sap.ui.vbm.SemanticType.Warning;
                break;
            case "Success":
                labelState = sap.ui.vbm.SemanticType.Success;
                break;
            default:
                labelState = sap.ui.vbm.SemanticType.None;
                break;
        }
        return labelState;
    };

    sap.ovp.cards.AnnotationHelper.getColorStateFromValue = function (value) {
        var ColorState;
        switch (value) {
            case "0":
                ColorState = "#5E696E";
                break;
            case "1":
                ColorState = "#BB0000";
                break;
            case "2":
                ColorState = "#E78C07";
                break;
            case "3":
                ColorState = "#2B7D2B";
                break;
            default:
                ColorState = "#5E696E";
                break;
        }
        return ColorState;
    };

    sap.ovp.cards.AnnotationHelper.criticalityType = function (iContext, collection) {
        var criticality = collection.Criticality.Path;
        return "{path:'" + criticality + "', formatter: 'sap.ovp.cards.AnnotationHelper.getCriticalityStateFromValue' }";
    };
    // This method converts Vocabulary compliant values
    // for EnumType CriticalityType into semantic values
    // which are required by the sap.ui.vbm.Spot.
    sap.ovp.cards.AnnotationHelper.getCriticalityStateFromValue = function (value) {
        var criticalityState;
        switch (value) {
            case "0":
                criticalityState = sap.ui.vbm.SemanticType.Default;
                break;
            case "1":
                criticalityState = sap.ui.vbm.SemanticType.Error;
                break;
            case "2":
                criticalityState = sap.ui.vbm.SemanticType.Warning;
                break;
            case "3":
                criticalityState = sap.ui.vbm.SemanticType.Success;
                break;
            default:
                criticalityState = sap.ui.vbm.SemanticType.None;
                break;
        }
        return criticalityState;
    };

    sap.ovp.cards.AnnotationHelper.labelText = function (iContext, collection) {
        var oModel = iContext.getSetting('ovpCardProperties');
        var showText = oModel.getProperty('/showLabelText');

        if (showText === "true") {
            var option = collection.Address[0];
            if (typeof option.country !== "undefined") {
                return "{path:'" + option.country.Path + "'}";
            } else if (typeof option.locality !== "undefined") {
                return "{path:'" + option.locality.Path + "'}";
            } else if (typeof option.street !== "undefined") {
                return "{path:'" + option.street.Path + "'}";
            } else if (typeof option.code !== "undefined") {
                return "{path:'" + option.code.Path + "'}";
            }
        } else {
            return null;
        }
    };

    function getCacheEntry(iContext, sKey) {
        if (iContext.getSetting) {
            var oCache = iContext.getSetting("_ovpCache");
            // temp fix
            if (oCache) {
                return oCache[sKey];
            }
        }
        return undefined;
    }

    function setCacheEntry(iContext, sKey, oValue) {
        if (iContext.getSetting) {
            var oCache = iContext.getSetting("_ovpCache");
            // temp fix
            if (oCache) {
                oCache[sKey] = oValue;
            }
        }
    }

    function setFormatFunctionAndGetFunctionName(func, sNamePrefix) {
        if (!sap.ovp.cards.AnnotationHelper.formatFunctions[sNamePrefix]) {
            sap.ovp.cards.AnnotationHelper.formatFunctions[sNamePrefix] = 0;
        }
        sap.ovp.cards.AnnotationHelper.formatFunctions[sNamePrefix]++;

        var sFuncName = sNamePrefix + sap.ovp.cards.AnnotationHelper.formatFunctions[sNamePrefix];
        sap.ovp.cards.AnnotationHelper.formatFunctions[sFuncName] = func;

        return "sap.ovp.cards.AnnotationHelper.formatFunctions." + sFuncName;
    }

    function criticality2state(criticality, oCriticalityConfigValues) {
        var sState;
        if (oCriticalityConfigValues) {
            sState = oCriticalityConfigValues.None;
            if (criticality && criticality.EnumMember) {
                var val = criticality.EnumMember;
                if (endsWith(val, 'Negative')) {
                    sState = oCriticalityConfigValues.Negative;
                } else if (endsWith(val, 'Critical')) {
                    sState = oCriticalityConfigValues.Critical;
                } else if (endsWith(val, 'Positive')) {
                    sState = oCriticalityConfigValues.Positive;
                }
            }
        }
        return sState;
    }

    function criticalityState2Value(sState) {
        if (sState == "Error") {
            sState = 1;
        } else if (sState == "Warning") {
            sState = 2;
        } else if (sState == "Success") {
            sState = 3;
        } else {
            sState = 0;
        }
        return sState;
    }

    function endsWith(sString, sSuffix) {
        return sString && sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
    }

    function calculateCriticalityState(value, sImproveDirection, deviationLow, deviationHigh, toleranceLow, toleranceHigh,
                                       oCriticalityConfigValues) {

        var oCriticality = {};
        oCriticality.EnumMember = "None";

        // number could be a zero number so check if it is not undefined
        if (value !== undefined) {
            value = Number(value);

            if (endsWith(sImproveDirection, "Minimize") || endsWith(sImproveDirection, "Minimizing")) {

                if ((toleranceHigh !== undefined && toleranceHigh !== null) && (deviationHigh != undefined && deviationHigh != null)) {
                    if (value <= toleranceHigh) {
                        oCriticality.EnumMember = "Positive";
                    } else if (value > deviationHigh) {
                        oCriticality.EnumMember = "Negative";
                    } else {
                        oCriticality.EnumMember = "Critical";
                    }
                }

            } else if (endsWith(sImproveDirection, "Maximize") || endsWith(sImproveDirection, "Maximizing")) {

                if ((toleranceLow !== undefined && toleranceLow !== null) && (deviationLow !== undefined && deviationLow !== null)) {
                    if (value >= toleranceLow) {
                        oCriticality.EnumMember = "Positive";
                    } else if (value < deviationLow) {
                        oCriticality.EnumMember = "Negative";
                    } else {
                        oCriticality.EnumMember = "Critical";
                    }
                }

            } else if (endsWith(sImproveDirection, "Target")) {

                if ((toleranceHigh !== undefined && toleranceHigh !== null) && (deviationHigh != undefined && deviationHigh != null) && (toleranceLow !== undefined && toleranceLow !== null) && (deviationLow !== undefined && deviationLow !== null)) {
                    if (value >= toleranceLow && value <= toleranceHigh) {
                        oCriticality.EnumMember = "Positive";
                    } else if (value < deviationLow || value > deviationHigh) {
                        oCriticality.EnumMember = "Negative";
                    } else {
                        oCriticality.EnumMember = "Critical";
                    }
                }
            }
        }

        return criticality2state(oCriticality, oCriticalityConfigValues);
    }

    /* Trend Direction for Header */
    function calculateTrendDirection(aggregateValue, referenceValue, downDifference, upDifference) {
        if (!aggregateValue || !referenceValue) {
            return;
        }

        aggregateValue = Number(aggregateValue);

        if (!upDifference && (aggregateValue - referenceValue >= 0)) {
            return "sap-icon://trend-up";
        }
        if (!downDifference && (aggregateValue - referenceValue <= 0)) {
            return "sap-icon://trend-down";
        }

        if (referenceValue && upDifference && (aggregateValue - referenceValue >= upDifference)) {
            return "sap-icon://trend-up";
        }
        if (referenceValue && downDifference && (aggregateValue - referenceValue <= downDifference)) {
            return "sap-icon://trend-down";
        }
    }

    /**
     * This function returns the dataField annotations in sorted order
     **/
    function getSortedDataFields(iContext, aCollection) {
        var sCacheKey = iContext.getPath() + "-DataFields-Sorted";
        var aSortedFields = getCacheEntry(iContext, sCacheKey);
        if (!aSortedFields) {
            var aDataPoints = getSortedDataPoints(iContext, aCollection);
            var aDataPointsValues = aDataPoints.map(function (oDataPoint) {
                return oDataPoint.Value.Path;
            });
            aDataPointsValues = aDataPointsValues.filter(function (element) {
                return !!element;
            });
            aSortedFields = aCollection.filter(function (item) {
                if (item.RecordType === "com.sap.vocabularies.UI.v1.DataField" && aDataPointsValues.indexOf(item.Value.Path) === -1) {
                    return true;
                }
                return false;
            });
            aSortedFields = sortCollectionByImportance(aSortedFields);
            setCacheEntry(iContext, sCacheKey, aSortedFields);
        }
        return aSortedFields;
    }

    function getSortedDataPoints(iContext, aCollection, sortForTableCard) {
        var sCacheKey = iContext.getPath() + "-DataPoints-Sorted";
        var aSortedFields = getCacheEntry(iContext, sCacheKey);
        if (!aSortedFields) {
            if (sortForTableCard) {
                aSortedFields = aCollection.filter(isDataFieldForAnnotationWithDataPointOrContact);
            } else {
                aSortedFields = aCollection.filter(isDataFieldForAnnotation);
            }
            aSortedFields = sortCollectionByImportance(aSortedFields);
            var sEntityTypePath;
            for (var i = 0; i < aSortedFields.length; i++) {
                sEntityTypePath = iContext.getPath().substr(0, iContext.getPath().lastIndexOf("/") + 1);
                aSortedFields[i] = iContext.getModel().getProperty(getTargetPathForDataFieldForAnnotation(sEntityTypePath, aSortedFields[i]));
                sEntityTypePath = "";
            }
            setCacheEntry(iContext, sCacheKey, aSortedFields);
        }
        return aSortedFields;
    }

    function isDataFieldForAnnotation(oItem) {
        if (oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" &&
            oItem.Target.AnnotationPath.match(/@com.sap.vocabularies.UI.v1.DataPoint.*/)) {
            return true;
        }
        return false;
    }

    /**
     in case of table card check both data point and contact annotation property with data field property if they are same then remove the data field
     so only quick view with contact information shown and smartlink with  semantic object will be removed
    **/
    function isDataFieldForAnnotationWithDataPointOrContact(oItem) {
        if ((oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && oItem.Target.AnnotationPath.match(/@com.sap.vocabularies.UI.v1.DataPoint.*/)) ||
            (oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && oItem.Target.AnnotationPath.match(/@com.sap.vocabularies.Communication.v1.Contact.*/))) {
            return true;
        }
        return false;
    }

    /**
     * This function returns formatted field for criticality path
     * @param oDataFieldForAnnotation
     * @returns {string}
     */
    function getCriticalityForDataPoint(oDataFieldForAnnotation) {
        if (!oDataFieldForAnnotation || !oDataFieldForAnnotation.Criticality || !oDataFieldForAnnotation.Criticality.Path) {
            return;
        }
        return "{path:'" + oDataFieldForAnnotation.Criticality.Path + "'}";
    };

    function getTargetPathForDataFieldForAnnotation(sEntityTypePath, oDataFieldForAnnotation) {
        if (sEntityTypePath && !endsWith(sEntityTypePath, '/')) {
            sEntityTypePath += '/';
        }
        return sEntityTypePath + oDataFieldForAnnotation.Target.AnnotationPath.slice(1);
    }

    function getImportance(oDataField) {
        var sImportance, iImportance;
        if (oDataField["com.sap.vocabularies.UI.v1.Importance"]) {
            sImportance = oDataField["com.sap.vocabularies.UI.v1.Importance"].EnumMember;
            switch (sImportance) {
                case "com.sap.vocabularies.UI.v1.ImportanceType/High":
                    iImportance = 1;
                    break;
                case "com.sap.vocabularies.UI.v1.ImportanceType/Medium":
                    iImportance = 2;
                    break;
                case "com.sap.vocabularies.UI.v1.ImportanceType/Low":
                    iImportance = 3;
                    break;
            }
        } else {
            iImportance = 4;
        }
        return iImportance;
    }

    /**
     * Sorting the collection by importance. Using merge sort as the Javascript sort implementation behaves unexpectedly
     * for same elements - it is a known issue
     * @param aCollection
     * @returns [] - SortedArray
     */
    function sortCollectionByImportance(aCollection) {
        if (aCollection.length < 2) {
            return aCollection;
        }

        var middle = parseInt(aCollection.length / 2, 10);
        var left = aCollection.slice(0, middle);
        var right = aCollection.slice(middle, aCollection.length);

        return merge(sortCollectionByImportance(left), sortCollectionByImportance(right));
    }

    function merge(left, right) {
        var aSortedArray = [];
        while (left.length && right.length) {
            var aImportance = getImportance(left[0]),
                bImportance = getImportance(right[0]);
            if (aImportance <= bImportance) {
                aSortedArray.push(left.shift());
            } else {
                aSortedArray.push(right.shift());
            }
        }
        while (left.length) {
            aSortedArray.push(left.shift());
        }
        while (right.length) {
            aSortedArray.push(right.shift());
        }

        return aSortedArray;
    }

    function formatDataField(iContext, aCollection, index) {
        var item = getSortedDataFields(iContext, aCollection)[index];
        if (item) {
            return formatField(iContext, item);
        }
        return "";
    }

    function getDataFieldName(iContext, aCollection, index) {
        var item = getSortedDataFields(iContext, aCollection)[index];

        if (item) {
            return item.Label.String;
        }
        return "";
    }

    function getDataPointName(iContext, aCollection, index) {
        var item = getSortedDataPoints(iContext, aCollection)[index];

        if (item && item.Title) {
            return item.Title.String;
        }
        return "";
    }

    function formatDataPoint(iContext, aCollection, index) {
        var item = getSortedDataPoints(iContext, aCollection)[index];
        if (!item) {
            return "";
        }

        var oModel = iContext.getSetting('ovpCardProperties');
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");

        return _formatDataPoint(iContext, item, oEntityType, oMetaModel);
    }

    function criticalityConditionCheck(iContext, aCollection, index) {
        var item = getSortedDataPoints(iContext, aCollection)[index];
        if (item && item.Criticality) {
            return true;
        }
    }

    function getCriticality(iContext, aCollection, index) {
        var item = getSortedDataPoints(iContext, aCollection)[index];
        var criticalityStatus = item.Criticality.Path;
        return "{path:'" + criticalityStatus + "'}";
    }

    function _formatDataPoint(iContext, oItem, oEntityType, oMetaModel) {

        if (!oItem || !oItem.Value) {
            return "";
        }

        var oModel = iContext.getSetting('ovpCardProperties');
        var bIgnoreSapText = false;
        if (oModel) {
            var bExtractedIgnoreSapText = oModel.getProperty("/ignoreSapText");
            bIgnoreSapText = bExtractedIgnoreSapText == undefined ? bIgnoreSapText : bExtractedIgnoreSapText;
        }
        var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oItem.Value.Path);

        //Support sap:aggregation-role=measure configuration
        var bMeasuresType = false;
        if (bIgnoreSapText == true) { //as part of supporting V4 annotation
            if (oEntityTypeProperty && (oEntityTypeProperty["com.sap.vocabularies.Analytics.v1.Measure"] || oEntityTypeProperty["sap:aggregation-role"] == "measure")) {
                bMeasuresType = true;
            }
        }

        //Support sap:text attribute
        if (!bMeasuresType && oEntityTypeProperty) {
            var txtValue;
            if (oEntityTypeProperty["com.sap.vocabularies.Common.v1.Text"]) {  //as part of supporting V4 annotation
                txtValue = oEntityTypeProperty["com.sap.vocabularies.Common.v1.Text"].String ? oEntityTypeProperty["com.sap.vocabularies.Common.v1.Text"].String : oEntityTypeProperty["com.sap.vocabularies.Common.v1.Text"].Path;
            } else if (oEntityTypeProperty["sap:text"]) {
                txtValue = oEntityTypeProperty["sap:text"];
            }
            if (txtValue) {
                oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, txtValue);
                oItem = {
                    Value: {
                        Path: oEntityTypeProperty.name
                    }
                };
            }
        }
        return formatField(iContext, oItem);
    }

    function formatField(iContext, item, bDontIncludeUOM, bIncludeOnlyUOM) {

        if (item.Value.Apply) {
            return sap.ui.model.odata.AnnotationHelper.format(iContext, item.Value);
        }

        var oModel = iContext.getSetting('ovpCardProperties');
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");

        return _formatField(iContext, item, oEntityType, oMetaModel, bDontIncludeUOM, bIncludeOnlyUOM);
    }

    /**
     * This function checks if the given property (oProperty)
     * has a text annotation associated with it, if yes it returns the appropriate binding
     * based on the textArrangement annotation, the default is TEXT_LAST
     * @param oEntityType  OPTIONAL
     * @param oProperty    MANDATORY
     * @param sIdBinding   MANDATORY
     * @returns String
     */
    function getTextArrangementBinding(iContext, oEntityType, oProperty, sIdBinding) {

        if ((!oProperty) || (typeof sIdBinding !== 'string')) {
            return sIdBinding;
        }
        //Get Text Arrangement annotation
        var oText = oProperty[sap.ovp.cards.AnnotationHelper.AnnotationType.TEXT];
        //No Text found to be used in Text Arrangement
        if (!oText) {
            return sIdBinding;
        }
        var oTextArrangement, sTextArrangementType;
        //Text Arrangement annotation can be at property level, text level or entity level
        // 1. check TextArrangement definition for property - Priority 1 (max)
        oTextArrangement = oProperty[sap.ovp.cards.AnnotationHelper.AnnotationType.TEXT_ARRANGEMENT];
        sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;

        // 2. check TextArrangement definition under property/text - Priority 2
        if (!sTextArrangementType) {
            oTextArrangement = oText && oText[sap.ovp.cards.AnnotationHelper.AnnotationType.TEXT_ARRANGEMENT];
            sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
        }
        // 3. check TextArrangement definition for entity type - Priority 3 (min)
        if (!sTextArrangementType) {
            oTextArrangement = oEntityType && oEntityType[sap.ovp.cards.AnnotationHelper.AnnotationType.TEXT_ARRANGEMENT];
            sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
        }
        //No Text Arrangement found
        if (!sTextArrangementType) {
            return sIdBinding;
        }
        var sDescriptionBinding = sap.ui.model.odata.AnnotationHelper.format(iContext, oText);
        //No Text Arrangement Binding found
        if (!sDescriptionBinding || sDescriptionBinding === " ") {
            return sIdBinding;
        }
        var sFinalBinding;
        switch (sTextArrangementType) {
            case sap.ovp.cards.AnnotationHelper.TextArrangementType.TEXT_FIRST :
                sFinalBinding = sDescriptionBinding + " (" + sIdBinding + ")";
                break;
            case sap.ovp.cards.AnnotationHelper.TextArrangementType.TEXT_LAST :
                sFinalBinding = sIdBinding + " (" + sDescriptionBinding + ")";
                break;
            case sap.ovp.cards.AnnotationHelper.TextArrangementType.TEXT_ONLY :
                sFinalBinding = sDescriptionBinding;
                break;
            case sap.ovp.cards.AnnotationHelper.TextArrangementType.TEXT_SEPARATE :
                //Text Separate not supported, fallback to text last.
                sFinalBinding = sIdBinding + " (" + sDescriptionBinding + ")";
                break;
            default :
                sFinalBinding = sIdBinding;
                break;
        }
        return sFinalBinding;
    }

    function _formatField(iContext, oItem, oEntityType, oMetaModel, bDontIncludeUOM, bIncludeOnlyUOM, bUseSimplePath) {

        if (oItem.Value.Apply) {
            return sap.ui.model.odata.AnnotationHelper.format(iContext, oItem.Value);
        }

        var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oItem.Value.Path),
            result = "",
            functionName;
        var oCardProperties = iContext.getSetting("ovpCardProperties");
        var sContentFragment = oCardProperties && oCardProperties.getProperty("/contentFragment");

        if (!bIncludeOnlyUOM) {

            //Support association
            if (oItem.Value.Path.split("/").length > 1) {
                oEntityTypeProperty = getNavigationSuffix(oMetaModel, oEntityType, oItem.Value.Path);
            }
            if (!oEntityTypeProperty) {
                return "";
            }
            //Item has ValueFormat annotation
            if (oEntityTypeProperty["type"] === 'Edm.DateTime' || oEntityTypeProperty["type"] === 'Edm.DateTimeOffset') {
                // Getting Parameter value from card properties
                var showDateInRelativeFormat = oCardProperties && oCardProperties.getProperty("/showDateInRelativeFormat");
                functionName = getDateFormatFunctionName("dateFormatFunction", showDateInRelativeFormat);
                result = generatePathForField([oItem.Value.Path ? oItem.Value.Path : oEntityTypeProperty.name], functionName);
            } else if ((oItem.ValueFormat && oItem.ValueFormat.NumberOfFractionalDigits) || oEntityTypeProperty["scale"]) {

                //By default no decimals would be shown
                //If user specifies in Annotations then he can set 1 or 2 decimal places.
                // If he provides a value beyond 2 then also it would be considered as 2.

                var iScale = (oItem.ValueFormat && oItem.ValueFormat.NumberOfFractionalDigits) ? oItem.ValueFormat.NumberOfFractionalDigits.Int : 0, sUnitPath;
                if (oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"]) { //as part of supporting V4 annotation
                    sUnitPath = oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"].Path ? oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"].Path : oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"].String;
                } else if (oEntityTypeProperty["Org.OData.Measures.V1.Unit"]) {
                    sUnitPath = oEntityTypeProperty["Org.OData.Measures.V1.Unit"].Path ? oEntityTypeProperty["Org.OData.Measures.V1.Unit"].Path : oEntityTypeProperty["Org.OData.Measures.V1.Unit"].String;
                } else if (oEntityTypeProperty["sap:unit"]) {
                    sUnitPath = oEntityTypeProperty["sap:unit"];
                }
                var oUnitProperty = sUnitPath ? oMetaModel.getODataProperty(oEntityType, sUnitPath) : null,
                    aParts = [oItem.Value.Path ? oItem.Value.Path : oEntityTypeProperty.name];

                //Default value for currency and number scale if scale is more than 2
                if (iScale > 2) {
                    iScale = 2;
                }
                // check if currency is applicable and format the number based on currency or number
                if (oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"]) {
                    var oCurrency = oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"];
                    if (oCurrency.Path) {
                        functionName = getCurrencyFormatFunctionName(iScale);
                        aParts.push(oCurrency.Path);
                    } else if (oCurrency.String) {
                        functionName = getCurrencyFormatFunctionName(iScale, oCurrency.String);
                    }  //as part of supporting V4 annotation
                } else if (oUnitProperty && (oUnitProperty["Org.OData.Measures.V1.ISOCurrency"] || oUnitProperty["sap:semantics"] === "currency-code")) {
                    functionName = getCurrencyFormatFunctionName(iScale);
                    aParts.push(sUnitPath);
                } else {
                    //If there is no value format annotation, we will use the metadata scale property
                    functionName = getNumberFormatFunctionName(iScale);
                }
                result = generatePathForField(aParts, functionName);

            } else {
                if (bUseSimplePath) {
                    result = sap.ui.model.odata.AnnotationHelper.simplePath(iContext, oItem.Value);
                } else {
                    result = sap.ui.model.odata.AnnotationHelper.format(iContext, oItem.Value);
                }
            }

            //Get text arrangement (if present) binding for the property
            //Text Arrangement to be applied only for table card
            if (sContentFragment && sContentFragment === "sap.ovp.cards.table.Table") {
                result = getTextArrangementBinding(iContext,oEntityType,oEntityTypeProperty,result);
            }

            //Add unit using path or string
            if (oEntityTypeProperty["Org.OData.Measures.V1.Unit"]) {
                var oUnit = oEntityTypeProperty["Org.OData.Measures.V1.Unit"];
                if (oUnit.Path) {
                    result += (" " + generatePathForField([oUnit.Path]));
                } else if (oUnit.String) {
                    //If the unit string is percentage, then no space required
                    //Note that if % comes from path, then space will be there
                    if (oUnit.String !== "%") {
                        result += " ";
                    }
                    result += oUnit.String;
                }
            }
        }

        if (!bDontIncludeUOM) {
            //Add currency using path or string
            if (oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"]) {
                var oCurrency = oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"];
                if (oCurrency.Path) {
                    result += (" " + generatePathForField([oCurrency.Path]));
                } else if (oCurrency.String) {
                    result += (" " + oCurrency.String);
                }
            }

        }

        if (result[0] === " ") {
            result = result.substring(1);
        }
        return result;
    }

    /**
     * Note:if passing parts, then formatter is mandatory
     * @param aParts
     * @param sFormatterName
     * @returns {string}
     */
    function generatePathForField(aParts, sFormatterName) {
        var sPath = "", iLength = aParts.length;
        if (iLength > 1) {
            sPath = "{parts:[";
            for (var i = 0; i < iLength; i++) {
                sPath += ("{path: '" + aParts[i] + "'}" + ((i === iLength - 1) ? "]" : ", "));
            }
        } else {
            sPath = "{path: '" + aParts[0] + "'";
        }
        sPath += (sFormatterName ? (", formatter: '" + sFormatterName + "'") : "") + "}";
        return sPath;
    }

    function getNumberFormatFunctionName(numberOfFractionalDigits) {
        var functionName = "formatNumberCalculation" + numberOfFractionalDigits;
        if (!sap.ovp.cards.AnnotationHelper.NumberFormatFunctions[functionName]) {
            sap.ovp.cards.AnnotationHelper.NumberFormatFunctions[functionName] = generateNumberFormatFunc(Number(numberOfFractionalDigits));
        }
        return "sap.ovp.cards.AnnotationHelper.NumberFormatFunctions." + functionName;
    }

    function generateNumberFormatFunc(numOfFragmentDigit) {
        return function (value) {
            var formatNumber = sap.ui.core.format.NumberFormat.getFloatInstance({
                style: 'short',
                showMeasure: false,
                minFractionDigits: numOfFragmentDigit,
                maxFractionDigits: numOfFragmentDigit
            });
            return formatNumber.format(Number(value));
        };
    }

    /**
     * Returns the date formatter function name
     * @param functionName
     * @param showDateInRelativeFormat
     * @returns {string}
     */
    function getDateFormatFunctionName(functionName, showDateInRelativeFormat) {
        // generate date formatter function is not available
        // By default or if showDateInRelativeFormat is true relative Date Format is selected
        var dateFormat = {
            'relative': true,
            'relativeScale': 'auto'
        };
        // Otherwise if showDateInRelativeFormat is false then medium Date format is used
        if (showDateInRelativeFormat !== undefined && !showDateInRelativeFormat) {
            dateFormat = {
                'style': 'medium'
            };
        }
        if (!sap.ovp.cards.AnnotationHelper.DateFormatFunctions[functionName]) {
            sap.ovp.cards.AnnotationHelper.DateFormatFunctions[functionName] = function (value) {
                var oDateFormatter = sap.ui.core.format.DateFormat.getInstance(dateFormat);
                if (!value) {
                    value = "";
                    return value;
                }
                return oDateFormatter.format(new Date(value));
            };
        }
        return "sap.ovp.cards.AnnotationHelper.DateFormatFunctions." + functionName;
    }

    /**
     * Returns the currency formatter function based on the scale and currency
     * @param iNumberOfFractionalDigits
     * @param sCurrency - optional parameter
     * @returns {string}
     */
    function getCurrencyFormatFunctionName(iNumberOfFractionalDigits, sCurrency) {
        var functionName = "formatCurrencyCalculation" + (sCurrency ? sCurrency + iNumberOfFractionalDigits : iNumberOfFractionalDigits);
        if (!sap.ovp.cards.AnnotationHelper.CurrencyFormatFunctions[functionName]) {
            sap.ovp.cards.AnnotationHelper.CurrencyFormatFunctions[functionName] = generateCurrencyFormatFunc(iNumberOfFractionalDigits, sCurrency);
        }
        return "sap.ovp.cards.AnnotationHelper.CurrencyFormatFunctions." + functionName;
    }

    /**
     * Generates the currency formatter function based on the currency and scale
     * @param iNumOfFragmentDigit
     * @param sCurrency
     * @returns {Function}
     */
    function generateCurrencyFormatFunc(iNumOfFragmentDigit, sCurrency) {
        return function (value, currency) {
            var sFormattedValue = "";
            var oCurrencyFormatter = sap.ui.core.format.NumberFormat.getCurrencyInstance({
                style: 'short',
                showMeasure: false,
                minFractionDigits: iNumOfFragmentDigit,
                maxFractionDigits: iNumOfFragmentDigit
            });
            if (currency) {
                sFormattedValue = oCurrencyFormatter.format(value, currency);
            } else {
                sFormattedValue = sCurrency ? oCurrencyFormatter.format(value, sCurrency) : oCurrencyFormatter.format(value);
            }
            return sFormattedValue;
        };
    }

    function getNavigationSuffix(oMetaModel, oEntityType, sProperty) {
        var aParts = sProperty.split("/");

        if (aParts.length > 1) {
            for (var i = 0; i < (aParts.length - 1); i++) {
                var oAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityType, aParts[i]);
                if (oAssociationEnd) {
                    oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
                }
            }

            return oMetaModel.getODataProperty(oEntityType, aParts[aParts.length - 1]);
        }
    }

    function formatDataPointState(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection);
        var sState = "None",
            oCriticalityConfigValues = sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues;
        if (aDataPoints.length > index) {
            var item = aDataPoints[index];
            if (item && item.Criticality) {
                sState = buildExpressionForProgressIndicatorCriticality(iContext, item, oCriticalityConfigValues);
            } else {
                sState = formatDataPointToValue(iContext, item, oCriticalityConfigValues);
            }
        }
        return sState;
    }

    function hasCriticalityAnnotation(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection);
        // aDataPoints is not Undefined and aDataPoints.length is not 0
        if (aDataPoints && aDataPoints.length) {
            var item = aDataPoints[0];
            if (item && (item.Criticality || item.CriticalityCalculation)) {
                return true;
            }
        }
        return false;
    }

    sap.ovp.cards.AnnotationHelper.colorPaletteForComparisonMicroChart = function (iContext, aCollection, index) {
        if (hasCriticalityAnnotation(iContext, aCollection, index)) {
            return '';
        }
        //sapUiChartPaletteQualitativeHue1
        return '#5cbae6';
    };

    function formatDataPointColor(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection),
            sState = "None",
            oCriticalityConfigValues = sap.ovp.cards.AnnotationHelper.criticalityConstants.ColorValues;
        if (aDataPoints.length > index) {
            var item = aDataPoints[index];
            if (item && item.Criticality) {
                sState = buildExpressionForProgressIndicatorCriticality(iContext, item, oCriticalityConfigValues);
            } else {
                sState = formatDataPointToValue(iContext, item, oCriticalityConfigValues);
            }

        }
        return sState;
    }

    function buildExpressionForProgressIndicatorCriticality(oInterface,
                                                            dataPoint, oCriticalityConfigValues) {
        var sFormatCriticalityExpression = sap.ui.core.ValueState.None;
        var sExpressionTemplate;
        var oCriticalityProperty = dataPoint.Criticality;

        if (oCriticalityProperty) {
            sExpressionTemplate = "'{'= ({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Negative'') || ({0} === ''1'') || ({0} === 1) ? ''"
            + oCriticalityConfigValues.Negative
            + "'' : "
            + "({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Critical'') || ({0} === ''2'') || ({0} === 2) ? ''"
            + oCriticalityConfigValues.Critical
            + "'' : "
            + "({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Positive'') || ({0} === ''3'') || ({0} === 3) ? ''"
            + oCriticalityConfigValues.Positive
            + "'' : "
            + "''"
            + oCriticalityConfigValues.None + "'' '}'";
            if (oCriticalityProperty.Path) {
                var sCriticalitySimplePath = '$'
                    + sap.ui.model.odata.AnnotationHelper.simplePath(
                        oInterface, oCriticalityProperty);
                sFormatCriticalityExpression = jQuery.sap.formatMessage(
                    sExpressionTemplate, sCriticalitySimplePath);
            } else if (oCriticalityProperty.EnumMember) {
                var sCriticality = "'" + oCriticalityProperty.EnumMember + "'";
                sFormatCriticalityExpression = jQuery.sap.formatMessage(
                    sExpressionTemplate, sCriticality);
            } else {
                jQuery.sap.log
                    .warning("Case not supported, returning the default sap.ui.core.ValueState.None");
            }
        } else {
            // Any other cases are not valid, the default value of 'None' will
            // be returned
            jQuery.sap.log
                .warning("Case not supported, returning the default sap.ui.core.ValueState.None");
        }

        return sFormatCriticalityExpression;
    }

    function formatDataPointStateForSmartField(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection);
        var sState = "None";
        if (aDataPoints.length > index) {
            var item = aDataPoints[index];
            if (item && item.Criticality && item.Criticality.Path) {
                sState = getCriticality(iContext, aCollection, index);
            } else {
                sState = formatDataPointToValue(iContext, item, sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues);
                sState = criticalityState2Value(sState);
            }
        }
        return sState;
    }


    function formatDataPointToValue(iContext, oDataPoint, oCriticalityConfigValues) {
        var sState = oCriticalityConfigValues.None;
        if (oDataPoint.Criticality) {
            sState = criticality2state(oDataPoint.Criticality, oCriticalityConfigValues);
        } else if (oDataPoint.CriticalityCalculation && oDataPoint.Value && oDataPoint.Value && oDataPoint.Value.Path) {
            sState = formThePathForCriticalityStateCalculation(iContext, oDataPoint, oCriticalityConfigValues);
        }

        return sState;
    }

    function formThePathForCriticalityStateCalculation(iContext, oDataPoint, oCriticalityConfigValues) {

        var value = getPathOrPrimitiveValue(oDataPoint.Value);
        var sImprovementDirection = oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember;

        var deviationLow = getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeLowValue);
        var deviationHigh = getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeHighValue);
        var toleranceLow = getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue);
        var toleranceHigh = getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue);

        var bIsDeviationLowBinding = isBindingValue(deviationLow);
        var bIsDeviationHighBinding = isBindingValue(deviationHigh);
        var bIsToleranceLowBinding = isBindingValue(toleranceLow);
        var bIsToleranceHighBinding = isBindingValue(toleranceHigh);

        var sParts = "parts: [" + value;
        sParts += bIsDeviationLowBinding ? "," + deviationLow : "";
        sParts += bIsDeviationHighBinding ? "," + deviationHigh : "";
        sParts += bIsToleranceLowBinding ? "," + toleranceLow : "";
        sParts += bIsToleranceHighBinding ? "," + toleranceHigh : "";
        sParts += "]";

        var formatFunc = function () {
            var index = 1;
            return calculateCriticalityState(
                arguments[0],
                sImprovementDirection,
                bIsDeviationLowBinding ? arguments[index++] : deviationLow,
                bIsDeviationHighBinding ? arguments[index++] : deviationHigh,
                bIsToleranceLowBinding ? arguments[index++] : toleranceLow,
                bIsToleranceHighBinding ? arguments[index++] : toleranceHigh,
                oCriticalityConfigValues
            );
        };

        var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatCriticalityCalculation");
        return "{" + sParts + ", formatter: '" + sFormatFuncName + "'}";
    }

    function isBindingValue(value) {
        return (typeof value === "string") && value.charAt(0) === "{";
    }

    function getNavigationPrefix(oMetaModel, oEntityType, sProperty) {
        var sExpand = "";
        var aParts = sProperty.split("/");

        if (aParts.length > 1) {
            for (var i = 0; i < (aParts.length - 1); i++) {
                var oAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityType, aParts[i]);
                if (oAssociationEnd) {
                    oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
                    if (sExpand) {
                        sExpand = sExpand + "/";
                    }
                    sExpand = sExpand + aParts[i];
                } else {
                    return sExpand;
                }
            }
        }

        return sExpand;
    }

    sap.ovp.cards.AnnotationHelper.formatField = function (iContext, oItem) {
        return formatField(iContext, oItem);
    };

    /*
     * This formatter method parses the List-Card List's items aggregation path in the Model.
     * The returned path may contain also sorter definition (for the List) sorting is defined
     * appropriately via respected Annotations.
     *
     * @param iContext
     * @param itemsPath
     * @returns List-Card List's items aggregation path in the Model
     */
    sap.ovp.cards.AnnotationHelper.formatItems = function (iContext, oEntitySet) {
        var oModel = iContext.getSetting('ovpCardProperties');

        var bAddODataSelect = oModel.getProperty("/addODataSelect");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
        var oSelectionVariant = oEntityType[oModel.getProperty('/selectionAnnotationPath')];
        var oPresentationVariant = oEntityType[oModel.getProperty('/presentationAnnotationPath')];
        var sEntitySetPath = "/" + oEntitySet.name;
        var aAnnotationsPath = Array.prototype.slice.call(arguments, 2);

        //check if entity set needs parameters
        // if selection-annotations path is supplied - we need to resolve it in order to resolve the full entity-set path
        if (oSelectionVariant) {
            if (oSelectionVariant && oSelectionVariant.Parameters && oSelectionVariant.Parameters.length > 0) {
                // in case we have UI.SelectionVariant annotation defined on the entityType including Parameters - we need to resolve the entity-set path to include it
                sEntitySetPath = sap.ovp.cards.AnnotationHelper.resolveParameterizedEntitySet(iContext.getSetting('dataModel'), oEntitySet,
                    oSelectionVariant);
            }
        }

        if (oModel.getProperty("/cardLayout") && oModel.getProperty("/cardLayout/noOfItems")) {
            var result = "{path: '" + sEntitySetPath + "', length: " + +(oModel.getProperty("/cardLayout/noOfItems"));
        } else {
            var result = "{path: '" + sEntitySetPath + "', length: " + getItemsLength(oModel);
        }

        //prepare the select fields in case flag is on
        var aSelectFields = [];
        if (bAddODataSelect) {
            aSelectFields = getSelectFields(iContext, oMetaModel, oEntityType, aAnnotationsPath);
        }
        //prepare the expand list if navigation properties are used
        var aExpand = getExpandList(oMetaModel, oEntityType, aAnnotationsPath);

        //add select and expand parameters to the binding info string if needed
        if (aSelectFields.length > 0 || aExpand.length > 0) {
            result = result + ", parameters: {";
            if (aSelectFields.length > 0) {
                result = result + "select: '" + aSelectFields.join(',') + "'";
            }

            if (aExpand.length > 0) {
                if (aSelectFields.length > 0) {
                    result = result + ", ";
                }
                result = result + "expand: '" + aExpand.join(',') + "'";
            }
            result = result + "}";
        }

        //apply sorters information
        var aSorters = getSorters(oModel, oPresentationVariant);
        if (aSorters.length > 0) {
            result = result + ", sorter:" + JSON.stringify(aSorters);
        }

        //apply filters information
        var aFilters = getFilters(oModel, oSelectionVariant);
        if (aFilters.length > 0) {
            result = result + ", filters:" + JSON.stringify(aFilters);
        }
        result = result + "}";

        // returning the parsed path for the Card's items-aggregation binding
        return result;
    };

    /**
     * returns an array of navigation properties prefixes to be used in an odata $expand parameter
     *
     * @param oMetaModel - metamodel to get the annotations to query
     * @param oEntityType - the relevant entityType
     * @param aAnnotationsPath - an array of annotation path to check
     * @returns {Array} of navigation properties prefixes to be used in an odata $expand parameter
     */
    function getExpandList(oMetaModel, oEntityType, aAnnotationsPath) {
        var aExpand = [];
        var sAnnotationPath, oBindingContext, aColl, sExpand;

        //loop over the annotation paths
        for (var i = 0; i < aAnnotationsPath.length; i++) {
            if (!aAnnotationsPath[i]) {
                continue;
            }
            sAnnotationPath = oEntityType.$path + "/" + aAnnotationsPath[i];
            oBindingContext = oMetaModel.createBindingContext(sAnnotationPath);
            aColl = oBindingContext.getObject();
            //if the annotationPath does not exists there is no BindingContext
            aColl = aColl ? aColl : [];
            for (var j = 0; j < aColl.length; j++) {
                if (aColl[j].Value && aColl[j].Value.Path) {
                    sExpand = getNavigationPrefix(oMetaModel, oEntityType, aColl[j].Value.Path);
                    if (sExpand && aExpand.indexOf(sExpand) === -1) {
                        aExpand.push(sExpand);
                    }
                }
            }
        }
        return aExpand;
    }

    /**
     * returns an array of properties paths to be used in an odata $select parameter
     *
     * @param oMetaModel - metamodel to get the annotations to query
     * @param oEntityType - the relevant entityType
     * @param aAnnotationsPath - an array of annotation path to check
     * @returns {Array} of properties paths to be used in an odata $select parameter
     */
    function getSelectFields(iContext, oMetaModel, oEntityType, aAnnotationsPath) {

        var aSelectFields = [];
        var sAnnotationPath, oBindingContext, aColl;

        //loop over the annotation paths
        for (var i = 0; i < aAnnotationsPath.length; i++) {
            if (!aAnnotationsPath[i]) {
                continue;
            }

            sAnnotationPath = oEntityType.$path + "/" + aAnnotationsPath[i];
            oBindingContext = oMetaModel.createBindingContext(sAnnotationPath);

            var oContext = {};

            // This is currently true for stack cards, we have sent a dummy iContext which we need to enrich in order to format fields correctly
            if (iContext && iContext.bDummyContext) {
                jQuery.extend(oContext, iContext, oBindingContext, true);
            } else {
                oContext = iContext;
            }

            aColl = oBindingContext.getObject();

            //if the annotationPath does not exists there is no BindingContext
            if (!aColl) {
                aColl = [];
            } else if (jQuery.isPlainObject(aColl)) {
                // For the case of FieldGroups
                if (aColl.Data) {
                    aColl = aColl.Data;
                } else {
                    aColl = [];
                }
            }

            var oItem;
            var aItemValue;
            var sFormattedField;
            var sRecordType;
            for (var j = 0; j < aColl.length; j++) {

                aItemValue = [];
                oItem = aColl[j];
                sFormattedField = "";

                sRecordType = oItem.RecordType;

                if (sRecordType === "com.sap.vocabularies.UI.v1.DataField") {
                    // in case of a DataField we format the field to get biding string ; we use simple paths as we simply need select column names
                    sFormattedField = _formatField(oContext, oItem, oEntityType, oMetaModel, undefined, undefined, true);

                } else if (sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {

                    // in case of DataFieldForAnnotation we resolve the DataPoint target path of the DataField and format the field to get biding string
                    var sTargetPath = getTargetPathForDataFieldForAnnotation(oEntityType.$path, oItem);
                    sFormattedField = _formatDataPoint(oContext, oMetaModel.getProperty(sTargetPath), oEntityType, oMetaModel);

                    var sCriticality = getCriticalityForDataPoint(oMetaModel.getProperty(sTargetPath));
                    if (sCriticality && sCriticality.length > 0) {
                        sFormattedField += sCriticality;
                    }

                } else if (sRecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" && oItem.Url) {

                    // format the URL ONLY IN CASE NO UrlRef member resides under it
                    var sFormattedUrl;
                    if (!oItem.Url.UrlRef) {
                        sFormattedUrl = sap.ui.model.odata.AnnotationHelper.format(oContext, oItem.Url);
                    }

                    // meaning binding which needs to be evaluated at runtime
                    if (sFormattedUrl && sFormattedUrl.substring(0, 2) === "{=") {
                        sFormattedField = sFormattedUrl;
                    }
                }

                // if we have found a relevant binding-info-string this iteration then parse it to get binded properties
                if (sFormattedField) {
                    aItemValue = getPropertiesFromBindingString(sFormattedField);
                }

                if (aItemValue && aItemValue.length > 0) {
                    // for each property found we check if has sap:unit and sap:text
                    var sItemValue;
                    for (var k = 0; k < aItemValue.length; k++) {
                        sItemValue = aItemValue[k];

                        // if this property is found for the first time - look for its unit and text properties as well
                        if (!aSelectFields[sItemValue]) {

                            aSelectFields[sItemValue] = true;

                            // checking if we need to add also the sap:unit property of the field's value
                            var sUnitPropName = sap.ovp.cards.CommonUtils.getUnitColumn(sItemValue, oEntityType);
                            if (sUnitPropName && sUnitPropName !== sItemValue) {
                                aSelectFields[sUnitPropName] = true;
                            }

                            // checking if we need to add also the sap:text property of the field's value
                            var sTextPropName = getTextPropertyForEntityProperty(oMetaModel, oEntityType, sItemValue);
                            if (sTextPropName && sTextPropName !== sItemValue) {
                                aSelectFields[sTextPropName] = true;
                            }
                        }
                    }
                }
            }
        }
        // return all relevant property names
        return Object.keys(aSelectFields);
    }

    function getPropertiesFromBindingString(sBinding) {

        //Remove direct values and keep only the bindings in sBinding
        //"{NetAmount} kg" would be converted to "{NetAmount}"
        //"{NetAmount} kg {Country}" would be converted to "{NetAmount}{Country}"
        //"{path: Customer, formatter: something.something}" will remain as is
        var i, iMatchCount = 0, len = sBinding.length, sBindingPathOnly = "", sCharAt;
        for (i = 0; i < len; i++) {
            sCharAt = sBinding.charAt(i);
            if (!sCharAt) {
                return;
            }
            switch (sCharAt) {
                case "{" :
                    iMatchCount++; //Add opening brace to stack
                    break; //from switch (not loop)
                case "}" :
                    iMatchCount--; //Match and remove one opening brace from stack
                    break; //from switch (not loop)
                default:
                    //No opening braces in stack, that means current character is outside braces
                    //and should be ignored
                    if (iMatchCount <= 0) {
                        continue; //to next loop ignoring next statements
                    }
                    break; //from switch (not loop)
            }
            sBindingPathOnly += sCharAt;
        }
        sBinding = sBindingPathOnly;
        /**
         * BCP: 1680241227
         * Regex expressions were not handling properties that included the '_' character.
         * With '\_' as part of [a-zA-Z0-9], they should be able to handle.
         */
        var regexBindingEvaluation = /\${([a-zA-Z0-9\_|\/]*)/g;
        var regexBindingNoPath = /[^[{]*[a-zA-Z0-9\_]/g;
        var regexBindingPath = /path *\: *\'([a-zA-Z0-9\_]+)*\'/g;

        var regex, index, matches = [];

        //in case the path consists of parts - replace it with empty string so that
        //'parts' does not appear as a property
        if (sBinding.indexOf("{parts:[") !== -1) {
            sBinding = sBinding.replace("{parts:[", "");
        }

        if (sBinding.substring(0, 2) === "{=") {
            /*
             meaning binding string looks like "{= <rest of the binding string>}"
             which is a binding which needs to be evaluated using some supported function
             properties appear as ${propertyName} inside the string
             */
            regex = regexBindingEvaluation;

            /* index is 1 as each match found by this regular expression (by invoking regex.exec(string) below) */
            /* is an array of 2 items, for example ["${Address}", "Address"] so we need the 2nd result each match found */
            index = 1;

        } else if (sBinding.indexOf("path") !== -1) {

            /* In a scenario where binding contains string like "{propertyName} {path:'propertyName'}" */
            /* Here we get the properties without path and add it to array matches*/
            var matchWithNoPath = regexBindingNoPath.exec(sBinding);
            while (matchWithNoPath) {
                //i18n is also enclosed in braces, but that is not a property, so ignore them
                if (matchWithNoPath[0].indexOf("path") === -1 && matchWithNoPath[0].indexOf("@i18n") !== 0) {
                    matches.push(matchWithNoPath[0]);
                }
                matchWithNoPath = regexBindingNoPath.exec(sBinding);
            }

            /* meaning binding contains string like "{path:'propertyName'}" */
            regex = regexBindingPath;

            /* index is 1 as each match found by this regular expression (by invoking regex.exec(string) below) */
            /* is an array of 2 items, for example ["{path: 'Address'}", "Address"] so we need the 2nd result each match found */
            index = 1;

        } else {
            /* meaning binding contains string like "{'propertyName'}" */
            regex = regexBindingNoPath;

            /* index is 0 as each match found by this regular expression (by invoking regex.exec(string) below) */
            /* is an array of one item, for example ["Address"] so we need the 1st result each match found */
            index = 0;
        }

        var match = regex.exec(sBinding);
        while (match) {
            //i18n is also enclosed in braces, but that is not a property, so ignore them
            if (match[index] && match[index].indexOf("@i18n") !== 0) {
                matches.push(match[index]);
            }
            match = regex.exec(sBinding);
        }
        return matches;
    }

    /**
     * return the sorters that need to be applyed on an aggregation
     *
     * @param ovpCardProperties - card properties model which might contains sort configurations
     * @param oPresentationVariant - optional presentation variant annotation with SortOrder configuration
     * @returns {Array} of model sorters
     */
    function getSorters(ovpCardProperties, oPresentationVariant) {
        var aSorters = [];
        var oSorter, bDescending;

        //get the configured sorter if exist and append them to the sorters array
        var sPropertyPath = ovpCardProperties.getProperty("/sortBy");
        if (sPropertyPath) {
            // If sorting is enabled by card configuration
            var sSortOrder = ovpCardProperties.getProperty('/sortOrder');
            if (sSortOrder && sSortOrder.toLowerCase() !== 'descending') {
                bDescending = false;
            } else {
                bDescending = true;
            }
            oSorter = {
                path: sPropertyPath,
                descending: bDescending
            };
            aSorters.push(oSorter);
        }

        //get the sorters from the presentation variant annotations if exists
        var aSortOrder = oPresentationVariant && oPresentationVariant.SortOrder || undefined;
        var oSortOrder, sPropertyPath;
        if (aSortOrder) {
            for (var i = 0; i < aSortOrder.length; i++) {
                oSortOrder = aSortOrder[i];
                sPropertyPath = oSortOrder.Property.PropertyPath;
                bDescending = getBooleanValue(oSortOrder.Descending, true);
                oSorter = {
                    path: sPropertyPath,
                    descending: bDescending
                };
                aSorters.push(oSorter);
            }
        }

        return aSorters;
    }

    sap.ovp.cards.AnnotationHelper.getCardSelections = function (ovpCardProperties) {
        var oEntityType = ovpCardProperties.getProperty('/entityType');
        var oSelectionVariant = oEntityType[ovpCardProperties.getProperty('/selectionAnnotationPath')];
        return {
            filters: getFilters(ovpCardProperties, oSelectionVariant),
            parameters: getParameters(oSelectionVariant)
        };
    };

    sap.ovp.cards.AnnotationHelper.getCardSorters = function (ovpCardProperties) {
        var oEntityType = ovpCardProperties.getProperty('/entityType');
        var oPresentationVariant = oEntityType[ovpCardProperties.getProperty('/presentationAnnotationPath')];

        return getSorters(ovpCardProperties, oPresentationVariant);
    };

    /**
     * return the card level parameters defined in selection annotation
     *
     * @param oSelectionVariant - optional selection variant annotation with SelectOptions configuration
     * @returns {Array} of parameters
     */
    function getParameters(oSelectionVariant) {

        var oParameter, aParameters = [];

        //If selection variant or parameters do not exist in annotations
        if (!oSelectionVariant || !oSelectionVariant.Parameters) {
            return aParameters;
        }

        var iLength = oSelectionVariant.Parameters.length;
        for (var i = 0; i < iLength; i++) {
            oParameter = oSelectionVariant.Parameters[i];

            //If parameter property name or path not present
            if (!oParameter.PropertyName || !oParameter.PropertyName.PropertyPath) {
                continue;
            }

            //Property name is there but value annotation is not there, then give error
            if (!oParameter.PropertyValue) {
                jQuery.sap.log.error("Missing value for parameter " + oParameter.PropertyName.PropertyPath);
                continue;
            }

            aParameters[aParameters.length] = {
                path: oParameter.PropertyName.PropertyPath,
                value: sap.ovp.cards.AnnotationHelper.getPrimitiveValue(oParameter.PropertyValue)
            };
        }

        return aParameters;
    }

    /**
     * return the filters that need to be applyed on an aggregation
     *
     * @param ovpCardProperties - card properties model which might contains filters configurations
     * @param oSelectionVariant - optional selection variant annotation with SelectOptions configuration
     * @returns {Array} of model filters
     */
    function getFilters(ovpCardProperties, oSelectionVariant) {
        var aFilters = [];
        var aSelectOptions;
        //get the configured filters if exist and append them to the filter array
        var aConfigFilters = ovpCardProperties.getProperty("/filters");
        if (aConfigFilters) {
            aFilters = aFilters.concat(aConfigFilters);
        }

        //get the filters from the selection variant annotations if exists
        if (oSelectionVariant && oSelectionVariant.SelectOptions) {
            aSelectOptions = oSelectionVariant.SelectOptions;
        } else {
            aSelectOptions = oSelectionVariant;
        }
        var oSelectOption, sPropertyPath, oRange;
        if (aSelectOptions) {
            for (var i = 0; i < aSelectOptions.length; i++) {
                oSelectOption = aSelectOptions[i];
                sPropertyPath = oSelectOption.PropertyName.PropertyPath;
                //a select option might contains more then one filter in the Ranges array
                for (var j = 0; j < oSelectOption.Ranges.length; j++) {
                    oRange = oSelectOption.Ranges[j];
                    if (oRange.Sign.EnumMember) {
                        //create the filter. the Low value is mandatory
                        var oFilter = {
                            path: sPropertyPath,
                            operator: oRange.Option.EnumMember.split("/")[1],
                            value1: sap.ovp.cards.AnnotationHelper.getPrimitiveValue(oRange.Low),
                            value2: sap.ovp.cards.AnnotationHelper.getPrimitiveValue(oRange.High),
                            sign: oRange.Sign.EnumMember === "com.sap.vocabularies.UI.v1.SelectionRangeSignType/I" ? "I" : "E"
                        };
                        // exclude sign is supported only with EQ operator
                        if (oFilter.sign === "E" && oFilter.operator !== sap.ui.model.FilterOperator.EQ) {
                            jQuery.sap.log.error("Exclude sign is supported only with EQ operator");
                            continue;
                        }
                        // aFilters will be used later in the flow to create filter object. (sap.ui.model.Filter),
                        // that does not support sign property, so the sign property will be ignored later in the flow.

                        // This getFilters will also be called during navigation to create selection variant.
                        // for selection variant sign property is supported but NE operator is not supported
                        // This case will be handled by the calling function in card.controller
                        if (oFilter.sign === "E" && oFilter.operator === sap.ui.model.FilterOperator.EQ) {
                            oFilter.operator = sap.ui.model.FilterOperator.NE;
                            oFilter.sign = "I";
                        }

                        //append the filter to the filters array
                        aFilters.push(oFilter);
                    }
                }
            }
        }

        return aFilters;
    }

    function getBooleanValue(oValue, bDefault) {
        if (oValue && oValue.Boolean) {
            if (oValue.Boolean.toLowerCase() === "true") {
                return true;
            } else if (oValue.Boolean.toLowerCase() === "false") {
                return false;
            }
        } else if (oValue && oValue.Bool) {
            if (oValue.Bool.toLowerCase() === "true") {
                return true;
            } else if (oValue.Bool.toLowerCase() === "false") {
                return false;
            }
        }

        return bDefault;
    }

    function getNumberValue(oValue) {
        var value;

        if (oValue) {
            if (oValue.String) {
                value = Number(oValue.String);
            } else if (oValue.Int) {
                value = Number(oValue.Int);
            } else if (oValue.Decimal) {
                value = Number(oValue.Decimal);
            } else if (oValue.Double) {
                value = Number(oValue.Double);
            } else if (oValue.Single) {
                value = Number(oValue.Single);
            }
        }

        return value;
    }

    sap.ovp.cards.AnnotationHelper.getPrimitiveValue = function (oValue) {
        var value;

        if (oValue) {
            if (oValue.String || oValue.String === "") {
                value = oValue.String;
            } else if (oValue.Boolean || oValue.Bool) {
                value = getBooleanValue(oValue);
            } else {
                value = getNumberValue(oValue);
            }
        }

        return value;
    };

    function getPathOrPrimitiveValue(oItem) {
        if (oItem) {
            if (oItem.Path) {
                return "{path:'" + oItem.Path + "'}";
            } else {
                return sap.ovp.cards.AnnotationHelper.getPrimitiveValue(oItem);
            }
        } else {
            return "";
        }
    }

    //This object is responsive for devices
    //the id build by Type-ListType-flavor
    var ITEM_LENGTH = {
        "List_condensed": {
            phone: 5,
            tablet: 5,
            desktop: 5
        },
        "List_extended": {
            phone: 3,
            tablet: 3,
            desktop: 3
        },
        "List_condensed_bar": {
            phone: 5,
            tablet: 5,
            desktop: 5
        },
        "List_extended_bar": {
            phone: 3,
            tablet: 3,
            desktop: 3
        },
        "Table": {
            phone: 5,
            tablet: 5,
            desktop: 5
        },
        "Stack_simple": {
            phone: 20,
            tablet: 20,
            desktop: 20
        },
        "Stack_complex": {
            phone: 5,
            tablet: 5,
            desktop: 5
        }
    };

    function getItemsLength(oOvpCardPropertiesModel) {
        var type = oOvpCardPropertiesModel.getProperty('/contentFragment');
        var listType = oOvpCardPropertiesModel.getProperty('/listType');
        var flavor = oOvpCardPropertiesModel.getProperty('/listFlavor');
        var oItemSizes;

        var device = "desktop";

        //get current device
        if (sap.ui.Device.system.phone) {
            device = "phone";
        } else if (sap.ui.Device.system.tablet) {
            device = "tablet";
        }

        //check the current card type and get the sizes objects
        if (type == "sap.ovp.cards.list.List") {
            if (listType == "extended") {
                if (flavor == "bar") {
                    oItemSizes = ITEM_LENGTH["List_extended_bar"];
                } else {
                    oItemSizes = ITEM_LENGTH["List_extended"];
                }
            } else if (flavor == "bar") {
                oItemSizes = ITEM_LENGTH["List_condensed_bar"];
            } else {
                oItemSizes = ITEM_LENGTH["List_condensed"];
            }
        } else if (type == "sap.ovp.cards.table.Table") {
            oItemSizes = ITEM_LENGTH["Table"];
        } else if (type == "sap.ovp.cards.stack.Stack") {

            if (oOvpCardPropertiesModel.getProperty('/objectStreamCardsNavigationProperty')) {
                oItemSizes = ITEM_LENGTH["Stack_complex"];
            } else {
                oItemSizes = ITEM_LENGTH["Stack_simple"];
            }
        }

        if (oItemSizes) {
            return oItemSizes[device];
        }

        return 5;
    }

    //Function to remove the datafield if there is a datapoint with same target as datafield
    sap.ovp.cards.AnnotationHelper.removeDuplicateDataField = function (oContext) {
        var aCollection = oContext.getObject();
        var aDataPoints = getSortedDataPoints(oContext, aCollection, true);
        var aDataPointsValues = aDataPoints.map(function (oDataPoint) {
            if (oDataPoint && oDataPoint.Value && oDataPoint.Value.Path) {
                return oDataPoint.Value.Path;
            } else if (oDataPoint && oDataPoint.fn && oDataPoint.fn.Path) {
                return oDataPoint.fn.Path
            }
        });
        aCollection.filter(function (item, index) {
            if (item.RecordType === "com.sap.vocabularies.UI.v1.DataField" && aDataPointsValues.indexOf(item.Value.Path) > -1) {
                aCollection.splice(index, 1);
            }
        });
    };

    sap.ovp.cards.AnnotationHelper.formatUrl = function (iContext, sUrl) {
        if (sUrl.charAt(0) === '/' || sUrl.indexOf("http") === 0) {
            return sUrl;
        }
        var sBaseUrl = iContext.getModel().getProperty("/baseUrl");
        if (sBaseUrl) {
            return sBaseUrl + "/" + sUrl;
        }
        return sUrl;
    };

    sap.ovp.cards.AnnotationHelper.getDataPointsCount = function (iContext, aCollection) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection);
        return aDataPoints.length;
    };

    sap.ovp.cards.AnnotationHelper.getFirstDataPointValue = function (iContext, aCollection) {
        return sap.ovp.cards.AnnotationHelper.getDataPointValue(iContext, aCollection, 0);
    };

    sap.ovp.cards.AnnotationHelper.getSecondDataPointValue = function (iContext, aCollection) {
        return sap.ovp.cards.AnnotationHelper.getDataPointValue(iContext, aCollection, 1);
    };

    sap.ovp.cards.AnnotationHelper.getDataPointValue = function (iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection),
            oDataPoint = aDataPoints[index];

        if (oDataPoint && oDataPoint.Value && oDataPoint.Value.Path) {
            return oDataPoint.Value.Path;
        }
        return "";
    };

    sap.ovp.cards.AnnotationHelper.getFirstDataFieldName = function (iContext, aCollection) {
        return getDataFieldName(iContext, aCollection, 0);
    };

    sap.ovp.cards.AnnotationHelper.getSecondDataFieldName = function (iContext, aCollection) {
        return getDataFieldName(iContext, aCollection, 1);
    };

    sap.ovp.cards.AnnotationHelper.getThirdDataFieldName = function (iContext, aCollection) {
        return getDataFieldName(iContext, aCollection, 2);
    };

    sap.ovp.cards.AnnotationHelper.getFourthDataFieldName = function (iContext, aCollection) {
        return getDataFieldName(iContext, aCollection, 3);
    };

    sap.ovp.cards.AnnotationHelper.getFifthDataFieldName = function (iContext, aCollection) {
        return getDataFieldName(iContext, aCollection, 4);
    };

    sap.ovp.cards.AnnotationHelper.formatFirstDataFieldValue = function (iContext, aCollection) {
        return formatDataField(iContext, aCollection, 0);
    };

    sap.ovp.cards.AnnotationHelper.formatSecondDataFieldValue = function (iContext, aCollection) {
        return formatDataField(iContext, aCollection, 1);
    };

    sap.ovp.cards.AnnotationHelper.formatThirdDataFieldValue = function (iContext, aCollection) {
        return formatDataField(iContext, aCollection, 2);
    };

    sap.ovp.cards.AnnotationHelper.formatFourthDataFieldValue = function (iContext, aCollection) {
        return formatDataField(iContext, aCollection, 3);
    };

    sap.ovp.cards.AnnotationHelper.formatFifthDataFieldValue = function (iContext, aCollection) {
        return formatDataField(iContext, aCollection, 4);
    };

    sap.ovp.cards.AnnotationHelper.formatSixthDataFieldValue = function (iContext, aCollection) {
        return formatDataField(iContext, aCollection, 5);
    };

    sap.ovp.cards.AnnotationHelper.formatsemanticObjectOfDataFieldGeneric = function (iContext, oEntitySet, aCollection) {
        return semanticObjectOfDataField(iContext, oEntitySet, aCollection);
    };

    sap.ovp.cards.AnnotationHelper.getFirstDataPointName = function (iContext, aCollection) {
        return getDataPointName(iContext, aCollection, 0);
    };

    sap.ovp.cards.AnnotationHelper.getSecondDataPointName = function (iContext, aCollection) {
        return getDataPointName(iContext, aCollection, 1);
    };

    sap.ovp.cards.AnnotationHelper.getThirdDataPointName = function (iContext, aCollection) {
        return getDataPointName(iContext, aCollection, 2);
    };

    sap.ovp.cards.AnnotationHelper.formatFirstDataPointValue = function (iContext, aCollection) {
        return formatDataPoint(iContext, aCollection, 0);
    };

    /**
     * This function returns the binding for the first dataField which contains
     * an iconURL property
     * @param iContext
     * @param aCollection
     * @returns a binding or a URL based on what has been defined in the annotations
     */
    sap.ovp.cards.AnnotationHelper.formatImageUrl = function (iContext, aCollection) {
        for (var i = 0; i < aCollection.length; i++) {
            var oItem = aCollection[i];
            if (oItem.RecordType === "com.sap.vocabularies.UI.v1.DataField") {
                if (oItem.IconUrl && oItem.IconUrl.String) {
                    return oItem.IconUrl.String;
                }
                if (oItem.IconUrl && oItem.IconUrl.Path) {
                    return sap.ui.model.odata.AnnotationHelper.simplePath(iContext, oItem.IconUrl);
                }
            }
        }
    };

    sap.ovp.cards.AnnotationHelper.formatSecondDataPointValue = function (iContext, aCollection) {
        return formatDataPoint(iContext, aCollection, 1);
    };

    sap.ovp.cards.AnnotationHelper.formatThirdDataPointValue = function (iContext, aCollection) {
        return formatDataPoint(iContext, aCollection, 2);
    };

    sap.ovp.cards.AnnotationHelper.formatFirstDataPointState = function (iContext, aCollection) {
        return formatDataPointState(iContext, aCollection, 0);
    };

    sap.ovp.cards.AnnotationHelper.formatFirstDataPointColor = function (iContext, aCollection) {
        return formatDataPointColor(iContext, aCollection, 0);
    };

    sap.ovp.cards.AnnotationHelper.formatSecondDataPointState = function (iContext, aCollection) {
        return formatDataPointState(iContext, aCollection, 1);
    };

    sap.ovp.cards.AnnotationHelper.formatThirdDataPointState = function (iContext, aCollection) {
        return formatDataPointState(iContext, aCollection, 2);
    };

    sap.ovp.cards.AnnotationHelper.formatFirstDataPointStateForSmartField = function (iContext, aCollection) {
        return formatDataPointStateForSmartField(iContext, aCollection, 0);
    };

    sap.ovp.cards.AnnotationHelper.formatKPIHeaderState = function (iContext, oDataPoint) {
        return formatDataPointToValue(iContext, oDataPoint, sap.ovp.cards.AnnotationHelper.criticalityConstants.ColorValues);
    };

    sap.ovp.cards.AnnotationHelper.isFirstDataPointCriticality = function (iContext, aCollection) {
        return criticalityConditionCheck(iContext, aCollection, 0);
    };

    //check data point criticality for center alignment in table easy scan layout
    sap.ovp.cards.AnnotationHelper.isFirstDataPointCriticalityForTableStatus = function (iContext, aCollection) {
        var item = getSortedDataPoints(iContext, aCollection)[0];
        if (item && (item.Criticality || item.CriticalityCalculation)) {
            return true;
        }
        return false;
    };

    sap.ovp.cards.AnnotationHelper.isSecondDataPointCriticality = function (iContext, aCollection) {
        return criticalityConditionCheck(iContext, aCollection, 1);
    };

    sap.ovp.cards.AnnotationHelper.isThirdDataPointCriticality = function (iContext, aCollection) {
        return criticalityConditionCheck(iContext, aCollection, 2);
    };

    sap.ovp.cards.AnnotationHelper.getSortedDataFields = function(iContext, aCollection) {
        return getSortedDataFields(iContext, aCollection);
    };

    sap.ovp.cards.AnnotationHelper.getSortedDataPoints = function(iContext, aCollection) {
        return getSortedDataPoints(iContext, aCollection);
    };

    //Generic formatting functions

    function formatValueFromTarget(oContext, aCollection) {
        var sContextPath = oContext.getPath();
        var sEntityTypePath = sContextPath.slice(0, sContextPath.lastIndexOf("/"));
        sEntityTypePath = sEntityTypePath.slice(0, sEntityTypePath.lastIndexOf("/"));
        var sPath = getTargetPathForDataFieldForAnnotation(sEntityTypePath, aCollection);
        aCollection = oContext.getModel().getProperty(sPath);

        return aCollection;
    }

    sap.ovp.cards.AnnotationHelper.formatDataFieldValueGeneric = function (iContext, aCollection) {
        if (!aCollection) {
            return "";
        }
        return formatField(iContext, aCollection);
    };

    function semanticObjectOfDataField(iContext, oEntitySet, aCollection, index) {
        var semanticObjectOfDF;
        var item = index == undefined ? aCollection : getSortedDataFields(iContext, aCollection)[index];
        var oModel = iContext.getSetting('ovpCardProperties');
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
        var oEntityTypeProps = oEntityType.property;
        if (oEntityTypeProps) {
            for (var i = 0; i < oEntityTypeProps.length; i++) {
                if (item.Value.Path === oEntityTypeProps[i].name) {
                    semanticObjectOfDF = oEntityTypeProps[i]["com.sap.vocabularies.Common.v1.SemanticObject"];
                    if (semanticObjectOfDF) {
                        return sap.ui.model.odata.AnnotationHelper.format(iContext, semanticObjectOfDF);
                    } else {
                        return "";
                    }
                }
            }
        }
    }

    sap.ovp.cards.AnnotationHelper.formatDataPointValue = function (iContext, aCollection) {
        if (!aCollection) {
            return "";
        }
        var oModel = iContext.getSetting('ovpCardProperties');
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oCopyOfCollection = jQuery.extend({}, aCollection);
        var oCopyOfContext = jQuery.extend({}, iContext);
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);

        return _formatDataPoint(iContext, aCollection, oEntityType, oMetaModel);
    };

    sap.ovp.cards.AnnotationHelper.formatDataPointStateGeneric = function (iContext, aCollection) {
        var oCopyOfCollection = jQuery.extend({}, aCollection);
        var oCopyOfContext = jQuery.extend({}, iContext);
        var sState = "None",
            oCriticalityConfigValues = sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues;
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);

        if (aCollection && aCollection.Criticality) {
            sState = buildExpressionForProgressIndicatorCriticality(iContext, aCollection, oCriticalityConfigValues);
        } else {
            sState = formatDataPointToValue(iContext, aCollection, oCriticalityConfigValues);
        }
        return sState;
    };

    sap.ovp.cards.AnnotationHelper.checkCriticalityGeneric = function (iContext, aCollection) {
        var oCopyOfCollection = jQuery.extend({}, aCollection);
        var oCopyOfContext = jQuery.extend({}, iContext);
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);

        if (aCollection && aCollection.Criticality) {
            return true;
        }
    };

    //check data point criticality for center alignment of property with type Edm.String in table dashboard layout
    sap.ovp.cards.AnnotationHelper.checkCriticalityGenericForTableStatus = function (iContext, aCollection) {
        var oCopyOfCollection = jQuery.extend({}, aCollection);
        var oCopyOfContext = jQuery.extend({}, iContext);
        var oModel = iContext.getSetting('ovpCardProperties');
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);
        if (!aCollection) {
            return;
        }
        var oProperty = oMetaModel.getODataProperty(oEntityType, aCollection.Value.Path);

        if (aCollection && oProperty && oProperty.type == "Edm.String" && (aCollection.Criticality || aCollection.CriticalityCalculation)) {
            return true;
        }
    };

    sap.ovp.cards.AnnotationHelper.formatDataPointStateForSmartFieldGeneric = function (iContext, aCollection) {
        var oCopyOfCollection = jQuery.extend({}, aCollection);
        var oCopyOfContext = jQuery.extend({}, iContext);
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);
        var sState = "None";
        if (aCollection && aCollection.Criticality && aCollection.Criticality.Path) {
            sState = "{path:'" + aCollection.Criticality.Path + "'}";
        } else {
            sState = formatDataPointToValue(iContext, aCollection, sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues);
            sState = criticalityState2Value(sState);
        }
        return sState;
    };

    /*
     * @param iContext
     * @returns 0 for false - there are no actions for this context
     *          1 for true - there are actions for this context
     *          does not return actual boolean - so we won't need to parse the result in the xml
     */
    sap.ovp.cards.AnnotationHelper.hasActions = function (iContext, aCollection) {
        var oItem;
        for (var i = 0; i < aCollection.length; i++) {
            oItem = aCollection[i];
            if (oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" ||
                oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" ||
                oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
                return 1;
            }
        }
        return 0;
    };

    sap.ovp.cards.AnnotationHelper.isFirstDataPointPercentageUnit = function (iContext, aCollection) {
        var oDataPoint = getSortedDataPoints(iContext, aCollection)[0];

        if (oDataPoint && oDataPoint.Value && oDataPoint.Value.Path) {
            var sEntityTypePath = iContext.getPath().substr(0, iContext.getPath().lastIndexOf("/") + 1);
            var oModel = iContext.getModel();
            var oEntityType = oModel.getProperty(sEntityTypePath);
            var oProperty = oModel.getODataProperty(oEntityType, oDataPoint.Value.Path);
            if (oProperty && oProperty["Org.OData.Measures.V1.Unit"]) {
                return oProperty["Org.OData.Measures.V1.Unit"].String === "%";
            }
        }
        return false;
    };

    sap.ovp.cards.AnnotationHelper.resolveEntityTypePath = function (oAnnotationPathContext) {
        var sAnnotationPath = oAnnotationPathContext.getObject();
        var oModel = oAnnotationPathContext.getModel();
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntitySet = oMetaModel.getODataEntitySet(oModel.getProperty("/entitySet"));
        var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
        sAnnotationPath = oEntityType.$path + "/" + sAnnotationPath;
        return oMetaModel.createBindingContext(sAnnotationPath);
    };

    sap.ovp.cards.AnnotationHelper.resolveParameterizedEntitySet = function (oDataModel, oEntitySet, oSelectionVariant) {

        jQuery.sap.require("sap.ui.model.analytics.odata4analytics");
        var path = "";
        var o4a = new sap.ui.model.analytics.odata4analytics.Model(sap.ui.model.analytics.odata4analytics.Model.ReferenceByModel(oDataModel));
        var queryResult = o4a.findQueryResultByName(oEntitySet.name);

        if (!queryResult) {
            path = "/" + oEntitySet.name;
            jQuery.sap.log.error("findQueryResultByName", "Entity Set not found in the QueryResultRequest");
            return path;
        }
        var queryResultRequest = new sap.ui.model.analytics.odata4analytics.QueryResultRequest(queryResult);
        var parameterization = queryResult.getParameterization();

        if (parameterization) {
            var param;
            queryResultRequest.setParameterizationRequest(new sap.ui.model.analytics.odata4analytics.ParameterizationRequest(parameterization));
            jQuery.each(oSelectionVariant.Parameters, function () {
                if (this.RecordType === "com.sap.vocabularies.UI.v1.IntervalParameter") {
                    param = this.PropertyNameFrom.PropertyPath.split("/");
                    queryResultRequest.getParameterizationRequest().setParameterValue(
                        param[param.length - 1],
                        this.PropertyValueFrom.String,
                        this.PropertyValueTo.String
                    );
                } else {
                    param = this.PropertyName.PropertyPath.split("/");
                    queryResultRequest.getParameterizationRequest().setParameterValue(
                        param[param.length - 1],
                        this.PropertyValue.String
                    );
                }
            });
        }

        try {
            path = queryResultRequest.getURIToQueryResultEntitySet();
        } catch (exception) {
            queryResult = queryResultRequest.getQueryResult();
            path = "/" + queryResult.getEntitySet().getQName();
            jQuery.sap.log.error("getEntitySetPathWithParameters", "binding path with parameters failed - " + exception || exception.message);
        }
        return path;
    };

    sap.ovp.cards.AnnotationHelper.getAssociationObject = function (oModel, sAssociation, ns) {
        // find a nicer way of getting association set entry in meta model
        var aAssociations = oModel.getServiceMetadata().dataServices.schema[0].association;
        for (var i = 0; i < aAssociations.length; i++) {
            if (ns + "." + aAssociations[i].name === sAssociation) {
                return aAssociations[i];
            }
        }
    };

    /**************************** Formatters & Helpers for KPI-Header logic  ****************************/

    /* Returns binding path for singleton */
    sap.ovp.cards.AnnotationHelper.getAggregateNumber = function (iContext, oEntitySet, oDataPoint, oSelectionVariant) {
        var measure, dataPointDescription, dataPointTitle;
        if (oDataPoint && oDataPoint.Value && oDataPoint.Value.Path) {
            measure = oDataPoint.Value.Path;
        } else if (oDataPoint && oDataPoint.Description && oDataPoint.Description.Value && oDataPoint.Description.Value.Path) {
            measure = oDataPoint.Description.Value.Path;
        }
        if (oDataPoint && oDataPoint.Description && oDataPoint.Description.Path) {
            dataPointDescription = oDataPoint.Description.Path;
        } else if (oDataPoint && oDataPoint.Title && oDataPoint.Title.Path) {
            dataPointTitle = oDataPoint.Title.Path;
        }
        var ret = "";
        var bParams = oSelectionVariant && oSelectionVariant.Parameters;
        var filtersString = "";

        if (bParams) {
            var dataModel = iContext.getSetting("dataModel");
            var path = sap.ovp.cards.AnnotationHelper.resolveParameterizedEntitySet(dataModel, oEntitySet, oSelectionVariant);
            ret += "{path: '" + path + "'";
        } else {
            ret += "{path: '/" + oEntitySet.name + "'";
        }

        ret += ", length: 1";
        var oOvpCardSettings = iContext.getSetting('ovpCardProperties');
        var oEntityType = oOvpCardSettings.getProperty("/entityType");
        var unitColumn = sap.ovp.cards.CommonUtils.getUnitColumn(measure, oEntityType);
        var aFilters = getFilters(oOvpCardSettings, oSelectionVariant);

        if (aFilters.length > 0) {
            filtersString += ", filters: " + JSON.stringify(aFilters);
        }

        var selectArr = [];
        selectArr.push(measure);
        if (dataPointDescription) {
            selectArr.push(dataPointDescription);
        } else if (dataPointTitle) {
            selectArr.push(dataPointTitle);
        }
        // if DeviationRangeLowValue and ToleranceRangeLowValue read from Path instead of string
        if (oDataPoint && oDataPoint.CriticalityCalculation && oDataPoint.CriticalityCalculation.DeviationRangeLowValue && oDataPoint.CriticalityCalculation.DeviationRangeLowValue.Path) {
            selectArr.push(oDataPoint.CriticalityCalculation.DeviationRangeLowValue.Path);
        }
        if (oDataPoint && oDataPoint.CriticalityCalculation && oDataPoint.CriticalityCalculation.ToleranceRangeLowValue && oDataPoint.CriticalityCalculation.ToleranceRangeLowValue.Path) {
            selectArr.push(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue.Path);
        }

        // if DeviationRangeHighValue and ToleranceRangeHighValue read from Path instead of string
        if (oDataPoint && oDataPoint.CriticalityCalculation && oDataPoint.CriticalityCalculation.DeviationRangeHighValue && oDataPoint.CriticalityCalculation.DeviationRangeHighValue.Path) {
            selectArr.push(oDataPoint.CriticalityCalculation.DeviationRangeHighValue.Path);
        }
        if (oDataPoint && oDataPoint.CriticalityCalculation && oDataPoint.CriticalityCalculation.ToleranceRangeHighValue && oDataPoint.CriticalityCalculation.ToleranceRangeHighValue.Path) {
            selectArr.push(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue.Path);
        }

        if (unitColumn) {
            selectArr.push(unitColumn);
        }
        if (oDataPoint && oDataPoint.TrendCalculation && oDataPoint.TrendCalculation.ReferenceValue && oDataPoint.TrendCalculation.ReferenceValue.Path) {
            selectArr.push(oDataPoint.TrendCalculation.ReferenceValue.Path);
        }

        return ret + ", parameters:{select:'" + selectArr.join(",") + "'}" + filtersString + "}";
    };

    /* ----- format KPi value as per scale factor------ */
    sap.ovp.cards.AnnotationHelper.KpiValueFormatter = function (kpiValue) {
        if (isNaN(kpiValue)) {
            return kpiValue;
        }
        var fractionalDigits, scaleFactor, percentageFlag = false;
        if (this.oPropagatedProperties.oModels.ovpCardProperties.oData.NumberOfFractionalDigits) {
            fractionalDigits = Number(this.oPropagatedProperties.oModels.ovpCardProperties.oData.NumberOfFractionalDigits);
        }
        if (this.oPropagatedProperties.oModels.ovpCardProperties.oData.percentageAvailable) {
            percentageFlag = true;
        }
        if (!fractionalDigits || fractionalDigits < 0) {
            fractionalDigits = 0;
        } else if (fractionalDigits > 2) {
            fractionalDigits = 2;
        }
        scaleFactor = kpiValue;
        if (kpiValue) {
            var numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                minFractionDigits: fractionalDigits,
                maxFractionDigits: fractionalDigits,
                style: "short",
                showScale: true,
                shortRefNumber: scaleFactor
            });
            if (percentageFlag) {
                return numberFormat.format(Number(kpiValue)) + " %";
            } else {
                return numberFormat.format(Number(kpiValue));
            }

        }
    };

    /* Creates binding path for NumericContent value */
    sap.ovp.cards.AnnotationHelper.formThePathForAggregateNumber = function (dataPoint) {
        if (!dataPoint || !dataPoint.Value || !dataPoint.Value.Path) {
            return "";
        }
        if (dataPoint && dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits && dataPoint.ValueFormat.NumberOfFractionalDigits.Int) {
            this.getModel("ovpCardProperties").oData.NumberOfFractionalDigits = dataPoint.ValueFormat.NumberOfFractionalDigits.Int;
        }
        var oModel = this.getModel('ovpCardProperties');
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, dataPoint.Value.Path);
        if (oEntityTypeProperty["Org.OData.Measures.V1.Unit"]) {
            var oUnit = oEntityTypeProperty["Org.OData.Measures.V1.Unit"];
            if (oUnit.String == "%") {
                this.getModel("ovpCardProperties").oData.percentageAvailable = true;
            }
        }
        return "{parts: [{path:'" + dataPoint.Value.Path + "'}], formatter: 'sap.ovp.cards.AnnotationHelper.KpiValueFormatter'}";
    };

    /* Creates binding path for trend icon */
    sap.ovp.cards.AnnotationHelper.formThePathForTrendIcon = function (iContext, oDataPoint) {
        if (!oDataPoint || !oDataPoint.Value || !oDataPoint.Value.Path || !oDataPoint.TrendCalculation) {
            return "";
        }

        var value = getPathOrPrimitiveValue(oDataPoint.Value);
        var referenceValue = getPathOrPrimitiveValue(oDataPoint.TrendCalculation.ReferenceValue);
        var downDifference = getPathOrPrimitiveValue(oDataPoint.TrendCalculation.DownDifference);
        var upDifference = getPathOrPrimitiveValue(oDataPoint.TrendCalculation.UpDifference);

        var bIsRefValBinding = isBindingValue(referenceValue);
        var bIsDownDiffBinding = isBindingValue(downDifference);
        var bIsUpDiffBinding = isBindingValue(upDifference);

        var sParts = "parts: [" + value;
        sParts += bIsRefValBinding ? "," + referenceValue : "";
        sParts += bIsDownDiffBinding ? "," + downDifference : "";
        sParts += bIsUpDiffBinding ? "," + upDifference : "";
        sParts += "]";

        var formatFunc = function () {
            var index = 1;
            return calculateTrendDirection(
                arguments[0],
                bIsRefValBinding ? arguments[index++] : referenceValue,
                bIsDownDiffBinding ? arguments[index++] : downDifference,
                bIsUpDiffBinding ? arguments[index++] : upDifference
            );
        };

        var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatTrendDirection");
        return "{" + sParts + ", formatter: '" + sFormatFuncName + "'}";
    };

    /* ---form subtitle using scale factor and Unit of Measure--- */
    sap.ovp.cards.AnnotationHelper.formThePathForSubtitle = function (iContext, dataPoint, subTitle) {
        var unitOfMeasure, subTitleInText;
        if (!dataPoint || !dataPoint.Value || !dataPoint.Value.Path) {
            return subTitle;
        }
        unitOfMeasure = formatField(iContext, dataPoint, false, true);
        subTitleInText = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("SubTitle_IN");
        if (unitOfMeasure) {
            return subTitle + " " + subTitleInText + " " + unitOfMeasure;
        } else {
            return subTitle;
        }
    };

    /* Creates binding path for % change */
    sap.ovp.cards.AnnotationHelper.formPathForPercentageChange = function (dataPoint) {
        if (!dataPoint || !dataPoint.TrendCalculation || !dataPoint.TrendCalculation.ReferenceValue) {
            return "";
        }
        if (dataPoint && dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits && dataPoint.ValueFormat.NumberOfFractionalDigits.Int) {
            this.getModel("ovpCardProperties").oData.NumberOfFractionalDigits = dataPoint.ValueFormat.NumberOfFractionalDigits.Int;
        }
        if (dataPoint.TrendCalculation.ReferenceValue.Path) {
            return "{parts: [{path:'" + dataPoint.Value.Path + "'}, {path:'" + dataPoint.TrendCalculation.ReferenceValue.Path +
                "'}], formatter: 'sap.ovp.cards.AnnotationHelper.returnPercentageChange'}";
        } else {
            return "{parts: [{path:'" + dataPoint.Value.Path + "'}], formatter: 'sap.ovp.cards.AnnotationHelper.returnPercentageChange'}";
        }
    };

    /* -------- format target value as per scale factor-----*/
    sap.ovp.cards.AnnotationHelper.TargetValueFormatter = function (kpiValue, targetValue) {
        var oTargetValue, fractionalDigits, scaleFactor, percentageFlagForTarget = false;
        if (isNaN(kpiValue)) {
            return "";
        }
        if (this.oPropagatedProperties.oModels.ovpCardProperties.oData.NumberOfFractionalDigits) {
            fractionalDigits = Number(this.oPropagatedProperties.oModels.ovpCardProperties.oData.NumberOfFractionalDigits);
        }
        if (this.oPropagatedProperties.oModels.ovpCardProperties.oData.percentageAvailableForTarget) {
            percentageFlagForTarget = true;
        }
        if (!fractionalDigits || fractionalDigits < 0) {
            fractionalDigits = 0;
        } else if (fractionalDigits > 2) {
            fractionalDigits = 2;
        }
        if (kpiValue == 0) {
            scaleFactor = targetValue;
        } else {
            scaleFactor = kpiValue;
        }
        if (targetValue) {
            oTargetValue = targetValue;
        } else if (this.oPropagatedProperties.oModels.ovpCardProperties.oData.ManifestTargetValue) {
            oTargetValue = this.oPropagatedProperties.oModels.ovpCardProperties.oData.ManifestTargetValue;
        }
        if (oTargetValue) {
            var numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                minFractionDigits: fractionalDigits,
                maxFractionDigits: fractionalDigits,
                style: "short",
                showScale: true,
                shortRefNumber: scaleFactor
            });
            if (percentageFlagForTarget) {
                return numberFormat.format(Number(oTargetValue)) + " %";
            } else {
                return numberFormat.format(Number(oTargetValue));
            }
        }
    };

    /*GetTargetValueforKPIHeader*/
    sap.ovp.cards.AnnotationHelper.formPathForTargetValue = function (dataPoint) {
        if (!dataPoint || !dataPoint.TrendCalculation || !dataPoint.TrendCalculation.ReferenceValue) {
            return "";
        }
        if (!dataPoint || !dataPoint.Value || !dataPoint.Value.Path) {
            return "";
        }
        if (dataPoint && dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits && dataPoint.ValueFormat.NumberOfFractionalDigits.Int) {
            this.getModel("ovpCardProperties").oData.NumberOfFractionalDigits = dataPoint.ValueFormat.NumberOfFractionalDigits.Int;
        }
        if (dataPoint.TrendCalculation.ReferenceValue) {
            if (dataPoint.TrendCalculation.ReferenceValue.String) {
                this.getModel("ovpCardProperties").oData.ManifestTargetValue = dataPoint.TrendCalculation.ReferenceValue.String;
                return "{parts: [{path:'" + dataPoint.Value.Path + "'}], formatter: 'sap.ovp.cards.AnnotationHelper.TargetValueFormatter'}";
            }
            if (dataPoint.TrendCalculation.ReferenceValue.Path) {
                var oModel = this.getModel('ovpCardProperties');
                var oEntityType = oModel.getProperty("/entityType");
                var oMetaModel = oModel.getProperty("/metaModel");
                var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, dataPoint.TrendCalculation.ReferenceValue.Path);
                if (oEntityTypeProperty["Org.OData.Measures.V1.Unit"]) {
                    var oUnit = oEntityTypeProperty["Org.OData.Measures.V1.Unit"];
                    if (oUnit.String == "%") {
                        this.getModel("ovpCardProperties").oData.percentageAvailableForTarget = true;
                    }
                }
                return "{parts: [{path:'" + dataPoint.Value.Path + "'},{path:'" + dataPoint.TrendCalculation.ReferenceValue.Path + "'}], formatter: 'sap.ovp.cards.AnnotationHelper.TargetValueFormatter'}";
            }
        }
    };

    /* Formatter for % change for Header */
    sap.ovp.cards.AnnotationHelper.returnPercentageChange = function (aggregateValue, referenceValuePath) {
        jQuery.sap.require("sap.ui.core.format.NumberFormat");
        var ret = "";
        var fractionalDigits;
        if (isNaN(aggregateValue)) {
            return "";
        }
        aggregateValue = Number(aggregateValue);
        var ovpModel = this.getModel("ovpCardProperties");
        if (!ovpModel) {
            return ret;
        }
        var fullQualifier = ovpModel.getProperty("/dataPointAnnotationPath");
        var dataPoint = ovpModel.getProperty("/entityType")[fullQualifier];
        var referenceValue;
        if (!dataPoint.TrendCalculation) {
            return ret;
        }
        if (this.oPropagatedProperties.oModels.ovpCardProperties.oData.NumberOfFractionalDigits) {
            fractionalDigits = Number(this.oPropagatedProperties.oModels.ovpCardProperties.oData.NumberOfFractionalDigits);
        }
        if (!fractionalDigits || fractionalDigits < 0) {
            fractionalDigits = 0;
        } else if (fractionalDigits > 2) {
            fractionalDigits = 2;
        }
        if (dataPoint.TrendCalculation.ReferenceValue) {
            if (dataPoint.TrendCalculation.ReferenceValue.String) {
                referenceValue = Number(dataPoint.TrendCalculation.ReferenceValue.String);
            }
            if (dataPoint.TrendCalculation.ReferenceValue.Path) {
                referenceValue = Number(referenceValuePath);
            }
            if (!referenceValue || referenceValue == 0) {
                return ret;
            }
            var percentNumber = ((Number(aggregateValue) - referenceValue) / referenceValue);
            var percentFormatter = sap.ui.core.format.NumberFormat.getPercentInstance({
                style: 'short',
                minFractionDigits: fractionalDigits,
                maxFractionDigits: fractionalDigits,
                showScale: true
            });

            return percentFormatter.format(percentNumber);
        }
    };

    sap.ovp.cards.AnnotationHelper.isPresentationVarientPresent = function (oPresentationVariant) {
        if (oPresentationVariant && oPresentationVariant.GroupBy && !(jQuery.isEmptyObject(oPresentationVariant.GroupBy)) && oPresentationVariant.GroupBy[0].hasOwnProperty('PropertyPath')) {
            return true;
        } else {
            return false;
        }
    };

    /*
     * Reads groupBy from annotation and prepares comma separated list
     */
    sap.ovp.cards.AnnotationHelper.listGroupBy = function (oPresentationVariant) {
        var result = "";
        var bPV = oPresentationVariant && oPresentationVariant.GroupBy;
        if (!bPV) {
            return result;
        }

        var metaModel = this.getModel('ovpCardProperties').getProperty("/metaModel");
        var oEntityType = this.getModel('ovpCardProperties').getProperty("/entityType");
        var groupByList;

        if (oPresentationVariant.GroupBy.constructor === Array) {
            groupByList = oPresentationVariant.GroupBy;
        } else if (!oPresentationVariant.GroupBy.Collection) {
            return result;
        } else {
            groupByList = oPresentationVariant.GroupBy.Collection;
        }

        var propVal;
        jQuery.each(groupByList, function () {

            propVal = getLabelForEntityProperty(metaModel, oEntityType, this.PropertyPath);
            if (!propVal) {
                return;
            }

            result += propVal;
            result += ", ";
        });
        if (result[result.length - 1] === " " && result[result.length - 2] === ",") {
            result = result.substring(0, result.length - 2);
        }
        return result == "" ? "" : sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("By", [result]);
    };

    /*
     * returns the string for the filter-by values of the KPI Header
     * */
    sap.ovp.cards.AnnotationHelper.formTheFilterByString = function (iContext, oSelectionVariant, aAllSelVar) {

        var bAppend = true;
        var lastFilterIndex = aAllSelVar["SelectOptions"].length - 1;
        if (oSelectionVariant.PropertyName.PropertyPath === aAllSelVar["SelectOptions"][lastFilterIndex].PropertyName.PropertyPath) {
            bAppend = false;
        }
        oSelectionVariant = [oSelectionVariant];
        var oCardPropsModel = iContext.getSetting('ovpCardProperties');
        var oEntityType = oCardPropsModel.getProperty("/entityType");
        var oMetaModel = oCardPropsModel.getProperty("/metaModel");
        var aFilters = getFilters(oCardPropsModel, oSelectionVariant);
        if (aFilters.length == 0) {
            return "";
        }
        var sProp;
        var sTextPropKey;

        //Clean from Filter array all the filters with sap-text that the filter array contains there sap-text
            sProp = aFilters[0].path;
            sTextPropKey = getTextPropertyForEntityProperty(oMetaModel, oEntityType, sProp);

            //Check if there is sap-text, in case there is checks that the Filter array contains it
            if (sTextPropKey !== sProp) {
                return "";
        }
        // build the filter string
        var sFilter = generateStringForFilters(aFilters);
        if (bAppend === true) {
            return sFilter + ", ";
        }
        return sFilter;
    };

    sap.ovp.cards.AnnotationHelper.formTheIdForFilter = function (oSelectionVariant) {
        return oSelectionVariant.id;
    };

    /************************ METADATA PARSERS ************************/

    function generateStringForFilters(aFilters) {
        var aFormatterFilters = [];

        for (var i = 0; i < aFilters.length; i++) {
            aFormatterFilters.push(generateSingleFilter(aFilters[i]));
        }

        return aFormatterFilters.join(', ');
    }

    function generateSingleFilter(oFilter) {
        var bNotOperator = false;
        var sFormattedFilter = oFilter.value1;

        if (oFilter.operator[0] === "N") {
            bNotOperator = true;
        }

        if (oFilter.value2) {
            sFormattedFilter += " - " + oFilter.value2;
        }

        if (bNotOperator) {
            sFormattedFilter = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("kpiHeader_Filter_NotOperator", [sFormattedFilter]);
        }

        return sFormattedFilter;
    }

    /* Returns column name that contains the unit for the measure */
    // function getUnitColumn(measure, oEntityType) {
    // 	var tempUnit, properties = oEntityType.property;
    // 	for (var i = 0, len = properties.length; i < len; i++) {
    // 		if (properties[i].name == measure) {
    //               if (properties[i].hasOwnProperty("Org.OData.Measures.V1.ISOCurrency")) { //as part of supporting V4 annotation
    //                   return properties[i]["Org.OData.Measures.V1.ISOCurrency"].Path ? properties[i]["Org.OData.Measures.V1.ISOCurrency"].Path : properties[i]["Org.OData.Measures.V1.ISOCurrency"].String;
    //               } else if (properties[i].hasOwnProperty("Org.OData.Measures.V1.Unit")) {
    //                   tempUnit = properties[i]["Org.OData.Measures.V1.Unit"].Path ? properties[i]["Org.OData.Measures.V1.Unit"].Path : properties[i]["Org.OData.Measures.V1.Unit"].String;
    //                   if (tempUnit && tempUnit != "%") {
    //                       return tempUnit;
    //                   } else {
    //                       return null;
    //                   }
    //               } else if (properties[i].hasOwnProperty("sap:unit")) {
    //                   return properties[i]["sap:unit"];
    //               }
    // 			break;
    // 		}
    // 	}
    // 	return null;
    // }

    function getLabelForEntityProperty(oMetadata, oEntityType, sPropertyName) {
        return getAttributeValueForEntityProperty(oMetadata, oEntityType,
            sPropertyName, "com.sap.vocabularies.Common.v1.Label");
    }

    function getTextPropertyForEntityProperty(oMetamodel, oEntityType, sPropertyName) {
        return getAttributeValueForEntityProperty(oMetamodel, oEntityType,
            sPropertyName, "sap:text");
    }

    function getAttributeValueForEntityProperty(oMetamodel, oEntityType, sPropertyName, sAttributeName) {
        var oProp = oMetamodel.getODataProperty(oEntityType, sPropertyName);
        if (!oProp) {
            jQuery.sap.log.error("No Property Found for with Name '" + sPropertyName + " For Entity-Type '" + oEntityType.name + "'");
            return;
        }
        var oPropAttVal = oProp[sAttributeName];
        if (oPropAttVal) {
            if (sAttributeName === "com.sap.vocabularies.Common.v1.Label") {
                return oPropAttVal.String;
            }
            return oPropAttVal;
        }

        return oProp.name;
    }

    sap.ovp.cards.AnnotationHelper._criticality2state = criticality2state;
    sap.ovp.cards.AnnotationHelper._calculateCriticalityState = calculateCriticalityState;
    sap.ovp.cards.AnnotationHelper._calculateTrendDirection = calculateTrendDirection;
    sap.ovp.cards.AnnotationHelper._getPropertiesFromBindingString = getPropertiesFromBindingString;
    sap.ovp.cards.AnnotationHelper.sortCollectionByImportance = sortCollectionByImportance;
    sap.ovp.cards.AnnotationHelper.formatterGeo.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.analyticRegions.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.criticalityType.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.labelText.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatField.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formThePathForTrendIcon.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formThePathForSubtitle.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formTheFilterByString.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getAggregateNumber.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getFirstDataFieldName.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getSecondDataFieldName.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getThirdDataFieldName.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getFourthDataFieldName.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getFifthDataFieldName.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatFirstDataFieldValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatSecondDataFieldValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatThirdDataFieldValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatFourthDataFieldValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatFifthDataFieldValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatSixthDataFieldValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getDataPointsCount.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getFirstDataPointName.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getSecondDataPointName.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getThirdDataPointName.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatFirstDataPointValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatSecondDataPointValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatThirdDataPointValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatFirstDataPointState.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatFirstDataPointColor.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.colorPaletteForComparisonMicroChart.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatSecondDataPointState.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatThirdDataPointState.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatFirstDataPointStateForSmartField.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatKPIHeaderState.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatItems.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatUrl.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.hasActions.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getFirstDataPointValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatImageUrl.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getSecondDataPointValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.isFirstDataPointPercentageUnit.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.isFirstDataPointCriticality.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.isFirstDataPointCriticalityForTableStatus.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.isSecondDataPointCriticality.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.isThirdDataPointCriticality.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatDataFieldValueGeneric.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatDataPointValue.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatDataPointStateGeneric.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.checkCriticalityGeneric.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.checkCriticalityGenericForTableStatus.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.removeDuplicateDataField.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatDataPointStateForSmartFieldGeneric.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.formatsemanticObjectOfDataFieldGeneric.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getSortedDataPoints.requiresIContext = true;
    sap.ovp.cards.AnnotationHelper.getSortedDataFields.requiresIContext = true;

}());
