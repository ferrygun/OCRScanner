sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Context",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/OperationCode",
	"jquery.sap.global"
	],  function(BaseObject, Context, OperationCode, jQuery) {
		"use strict";
		var FilterUtil = BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.util.FilterUtil");
		/**
		 * @private
		 * This function create a title by combining the label and id
		 * @param  {string} sDimValueDisplay the label field
		 * @param  {string} sDimValue the id field
		 * @return {string} the newly created title
		 */
		FilterUtil.createTitle = function (sDimValueDisplay, sDimValue) {
			var sTitle;
			if (!sDimValueDisplay) {
				return sDimValue;
			}
			if (sDimValue instanceof Date ) {
				return sDimValueDisplay;
			}
			//for donut chart
			if (sDimValueDisplay.indexOf(':') !== -1 ) {
				sDimValueDisplay = sDimValueDisplay.substring(0, sDimValueDisplay.indexOf(':'));
			}
			//if not already concatenated
			if (sDimValueDisplay.indexOf(sDimValue) === -1) {
				sTitle = sDimValueDisplay + " (" +  sDimValue + ")";
			} else {
				sTitle = sDimValueDisplay;
			}
			return sTitle;
		};
		/**
		 * This function access nested object and returns the correct value if it exists, and undefined in all other cases
		 * @param  {object} nested object
		 * @param  {string} sNestedProperty the property string
		 * @return {object} return the required object if exist otherwise return undefined
		 */
		FilterUtil.readProperty = function(oObject, sNestedProperty) {
			var i = 0,
			oProperties = typeof sNestedProperty === 'string' ? sNestedProperty.split(".") : [];
			while (i < oProperties.length) {
				if (!oObject) {
					return undefined;
				}
				oObject = oObject[oProperties[i++]];
			}
			return oObject;
		};
		/**
		 * This function execute a function associated with an object and return the result if the function is exists, and undefined in all other cases
		 * @param  {object}   oObject       nested object
		 * @param  {string}   sFunctionName full name of the function
		 * @param  {[object]} oArgs         array of object as arguments to the function
		 * @return {object}                 return the result after executing the function if the function is exists, otherwise return undefined 
		 */
		FilterUtil.executeFunction = function(oObject, sFunctionName, oArgs){
			var i = 0,
			oParent,
			oProperties = typeof sFunctionName === 'string' ? sFunctionName.split(".") : [];
			while (i < oProperties.length) {
				if (!oObject) {
					return undefined;
				}
				oParent = oObject;
				oObject = oObject[oProperties[i++]];
			}
			return typeof oObject === 'function' ? oObject.apply(oParent, oArgs) : undefined;
		};
		/**
		 * This function create a title from the operation code
		 * @param  {object} oFilterValueRange ranges
		 * @return {string} title
		 */
		FilterUtil.createTitleFromCode = function(oFilterValueRange) {
			var sValueA = FilterUtil.readProperty(oFilterValueRange, "value1"),
			sValueB = FilterUtil.readProperty(oFilterValueRange, "value2"),
			sOperation = FilterUtil.readProperty(oFilterValueRange, "operation"),
			sResult;
			if ( !sValueA || !sOperation || !OperationCode[sOperation]) {
				return undefined;
			}
			//if there's a range specified and operation is other than EQ eg : <,> ...
			if (sValueB && sOperation !== "EQ") {
				sResult = sValueA + OperationCode[sOperation].code + sValueB;
				//pre existing code. Need to check if required and to be removed
			} else if (OperationCode[sOperation].position === "last") {
				sResult = sValueA + OperationCode[sOperation].code;
				//pre existing code. Need to check if required and to be removed
			} else if (OperationCode[sOperation].position === "mid") {
				sResult = OperationCode[sOperation].code + sValueA + OperationCode[sOperation].code;
				// If there's a value present and Operation is "EQ", text is generated as below
			} else {
				sResult = OperationCode[sOperation].code + sValueA;
			}
			// This condition is when there's others selected.
			if (oFilterValueRange.exclude) {
				sResult = "!(" + sResult + ")";
			}
			return sResult;
		};

		/**
		 * Formatter to create Filters link text
		 * @param  {Object} oContext FilterData
		 * @return {string} Text for filters link
		 */
		FilterUtil.formatFiltersLink = function(oContext) {
			var i18n = this.getModel("i18n"),
			rb = i18n.getResourceBundle();
			var length = oContext ? (Object.keys(oContext).length - (Object.keys(oContext).indexOf("_CUSTOM") !== -1)) : 0;
			return (oContext && length) ? rb.getText("VISUAL_FILTER_FILTERS_WITH_COUNT", [length]) : rb.getText("VISUAL_FILTER_FILTERS");
		};
		/**
		 * [getBooleanValue  get the boolean value ]
		 * @param  {object} oValue   [Value]
		 * @param  {boolean} bDefault [default value ]
		 * @return {boolean}          [returns true/false based on the value]
		 */
		FilterUtil.getBooleanValue = function(oValue, bDefault){
			if (oValue && oValue.Bool) {
				if (oValue.Bool.toLowerCase() === "true") {
					return true;
				} else if (oValue.Bool.toLowerCase() === "false") {
					return false;
				}
			}
			return bDefault;
		};

		/**
		 * [getPrimitiveValue returns the value with respective type]
		 * @param  {object} oValue [description]
		 * @return {*}        [returns the primitive type]
		 */
		FilterUtil.getPrimitiveValue = function (oValue) {
			var value;

			if (oValue) {
				if (oValue.String ) {
					value = oValue.String;
				} else if (oValue.Bool) {
					value = FilterUtil.getBooleanValue(oValue);
				} else if (oValue.EnumMember){
					value = oValue.EnumMember.split("/")[1];
				} else {
					value = FilterUtil.getNumberValue(oValue);
				}
			}

			return value;
		};

		/**
		 * [getNumberValue parses the oValue into the number value based on the type ]
		 * @param  {object} oValue [value]
		 * @return {number}        [returns the value in the number format  ]
		 */
		FilterUtil.getNumberValue = function (oValue) {
		//Here the oValue obj always returns one key which is either of value present in the array.
			if (oValue) {
				var sVal = Object.keys(oValue)[0];
				return (oValue && sVal && ["String","Int","Decimal","Double","Single"].indexOf(sVal) !== -1 ) ? Number(oValue[sVal]) : undefined;
			}
		};

		/**
		 * [getPathOrPrimitiveValue returns the path of the oItem ]
		 * @param  {object} oModel [model name against which path to be verified]
		 * @param  {object} oItem     [oItem]
		 * @return {*}           [returns the path or its primitive Value]
		 */
		FilterUtil.getPathOrPrimitiveValue = function (oItem) {
			if (oItem) {
				return (oItem.Path) ? "{path:'" + oItem.Path + "'}" : FilterUtil.getPrimitiveValue(oItem);
			} else {
				return "";
			}
		};
		/**
		 * this method can be used to check if there has been change in the filters
		 * @param  {array/object} filter1
		 * @param  {array/object} filter2
		 * @return {boolean}
		 */
		FilterUtil.isFilterDiff = function(f1, f2) {
			if (jQuery.isArray(f1) != jQuery.isArray(f2)) {
				return true;
			}

			if (jQuery.isArray(f1)) {
				return this.isFilterListDiff(f1, f2);
			} else {
				return this.isFilterObjDiff(f1, f2);
			}
		};
		/**
		 * this method can be used to check if there has been change in the filters, when filter is of object type
		 * @param  {object} filter1
		 * @param  {object} filter2
		 * @return {boolean}
		 */
		FilterUtil.isFilterObjDiff = function(f1, f2) {
			if (!f1 || !f2) {
				return true;
			}
			for (var a in f1) {
				if (a == "aFilters") {
					if (this.isFilterListDiff(f1.aFilters, f2.aFilters)) {
						return true;
					}
				} else if (f1[a] != f2[a]) {
					return true;
				}
			}

			return false;
		};
		/**
		 * This method convert the date in to medium format
		 * @param  {Date} oDate [description]date object
		 * @return {string} date string in medium format
		 */
		FilterUtil.getDateInMedium = function(oDate) {
			return (oDate instanceof Date) ? sap.ui.core.format.DateFormat.getDateInstance({style : "medium"}).format(oDate) : undefined;
		};
		/**
		 * This function check whether the current and default variant are equal or not
		 * @param  {object}  oState
		 * @return {boolean} return true if variants are equal
		 */
		FilterUtil.isDefaultVariantSelected = function(oState) {
			var oVariant = oState.oSmartFilterbar.getSmartVariant();
			return (oVariant && oVariant.getCurrentVariantId() === oVariant.getDefaultVariantKey());
		};
		/**
		 * this method can be used to check if there has been change in the filters, when filter is of array type.
		 * @param  {array} filter1
		 * @param  {array} filter2
		 * @return {boolean}
		 */
		FilterUtil.isFilterListDiff = function(fList1, fList2) {
			if (!fList1 || !fList2) {
				return true;
			}
			if (fList1.length != fList2.length) {
				return true;
			}

			for (var i = 0; i < fList1.length; i++) {
				var f1 = fList1[i];
				var f2 = fList2[i];

				if (this.isFilterObjDiff(f1, f2)) {
					return true;
				}
			}
			return false;
		};
		/**
		 * This method formats the Dimension Label as per Text Arrangement from Annotation.
		 * @param  {string} sDescription [description]Dimension Text Desciption
		 * @param  {string} sId [id]Dimention value
		 * @param  {string} sTextArragement [arrangement]Text Arrangement
		 * @return {string} formatted string with id and description
		 */
		FilterUtil.getTextArrangement = function(sDescription, sId, sTextArragement) {
			var sLabel,
			sDescOrIdOnly = sDescription ? sDescription : sId,
			sDescAndId = ( sDescription && sId ) ? sDescription + " (" + sId + ")" : sDescOrIdOnly;
			if ( sId !== "__IS_OTHER__" && sId !== "Other" ){  //Incase of Other in Donut Chart we need not to apply Text Arrangements
				switch ( sTextArragement ){
					//TextFirst Arrangement
					case sap.ui.comp.smartfilterbar.DisplayBehaviour.descriptionAndId : sLabel = sDescAndId;
					break;
					//TextOnly Arrangement
					case sap.ui.comp.smartfilterbar.DisplayBehaviour.descriptionOnly : sLabel = sDescription ? sDescription : "";
					break;
					//TextLast Arrangement
					case sap.ui.comp.smartfilterbar.DisplayBehaviour.idAndDescription : sLabel = ( sDescription && sId ) ? sId + " (" + sDescription + ")" : sDescOrIdOnly;
					break;
					//TextSeparate Arrangement
					case sap.ui.comp.smartfilterbar.DisplayBehaviour.idOnly : sLabel = sId ? sId : "";
					break;
					//Incase on Text Arrangemet Annotation not found then fallback to default arrangement i.e. descriptionAndId
					default : sLabel = sDescAndId;
					break;
				}
			} else {
				sLabel = sDescription;
			}
			return sLabel;
		};
		/**
		 * This method returns the value help tooltip.
		 * @param  {boolean} bIsVisible -  Boolean value that states whether value help is visible or not
		 * @param  {string} sDimenionField - Dimension field name
		 * @param  {object} rb - i18n model
		 * @param  {string} selectedItemsTooltip - Dimension of the chart
		 * @return {string} valueHelpTooltip - Value help tooltip
		 */
		FilterUtil.getTooltipForValueHelp = function (bIsValuehelp, sDimensionField, rb, count) {
			var tooltipString = "";
			//if no selections exist in chart
			if (!count) {
				tooltipString = bIsValuehelp ? rb.getText("VALUE_HELP", sDimensionField) : rb.getText("DROPDOWN_WITHOUT_SELECTIONS", sDimensionField);
			} else {
				//tooltip for dropdown with selections
				if (!bIsValuehelp) {
					tooltipString = rb.getText("DROPDOWN_WITH_SELECTIONS", sDimensionField);
				} else {
					//tooltip for value help with selections
					tooltipString = (count === 1) ? rb.getText("VH_SINGLE_SELECTED", [sDimensionField, count]) : rb.getText("VH_MULTI_SELECTED", [sDimensionField, count]);
				}

			}
			return tooltipString;
		};
		/**
		 * This method returns property name to be displayed on chart title/VH tooltip.
		 * @param  {object} model -  Model
		 * @param  {string} entitySet -  Entity set name
		 * @param  {string} propertyName - Dimension/Measure of the chart
		 * @return {string} propertyNameDisplay - Property name that has to be displayed
		 */
		FilterUtil.getPropertyNameDisplay = function (model, entitySet, propertyName) {
			var basePath = "/" + entitySet + "/",
			propertyNameDisplay = model.getData(basePath + propertyName + "/#@sap:label");
			return propertyNameDisplay ? propertyNameDisplay : propertyName;
		};
	return FilterUtil;
}, true);
