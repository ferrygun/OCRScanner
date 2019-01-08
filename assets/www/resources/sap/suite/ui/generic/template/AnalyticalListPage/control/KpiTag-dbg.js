sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Label",
	"sap/m/NumericContent",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/KpiTagController",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiAnnotationHelper",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/CriticalityUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms"
], function(Control, Label, NumericContent, JSONModel, KpiTagController, KpiUtil, KpiAnnotationHelper, CriticalityUtil, FilterUtil, V4Terms) {
	"use strict";

	return Control.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.KpiTag", {
		metadata: {
			properties: {
				value: {
					type: "string",
					defaultValue: "",
					bindable: true
				},
				name: {
					type: "string",
					defaultValue: "",
					bindable: true
				},
				scale: {
					type: "string",
					defaultValue: undefined,
					bindable: true
				},
				indicator: {
					type: "sap.m.ValueColor",
					defaultValue: undefined
				},
				entitySet: {
					type: "string",
					defaultValue: "",
					bindable: false
				},
				qualifier: {
					type: "string",
					defaultValue: "",
					bindable: false
				},
				modelName: {
					type: "string",
					defaultValue: undefined,
					bindable: false
				}
			},
			aggregations: {
				_name: {
					type: "sap.m.Label",
					multiple: false,
					visibility: "visible"
				},
				_value: {
					type: "sap.m.Label",
					multiple: false,
					visibility: "visible"
				},
				_content: {
					type: "sap.m.NumericContent",
					multiple: false,
					visibility: "visible"
				}
			},
			events: {
				press: {}
			}
		},
		_firstTime: true,
		_dataModel: undefined,
		_controller: undefined,
		_isRelative: false,
		_isPercent: false,
		_sUnitofMeasure: "",
		_relativeToProperties: [],
		_getDataModel: function() {
			if (!this._dataModel) {
				this._dataModel = new JSONModel();
			}
			return this._dataModel;
		},
		_getController: function() {
			if (!this._controller) {
				this._controller = new KpiTagController();
			}
			return this._controller;
		},
		onBeforeRendering: function() {
			if (this._firstTime) {
				this.setBusy(true);
				this._firstTime = false;
				if (this.getModelName()) {
					var oModel = this.getModel(this.getModelName());
					oModel.getMetaModel().loaded().then(function() {
						var oMetaModel = oModel.getMetaModel();
						var oEntitySet = oMetaModel.getODataEntitySet(this.getEntitySet());
						var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);

						var selectionPresentationVariantPath = "com.sap.vocabularies.UI.v1.SelectionPresentationVariant#" + this.getQualifier();
						var oSelectionPresentationVariant = oEntityType[selectionPresentationVariantPath];
						if (!oSelectionPresentationVariant) {
							return;
						}

						// CDS Annotation gives Path instead of AnnotationPath
						var oSelectionVariantPath = oSelectionPresentationVariant.SelectionVariant && oSelectionPresentationVariant.SelectionVariant.Path;
						if (!oSelectionVariantPath) {
							jQuery.sap.log.error("SelectionVariant does not have Path.");
							return;
						}
						if (/^@/.test(oSelectionVariantPath)) {
							oSelectionVariantPath = oSelectionVariantPath.slice(1);
						}
						var oSelectionVariant = oEntityType[oSelectionVariantPath];
						var aFilters = [];
						var aSelectOptions = oSelectionVariant && oSelectionVariant.SelectOptions;
						var oSelectOption, oRange;

						if (aSelectOptions) {
							for (var i = 0; i < aSelectOptions.length; i++) {
								oSelectOption = aSelectOptions[i];
								for (var j = 0; j < oSelectOption["Ranges"].length; j++) {
									oRange = oSelectOption["Ranges"][j];
									if (oRange.Sign.EnumMember === V4Terms.SelectionRangeSignType + "/I" || oRange.Sign.EnumMember === V4Terms.SelectionRangeSignType + "/E" ) {
										if (oRange.Low) {
											aFilters.push(new sap.ui.model.Filter(KpiUtil.getFilter(oRange, oSelectOption)));
										}
									}
								}
							}
						}

						// CDS Annotation gives Path instead of AnnotationPath
						var oPresentationVariantPath = oSelectionPresentationVariant.PresentationVariant && (oSelectionPresentationVariant.PresentationVariant.AnnotationPath || oSelectionPresentationVariant.PresentationVariant.Path);
						if (!oPresentationVariantPath) {
							return;
						}
						if (/^@/.test(oPresentationVariantPath)) {
							oPresentationVariantPath = oPresentationVariantPath.slice(1);
						}
						//Data Point is extracted from Visualizations of PV
						var sDataPointPath;
						var oVisualizations = oEntityType[oPresentationVariantPath].Visualizations;

						oVisualizations.forEach(function(oAnno){
							if (oAnno.AnnotationPath.indexOf("DataPoint") > 0){
								sDataPointPath = oAnno.AnnotationPath.split("@")[1];
							}
						});

						var oDatapoint = oEntityType[sDataPointPath];

						this.dataPointAnnotation = oDatapoint;
						var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oDatapoint.Value.Path);

						this._checkForPercent(oModel, oEntityTypeProperty);
						//this._checkIfRelative(oDatapoint);
						this._getCriticalityRefProperties(oDatapoint);

						this.setModel(this._getDataModel());

						var sPath = KpiAnnotationHelper.resolveParameterizedEntitySet(oModel, oEntitySet, oSelectionVariant);

						if (oDatapoint.Value) {
							if (oDatapoint.Value.Path) {
								//TODO:Understand why binding path is set like "/0/<properties>" ?
								this.bindValue("/0/" + oDatapoint.Value.Path);
							} else {
								this.setProperty("value", oDatapoint.Value.String);
							}
						}

						oModel.read(sPath ,{
							async: true,
							filters: aFilters,
							urlParameters: {
								"$select": [oDatapoint.Value.Path].concat(this._relativeToProperties).join(","),
								"$top": 1
							},
							success: function(data, response) {
								this._getDataModel().setData(data.results);
								data = FilterUtil.readProperty(this.dataPointAnnotation,"Value.Path") ? CriticalityUtil.CalculateCriticality(this.dataPointAnnotation, data, this.dataPointAnnotation.Value.Path) : data;
								this.setIndicator(data.results[0].color);
								this._setScaleInformation(this.dataPointAnnotation);
								this._setNameInformation(this.dataPointAnnotation);
								this.setBusy(false);
							}.bind(this),
							error: function(error) {
								jQuery.sap.log.error("Error reading URL:" + error);
							}
						});

					}.bind(this));
				}
			}
		},
		init: function() {
			if (Control.prototype.init) {
				Control.prototype.init.call(this);
			}
		},
		_onMouseClick: function(oEvent) {
			KpiTagController.openKpiCard(oEvent);
		},
		_onKeyPress: function(oEvent) {
			if (oEvent.which === jQuery.sap.KeyCodes.ENTER || oEvent.which === jQuery.sap.KeyCodes.SPACE) {
				KpiTagController.openKpiCard(oEvent);
			}
		},
		/**
		* @private
		* this Methods checks if the returned unit of Measure is a percent
		* @param  oModel              [model from the annotation]
		* @param  oEntityTypeProperty [Entity property which has the UoM]
		* @return                     [returns true/false ]
		*/
		_checkForPercent: function(oModel, oEntityTypeProperty) {
			this._sUnitofMeasure = KpiUtil.getUnitofMeasure(oModel, oEntityTypeProperty);
			if (this._sUnitofMeasure == "%") {// this hardcoded checks needs to be relooked.
				this._isPercent = true;
			}

		},

		_checkIfRelative: function(oDataPoint) {

			var trendCalc = oDataPoint.TrendCalculation;
			this._isRelative = KpiUtil.isRelative(oDataPoint);
			if (this._isRelative) {
				if (trendCalc.ReferenceValue.Path) {
					this._relativeToProperties.push(trendCalc.ReferenceValue.Path);
				}
			}
		},
		_setNameInformation: function(oDataPoint) {
			var titlePath = oDataPoint.Title;
			var rb = this.getModel("i18n").getResourceBundle();
			//var nameFromPath = this._getPathOrPrimitive(titlePath);
			//var nameFromPath = KpiUtil.getPathOrPrimitiveValue(this._getDataModel(),titlePath);
			var nameFromPath = KpiUtil.getPathOrPrimitiveValue(titlePath);
			//Handle cases where DataPoint.title may not be present
			if ( nameFromPath === undefined ) {
				nameFromPath = "";
			}
			//if title is from an i18n string
			if (nameFromPath.indexOf(">") > 0) {
				this.bindProperty("name", {
					path: nameFromPath,
					formatter: function(value) {
						this._nameFromPath = value;
						return this._getNameFromHeuristic(value);
					}.bind(this)
				});
			} else {
				this._nameFromPath = nameFromPath;
				this.setProperty("name", this._getNameFromHeuristic(nameFromPath));
			}
			var rightTooltip = this._isPercent ? (KpiUtil.formatNumberForPresentation(this.getValue(), true, 1, this.getProperty("scale")) + this._sUnitofMeasure) : (KpiUtil.formatNumberForPresentation(this.getValue(), true, 0, this.getProperty("scale")));
			var KPITooltipKey;
			switch (this.getIndicator()) {
				case sap.m.ValueColor.Error:
					KPITooltipKey = "KPI_TOOLTIP_ERROR";
					break;
				case sap.m.ValueColor.Good:
					KPITooltipKey = "KPI_TOOLTIP_GOOD";
					break;
				case sap.m.ValueColor.Critical:
					KPITooltipKey = "KPI_TOOLTIP_CRITICAL";
					break;
				/*
				case sap.m.ValueColor.Neutral:
					KPITooltipKey = "KPI_TOOLTIP_NEUTRAL";
					break;*/
				default:
					//KPITooltipKey = "KPI_TOOLTIP_UNDETERMINED";
					KPITooltipKey = "KPI_TOOLTIP_NEUTRAL";
					break;
			}
			this.setTooltip(rb.getText(KPITooltipKey, [this._nameFromPath, rightTooltip]));
		},
		_setScaleInformation: function(oDataPoint) {
			if ( oDataPoint.ValueFormat ) {
				if ( oDataPoint.ValueFormat.ScaleFactor ) {
					this.setProperty("scale", KpiUtil.getPathOrPrimitiveValue(oDataPoint.ValueFormat.ScaleFactor));
				}
			}
		},
		_getCriticalityRefProperties: function(oDataPoint) {
			var cCalc = oDataPoint.CriticalityCalculation;
			var crit = oDataPoint.Criticality;
			if (crit && crit.Path) {
				this._relativeToProperties.push(crit.Path);
			} else if (cCalc) {
				if (cCalc.DeviationRangeLowValue && cCalc.DeviationRangeLowValue.Path) {
					this._relativeToProperties.push(cCalc.DeviationRangeLowValue.Path);
				}
				if (cCalc.DeviationRangeHighValue && cCalc.DeviationRangeHighValue.Path) {
					this._relativeToProperties.push(cCalc.DeviationRangeHighValue.Path);
				}
				if (cCalc.ToleranceRangeLowValue && cCalc.ToleranceRangeLowValue.Path) {
					this._relativeToProperties.push(cCalc.ToleranceRangeLowValue.Path);
				}
				if (cCalc.ToleranceRangeHighValue && cCalc.ToleranceRangeHighValue.Path) {
					this._relativeToProperties.push(cCalc.ToleranceRangeHighValue.Path);
				}
			}
		},
		_getTitleRefProperty: function(oDataPoint) {
			var titlePath = oDataPoint.Title;
			if (titlePath && titlePath.Path) {
				this._relativeToProperties.push(titlePath.Path);
			}
		},
		_getNameFromHeuristic: function(sentence) {
			var parts = sentence.split(/\s/);
			return parts.length === 1 ? this._getNameFromSingleWordHeuristic(sentence) : this._getNameFromMultiWordHeuristic(parts);
		},
		/**
		* [_getNameFromSingleWordHeuristic Extract logic for single word]
		* @param  {String} word which needs to be changed to short title
		* @return {String} KPI Short title
		*/
		_getNameFromSingleWordHeuristic: function(word) {
			return word.substr(0,3).toUpperCase();
		},
		_getNameFromMultiWordHeuristic: function(words) {
			var parts = [];
			parts.push(words[0].charAt(0));
			parts.push(words[1].charAt(0));
			if (words.length >= 3) {
				parts.push(words[2].charAt(0));
			}
			return parts.join("").toUpperCase();
		},
		renderer: function(oRM, oControl) {
			oRM.write("<div");
			oRM.writeAttributeEscaped("tabIndex", 0);
			oRM.writeControlData(oControl);
			oRM.addClass("sapSmartTemplatesAnalyticalListPageKpiTag sapSmartTemplatesAnalyticalListPageKpiTagCozy sapUiSmallMarginEnd");
			oControl._addColorClasses(oRM);
			oRM.writeClasses();
			oRM.writeAttributeEscaped("aria-label", oControl._getAriaLabelText(oControl.getTooltip()));
			oRM.writeAttributeEscaped("title", oControl.getTooltip());
			oRM.write(">");
			oRM.write("<div");
			oRM.addClass("sapSmartTemplatesAnalyticalListPageKpiTagName");
			oRM.writeClasses();
			oRM.write(">");
			oRM.writeEscaped(oControl.getName());
			oRM.write("</div>");
			oRM.write("<div");
			oRM.addClass("sapSmartTemplatesAnalyticalListPageKpiTagValue");
			oRM.writeClasses();
			oRM.write(">");
			oRM.writeEscaped(oControl._isPercent ? KpiUtil.formatNumberForPresentation(oControl.getValue(), true, 1, oControl.getProperty("scale")) + oControl._sUnitofMeasure : KpiUtil.formatNumberForPresentation(oControl.getValue(), true, 0, oControl.getProperty("scale")));
			oRM.write("</div>");
			oRM.write("</div>");
		},
		_getAriaLabelText: function(kpitooltip) {
			var rb = this.getModel("i18n").getResourceBundle();
			return rb.getText("KPI_ARIALABEL_TAG", [kpitooltip]);
		},
		_addColorClasses:  function(rm) {
			switch (this.getIndicator()) {
				case sap.m.ValueColor.Neutral:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPINeutral");
				break;
				case sap.m.ValueColor.Error:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPINegative");
				break;
				case sap.m.ValueColor.Good:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPIPositive");
				break;
				case sap.m.ValueColor.Critical:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPICritical");
				break;
				default:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPINeutral");
				//rm.addClass("sapSmartTemplatesAnalyticalListPageKPIUndetermined");
				break;
			}
		},
		onAfterRendering: function() {
			setTimeout(function() {
				this.detachBrowserEvent("click", this._onMouseClick).attachBrowserEvent("click", this._onMouseClick);
				this.detachBrowserEvent("keypress", this._onKeyPress).attachBrowserEvent("keypress", this._onKeyPress);
			}.bind(this), 1);
		},

		exit: function() {
			this._relativeToProperties = [];
		}
	});
}, true);
