/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/drawer/Drawer", "sap/gantt/misc/Utility","sap/gantt/misc/Format",
	// 3rd party lib
	"sap/ui/thirdparty/d3"
], function (Drawer, Utility, Format) {
	"use strict";

	var ShapeInRow = Drawer.extend("sap.gantt.drawer.ShapeInRow", {
	});

	/*
	 * oShape is the shape instance which already have data collected.
	 */
	ShapeInRow.prototype.drawSvg = function (aSvgNode, oShape, oAxisTime, oAxisOrdinal, oStatusSet) {
		// temp save param
		this._oAxisTime = oAxisTime;
		this._oAxisOrdinal = oAxisOrdinal;
		this._oStatusSet = oStatusSet;
		// create top g
		var aShapeTopG = aSvgNode.select("." + oShape.getId() + "-top");
		if (aShapeTopG.empty()) {
			aShapeTopG = aSvgNode.append("g")
				.classed(oShape.getId() + "-top", true);
		}
		if (sap.ui.getCore().byId(oShape.getId()).getMetadata().getName() === "sap.gantt.shape.cal.Calendar") {
			aShapeTopG.classed("sapGanttChartCalendar", true);
		}
		// bind data to row g
		var sRowClassId = oShape.getId() + "-row";
		var aRowG = aShapeTopG.selectAll("." + sRowClassId)
			.data(oShape.dataSet);
		aRowG.enter().append("g")
			.classed(sRowClassId, true);
		aRowG.attr("data-sap-gantt-row-id", function(d) {
			return d.objectInfoRef.id;
		});
		aRowG.exit().remove();
		// draw
		if (!aRowG.empty()) {
			this._recursiveDraw(aRowG, oShape);
		}
	};
	
	//particular for resizing to draw shadow in resizing process
	ShapeInRow.prototype.drawResizeShadow = function (aSvgNode, oShadowShape, oAxisTime, oAxisOrdinal, oStatusSet) {
		// temp save param
		this._oAxisTime = oAxisTime;
		this._oAxisOrdinal = oAxisOrdinal;
		this._oStatusSet = oStatusSet;
		
		if (oShadowShape) {
			//create a resizing shadow g
			var aResizingShadowG = aSvgNode.select(".resizingShadow");
			if (aResizingShadowG.empty()) {
				aResizingShadowG = aSvgNode.append("g")
					.classed("resizingShadow", true);
			}
			var aResizeShapeG = aResizingShadowG.select("." + oShadowShape.getId() + "-resize");
			if (aResizeShapeG.empty()) {
				aResizeShapeG = aResizingShadowG.append("g").classed(oShadowShape.getId() + "-resize", true);
			}
			var aRealShapeG = aResizeShapeG.data(oShadowShape.dataSet);
			aRealShapeG.exit().remove();
			// draw shadow
			if (!aRealShapeG.empty()) {
				this._recursiveDraw(aRealShapeG, oShadowShape);
			}
		}
	};

	ShapeInRow.prototype._recursiveDraw = function (aGroup, oShape, sData) {
		var that = this;
		var aShape = aGroup.selectAll("." + oShape.getId())
			.data(function (d) {
				return that._bindRowData(d, sData, this, oShape);
			});

		this._drawPerTag(aShape, oShape);
		this._drawInsertTitle(aGroup, oShape);
	};

	ShapeInRow.prototype._bindRowData = function (oData, sData, oNode, oShape) {
		var aViewRange = this._oStatusSet && this._oStatusSet.aViewBoundary ? this._oStatusSet.aViewBoundary : undefined;
		var isBulk = oShape.getIsBulk();
		var oFilterParam, i;
		
		if (oData) {
			var aRetVal = [];
			if (oData.shapeData) {  // top shapes
				if (!(oData.shapeData instanceof Array)) {
					aRetVal = aRetVal.concat(oData.shapeData);
				} else {
					for (i = 0; i < oData.shapeData.length; i++) {
						if (oData.shapeData[i]) {
							oFilterParam = {};
							oFilterParam.oShape = oShape;
							oFilterParam.objectInfo = oData.objectInfoRef;
							oFilterParam.dShapeData = oData.shapeData[i];
							oFilterParam.aViewRange = aViewRange;
							if (!isBulk && (aViewRange !== undefined) && this._filterDataVisibleRange(oFilterParam)) {
								continue;
							}
							aRetVal = aRetVal.concat(oData.shapeData[i]);
						}
					}
				}
			} else if (sData && oData[sData]) {	// aggregated shapes and special attribute is identified
				if (oData[sData].length) { // is array
					for (i = 0; i < oData[sData].length; i++) {
						oFilterParam = {};
						oFilterParam.oShape = oShape;
						oFilterParam.objectInfo = oData.objectInfoRef;
						oFilterParam.dShapeData = oData[sData][i];
						oFilterParam.aViewRange = aViewRange;
						if (!isBulk && (aViewRange !== undefined) && this._filterDataVisibleRange(oFilterParam)) {
							continue;
						}
						aRetVal.push(oData[sData][i]);
					}
				} else {
					aRetVal.push(oData[sData]);
				}
			} else if (oData){	// inherigate parent data
				aRetVal = aRetVal.concat(oData);
			}
			//if the shape has a filterValidData method, filter valid data for the shape
			if (oShape.filterValidData && (aRetVal.length > 0)) {
				aRetVal = oShape.filterValidData(aRetVal, oData.objectInfoRef);
			}
			return aRetVal;
		}
	};
	
	ShapeInRow.prototype._filterDataVisibleRange = function (oFilterParam) {
		var oAxisTime = this._oAxisTime;
		var oAxisOrdinal = this._oAxisOrdinal;
		var aViewRange = oFilterParam.aViewRange;
	
		var isDuration = oFilterParam.oShape.getIsDuration(oFilterParam.dShapeData);
		if (isDuration) {
			var startTime = oAxisTime.timeToView(Format.abapTimestampToDate(oFilterParam.oShape.getTime(oFilterParam.dShapeData, undefined, oAxisTime, oAxisOrdinal, oFilterParam.objectInfo)));
			var endTime = oAxisTime.timeToView(Format.abapTimestampToDate(oFilterParam.oShape.getEndTime(oFilterParam.dShapeData, undefined, oAxisTime, oAxisOrdinal, oFilterParam.objectInfo)));
			if (this._oStatusSet.bRTL === true){
				return (endTime > aViewRange[1]) || (startTime < aViewRange[0]);
			}else {
				return (endTime < aViewRange[0]) || (startTime > aViewRange[1]);
			}
		} else {
			var time = oAxisTime.timeToView(Format.abapTimestampToDate(oFilterParam.oShape.getTime(oFilterParam.dShapeData, undefined, oAxisTime, oAxisOrdinal, oFilterParam.objectInfo)));
			return (time > aViewRange[1]) || (time < aViewRange[0]);
		}
		return false;
	};

	ShapeInRow.prototype._drawPerTag = function (aShape, oShape) {
		switch (oShape.getTag()) {
			case "g":
				this._drawGroup(aShape, oShape);
				break;
			case "line":
				this._drawLine(aShape, oShape);
				break;
			case "rect":
				this._drawRect(aShape, oShape);
				break;
			case "text":
				this._drawText(aShape, oShape);
				break;
			case "path":
				this._drawPath(aShape, oShape);
				break;
			case "clippath":
				this._drawClipPath(aShape, oShape);
				break;
			case "image":
				this._drawImage(aShape, oShape);
				break;
			case "polygon":
				this._drawPolygon(aShape, oShape);
				break;
			case "polyline":
				this._drawPolyline(aShape, oShape);
				break;
			case "circle":
				this._drawCircle(aShape, oShape);
				break;
			case "defs":
				this._drawDefinitions(aShape, oShape);
				break;
			default:
				break;
		}

		if (oShape.getParent() === null) {
			// If the shape is not wrapped inside a group tag, then add the data attribute
			// otherwise only set the attribute on group element
			this.addDataAttributes(aShape);
		}

	};

	ShapeInRow.prototype._drawGroup = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;

		aShape.enter().append("g")
			.classed(oShape.getId(), true);

		aShape
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			});

		aShape.exit().remove();

		var aAggregationShapes = oShape.getShapes();
		if (aAggregationShapes && aAggregationShapes.length > 0) {
			for (var i = 0; i < aAggregationShapes.length; i++) {
				this._recursiveDraw(aShape, aAggregationShapes[i], aAggregationShapes[i].mShapeConfig.getShapeDataName());
			}
		}
	};

	ShapeInRow.prototype._drawLine = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;
		aShape.enter().append("line")
			.classed(oShape.getId(), true);

		aShape
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.attr("x1", function (d) {
				return oShape.getX1(d, fFindObjectInfo(this, oShape));
			})
			.attr("y1", function (d) {
				return oShape.getY1(d, fFindObjectInfo(this, oShape));
			})
			.attr("x2", function (d) {
				return oShape.getX2(d, fFindObjectInfo(this, oShape));
			})
			.attr("y2", function (d) {
				return oShape.getY2(d, fFindObjectInfo(this, oShape));
			})
			.attr("filter",function(d) {
				return oShape.getFilter(d, fFindObjectInfo(this, oShape));
			})
			.attr("transform", function (d) {
				return oShape.getTransform(d, fFindObjectInfo(this, oShape));
			})
			.attr("aria-label", function (d) {
				return oShape.getAriaLabel(d, fFindObjectInfo(this, oShape));
			})
			.attr("style", function (d){
				return oShape.getStyle(d, fFindObjectInfo(this, oShape));
			});

		aShape.exit().remove();
	};

	ShapeInRow.prototype._drawRect = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;
		aShape.enter().append("rect")
			.classed(oShape.getId(), true);

		aShape
			.classed(oShape.getHtmlClass(), function (d) {
				return oShape.getHtmlClass(d,fFindObjectInfo(this, oShape)) ? true : false;
			})
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.classed("enableClone", function (d) {
				return oShape.getEnableDnD(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.attr("x", function (d) {
				return oShape.getX(d, fFindObjectInfo(this, oShape));
			})
			.attr("y", function (d) {
				return oShape.getY(d, fFindObjectInfo(this, oShape));
			})
			.attr("width", function (d) {
				return oShape.getWidth(d, fFindObjectInfo(this, oShape));
			})
			.attr("height", function (d) {
				return oShape.getHeight(d, fFindObjectInfo(this, oShape));
			})
			.attr("rx", function (d) {
				return oShape.getRx(d, fFindObjectInfo(this, oShape));
			})
			.attr("ry", function (d) {
				return oShape.getRy(d, fFindObjectInfo(this, oShape));
			})
			.attr("filter",function(d) {
				return oShape.getFilter(d, fFindObjectInfo(this, oShape));
			})
			.attr("transform", function (d) {
				return oShape.getTransform(d, fFindObjectInfo(this, oShape));
			})
			.attr("clip-path", function (d) {
				return oShape.getClipPath(d, fFindObjectInfo(this, oShape));
			})
			.attr("aria-label", function (d) {
				return oShape.getAriaLabel(d, fFindObjectInfo(this, oShape));
			})
			.attr("style", function (d){
				return oShape.getStyle(d, fFindObjectInfo(this, oShape));
			});

		aShape.exit().remove();
	};

	ShapeInRow.prototype._drawText = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;

		aShape.enter().append("text")
			.classed(oShape.getId(), true);
		aShape
			.classed("sapGanttShapeSvgText", true)
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.attr("x", function (d) {
				return oShape.getX(d, fFindObjectInfo(this, oShape));
			})
			.attr("y", function (d) {
				return oShape.getY(d, fFindObjectInfo(this, oShape));
			})
			.attr("text-anchor", function (d) {
				return oShape.getTextAnchor(d, fFindObjectInfo(this, oShape));
			})
			.attr("filter",function(d) {
				return oShape.getFilter(d, fFindObjectInfo(this, oShape));
			})
			.attr("transform", function (d) {
				return oShape.getTransform(d, fFindObjectInfo(this, oShape));
			})
			.attr("style", function (d){
				return oShape.getStyle(d, fFindObjectInfo(this, oShape));
			})
			.text(function (d) {
				return oShape.getText(d, fFindObjectInfo(this, oShape));
			}).each(function (d) { // wrapping, truncating
				var oSelf = d3.select(this);
				oSelf.selectAll("tspan").remove();
				var ObjectInfo = fFindObjectInfo(this, oShape);
				var nWrapWidth = oShape.getWrapWidth(d, ObjectInfo);
				var nTruncateWidth = oShape.getTruncateWidth(d, ObjectInfo);
				if (nTruncateWidth > -1) { // do truncating
					that._textTruncate(d, oSelf, nTruncateWidth, oShape.getEllipsisWidth(d, ObjectInfo));
				} else if (nWrapWidth > -1) { // do wrapping
					that._textWrap(d, this, nWrapWidth, oShape.getWrapDy(d, ObjectInfo));
				}
			});

		aShape.exit().remove();
	};

	ShapeInRow.prototype._textTruncate = function (oData, oSelf, nTruncateWidth, nEllipsisWidth) {
		var nTextLength = oSelf.node().getComputedTextLength();

		if (nTextLength > nTruncateWidth) { // truncate needed
			var sText = oSelf.text().trim(),
				nTargetLength,
				bEllipsisAppear;

			if (nEllipsisWidth > -1 && nEllipsisWidth < nTruncateWidth) { // ellipsis enabled
				bEllipsisAppear = true;
				nTargetLength = nTruncateWidth - nEllipsisWidth;
			} else { // ellipsis disabled
				bEllipsisAppear = false;
				nTargetLength = nTruncateWidth;
			}

			// truncate
			var nTruncatCount = this._getTextTruncatCountByBinarySearch(oSelf, nTextLength, nTargetLength, sText);
			sText = sText.slice(0, nTruncatCount).trim();
			oSelf.text(sText);
			// add ellipsis if determined to be needed
			if (bEllipsisAppear) {
				if (sap.ui.Device.browser.name === "cr"){
					//Chrome's textlength is rendered differently to ie and ff. If the textlength specified in tspan and the direction is RTL, 
					//then text length is applied to whole text element 
					oSelf.append("tspan")
						.text("...")
						.attr("textLength", oSelf.node().getComputedTextLength())
						.attr("lengthAdjust", "spacingAndGlyphs");
				} else {
					oSelf.append("tspan")
					.text("...")
					.attr("textLength", nEllipsisWidth)
					.attr("lengthAdjust", "spacingAndGlyphs");
				}
			}
		}
	};
	/**
	 * Calculate the number of text letters that can fit in the target length.
	 * 
	 * First do a estimation based on the pixels each letter takes in screen and the target length,
	 * And compare three potential values (example: estimatedCount -1, estimatedCount, estimatedCount + 1) with the target length,
	 * IF one of the estimated values fit, then return
	 * ELSE do a binary search to find the most suitable number of text letters that can fit in the target length 
	 */
	ShapeInRow.prototype._getTextTruncatCountByBinarySearch = function (oSelf, nTextLength, nTargetLength, sText) {
		var nTargetCount = 0;
		if (nTargetLength > 0 && sText.length > 0) {
			//estimate the count of text letters to fullfil the target width
			var nEstimatedCount = Math.round(nTargetLength / Math.ceil(nTextLength / sText.length));
			var nPreCount, nMidCount, nNextCount;
			if (nEstimatedCount < 1) {
				nPreCount = nEstimatedCount;
				nMidCount = nEstimatedCount + 1;
				nNextCount = nEstimatedCount + 2;
			} else if (nEstimatedCount == sText.length) {
				nPreCount = nEstimatedCount - 2;
				nMidCount = nEstimatedCount - 1;
				nNextCount = nEstimatedCount;
			} else {
				nPreCount = nEstimatedCount - 1;
				nMidCount = nEstimatedCount;
				nNextCount = nEstimatedCount + 1;
			}

			var nTextWidthMid = oSelf[0][0].getSubStringLength(0, nMidCount);
			var nTextWidthNext = oSelf[0][0].getSubStringLength(0, nNextCount);
			var nTextWidthPre = oSelf[0][0].getSubStringLength(0, nPreCount);

			if (nTextWidthMid == nTargetLength || (nTextWidthMid < nTargetLength && nTextWidthNext > nTargetLength)) {// the estimated count is fit
				nTargetCount = nMidCount;
			} else if (nTextWidthNext == nTargetLength) {// the next estimated count is fit
				nTargetCount = nNextCount;
			} else if (nTextWidthPre == nTargetLength || (nTextWidthPre < nTargetLength && nTextWidthMid > nTargetLength)){// the previous estimated count is fit
				nTargetCount = nPreCount;
			} else {//the estimated count are not fit, then do a binary search
				var nStart = 1, nEnd = sText.length;
				//the estimated count are all too small for the target width
				if (nTextWidthNext < nTargetLength) {
					nStart = nNextCount;
					//the estimated count are all too big for the target width
				} else if (nTextWidthPre > nTargetLength) {
					nEnd = nPreCount - 1;
				}

				while (nStart <= nEnd) {
					nMidCount = Math.floor(nStart + (nEnd - nStart) / 2);
					nTextWidthMid = oSelf[0][0].getSubStringLength(0, nMidCount);
					nTextWidthNext = oSelf[0][0].getSubStringLength(0, nMidCount + 1);
					if (nTextWidthMid == nTargetLength || (nTextWidthMid < nTargetLength && nTextWidthNext > nTargetLength)) {
						nTargetCount = nMidCount;
						break;
					} else if (nTextWidthMid > nTargetLength) {
						nEnd = nMidCount - 1;
					} else {
						nStart = nMidCount + 1;
					}
				}
			}
		}
		return (nTargetCount >= 0 && nTargetCount <= sText.length) ? nTargetCount : 0;
	};

	ShapeInRow.prototype._textWrap = function (oData, oSelf, nWrapWidth, nWrapDy) {
		//var nTextLength = oSelf.node().getComputedTextLength();
		
		//if (nTextLength > nWrapWidth) { // wrap needed
			// tokenize the text
			// connect tokens in tspan, and check against nWrapWidth
			// create tspan with dy = nWrapDy
		//}
	};

	ShapeInRow.prototype._drawPath = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;
		aShape.enter().append("path")
			.classed(oShape.getId(), true);

		aShape
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.attr("d", function (d) {
				return oShape.getD(d, fFindObjectInfo(this, oShape));
			})
			.attr("transform", function (d) {
				return oShape.getTransform(d, fFindObjectInfo(this, oShape));
			})
			.attr("filter",function(d) {
				return oShape.getFilter(d, fFindObjectInfo(this, oShape));
			})			
			.attr("aria-label", function (d) {
				return oShape.getAriaLabel(d, fFindObjectInfo(this, oShape));
			})
			.attr("style", function (d){
				return oShape.getStyle(d, fFindObjectInfo(this, oShape));
			});

		aShape.exit().remove();
	};

	ShapeInRow.prototype._drawClipPath = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		/**
		 * After sort on expand chart, the clipPath became noneffective in Chrome (but works in IE)
		 * So, draw clipPath inside the tag <defs>, this can ensure the clipPath works in various browser
		 */
		aShape.enter().append("defs").classed(oShape.getId(), true);
		
		aShape.selectAll("clipPath").remove();
		
		aShape.append("clipPath")
				.attr("id", function (d) {  // Jean TODO: id is important for clip path, but why use htmlClass attribute?
					return oShape.getHtmlClass(d, fFindObjectInfo(this, oShape));
			}).append("path")// Jean TODO: why getPaths()[0] ? should loop and generate all, then .apend("path") should be detached from enter();
				.attr("d", function (d) {
					return oShape.getPaths()[0].getD(d, fFindObjectInfo(this, oShape));
			});
		
		aShape.exit().remove();
	};

	ShapeInRow.prototype._drawImage = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;

		aShape.enter().append("image")
			.classed(oShape.getId(), true);

		aShape
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.attr("xlink:href", function (d) {
				return oShape.getImage(d, fFindObjectInfo(this, oShape));
			})
			.attr("x", function (d) {
				return oShape.getX(d, fFindObjectInfo(this, oShape));
			})
			.attr("y", function (d) {
				return oShape.getY(d, fFindObjectInfo(this, oShape));
			})
			.attr("width", function (d) {
				return oShape.getWidth(d, fFindObjectInfo(this, oShape));
			})
			.attr("height", function (d) {
				return oShape.getHeight(d, fFindObjectInfo(this, oShape));
			})
			.attr("filter",function(d) {
				return oShape.getFilter(d, fFindObjectInfo(this, oShape));
			})
			.attr("transform", function (d) {
				return oShape.getTransform(d, fFindObjectInfo(this, oShape));
			})			
			.attr("aria-label", function (d) {
				return oShape.getAriaLabel(d, fFindObjectInfo(this, oShape));
			});

		aShape.exit().remove();
	};

	ShapeInRow.prototype._drawPolygon = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;
		aShape.enter().append("polygon")
			.classed(oShape.getId(), true);

		aShape
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.attr("points", function (d) {
				return oShape.getPoints(d, fFindObjectInfo(this, oShape));
			})
			.attr("filter",function(d) {
				return oShape.getFilter(d, fFindObjectInfo(this, oShape));
			})
			.attr("transform", function (d) {
				return oShape.getTransform(d, fFindObjectInfo(this, oShape));
			})
			.attr("aria-label", function (d) {
				return oShape.getAriaLabel(d, fFindObjectInfo(this, oShape));
			})
			.attr("style", function (d){
				return oShape.getStyle(d, fFindObjectInfo(this, oShape));
			});

		aShape.exit().remove();
	};
	
	ShapeInRow.prototype._drawPolyline = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;
		aShape.enter().append("polyline")
			.classed(oShape.getId(), true);
		aShape
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.attr("points", function (d) {
				return oShape.getPoints(d, fFindObjectInfo(this, oShape));
			})
			.attr("filter",function(d) {
				return oShape.getFilter(d, fFindObjectInfo(this, oShape));
			})
			.attr("transform", function (d) {
				return oShape.getTransform(d, fFindObjectInfo(this, oShape));
			})
			.attr("aria-label", function (d) {
				return oShape.getAriaLabel(d, fFindObjectInfo(this, oShape));
			})
			.attr("style", function (d){
				return oShape.getStyle(d, fFindObjectInfo(this, oShape));
			});

		aShape.exit().remove();
	};
	
	ShapeInRow.prototype._drawCircle = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;
		aShape.enter().append("circle")
			.classed(oShape.getId(), true);

		aShape
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape)) ? true : false;
			})
			.attr("filter",function(d) {
				return oShape.getFilter(d, fFindObjectInfo(this, oShape));
			})
			.attr("transform", function (d) {
				return oShape.getTransform(d, fFindObjectInfo(this, oShape));
			})
			.attr("aria-label", function (d) {
				return oShape.getAriaLabel(d, fFindObjectInfo(this, oShape));
			})
			.attr("cx", function (d) {
				return oShape.getCx(d, fFindObjectInfo(this, oShape));
			})
			.attr("cy", function (d) {
				return oShape.getCy(d, fFindObjectInfo(this, oShape));
			})
			.attr("r", function (d) {
				return oShape.getR(d, fFindObjectInfo(this, oShape));
			})
			.attr("style", function (d){
				return oShape.getStyle(d, fFindObjectInfo(this, oShape));
			});

		aShape.exit().remove();
	};

	ShapeInRow.prototype._drawDefinitions = function(aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		aShape.enter().append("defs")
		.classed(oShape.getId(), true);
		aShape.each(function(d, i){
			jQuery(this).empty();
			var sHtml = oShape.getContent(d, fFindObjectInfo(this));
			var sXML = "<svg xmlns='" + d3.ns.prefix.svg + "'>" + sHtml + "</svg>";
			this.appendChild(jQuery(sXML)[0].firstChild);
		}); 

		aShape.exit().remove();
	};

	ShapeInRow.prototype._drawInsertTitle = function (aGroup, oShape) {
		var fFindObjectInfo = this._findObjectInfo;

		var aShape = aGroup.selectAll("." + oShape.getId() + ".hasTitle");
		aShape.select("title").remove();
		aShape.insert("title", ":first-child")
			.each(function (d) {
				var oSelf = d3.select(this);
				oSelf.selectAll("tspan").remove();
				
				// IE11 doesn't render '\n' newline characters in svg tooltip, here we use tag <tspan> elements as a solution
				// besides, IE11 renders consecutive <tspan> elements with style 'display:block' with double line spacing, 
				// so the style is applied to every other element
				if (sap.ui.Device.browser.msie) {
					var aLines = oShape.getTitle(d, fFindObjectInfo(this, oShape)).split("\n");
					for(var i = 0; i < aLines.length; i++) {
						oSelf.append("tspan")
							.classed("sapGanttTooltipLine", true)
							.text(aLines[i]);
					}
				} else {
					oSelf.text(oShape.getTitle(d, fFindObjectInfo(this, oShape)));
				}
			});
	};

	ShapeInRow.prototype._findObjectInfo = function (oNode, oShape, isSelectedShape) {
		var oTargetNode = oNode;
		while (!oTargetNode.__data__.objectInfoRef) {
			oTargetNode = oTargetNode.parentNode;
		}
		return oTargetNode.__data__.objectInfoRef;
	};

	/**
	 * Add DataSet attribute on the Shape DOM element for quick reference.
	 * 
	 * If consumer doesn't specify the id <b>reserved keyword</b> in their data, use
	 * jQuery.sap.uid() instead
	 * 
	 * @param {object} oShape D3 DOM element
	 * @private
	 */
	ShapeInRow.prototype.addDataAttributes = function(oShape) {
		oShape.attr("data-sap-gantt-shape-id", function(d){
			//the'__id__' is a reference to the real index attribute of user's data, which is generated in Utility generateRowUid
			return d.__id__; 
		});
	};

	ShapeInRow.prototype.destroySvg = function (aSvgNode, oShape) {};

	return ShapeInRow;
}, true);
