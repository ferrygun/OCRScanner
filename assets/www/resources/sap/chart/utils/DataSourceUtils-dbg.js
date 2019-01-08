/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([
	'sap/chart/data/Dimension',
	'sap/chart/data/TimeDimension',
	'sap/chart/data/Measure',
	'sap/chart/TimeUnitType'
], function(
	Dimension,
	TimeDimension,
	Measure,
	TimeUnitType
) {
	"use strict";

	function getEntitySet(bIsAnalytical, oBinding) {
		var sPath = oBinding.path;
		var sNamedEntitySet = (oBinding.parameters || {}).entitySet;
		if (!sNamedEntitySet) {
			// assume absolute path complying with conventions from OData4SAP spec
			sNamedEntitySet = sPath.split("/")[1];

			if (sNamedEntitySet.indexOf("(") != -1) {
				sNamedEntitySet = sNamedEntitySet.split("(")[0] + (bIsAnalytical ? "Results" : "Set");
			}
		}
		return sNamedEntitySet;
	}

	function _bindingSyntax(sResultType, sDimensionName, type) {
		return "{/#" + sResultType + "/" + sDimensionName + "/@sap:" + type + "}";
	}

	function detectDimension(oProps, oConfig) {
		//Fiscal timeUnits can be handled as well.  
		var Clazz = Dimension;
		if (oProps.type === "Edm.DateTime" && oProps['sap:display-format'] === "Date") {
			//TODO: sap:display-format is V2 annotation, use V4 style when annotation translation is ready
			Clazz = TimeDimension;
			oConfig.timeUnit = TimeUnitType.Date;
		} else if (oProps.type === "Edm.String" && TimeUnitType[oProps['sap:semantics']]) {
			//TODO: sap:semantics is V2 annotation, use V4 style when annotation translation is ready
			Clazz = TimeDimension;
			oConfig.timeUnit = oProps['sap:semantics'];
		}

		return Clazz;
	}

	var _ANALYTICAL = {
		getEntitySet: getEntitySet.bind(null, true),
		deriveColumns: function(oModel, oBindingInfo) {
			var oResult = oModel.getAnalyticalExtensions().findQueryResultByName(_ANALYTICAL.getEntitySet(oBindingInfo));
			if (!oResult) {
				throw new Error("value of the \"isAnalytical\" property does not match the Data Service in use");
			}
			var sResultType = oResult.getEntityType().getQName();
			sResultType = sResultType.slice(sResultType.lastIndexOf(".") + 1);
			var sResultSchemaNamespace = oResult.getEntityType().getSchema().namespace;

			var fnMakeDim = _ANALYTICAL.makeDimension.bind(this, sResultType, sResultSchemaNamespace, oResult);
			var fnMakeMsr = _ANALYTICAL.makeMeasure.bind(this, sResultType);

			return {
				dimensions: jQuery.map(oResult.getAllDimensions(), fnMakeDim),
				measures: jQuery.map(oResult.getAllMeasures(), fnMakeMsr)
			};
		},
		makeDimension: function(sResultType, sResultSchemaNamespace, oResult, oDimension) {
			var sDimName = oDimension.getName();
			var oConfig = {
				name: sDimName,
				label: _bindingSyntax(sResultType, sDimName, "label"),
				textProperty: _bindingSyntax(sResultType, sDimName, "text")
			};

			var sAnnotationAccess = _ANALYTICAL.ANNOTATION_ACCESS_TEMPLATE
					.replace(/%SCHEMANS/, sResultSchemaNamespace)
					.replace(/%RESULTTYPE/, sResultType)
					.replace(/%DIMENSION/, sDimName);

			var oUnifiedDimensionProperties = oResult.getModel().getODataModel().getMetaModel().getProperty(sAnnotationAccess);

			var Clazz = detectDimension(oUnifiedDimensionProperties, oConfig);

			return new Clazz(oConfig);
		},
		makeMeasure: function(sResultType, oMeasure) {
			return new Measure({
				name: oMeasure.getName(),
				label: _bindingSyntax(sResultType, oMeasure.getName(), "label")
			});
		},
		updateModel: function(oChart) {
			function createDimAnalyticalInfos(oDim, bInResult, bInVisible) {
				var sTextProperty = oDim.getTextProperty(),
					aInfos = [{ name: oDim.getName(), grouped: false, inResult: !!bInResult, visible: !bInVisible }];
				if (oDim.getDisplayText() && sTextProperty) {
					aInfos.push({ name: sTextProperty, grouped: false, inResult: !!bInResult, visible: !bInVisible });
				}
				return aInfos;
			}

			function createMsrAnalyticalInfos(oMsr) {
				var sUnitBinding = oMsr.getUnitBinding(),
					aInfos = [{ name: oMsr.getName(), total: false, inResult: false, visible: true }];
				if (sUnitBinding) {
					aInfos.push({ name: sUnitBinding, total: false, inResult: false, visible: true });
				}
				return aInfos;
			}

			var oBinding = oChart.getBinding("data");
			if (!oBinding) {
				return;
			}

			var aDims = oChart._getVisibleDimensions(true);
			var aMsrs = oChart._getVisibleMeasures(true);
			var aInResultDims = oChart._normalizeDorM(oChart.getInResultDimensions(), true);

			var aInfos = aDims.reduce(function(aInfos, oDim) {
				return aInfos.concat(createDimAnalyticalInfos(oDim));
			}, []).concat(aInResultDims.reduce(function(aInfos, oDim) {
				return aInfos.concat(createDimAnalyticalInfos(oDim, true, true));
			}, [])).concat(aMsrs.reduce(function(aInfos, oMsr) {
				return aInfos.concat(createMsrAnalyticalInfos(oMsr));
			}, []));

			var oCandidateColoringSetting = oChart._getCandidateColoringSetting();
			var oColoringAdditionalMsrs = oCandidateColoringSetting.additionalMeasures || [];
			var oColoringAdditionalDims = oCandidateColoringSetting.additionalDimensions || [];
			if (oColoringAdditionalMsrs.length) {
				aInfos = aInfos.concat(oChart._normalizeDorM(oColoringAdditionalMsrs).reduce(function(aInfo, oMsr) {
					return aInfo.concat(createMsrAnalyticalInfos(oMsr));
				}, []));
			}
			if (oColoringAdditionalDims.length) {
				aInfos = aInfos.concat(oChart._normalizeDorM(oColoringAdditionalDims, true).reduce(function(aInfo, oDim) {
					return aInfo.concat(createDimAnalyticalInfos(oDim));
				}, []));
			}

			oBinding.updateAnalyticalInfo(aInfos);
		},
		ANNOTATION_ACCESS_TEMPLATE: "/dataServices/schema/[${" +
			// ${xxx} will be interpolated by UI5 compiler, so we have to break all these annotations into separate strings
			"namespace" + "}==='%SCHEMANS']/entityType/[${" +
			"name" + "}==='%RESULTTYPE']/property/[${" +
			"name" + "}==='%DIMENSION']/"
	};

	var _NON_ANALYTICAL = {
		getEntitySet: getEntitySet.bind(null, false),
		deriveColumns: function(oModel, oBindingInfo) {
			var oMetaModel = oModel.getMetaModel(),
				mColumns = {dimensions: [], measures: []};
			if (oMetaModel) {
				var sQNameEntityType = oMetaModel.getODataEntitySet(_NON_ANALYTICAL.getEntitySet(oBindingInfo)).entityType;
				var oEntityType = oMetaModel.getODataEntityType(sQNameEntityType);

				jQuery.each(oEntityType.property, function(i, oProp) {
					var ColumnClazz = _NON_ANALYTICAL.CLAZZ[oProp.type];
					if (!ColumnClazz) {
						throw new Error("Unsupported type: " + oProp.type);
					}
					var oConfig = { name: oProp.name };
					if (oProp.hasOwnProperty("sap:label")) {
						oConfig.label = oProp["sap:label"];
					}

					if (ColumnClazz === Measure) {
						mColumns.measures.push(new ColumnClazz(oConfig));
					} else {
						if (oProp.hasOwnProperty("sap:text")) {
							oConfig.textProperty = oProp["sap:text"];
						}

						ColumnClazz = detectDimension(oProp, oConfig);
						mColumns.dimensions.push(new ColumnClazz(oConfig));
					}
				});
			}

			return mColumns;
		},
		CLAZZ: {
			"Null": Dimension,
			"Edm.Binary": Dimension,
			"Edm.Boolean": Dimension,
			"Edm.Byte": Measure,
			"Edm.DateTime": Dimension,
			"Edm.Decimal": Measure,
			"Edm.Double": Measure,
			"Edm.Single": Measure,
			"Edm.Guid": Dimension,
			"Edm.Int16": Measure,
			"Edm.Int32": Measure,
			"Edm.Int64": Measure,
			"Edm.SByte": Measure,
			"Edm.String": Dimension,
			"Edm.Time": Dimension,
			"Edm.DateTimeOffset": Dimension
		},
		updateModel: function(oChart, aDimensions, aMeasures) {
			if (oChart.getModel() instanceof sap.ui.model.odata.ODataModel) {
				var aDimColumns = aDimensions.reduce(function(aDimColumns, oDim) {
					if (oDim.getTextProperty()) {
						return aDimColumns.concat(oDim.getName(), oDim.getTextProperty());
					} else {
						return aDimColumns.concat(oDim.getName());
					}
				}, []);
				var aMsrColumns = aMeasures.reduce(function(aMsrColumns, oMsr) {
					if (oMsr.getUnitBinding()) {
						return aMsrColumns.concat(oMsr.getName(), oMsr.getUnitBinding());
					} else {
						return aMsrColumns.concat(oMsr.getName());
					}
				}, []);

				//TODO: use cached bindingInfo here and rebindData, consider move this logic to bindAggregation
				oChart._oBindingInfo.parameters = oChart._oBindingInfo.parameters || {};
				oChart._oBindingInfo.parameters.entitySet = _NON_ANALYTICAL.getEntitySet(oChart._oBindingInfo);
				oChart._oBindingInfo.parameters.select = aDimColumns.concat(aMsrColumns).join(",");
				oChart.bindData(oChart._oBindingInfo);
				if (oChart._isEnablePaging() && oChart._getPagingController().getPagingSorters()) {
					oChart.getBinding("data").sort(oChart._getPagingController().getPagingSorters());
				}
			} else {
				return;
			}
		}
	};

	function impl(methodName) {
		return function(bIsAnalytical) {
			var implementation = bIsAnalytical ? _ANALYTICAL : _NON_ANALYTICAL;
			return implementation[methodName];
		};
	}

	return {
		deriveColumns: impl("deriveColumns"),
		updateModel: impl("updateModel"),
		getEntitySet: impl("getEntitySet")
	};
});
