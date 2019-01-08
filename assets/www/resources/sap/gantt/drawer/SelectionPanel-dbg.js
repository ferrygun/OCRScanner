/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/drawer/Drawer", "sap/gantt/misc/Utility", "sap/ui/core/Core", "sap/ui/core/IconPool", "sap/ui/Device",
	// 3rd party lib
	"sap/ui/thirdparty/d3"
], function (Drawer, Utility, Core, IconPool, Device) {
	"use strict";

	var SelectionPanel = Drawer.extend("sap.gantt.drawer.SelectionPanel");

	SelectionPanel.prototype.drawSvg = function (aTableSvg, aData, iTableHeaderWidth, oGanttChartWithTable) {

		if (!aData){
			return;
		}

		this._oGanttChartWithTable = oGanttChartWithTable;
		var aExpandedData = [];
		for (var i = 0; i < aData.length; i++){
			if (aData[i].index && aData[i].index !== 0){
				aExpandedData.push(aData[i]);
			}
		}

		var aTableCntPanelG = aTableSvg.selectAll(".sapGanttSelectionPanel");
		if (aTableCntPanelG.empty()){
			aTableCntPanelG = aTableSvg.append("g").classed("sapGanttSelectionPanel",true);
		}

		if (!aTableCntPanelG.empty()) {
			var iTableWidth = $(aTableSvg.node()).width();
			var oChartSchemeBackgroundConfig = oGanttChartWithTable._oGanttChart._composeChartSchemeBackgroundConfig();
			this._drawExpandedBackground(aTableCntPanelG, iTableWidth, iTableHeaderWidth, aExpandedData, oChartSchemeBackgroundConfig);
			this._drawExpandedContent(aTableCntPanelG, iTableWidth,  iTableHeaderWidth, aExpandedData);
		}
	};

	SelectionPanel.prototype._drawExpandedBackground = function (aSvg, iTableWidth, iTableHeaderWidth, aDatas, oChartSchemeBackgroundConfig) {		

		var aHederBGRect = aSvg.selectAll(".sapGanttExpandChartHeader").data(aDatas);
		aHederBGRect.enter().append("rect").classed("sapGanttExpandChartHeader",true);
		aHederBGRect.attr("x",function(){
			return Core.getConfiguration().getRTL() ? iTableWidth - iTableHeaderWidth + 1 : 2;
		})
		.attr("y", function(d) {
			return d.y;
		})
		.attr("height", function(d) {
			// -1 just for show parent container border 
			return d.rowHeight - 1;
		})
		.attr("width", iTableHeaderWidth - 2)
		.attr("class", function(d){
			var sBackgroundClass = oChartSchemeBackgroundConfig ? oChartSchemeBackgroundConfig[d.chartScheme] : undefined;
			if (sBackgroundClass && sBackgroundClass !== ""){
				return "sapGanttExpandChartHeader " + sBackgroundClass;
			} else {
				return "sapGanttExpandChartHeader sapGanttExpandChartHeaderBG";
			}
		});
		aHederBGRect.exit().remove();

		var aCntBGRect = aSvg.selectAll(".sapGanttExpandChartCnt").data(aDatas);
		aCntBGRect.enter().append("rect").classed("sapGanttExpandChartCnt",true);
		aCntBGRect.attr("x", function(){
			return Core.getConfiguration().getRTL() ? 2 : iTableHeaderWidth + 1;
		})
		.attr("y", function(d) {
			return d.y;
		})
		.attr("height", function(d) {
			// -1 just for show parent container border 
			return d.rowHeight - 1;
		})
		.attr("width", iTableWidth - iTableHeaderWidth - 3)
		.attr("class", function(d){
			var sBackgroundClass = oChartSchemeBackgroundConfig? oChartSchemeBackgroundConfig[d.chartScheme] : undefined;
			if (sBackgroundClass && sBackgroundClass !== ""){
				return "sapGanttExpandChartCnt " + sBackgroundClass;
			} else {
				return "sapGanttExpandChartCnt sapGanttExpandChartCntBG";
			}
		});
		aCntBGRect.exit().remove();

		var aBGPath = aSvg.selectAll("path.sapGanttExpandChartLine").data(aDatas);
		aBGPath.enter().append("path").classed("sapGanttExpandChartLine", true);
		aBGPath.attr("d", function(d){
			return "M0 " + (d.y - 1) + " H" + (iTableWidth - 1);
		});
		aBGPath.exit().remove();
	};

	SelectionPanel.prototype._drawExpandedContent = function (aSvg, iTableWidth, iTableHeaderWidth, aDatas) {
		var fGetLevelIndentByShape = this._getLevelIndentByShape;
		var aCntDatas = [];
		for (var i = 0; i < aDatas.length; i++){
			if (aDatas[i].index === 1){
				var aSubContents = [];
				aSubContents.push(aDatas[i]);
				aCntDatas.push(aSubContents);
			}
		}

		aSvg.selectAll("g").remove();
		var aCntG = aSvg.selectAll("g").data(aCntDatas);
		aCntG.enter().append("g").classed("sapGanttExpandChartContent",true);
		aCntG.exit().remove();

		var aCntIcon = aCntG.selectAll(".sapGanttExpandChartIcon").data(function(d){ return d; });
		aCntIcon.enter().append(function(d){
			/* eslint-disable sap-no-element-creation */
			if (IconPool.isIconURI(d.icon)) {
				return document.createElementNS(d3.ns.prefix.svg, "text");
			}
			return document.createElementNS(d3.ns.prefix.svg, "image");
			/* eslint-enable sap-no-element-creation */
		})
		.classed("sapGanttExpandChartIcon", true)
		.classed("iconFont", function(d){
			return IconPool.isIconURI(d.icon);
		})
		.classed("iconImage", function(d){
			return !(IconPool.isIconURI(d.icon));
		});

		aCntG.selectAll(".iconImage").attr("xlink:href", function (d) {
			return d.icon;
		})
		.attr("x", function (d) {
			return Core.getConfiguration().getRTL() ? iTableWidth - iTableHeaderWidth - fGetLevelIndentByShape(d) - 17 : fGetLevelIndentByShape(d) + iTableHeaderWidth;
		})
		.attr("y", function (d) {
			//top height to parent container
			return d.y + 4.25;
		})
		.attr("width", 16)
		.attr("height", 16);

		aCntG.selectAll(".iconFont").attr("x", function (d) {
			return Core.getConfiguration().getRTL() ? iTableWidth - iTableHeaderWidth - fGetLevelIndentByShape(d) : fGetLevelIndentByShape(d) + iTableHeaderWidth;
		})
		.attr("y", function (d) {
			return d.y + 19;
		})
		.text(function(d){
			var oIconInfo = IconPool.getIconInfo(d.icon);
			if (oIconInfo) {
				return oIconInfo.content;
			}
		}).attr("font-family", function(d){
			var oIconInfo = IconPool.getIconInfo(d.icon);
			if (oIconInfo) {
				return oIconInfo.fontFamily;
			}
		})
		.attr("font-size", "16px");
		aCntIcon.exit().remove();

		var aCntText = aCntG.selectAll("sapGanttExpandChartText").data(function(d) {return d;});
		aCntText.enter().append("text").classed("sapGanttExpandChartText",true);
		aCntText.attr("x", function (d) {
			return Core.getConfiguration().getRTL() ? iTableWidth - iTableHeaderWidth - fGetLevelIndentByShape(d) - 26 : fGetLevelIndentByShape(d) + iTableHeaderWidth + 27;
		})
		.attr("y", function (d) {
			return d.y + 16.5;
		})
		.attr("font-size", function (d) {
			return "0.75em";
		})
		.text(function (d) {
			return d.name;
		})
		.attr("text-anchor", (Device.browser.msie || Device.browser.edge) && Core.getConfiguration().getRTL() ? "end" : "start");

		aCntText.exit().remove();

		var that = this;
		var aCntCloseBtn = aCntG.selectAll(".sapGanttExpandChartCloseButton").data(function(d) {return d;});
		aCntCloseBtn.enter().append("text").classed("sapGanttExpandChartCloseButton", true);
		aCntCloseBtn.attr("x", function (d) {
			var iPrevTextWidth, aPrevText = jQuery(this).prev("text");
			if (aPrevText && aPrevText.length > 0) {
				var oBoundRect = aPrevText[0].getBoundingClientRect();
				if (oBoundRect && oBoundRect.width > 0) {
					iPrevTextWidth = oBoundRect.width;	
				} else {
					iPrevTextWidth = aPrevText[0].clientWidth;
				}
			}
			if (isNaN(iPrevTextWidth) || iPrevTextWidth == null || iPrevTextWidth == 0) {
				iPrevTextWidth = 60;
			}
			var sInitialX = Core.getConfiguration().getRTL() ? iTableWidth - iTableHeaderWidth - fGetLevelIndentByShape(d) - iPrevTextWidth - 37 : fGetLevelIndentByShape(d) + iTableHeaderWidth + iPrevTextWidth + 35;
			return sInitialX;
		})
		.attr("y", function (d) {
			return d.y + 19;
		})
		.text(function(d){
			var oIconInfo = IconPool.getIconInfo("decline", undefined);
			if (oIconInfo) {
				return oIconInfo.content;
			}
		})
		.attr("font-family", function(d){
			var oIconInfo = IconPool.getIconInfo("decline", undefined);
			if (oIconInfo) {
				return oIconInfo.fontFamily;
			}
		})
		.attr("font-size", "14px")
		.attr("font-weight", "bolder")
		.on("click", function (d) {
			var oBinding = that._oGanttChartWithTable._oTT.getBinding("rows");
			var aRows = oBinding.getContexts(0, oBinding.getLength());
			var sRowIdName = that._oGanttChartWithTable.getRowIdName();
			for (var i = 0; i < aRows.length; i++) {
				var oContext = aRows[i].getProperty();
				if (oContext && d.id && oContext[sRowIdName] === d.id) {
					that._oGanttChartWithTable.handleExpandChartChange(false, [d.chartScheme], [i]);
				}
			}
		});

		aCntCloseBtn.select("title").remove();
		aCntCloseBtn.insert("title", ":first-child")
		.text(function(d) {
			return sap.ui.getCore().getLibraryResourceBundle("sap.gantt").getText("TLTP_CLOSE");
		});
		aCntCloseBtn.exit().remove();
	};


	/**
	 * Calculate the offset in x dimension for expanded chart content. Expected: the expanded chart content should
	 * be slightly indented compared to the current row
	 * 
	 * @param {object} oShape shape date for the current row
	 * 
	 * @return {int} The appropriate x offset where to start drawing expanded chart icon and text.
	 * 
	 */
	SelectionPanel.prototype._getLevelIndentByShape = function (oShape) {
		//Some fragmental margins of the span element at the front of each row, padding-left 8, margin-right 5
		var iFragmentMarginOffset = 13;
		//one margin for one level of hierarchy, the hierarchy at level 0 does not have this
		var iMarginLeftUnit = 17;
		//the width of the span element at the front of each row, to indent the next hierarchy row text
		var iSpanWidth = 25;
		//the level where current row data is in the hierarchy
		var iHierarchyLevel = 0;

		if (oShape && oShape.bindingObj && oShape.bindingObj._aRowIndexMap && oShape.rowIndex && oShape.rowIndex < oShape.bindingObj._aRowIndexMap.length) {
			iHierarchyLevel = oShape.bindingObj._aRowIndexMap[oShape.rowIndex].level;
		}
		if (isNaN(iHierarchyLevel) || iHierarchyLevel == null) {
			iHierarchyLevel = 0;
		}
		return iMarginLeftUnit * iHierarchyLevel + iSpanWidth + iFragmentMarginOffset;
	};

	return SelectionPanel;
},true);
