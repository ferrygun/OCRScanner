/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

(function () {
	"use strict";

	/*
	 This class contains annotation helpers that might be used from several templates or controls
	 */

	jQuery.sap.declare("sap.fe.templates.ObjectPage.AnnotationHelper");

	sap.fe.templates.ObjectPage.AnnotationHelper = {
		isHasDeepHierarchy: function (oFacet) {
			if (oFacet.Facets) {
				for (var i = 0; i < oFacet.Facets.length; i++) {
					if (oFacet.Facets[i].RecordType === "com.sap.vocabularies.UI.v1.CollectionFacet") {
						return true;
					}
				}
			}
			return false;
		},
		checkMoreBlockContent: function (oFacetContext) {
			return sap.fe.templates.ObjectPage.AnnotationHelper.checkFacetContent(oFacetContext, false);
		},

		checkBlockContent: function (oFacetContext) {
			return sap.fe.templates.ObjectPage.AnnotationHelper.checkFacetContent(oFacetContext, true);
		},

		checkFacetContent: function (oFacetContext, bBlock) {
			var sPath;
			var oInterface = oFacetContext.getInterface(0);
			var aFacets = oFacetContext.getModel().getProperty("", oFacetContext);

			//for Reference Facets directly under UI-Facets we need to check facets one level higher - by removing the last part of the path
			var aForPathOfFacetOneLevelHigher = oFacetContext.getPath().split("/Facets");
			var sContextOfFacetOneLevelHigher = oInterface.getModel().getContext(aForPathOfFacetOneLevelHigher[0]);
			if (oInterface.getModel().getProperty('', sContextOfFacetOneLevelHigher).RecordType === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
				return sContextOfFacetOneLevelHigher.getPath();
			} else {
				if (!aFacets) {
					return;
				}

				for (var iFacet = 0; iFacet < aFacets.length; iFacet++) {
					if (!bBlock) {
						if (typeof aFacets[iFacet]["@com.sap.vocabularies.UI.v1.PartOfPreview"] !== 'undefined' && aFacets[iFacet]["@com.sap.vocabularies.UI.v1.PartOfPreview"] === false) {
							sPath = oInterface.getPath() + "/" + iFacet;
							break;
						}
					} else {
						if (aFacets[iFacet].$Type !== "com.sap.vocabularies.UI.v1.ReferenceFacet" || (typeof aFacets[iFacet]["@com.sap.vocabularies.UI.v1.PartOfPreview"] === 'undefined' || aFacets[iFacet]["@com.sap.vocabularies.UI.v1.PartOfPreview"] === true )) {
							sPath = oInterface.getPath() + "/" + iFacet;
							break;
						}
					}
				}
			}

			return sPath;
		},
		replaceSpecialCharsInId: function (sId) {
			if (sId.indexOf(" ") >= 0) {
				jQuery.sap.log.error("Annotation Helper: Spaces are not allowed in ID parts. Please check the annotations, probably something is wrong there.");
			}
			return sId.replace(/@/g, "").replace(/\//g, "::").replace(/#/g, "::");
		},
		getStableIdPartFromFacet: function (oFacet) {
			var sHeaderFacetPrefix = "";
			if (typeof this.getContext === "function" && this.getContext() && this.getContext().getPath() && this.getContext().getPath().indexOf("com.sap.vocabularies.UI.v1.HeaderFacets") >= 0) {
				sHeaderFacetPrefix = "headerEditable::";
			}
			if (oFacet.$Type && oFacet.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
				if (oFacet.ID && oFacet.ID.String) {
					return sHeaderFacetPrefix + oFacet.ID.String;
				} else {
					// If the ID is missing a random value is returned because a duplicate ID error will be thrown as soon as there is
					// more than one form on the UI.
					jQuery.sap.log.error("Annotation Helper: Unable to create a stable ID. You have to set an ID at all collection facets.");
					return Math.floor((Math.random() * 99999) + 1).toString();
				}
			} else if (oFacet.$Type && oFacet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
				if (oFacet.ID && oFacet.ID.String) {
					return sHeaderFacetPrefix + oFacet.ID.String;
				} else {
					return sHeaderFacetPrefix + sap.fe.templates.ObjectPage.AnnotationHelper.replaceSpecialCharsInId(oFacet.Target.$AnnotationPath);
				}
			} else {
				jQuery.sap.log.error("Annotation Helper: Unable to create a stable ID. Please check the facet annotations.");
				return Math.floor((Math.random() * 99999) + 1).toString();
			}
		},
		getStableIdPartFromDataPoint: function (oDataPoint) {
			var sPathConcat = "";
			if (oDataPoint.Value && oDataPoint.Value.$Path) {
				return sap.fe.templates.ObjectPage.AnnotationHelper.replaceSpecialCharsInId(oDataPoint.Value.$Path);
			} else if (oDataPoint.Value && oDataPoint.Value.Apply && oDataPoint.Value.Apply.Name === "odata.concat") {
				//Needs to be tested
				for (var i = 0; i < oDataPoint.Value.Apply.Parameters.length; i++) {
					if (oDataPoint.Value.Apply.Parameters[i].Type === "Path") {
						if (sPathConcat) {
							sPathConcat = sPathConcat + "::";
						}
						sPathConcat = sPathConcat + sap.fe.templates.ObjectPage.AnnotationHelper.replaceSpecialCharsInId(oDataPoint.Value.Apply.Parameters[i].Value);
					}
				}
				return sPathConcat;
			} else {
				// In case of a string or unknown property
				jQuery.sap.log.error("Annotation Helper: Unable to create stable ID derived from annotations.");
			}
		},
		doesCollectionFacetOnlyContainForms: function (oFacet) {
			var bReturn = true;
			if (oFacet.Facets) {
				for (var i = 0; i < oFacet.Facets.length; i++) {
					if (oFacet.Facets[i].Target && oFacet.Facets[i].Target.AnnotationPath) {
						if ((oFacet.Facets[i].Target.AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.FieldGroup") < 0)
							&& (oFacet.Facets[i].Target.AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.Identification") < 0)
							&& (oFacet.Facets[i].Target.AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.DataPoint") < 0)) {
							bReturn = false;
						}
					}
				}
			} else {
				bReturn = false;
			}
			return bReturn;
		},
		/**
		 * Function to find out the type of table to be rendered on UI
		 * @param {object} oFacet - Object containing information about a facet
		 * @param {object} oSections - Object containing manifest settings of Object Page
		 */
		determineTableType: function (oFacet, oSections) {
			var oSettings; 				// contains properties of sections in object page
			if (oSections && oSections.sections) {
				oSettings = oSections.sections[sap.fe.templates.ObjectPage.AnnotationHelper.getStableIdPartFromFacet(oFacet)];
			}
			return (oSettings && (((oSettings.tableType || oSettings.treeTable)) || (oSections && oSections.tableType)));
		},
		buildExpressionForProgressIndicatorPercentValue: function (dataPoint, mUoM) {
			var sPercentValueExpression = "0";

			if (dataPoint.Value && dataPoint.Value.$Path) { // Value is mandatory and it must be a path
				var sValue = "${" + dataPoint.Value.$Path + "}"; // Value is expected to be always a path. ${Property}
				var sTarget;

				if (dataPoint.TargetValue) { // Target can be a path or Edm Primitive Type
					sTarget = dataPoint.TargetValue.$Path ? "${" + dataPoint.TargetValue.$Path + "}" : dataPoint.TargetValue.$Decimal;
				}

				if (mUoM) {
					mUoM = "'" + mUoM + "'";
				}
				// The expression consists of the following parts:
				// 1) When UoM is '%' then percent = value (target is ignored), and check for boundaries (value > 100 and value < 0).
				// 2) When UoM is not '%' (or is not provided) then percent = value / target * 100, check for division by zero and boundaries:
				// percent > 100 (value > target) and percent < 0 (value < 0)
				// Where 0 is Value, 1 is Target, 2 is UoM
				var sExpressionForUoMPercent = "({0} > 100 ? 100 : {0} < 0 ? 0 : {0} * 1)";
				var sExpressionForUoMNotPercent = "(({1} > 0) ? (({0} > {1}) ? 100 : (({0} < 0) ? 0 : ({0} / {1} * 100))) : 0)";
				var sExpressionTemplate = "'{'= ({2} === ''%'') ? " + sExpressionForUoMPercent + " : " + sExpressionForUoMNotPercent + " '}'";
				sPercentValueExpression = jQuery.sap.formatMessage(sExpressionTemplate, [sValue, sTarget, mUoM]);
			}

			return sPercentValueExpression;
		},

		trimCurlyBraces: function (value) {
			return value ? value.replace("{", "").replace("}", "") : undefined;
		},

		buildExpressionForProgressIndicatorDisplayValue: function (dataPoint, mUoM) {
			var sParts, sTargetValue;

			var buildPart = function (oProperty) {
				var sPropertyPath = sap.fe.templates.ObjectPage.AnnotationHelper.trimCurlyBraces(oProperty);
				var sPart = "{path: '" + sPropertyPath + "'}";
				return sPart;
			};

			sParts = buildPart(dataPoint.Value.$Path); //Value should always be a Path
			sTargetValue = dataPoint.TargetValue && (dataPoint.TargetValue.$Path || dataPoint.TargetValue.$Decimal);
			sParts += (", " + buildPart(sTargetValue) + ", " + buildPart(mUoM));

			var sDisplayValueExpression = "{ parts: [" + sParts + "], formatter: 'sap.fe.templates.ObjectPage.AnnotationHelper.formatDisplayValue' }";
			return sDisplayValueExpression;
		},

		/**
		 * This function is meant to run at runtime, so the control and resource bundle can be available
		 * @function
		 * @private
		 * @parameter {string} sValue A string containing the value
		 * @parameter {string} sTarget A string containing the target value
		 * @parameter {string} sUoM A string containing the unit of measure
		 * @returns {string} A string containing the text that will be used in the display value of the Progress Indicator
		 */
		formatDisplayValue: function (sValue, sTarget, sUoM) {
			var sDisplayValue = "";

			if (sValue) {
				var oControl = this;
				var oResourceBundle = oControl.getModel("i18n").getResourceBundle();
				var aCustomData = oControl.getCustomData();
				sTarget = sTarget || aCustomData[0].getValue();
				sUoM = sUoM || aCustomData[1].getValue();
				if (sUoM) {
					if (sUoM === '%') { // uom.String && uom.String === '%'
						sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_PERCENT", [sValue]);
					} else {// (uom.String and not '%') or uom.Path
						if (sTarget) {
							sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_NOT_PERCENT", [sValue, sTarget, sUoM]);
						} else {
							sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_NOT_PERCENT_NO_TARGET_VALUE", [sValue, sUoM]);
						}
					}
				} else {
					if (sTarget) {
						sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_NO_UOM", [sValue, sTarget]);
					} else {
						sDisplayValue = sValue;
					}
				}
			} else { // Cannot do anything
				jQuery.sap.log.warning("Value property is mandatory, the default (empty string) will be returned");
			}

			return sDisplayValue;
		},

		buildExpressionForProgressIndicatorCriticality: function (dataPoint) {
			var sFormatCriticalityExpression = sap.ui.core.ValueState.None;
			var sExpressionTemplate;
			var oCriticalityProperty = dataPoint.Criticality;

			if (oCriticalityProperty) {
				sExpressionTemplate = "'{'= ({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Negative'') || ({0} === ''1'') || ({0} === 1) ? ''" + sap.ui.core.ValueState.Error + "'' : " +
				"({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Critical'') || ({0} === ''2'') || ({0} === 2) ? ''" + sap.ui.core.ValueState.Warning + "'' : " +
				"({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Positive'') || ({0} === ''3'') || ({0} === 3) ? ''" + sap.ui.core.ValueState.Success + "'' : " +
				"''" + sap.ui.core.ValueState.None + "'' '}'";
				if (oCriticalityProperty.$Path) {
					var sCriticalitySimplePath = '${' + oCriticalityProperty.$Path + "}";
					sFormatCriticalityExpression = jQuery.sap.formatMessage(sExpressionTemplate, sCriticalitySimplePath);
				} else if (oCriticalityProperty.$EnumMember) {
					var sCriticality = "'" + oCriticalityProperty.$EnumMember + "'";
					sFormatCriticalityExpression = jQuery.sap.formatMessage(sExpressionTemplate, sCriticality);
				} else {
					jQuery.sap.log.warning("Case not supported, returning the default sap.ui.core.ValueState.None");
				}
			} else {
				// Any other cases are not valid, the default value of 'None' will be returned
				jQuery.sap.log.warning("Case not supported, returning the default sap.ui.core.ValueState.None");
			}

			return sFormatCriticalityExpression;
		},
		buildRatingIndicatorSubtitleExpression: function (mSampleSize) {
			if (mSampleSize) {
				return "{parts: [{path: '" + mSampleSize.$Path + "'}], formatter: 'sap.fe.templates.ObjectPage.AnnotationHelper.formatRatingIndicatorSubTitle'}";
			}
		},

		// returns the text for the Rating Indicator Subtitle (e.g. '7 reviews')
		formatRatingIndicatorSubTitle: function (iSampleSizeValue) {
			if (iSampleSizeValue) {
				var oResBundle = this.getModel("i18n").getResourceBundle();
				if (this.getCustomData().length > 0) {
					return oResBundle.getText("RATING_INDICATOR_SUBTITLE", [iSampleSizeValue, this.data("Subtitle")]);
				} else {
					var sSubTitleLabel = iSampleSizeValue > 1 ? oResBundle.getText("RATING_INDICATOR_SUBTITLE_LABEL_PLURAL") : oResBundle.getText("RATING_INDICATOR_SUBTITLE_LABEL");
					return oResBundle.getText("RATING_INDICATOR_SUBTITLE", [iSampleSizeValue, sSubTitleLabel]);
				}
			}
		},
		// builds the expression for the Rating Indicator footer
		buildRatingIndicatorFooterExpression: function (dataPoint) {
			var sParts, sTargetValue;

			var buildPart = function (oProperty) {
				var sPropertyPath = sap.fe.templates.ObjectPage.AnnotationHelper.trimCurlyBraces(oProperty);
				var sPart = "{path: '" + sPropertyPath + "'}";
				return sPart;
			};

			sParts = buildPart(dataPoint.Value.$Path); //Value should always be a Path
			sTargetValue = dataPoint.TargetValue && (dataPoint.TargetValue.$Path || dataPoint.TargetValue.$Decimal);
			sParts += (", " + buildPart(sTargetValue));

			var sFooterTextExpression = "{ parts: [" + sParts + "], formatter: 'sap.fe.templates.ObjectPage.AnnotationHelper.formatRatingIndicatorFooterText' }";
			return sFooterTextExpression;
		},

		// returns the text for the Rating Indicator footer (e.g. '2 out of 5')
		// note: the second placeholder (e.g. "5") for the text "RATING_INDICATOR_FOOTER" can come one from the following:
		// i. if the Property TargetValue for the term UI.DataPoint is a Path then the value is resolved by the method buildRatingIndicatorFooterExpression and passed to this method as 'targetValue'
		// ii. if the Property TargetValue is not a Path (i.e. 'Decimal') then we get the value from the control's Custom Data
		// iii. if neither i. or ii. apply then we use the default max value for the sap.m.RatingIndicator control
		formatRatingIndicatorFooterText: function (value, targetValue) {
			if (value) {
				var oResBundle = this.getModel("i18n").getResourceBundle();
				if (targetValue) {
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, targetValue]);
				} else if (this.getCustomData().length > 0) {
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, this.data("Footer")]);
				} else {
					var iRatingIndicatorDefaultMaxValue = sap.m.RatingIndicator.getMetadata().getPropertyDefaults().maxValue;
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, iRatingIndicatorDefaultMaxValue]);
				}
			}
		}
	};
})();
