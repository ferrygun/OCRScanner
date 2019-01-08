/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/drawer/Drawer", 
	// 3rd party lib
	"sap/ui/thirdparty/d3"
], function (Drawer, Utility, Core) {
	"use strict";

	var ExpandedBackground = Drawer.extend("sap.gantt.drawer.ExpandedBackground");
	
	ExpandedBackground.prototype.drawSvg = function (aSvg, aData, oChartSchemeBackgroundConfig) {


		if (!aData){
			return null;
		}

		var aExpandedData = [];

		for (var i = 0; i < aData.length; i++){
			if ((aData[i].index && aData[i].index !== 0) || oChartSchemeBackgroundConfig.hasOwnProperty(aData[i].chartScheme)){
				aExpandedData.push(aData[i]);
			}
		}

		var aBackgroundSvg = aSvg.selectAll(".sapGanttChartRowBackground").remove();
		aBackgroundSvg = aSvg.insert("g", ":first-child")
			.classed("sapGanttChartRowBackground", true);
		

		var aSvgRowG = aBackgroundSvg.selectAll(".expandedRow").data(aExpandedData);
		aSvgRowG.enter().append("g").classed("expandedRow",true);
		aSvgRowG.exit().remove();

		// draw
		if (!aSvgRowG.empty()) {
			var iDocumentWidth = jQuery(aSvg.node()).width();
			this._drawExpandedBackground(aSvg, iDocumentWidth, oChartSchemeBackgroundConfig);
		}
	};

	ExpandedBackground.prototype._drawExpandedBackground = function (aSvg, iWidth, oChartSchemeBackgroundConfig) {
		aSvg.selectAll(".expandedRow").selectAll("rect").remove();
		aSvg.selectAll(".expandedRow").append("rect")
			.attr("x", function(d) {
				return 0;
			})
			.attr("y", function(d) {
				return d.y;
			})
			.attr("height", function(d) {
				// -1 just for show parent container border 
				return d.rowHeight - 1;
			})
			.attr("width", function(d) {
				// -1 just for show parent container border
				return "100%";
			})
			.attr("class", function(d) {
				var sBackgroundClass = oChartSchemeBackgroundConfig[d.chartScheme];
				if (sBackgroundClass && sBackgroundClass !== ""){
					return sBackgroundClass;
				} else {
					return "sapGanttExpandChartCntBG";
				}
			});

		aSvg.selectAll(".expandedRow").selectAll("path").remove();
		aSvg.selectAll(".expandedRow").append("path").classed("sapGanttExpandChartLine",true)
			.attr("d", function(d){
				return "M0 " + (d.y - 1) + " H" + (iWidth - 1);
			});
		
	};

	return ExpandedBackground;
},true);
