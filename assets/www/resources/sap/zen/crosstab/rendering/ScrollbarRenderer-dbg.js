jQuery.sap.declare("sap.zen.crosstab.rendering.ScrollbarRenderer");
jQuery.sap.require("sap.zen.crosstab.utils.Measuring");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

sap.zen.crosstab.rendering.ScrollbarRenderer = function (oCrosstab, oRenderManager, oMeasuring, oDomElementProvider) {
	"use strict";
	var iScrollbarWidth = 0;
	var bHScrollbarVisible = false;
	var bVScrollbarVisible = false;
	var bHHeaderScrollbarVisible = false;
	var oHScrollHandler = null;
	var oVScrollHandler = null;
	var oHeaderHScrollHandler = null;
	var bIsPixelScrolling = oCrosstab.getPropertyBag().isPixelScrolling();

	function writeUpperVScrollCellContent (iUpperAreaHeight) {
		oRenderManager.write("<div");
		oRenderManager.writeAttribute("id", oCrosstab.getId() + "_upperRightPad");
		oRenderManager.writeAttribute("class", "sapzencrosstab-UpperRightScrollPad");
		oRenderManager.addStyle("width", iScrollbarWidth + "px");
		oRenderManager.addStyle("height", iUpperAreaHeight + "px");
		oRenderManager.writeStyles();
		oRenderManager.write(">");
		oRenderManager.write("</div>");
	}

	function writeLowerVScrollCellContent (iScrollDivHeight, iUpperAreaHeight) {
		var oVScrollbar = null;
		var iInitialHeight = 0;
		var iHeight = 0;
		if (!oCrosstab.getVScrollbar()) {
			oVScrollbar = new sap.ui.core.ScrollBar();
			oCrosstab.setVScrollbar(oVScrollbar);
		}
		oVScrollbar = oCrosstab.getVScrollbar();
		oVScrollbar.setVertical(true);
		
		if (bHHeaderScrollbarVisible === true && !bHScrollbarVisible) {
			iInitialHeight = $(document.getElementById(oCrosstab.getId() + "_renderSizeDiv")).outerHeight() - iScrollbarWidth;
		} else {
			iInitialHeight = iScrollDivHeight;
		}
		
		iHeight = iInitialHeight - iUpperAreaHeight;
		oVScrollbar.setSize(iHeight + "px");
		// Step determination carried out later as soon as the RenderSizeDiv size was adapted
		oRenderManager.renderControl(oVScrollbar);
	}

	function beginVScrollTableCell () {
		oRenderManager.write("<td");
		oRenderManager.writeAttribute("class", "sapzencrosstab-VScrollCell");
		oRenderManager.write(">");
	}

	function renderVScrollbarTable (iScrollDivHeight) {
		var iUpperAreaHeight = oMeasuring.getUpperScrollDivHeight();

		oRenderManager.write("<table");

		oRenderManager.writeAttribute("id", oCrosstab.getId() + "_vScrollTab");
		oRenderManager.writeAttribute("class", "sapzencrosstab-VScrollTable");
		oRenderManager.write(">");

		// first row: upper right pad
		oRenderManager.write("<tr>");
		beginVScrollTableCell();
		writeUpperVScrollCellContent(iUpperAreaHeight);
		oRenderManager.write("</td>");
		oRenderManager.write("</tr>");

		// second row: actual scrollbar
		oRenderManager.write("<tr>");
		beginVScrollTableCell();
		writeLowerVScrollCellContent(iScrollDivHeight, iUpperAreaHeight);
		oRenderManager.write("</td>");
		oRenderManager.write("</tr>");

		oRenderManager.write("</table>");
	}

	function renderVScrollbarSection () {
		// vertical section div
		oRenderManager.write("<div");
		oRenderManager.writeAttribute("id", oCrosstab.getId() + "_vScrollDiv");

		oRenderManager.addStyle("position", "absolute");
		oRenderManager.addStyle("top", "0px");
		oRenderManager.addStyle(oCrosstab.getPropertyBag().isRtl() ? "left" : "right", "0px");

		oRenderManager.addStyle("width", iScrollbarWidth + "px");

		var iHeight = oMeasuring.getRenderSizeDivSize().iHeight;
		if (bHScrollbarVisible) {
			iHeight = Math.min(oCrosstab.getContentHeight() - iScrollbarWidth, iHeight);
		}

		oRenderManager.addStyle("height", iHeight + "px");

		oRenderManager.writeStyles();
		oRenderManager.write(">");

		renderVScrollbarTable(iHeight);

		oRenderManager.write("</div>");
	}
	
	function getLeftScrollDivWidth() {
		var iWidth = 0;
		var oDiv = $(document.getElementById(oCrosstab.getId() + "_upperLeft_scrollDiv"));
		var oUtils = oCrosstab.getUtils();
		var oProp = oCrosstab.getPropertyBag();
		
		if (oDiv.length > 0) {
			iWidth = oUtils.isMsIE() || (oProp.isRtl() && oUtils.isMozilla()) ? oDiv.width() : oDiv.outerWidth();
		} 
		if (iWidth === 0) {
			oDiv = $(document.getElementById(oCrosstab.getId() + "_lowerLeft_scrollDiv"));
			iWidth = oUtils.isMsIE() || (oProp.isRtl() && oUtils.isMozilla()) ? oDiv.width() : oDiv.outerWidth();
		}
		return iWidth;
	}

	function writeLeftHScrollCellContent (iLowerLeftAreaWidth) {
		if (!bHHeaderScrollbarVisible) {
			oRenderManager.write("<div");
			oRenderManager.writeAttribute("id", oCrosstab.getId() + "_lowerLeftPad");
			oRenderManager.writeAttribute("class", "sapzencrosstab-LowerLeftScrollPad");
			oRenderManager.addStyle("width", iLowerLeftAreaWidth + "px");
			oRenderManager.addStyle("height", iScrollbarWidth + "px");
			oRenderManager.writeStyles();
			oRenderManager.write(">");
			oRenderManager.write("</div>");
		} else {
			var oHHeaderScrollbar = null;
			if (!oCrosstab.getHorizontalHeaderScrollbar()) {
				oHHeaderScrollbar = new sap.ui.core.ScrollBar();
				oCrosstab.setHorizontalHeaderScrollbar(oHHeaderScrollbar);
			}
			oHHeaderScrollbar = oCrosstab.getHorizontalHeaderScrollbar();
			oHHeaderScrollbar.setVertical(false);
			var iLeftScrollDivWidth = getLeftScrollDivWidth();
			oHHeaderScrollbar.setSize(iLeftScrollDivWidth + "px");
			oRenderManager.renderControl(oHHeaderScrollbar);
		}
	}

	function beginHScrollTableCell (bHHeaderScrollbarVisible) {
		if (bHHeaderScrollbarVisible === true) {
			oRenderManager.write("<td");
			oRenderManager.writeAttribute("id", oCrosstab.getId() + "_hScrollTableCell");
			oRenderManager.writeAttribute("class", "sapzencrosstab-HScrollCell sapzencrosstab-HScrollCellWithHeaderScrollRightBorder");
		} else {
			oRenderManager.write("<td");
			oRenderManager.writeAttribute("class", "sapzencrosstab-HScrollCell");
		}
		oRenderManager.write(">");
	}

	function writeRightHScrollCellContent () {
		oRenderManager.write("<div");
		oRenderManager.writeAttribute("id", oCrosstab.getId() + "_lowerRightPad");
		oRenderManager.writeAttribute("class", "sapzencrosstab-LowerRightScrollPad");
		oRenderManager.addStyle("width", iScrollbarWidth + "px");
		oRenderManager.addStyle("height", iScrollbarWidth + "px");
		oRenderManager.writeStyles();
		oRenderManager.write(">");
		oRenderManager.write("</div>");
	}

	function writeMiddleHScrollCellContent (iScrollDivWidth, iLowerLeftAreaWidth) {
		if (bHScrollbarVisible === true) {
		var oHScrollbar = null;
		if (!oCrosstab.getHScrollbar()) {
			oHScrollbar = new sap.ui.core.ScrollBar();
			oCrosstab.setHScrollbar(oHScrollbar);
		}
		oHScrollbar = oCrosstab.getHScrollbar();
		oHScrollbar.setVertical(false);
		oHScrollbar.setSize((iScrollDivWidth - iLowerLeftAreaWidth - (bVScrollbarVisible ? iScrollbarWidth : 0)) + "px");
		// Step determination carried out later as soon as the RenderSizeDiv size was adapted
		oRenderManager.renderControl(oHScrollbar);
		} else {
			// write a blank div
			oRenderManager.write("<div");
			oRenderManager.writeAttribute("id", oCrosstab.getId() + "_lowerMiddlePad");
			oRenderManager.writeAttribute("class", "sapzencrosstab-LowerMiddleScrollPad");
			oRenderManager.addStyle("width", (iScrollDivWidth - iLowerLeftAreaWidth - (bVScrollbarVisible ? iScrollbarWidth : 0)) + "px");
			oRenderManager.addStyle("height", iScrollbarWidth + "px");
			oRenderManager.writeStyles();
			oRenderManager.write(">");
			oRenderManager.write("</div>");
		}
	}

	function renderHScrollbarTable (iWidth) {
		var oDomLowerLeftArea = $(document.getElementById(oCrosstab.getId() + "_lowerLeft"));
		var iLowerLeftAreaWidth = oDomLowerLeftArea.outerWidth();
	
		oRenderManager.write("<table");
		oRenderManager.writeAttribute("id", oCrosstab.getId() + "_hScrollTab");
		oRenderManager.writeAttribute("class", "sapzencrosstab-HScrollTable");
		oRenderManager.write(">");

		oRenderManager.write("<tr>");

		// left padding or header scrollbar
		beginHScrollTableCell(bHHeaderScrollbarVisible);
		writeLeftHScrollCellContent(iLowerLeftAreaWidth);
		oRenderManager.write("</td>");

		// scrollbar or padding if only header scrollbar
		var iScrollDivWidth = oCrosstab.getContentWidth();
		beginHScrollTableCell();
		writeMiddleHScrollCellContent(iScrollDivWidth, iLowerLeftAreaWidth);
		oRenderManager.write("</td>");

		// right padding
		if (bVScrollbarVisible) {
			beginHScrollTableCell();
			writeRightHScrollCellContent();
			oRenderManager.write("</td>");
		}

		oRenderManager.write("</tr>");
		oRenderManager.write("</table>");
	}
	
	function renderHScrollbarSection () {
		// horizontal section div
		oRenderManager.write("<div");
		oRenderManager.writeAttribute("id", oCrosstab.getId() + "_hScrollDiv");

		oRenderManager.addStyle("position", "absolute");
		var iToolbarHeight = oCrosstab.getPropertyBag().getToolbarHeight();
		oRenderManager.addStyle("bottom", iToolbarHeight + "px");

		oRenderManager.addStyle("height", iScrollbarWidth + "px");

		var iWidth = oCrosstab.getContentWidth();
		oRenderManager.addStyle("width", iWidth + "px");
		oRenderManager.addStyle("height", iScrollbarWidth + "px");

		oRenderManager.writeStyles();
		oRenderManager.write(">");
		
		renderHScrollbarTable(iWidth);

		oRenderManager.write("</div>");
	}
	
	this.renderScrollbars = function (oScrollbarVisibility) {
		bHScrollbarVisible = oScrollbarVisibility.bHasHScrollbar;
		bVScrollbarVisible = oScrollbarVisibility.bHasVScrollbar;
		bHHeaderScrollbarVisible = oScrollbarVisibility.bHasHHeaderScrollbar;
	
		if (bHScrollbarVisible || bVScrollbarVisible || bHHeaderScrollbarVisible) {
			iScrollbarWidth = oMeasuring.getBrowserScrollbarWidth();
			
			if (iScrollbarWidth === 0) {
				/*
				 * Performance optimization: On the iPad there are no scrollbars, the width is 0.
				 * Therefore, we don't need to render the scrollbars. However, we need the sap.ui.core.ScrollBar
				 * because the scroll state is handled within those objects. 
				 */
				if (bVScrollbarVisible) {
					var oVScrollbar = new sap.ui.core.ScrollBar();
					oCrosstab.setVScrollbar(oVScrollbar);
				}
				if (bHScrollbarVisible) {
					var oHScrollbar = new sap.ui.core.ScrollBar();
					oCrosstab.setHScrollbar(oHScrollbar);
				}
				if (bHHeaderScrollbarVisible) {
					var oHHeaderScrollbar = new sap.ui.core.ScrollBar();
					oCrosstab.setHorizontalHeaderScrollbar(oHHeaderScrollbar);
				}
			} else {
				var oTableDiv = oDomElementProvider.getElement(oCrosstab.getId());
				var sInnerHtml = oTableDiv.html();
				if (bVScrollbarVisible) {
					renderVScrollbarSection();
				}
				if (bHScrollbarVisible || bHHeaderScrollbarVisible) {
					renderHScrollbarSection();
				}
				oRenderManager.write(sInnerHtml);
				oRenderManager.flush(oTableDiv[0]);
			}
		}
	};

	this.attachHandlers = function (poHScrollHandler, poVScrollHandler, poHeaderHScrollHandler) {
		this.detachHandlers();

		oHScrollHandler = poHScrollHandler;
		oVScrollHandler = poVScrollHandler;
		oHeaderHScrollHandler = poHeaderHScrollHandler;

		if (oHScrollHandler && oCrosstab.getHScrollbar()) {
			oCrosstab.getHScrollbar().attachScroll(oHScrollHandler);
			oCrosstab.getHScrollbar().attachBrowserEvent("mousedown touchstart",
					sap.zen.crosstab.utils.Utils.cancelEvent);
		}
		if (oVScrollHandler && oCrosstab.getVScrollbar()) {
			oCrosstab.getVScrollbar().attachScroll(oVScrollHandler);
			oCrosstab.getVScrollbar().attachBrowserEvent("mousedown touchstart",
					sap.zen.crosstab.utils.Utils.cancelEvent);
			
			this.attachMouseWheelHandler();
		}
		if (oHeaderHScrollHandler && oCrosstab.getHorizontalHeaderScrollbar()) {
			oCrosstab.getHorizontalHeaderScrollbar().attachScroll(oHeaderHScrollHandler);
			oCrosstab.getHorizontalHeaderScrollbar().attachBrowserEvent("mousedown touchstart",
					sap.zen.crosstab.utils.Utils.cancelEvent);
		}
	};
	
	this.attachMouseWheelHandler = function () {
		if (!oCrosstab.getPropertyBag().isMobileMode()) {
			var oTableDiv = oCrosstab.getTableDiv();
			if (/Firefox/i.test(navigator.userAgent)) {
				oTableDiv[0].addEventListener("DOMMouseScroll", this.vScrollMouseWheelFireFox);
			} else {
				oTableDiv.on("mousewheel", this.vScrollMouseWheel);
			}
		}
	};

	this.detachMouseWheelHandler = function () {
		if (!oCrosstab.getPropertyBag().isMobileMode()) {
			var oTableDiv = oCrosstab.getTableDiv();
			if (/Firefox/i.test(navigator.userAgent)) {
				oTableDiv[0].removeEventListener("DOMMouseScroll", this.vScrollMouseWheelFireFox);
			} else {
				oTableDiv.off("mousewheel", this.vScrollMouseWheel);
			}
		}
	};
	
	function sign(number) {
		return number && number / Math.abs(number);
	}
	
	this.vScrollMouseWheelFireFox = function(e) {
		var iFactor = sign(e.detail);
		mouseWheelScroll(e, iFactor);		
	};
	
	this.vScrollMouseWheel = function(e) {
		var iFactor = -sign(e.originalEvent.wheelDelta);
		mouseWheelScroll(e, iFactor);
	};
	
	function mouseWheelScroll (e, iFactor) {
		if (oCrosstab.hasLoadingPages() === false) {
			var iStepSize = 0;
			var iUpperLimit = 0;
			if (bIsPixelScrolling === true) {
				iStepSize = 120;
				iUpperLimit = parseInt(oCrosstab.getVScrollbar().getContentSize(), 10);
			} else {
				iStepSize = 3;
				iUpperLimit = oCrosstab.getVScrollbar().getSteps();
			}
			var iNewScrollPos = oCrosstab.getVScrollPos() + iFactor * iStepSize;
			iNewScrollPos = Math.max(0, iNewScrollPos);
			iNewScrollPos = Math.min(iNewScrollPos, iUpperLimit);
			// use timing otherwise we are going to run into all sorts of problems (performance, stability ...)
			oCrosstab.getRenderEngine().scrollVertical(iNewScrollPos, true);
		}
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
	}

	this.detachHandlers = function () {
		if (oHScrollHandler && oCrosstab.getHScrollbar()) {
			oCrosstab.getHScrollbar().detachScroll(oHScrollHandler);
			oCrosstab.getHScrollbar().detachBrowserEvent("mousedown touchstart",
					sap.zen.crosstab.utils.Utils.cancelEvent);
		}
		if (oVScrollHandler && oCrosstab.getVScrollbar()) {
			oCrosstab.getVScrollbar().detachScroll(oVScrollHandler);
			oCrosstab.getVScrollbar().detachBrowserEvent("mousedown touchstart",
					sap.zen.crosstab.utils.Utils.cancelEvent);
			
			this.detachMouseWheelHandler();
		}
		if (oHeaderHScrollHandler && oCrosstab.getHorizontalHeaderScrollbar()) {
			oCrosstab.getHorizontalHeaderScrollbar().detachScroll(oHeaderHScrollHandler);
			oCrosstab.getHorizontalHeaderScrollbar().detachBrowserEvent("mousedown touchstart",
					sap.zen.crosstab.utils.Utils.cancelEvent);
		}
		oHScrollHandler = null;
		oVScrollHandler = null;
		oHeaderHScrollHandler = null;
	};

	this.destroy = function () {
		this.detachHandlers();
		iScrollbarWidth = 0;
		bHScrollbarVisible = false;
		bVScrollbarVisible = false;
		oHScrollHandler = null;
		oVScrollHandler = null;
	};

	this.setScrollbarSteps = function () {
		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			this.setScrollbarStepsInPixelMode();
		} else {
			this.setScrollbarStepsInStepMode();
		}
		if (bHHeaderScrollbarVisible) {
			this.setHorizontalHeaderScrollbarSteps();
		}
	};
	
	this.setHorizontalHeaderScrollbarSteps = function() {
		var oHeaderHScrollbar = oCrosstab.getHorizontalHeaderScrollbar();
		if (oHeaderHScrollbar) {
			var sDivId = null;
			if (oCrosstab.hasDimensionHeaderArea()) {
				sDivId = oCrosstab.getId() + "_dimHeaderArea_container";
			} else if (oCrosstab.hasRowHeaderArea()) {
				sDivId = oCrosstab.getId() + "_rowHeaderArea_container";
			}
			if (sDivId) {
				var oJqDiv = $(document.getElementById(sDivId));
				oHeaderHScrollbar.setContentSize(oJqDiv.outerWidth() + "px");
				oHeaderHScrollbar.rerender();
			}
		}
	};
	
	this.adjustHorizontalHeaderScrollbarContainerSize = function() {	
		var oHHeaderScrollbar = oCrosstab.getHorizontalHeaderScrollbar();
		if (oHHeaderScrollbar) {
			var oTd = $(document.getElementById(oCrosstab.getId() + "_hScrollTableCell"));
			if (oTd.length > 0) {
				var iWidthCorrection = parseInt(oTd.css("border-right-width"), 10)
						+ parseInt(oTd.css("border-left-width"), 10);
				oHHeaderScrollbar.setSize((parseInt(oHHeaderScrollbar.getSize(), 10) - iWidthCorrection) + "px");
				oHHeaderScrollbar.rerender();
			}
		}
	};

	this.setScrollbarStepsInPixelMode = function () {
		var oVScrollbar = oCrosstab.getVScrollbar();
		var oHScrollbar = oCrosstab.getHScrollbar();
		var oDomDataArea = $(document.getElementById(oCrosstab.getId() + "_dataArea_container"));
		if (oVScrollbar) {
			var iHeight = 0;
			if(!oCrosstab.hasDataArea()){
				//Can happen in scenarios where there is no data area, but only a header area.
				//See customer message 0120025231 0000377482 2013
				var oDomRowHeaderArea = $(document.getElementById(oCrosstab.getId() + "_rowHeaderArea_container"));
				iHeight = oDomRowHeaderArea.outerHeight();
			} else {
				iHeight = oDomDataArea.outerHeight();
			}
			oVScrollbar.setContentSize(iHeight + "px");
			oVScrollbar.rerender();
		}
		if (oHScrollbar) {
			var iWidth = 0;
			if(!oCrosstab.hasDataArea()){
				//Can happen in scenarios where there is no data area, but only a header area.
				//See customer message 0120025231 0000377482 2013
				var oDomColHeaderArea = $(document.getElementById(oCrosstab.getId() + "_colHeaderArea_container"));
				iWidth = oDomColHeaderArea.outerWidth();
			} else {
				iWidth = oDomDataArea.outerWidth();
			}
			oHScrollbar.setContentSize(iWidth + "px");
			oHScrollbar.rerender();
		}
	};

	this.setScrollbarStepsInStepMode = function () {
		var oRenderSizeDivSize = oMeasuring.getRenderSizeDivSize();
		var oDataArea = oCrosstab.getDataArea();
		var oVScrollbar = oCrosstab.getVScrollbar();
		var oHScrollbar = oCrosstab.getHScrollbar();
		if (oVScrollbar) {
			var iColHeaderAreaHeight = oMeasuring.getAreaHeight(oCrosstab.getColumnHeaderArea());
			var iAvailableHeightForRows = oRenderSizeDivSize.iHeight - iColHeaderAreaHeight;
			var iRenderStartRow = oDataArea.getRenderStartRow();
			var iMaxEndRow = iRenderStartRow + oDataArea.getRenderRowCnt();
			var iRowCnt = 1;

			for ( var iRow = iRenderStartRow; iRow < iMaxEndRow; iRow++) {
				iAvailableHeightForRows -= oDataArea.getRowHeight(iRow);
				if (iAvailableHeightForRows < 0) {
					break;
				}
				iRowCnt++;
			}
			oVScrollbar.setSteps(Math.max(1, oDataArea.getRowCnt() - iRowCnt));
			oVScrollbar.rerender();
		}
		if (oHScrollbar) {
			var iRowHeaderAreaWidth = oMeasuring.getAreaWidth(oCrosstab.getRowHeaderArea());
			var iAvailableWidthForCols = oRenderSizeDivSize.iWidth - iRowHeaderAreaWidth;
			var iRenderStartCol = oDataArea.getRenderStartCol();
			var iMaxEndCol = iRenderStartCol + oDataArea.getRenderColCnt();
			var iColCnt = 1;

			for ( var iCol = iRenderStartCol; iCol < iMaxEndCol; iCol++) {
				iAvailableWidthForCols -= oDataArea.getColWidth(iCol);
				if (iAvailableWidthForCols < 0) {
					break;
				}
				iColCnt++;
			}
			oHScrollbar.setSteps(Math.max(1, oDataArea.getColCnt() - iColCnt));
			oHScrollbar.rerender();
		}
	};
	
	this.adjustHScrollbarWidth = function(iScrollPadWidth){
		var oDomLowerLeftPad = $(document.getElementById(oCrosstab.getId() + '_lowerLeftPad'));
		var oDomLowerRightScrollDiv = $(document.getElementById(oCrosstab.getId() + '_lowerRight_scrollDiv'));
		oDomLowerLeftPad.width(iScrollPadWidth);
		
		var oHScrollbar = oCrosstab.getHScrollbar();
		oHScrollbar.setSize(oDomLowerRightScrollDiv.outerWidth() + "px");
		oHScrollbar.rerender();
	};
	
	this.adjustVScrollbarHeight = function(iScrollPadHeight){
		var oDomUpperRightPad = $(document.getElementById(oCrosstab.getId() + '_upperRightPad'));
		var oDomLowerRightScrollDiv = $(document.getElementById(oCrosstab.getId() + '_lowerRight_scrollDiv'));
		oDomUpperRightPad.height(iScrollPadHeight);
		
		var oVScrollbar = oCrosstab.getVScrollbar();
		oVScrollbar.setSize(oDomLowerRightScrollDiv.outerHeight() + "px");
		oVScrollbar.rerender();
	};


};