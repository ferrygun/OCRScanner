/**
 * @fileOverview Miscellaneous utility functions for legacy cards.
 * See VizAnnotationManager.js for generic card methods.
 * This file can be safely deleted when legacy cards deprecate.
 */

(function () {
	"use strict";
	jQuery.sap.declare("sap.ovp.cards.charts.Utils");


	sap.ovp.cards.charts.Utils = sap.ovp.cards.charts.Utils || {};


	/* All constants feature here */
	sap.ovp.cards.charts.Utils.constants = {
			/* qualifiers for annotation terms */
			CHART_QUALIFIER_KEY: "chartAnnotationPath",
			SELVAR_QUALIFIER_KEY: "selectionAnnotationPath",
			PREVAR_QUALIFIER_KEY: "presentationAnnotationPath",
			/* DEBUG MESSAGES */
			ERROR_NO_CHART: "Analytic cards require valid \"chartAnnotationPath\" " +
					"configured in manifest.json",
			LABEL_KEY: "sap:label",
			TEXT_KEY: "sap:text",
			TYPE_KEY:"type"
	};

	/* retrieve qualifier from iContext */
	sap.ovp.cards.charts.Utils.getQualifier = function (iContext, annoTerm) {
		/* see sap.ovp.cards.charts.Utils.constants for legal values of annoTerm */
		if (!annoTerm) {
			return "";
		}
		var settingsModel = iContext.getSetting('ovpCardProperties');
		if (!settingsModel) {
			return "";
		}
		var oSettings = settingsModel.oData;
		if (!oSettings) {
			return "";
		}
		var fullQualifier = oSettings && oSettings[annoTerm] ? oSettings[annoTerm] : "";
		return fullQualifier === "" ? "" : fullQualifier.split("#")[1];
	};

	/************************ FORMATTERS ************************/

	sap.ovp.cards.charts.Utils.wrapInBraces = function(whateverNeedsToBeInBraces) {
		return "{" + whateverNeedsToBeInBraces + "}";
	};

	sap.ovp.cards.charts.Utils.getSapLabel = function(property) {
		var entityTypeObject = this.getModel('ovpCardProperties').getProperty("/entityType");
		var label = sap.ovp.cards.charts.Utils.getAllColumnLabels(entityTypeObject)[property];
		return label ? label : property;
	};

	sap.ovp.cards.charts.Utils.formDimensionPath = function(dimension) {
		var ret = "{" + dimension + "}";
		var entityTypeObject = this.getModel('ovpCardProperties').getProperty("/entityType");
		if (!entityTypeObject) {
			return ret;
		}
		var edmTypes = sap.ovp.cards.charts.Utils.getEdmTypeOfAll(entityTypeObject);
		if (!edmTypes || !edmTypes[dimension]) {
			return ret;
		}
		var type = edmTypes[dimension];
		if (type == "Edm.DateTime") {
			return "{path:'" + dimension + "', formatter: 'sap.ovp.cards.charts.VizAnnotationManager.returnDateFormat'}";
		}
		var columnTexts = sap.ovp.cards.charts.Utils.getAllColumnTexts(entityTypeObject);
		if (!columnTexts) {
			return ret;
		}
		ret = "{" + (columnTexts[dimension] || dimension) + "}";
		return ret;
	};


	/************************ METADATA PARSERS ************************/

	/* Returns the set of all properties in the metadata */
	sap.ovp.cards.charts.Utils.getAllColumnProperties = function(prop, entityTypeObject) {
		var finalObject = {};
		var properties = entityTypeObject.property;
		for (var i = 0, len = properties.length; i < len; i++) {
			if (properties[i].hasOwnProperty(prop) && prop == "com.sap.vocabularies.Common.v1.Label") {
				finalObject[properties[i].name] = properties[i][prop].String;
			} else if (properties[i].hasOwnProperty(prop)) {
				finalObject[properties[i].name] = properties[i][prop];
			} else {
				finalObject[properties[i].name] = properties[i].name;
			}
		}
		return finalObject;
	};

	/* Returns column name that contains the sap:label(s) for all properties in the metadata*/
	sap.ovp.cards.charts.Utils.getAllColumnLabels = function(entityTypeObject) {
		return sap.ovp.cards.charts.Utils.getAllColumnProperties("com.sap.vocabularies.Common.v1.Label", entityTypeObject);
	};


	/* Returns column name that contains the sap:text(s) for all properties in the metadata*/
	sap.ovp.cards.charts.Utils.getAllColumnTexts = function(entityTypeObject) {
		return sap.ovp.cards.charts.Utils.getAllColumnProperties("sap:text", entityTypeObject);
	};


	/* get EdmType of all properties from $metadata */
	sap.ovp.cards.charts.Utils.getEdmTypeOfAll = function(entityTypeObject) {
		return sap.ovp.cards.charts.Utils.getAllColumnProperties("type", entityTypeObject);
	};


	/************************ Line Chart functions ************************/

	sap.ovp.cards.charts.Utils.LineChart = sap.ovp.cards.charts.Utils.LineChart || {};
	sap.ovp.cards.charts.Utils.LineChart.categoryAxisFeedList = {};

	sap.ovp.cards.charts.Utils.LineChart.getVizProperties = function(iContext, dimensions, measures) {
		var rawValueAxisTitles = sap.ovp.cards.charts.Utils.LineChart.getValueAxisFeed(iContext, measures).split(",");
		var rawCategoryAxisTitles = sap.ovp.cards.charts.Utils.LineChart.getCategoryAxisFeed(iContext, dimensions).split(",");
		var valueAxisTitles = [];
		jQuery.each(rawValueAxisTitles, function(i, m){
			valueAxisTitles.push(m);
		});
		var categoryAxisTitles = [];
		jQuery.each(rawCategoryAxisTitles, function(i, d){
			categoryAxisTitles.push(d);
		});
		var bDatapointNavigation = true;
		var dNav = iContext.getSetting("ovpCardProperties").getProperty("/navigation");
		if (dNav == "chartNav") {
			bDatapointNavigation = false;
		}
		var bDatapointNavigation = bDatapointNavigation ? false : true;
		/*
		 //Readable version for debugging
		 //eslint can't multiline strings
		 return "{\
				valueAxis:{\
					title:{\
						visible:true,\
						text: '" + valueAxisTitles.join(",") + "'\
					},\
					label:{\
						formatString:'axisFormatter'\
					}\
				},\
				categoryAxis:{\
					title:{\
						visible:true,\
						text: '" + categoryAxisTitles.join(",") + "'\
					},\
					label:{\
						formatString:'axisFormatter'\
					}\
				},\
				legend: {\
					isScrollable: false\
				},\
				title: {\
					visible: false\
				},\
				interaction:{\
					noninteractiveMode: false,\
					selectability: {\
						legendSelection: false,\
						axisLabelSelection: false,\
						mode: 'EXCLUSIVE',\
						plotLassoSelection: false,\
						plotStdSelection: true\
					}\
				}\
			}";
		*/
		return "{ valueAxis:{  layout: { maxWidth : 0.4 }, title:{   visible:false,   text: '" + valueAxisTitles.join(",") + "'  },  label:{   formatString:'axisFormatter'  } }, categoryAxis:{  title:{   visible:false,   text: '" + categoryAxisTitles.join(",") + "'  },  label:{   formatString:'axisFormatter'  } }, legend: {  isScrollable: false }, title: {  visible: false }, general: { groupData: false }, interaction:{  noninteractiveMode: " + bDatapointNavigation + ",  selectability: {   legendSelection: false,   axisLabelSelection: false,   mode: 'EXCLUSIVE',   plotLassoSelection: false,   plotStdSelection: true  }, zoom:{   enablement: 'disabled'} } }";
	};
	sap.ovp.cards.charts.Utils.LineChart.getVizProperties.requiresIContext = true;

	sap.ovp.cards.charts.Utils.LineChart.getValueAxisFeed = function(iContext, measures) {
		var entityTypeObject = iContext.getSetting('ovpCardProperties').getProperty("/entityType");
		if (!entityTypeObject) {
			return "";
		}
		var columnLabels = sap.ovp.cards.charts.Utils.getAllColumnLabels(entityTypeObject);
		var ret = [];
		jQuery.each(measures, function(i, m){
			ret.push(columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath);
		});
		return ret.join(",");
	};
	sap.ovp.cards.charts.Utils.LineChart.getValueAxisFeed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.LineChart.getCategoryAxisFeed = function(iContext, dimensions) {
		var entityTypeObject = iContext.getSetting('ovpCardProperties').getProperty("/entityType");
		if (!entityTypeObject) {
			return "";
		}
		var columnLabels = sap.ovp.cards.charts.Utils.getAllColumnLabels(entityTypeObject);
		var ret = [];
		var qualifier;
		var feedValue;
		jQuery.each(dimensions, function(i, d){
			if (d.Role.EnumMember.split("/")[1] === "Category") {
				feedValue = columnLabels[d.Dimension.PropertyPath];
				ret.push(feedValue ? feedValue : d.Dimension.PropertyPath);
			}
		});
		/*
		 * If no dimensions are given as category, pick first dimension as category
		 * (see Software Design Description UI5 Chart Control 3.1.2.2.1.1)
		 */
		if (ret.length < 1) {
			feedValue = columnLabels[dimensions[0].Dimension.PropertyPath];
			ret.push(feedValue ? feedValue : dimensions[0].Dimension.PropertyPath);
		}
		qualifier = sap.ovp.cards.charts.Utils.getQualifier(iContext,
				sap.ovp.cards.charts.Utils.constants.CHART_QUALIFIER_KEY);
		sap.ovp.cards.charts.Utils.LineChart.categoryAxisFeedList[qualifier] = ret;
		return ret.join(",");
	};
	sap.ovp.cards.charts.Utils.LineChart.getCategoryAxisFeed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.LineChart.getColorFeed = function(iContext, dimensions) {
		var ret = [];
		var qualifier;
		var entityTypeObject = iContext.getSetting('ovpCardProperties').getProperty("/entityType");
		if (!entityTypeObject) {
			return "";
		}
		var columnLabels = sap.ovp.cards.charts.Utils.getAllColumnLabels(entityTypeObject);
		var feedValue;
		jQuery.each(dimensions, function(i, d){
			if (d.Role.EnumMember.split("/")[1] === "Series") {
				feedValue = columnLabels[d.Dimension.PropertyPath];
				ret.push(feedValue ? feedValue : d.Dimension.PropertyPath);
			}
		});
		/*
		 * If the dimensions is picked up for category feed as no category is given in the annotation,
		 * remove it from color feed.
		 * (see Software Design Description UI5 Chart Control 3.1.2.2.1.1)
		 */
		qualifier = sap.ovp.cards.charts.Utils.getQualifier(iContext,
				sap.ovp.cards.charts.Utils.constants.CHART_QUALIFIER_KEY);
		ret = jQuery.grep(ret, function(value) {
			if (!sap.ovp.cards.charts.Utils.LineChart.categoryAxisFeedList[qualifier]) {
				return true;
			}
			return value != sap.ovp.cards.charts.Utils.LineChart.categoryAxisFeedList[qualifier][0];
		});
		return ret.join(",");
	};
	sap.ovp.cards.charts.Utils.LineChart.getColorFeed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.LineChart.testColorFeed = function(iContext, dimensions) {
		return sap.ovp.cards.charts.Utils.LineChart.getColorFeed(iContext, dimensions) !== "";
	};
	sap.ovp.cards.charts.Utils.LineChart.testColorFeed.requiresIContext = true;



	/************************ Bubble Chart Functions ************************/

	sap.ovp.cards.charts.Utils.BubbleChart = sap.ovp.cards.charts.Utils.BubbleChart || {};

	sap.ovp.cards.charts.Utils.BubbleChart.getVizProperties = function(iContext, dimensions, measures) {
		var rawValueAxisTitles = sap.ovp.cards.charts.Utils.BubbleChart.getValueAxisFeed(iContext, measures).split(",");
		var rawValueAxis2Titles = sap.ovp.cards.charts.Utils.BubbleChart.getValueAxis2Feed(iContext, measures).split(",");
		var valueAxisTitles = [];
		jQuery.each(rawValueAxisTitles, function(i, m){
			valueAxisTitles.push(m);
		});
		var valueAxis2Titles = [];
		jQuery.each(rawValueAxis2Titles, function(i, m){
			valueAxis2Titles.push(m);
		});
		var bDatapointNavigation = true;
		var dNav = iContext.getSetting("ovpCardProperties").getProperty("/navigation");
		if (dNav == "chartNav") {
			bDatapointNavigation = false;
		}
		var bDatapointNavigation = bDatapointNavigation ? false : true;
		/*
		 //Readable version for debugging
		 //eslint can't multiline strings
		return "{\
				valueAxis:{\
					title:{\
						visible:true,\
						text: '" + valueAxisTitles.join(",") + "'\
					},\
					label:{\
						formatString:'axisFormatter'\
					}\
				},\
				valueAxis2:{\
					title:{\
						visible:true,\
						text: '" + valueAxis2Titles.join(",") + "'\
					},\
					label:{\
						formatString:'axisFormatter'\
					}\
				},\
				categoryAxis:{\
					title:{\
						visible:true\
					},\
					label:{\
						formatString:'axisFormatter'\
					}\
				},\
				legend: {\
					isScrollable: false\
				},\
				title: {\
					visible: false\
				},\
				interaction:{\
					noninteractiveMode: bDatapointNavigation ? false : true,\
					selectability: {\
						legendSelection: false,\
						axisLabelSelection: false,\
						mode: 'EXCLUSIVE',\
						plotLassoSelection: false,\
						plotStdSelection: true\
					}\
				}\
			}";
		*/
		return "{ valueAxis:{  layout: { maxWidth : 0.4 }, title:{ visible:true, text: '" + valueAxisTitles.join(",") + "'  },  label:{ formatString:'axisFormatter'  } }, valueAxis2:{  title:{ visible:true, text: '" + valueAxis2Titles.join(",") + "'  },  label:{ formatString:'axisFormatter'  } }, categoryAxis:{  title:{ visible:true  },  label:{ formatString:'axisFormatter'  } }, legend: {  isScrollable: false }, title: {  visible: false }, interaction:{  noninteractiveMode: " + bDatapointNavigation + ",  selectability: { legendSelection: false, axisLabelSelection: false, mode: 'EXCLUSIVE', plotLassoSelection: false, plotStdSelection: true  }, zoom:{   enablement: 'disabled'} } }";
	};
	sap.ovp.cards.charts.Utils.BubbleChart.getVizProperties.requiresIContext = true;

	sap.ovp.cards.charts.Utils.BubbleChart.getMeasurePriorityList = function(iContext, measures) {
		/* (see Software Design Description UI5 Chart Control - Bubble Chart) */
		var ovpCardPropertiesModel;
		if (!iContext ||
				!iContext.getSetting ||
				!(ovpCardPropertiesModel = iContext.getSetting('ovpCardProperties'))) {
			return [""];
		}
		var entityTypeObject = ovpCardPropertiesModel.getProperty("/entityType");
		if (!entityTypeObject) {
			return [""];
		}
		var columnLabels = sap.ovp.cards.charts.Utils.getAllColumnLabels(entityTypeObject);
		var ret = [null, null, null];
		jQuery.each(measures, function(i, m){
			if (m.Role.EnumMember.split("/")[1] === "Axis1") {
				if (ret[0] === null) {
					ret[0] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				} else if (ret[1] === null) {
					ret[1] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				} else if (ret[2] == null) {
					ret[2] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				}
			}
		});
		jQuery.each(measures, function(i, m){
			if (m.Role.EnumMember.split("/")[1] === "Axis2") {
				if (ret[0] === null) {
					ret[0] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				} else if (ret[1] === null) {
					ret[1] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				} else if (ret[2] == null) {
					ret[2] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				}
			}
		});
		jQuery.each(measures, function(i, m){
			if (m.Role.EnumMember.split("/")[1] === "Axis3") {
				if (ret[0] === null) {
					ret[0] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				} else if (ret[1] === null) {
					ret[1] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				} else if (ret[2] == null) {
					ret[2] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
				}
			}
		});
		return ret;
	};
	sap.ovp.cards.charts.Utils.BubbleChart.getMeasurePriorityList.requiresIContext = true;


	sap.ovp.cards.charts.Utils.BubbleChart.getValueAxisFeed = function(iContext, measures) {
		return sap.ovp.cards.charts.Utils.BubbleChart.getMeasurePriorityList(iContext, measures)[0];
	};
	sap.ovp.cards.charts.Utils.BubbleChart.getValueAxisFeed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.BubbleChart.getValueAxis2Feed = function(iContext, measures) {
		return sap.ovp.cards.charts.Utils.BubbleChart.getMeasurePriorityList(iContext, measures)[1];
	};
	sap.ovp.cards.charts.Utils.BubbleChart.getValueAxis2Feed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.BubbleChart.getBubbleWidthFeed = function(iContext, measures) {
		return sap.ovp.cards.charts.Utils.BubbleChart.getMeasurePriorityList(iContext, measures)[2];
	};
	sap.ovp.cards.charts.Utils.BubbleChart.getBubbleWidthFeed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.BubbleChart.getColorFeed = function(iContext, dimensions) {
		var entityTypeObject = iContext.getSetting('ovpCardProperties').getProperty("/entityType");
		if (!entityTypeObject) {
			return "";
		}
		var columnLabels = sap.ovp.cards.charts.Utils.getAllColumnLabels(entityTypeObject);
		var ret = [];
		var feedValue;
		jQuery.each(dimensions, function(i, d){
			if (d.Role.EnumMember.split("/")[1] === "Series") {
				feedValue = columnLabels[d.Dimension.PropertyPath];
				ret.push(feedValue ? feedValue : d.Dimension.PropertyPath);
			}
		});
		return ret.join(",");
	};
	sap.ovp.cards.charts.Utils.BubbleChart.getColorFeed.requiresIContext = true;

	sap.ovp.cards.charts.Utils.BubbleChart.getShapeFeed = function(iContext, dimensions) {
		var entityTypeObject = iContext.getSetting('ovpCardProperties').getProperty("/entityType");
		if (!entityTypeObject) {
			return "";
		}
		var columnLabels = sap.ovp.cards.charts.Utils.getAllColumnLabels(entityTypeObject);
		var ret = [];
		var feedValue;
		jQuery.each(dimensions, function(i, d){
			if (d.Role.EnumMember.split("/")[1] === "Category") {
				feedValue = columnLabels[d.Dimension.PropertyPath];
				ret.push(feedValue ? feedValue : d.Dimension.PropertyPath);
			}
		});
		return ret.join(",");
	};
	sap.ovp.cards.charts.Utils.BubbleChart.getShapeFeed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.BubbleChart.testColorFeed = function(iContext, dimensions) {
		return sap.ovp.cards.charts.Utils.BubbleChart.getColorFeed(iContext, dimensions) !== "";
	};
	sap.ovp.cards.charts.Utils.BubbleChart.testColorFeed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.BubbleChart.testShapeFeed = function(iContext, dimensions) {
		return sap.ovp.cards.charts.Utils.BubbleChart.getShapeFeed(iContext, dimensions) !== "";
	};
	sap.ovp.cards.charts.Utils.BubbleChart.testShapeFeed.requiresIContext = true;


	sap.ovp.cards.charts.Utils.validateMeasuresDimensions = function(vizFrame, type) {
		var measuresArr = null;
		var dimensionsArr = null;
		if (!vizFrame.getDataset()) {
			jQuery.sap.log.error("OVP-AC: " + type + " Card Error: No Dataset defined for chart.");
			return false;
		}
		measuresArr = vizFrame.getDataset().getMeasures();
		dimensionsArr = vizFrame.getDataset().getDimensions();

		switch (type) {
		case "Bubble":
			if (measuresArr.length !== 3 || dimensionsArr.length < 1 ||
					!measuresArr[0].getName() || !measuresArr[1].getName() || !measuresArr[2].getName() ||
					!dimensionsArr[0].getName()) {
				jQuery.sap.log.error("OVP-AC: Bubble Card Error: Enter exactly 3 measures and at least 1 dimension.");
				return false;
			}
			break;

		case "Donut":
			if (measuresArr.length !== 1 || dimensionsArr.length !== 1 ||
					!measuresArr[0].getName() || !dimensionsArr[0].getName()) {
				jQuery.sap.log.error("OVP-AC: Donut Card Error: Enter exactly 1 measure and 1 dimension.");
				return false;
			}
			break;

		case "Line":
			if (measuresArr.length < 1 || dimensionsArr.length < 1 ||
					!measuresArr[0].getName() || !dimensionsArr[0].getName()) {
				jQuery.sap.log.error("OVP-AC: Line Card Error: Configure at least 1 dimensions and 1 measure.");
				return false;
			}
			break;
		}
		return true;
	};
	sap.ovp.cards.charts.Utils.getSortAnnotationCollection = function(dataModel,presentationVariant,entitySet){
		if (presentationVariant && presentationVariant.SortOrder && presentationVariant.SortOrder.Path && presentationVariant.SortOrder.Path.indexOf('@') >= 0){
			 var sSortOrderPath = presentationVariant.SortOrder.Path.split('@')[1]; 
		        var oAnnotationData = dataModel.getServiceAnnotations()[entitySet.entityType];
		        return oAnnotationData[sSortOrderPath];
		}
       return presentationVariant.SortOrder;
};

}());
