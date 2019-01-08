sap.ui.define([
	"sap/gantt/drawer/Drawer", "sap/gantt/misc/Format",
	// 3rd party lib
	"sap/ui/thirdparty/d3"
], function (Drawer, Format) {
	"use strict";

	var Legend = Drawer.extend("sap.gantt.drawer.Legend");

	Legend.prototype._recursiveDraw = function (aGroup, oShape) {
		var aShape = aGroup.selectAll("." + oShape.getId())
			.data(function (d) {
				var aRetVal = [];
				return aRetVal.concat(d);
			});
		this._drawPerTag(aShape, oShape);
	};

	Legend.prototype._drawPerTag = function (aShape, oShape) {
		var oLegend = oShape.mChartInstance;
		if (oShape.getIsDuration()) {
			oShape.getTime = function() {
				return oLegend.TIME_RANGE[0];
			};
			oShape.getEndTime = function() {
				return oLegend.TIME_RANGE[1];
			};
//			oShape.setTime(oLegend.TIME_RANGE[0]);
//			oShape.setEndTime(oLegend.TIME_RANGE[1]);
		} else {
//			oShape.setTime(oLegend.TIME);
			oShape.getTime = function() {
				return oLegend.TIME;
			};
		}

		oShape.setRowYCenter(oLegend.getScaledLegendHeight() / 2);
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
			default:
				break;
		}
		
		this._insertTitle(aShape, oShape);
	};

	Legend.prototype._insertTitle = function (aShape, oShape) {
		aShape.select("title").remove();
		aShape.insert("title", ":first-child")
			.text(function(d) {
				if (!oShape.getParent()) {
					return oShape.getTitle(d);
				}
			});
	};

	Legend.prototype._drawGroup = function (aShape, oShape) {
		aShape.enter().append("g")
			.classed(oShape.getId(), true)
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();

		var aAggregationShapes = oShape.getShapes();
		if (aAggregationShapes && aAggregationShapes.length > 0) {
			for (var i = 0; i < aAggregationShapes.length; i++) {
				this._recursiveDraw(aShape, aAggregationShapes[i]);
			}
		}
	};

	Legend.prototype._drawLine = function (aShape, oShape) {
		var that = this;
		aShape.enter().append("line")
			.attr("x1", function(d){return oShape.getX1(d);})
			.attr("y1", function(d){return oShape.getY1(d);})
			.attr("x2", function(d){return oShape.getX2(d);})
			.attr("y2", function(d){return oShape.getY2(d);})
			.attr("filter", function(d){return oShape.getFilter(d);})
			.attr("aria-label", function(d){return oShape.getAriaLabel(d);})
			.attr("stroke", function(d){return that.determineValue("stroke", oShape, d);})
			.attr("stroke-width", function(d){return oShape.getStrokeWidth(d);})
			.attr("stroke-dasharray", function(d){return oShape.getStrokeDasharray(d);})
			.attr("fill-Opacity", function(d){return oShape.getFillOpacity(d);})
			.attr("transform", function (d) {
				return oShape.getTransform(d);
			})
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();
	};

	Legend.prototype._drawRect = function (aShape, oShape) {
		var oLegend = oShape.mChartInstance,
			that = this;

		aShape.enter().append("rect")
			.classed(oShape.getId(), true);
		aShape.attr("x", function(d){
				if (oLegend.getLegendSpace !== undefined) {
					if (sap.ui.getCore().getConfiguration().getRTL()) {
						var aXDomain = oLegend.getXDomain(),
						iXLength = aXDomain.length;
						return oLegend.getScaledLegendWidth() * (iXLength - d.xIndex - 1) + oLegend.getLegendSpace() * (iXLength - d.xIndex);
					}
					return oLegend.getScaledLegendWidth() * d.xIndex + oLegend.getLegendSpace() * (d.xIndex + 1);
				}
				return oShape.getX(d);
			})
			.attr("y", function(d){
				if (oLegend.getLegendSpace !== undefined) {
					return oLegend.getScaledLegendHeight() * d.yIndex + oLegend.getLegendSpace() * (d.yIndex + 1);
				}
				return oShape.getY(d);
			})
			.attr("width", function(d){return oShape.getWidth(d);})
			.attr("height", function(d){return oShape.getHeight(d);})
			.attr("fill", function(d){return that.determineValue("fill", oShape, d);})
			.attr("rx", function(d){return oShape.getRx(d);})
			.attr("ry", function(d){return oShape.getRy(d);})
			.attr("filter", function(d){return oShape.getFilter(d);})
			.attr("stroke", function(d){return that.determineValue("stroke", oShape, d);})
			.attr("stroke-width", function(d){return oShape.getStrokeWidth(d);})
			.attr("stroke-dasharray", function(d){return oShape.getStrokeDasharray(d);})
			.attr("opacity", function(d){return oShape.getFillOpacity(d);})
			.attr("aria-label", function(d){return oShape.getAriaLabel(d);})
			.attr("transform", function (d) {
				return oShape.getTransform(d);
			})
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();
	};

	Legend.prototype._drawText = function (aShape, oShape) {
		var oLegend = oShape.mChartInstance,
			that = this;
		aShape.enter().append("text")
			.attr("x", function(d){
				if (oLegend.getLegendSpace !== undefined) {
					return oLegend.getScaledLegendWidth() * d.xIndex + oLegend.getLegendSpace() * (d.xIndex + 1);
				}
				return oShape.getX(d);
			})
			.attr("y", function(d){
				if (oLegend.getLegendSpace !== undefined) {
					return oLegend.getScaledLegendHeight() * d.yIndex + oLegend.getLegendSpace() * (d.yIndex + 1);
				}
				return oShape.getRowYCenter(d);
			})
			.attr("text-anchor", "middle")
			.attr("font-size", function(d){return oShape.getFontSize(d);})
			.attr("fill", function(d){return that.determineValue("fill", oShape, d);})
			.attr("filter", function(d){return oShape.getFilter(d);})
			.attr("stroke", function(d){return that.determineValue("stroke", oShape, d);})
			.attr("stroke-width", function(d){return oShape.getStrokeWidth(d);})
			.attr("alignment-baseline", "central")
			.attr("font-family", function(d){return oShape.getFontFamily(d);})
			.text(oShape.getText())
			.attr("transform", function (d) {
				return oShape.getTransform(d);
			})
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();
	};

	Legend.prototype._drawPath = function (aShape, oShape) {
		var that = this;

		aShape.enter().append("path")
			.attr("d", function(d){return oShape.getD(d);})
			.attr("fill", function(d){return that.determineValue("fill", oShape, d);})
			.attr("stroke", function(d){return that.determineValue("stroke", oShape, d);})
			.attr("stroke-width", function(d){return oShape.getStrokeWidth(d);})
			.attr("stroke-dasharray", function(d){return oShape.getStrokeDasharray(d);})
			.attr("opacity", function(d){
				if (oShape.getIsClosed()) {
					return oShape.getFillOpacity(d);
				}
			})
			.attr("filter", function(d){return oShape.getFilter(d);})
			.attr("aria-label", function(d){return oShape.getAriaLabel(d);})
			.attr("transform", function (d) {
				return oShape.getTransform(d);
			})
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();
	};

	Legend.prototype._drawImage = function (aShape, oShape) {
		var oLegend = oShape.mChartInstance;
		aShape.enter().append("image")
			.attr("xlink:href", function(d){return oShape.getImage(d);})
			.attr("x", function(d){
				if (oLegend.getLegendSpace !== undefined) {
					return oLegend.getScaledLegendWidth() * d.xIndex + oLegend.getLegendSpace() * (d.xIndex + 1);
				}
				return oShape.getX(d);
			})
			.attr("y", function(d){
				if (oLegend.getLegendSpace !== undefined) {
					return oLegend.getScaledLegendHeight() * d.yIndex + oLegend.getLegendSpace() * (d.yIndex + 1);
				}
				return oShape.getY(d);
			})
			.attr("width", function(d){return oShape.getWidth(d);})
			.attr("height", function(d){return oShape.getHeight(d);})
			.attr("filter", function(d){return oShape.getFilter(d);})
			.attr("aria-label", function(d){return oShape.getAriaLabel(d);})
			.attr("transform", function (d) {
				return oShape.getTransform(d);
			})
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();
	};

	Legend.prototype._drawPolygon = function (aShape, oShape) {
		var that = this;

		aShape.enter().append("polygon")
			.attr("fill", function(d){return that.determineValue("fill", oShape, d);})
			.attr("points", function(d){return oShape.getPoints(d);})
			.attr("stroke-width", function(d){return oShape.getStrokeWidth(d);})
			.attr("stroke", function(d){return that.determineValue("stroke", oShape, d);})
			.attr("filter", function(d){return oShape.getFilter(d);})
			.attr("aria-label", function(d){return oShape.getAriaLabel(d);})
			.attr("transform", function (d) {
				return oShape.getTransform(d);
			})
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();
	};

	Legend.prototype._drawPolyline = function (aShape, oShape) {
		var that = this;
		aShape.enter().append("polyline")
			.attr("fill", function(d){return that.determineValue("fill", oShape, d);})
			.attr("points", function(d){return oShape.getPoints(d);})
			.attr("stroke-width", function(d){return oShape.getStrokeWidth(d);})
			.attr("stroke", function(d){return that.determineValue("stroke", oShape, d);})
			.attr("filter", function(d){return oShape.getFilter(d);})
			.attr("aria-label", function(d){return oShape.getAriaLabel(d);})
			.attr("transform", function (d) {
				return oShape.getTransform(d);
			})
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();
	};

	Legend.prototype._drawCircle = function (aShape, oShape) {
		var oLegend = oShape.mChartInstance,
			that = this;
		aShape.enter().append("circle")
			.attr("fill", function(d){return that.determineValue("fill", oShape, d);})
			.attr("stroke-width", function(d){return oShape.getStrokeWidth(d);})
			.attr("stroke", function(d){return that.determineValue("stroke", oShape, d);})
			.attr("filter", function(d){return oShape.getFilter(d);})
			.attr("aria-label", function(d){return oShape.getAriaLabel(d);})
			.attr("cx", function(d){
				if (oLegend.getLegendSpace !== undefined) {
					return oLegend.getScaledLegendWidth() * (d.xIndex + 0.5) + oLegend.getLegendSpace() * (d.xIndex + 1);
				}
				return oShape.getCx(d);
			})
			.attr("cy", function(d){
				if (oLegend.getLegendSpace !== undefined) {
					return oLegend.getScaledLegendHeight() * (d.yIndex + 0.5) + oLegend.getLegendSpace() * (d.yIndex + 1);
				}
				return oShape.getCy(d);
			})
			.attr("r", function(d){return oShape.getR(d);})
			.attr("transform", function (d) {
				return oShape.getTransform(d);
			})
			.attr("role", function(d){
				if (!oShape.getParent()) {
					return "tooltip";
				}
			})
			.attr("focusable", function(d){
				if (!oShape.getParent()) {
					return true;
				}
			})
			.attr("tabindex", function(d){
				if (!oShape.getParent()) {
					return 0;
				}
			})
			.attr("aria-label", function (d) {
				if (!oShape.getParent()) {
					return oShape.getAriaLabel(d);
				}
			});
		aShape.exit().remove();
	};

	Legend.prototype.determineValue = function(sAttr, oShape, d) {
		var sAttrValue = null;
		if (sAttr === "fill") {
			sAttrValue = oShape.getFill(d);
		} else if (sAttr === "stroke") {
			sAttrValue = oShape.getStroke(d);
		}
		return sap.gantt.ValueSVGPaintServer.normalize(sAttrValue);
	};

	return Legend;
}, true);
