/**
 * @fileOverview Library to Manage rendering of Viz Charts.
 * Reads configuration from config.js.
 */

(function () {
	"use strict";
	jQuery.sap.declare("sap.ovp.cards.charts.VizAnnotationManager");
	jQuery.sap.require("sap.ovp.cards.charts.Utils");
    jQuery.sap.require("sap.ovp.cards.CommonUtils");
	sap.ovp.cards.charts.VizAnnotationManager = sap.ovp.cards.charts.VizAnnotationManager || {};


	/* All constants feature here */
	sap.ovp.cards.charts.VizAnnotationManager.constants = {
		LABEL_KEY: "sap:label",
        LABEL_KEY_V4:"com.sap.vocabularies.Common.v1.Label", //as part of supporting V4 annotation
		TEXT_KEY: "sap:text",
        TEXT_KEY_V4:"com.sap.vocabularies.Common.v1.Text", //as part of supporting V4 annotation
        TEXT_ARRANGEMENT_ANNO:"com.sap.vocabularies.UI.v1.TextArrangement",
		TYPE_KEY: "type",
		DISPLAY_FORMAT_KEY: "sap:display-format",
		SEMANTICS_KEY: "sap:semantics",
		UNIT_KEY: "sap:unit",
        UNIT_KEY_V4_ISOCurrency:"Org.OData.Measures.V1.ISOCurrency", //as part of supporting V4 annotation
        UNIT_KEY_V4_Unit:"Org.OData.Measures.V1.Unit", //as part of supporting V4 annotation
		CURRENCY_CODE: "currency-code",
		NAME_KEY: "name",
		NAME_CAP_KEY: "Name",
		EDM_TYPE: "type",
		EDM_INT32: "Edm.Int32",
		SCATTER_CHARTTYPE:"com.sap.vocabularies.UI.v1.ChartType/Scatter",
		BUBBLE_CHARTTYPE:"com.sap.vocabularies.UI.v1.ChartType/Bubble",
		LINE_CHARTTYPE:"com.sap.vocabularies.UI.v1.ChartType/Line"
	};
	
	/* All constants for error messages feature here */
	sap.ovp.cards.charts.VizAnnotationManager.errorMessages = {
		CARD_WARNING: "OVP-AC: Analytic card: Warning: ",	
		CARD_ERROR: "OVP-AC: Analytic card Error: ",
		DATA_ANNO_ERROR: "OVP-AC: Analytic card Error:",
		CARD_ANNO_ERROR: "OVP-AC: Analytic card: Error ",
		CHART_ANNO_ERROR: "OVP-AC: Analytic card: Error ",
		INVALID_CHART_ANNO: "OVP-AC: Analytic Cards: Invalid Chart Annotation.",
		ANALYTICAL_CONFIG_ERROR: "Analytic card configuration error",
		CACHING_ERROR: "no model defined while caching OdataMetaData",
		INVALID_MAXITEMS: "maxItems is Invalid. ",
		NO_DATASET: "OVP-AC: Analytic Cards: Could not obtain dataset.",
		SORTORDER_WARNING:"SortOrder is present in PresentationVariant, but it is empty or not well formed.",
		BOOLEAN_ERROR: "Boolean value is not present in PresentationVariant.",
		IS_MANDATORY: "is mandatory.",
		IS_MISSING: "is missing.",
		NOT_WELL_FORMED: "is not found or not well formed)",
		MISSING_CHARTTYPE: "Missing ChartType in ",
		CHART_ANNO: "Chart Annotation.",
		DATA_ANNO: "Data Annotation",
		CARD_ANNO: "card annotation.",
		CARD_CONFIG: "card configuration.",
		CARD_CONFIG_ERROR: "Could not obtain configuration for ",
		CARD_CONTAINER_ERROR: "Could not obtain card container. ",
		DATA_UNAVAIALABLE: "No data available.",
		CONFIG_LOAD_ERROR: "Failed to load config.json. Reason: ",
		INVALID_CHARTTYPE: "Invalid ChartType given for ",
		INVALID_CONFIG: "No valid configuration given for ",
		CONFIG_JSON: "in config.json",
		ENTER_INTEGER: "Please enter an Integer.",
		NO_CARD_MODEL: "Could not obtain Cards model.",
		ANNO_REF: "com.sap.vocabularies.UI.v1 annotation.",
		INVALID_REDUNDANT: "Invalid/redundant role configured for ",
		CHART_IS: "chart is/are ",
		CARD_CONFIG_JSON:"card from config.json",
		ALLOWED_ROLES: "Allowed role(s) for ",
		DIMENSIONS_MANDATORY: "DimensionAttributes are mandatory.",
		MEASURES_MANDATORY: "MeasureAttributes are mandatory.",
		CARD_LEAST: "card: Enter at least ",
		CARD_MOST: "card: Enter at most ",
		FEEDS: "feed(s).",
		MIN_FEEDS: "Minimum number of feeds required for ",
		FEEDS_OBTAINED: "card is not configured. Obtained ",
		FEEDS_REQUIRED: "feed(s), Required: ",
		INVALID_SEMANTIC_MEASURES: "More than one measure is being semantically coloured",
		INVALID_IMPROVEMENT_DIR: "No Improvement Direction Found",
		INVALID_CRITICALITY: "Invalid criticality values",
		INVALID_DIMMEAS: "Invalid number of Measures or Dimensions",
		INVALID_FORECAST: "Invalid/Redundant Datapoint or Forecast measure",
		ERROR_MISSING_AXISSCALES:"Minimum and Maximum values are mandatory for AxisScale MinMax to work"
	};


	/*
	 * Reads filters from annotation and prepares data binding path
	 */
	sap.ovp.cards.charts.VizAnnotationManager.formatItems = function(iContext, oEntitySet, oSelectionVariant, oPresentationVariant, oDimensions, oMeasures, chartType) {
		
		var ret = "{";
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		if (!iContext || !iContext.getSetting('ovpCardProperties')) {
			jQuery.sap.log.error(self.errorMessages.ANALYTICAL_CONFIG_ERROR);
			ret += "}";
			return ret;
		}
		var dataModel = iContext.getSetting("dataModel");
		var chartEnumArr;
		if (chartType && chartType.EnumMember) {
			chartEnumArr = chartType.EnumMember.split("/");
			if (chartEnumArr && ( chartEnumArr[1] === 'Donut' ) ) {
				dataModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
			}
			if (chartEnumArr && ( chartEnumArr[1] != 'Donut' ) && (oDimensions === undefined)) {
				return null;
			}
		}
		
		var dimensionsList = [];
		var measuresList = [];
		var sorterList = [];
		var bFilter = oSelectionVariant && oSelectionVariant.SelectOptions;
		var bParams = oSelectionVariant && oSelectionVariant.Parameters;
		var bSorter = oPresentationVariant && oPresentationVariant.SortOrder;
		var maxItemTerm = oPresentationVariant && oPresentationVariant.MaxItems, maxItems = null;
		var aConfigFilters;
		var tmp;
		var entitySet = null;
		var textKey = self.constants.TEXT_KEY;
        var textKeyV4 = self.constants.TEXT_KEY_V4; //as part of supporting V4 annotation
		var unitKey = self.constants.UNIT_KEY;
        var unitKey_v4_isoCurrency = self.constants.UNIT_KEY_V4_ISOCurrency; //as part of supporting V4 annotation
        var unitKey_v4_unit = self.constants.UNIT_KEY_V4_Unit; //as part of supporting V4 annotation

		if (maxItemTerm) {
			maxItems = maxItemTerm.Int32 ? maxItemTerm.Int32 : maxItemTerm.Int;
		}

		if (maxItems) {
			if (maxItems == "0") {
				jQuery.sap.log.error("OVP-AC: Analytic card Error: maxItems is configured as " +
					maxItems);
				ret += "}";
				return ret;
			}
			if (!/^\d+$/.test(maxItems)) {
				jQuery.sap.log.error("OVP-AC: Analytic card Error: maxItems is Invalid. " +
					"Please enter an Integer.");
				ret += "}";
				return ret;
			}
		}

		if (bParams) {
			var path = sap.ovp.cards.AnnotationHelper.resolveParameterizedEntitySet(dataModel, oEntitySet, oSelectionVariant);
			ret += "path: '" + path + "'";
		} else {
			ret += "path: '/" + oEntitySet.name + "'";
		}

		var filters = [];
		
		entitySet = iContext.getSetting('ovpCardProperties').getProperty("/entitySet");
		if (!dataModel || !entitySet) {
			return ret;
		}
		var oMetadata = self.getMetadata(dataModel, entitySet);
		aConfigFilters = iContext.getSetting('ovpCardProperties').getProperty("/filters");

        var cardLayout = iContext.getSetting('ovpCardProperties').getProperty("/cardLayout");
        var colSpan = 1, colSpanOffset;
        var allConfig = sap.ovp.cards.charts.VizAnnotationManager.getConfig();
        var config;
        var reference;

        if (oDimensions && cardLayout &&  cardLayout.colSpan && cardLayout.colSpan > 1) {
            colSpanOffset = cardLayout.colSpan - colSpan;

            for (var key in allConfig) {
                if ((reference = allConfig[key].reference) &&
                    allConfig[reference]) {
                    var virtualEntry = jQuery.extend(true, {}, allConfig[reference]);
                    allConfig[key] = virtualEntry;
                }
                if (allConfig[key].default.type == chartEnumArr[1].toLowerCase() ||
                    (allConfig[key].time && allConfig[key].time.type == chartEnumArr[1].toLowerCase())) {
                    config = allConfig[key];
                    break;
                }
            }

            var bSupportsTimeSemantics = sap.ovp.cards.charts.VizAnnotationManager.hasTimeSemantics(oDimensions, config, dataModel, entitySet);
            if (bSupportsTimeSemantics) {
                config = config.time;
            } else {
                config = config.default;
            }

            var dataStep = iContext.getSetting('ovpCardProperties').getProperty("/dataStep");
            if (!dataStep) {
                if (config.resize && config.resize.hasOwnProperty("dataStep") && !isNaN(config.resize.dataStep)) {
                    dataStep = config.resize.dataStep;
                }
            }

            dataStep = parseInt(dataStep, 10);

            if (colSpanOffset > 0 && dataStep && !isNaN(dataStep)) {
                maxItems = parseInt(maxItems, 10) + dataStep * colSpanOffset;
            }

        }
		if (bFilter) {
			jQuery.each(oSelectionVariant.SelectOptions, function() {
				var prop = this.PropertyName.PropertyPath;
				jQuery.each(this.Ranges, function() {
					if (this.Sign.EnumMember === "com.sap.vocabularies.UI.v1.SelectionRangeSignType/I") {
						var filtervalue = sap.ovp.cards.charts.VizAnnotationManager.getPrimitiveValue(this.Low);
						var filtervaueHigh = this.High && this.High.String;
						var formatByType = self.formatByType;
						filtervalue = formatByType(oMetadata, prop, filtervalue);
						var filter = {
								path : prop,
								operator : this.Option.EnumMember.split("/")[1],
								value1 : filtervalue
						};
						if (filtervaueHigh) {
							filter.value2 = formatByType(oMetadata, prop, filtervaueHigh);
						}
						filters.push(filter);
					}
				});
			});
		}

		/*
		 * code for ObjectStream
		 */
		if (aConfigFilters && aConfigFilters.length > 0){
			filters = filters.concat(aConfigFilters);
		}

		if (filters.length > 0) {
			ret += ", filters: " + JSON.stringify(filters);
		}

		if (bSorter) {
			var oSortAnnotationCollection = oPresentationVariant.SortOrder;
			if (!oSortAnnotationCollection.length){
				oSortAnnotationCollection = sap.ovp.cards.charts.Utils.getSortAnnotationCollection(dataModel,oPresentationVariant,oEntitySet);
			}
			if (oSortAnnotationCollection.length < 1) {
				jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.SORTORDER_WARNING);
			} else {
				var sSorterValue = "";
				var oSortOrder;
				var sSortOrder;
				var sSortBy;
				for (var i = 0; i < oSortAnnotationCollection.length; i++) {
					oSortOrder = oSortAnnotationCollection[i];
					sSortBy = oSortOrder.Property.PropertyPath;
					sorterList.push(sSortBy);
					if (typeof oSortOrder.Descending == "undefined") {
						sSortOrder = 'true';
					} else {
						var checkFlag = oSortOrder.Descending.Bool || oSortOrder.Descending.Boolean;
						if (!checkFlag) {
							jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.BOOLEAN_ERROR);
							sSortOrder = 'true';
						} else {
							sSortOrder = checkFlag.toLowerCase() == 'true' ? 'true' : 'false';
						}
					}
					sSorterValue = sSorterValue + "{path: '" + sSortBy + "',descending: " + sSortOrder + "},";
				}
				/* trim the last ',' */
				ret += ", sorter: [" + sSorterValue.substring(0, sSorterValue.length - 1) + "]";
			}
		}

		var entityTypeObject = iContext.getSetting("ovpCardProperties").getProperty("/entityType");

		jQuery.each(oMeasures, function(i, m){
			tmp = m.Measure.PropertyPath;
			if (m.DataPoint && m.DataPoint.AnnotationPath) {
				var datapointAnnotationPath = entityTypeObject[m.DataPoint.AnnotationPath.substring(1)];
				if (datapointAnnotationPath.ForecastValue && datapointAnnotationPath.ForecastValue.PropertyPath) {
					measuresList.push(datapointAnnotationPath.ForecastValue.PropertyPath);
				}
			}
			measuresList.push(tmp);
            if (oMetadata && oMetadata[tmp]) {
                if (oMetadata[tmp][textKeyV4]) { //as part of supporting V4 annotation
                    if (oMetadata[tmp][textKeyV4].String && tmp != oMetadata[tmp][textKeyV4].String) {
                        measuresList.push(oMetadata[tmp][textKeyV4].String ? oMetadata[tmp][textKeyV4].String : tmp);
                    } else if (oMetadata[tmp][textKeyV4].Path && tmp != oMetadata[tmp][textKeyV4].Path) {
                        measuresList.push(oMetadata[tmp][textKeyV4].Path ? oMetadata[tmp][textKeyV4].Path : tmp);
                    }
                } else if (oMetadata[tmp][textKey] && tmp != oMetadata[tmp][textKey]) {
                    measuresList.push(oMetadata[tmp][textKey] ? oMetadata[tmp][textKey] : tmp);
                }
            }

            if (oMetadata && oMetadata[tmp]) {
                var unitCode;
                if (oMetadata[tmp][unitKey_v4_isoCurrency]) { //as part of supporting V4 annotation
                    unitCode = oMetadata[tmp][unitKey_v4_isoCurrency].Path ? oMetadata[tmp][unitKey_v4_isoCurrency].Path : undefined;
                } else if (oMetadata[tmp][unitKey_v4_unit]) {
                    unitCode = oMetadata[tmp][unitKey_v4_unit].Path ? oMetadata[tmp][unitKey_v4_unit].Path : undefined;
                } else if (oMetadata[tmp][unitKey]) {
                    unitCode = oMetadata[tmp][unitKey];
                }
                if (unitCode) {
                    if (jQuery.inArray(unitCode, measuresList) === -1) {
                        measuresList.push(unitCode);
                    }
                }
            }
		});
		jQuery.each(oDimensions, function(i, d){
			tmp = d.Dimension.PropertyPath;
			dimensionsList.push(tmp);
            if (oMetadata && oMetadata[tmp]) {
                if (oMetadata[tmp][textKeyV4]) { //as part of supporting V4 annotation
                    if (oMetadata[tmp][textKeyV4].String && tmp != oMetadata[tmp][textKeyV4].String) {
                        dimensionsList.push(oMetadata[tmp][textKeyV4].String ? oMetadata[tmp][textKeyV4].String : tmp);
                    } else if (oMetadata[tmp][textKeyV4].Path && tmp != oMetadata[tmp][textKeyV4].Path) {
                        dimensionsList.push(oMetadata[tmp][textKeyV4].Path ? oMetadata[tmp][textKeyV4].Path : tmp);
                    }
                } else if (oMetadata[tmp][textKey] && tmp != oMetadata[tmp][textKey]) {
                    dimensionsList.push(oMetadata[tmp][textKey] ? oMetadata[tmp][textKey] : tmp);
                }
            }
		});
		ret += ", parameters: {select:'" + [].concat(dimensionsList, measuresList).join(",");
		if (sorterList.length > 0) {
			ret += "," + sorterList.join(",");
		}
		/* close `parameters` */
		ret += "'}";

		if (chartEnumArr && ( chartEnumArr[1] === 'Donut' ) && (oDimensions === undefined)) {
			ret += ", length: 1";
		} else if (chartEnumArr && ( chartEnumArr[1] === 'Donut' ) && (oDimensions) && maxItems) {
			ret += ", length: " + (parseInt(maxItems, 10) + 1);
		} else if (maxItems) {
			ret += ", length: " + maxItems;
		}
		ret += "}";
		return ret;
	};
	sap.ovp.cards.charts.VizAnnotationManager.formatItems.requiresIContext = true;
	
	sap.ovp.cards.charts.VizAnnotationManager.checkForecastMeasure = function(aMeasure, entityTypeObject) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		var boolflag = false;
		var realMeasure;
			if (aMeasure.DataPoint && aMeasure.DataPoint.AnnotationPath) {
				var oDatapoint = entityTypeObject[aMeasure.DataPoint.AnnotationPath.substring(1)];
				if (oDatapoint && oDatapoint.ForecastValue && oDatapoint.ForecastValue.PropertyPath ) {
					boolflag = true;
					realMeasure = aMeasure;
				}
			}

		if (boolflag == true) {
			return realMeasure;
		} else {
			jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.INVALID_FORECAST);
			return undefined;
		}
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.getSapLabel = function(aMeasure, oMetadata) {
		var value;
		jQuery.each(oMetadata, function(i,v) {
            if (v.name == aMeasure) {
                if (v["com.sap.vocabularies.Common.v1.Label"]) { //as part of supporting V4 annotation
                    value = v["com.sap.vocabularies.Common.v1.Label"].String ? v["com.sap.vocabularies.Common.v1.Label"].String : v["com.sap.vocabularies.Common.v1.Label"].Path;
                } else if (v["sap:label"]) {
                    value = v["sap:label"];
                }
                return false;
            }
		});
		return value;
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.getMeasureDimCheck = function(feeds, chartType) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		var boolFlag = true;
		if (chartType == "line" || chartType == "column") {
			jQuery.each(feeds, function(i,v) {
				if ((v.getUid() == 'valueAxis') || (v.getUid() == 'categoryAxis')) {
				if (v.getValues().length != 1) {
					boolFlag = false;
					jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.INVALID_DIMMEAS);
					return false;
				}
			}
			});
		} else if (chartType == "vertical_bullet") {
			jQuery.each(feeds, function(i,v) {
				if ((v.getUid() == 'actualValues') || (v.getUid() == 'categoryAxis')) {
				if (v.getValues().length != 1) {
					boolFlag = false;
					jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.INVALID_DIMMEAS);
					return false;
				}
			}
			});
		}

		if (boolFlag == true) {
			return true;
		}
	};

	sap.ovp.cards.charts.VizAnnotationManager.formatByType = function(oMetadata, sProp, sVal) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		var typeKey = self.constants.TYPE_KEY;
		if (!oMetadata || !oMetadata[sProp] || !oMetadata[sProp][typeKey]) {
			return sVal;
		}
		var aNumberTypes = [
			"Edm.Int",
			"Edmt.Int16",
			"Edm.Int32",
			"Edm.Int64",
			"Edm.Decimal"
		];
		var currentType = oMetadata[sProp][typeKey];
		if (jQuery.inArray(currentType, aNumberTypes) !== -1){
			return Number(sVal);
		}
		return sVal;
	};


	sap.ovp.cards.charts.VizAnnotationManager.returnDateFormat = function(date) {
		if (date) {
			/*jQuery.sap.require("sap.ui.core.format.DateFormat");
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "dd-MMM"});
			return oDateFormat.format(new Date(date));*/
			return date;
		}
		return "";
	};


	sap.ovp.cards.charts.VizAnnotationManager.formatChartAxes = function() {
		jQuery.sap.require("sap.ui.core.format.NumberFormat");
		var customFormatter = {
				locale: function(){},
				format: function(value, pattern) {
					var patternArr = "";
					if (pattern) {
						patternArr = pattern.split('/');
					}
					if (patternArr.length > 0) {
						var minFractionDigits, shortRef;
						if (patternArr.length == 3) {
							minFractionDigits = Number(patternArr[1]);
							shortRef = Number(patternArr[2]);
							if (isNaN(minFractionDigits)) {
								minFractionDigits = -1;
							}
							if (isNaN(shortRef)) {
								shortRef = 0;
							}
						} else {
							minFractionDigits = 2;
							shortRef = 0;
						}
						if (patternArr[0] == "axisFormatter" || (patternArr[0] == "ShortFloat")) {
							// if (pattern == "axisFormatter") {
							var numberFormat;
							numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance(
								{style: 'short',
//										shortRefNumber: shortRef, //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
//										showScale: false,
										minFractionDigits: minFractionDigits,
										maxFractionDigits: minFractionDigits}
							);
							if (patternArr[0] == "ShortFloat") {
								numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance(
									{style: 'short',
											minFractionDigits: minFractionDigits,
											maxFractionDigits: minFractionDigits}
								);
							}
							if (minFractionDigits === -1) {
								numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance(
										{style: 'short'}
									);
							}
							return numberFormat.format(Number(value)); 
						}else if (patternArr[0] === "tooltipNoScaleFormatter"){//Pattern for tooltip other than Date
                            	var tooltipFormat = sap.ui.core.format.NumberFormat.getFloatInstance(
                                {style: 'short',
                                    currencyCode: false,
									shortRefNumber: shortRef,
									showScale: false,
                                    minFractionDigits: minFractionDigits,
                                    maxFractionDigits: minFractionDigits}
                            );
                            if (minFractionDigits === -1) {
                                tooltipFormat = sap.ui.core.format.NumberFormat.getFloatInstance(
                                    {
                                        minFractionDigits: 0,
                                        currencyCode: false}
                                );
                            }
                            return tooltipFormat.format(Number(value));
                        } else if (patternArr[0] == "CURR"){
							var currencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance(
									{style: 'short',
										currencyCode: false,
//										shortRefNumber: shortRef, //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
//										showScale: false,
										minFractionDigits: minFractionDigits,
										maxFractionDigits: minFractionDigits}
								);
							if (minFractionDigits === -1) {
								currencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance(
										{style: 'short',
											currencyCode: false}
									);
							}
							return currencyFormat.format(Number(value));
						} else if ( patternArr[0].search("%") !== -1) {
							//FIORITECHP1-5665 - Donut and Pie charts should be able to show numbers
							var percentFormat = sap.ui.core.format.NumberFormat.getPercentInstance(
									{style: 'short', 
									minFractionDigits: minFractionDigits,
									maxFractionDigits: minFractionDigits
								});
							if (minFractionDigits === -1) {
								percentFormat = sap.ui.core.format.NumberFormat.getPercentInstance(
										{style: 'short', 
											minFractionDigits: 1,
											maxFractionDigits: 1
										});
							}
							value = percentFormat.format(Number(value));
							return value;
						}
					}
					if (value.constructor === Date) {
						jQuery.sap.require("sap.ui.core.format.DateFormat");
						//var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "dd-MMM"});
						//Commented for FIORITECHP1-3963[DEV] OVP-AC – Remove the formatting of the Time Axis
						var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: pattern});
						if (pattern === "YearMonthDay") {
							oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({style: "medium"});
						}
						value = oDateFormat.format(new Date(value));
					}
					return value;
				}
		};
		jQuery.sap.require("sap.viz.ui5.api.env.Format");
		sap.viz.ui5.api.env.Format.numericFormatter(customFormatter);
	};

	sap.ovp.cards.charts.VizAnnotationManager.hideDateTimeAxis = function(vizFrame, feedName) {
		var dataModel = vizFrame.getModel();
		var type = vizFrame.getVizType();
		if (type != "line" && type != "bubble") {
			return;
		}
		if (!feedName) {
			feedName = type == "line" ? "categoryAxis" : "valueAxis";
		}
		var entitySet = vizFrame.getModel('ovpCardProperties').getProperty("/entitySet");
		if (!dataModel || !entitySet) {
			return;
		}
		var oMetadata = this.getMetadata(dataModel, entitySet);
		var feeds = vizFrame.getFeeds();
		for (var i = 0; i < feeds.length; i++) {
			if (feeds[i].getUid() == feedName) {
				var feedValues = feeds[i].getValues();
				if (!feedValues) {
					return;
				}
				for (var j = 0; j < feedValues.length; j++) {
					if (oMetadata[feedValues[j][this.constants.TYPE_KEY]] != "Edm.DateTime") {
						return;
					}
				}
				vizFrame.setVizProperties({categoryAxis:{
					title:{
						visible: false
					}
				}});
				return;
			}
		}
	};


	/*
	 * Check if annotations exist vis-a-vis manifest
	 * @param {String} term - Annotation with Qualifier
	 * @param {Object} annotation - Annotation Data
	 * @param {String} type - Type of Annotation
	 * @param {Boolean} [bMandatory=false] - Whether the term is mandatory
	 * @param {String} logViewId - Id of the view for log purposes
	 * @param {String} contentFragment - To check whether we're dealing with
	 * generic analytic card or legacy type.
	 * @returns {Boolean}
	 */
	sap.ovp.cards.charts.VizAnnotationManager.checkExists = function(term, annotation, type, bMandatory, logViewId, contentFragment) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		bMandatory = typeof bMandatory === "undefined" ? false : bMandatory;
		var ret = false;
		var annoTerm;
		if (!term && bMandatory) {
			jQuery.sap.log.error(logViewId + self.errorMessages.CARD_ERROR + type + self.errorMessages.IS_MANDATORY);
			return ret;
		}
		if (!term) {
			/* Optional parameters can be blank */
			jQuery.sap.log.warning(logViewId + self.errorMessagesCARD_WARNING + type + self.errorMessages.IS_MISSING);
			ret = true;
			return ret;
		}
		annoTerm = annotation[term];
		if (!annoTerm || typeof annoTerm !== "object") {
			var logger = bMandatory ? jQuery.sap.log.error : jQuery.sap.log.warning;
			logger(logViewId + self.errorMessages.CARD_ERROR + "in " + type +
					". (" + term + " " + self.errorMessages.NOT_WELL_FORMED);
			return ret;
		}
		/*
		 * For new style generic analytical card, make a check chart annotation
		 * has chart type.
		 */
		if (contentFragment &&
			contentFragment == "sap.ovp.cards.charts.analytical.analyticalChart" &&
			type == "Chart Annotation" &&
			(!annoTerm.ChartType || !annoTerm.ChartType.EnumMember)) {
			jQuery.sap.log.error(logViewId + self.errorMessages.CARD_ERROR + self.errorMessages.MISSING_CHARTTYPE +
					self.errorMessages.CHART_ANNO);
			return ret;
		}
		ret = true;
		return ret;
	};

	/*
	 * Check and log errors/warnings if any.
	 */
	sap.ovp.cards.charts.VizAnnotationManager.validateCardConfiguration = function(oController) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		var ret = false;
		if (!oController) {
			return ret;
		}
		var selVar;
		var chartAnno;
		var contentFragment;
		var preVar;
		var idAnno;
		var dPAnno;
		var entityTypeData;
		var logViewId = "";
		var oCardsModel;
		var oView = oController.getView();
		if (oView) {
			logViewId = "[" + oView.getId() + "] ";
		}

		if (!(oCardsModel = oController.getCardPropertiesModel())) {
			jQuery.sap.log.error(logViewId + self.errorMessages.CARD_ERROR + "in " + self.errorMessages.CARD_CONFIG +
					self.errorMessages.NO_CARD_MODEL);
			return ret;
		}

		entityTypeData = oCardsModel.getProperty("/entityType");
		if (!entityTypeData || jQuery.isEmptyObject(entityTypeData)) {
			jQuery.sap.log.error(logViewId + self.errorMessages.CARD_ERROR + "in " + self.errorMessages.CARD_ANNO);
			return ret;
		}

		selVar = oCardsModel.getProperty("/selectionAnnotationPath");
		chartAnno = oCardsModel.getProperty("/chartAnnotationPath");
		preVar = oCardsModel.getProperty("/presentationAnnotationPath");
		idAnno = oCardsModel.getProperty("/identificationAnnotationPath");
		dPAnno = oCardsModel.getProperty("/dataPointAnnotationPath");
		contentFragment = oCardsModel.getProperty("/contentFragment");

		ret = this.checkExists(selVar, entityTypeData, "Selection Variant", false, logViewId);
		ret = this.checkExists(chartAnno, entityTypeData, "Chart Annotation", true, logViewId, contentFragment) && ret;
		ret = this.checkExists(preVar, entityTypeData, "Presentation Variant", false, logViewId) && ret;
		ret = this.checkExists(idAnno, entityTypeData, "Identification Annotation", true, logViewId) && ret;
		ret = this.checkExists(dPAnno, entityTypeData, "Data Point", false, logViewId) && ret;
		return ret;
	};


	/*
	 * Check if backend supplies no data.
	 * If so, show the no-data fragment.
	 * Commented out due to an issue with filters.
	 * Shows No data available even when correct filters are applied the second time.
	 * So, removing it temporarily.
	 */
	sap.ovp.cards.charts.VizAnnotationManager.checkNoData = function(oEvent, cardContainer, vizFrame) {
	/*	var self = sap.ovp.cards.charts.VizAnnotationManager;
		var data, noDataDiv;
		if (!cardContainer) {
			jQuery.sap.log.error(self.errorMessages.CARD_ERROR + self.errorMessages.CARD_CONTAINER_ERROR +
					"(" + vizFrame.getId() + ")");
			return;
		}
		data = oEvent.getParameter("data");
		if (!data || jQuery.isEmptyObject(data) ||
			!data.results || !data.results.length) {

			jQuery.sap.log.error(self.errorMessages.CARD_ERROR + self.errorMessages.DATA_UNAVAIALABLE  +
					"(" + vizFrame.getId() + ")");
			noDataDiv = sap.ui.xmlfragment("sap.ovp.cards.charts.generic.noData");
			cardContainer.removeAllItems();
			cardContainer.addItem(noDataDiv);
		}*/
	};


	/*
	 * @param {Object} [oChartType] - Chart Annotation Object
	 * @returns {Object} - Get config object of a particular chart type from
	 * configuration defined in config.json.
	 * If the param is absent, return config of all charts.
	 */
	sap.ovp.cards.charts.VizAnnotationManager.getConfig = function(oChartType) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		var ret = {};
		var chartAnnoName, chartType, analyticDIR, reference, fullConf = null;
		var bChartType = !!oChartType;
		if (!jQuery.sap.getObject("sap.ovp.cards.charts.config")) {
			analyticDIR = jQuery.sap.getModulePath("sap.ovp.cards.charts");
			sap.ovp.cards = sap.ovp.cards  || {};
			sap.ovp.cards.charts = sap.ovp.cards.charts || {};
			try {
				sap.ovp.cards.charts.config = jQuery.sap.loadResource({
					url: analyticDIR + "/config.json",
					dataType: "json",
					async: false
				});
			} catch (e) {
				jQuery.sap.log.error(self.errorMessages.CONFIG_LOAD_ERROR + e);
			}
			sap.ovp.cards.charts.config = sap.ovp.cards.charts.config || {};
		}
		fullConf = sap.ovp.cards.charts.config;

		if (!bChartType) {
			return fullConf;
		}

		if (!oChartType.EnumMember ||
			!(chartAnnoName = oChartType.EnumMember.split("/")) ||
			chartAnnoName.length < 2) {
			jQuery.sap.log.error(self.errorMessages.CARD_ERROR + self.errorMessages.INVALID_CHARTTYPE +
					self.errorMessages.ANNO_REF);
			return ret;
		}
		chartType = chartAnnoName[1];
		if (!fullConf[chartType]) {
			jQuery.sap.log.error(self.errorMessages.INVALID_CONFIG + chartType + " " +
					self.errorMessages.CONFIG_JSON);
			return ret;
		}
		if ((reference = fullConf[chartType].reference) &&
			fullConf[reference]) {
			var virtualEntry = jQuery.extend(true, {}, fullConf[reference]);
			fullConf[chartType] = virtualEntry;
		}
		ret = fullConf[chartType];
		return ret;
	};


	/*
	 * If there is exactly one dimension with time semantics (according to model metadata),
	 * then instead time type shall be used.
	 */
	sap.ovp.cards.charts.VizAnnotationManager.hasTimeSemantics = function(aDimensions, config, dataModel, entitySet) {
		var ret = false;
		var oMetadata;
		var dimensionName;
		var dimensionType;
		var displayFormat;
		var sapSemantics;
        var sapSemanticsV4; //as part of supporting V4 annotation
		if (!config.time || jQuery.isEmptyObject(config.time)) {
			return ret;
		}
		if (!aDimensions) {
			return ret;
		}
        for (var index = 0; index < aDimensions.length; index++) {
            if (!aDimensions[index].Dimension || !(dimensionName = aDimensions[index].Dimension.PropertyPath)) {
                return ret;
            }
            oMetadata = this.getMetadata(dataModel, entitySet);
            if (oMetadata && oMetadata[dimensionName]) {
                dimensionType = oMetadata[dimensionName][this.constants.TYPE_KEY];
                displayFormat = oMetadata[dimensionName][this.constants.DISPLAY_FORMAT_KEY];
                sapSemantics = oMetadata[dimensionName][this.constants.SEMANTICS_KEY];
                sapSemanticsV4 = oMetadata[dimensionName]["com.sap.vocabularies.Common.v1.IsCalendarYear"]; //as part of supporting V4 annotation
            }
            if (dimensionType &&
                displayFormat &&
                dimensionType.lastIndexOf("Edm.Date", 0) === 0 &&
                displayFormat.toLowerCase() == "date") {
                ret = true;
            } //as part of supporting V4 annotation
            if (dimensionType == "Edm.String" && (sapSemanticsV4 || sapSemantics && sapSemantics.lastIndexOf("year", 0) === 0)) {
                ret = true;
            }
            if (ret) {
                //In the dimension array insert the date dimension at first place
                aDimensions.unshift(aDimensions.splice(index, 1)[0]);
                break;
            }
        }
		return ret;
	};


	/*
	 * Formatter for VizFrame type.
	 * @param {Object} oChartType - Chart Annotation Object
	 * @returns {String} Valid Enum for Vizframe type
	 */
	sap.ovp.cards.charts.VizAnnotationManager.getChartType = function(iContext, oChartType, aDimensions) {
		var ret = "";
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		var config = self.getConfig(oChartType);
		var dataModel, entitySet;
		if (!config) {
			return ret;
		}
		ret = config.default.type;
		dataModel = iContext.getSetting("dataModel");
		entitySet = iContext.getSetting('ovpCardProperties').getProperty("/entitySet");
		if (self.hasTimeSemantics(aDimensions, config, dataModel, entitySet)) {
			ret = config.time.type;
		}
		return ret;
	};
	sap.ovp.cards.charts.VizAnnotationManager.getChartType.requiresIContext = true;


	/*
	 * Check if roles are valid for dimension/measure for the chart type
	 */
	sap.ovp.cards.charts.VizAnnotationManager.checkRolesForProperty = function(queue, config, type) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		/* Nothing remains in the queue, all good !!! */
		if (!queue.length) {
			return;
		}
		var feedtype = type == "dimension" ? "Dimension" : "Measure";
		var queuedNames = [];
		jQuery.each(queue, function(i, val) {
			if (!val || !val[feedtype] || !val[feedtype].PropertyPath) {
				jQuery.sap.log.error(self.errorMessages.INVALID_CHART_ANNO);
				return false;
			}
			queuedNames.push(val[feedtype].PropertyPath);
		});
		var allowedRoles = jQuery.map(config.feeds, function(f) {
			if (f.type == type) {
				if (f.role) {
					return f.role.split("|");
				}
				return [];
			}
		});
		allowedRoles = jQuery.grep(allowedRoles, function(role, i) {
			return jQuery.inArray(role, allowedRoles) == i;
		}).join(", ");

		jQuery.sap.log.error(self.errorMessages.CARD_ERROR + self.errorMessages.INVALID_REDUNDANT  +
			type + "(s) " + queuedNames.join(", ") + ". " + self.errorMessages.ALLOWED_ROLES + config.type +
			self.errorMessages.CHART_IS + allowedRoles);
	};


    sap.ovp.cards.charts.VizAnnotationManager.getPrimitiveValue = function (oValue,isLegend) {
        var value;

        if (oValue) {
            if (oValue.String) {
                value = oValue.String;
            } else if (oValue.Boolean || oValue.Bool) {
                value = sap.ovp.cards.charts.VizAnnotationManager.getBooleanValue(oValue);
            } else {
                value = sap.ovp.cards.charts.VizAnnotationManager.getNumberValue(oValue,isLegend);
            }
        }
        return value;
    };

    sap.ovp.cards.charts.VizAnnotationManager.getBooleanValue = function (oValue, bDefault) {
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
    };

	sap.ovp.cards.charts.VizAnnotationManager.getNumberValue = function(oValue,isLegend) {
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
		
		if (isLegend) {
			jQuery.sap.require("sap.ui.core.format.NumberFormat");
			var numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				style: 'short',
				minFractionDigits: 2,
				maxFractionDigits: 2
			});
			if (value) {
				value = numberFormat.format(Number(value));
			}
		}
		return value;
	};

	sap.ovp.cards.charts.VizAnnotationManager.formThePathForCriticalityStateCalculation = function(iContext, oDataPoint) {
		
		function getPathOrPrimitiveValue(oItem) {
			if (oItem) {
				if (oItem.Path) {
					return "{path:'" + oItem.Path + "'}";
				} else {
					return sap.ovp.cards.charts.VizAnnotationManager.getPrimitiveValue(oItem);
				}
			} else {
				return "";
			}
		}
		
		var value = iContext[iContext.measureNames];
		if (oDataPoint && oDataPoint.CriticalityCalculation && oDataPoint.CriticalityCalculation.ImprovementDirection) {
			var sImprovementDirection = oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember;
			var deviationLow = getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeLowValue);
			var deviationHigh = getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeHighValue);
			var toleranceLow = getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue);
			var toleranceHigh = getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue);

			return sap.ovp.cards.AnnotationHelper._calculateCriticalityState( value, sImprovementDirection, deviationLow, deviationHigh, toleranceLow, toleranceHigh, sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues);
		} else {
			//If there's no criticality calculation in the datapoint annotation, we check for criticality
			var state = oDataPoint.Criticality.EnumMember;
			var criticalTypeArr = state ? state.split("/") : [];
			if (criticalTypeArr) {
				return criticalTypeArr[1]; //returns positive, negative, critical or none
			}
		}
	};

	sap.ovp.cards.charts.VizAnnotationManager.mapMeasures = function(oContext, oMetadata, aMeasures) {
		var value,dataPointAnnotationPath;
        jQuery.each(oMetadata, function (i, v) {
            //as part of supporting V4 annotation
            if (v["com.sap.vocabularies.Common.v1.Label"] && v["com.sap.vocabularies.Common.v1.Label"].String == oContext.measureNames) {
                value = v.name;
                return false;
            } else if (v["com.sap.vocabularies.Common.v1.Label"] && v["com.sap.vocabularies.Common.v1.Label"].Path == oContext.measureNames) {
                value = v.name;
                return false;
            } else if (v["sap:label"] == oContext.measureNames) {
                value = v.name;
                return false;
            }
        });
		
		jQuery.each(aMeasures, function(i,v) {
			if (v.Measure.PropertyPath == value) {
				if (!v.DataPoint || !v.DataPoint.AnnotationPath) {
					return false;
				}
				dataPointAnnotationPath = v.DataPoint.AnnotationPath;
				return false;
				}
			});
		return dataPointAnnotationPath;
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue = function(oItem, isLegend) {
		
		if (oItem) {
			if (oItem.Path) {
					return oItem.Path;
			} else {
					return sap.ovp.cards.charts.VizAnnotationManager.getPrimitiveValue(oItem,isLegend);
			}
		} else {
			return "";
		}
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.checkFlag = function(aMeasures, entityTypeObject) {
		function endsWith(sString, sSuffix) {
			return sString && sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
		}
		var boolFlag = false;
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		jQuery.each(aMeasures, function(i,v) {
			if (v.DataPoint && v.DataPoint.AnnotationPath) {
				var oDatapoint = entityTypeObject[v.DataPoint.AnnotationPath.substring(1)];
				if (oDatapoint && oDatapoint.CriticalityCalculation &&
						oDatapoint.CriticalityCalculation.ImprovementDirection &&
						oDatapoint.CriticalityCalculation.ImprovementDirection.EnumMember) {

					var sImproveDirection = oDatapoint.CriticalityCalculation.ImprovementDirection.EnumMember;
					
					var deviationLow = sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue(oDatapoint.CriticalityCalculation.DeviationRangeLowValue);
					var deviationHigh = sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue(oDatapoint.CriticalityCalculation.DeviationRangeHighValue);
					var toleranceLow = sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue(oDatapoint.CriticalityCalculation.ToleranceRangeLowValue);
					var toleranceHigh = sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue(oDatapoint.CriticalityCalculation.ToleranceRangeHighValue);

					if (endsWith(sImproveDirection, "Minimize") ||
							endsWith(sImproveDirection, "Minimizing")) {
						if (toleranceHigh && deviationHigh) {
							boolFlag = true;
							return false;
						} else {
							jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.INVALID_CRITICALITY);
						}

					} else if (endsWith(sImproveDirection, "Maximize") ||
							endsWith(sImproveDirection, "Maximizing")) {
						if (toleranceLow && deviationLow) {
							boolFlag = true;
							return false;
						} else {
							jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.INVALID_CRITICALITY);
						}

					} else if (endsWith(sImproveDirection, "Target")) {
						if (toleranceLow && deviationLow && toleranceHigh && deviationHigh) {
							boolFlag = true;
							return false;
						} else {
							jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.INVALID_CRITICALITY);
						}
					}
					
				} else if (oDatapoint && oDatapoint.Criticality) {
					boolFlag = true;
					return false;
				} else {
					jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.INVALID_IMPROVEMENT_DIR);
				}
			}
		});
		if (boolFlag == true && aMeasures.length > 1) {
			jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.INVALID_SEMANTIC_MEASURES);
		}
		return boolFlag;
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.buildSemanticLegends = function(oMeasure, entityTypeObject, oMetadata){
		function endsWith(sString, sSuffix) {
			return sString && sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
		}
		var ret = [null, null];
		var isLegend = true;
		var measureName = oMeasure.Measure.PropertyPath;
        if (oMetadata[measureName]) {
            if (oMetadata[measureName][this.constants.LABEL_KEY_V4]) { //as part of supporting V4 annotation
                measureName = oMetadata[measureName][this.constants.LABEL_KEY_V4].String ? oMetadata[measureName][this.constants.LABEL_KEY_V4].String : oMetadata[measureName][this.constants.LABEL_KEY_V4].Path;
            } else if (oMetadata[measureName][this.constants.LABEL_KEY]) {
                measureName = oMetadata[measureName][this.constants.LABEL_KEY];
            } else if (measureName) {
                measureName = measureName;
            }
        }
		var dataPointAnnotationPath = oMeasure.DataPoint.AnnotationPath;
		var oDataPoint = entityTypeObject[dataPointAnnotationPath.substring(1)];
		if (!oDataPoint.CriticalityCalculation ||
				!oDataPoint.CriticalityCalculation.ImprovementDirection ||
				!oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember) {
			return ret;
		}
		var sImproveDirection = oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember;
		var deviationLow = sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeLowValue,isLegend);
		var deviationHigh = sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeHighValue,isLegend);
		var toleranceLow = sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue,isLegend);
		var toleranceHigh = sap.ovp.cards.charts.VizAnnotationManager.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue,isLegend);
		
		jQuery.sap.require("sap.ui.core.format.NumberFormat");

		if (endsWith(sImproveDirection, "Minimize") ||
				endsWith(sImproveDirection, "Minimizing")) {
			if (toleranceHigh && deviationHigh) {
				ret[0] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("MINIMIZING_LESS",[measureName, toleranceHigh]);
				ret[1] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("MINIMIZING_MORE",[measureName, deviationHigh]);
				ret[2] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("MINIMIZING_CRITICAL",[toleranceHigh, measureName, deviationHigh]);
			}

		} else if (endsWith(sImproveDirection, "Maximize") ||
				endsWith(sImproveDirection, "Maximizing")) {
			if (toleranceLow && deviationLow) {
				ret[0] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("MAXIMISING_MORE",[measureName, toleranceLow]);
				ret[1] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("MAXIMISING_LESS",[measureName, deviationLow]);
				ret[2] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("MAXIMIZING_CRITICAL",[deviationLow, measureName, toleranceLow]);
			}

		} else if (endsWith(sImproveDirection, "Target")) {
			if (toleranceLow && deviationLow && toleranceHigh && deviationHigh) {
				ret[0] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("TARGET_BETWEEN",[toleranceLow, measureName, toleranceHigh]);
				ret[1] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("TARGET_AROUND",[measureName, deviationLow, deviationHigh]);
				ret[2] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("TARGET_CRITICAL",[deviationLow, measureName, toleranceLow, toleranceHigh, deviationHigh]);
			}
		}
		return ret;
	};
	
	// Check the numberFormat of the DataPoint for each measure
	sap.ovp.cards.charts.VizAnnotationManager.checkNumberFormat = function(minValue,val,entityTypeObject) {
		if (val && val.DataPoint && val.DataPoint.AnnotationPath) {
			var oDataPoint = entityTypeObject[val.DataPoint.AnnotationPath.substring(1)];
			var fractionDigits, fractionDigitsVal;
			if (oDataPoint && oDataPoint.ValueFormat) {
				fractionDigits = oDataPoint.ValueFormat;
			} else if (oDataPoint && oDataPoint.NumberFormat) {
				fractionDigits = oDataPoint.NumberFormat;
			}
			
			if (fractionDigits && fractionDigits.NumberOfFractionalDigits && fractionDigits.NumberOfFractionalDigits.Int) {
				fractionDigitsVal = fractionDigits.NumberOfFractionalDigits.Int;
				if (minValue < Number(fractionDigitsVal)) {
					minValue = Number(fractionDigitsVal);
				}
			}
		}
		
		return minValue;
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.getMaxScaleFactor = function(maxScaleValue,val,entityTypeObject) {
		if (val && val.DataPoint && val.DataPoint.AnnotationPath) {
			var oDataPoint = entityTypeObject[val.DataPoint.AnnotationPath.substring(1)];
			var scaleF, ScaleFVal;
			if (oDataPoint && oDataPoint.ValueFormat) {
				scaleF = oDataPoint.ValueFormat; 
			} else if (oDataPoint && oDataPoint.NumberFormat) {
				scaleF = oDataPoint.NumberFormat;
			}
			
			if (scaleF) {
				if (scaleF.ScaleFactor && scaleF.ScaleFactor.Decimal) {
					ScaleFVal = Number(scaleF.ScaleFactor.Decimal);
				} else if (scaleF.ScaleFactor && scaleF.ScaleFactor.Int) {
					ScaleFVal = Number(scaleF.ScaleFactor.Int);
				}
				
				if (!isNaN(ScaleFVal)) {
					if (maxScaleValue === undefined){
						maxScaleValue = Number(ScaleFVal);
					} else if (maxScaleValue > Number(ScaleFVal)) {
						maxScaleValue = Number(ScaleFVal);
					}
				}
			}
		} 
		return maxScaleValue;
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.isMeasureCurrency = function(oMetadata, sapUnit) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
        //as part of supporting V4 annotation
		if (oMetadata && oMetadata[sapUnit] && (oMetadata[sapUnit]["Org.OData.Measures.V1.ISOCurrency"] || (oMetadata[sapUnit][self.constants.SEMANTICS_KEY] && oMetadata[sapUnit][self.constants.SEMANTICS_KEY] === self.constants.CURRENCY_CODE))) {
			return true;
		}
		return false;
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.fractionalDigitsExists = function(val,entityTypeObject) {
		if (val.DataPoint && val.DataPoint.AnnotationPath) {
			var oDataPoint = entityTypeObject[val.DataPoint.AnnotationPath.substring(1)];
			if (oDataPoint && oDataPoint.ValueFormat && oDataPoint.ValueFormat.NumberOfFractionalDigits 
					&& oDataPoint.ValueFormat.NumberOfFractionalDigits.Int) {
				return true;
			} else if (oDataPoint && oDataPoint.NumberFormat && oDataPoint.NumberFormat.NumberOfFractionalDigits 
					&& oDataPoint.NumberFormat.NumberOfFractionalDigits.Int) {
				return true;
			} 
		}
		return false;
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.checkEDMINT32Exists = function(oMetadata,val,feedtype) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		if (oMetadata[val[feedtype].PropertyPath][self.constants.EDM_TYPE] == self.constants.EDM_INT32) {
			return true;
		}
		return false;
	};
	
	/*
	 * Construct VizProperties and Feeds for VizFrame
	 * @param {Object} VizFrame
	 */
	sap.ovp.cards.charts.VizAnnotationManager.buildVizAttributes = function(vizFrame,handler,chartTitle) {
		var oCardsModel, entityTypeObject, chartAnno, chartContext;
		var chartType, allConfig, config, aDimensions, aMeasures;
		var oVizProperties;
		var aQueuedProperties, aQueuedDimensions, aQueuedMeasures;
		var aPropertyWithoutRoles, aDimensionWithoutRoles = [], aMeasureWithoutRoles = [];
		var bSupportsTimeSemantics;
		var reference;
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		chartType = vizFrame.getVizType();
		allConfig = this.getConfig();
		
		for (var key in allConfig) {
			if ((reference = allConfig[key].reference) &&
					allConfig[reference]) {
					var virtualEntry = jQuery.extend(true, {}, allConfig[reference]);
					allConfig[key] = virtualEntry;
				}
			if (allConfig[key].default.type == chartType ||
				(allConfig[key].time && allConfig[key].time.type == chartType)) {
				config = allConfig[key];
				break;
			}
		}


		if (!config) {
			jQuery.sap.log.error(self.errorMessages.CARD_ERROR + "in " + self.errorMessages.CARD_CONFIG +
					self.errorMessages.CARD_CONFIG_ERROR + chartType + " " + self.errorMessages.CARD_CONFIG_JSON);
			return;
		}

		if (!(oCardsModel = vizFrame.getModel('ovpCardProperties'))) {
			jQuery.sap.log.error(self.errorMessages.CARD_ERROR + "in " + self.errorMessages.CARD_CONFIG +
					self.errorMessages.NO_CARD_MODEL);
			return;
		}
		var dataModel = vizFrame.getModel();
		var entitySet = oCardsModel.getProperty("/entitySet");
		if (!dataModel || !entitySet) {
			return;
		}
		entityTypeObject = oCardsModel.getProperty("/entityType");
		if (!entityTypeObject) {
			jQuery.sap.log.error(self.errorMessages.CARD_ANNO_ERROR + "in " + self.errorMessages.CARD_ANNO);
			return;
		}
		var oMetadata = self.getMetadata(dataModel, entitySet);
		chartAnno = oCardsModel.getProperty("/chartAnnotationPath");
		if (!chartAnno || !(chartContext = entityTypeObject[chartAnno])) {
			jQuery.sap.log.error(self.errorMessages.CARD_ANNO_ERROR + "in " + self.errorMessages.CARD_ANNO);
			return;
		}

		if (!(aDimensions = chartContext.DimensionAttributes) ||
				!aDimensions.length) {
			jQuery.sap.log.error(self.errorMessages.CHART_ANNO_ERROR + "in " + self.errorMessages.CHART_ANNO + " " +
					self.errorMessages.DIMENSIONS_MANDATORY);
			return;
		}
		//Added support for fractional digits 
		var iNumberOfFractionalDigits;
		if (!(aMeasures = chartContext.MeasureAttributes) ||
				!aMeasures.length) {
			jQuery.sap.log.error(self.errorMessages.CHART_ANNO_ERROR + "in " + self.errorMessages.CHART_ANNO + " " +
					self.errorMessages.MEASURES_MANDATORY);
			return;
		} else {
            var datapointAnnotationPath = aMeasures[0].DataPoint ? entityTypeObject[aMeasures[0].DataPoint.AnnotationPath.substring(1)]: null ;
            iNumberOfFractionalDigits = datapointAnnotationPath ? (datapointAnnotationPath.NumberFormat ?( datapointAnnotationPath.NumberFormat.NumberOfFractionalDigits ? datapointAnnotationPath.NumberFormat.NumberOfFractionalDigits.Int :0 ): 0 ): 0;
        }
		bSupportsTimeSemantics = self.hasTimeSemantics(aDimensions, config, dataModel, entitySet);
		if (bSupportsTimeSemantics) {
			config = config.time;
		} else {
			config = config.default;
		}

		var chartProps = oCardsModel.getProperty("/ChartProperties");
		
		var bErrors = false;
	var tooltipFormatString = iNumberOfFractionalDigits > 0 ? "tooltipNoScaleFormatter/" + iNumberOfFractionalDigits.toString() + "/" : 'tooltipNoScaleFormatter/-1/';
		var oTooltip = new sap.viz.ui5.controls.VizTooltip({formatString: tooltipFormatString});
		oTooltip.connect(vizFrame.getVizUid());
		
		/*
		 * Check if given number of dimensions, measures
		 * are valid acc to config's min and max requirements
		 */
		[config.dimensions, config.measures].forEach(function(entry, i) {
			var oProperty = i ? aMeasures : aDimensions;
			var typeCue = i ? "measure(s)" : "dimension(s)";
			if (entry.min && oProperty.length < entry.min) {
				jQuery.sap.log.error(self.errorMessages.CARD_ERROR + "in " + chartType +
					" " + self.errorMessages.CARD_LEAST + entry.min + " " + typeCue);
				bErrors = true;
			}
			if (entry.max && oProperty.length > entry.max) {
				jQuery.sap.log.error(self.errorMessages.CARD_ERROR + "in " + chartType +
						self.errorMessages.CARD_MOST + entry.max + " " + typeCue);
				bErrors = true;
			}
		});

		if (bErrors) {
			return;
		}
		
		/* HEADER UX stuff */
		var bHideAxisTitle = true;
		
		if (config.properties && config.properties.hasOwnProperty("hideLabel") &&
				!config.properties["hideLabel"]) {
			 bHideAxisTitle = false;
		} 
		
		var bDatapointNavigation = true;
		
		//FIORITECHP1-6021 - Allow Disabling of Navigation from Graph
//		var dNav = oCardsModel.getProperty("/navigation");
//		if (dNav == "chartNav") {
//			bDatapointNavigation = false;
//		}
		var bDonutChart = false;
		if (chartType == 'donut') {
			bDonutChart = true;
		}
		vizFrame.removeAllAggregation();
		/*
		 * Default viz properties template
		 */
		oVizProperties = {
				legend: {
					isScrollable: false
				},
				title: {
					visible: false
				},
				interaction:{
					noninteractiveMode: bDatapointNavigation ? false : true,
					selectability: {
						legendSelection: false,
						axisLabelSelection: false,
						mode: 'EXCLUSIVE',
						plotLassoSelection: false,
						plotStdSelection: true
					},
					zoom:{
						enablement: 'disabled'
					}
				},
				plotArea:{
					window: {
						start: 'firstDataPoint',
						end: 'lastDataPoint'
					},
					dataLabel: {
						visible : bDonutChart ? true : false,
						type : 'value' //FIORITECHP1-5665 - Donut and Pie charts should be able to show numbers
					},
					dataPoint: {
						invalidity: 'ignore'
					}
				},
				categoryAxis: {
					label: {
						truncatedLabelRatio: 0.15
					}
				},
				general:{
					groupData: false,
					showAsUTC: true
				}
		};
		
		if (config.properties && config.properties.semanticColor == true && sap.ovp.cards.charts.VizAnnotationManager.checkFlag(aMeasures, entityTypeObject)) {
			//put strings in resource bundle
			var goodLegend = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("GOOD");
			var badLegend = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("BAD");
			var criticalLegend = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("CRITICAL");
			var othersLegend = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("OTHERS");
			if (aMeasures.length == 1) {
				var legends = self.buildSemanticLegends(aMeasures[0], entityTypeObject, oMetadata);
				var goodLegend = legends[0] || goodLegend,
				badLegend = legends[1] || badLegend,
				criticalLegend = legends[2] || criticalLegend,
				othersLegend = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("OTHERS");
			}
			oVizProperties.plotArea.dataPointStyle = {
						rules:
							[
							 { 
								 callback: function (oContext) {
									 var dataPointAnnotationPath = sap.ovp.cards.charts.VizAnnotationManager.mapMeasures(oContext, oMetadata, aMeasures);
									 if (!dataPointAnnotationPath) {
										return false;
									 }
									 var criticality = entityTypeObject[dataPointAnnotationPath.substring(1)];
									 var sState = sap.ovp.cards.charts.VizAnnotationManager.formThePathForCriticalityStateCalculation(oContext, criticality);
									 if (sState == sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues.Positive) {
										return true;
									 } else if (sState === "Positive") {
										return true;
									 }
								 },
								 properties: {
									 color: "sapUiChartPaletteSemanticGoodLight1" 
								 },
								 "displayName" : goodLegend
							 },
							 {
								 callback: function (oContext) {
									 var dataPointAnnotationPath = sap.ovp.cards.charts.VizAnnotationManager.mapMeasures(oContext, oMetadata, aMeasures);
									 if (!dataPointAnnotationPath) {
										return false;
									 }
									 var criticality = entityTypeObject[dataPointAnnotationPath.substring(1)];
									 var sState = sap.ovp.cards.charts.VizAnnotationManager.formThePathForCriticalityStateCalculation(oContext, criticality);
									 if (sState == sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues.Critical) {
										return true;
									 } else if (sState === "Critical") {
										return true;
									 }
								 },
								 properties: {
									 color: "sapUiChartPaletteSemanticCriticalLight1" 
								 },
								 "displayName" : criticalLegend
							 },
							 {
								 callback: function (oContext) {
									 var dataPointAnnotationPath = sap.ovp.cards.charts.VizAnnotationManager.mapMeasures(oContext, oMetadata, aMeasures);
									 if (!dataPointAnnotationPath) {
										return false;
									 }
									 var criticality = entityTypeObject[dataPointAnnotationPath.substring(1)];
									 var sState = sap.ovp.cards.charts.VizAnnotationManager.formThePathForCriticalityStateCalculation(oContext, criticality);
									 if (sState == sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues.Negative) {
										return true;
									 } else if (sState === "Negative") {
										return true;
									 }
								 },
								 properties: {
									 color: "sapUiChartPaletteSemanticBadLight1" 
								 },
								 "displayName" : badLegend
							 },
							 {
								 callback: function (oContext) {
									 var dataPointAnnotationPath = sap.ovp.cards.charts.VizAnnotationManager.mapMeasures(oContext, oMetadata, aMeasures);
									 if (!dataPointAnnotationPath) {
										return false;
									 }
									 var criticality = entityTypeObject[dataPointAnnotationPath.substring(1)];
									 var sState = sap.ovp.cards.charts.VizAnnotationManager.formThePathForCriticalityStateCalculation(oContext, criticality);
									 if (sState == sap.ovp.cards.AnnotationHelper.criticalityConstants.StateValues.None) {
										return true;
									 } else if (sState === "Neutral") {
										return true;
									 }
								 },
								 properties: {
									 color: "sapUiChartPaletteSemanticNeutralLight1" 
								 },
								 "displayName" : othersLegend
							 }]
					};
		}
		/*Check if the Config.json has scale properties set*/
		var bConsiderAnnotationScales = false;
		
		if (chartContext.ChartType.EnumMember === sap.ovp.cards.charts.VizAnnotationManager.constants.SCATTER_CHARTTYPE ||
				  chartContext.ChartType.EnumMember === sap.ovp.cards.charts.VizAnnotationManager.constants.BUBBLE_CHARTTYPE ||
				  chartContext.ChartType.EnumMember === sap.ovp.cards.charts.VizAnnotationManager.constants.LINE_CHARTTYPE){
				if (chartContext && chartContext.AxisScaling && chartContext.AxisScaling.EnumMember) {
					var sScaleType = chartContext.AxisScaling.EnumMember.substring(chartContext.AxisScaling.EnumMember.lastIndexOf('/') + 1, chartContext.AxisScaling.EnumMember.length);
				//bConsiderAnnotationScales are individually set for each case to make sure the scale values are set casewise
					switch (sScaleType) {
						case "AdjustToDataIncluding0":
							oVizProperties.plotArea.adjustScale = false;
							bConsiderAnnotationScales = true;
							break;
						case "AdjustToData":
							oVizProperties.plotArea.adjustScale = true;
							bConsiderAnnotationScales = true;
							break;
						case "MinMaxValues":
						    var aChartScales = [];
						    if (chartContext["MeasureAttributes"][0] && 
						      chartContext["MeasureAttributes"][0].DataPoint && 
						      chartContext["MeasureAttributes"][0].DataPoint.AnnotationPath){
							var sDataPointAnnotationPath = chartContext["MeasureAttributes"][0].DataPoint.AnnotationPath;
							var sDataPointPath = sDataPointAnnotationPath.substring(sDataPointAnnotationPath.lastIndexOf('@') + 1, sDataPointAnnotationPath.length);
							if (entityTypeObject && entityTypeObject[sDataPointPath]){
								var oMinMaxParams = entityTypeObject[sDataPointPath];
								if (oMinMaxParams && oMinMaxParams.MaximumValue && oMinMaxParams.MaximumValue.Decimal &&
										oMinMaxParams.MinimumValue && oMinMaxParams.MinimumValue.Decimal){
									aChartScales.push({
										feed : "valueAxis",
										max: oMinMaxParams.MaximumValue.Decimal,
			                            min:oMinMaxParams.MinimumValue.Decimal
									});	
								bConsiderAnnotationScales = true;	
								}else {
									jQuery.sap.log.error(self.errorMessages.ERROR_MISSING_AXISSCALES);
								}
								
							}
							
						}
						    //LINE_CHARTTYPE donot have valueAxis2
						if (chartContext.ChartType.EnumMember !== sap.ovp.cards.charts.VizAnnotationManager.constants.LINE_CHARTTYPE &&
							chartContext["MeasureAttributes"][1] &&
							chartContext["MeasureAttributes"][1].DataPoint &&
							chartContext["MeasureAttributes"][1].DataPoint.AnnotationPath){
								var sDataPointAnnotationPath = chartContext["MeasureAttributes"][1].DataPoint.AnnotationPath;
								var sDataPointPath = sDataPointAnnotationPath.substring(sDataPointAnnotationPath.lastIndexOf('@') + 1, sDataPointAnnotationPath.length);
								if (entityTypeObject && entityTypeObject[sDataPointPath]){
									var oMinMaxParams = entityTypeObject[sDataPointPath];
									if (oMinMaxParams && oMinMaxParams.MaximumValue && oMinMaxParams.MaximumValue.Decimal &&
											oMinMaxParams.MinimumValue && oMinMaxParams.MinimumValue.Decimal){	
									aChartScales.push({
										feed : "valueAxis2",
										max: oMinMaxParams.MaximumValue.Decimal,
			                            min:oMinMaxParams.MinimumValue.Decimal
									});	
									bConsiderAnnotationScales = true;
									}else {
										jQuery.sap.log.error(self.errorMessages.ERROR_MISSING_AXISSCALES);
									}
								}
								
							   }
							vizFrame.setVizScales(aChartScales);
							break;
						default:
							break;
					}
				}
			}
		aQueuedDimensions = aDimensions.slice();
		aQueuedMeasures = aMeasures.slice();

//		var minFractionDigits = Number(dataContext.NumberFormat.NumberOfFractionalDigits.Int);
		
		var minValue = 0;
		var minValCurr = 0;
		var maxScaleValue;
		var maxScaleValueCurr;
		var isCurrency = false;
		var isNotCurrency = false;
		var isFractionalDigitsSet = false;
		var isEDMINT32 = false;
		var sapUnit;
		var oVizPropertiesFeeds = [];
		var measureArr = [], dimensionArr = [];

		jQuery.each(config.feeds, function(i, feed) {
			var uid = feed.uid;
			var aFeedProperties = [];
			if (feed.type) {
				var iPropertiesLength, feedtype, propertyName;
				if (feed.type === "dimension") {
					iPropertiesLength = aDimensions.length;
					feedtype = "Dimension";
					propertyName = "dimensions";
					aQueuedProperties = aQueuedDimensions;
					aPropertyWithoutRoles = aDimensionWithoutRoles;
				} else {
					iPropertiesLength = aMeasures.length;
					feedtype = "Measure";
					propertyName = "measures";
					aQueuedProperties = aQueuedMeasures;
					aPropertyWithoutRoles = aMeasureWithoutRoles;
				}
				var min = 0, max = iPropertiesLength;
				if (feed.min) {
					min = min > feed.min ? min : feed.min;
				}
				if (feed.max) {
					max = max < feed.max ? max : feed.max;
				}
				/* If no roles configured - add the property to feed */
				if (!feed.role) {
					var len = aQueuedProperties.length;
					for (var j = 0; j < len && aFeedProperties.length < max; ++j) {
						var val = aQueuedProperties[j];
						aQueuedProperties.splice(j, 1);
						--len;
						--j;
						aFeedProperties.push(val);
                        if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency]) { //as part of supporting V4 annotation
                            sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency].Path ? oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency].Path : undefined;
                        } else if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit]) {
                            sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit].Path ? oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit].Path : undefined;
                        } else if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY]) {
                            sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY];
                        }
                        if (!isEDMINT32 ) {
							isEDMINT32 = self.checkEDMINT32Exists(oMetadata,val,feedtype);
						}
						
						if (self.isMeasureCurrency(oMetadata,sapUnit)) {
							isCurrency = true;
						} else {
							isNotCurrency = true;
						}
						
						if (!isFractionalDigitsSet) {
							isFractionalDigitsSet = self.fractionalDigitsExists(val,entityTypeObject);
						}
						
						if (!isCurrency) {
							minValue = self.checkNumberFormat(minValue,val,entityTypeObject);
							maxScaleValue = self.getMaxScaleFactor(maxScaleValue,val,entityTypeObject);
						} else {
							minValCurr = self.checkNumberFormat(minValCurr,val,entityTypeObject);
							maxScaleValueCurr = self.getMaxScaleFactor(maxScaleValueCurr,val,entityTypeObject);
						}
					}
				} else {
					var rolesByPrio = feed.role.split("|");
					jQuery.each(rolesByPrio, function(j, role) {
						if (aFeedProperties.length == max) {
							return false;
						}
						var len = aQueuedProperties.length;
						for (var k = 0; k < len && aFeedProperties.length < max; ++k) {
							var val = aQueuedProperties[k];
							if (val && val.Role && val.Role.EnumMember &&
								val.Role.EnumMember.split("/") && val.Role.EnumMember.split("/")[1]) {
								var annotationRole = val.Role.EnumMember.split("/")[1];
								if (annotationRole == role) {
									aQueuedProperties.splice(k, 1);
									--len;
									--k;
									aFeedProperties.push(val);
                                    if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency]) { //as part of supporting V4 annotation
                                        sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency].Path ? oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency].Path : undefined;
                                    } else if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit]) {
                                        sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit].Path ? oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit].Path : undefined;
                                    } else if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY]) {
                                        sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY];
                                    }
                                    if (self.isMeasureCurrency(oMetadata,sapUnit)) {
										isCurrency = true;
									} else {
										isNotCurrency = true;
									}
									
									if (!isEDMINT32 ) {
										isEDMINT32 = self.checkEDMINT32Exists(oMetadata,val,feedtype);
									}
									
									if (!isFractionalDigitsSet) {
										isFractionalDigitsSet = self.fractionalDigitsExists(val,entityTypeObject);
									}
									
									if (!isCurrency) {
										minValue = self.checkNumberFormat(minValue,val,entityTypeObject);
										maxScaleValue = self.getMaxScaleFactor(maxScaleValue,val,entityTypeObject);
									} else {
										minValCurr = self.checkNumberFormat(minValCurr,val,entityTypeObject);
										maxScaleValueCurr = self.getMaxScaleFactor(maxScaleValueCurr,val,entityTypeObject);
									}
								}
							} else if (jQuery.inArray(val, aPropertyWithoutRoles) == -1) {
								aPropertyWithoutRoles.push(val);
							}
						}
					});
					if (aFeedProperties.length < max) {
						jQuery.each(aPropertyWithoutRoles, function(k, val) {
							/* defaultRole is the fallback role */
							var defaultRole;
							var index;
							if ((defaultRole = config[propertyName].defaultRole)  &&
								(jQuery.inArray(defaultRole, rolesByPrio) !== -1) &&
								(index = jQuery.inArray(val, aQueuedProperties)) !== -1) {
								aQueuedProperties.splice(index, 1);
								aFeedProperties.push(val);
                                if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency]) { //as part of supporting V4 annotation
                                    sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency].Path ? oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_ISOCurrency].Path : undefined;
                                } else if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit]) {
                                    sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit].Path ? oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY_V4_Unit].Path : undefined;
                                } else if (oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY]) {
                                    sapUnit = oMetadata[val[feedtype].PropertyPath][self.constants.UNIT_KEY];
                                }
                                if (self.isMeasureCurrency(oMetadata,sapUnit)){
									isCurrency = true;
								} else {
									isNotCurrency = true;
								}
								
								if (!isEDMINT32 ) {
									isEDMINT32 = self.checkEDMINT32Exists(oMetadata,val,feedtype);
								}
								
								if (!isFractionalDigitsSet) {
									isFractionalDigitsSet = self.fractionalDigitsExists(val,entityTypeObject);
								}
								
								if (!isCurrency){
									minValue = self.checkNumberFormat(minValue,val,entityTypeObject);
									maxScaleValue = self.getMaxScaleFactor(maxScaleValue,val,entityTypeObject);
								} else {
									minValCurr = self.checkNumberFormat(minValCurr,val,entityTypeObject);
									maxScaleValueCurr = self.getMaxScaleFactor(maxScaleValueCurr,val,entityTypeObject);
								}
								
								if (aFeedProperties.length == max) {
									return false;
								}
							}
						});
					}
					if (aFeedProperties.length < min) {
						jQuery.sap.log.error(self.errorMessages.CARD_ERROR + self.errorMessages.MIN_FEEDS + chartType +
						" " + self.errorMessages.FEEDS_OBTAINED + aFeedProperties.length + " " + self.errorMessages.FEEDS_REQUIRED + min +
						" " + self.errorMessages.FEEDS);
						return false;
					}
				}
				if (aFeedProperties.length) {
					var aFeeds = [];
					var dataset;
					if (!(dataset = vizFrame.getDataset())) {
						jQuery.sap.log.error(self.errorMessages.NO_DATASET);
						return false;
					}
					this.entityTypeObject = entityTypeObject;
					jQuery.each(aFeedProperties, function(i, val) {
						if (!val || !val[feedtype] || !val[feedtype].PropertyPath) {
							jQuery.sap.log.error(self.errorMessages.INVALID_CHART_ANNO);
							return false;
						}
						var property = val[feedtype].PropertyPath;
						var feedName = property;
						var textColumn = property;
						var edmType = null;
						if (oMetadata && oMetadata[property]) {
                            if (oMetadata[property][self.constants.LABEL_KEY_V4]) { //as part of supporting V4 annotation
                                feedName = oMetadata[property][self.constants.LABEL_KEY_V4].String ? oMetadata[property][self.constants.LABEL_KEY_V4].String : (oMetadata[property][self.constants.LABEL_KEY_V4].Path) ? oMetadata[property][self.constants.LABEL_KEY_V4].Path: property;//Fallback on the technical name in case sap:label is not maintained in the desired language
                            } else if (oMetadata[property][self.constants.LABEL_KEY]) {
                                feedName = oMetadata[property][self.constants.LABEL_KEY];
                            } else if (property) {
                                feedName = property;
                            }
                            if (oMetadata[property][self.constants.TEXT_KEY_V4]) { //as part of supporting V4 annotation
                                textColumn = oMetadata[property][self.constants.TEXT_KEY_V4].String ? oMetadata[property][self.constants.TEXT_KEY_V4].String : oMetadata[property][self.constants.TEXT_KEY_V4].Path;
                            } else if (oMetadata[property][self.constants.TEXT_KEY]) {
                                textColumn = oMetadata[property][self.constants.TEXT_KEY];
                            } else if (property) {
                                textColumn = property;
                            }
							edmType = oMetadata[property][self.constants.TYPE_KEY] || null;
						}
						var displayBindingPath;
						if ((edmType == "Edm.DateTime" || edmType == "Edm.DateTimeOffset") && textColumn == property) {
							displayBindingPath = "{path:'" + property + "', formatter: 'sap.ovp.cards.charts.VizAnnotationManager.returnDateFormat'}";
						} else {
							//Check if there's a text arrangement annotation
							if (oMetadata[property] && oMetadata[property][self.constants.TEXT_KEY_V4] && oMetadata[property][self.constants.TEXT_KEY_V4][self.constants.TEXT_ARRANGEMENT_ANNO]) {
								var oTextArrangement, sTextArrangementType;
								//Once you find the text for text arrangement, you need to get the text arrangement type
								//Text Arrangement annotation can be defined in three ways - Property Level, Text Level or Entity Level
								
								//Priority 1 - Property Level
								oTextArrangement = oMetadata[property][self.constants.TEXT_ARRANGEMENT_ANNO];
								sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
								
								//Priority 2 - Text Level
								if (!sTextArrangementType) {
									oTextArrangement = oMetadata[property][self.constants.TEXT_KEY_V4][self.constants.TEXT_ARRANGEMENT_ANNO];
									sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
								}
								
								//Priority 3 - Entity Level
								if (!sTextArrangementType) {
									var oEntityType = this.entityTypeObject;
									oTextArrangement = oEntityType && oEntityType[self.constants.TEXT_ARRANGEMENT_ANNO];
									sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
								}
								switch (sTextArrangementType) {
								//Possible cases are TextFirst, TextLast, TextOnly and TextSeperate. Currently we don't support TextSeperate
									case "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst" :
										displayBindingPath = "{" + textColumn + "}" + " " + "(" + "{" + property + "}" + ")";
										break;
									case "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast" :
										displayBindingPath = "{" + property + "}" + " " + "(" + "{" + textColumn + "}" + ")";
										break;
									case "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly" :
										displayBindingPath = "{" + textColumn + "}";
										break;
									case "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeperate" : //Currently we don't support Text Seperate, fallback to TextLast instead
										displayBindingPath = "{" + property + "}" + " " + "(" + "{" + textColumn + "}" + ")";
										break;
									default :
										displayBindingPath = "{" + property + "}";
										break;
								}
							} else {
								//If there is a Text annotation but no TextArrangement annotation, just show the corresponding property (Like it behaved earlier, before this feature)
								displayBindingPath = "{" + textColumn + "}";
							}
						}
						aFeeds.push(feedName);
						if (feedtype == "Dimension") {
							if (uid == "waterfallType") {
								var dimensionDefinition = new sap.viz.ui5.data.DimensionDefinition({
									name: feedName,
									value: "{" + property + "}"
									//displayValue: displayBindingPath
								});
							} else {
							var dimensionDefinition = new sap.viz.ui5.data.DimensionDefinition({
								name: feedName,
								value: "{" + property + "}",
								displayValue: displayBindingPath
							});
							}
							var isV4CalendarYear = oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYear"] && oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYear"].Bool;
							if (bSupportsTimeSemantics && (edmType == "Edm.DateTime" || isV4CalendarYear || edmType == "Edm.DateTimeOffset")) {
								dimensionDefinition.setDataType("date");
							}
							dataset.addDimension(dimensionDefinition);
							if (jQuery.inArray(feedName, dimensionArr) === -1) {
								dimensionArr.push(feedName);
							}
						} else {
							dataset.addMeasure(new sap.viz.ui5.data.MeasureDefinition({
								name: feedName,
								value: "{" + property + "}"
							}));
							if ((jQuery.inArray(feedName, measureArr) === -1) && (uid != "bubbleWidth")) {
								measureArr.push(feedName);
							}
						}

					}.bind(this));
					vizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
						'uid': uid,
						'type': feedtype,
						'values': aFeeds
					}));
					if (uid === "categoryAxis") {
						oVizProperties[uid] = {
								title:{
									visible: bHideAxisTitle ? false : true,
									text: aFeeds.join(", ")
								},
								label:{
									formatString : isCurrency ? 'CURR' : 'axisFormatter',
									truncatedLabelRatio: 0.15
								}
						};
					} else {
						oVizProperties[uid] = {
								title:{
									visible: bHideAxisTitle ? false : true,
									text: aFeeds.join(", ")
								},
								label:{
									formatString : isCurrency ? 'CURR' : 'axisFormatter'
								}
						};
					}
					
					oVizPropertiesFeeds.push(oVizProperties[uid]);
					
					if (config.hasOwnProperty("vizProperties")){
						var configi = 0;
						var confignumberOfProperties = config.vizProperties.length; 
						var configpathToUse;
						var configvalue;
						for (; configi < confignumberOfProperties;configi++) { 
							if (config.vizProperties[configi].hasOwnProperty("value")) {
								configvalue = config.vizProperties[configi].value;
							}
							if (config.vizProperties[configi].hasOwnProperty("path")) {
								configpathToUse = (config.vizProperties[configi].path).split(".");
								var configlengthOfPathToUse = configpathToUse.length;
								var configtmp, manifestTmp;
								var configcurrent;
								for (var configj = 0, configcurrent = configpathToUse[0], configtmp = oVizProperties, manifestTmp = chartProps; configj < configlengthOfPathToUse; ++configj) {
									if (configj == configlengthOfPathToUse - 1){
										if (manifestTmp && manifestTmp.hasOwnProperty(configcurrent)) {
											//FIORITECHP1-5665 - Donut and Pie charts should be able to show numbers
											if (chartType == 'donut' && (manifestTmp[configcurrent] == "value" || manifestTmp[configcurrent] == "percentage") ) {
												configvalue = manifestTmp[configcurrent];
											} else if (chartType != 'donut') {
												configvalue = manifestTmp[configcurrent];
											}
										} 
										if ((bConsiderAnnotationScales && (configcurrent != "adjustScale")) || 
												(!bConsiderAnnotationScales && (configcurrent === "adjustScale")) || 
												(!bConsiderAnnotationScales && (configcurrent != "adjustScale"))) {
											configtmp[configcurrent] = configvalue;
										}
										break;
									} 
									configtmp[configcurrent] = configtmp[configcurrent] || {};
									configtmp = configtmp[configcurrent];
									if (manifestTmp) {
										manifestTmp[configcurrent] = manifestTmp[configcurrent] || {};
										manifestTmp = manifestTmp[configcurrent];
									}
									
									configcurrent = configpathToUse[configj + 1];
								}
							}
						}
					}
					if (feed.hasOwnProperty("vizProperties")) {
						var i = 0;
						var numberOfProperties = feed.vizProperties.length; 
						var attributeValue;
						var methodToUse;
						var pathToUse;
						
						for (; i < numberOfProperties;i++) { 
							if (feed.vizProperties[i].hasOwnProperty("method")) {
								methodToUse = feed.vizProperties[i].method;
								
								switch (methodToUse) {
								case 'count':
									attributeValue = aFeeds.length;
									if (feed.vizProperties[i].hasOwnProperty("min") &&
											attributeValue <= feed.vizProperties[i].min) {
										attributeValue = feed.vizProperties[i].min;
									} else if (feed.vizProperties[i].hasOwnProperty("max") &&
											attributeValue >= feed.vizProperties[i].max) {
										attributeValue = feed.vizProperties[i].max;
									}
									break;
								}
							}else if (feed.vizProperties[i].hasOwnProperty("value")){
								attributeValue = feed.vizProperties[i].value;
								
							}
							if (feed.vizProperties[i].hasOwnProperty("path")) {
								pathToUse = (feed.vizProperties[i].path).split(".");
								var lengthOfPathToUse = pathToUse.length;
								var tmp;
								var current;
								for (var j = 0, current = pathToUse[0], tmp = oVizProperties; j < lengthOfPathToUse; ++j) {
									if (j == lengthOfPathToUse - 1){
										tmp[current] = attributeValue;
										break;
									} 
									tmp[current] = tmp[current] || {};
									tmp = tmp[current];
									current = pathToUse[j + 1];
								} 
							}
						}
					}
				}
			}
		});

		var feeds = vizFrame.getFeeds();
		if (config.properties && config.properties.semanticPattern == true && sap.ovp.cards.charts.VizAnnotationManager.getMeasureDimCheck(feeds, chartType)) {
		jQuery.each(feeds, function(i,v){
			if (feeds[i].getType() == 'Measure' && ((feeds[i].getUid() == 'valueAxis') || (feeds[i].getUid() == 'actualValues'))) {
				var selectedValue;
				jQuery.each(aMeasures, function(index,value){
					var valueLabel = sap.ovp.cards.charts.VizAnnotationManager.getSapLabel(value.Measure.PropertyPath, oMetadata);
					if (valueLabel == feeds[i].getValues()[0]) {
						selectedValue = sap.ovp.cards.charts.VizAnnotationManager.checkForecastMeasure(value, entityTypeObject);
						return false;
					}
				});
				if (selectedValue) {
				var actualMeasure = sap.ovp.cards.charts.VizAnnotationManager.getSapLabel(selectedValue.Measure.PropertyPath, oMetadata);
				var forecastMeasure = entityTypeObject[selectedValue.DataPoint.AnnotationPath.substring(1)].ForecastValue.PropertyPath;
				var forecastValue = sap.ovp.cards.charts.VizAnnotationManager.getSapLabel(forecastMeasure, oMetadata);
				var actualValue = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("ACTUAL",[actualMeasure]);
				var forecastValueName = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("FORECAST",[forecastValue]);
				oVizProperties.plotArea.dataPointStyle = {
							rules:
								[
								 {
									 dataContext: {
										MeasureNamesDimension : actualMeasure
									 },
									 properties: {
										 color: "sapUiChartPaletteSequentialHue1Light1",
										 lineType : "line",
										 lineColor : "sapUiChartPaletteSequentialHue1Light1"

									 },
									 displayName : actualValue
								 },
								 {
									 dataContext: {
											MeasureNamesDimension : forecastValue
									 },
									 properties: {
										 color: "sapUiChartPaletteSequentialHue1Light1",
										 lineType : "dotted",
										 lineColor : "sapUiChartPaletteSequentialHue1Light1",
										 pattern : "diagonalLightStripe"
									 },
									 displayName : forecastValueName
								 }]
						};
						vizFrame.getDataset().addMeasure(new sap.viz.ui5.data.MeasureDefinition({
								name: forecastValue,
								value: "{" + forecastMeasure + "}"
						}));
						var values = feeds[i].getValues();
						values.push(forecastValue);
						feeds[i].setValues(values);
			}
				return false;
			}
		});
		}
		
		if (isCurrency && isNotCurrency) {
			jQuery.sap.log.warning(sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Currency_non_currency_measure"));
		}
		
		if (isEDMINT32 && !isFractionalDigitsSet) { 
			minValCurr = minValue = -1;
		} else if (!isEDMINT32 && !isFractionalDigitsSet) {
			minValCurr = minValue = -1;
		}
		
		var scaleUnit;
		
		if (maxScaleValueCurr === undefined) {
			maxScaleValueCurr = "";
		}
		
		if (maxScaleValue === undefined) {
			maxScaleValue = "";
		}
		
		if (isCurrency) {
			scaleUnit = sap.ovp.cards.charts.VizAnnotationManager.getScaleUnit(maxScaleValueCurr,isCurrency);
		} else {
			scaleUnit = sap.ovp.cards.charts.VizAnnotationManager.getScaleUnit(maxScaleValue,isCurrency);
		}
		
		if (handler) {
			handler.setScale(scaleUnit);
		}
		sap.ovp.cards.charts.VizAnnotationManager.setFormattedChartTitle(measureArr,dimensionArr,chartTitle);
		
		var fmtStr = "";
		jQuery.each(oVizPropertiesFeeds, function(i, feed) {
			var formatStr = feed.label.formatString;
			fmtStr = "";
			if (isCurrency) {
				if (formatStr === 'CURR') {
					fmtStr = 'CURR/' + minValCurr.toString() + "/";// + maxScaleValueCurr.toString(); //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
				} else {
					fmtStr = 'axisFormatter/' + minValCurr.toString() + "/";// + maxScaleValueCurr.toString(); //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
				}
			} else {
				fmtStr = 'axisFormatter/' + minValue.toString() + "/";// + maxScaleValue.toString(); //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
			}
			feed.label.formatString = fmtStr;
			
		});
		
		if (chartType == "vertical_bullet") {
			oVizProperties["valueAxis"] = {
				title:{
					visible: bHideAxisTitle ? false : true
				},
				label:{
					formatString: fmtStr
				}
			};
		}

		var finalMinValue = "";
		var donutFmtStr = "";
		if (isCurrency) {
			finalMinValue = minValCurr.toString();
			donutFmtStr = 'CURR/' + minValCurr.toString() + "/";
		} else {
			finalMinValue = minValue.toString();
			donutFmtStr = 'axisFormatter/' + minValue.toString() + "/";
		}
		
		if (chartType === "donut") {
			oVizProperties.plotArea.dataLabel.formatString = donutFmtStr;
			if (oVizProperties.plotArea.dataLabel.type === "percentage") {
				oVizProperties.plotArea.dataLabel.formatString = "0.0%/" + finalMinValue + "/";
			}
		}
		
		this.checkRolesForProperty(aQueuedDimensions, config, "dimension");
		this.checkRolesForProperty(aQueuedMeasures, config, "measure");

		vizFrame.setVizProperties(oVizProperties);
	};

	/*sap.ovp.cards.charts.VizAnnotationManager.setChartScaleTitle = function(vizFrame,vizData,handler,chartTitle) {
		var oCardsModel, entityTypeObject, chartAnno, chartContext;
		var aMeasures;
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		var unitKey = self.constants.UNIT_KEY;
        var unitKey_v4_isoCurrency = self.constants.UNIT_KEY_V4_ISOCurrency; //as part of supporting V4 annotation
        var unitKey_v4_unit = self.constants.UNIT_KEY_V4_Unit; //as part of supporting V4 annotation

		//var self = sap.ovp.cards.charts.VizAnnotationManager;
		
		if (!(oCardsModel = vizFrame.getModel('ovpCardProperties'))) {
			jQuery.sap.log.error(self.errorMessages.CARD_ERROR + "in " + self.errorMessages.CARD_CONFIG +
					self.errorMessages.NO_CARD_MODEL);
			return;
		}
		
		var dataModel = vizFrame.getModel();
		var entitySet = oCardsModel.getProperty("/entitySet");
		if (!dataModel || !entitySet) {
			return;
		}
		entityTypeObject = oCardsModel.getProperty("/entityType");
		if (!entityTypeObject) {
			jQuery.sap.log.error(self.errorMessages.CARD_ANNO_ERROR + "in " + self.errorMessages.CARD_ANNO);
			return;
		}
		var oMetadata = self.getMetadata(dataModel, entitySet);
		chartAnno = oCardsModel.getProperty("/chartAnnotationPath");
		if (!chartAnno || !(chartContext = entityTypeObject[chartAnno])) {
			jQuery.sap.log.error(self.errorMessages.CARD_ANNO_ERROR + "in " + self.errorMessages.CARD_ANNO);
			return;
		}
		
		if (!(aMeasures = chartContext.MeasureAttributes) ||
				!aMeasures.length) {
			jQuery.sap.log.error(self.errorMessages.CHART_ANNO_ERROR + "in " + self.errorMessages.CHART_ANNO + " " +
					self.errorMessages.MEASURES_MANDATORY);
			return;
		}
		
		var result = vizData ? vizData.results : null;
		var property, unitType = "", unitArr = [];
		var isUnitSame = true;
		var feedMeasures = [];
		
		var feeds = vizFrame.getFeeds();
		
		jQuery.each(feeds, function(i, feed){
			if (feed.getType() === "Measure") {
				feedMeasures = feedMeasures.concat(feed.getValues());
			}
		});
		
		var scaleUnit = "";
		
		if (result) {
			jQuery.each(aMeasures, function(i, m){
				var feedName = "";
				property = m.Measure.PropertyPath;
                if (oMetadata && oMetadata[property]) {
                    if (oMetadata[property][self.constants.LABEL_KEY_V4]) { //as part of supporting V4 annotation
                        feedName = oMetadata[property][self.constants.LABEL_KEY_V4].String ? oMetadata[property][self.constants.LABEL_KEY_V4].String : oMetadata[property][self.constants.LABEL_KEY_V4].Path;
                    } else if (oMetadata[property][self.constants.LABEL_KEY]) {
                        feedName = oMetadata[property][self.constants.LABEL_KEY];
                    } else if (property) {
                        feedName = property;
                    }
                }
                if (jQuery.inArray(feedName, feedMeasures) != -1) {
                    if (oMetadata && oMetadata[property]) {
                        var unitCode;
                        // if (unitCode && oMetadata[unitCode] && oMetadata[currCode][semanticKey] === currencyCode) {
                        if (oMetadata[property][unitKey_v4_isoCurrency]) { //as part of supporting V4 annotation
                            unitCode = oMetadata[property][unitKey_v4_isoCurrency].Path ? oMetadata[property][unitKey_v4_isoCurrency].Path : oMetadata[property][unitKey_v4_isoCurrency].String;
                        } else if (oMetadata[property][unitKey_v4_unit]) {
                            unitCode = oMetadata[property][unitKey_v4_unit].Path ? oMetadata[property][unitKey_v4_unit].Path : oMetadata[property][unitKey_v4_unit].String;
                        } else if (oMetadata[property][unitKey]) {
                            unitCode = oMetadata[property][unitKey];
                        }
                        if (unitCode && oMetadata[unitCode] ) {
							for (var i = 0; i < result.length; i++) {
								var objData = result[i];
								if (isUnitSame){
									if (unitType && objData[unitCode] && (objData[unitCode] != "" ) && (unitType != "") && (unitType != objData[unitCode]) ) {
										isUnitSame = false;
									}
								}
								unitType = objData[unitCode];
								if (unitType && unitType != "" ) {
									var unitObj = {};
									unitObj.name = feedName;
									unitObj.value = unitType;
									unitArr.push(unitObj);
									break;
								}
							}
						}
					}
				}
				
			});
		}
		
		var oVizProperties = vizFrame.getVizProperties();
		var chartUnitTitleTxt = "";
		if (handler) {
			scaleUnit = handler.getScale();
		}
		if (isUnitSame) {
			if (isNaN(Number(scaleUnit)) && scaleUnit != undefined) {
				if (unitType != "") {
					chartUnitTitleTxt = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("IN",[scaleUnit,unitType]);
				} else {
					chartUnitTitleTxt = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("IN_NO_SCALE",[scaleUnit]);
				}
			} else if (unitType != "") {
				chartUnitTitleTxt = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("IN_NO_SCALE",[unitType]);
			}
			if (chartTitle) {
				chartTitle.setText(chartUnitTitleTxt);
				chartTitle.data("aria-label",chartUnitTitleTxt,true);
			}
		} else if (!isUnitSame) {
			jQuery.each(oVizProperties, function(i, vizProps) {
				if (vizProps && vizProps.title) {
					var axisTitle = vizProps.title.text;
					for (var i = 0; i < unitArr.length; i++) {
						if (unitArr[i].name === axisTitle ) {
							var axisStr = "";
							if (isNaN(Number(scaleUnit)) && scaleUnit != undefined) {
								if (unitType != "") {
									axisStr = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("AXES_TITLE",[axisTitle,scaleUnit,unitArr[i].value]);
								} else {
									axisStr = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("AXES_TITLE_NO_SCALE",[scaleUnit]);
								}
							} else if (unitType != "") {
								axisStr = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("AXES_TITLE_NO_SCALE",[axisTitle,unitArr[i].value]);
							}
							
							vizProps.title = {
									text:axisStr
							};
						}
					}
				}
			});
			vizFrame.setVizProperties(oVizProperties);
		} 
	};
*/
	/*
	 * Get the (cached) OData metadata information.
	 */
	sap.ovp.cards.charts.VizAnnotationManager.getMetadata = function(model, entitySet) {
		var map = this.cacheODataMetadata(model);
		if (!map) {
			return undefined;
		}
		return map[entitySet];
	};

	sap.ovp.cards.charts.VizAnnotationManager.setFormattedChartTitle  = function(measureArr,dimensionArr,chartTitle) {
		var txt = "", measureStr = "", dimensionStr = "";
		if (chartTitle) {
			txt = chartTitle.getText();
		}
		
		if (measureArr && (measureArr.length > 1)) {
			for (var i = 0; i < measureArr.length - 1; i++) {
				if (measureStr != "") {
					measureStr += ", ";
				}
				measureStr += measureArr[i];
			}
			measureStr = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("MEAS_DIM_TITLE",[measureStr, measureArr[i]]);
		} else if (measureArr) {
			measureStr = measureArr[0];
		}
		
		if (dimensionArr && (dimensionArr.length > 1) ) {
			for (var i = 0; i < dimensionArr.length - 1; i++) {
				if (dimensionStr != "") {
					dimensionStr += ", ";
				}
				dimensionStr += dimensionArr[i];
			}
			dimensionStr = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("MEAS_DIM_TITLE",[dimensionStr, dimensionArr[i]]);
		} else if (dimensionArr) {
			dimensionStr = dimensionArr[0];
		}
		
		if (chartTitle && (txt == "")) {
			txt = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("NO_CHART_TITLE",[measureStr,dimensionStr]); 
			chartTitle.setText(txt);
			chartTitle.data("aria-label",txt,true);
		}
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.getScaleUnit  = function(maxScaleValue,isCurrency) {
//	sap.ovp.cards.charts.VizAnnotationManager.getScaleUnit  = function(maxScaleValue) {
		var num = 1;
		var scaledNum;
		if (isCurrency) {
			var currencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance(
					{style: 'short',
						currencyCode: false,
						shortRefNumber: maxScaleValue
					}
				);
			scaledNum = currencyFormat.format(Number(num));
		} else {
			var numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance(
				{style: 'short',
						shortRefNumber: maxScaleValue
				}
			);
			scaledNum = numberFormat.format(Number(num));
		}
		
		var scaleUnit = scaledNum.slice(-1);
		return scaleUnit;
	};

	/*
	 * Cache OData metadata information with key as UI5 ODataModel id.
	 */
	sap.ovp.cards.charts.VizAnnotationManager.cacheODataMetadata  = function(model) {
		var self = sap.ovp.cards.charts.VizAnnotationManager;
		if (model){
			if (!jQuery.sap.getObject("sap.ovp.cards.charts.cachedMetaModel")) {
				sap.ovp.cards.charts.cachedMetaModel = {};
			}
		var map = sap.ovp.cards.charts.cachedMetaModel[model.getId()];
		if (!map) {
			var metaModel = model.getMetaModel();
			map = {};
			var container = metaModel.getODataEntityContainer();
			jQuery.each(container.entitySet, function(anIndex,entitySet) {
				var entityType = metaModel.getODataEntityType(entitySet.entityType);
				var entitysetMap = {};
				jQuery.each(entityType.property,function(propertyIndex,property) {
					entitysetMap[property.name] = property;
				});
				map[entitySet.name] = entitysetMap;
			});
			sap.ovp.cards.charts.cachedMetaModel[model.getId()] = map;
		}
		return map;
		} else {
			jQuery.sap.log.error(self.errorMessages.CARD_ERROR + self.errorMessages.CACHING_ERROR );
		}
	};
	sap.ovp.cards.charts.VizAnnotationManager.getSelectedDataPoint = function(vizFrame, controller) {


		vizFrame.attachSelectData(function(oEvent){

			var self = sap.ovp.cards.charts.VizAnnotationManager;
			var oCardsModel = vizFrame.getModel('ovpCardProperties');
			var dataModel = vizFrame.getModel();
			var entitySet = oCardsModel.getProperty("/entitySet");
			var oMetadata = self.getMetadata(dataModel, entitySet);			
			var dimensionArrayNames = [], dimensions = [];
			var finalDimensions = {};
			var dimensionsArr = vizFrame.getDataset().getDimensions();
			var contextNumber;

			for (var i = 0; i < dimensionsArr.length; i++){
				dimensionArrayNames.push(dimensionsArr[i].getName());
			}

			var allData = jQuery.map(vizFrame.getDataset().getBinding("data").getCurrentContexts(), function(x) {return x.getObject();});

			if (oEvent.getParameter("data") && oEvent.getParameter("data")[0] && oEvent.getParameter("data")[0].data){
				
				contextNumber = oEvent.getParameter("data")[0].data._context_row_number;
				var oNavigationField = controller.getEntityNavigationEntries(oContext)[0];
				var oContext = vizFrame.getDataset().getBinding("data").getContexts()[contextNumber];
				if (allData[contextNumber].$isOthers && allData[contextNumber].$isOthers == true) {
					var donutIntent = {$isOthers : true};
					var payLoad = {getObject : function(){return donutIntent;}};
                    if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(controller)) {
                        sap.ovp.cards.CommonUtils.onContentClicked(payLoad);
                    } else {
                        if (oNavigationField) {
                            controller.doNavigation(payLoad, oNavigationField);
                        }
                    }
				} else {
				dimensions = Object.keys(oEvent.getParameter("data")[0].data);

				for (var j = 0; j < dimensionArrayNames.length; j++){
					for (var k = 0; k < dimensions.length; k++){
						if (dimensionArrayNames[j] == dimensions[k]){ 
							for (var key in oMetadata) {
								if (oMetadata.hasOwnProperty(key)) {
									var propertyName = oMetadata[key][self.constants.LABEL_KEY] || oMetadata[key][self.constants.NAME_KEY] || oMetadata[key][self.constants.NAME_CAP_KEY];
									if (propertyName == dimensions[k]) {
										finalDimensions[key] = allData[contextNumber][key];
									}
								}
							}
						}
					}
				}
				var payLoad = {getObject : function(){return finalDimensions;}};

                if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(controller)) {
                    sap.ovp.cards.CommonUtils.onContentClicked(payLoad);
                } else {
                    if (oNavigationField) {
                        controller.doNavigation(payLoad, oNavigationField);
                    }
                }
			}
			}
		});
	};
	sap.ovp.cards.charts.VizAnnotationManager.checkBubbleChart = function(chartType) {
		if (chartType.EnumMember.endsWith("Bubble")) {
			return true;
		} else {
			return false;
		}
	};
	sap.ovp.cards.charts.VizAnnotationManager.dimensionAttrCheck = function(dimensions) {
		var ret = false;
		var self = sap.ovp.cards.charts.VizAnnotationManager; 
		if (!dimensions ||
				dimensions.constructor != Array ||
				dimensions.length < 1 ||
				dimensions[0].constructor != Object ||
				!dimensions[0].Dimension ||
				!dimensions[0].Dimension.PropertyPath) {
					jQuery.sap.log.error(self.errorMessages.CHART_ANNO_ERROR + "in " + self.errorMessages.CHART_ANNO + " " +
					self.errorMessages.DIMENSIONS_MANDATORY);
			return ret;
		}
		ret = true;
		return ret;
	};
	sap.ovp.cards.charts.VizAnnotationManager.measureAttrCheck = function(measures) {
		var ret = false;
		var self = sap.ovp.cards.charts.VizAnnotationManager; 
		if (!measures ||
				measures.constructor != Array ||
				measures.length < 1 ||
				measures[0].constructor != Object ||
				!measures[0].Measure ||
				!measures[0].Measure.PropertyPath) {
			jQuery.sap.log.error(self.errorMessages.CHART_ANNO_ERROR + "in " + self.errorMessages.CHART_ANNO + " " +
					self.errorMessages.MEASURES_MANDATORY);
			return ret;
		}
		ret = true;
		return ret;
	};
	sap.ovp.cards.charts.VizAnnotationManager.getEntitySet = function(oEntitySet) {
		return oEntitySet.name;
	};
	
	sap.ovp.cards.charts.VizAnnotationManager.getAnnotationQualifier = function(annotationPath) {
		if ( annotationPath && annotationPath.indexOf("#") != -1 ) {
			var tokens = annotationPath.split("#");
			if ( tokens.length > 1 ) {
				return tokens[1];
			}
		}
		return "";
	};

    /*
     * Method called upon resize of analytical card where the calculation is done to fetch more data-point
     * @method reprioritizeContent
     * @param {Object} newCardLayout - Card layout object which contains all resizing properties
     * @param {Object} vizFrame - viz object
     */
    sap.ovp.cards.charts.VizAnnotationManager.reprioritizeContent = function (newCardLayout, vizFrame) {
        var oCardsModel = vizFrame.getModel('ovpCardProperties');
        var cardPropObject = sap.ovp.cards.charts.VizAnnotationManager.getMaxItems(vizFrame);
        var maxItems = +cardPropObject.itemsLength;
        var dataStep = +oCardsModel.getProperty("/dataStep");
        if (maxItems && dataStep) {
            var colSpanOffset = newCardLayout.colSpan - 1;
            if (colSpanOffset >= 0) {
                maxItems += dataStep * colSpanOffset;
                sap.ovp.cards.charts.VizAnnotationManager.updateBindingForAnalyticalCard(vizFrame, maxItems);
            }
        }
    };

    /*
     * Method to calculate the initial items mentioned in presentation annotation and data step
     * @method getMaxItems
     * @param {Object} vizFrame - viz object
     * @return {Object} object - object containing maxitems and data step
     */
    sap.ovp.cards.charts.VizAnnotationManager.getMaxItems = function (vizFrame) {
        var oCardsModel = vizFrame.getModel('ovpCardProperties');
        var entitySet = oCardsModel.getProperty("/entitySet");
        var entityTypeObject = oCardsModel.getProperty("/entityType");
        var presentationAnno = oCardsModel.getProperty("/presentationAnnotationPath");
        var presentationContext = entityTypeObject.hasOwnProperty(presentationAnno) && entityTypeObject[presentationAnno];
        var maxItemTerm = presentationContext && presentationContext.MaxItems;
        if (maxItemTerm) {
            var maxItems = maxItemTerm.Int32 ? maxItemTerm.Int32 : maxItemTerm.Int;
            return {
                itemsLength: +maxItems,
                dataStep: +oCardsModel.getProperty("/dataStep")
            };
        }
    };

    /*
     * Method to update the binding after resize if required
     * @method updateBindingForAnalyticalCard
     * @param {Object} vizFrame - viz object
     * @param {Integer} maxItems - no of datat-points to fetch
     */
    sap.ovp.cards.charts.VizAnnotationManager.updateBindingForAnalyticalCard = function (vizFrame, maxItems) {
        var newAggrBinding, newBinding = {}, finalMeasures = [];
        var chartType = vizFrame.getVizType();
        var oCardsModel = vizFrame.getModel('ovpCardProperties');
        var entityTypeObject = oCardsModel.getProperty("/entityType");
        var chartAnno = oCardsModel.getProperty("/chartAnnotationPath");
        var chartContext = entityTypeObject[chartAnno];
        var vizFrameParent = vizFrame.getParent();
        var dataBinding = vizFrameParent.getBinding("data");
        newBinding.path = dataBinding.getPath();
        newBinding.parameters = {};
        newBinding.parameters.select = dataBinding.mParameters.select;
        newBinding.filters = dataBinding.aApplicationFilters;
        newBinding.sorter = dataBinding.aSorters;
        newBinding.length = ( chartType === "donut") ? maxItems + 1 : maxItems;//(count-1)== maxItems? maxItems+1:maxItems;
        newBinding.template = new sap.ui.core.Element();
        vizFrameParent.bindAggregation("data", newBinding);
        if (chartType === "donut") {
            jQuery.each(chartContext.MeasureAttributes, function (i, m) {
                finalMeasures.push(m.Measure.PropertyPath);
            });
            newAggrBinding = {};
            newAggrBinding.path = dataBinding.getPath();
            newAggrBinding.parameters = {};
            newAggrBinding.parameters.select = finalMeasures.join(",");
            newAggrBinding.filters = dataBinding.aApplicationFilters;
            newAggrBinding.sorter = dataBinding.aSorters;
            newAggrBinding.length = 1;//(count-1)== maxItems? maxItems+1:maxItems;
            newAggrBinding.template = new sap.ui.core.Element();
            vizFrameParent.bindAggregation("aggregateData", newAggrBinding);
        }
        vizFrameParent.updateBindingContext();
    };

}());