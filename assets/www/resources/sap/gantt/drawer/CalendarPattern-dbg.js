/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Core", "sap/gantt/misc/Format","sap/ui/core/format/DateFormat", "sap/gantt/drawer/Drawer", "sap/gantt/misc/Utility",
	// 3rd party lib
	"sap/ui/thirdparty/d3"
], function (Core, Format, DateFormat, Drawer, Utility) {
	"use strict";

	var CalendarPattern = Drawer.extend("sap.gantt.drawer.CalendarPattern");

	/*
	 * aSvgNode: svg body of parent node
	 * sParentId: parent id of the paint server defs
	 * 
	 */
	CalendarPattern.prototype.drawSvg = function (aSvgBodyNode, sParentId, oPatternDef, oStatusSet, iBaseRowHeight) {
		// temp save config
		this._oStatusSet = oStatusSet;
		
		if (oPatternDef && oPatternDef.getDefNode() && oPatternDef.getDefNode().defNodes) {
			var defNode = oPatternDef.getDefNode();
			var defId = sParentId + "-calendardefs";
			var sWrapDefSelector = Utility.attributeEqualSelector("id", defId);
			if (!(d3.select(sWrapDefSelector).empty())) {
				jQuery(sWrapDefSelector).remove();
			}
			var width = this._oStatusSet.aViewBoundary[1] - this._oStatusSet.aViewBoundary[0];
			if (width < 0) {
				width = this._oStatusSet.aViewBoundary[0] - this._oStatusSet.aViewBoundary[1];
			}
			var patternProp = {height: iBaseRowHeight, width: width};
			var patternDefG = aSvgBodyNode.select(sWrapDefSelector);
			if (patternDefG.empty()){
				patternDefG = aSvgBodyNode.insert("defs",":first-child")
									.attr("id", defId);
			}
			var patGData = patternDefG.selectAll(".calendarPattern")
									.data(defNode.defNodes);
			patGData.enter().append("pattern")
							.attr("class", "calendarPattern")
							.attr("id", function(d) {
								return d.id;
							})
							.attr("patternUnits", "userSpaceOnUse")
							.attr("x", 0)
							.attr("y", 0)
							.attr("width", patternProp.width)
							.attr("height", patternProp.height);
			patGData.exit().remove();
			
			var patternRect = patGData.selectAll("rect")
									.data(function() { 
											return this.parentNode.__data__.timeIntervals; 
										});
			patternRect.enter().append("rect");
			patternRect.attr("x",function(d) {
							return d.x;	
						})
						.attr("y", function(d) {
							return d.y;	
						})
						.attr("width", function(d) {
							return d.width;	
						})
						.attr("height", patternProp.height)
						.attr("fill", function(d){
							return d.fill;
						});
			patternRect.exit().remove();
		}
	};

	return CalendarPattern;
}, true);
