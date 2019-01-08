jQuery.sap.declare("sap.zen.crosstab.utils.Measuring");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");

sap.zen.crosstab.utils.Measuring = function (oCrosstab, oDomElementProvider) {
	"use strict";
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oDataArea = oCrosstab.getDataArea();

	var iCrosstabWidth = oCrosstab.getIntWidth();
	var iCrosstabHeight = oCrosstab.getIntHeight();

	var oRenderSizeDivBorders = null;
	var oTableDivValues = null;

	// Buffers
	var oRenderSizeDivSize = null;
	var iScrollbarWidth = 0;
	
	this.getUpperLeftScrollDivWidth = function() {
		var oJqDiv = $(document.getElementById(oCrosstab.getId() + "_upperLeft_scrollDiv"));
		return oJqDiv.outerWidth();
	};
	
	this.getLowerLeftScrollDivWidth = function() {
		var oJqDiv = $(document.getElementById(oCrosstab.getId() + "_lowerLeft_scrollDiv"));
		return oJqDiv.outerWidth();
	}

	this.getAreaWidth = function (oArea) {
		var oJqArea = $(document.getElementById(oArea.getId() + "_container"));
		var iWidth = oJqArea.outerWidth();
		var iScrollDivWidth = 0;
		if (oArea.isDimHeaderArea()) {
			// might be limited for header scrolling. Take the smaller value
			iScrollDivWidth = this.getUpperLeftScrollDivWidth();
		} else if (oArea.isRowHeaderArea()) {
			iScrollDivWidth = this.getLowerLeftScrollDivWidth();
		}
		
		if (iScrollDivWidth > 0) {
			iWidth = Math.min(iWidth, iScrollDivWidth);
		}
		return iWidth;
	};

	this.getAreaHeight = function (oArea) {
		var oDomArea = $(document.getElementById(oArea.getId() + "_container"));
		return oDomArea.outerHeight();
	};

	this.getAreaSize = function (oArea) {
		var oSize = {};
		var oDomArea = $(document.getElementById(oArea.getId() + "_container"));
		oSize.iHeight = oDomArea.outerHeight();
		oSize.iWidth = this.getAreaWidth(oArea);

		return oSize;
	};

	this.getRenderSizeDivSize = function () {
		// This measures the size of the RenderSizeDiv.
		// This size represents the visible size of the crosstab --> clipped parts do not add to this size
		var oSize = {};

		var oDomRenderSizeDiv = $(document.getElementById(oCrosstab.getId() + "_renderSizeDiv"));
		oSize.iWidth = oDomRenderSizeDiv.outerWidth();
		oSize.iHeight = oDomRenderSizeDiv.outerHeight();

		return oSize;
	};

	this.calculateRenderSize = function (bForceRecalculate) {
		// This calculates the rendered size of the crosstab.
		// The size might be bigger than the available size, if the areas are clipped (e.g. if scrollbars are visible).
		// The size might be smaller than the available size, if not all the available space is required.
		bForceRecalculate = bForceRecalculate || false;
		if (!oRenderSizeDivSize || this.hasCrosstabSizeChanged() || bForceRecalculate) {
			oRenderSizeDivSize = {};
			var oDimHeaderAreaSize = this.getAreaSize(oDimensionHeaderArea);
			var oDataAreaSize = this.getAreaSize(oDataArea);
			var oRowHeaderAreaSize = this.getAreaSize(oRowHeaderArea);
			var oColHeaderAreaSize = this.getAreaSize(oColHeaderArea);

			var iLowerHeight = oRowHeaderArea.hasContent() ? oRowHeaderAreaSize.iHeight : oDataAreaSize.iHeight;
			var iUpperHeight = oDimensionHeaderArea.hasContent() ? oDimHeaderAreaSize.iHeight : oColHeaderAreaSize.iHeight;
			oRenderSizeDivSize.iHeight = iLowerHeight + iUpperHeight;

			var iLeftWidth = oDimensionHeaderArea.hasContent() ? oDimHeaderAreaSize.iWidth : oRowHeaderAreaSize.iWidth;
			var iRightWidth = oColHeaderArea.hasContent() ? oColHeaderAreaSize.iWidth : oDataAreaSize.iWidth;
			oRenderSizeDivSize.iWidth = iLeftWidth + iRightWidth;
		}

		return oRenderSizeDivSize;
	};

	this.getBrowserScrollbarWidth = function () {
		if (!iScrollbarWidth) {
			var inner = document.createElement('p');
			inner.style.width = "100%";
			inner.style.height = "200px";

			var outer = document.createElement('div');
			outer.style.position = "absolute";
			outer.style.top = "0px";
			outer.style.left = "0px";
			outer.style.visibility = "hidden";
			outer.style.width = "200px";
			outer.style.height = "150px";
			outer.style.overflow = "hidden";
			outer.appendChild(inner);

			document.body.appendChild(outer);
			var w1 = inner.offsetWidth;
			outer.style.overflow = 'scroll';
			var w2 = inner.offsetWidth;
			if (w1 == w2)
				w2 = outer.clientWidth;

			document.body.removeChild(outer);

			iScrollbarWidth = (w1 - w2);
				
			if(iScrollbarWidth === 0){
				//Fallback because the measuring doesn't seem to work in all browsers / themes
				//e.g. Chrome in combination with the gold reflection theme
				var parent, child;
				parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
				child = parent.children();
				iScrollbarWidth = child.innerWidth() - child.height(99).innerWidth();
				parent.remove();
			}
		}
		return iScrollbarWidth;
	};

	this.reset = function () {
		oRenderSizeDivSize = null;
	};

	this.hasCrosstabSizeChanged = function (bQueryOnly) {
		var newWidth = oCrosstab.getIntWidth();
		var newHeight = oCrosstab.getIntHeight();
		if (iCrosstabWidth !== newWidth || iCrosstabHeight !== newHeight) {
			if (!bQueryOnly) {
				iCrosstabWidth = newWidth;
				iCrosstabHeight = newHeight;
			}
			return true;
		}
		return false;
	};

	this.getLowerScrollDivHeight = function () {
		var oDomScrollDiv = null;
		if (oRowHeaderArea.hasContent()) {
			oDomScrollDiv = $(document.getElementById(oCrosstab.getId() + "_lowerLeft_scrollDiv"));
		} else {
			oDomScrollDiv = $(document.getElementById(oCrosstab.getId() + "_lowerRight_scrollDiv"));
		}
		return oDomScrollDiv.outerHeight();
	};

	this.getUpperScrollDivHeight = function () {
		var oDomScrollDiv = null;
		if (oDimensionHeaderArea.hasContent()) {
			oDomScrollDiv = $(document.getElementById(oCrosstab.getId() + "_upperLeft_scrollDiv"));
		} else {
			oDomScrollDiv = $(document.getElementById(oCrosstab.getId() + "_upperRight_scrollDiv"));
		}
		return oDomScrollDiv.outerHeight();
	};

	this.getUpperRightScrollDivWidth = function () {
		var oDomScrollDiv = $(document.getElementById(oCrosstab.getId() + "_upperRight_scrollDiv"));
		return oDomScrollDiv.outerWidth();
	};

	this.getRenderSizeDivBorders = function (oDomRenderSizeDiv) {
		if (!oRenderSizeDivBorders) {
			oRenderSizeDivBorders = {};
			oRenderSizeDivBorders.borders = {};
			if (!oDomRenderSizeDiv) {
				oDomRenderSizeDiv = $(document.getElementById(oCrosstab.getId() + "_renderSizeDiv"));
			}
			oRenderSizeDivBorders.borders.iBottomBorderWidth = parseInt(oDomRenderSizeDiv.css("border-bottom-width"),
					10) || 0;
			oRenderSizeDivBorders.borders.iRightBorderWidth = parseInt(oDomRenderSizeDiv.css("border-right-width"), 10) || 0;
			oRenderSizeDivBorders.borders.iTopBorderWidth = parseInt(oDomRenderSizeDiv.css("border-top-width"), 10) || 0;
			oRenderSizeDivBorders.borders.iLeftBorderWidth = parseInt(oDomRenderSizeDiv.css("border-left-width"), 10) || 0;
		}
		return oRenderSizeDivBorders;
	};

	this.getTableDivBordersAndPadding = function () {
		if (!oTableDivValues) {
			oTableDivValues = {};
			oTableDivValues.borders = {};
			oTableDivValues.paddings = {};

			// var oDomTableDiv = oCrosstab.getTableDiv();
			var oDomTableDiv = oDomElementProvider.getElement(oCrosstab.getId());

			oTableDivValues.borders.iBottomBorderWidth = parseInt(oDomTableDiv.css("border-bottom-width"), 10);
			oTableDivValues.borders.iRightBorderWidth = parseInt(oDomTableDiv.css("border-right-width"), 10);
			oTableDivValues.borders.iTopBorderWidth = parseInt(oDomTableDiv.css("border-top-width"), 10);
			oTableDivValues.borders.iLeftBorderWidth = parseInt(oDomTableDiv.css("border-left-width"), 10);

			oTableDivValues.paddings.iBottomPadding = parseInt(oDomTableDiv.css("padding-bottom"), 10);
			oTableDivValues.paddings.iRightPadding = parseInt(oDomTableDiv.css("padding-right"), 10);
			oTableDivValues.paddings.iTopPadding = parseInt(oDomTableDiv.css("padding-top"), 10);
			oTableDivValues.paddings.iLeftPadding = parseInt(oDomTableDiv.css("padding-left"), 10);

		}
		return oTableDivValues;
	};

	this.reset = function () {
		oRenderSizeDivBorders = null;
	};
};