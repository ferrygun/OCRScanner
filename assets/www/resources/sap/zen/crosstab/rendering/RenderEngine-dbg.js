jQuery.sap.declare("sap.zen.crosstab.rendering.RenderEngine");
jQuery.sap.require("sap.zen.crosstab.rendering.ScrollbarRenderer");
jQuery.sap.require("sap.zen.crosstab.rendering.ScrollManager");
jQuery.sap.require("sap.zen.crosstab.rendering.DomElementProvider");
jQuery.sap.require("sap.zen.crosstab.utils.Measuring");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.rendering.CrossRequestManager");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

sap.zen.crosstab.rendering.RenderEngine = function (oCrosstab) {
	"use strict";
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oDataArea = oCrosstab.getDataArea();
	var oRenderManager = null;
	var oScrollbarRenderer = null;
	var oResizeDiv = null;
	var oTableDiv = null;
	var oResizeFrame = null;
	var sLoadingTimerId = "";
	var bIsLoadingAnimationVisible = false;
	var aNewScrollbarEventHandlers = [];

	var oDomElementProvider = new sap.zen.crosstab.rendering.DomElementProvider();
	var oMeasuring = new sap.zen.crosstab.utils.Measuring(oCrosstab, oDomElementProvider);

	var oCrossRequestManager = new sap.zen.crosstab.rendering.CrossRequestManager(oCrosstab, this);
	var oScrollManager = null;
	var oHeaderScrollManager = null;
	var bIsIE8 = false;

	var bDeferredVScrollPosDetermination = false;

	var oScrollbarVisibility = {
		bHasHScrollbar: false,
		bHasVScrollbar: false,
		bHasHHeaderScrollbar: false
	};

	var aAfterFinishRenderingHandlers = [];

	var bAdjustFrameDivs = true;

	var bDivSizesValid = false;

	var iRenderSizeDivOrigBottom = -1;
	
	var iCurrentHeaderWidthLimit = -1;
	
	var iCurrentHeaderWidth = 0;
	
	var bIsMsIE = false;
	
	//var sTitleDivId = oCrosstab.getId() + "_titleDiv";
		
	this.isIE8Mode = function () {
		return bIsIE8;
	};

	this.renderResizeOutline = function () {
		if ((oCrosstab.getWidth() === "auto" && oCrosstab.hResize())
				|| (oCrosstab.getHeight() === "auto" && oCrosstab.vResize())) {
			var sCrosstabId = oCrosstab.getId();
			var sDivId = sCrosstabId + "_resizeDiv";
			var sFrameId = sCrosstabId + "_resizeFrame";
			var iTopBorder = 0;
			var iLeftBorder = 0;

			oTableDiv = oDomElementProvider.getElement(sCrosstabId);
			if (oTableDiv && oTableDiv[0]) {

				oTableDiv.css("overflow", "hidden");
				var oTableDivData = oMeasuring.getTableDivBordersAndPadding();
				iTopBorder = oTableDivData.borders.iTopBorderWidth;
				iLeftBorder = oTableDivData.borders.iLeftBorderWidth;

				oResizeDiv = jQuery.sap.byId(sDivId);
				oResizeDiv.css("visibility", "visible");
				oResizeDiv.css("top", -iTopBorder + "px");
				oResizeDiv.css("left", -iLeftBorder + "px");

				oResizeFrame = jQuery.sap.byId(sFrameId);
				oResizeFrame.css("width", oCrosstab.getIntWidth() + "px");
				oResizeFrame.css("height", oCrosstab.getIntHeight() + "px");
				oResizeFrame.css("top", -iTopBorder + "px");
				oResizeFrame.css("left", -iLeftBorder + "px");
				oResizeFrame.css("visibility", "visible");

				var oHScrollTab = oTableDiv.find("#" + $.sap.encodeCSS(oCrosstab.getId() + "_hScrollTab"));
				if (oHScrollTab && oHScrollTab.length > 0) {
					oHScrollTab.appendTo(oResizeFrame);
					oHScrollTab.css("position", "absolute");
					var iToolbarHeight = oCrosstab.getPropertyBag().getToolbarHeight();
					oHScrollTab.css("bottom", iToolbarHeight + "px");
					oHScrollTab.css("left", "0px");
				}

				var oVScrollTab = oTableDiv.find("#" + $.sap.encodeCSS(oCrosstab.getId() + "_vScrollTab"));
				if (oVScrollTab && oVScrollTab.length > 0) {
					oVScrollTab.appendTo(oResizeFrame);
					oVScrollTab.css("position", "absolute");
					oVScrollTab.css("top", "0px");
					oVScrollTab.css(oCrosstab.getPropertyBag().isRtl() ? "left" : "right", "0px");
				}

				if (oCrosstab.getPropertyBag().hasToolbar()) {
					var oToolbar = oTableDiv.find("#" + $.sap.encodeCSS(oCrosstab.getId() + "_toolbar"));
					if (oToolbar && oToolbar.length > 0) {
						oToolbar.appendTo(oResizeFrame);
						oToolbar.css("position", "absolute");
						oToolbar.css("left", "0px");
						oToolbar.css("bottom", "0px");
					}
				}

			}
		}
	};

	this.removeResizeOutline = function () {
		if (oResizeDiv) {
			oResizeDiv.css("visibility", "hidden");
			oResizeDiv = null;
		}
		if (oTableDiv) {
			oTableDiv.css("overflow", "hidden");
			oTableDiv = null;
		}
		if (oResizeFrame) {
			oResizeFrame.css("visibility", "hidden");
			oResizeFrame = null;
		}
	};

	this.addAfterFinishRenderingHandler = function (fHandler) {
		if ($.inArray(fHandler, aAfterFinishRenderingHandlers) === -1) {
			aAfterFinishRenderingHandlers.push(fHandler);
		}
	};

	this.removeAfterFinishRenderingHandler = function (fHandler) {
		var iIndex = $.inArray(fHandler, aAfterFinishRenderingHandlers);
		if (iIndex !== -1) {
			aAfterFinishRenderingHandlers.splice(iIndex, 1);
		}
	};

	this.removeAllAfterFinishRenderingHandlers = function () {
		aAfterFinishRenderingHandlers = [];
	};

	this.renderCell = function (oArea, iRow, iCol) {
		var oCell = oArea.getCell(iRow, iCol);
		if (oCell) {
			oRenderManager.renderControl(oCell);
		}
		return oCell;
	};

	this.renderArea = function (oArea, iStartRow, iRowCnt, iStartCol, iColCnt, sRowStyle) {
		if (!iStartRow) {
			iStartRow = 0;
		}
		if (!iRowCnt) {
			iRowCnt = 0;
		}
		if (!iStartCol) {
			iStartCol = 0;
		}
		if (!iColCnt) {
			iColCnt = 0;
		}

		var iEndRow = iStartRow + iRowCnt;
		var iEndCol = iStartCol + iColCnt;

		var iRow = 0;
		var iCol = 0;
		
		// Plausibility check to avoid empty <tr> tags
		// so that any appendRows() logic can work if needed
		iEndRow = Math.min(iEndRow, oArea.getRowCnt());
		iEndCol = Math.min(iEndCol, oArea.getColCnt());

		for (iRow = iStartRow; iRow < iEndRow; iRow++) {
			if (sRowStyle) {
				oRenderManager.write("<tr");
				oRenderManager.writeAttribute("class", sRowStyle);
				oRenderManager.write(">");
			} else {
				oRenderManager.write("<tr>");
			}
			for (iCol = iStartCol; iCol < iEndCol; iCol++) {
				this.renderCell(oArea, iRow, iCol);
			}
			oRenderManager.write("</tr>");
		}
	};

	this.setDeferredVScrollPosDetermination = function (bDeferredVScrollPosDet) {
		bDeferredVScrollPosDetermination = bDeferredVScrollPosDet;
	};

	function determineIsIE8 () {
		bIsIE8 = false;
		if ($.browser.msie) {
			if ($.browser.version.substring(0, 2) === "8.") {
				bIsIE8 = true;
			}
			if ($.browser.fVersion && $.browser.fVersion === 8) {
				// a browser newer than IE8 but run in IE8 document mode
				bIsIE8 = true;
			}
			// alert("Version: " + $.browser.version + "\nfVersion: " + $.browser.fVersion);
		}
	}
	
	this.beginRendering = function () {
		oCrosstab.block();
		determineIsIE8();
		bIsMsIE = oCrosstab.getUtils().isMsIE();
		oRenderManager = sap.ui.getCore().createRenderManager();
		initDomElementProvider();
		oTableDiv = oDomElementProvider.getElement(oCrosstab.getId());
		oTableDiv.css("visibility", (oCrosstab.getPropertyBag().isDebugMode() === true) ? "visible" : "hidden");

		if (oCrossRequestManager.hasSavedInfo()) {
			var oHScrollInfo = oCrossRequestManager.getSavedHScrollInfo();
			if (oHScrollInfo) {
				oColHeaderArea.setRenderStartCol(oHScrollInfo.iPos);
				if (oHScrollInfo.bScrolledToEnd) {
					oColHeaderArea.setRenderColCnt(oColHeaderArea.getColCnt() - oColHeaderArea.getRenderStartCol());
				}
				oCrossRequestManager.restoreColWidths();
			}
			var oVScrollInfo = oCrossRequestManager.getSavedVScrollInfo();
			if (oVScrollInfo) {
				oRowHeaderArea.setRenderStartRow(oVScrollInfo.iPos);
				if (oVScrollInfo.bScrolledToEnd) {
					oRowHeaderArea.setRenderRowCnt(oRowHeaderArea.getRowCnt() - oRowHeaderArea.getRenderStartRow());
				}
			}
		}
	};
	
	this.finishRendering = function (bFromScrolling) {
		var i = 0;
		var fHandler = null;
		var oDragDropHandler;
		var oHeaderInfo;
		
		this.showLoadingVisualization();

		if (oRenderManager) {
			oRenderManager.destroy();
		}
		oRenderManager = null;

		oMeasuring.reset();

		oTableDiv = oDomElementProvider.getElement(oCrosstab.getId());
		oTableDiv.css("visibility", "visible");
		oCrossRequestManager.savedInfoHandled();
		oCrosstab.restoreFocusOnCell();
		this.setDivSizeValidity();
		
		var oSelectionHandler = oCrosstab.getSelectionHandler();
		if(oSelectionHandler){
			oSelectionHandler.ensureCellsSelected();
		}

		// Needs to be done here since we operate with cloning areas
		// during row/col-based scrolling as well which triggers a
		// re-rendering out of the scroll handler.
		// D&D events need to be (re)-attached
		if (!oCrosstab.hasLoadingPages() && oCrosstab.hasData()) {
			oHeaderInfo = oCrosstab.getHeaderInfo();
			if (oHeaderInfo) {
				oHeaderInfo.setupPivotCell();
			}
			oDragDropHandler = oCrosstab.getDragDropHandler();
			if (oDragDropHandler && oCrosstab.getPropertyBag().isDragDropEnabled()) {
				oDragDropHandler.initDragDrop(bFromScrolling);
			}
			if (bFromScrolling && oCrosstab.getColResizer() && oCrosstab.getPropertyBag().isEnableColResize()) {
				oCrosstab.getColResizer().initialize();
			}
		}

		for (i = 0; i < aAfterFinishRenderingHandlers.length; i++) {
			fHandler = aAfterFinishRenderingHandlers[i];
			if (fHandler) {
				fHandler();
			}
		}
		oCrosstab.unblock();
	};

	this.renderDimensionHeaderArea = function () {
		var iRenderStartRow = 0;
		var iRenderRowCnt = oDimensionHeaderArea.getRowCnt();
		var iRenderStartCol = 0;
		var iRenderColCnt = oDimensionHeaderArea.getColCnt();

		this.renderArea(oDimensionHeaderArea, iRenderStartRow, iRenderRowCnt, iRenderStartCol, iRenderColCnt,
				"sapzencrosstab-HeaderRow");
		oDimensionHeaderArea.setRenderSize(iRenderStartRow, iRenderRowCnt, iRenderStartCol, iRenderColCnt);
		oRenderManager.flush(oDomElementProvider.getElement(oDimensionHeaderArea.getId())[0]);
	};

	this.renderDataArea = function () {
		var iRenderStartRow = 0;
		var iRenderRowCnt = 0;
		var iRenderStartCol = 0;
		var iRenderColCnt = 0;

		// Need to check if there is a data area without column header or without row header area.
		// Example: only measures in rows or columns which can typically be found with initial drilldown states
		if (oRowHeaderArea.hasContent()) {
			iRenderStartRow = oRowHeaderArea.getRenderStartRow();
			iRenderRowCnt = oRowHeaderArea.getRenderRowCnt();
		} else {
			iRenderStartRow = 0;
			iRenderRowCnt = oDataArea.getRowCnt();
		}

		if (oColHeaderArea.hasContent()) {
			iRenderStartCol = oColHeaderArea.getRenderStartCol();
			iRenderColCnt = oColHeaderArea.getRenderColCnt();
		} else {
			iRenderStartCol = 0;
			iRenderColCnt = oDataArea.getColCnt();
		}

		var iVerticalOverlap = getVerticalScrollingOverlap(iRenderStartRow, iRenderRowCnt, iRenderStartCol,
				iRenderColCnt);
		var iHorizontalOverlap = getHorizontalScrollingOverlap(iRenderStartRow, iRenderRowCnt, iRenderStartCol,
				iRenderColCnt);

		if (iVerticalOverlap) {
			removeDataAreaRows(iVerticalOverlap);
			renderRemainingDataAreaRows(iVerticalOverlap, iRenderStartRow, iRenderRowCnt, iRenderStartCol,
					iRenderColCnt, this);
		} else if (iHorizontalOverlap) {
			removeDataAreaCols(iHorizontalOverlap);
			renderRemainingDataAreaCols(iHorizontalOverlap, iRenderStartRow, iRenderRowCnt, iRenderStartCol,
					iRenderColCnt, this);
			oRenderManager.flush(oDomElementProvider.getElement(oDataArea.getId())[0]);
		} else {
			this.renderArea(oDataArea, iRenderStartRow, iRenderRowCnt, iRenderStartCol, iRenderColCnt);
			oRenderManager.flush(oDomElementProvider.getElement(oDataArea.getId())[0]);
		}

		oDataArea.setRenderSize(iRenderStartRow, iRenderRowCnt, iRenderStartCol, iRenderColCnt);
	};

	function getVerticalScrollingOverlap (iRenderStartRow, iRenderRowCnt, iRenderStartCol, iRenderColCnt) {
		if (iRenderStartCol !== oDataArea.getRenderStartCol() || iRenderColCnt !== oDataArea.getRenderColCnt()
				|| iRenderRowCnt !== oDataArea.getRenderRowCnt()) {
			return 0;
		}

		var oldEndRow = oDataArea.getRenderStartRow() + oDataArea.getRenderRowCnt();
		var newEndRow = iRenderStartRow + iRenderRowCnt;

		// positive: scrolling down
		// negative: scrolling up
		var newRows = newEndRow - oldEndRow;

		if (Math.abs(newRows) < iRenderRowCnt) {
			return newRows;
		}

		return 0;
	}

	function getHorizontalScrollingOverlap (iRenderStartRow, iRenderRowCnt, iRenderStartCol, iRenderColCnt) {
		if (iRenderStartRow !== oDataArea.getRenderStartRow() || iRenderRowCnt !== oDataArea.getRenderRowCnt()
				|| iRenderColCnt !== oDataArea.getRenderColCnt()) {
			return 0;
		}

		var oldEndCol = oDataArea.getRenderStartCol() + oDataArea.getRenderColCnt();
		var newEndCol = iRenderStartCol + iRenderColCnt;

		// positive: scrolling right
		// negative: scrolling left
		var newCols = newEndCol - oldEndCol;

		if (Math.abs(newCols) < iRenderColCnt) {
			return newCols;
		}

		return 0;
	}
	
	function cloneArea(oJqArea) {
		var oJqCloneArea = null;
		var aCells;
				
		if (bIsMsIE === true) {
			if (oCrosstab.getPropertyBag().isDragDropEnabled() === true) {
				aCells = oJqArea.find("td");
				$.each(aCells, function(iIndex, oDomCell) {
					var oJqCell = $(oDomCell);
					
					if (oJqCell.data("ui-draggable")) {
						oJqCell.draggable("destroy");
					}
					if (oJqCell.data("ui-droppable")) {
						oJqCell.droppable("destroy");
					}
					oJqCell.off();
				});
			}
			// this is needed to fix IE ellipsis problem due to too small cells :-(
			// must keep ieFixApplied data
			oJqCloneArea = oJqArea.clone(true).off();		
		} else {
			oJqCloneArea = oJqArea.clone();
		}
		
		return oJqCloneArea;
	}

	function removeDataAreaRows (iOverlap) {
		var oDomDataArea = $(document.getElementById(oDataArea.getId()));
		var oDomDataAreaClone = cloneArea(oDomDataArea);
		var oDomDataAreaTBody = $(oDomDataAreaClone[0].firstChild);
		var oTrs = oDomDataAreaTBody.find('> tr');

		if (iOverlap > 0) {
			// remove rows from the top
			for (var i = 0; i < iOverlap; i++) {
				$(oTrs[i]).remove();
			}

		} else {
			// remove rows from the bottom
			var iTrs = oTrs.length;
			for (var i = iTrs + iOverlap; i < iTrs; i++) {
				$(oTrs[i]).remove();
			}
		}

		oDomDataArea.replaceWith(oDomDataAreaClone);
		oDomElementProvider.addElement(oDataArea.getId(), $(document.getElementById(oDataArea.getId())));

	}

	function removeDataAreaCols (iOverlap) {
		var oDomDataArea = $(document.getElementById(oDataArea.getId()));
		var oDomDataAreaClone = cloneArea(oDomDataArea);
		var oDomDataAreaTBody = $(oDomDataAreaClone[0].firstChild);
		var oTrs = oDomDataAreaTBody.find('> tr');
		var iNumberOfRows = oTrs.length;

		if (iOverlap > 0) {
			// remove cols from left
			for (var i = 0; i < iNumberOfRows; i++) {
				var oTds = $(oTrs[i]).find("> td");
				for (var j = 0; j < iOverlap; j++) {
					$(oTds[j]).remove();
				}
			}
		} else {
			// remove cols from right
			for (var i = 0; i < iNumberOfRows; i++) {
				var oTds = $(oTrs[i]).find("> td");
				var iEndCol = oTds.length - Math.abs(iOverlap) - 1;
				for (var j = oTds.length - 1; j > iEndCol; j--) {
					$(oTds[j]).remove();
				}
			}
		}
		oDomDataArea.replaceWith(oDomDataAreaClone);
		oDomElementProvider.addElement(oDataArea.getId(), $(document.getElementById(oDataArea.getId())));
	}

	function renderRemainingDataAreaRows (iOverlap, iRenderStartRow, iRenderRowCnt, iRenderStartCol, iRenderColCnt,
			that) {
		var oDomDataAreaTBody = $(document.getElementById(oDataArea.getId()).firstChild);
		var sHtml = oDomDataAreaTBody.html();
		var iNewRowCnt = Math.abs(iOverlap);
		var iNewStartRow;

		if (iOverlap > 0) {
			// the old rows need to be rendered before the new ones
			oRenderManager.write(sHtml);
			iNewStartRow = iRenderRowCnt + iRenderStartRow - iOverlap;
			that.renderArea(oDataArea, iNewStartRow, iNewRowCnt, iRenderStartCol, iRenderColCnt);
		} else {
			// the new rows need to be rendered before the old ones
			iNewStartRow = iRenderStartRow;
			that.renderArea(oDataArea, iNewStartRow, iNewRowCnt, iRenderStartCol, iRenderColCnt);
			oRenderManager.write(sHtml);
		}

		oRenderManager.flush(oDomDataAreaTBody[0]);
	}

	function renderRemainingDataAreaCols (iOverlap, iRenderStartRow, iRenderRowCnt, iRenderStartCol, iRenderColCnt,
			that) {

		var oDomDataAreaTBody = $(document.getElementById(oDataArea.getId()).firstChild);
		var iNewStartCol;

		var oTrs = oDomDataAreaTBody.find("> tr");

		if (iOverlap > 0) {
			// the new cols need to be put right from the remaining ones
			iNewStartCol = iRenderStartCol + iRenderColCnt - iOverlap;
			for (var i = 0; i < oTrs.length; i++) {
				var oTr = $(oTrs[i]);
				var sInnerHtml = oTr.html();
				oRenderManager.write("<tr>");
				oRenderManager.write(sInnerHtml);

				for (var iCol = iNewStartCol; iCol < iRenderStartCol + iRenderColCnt; iCol++) {
					oRenderManager.renderControl(oDataArea.getCell(iRenderStartRow + i, iCol));
				}

				oRenderManager.write("</tr>");
			}

		} else {
			// the new cols need to be put left from the remaining ones
			iNewStartCol = iRenderStartCol;
			for (var i = 0; i < oTrs.length; i++) {
				var oTr = $(oTrs[i]);
				var sInnerHtml = oTr.html();
				oRenderManager.write("<tr>");

				for (var iCol = iNewStartCol; iCol < iNewStartCol - iOverlap; iCol++) {
					oRenderManager.renderControl(oDataArea.getCell(iRenderStartRow + i, iCol));
				}
				oRenderManager.write(sInnerHtml);
				oRenderManager.write("</tr>");
			}
		}

	}

	this.renderColHeaderArea = function (iRenderStartCol, bUseFullContentWidth) {
		var sInnerHtml = "";
		var iStartCol = 0;
		var iColOffset = 0;
		var oDomColHeaderArea = oDomElementProvider.getElement(oColHeaderArea.getId());
		var iDimensionHeaderAreaWidth = oMeasuring.getAreaWidth(oDimensionHeaderArea);
		var iTotalWidth = 0;
		var iAvailableWidth = oCrosstab.getContentWidth();
		var iColHeaderAreaColCnt = oColHeaderArea.getColCnt();
		var iMaxColOffset = 0;
		var iEffectiveWidth = 0;
		var iRow, iAdjustedColWidth;
		var sRowId, sRowHtml;
		var oDomRow;
		var iRowCnt = oColHeaderArea.getRowCnt();
		var iBlockRenderColCnt = 0;
		var iBlockRenderStartCol = iStartCol;
		var iBlockRenderUpperLimit;
		var sRowIdBase = oCrosstab.getId() + "_ColHeaderRow_";
		var checkFunclet = null;

		if (!bUseFullContentWidth) {
			iAvailableWidth -= iDimensionHeaderAreaWidth;
		} 
		
		if (!oCrosstab.getPropertyBag().isDebugMode()) {
			oDomColHeaderArea.hide();
		}
		oDomColHeaderArea.html("");

		var bHScrolledToEnd = false;

		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			checkFunclet = conditionRenderAreaFull;
			iStartCol = 0;
			iMaxColOffset = iColHeaderAreaColCnt;
		} else {
			checkFunclet = conditionRenderArea;
			iStartCol = iRenderStartCol;
			iMaxColOffset = iColHeaderAreaColCnt - iStartCol;
			bHScrolledToEnd = this.isHScrolledToEnd();
		}

		while (checkFunclet(iColOffset, iMaxColOffset, iEffectiveWidth, iAvailableWidth, bHScrolledToEnd)) {
			sInnerHtml = oDomColHeaderArea[0].innerHTML;
			if (!sInnerHtml) {
				// We need to render the initial <tr>s
				prepareColHeaderRows(oDomColHeaderArea);
			}
			iBlockRenderStartCol = iStartCol + iColOffset;
			iBlockRenderColCnt = 0;
			iAdjustedColWidth = oColHeaderArea.getFinalColWidth(iBlockRenderStartCol);

			if (!iAdjustedColWidth) {
				iBlockRenderColCnt++;
			}
			while (checkFunclet(iColOffset, iMaxColOffset, iEffectiveWidth, iAvailableWidth, bHScrolledToEnd)
					&& iAdjustedColWidth) {
				// Find a block of cols that already have been measured (we can render them at once instead of measuring
				// every time)
				iColOffset++;
				iEffectiveWidth += iAdjustedColWidth;
				iAdjustedColWidth = oColHeaderArea.getFinalColWidth(iStartCol + iColOffset);
				iBlockRenderColCnt++;
			}

			iBlockRenderUpperLimit = iBlockRenderStartCol + iBlockRenderColCnt;

			for (iRow = 0; iRow < iRowCnt; iRow++) {
				sRowId = sRowIdBase + iRow;
				oDomRow = oDomColHeaderArea.find("#" + $.sap.encodeCSS(sRowId))[0];
				sRowHtml = oDomRow.innerHTML;

				oRenderManager.write("<tr id=\"" + sRowId + "\" class=\"sapzencrosstab-HeaderRow\">");
				oRenderManager.write(sRowHtml);

				for (var iBlockRenderCol = iBlockRenderStartCol; iBlockRenderCol < iBlockRenderUpperLimit; iBlockRenderCol++) {
					var oCell = null;
					if (iBlockRenderCol === iStartCol) {
						// The first cell in a row needs an adjusted span
						oCell = oColHeaderArea.getCellWithColSpan(iRow, iBlockRenderCol);
					} else {
						oCell = oColHeaderArea.getCell(iRow, iBlockRenderCol);
					}
					if (oCell) {
						oRenderManager.renderControl(oCell);
					}
				}
				oRenderManager.write("</tr>");
			}

			oRenderManager.flush(oDomColHeaderArea[0]);

			if (!oColHeaderArea.getFinalColWidth(iBlockRenderStartCol)) {
				var iNewColWidth = oDomColHeaderArea.outerWidth() - iTotalWidth;
				iEffectiveWidth += iNewColWidth;
				iColOffset++;
			}
			iTotalWidth = oDomColHeaderArea.outerWidth();
		}

		oColHeaderArea.setRenderSize(0, oColHeaderArea.getRowCnt(), iStartCol, iColOffset);
		oDomColHeaderArea.show();
	};

	function hasScrolledHorizontally () {
		return (oColHeaderArea.getRenderStartCol() > 0);
	}

	this.appendColumnsAfterResize = function () {
		var oDomColHeaderArea = oDomElementProvider.getElement(oColHeaderArea.getId());
		var iTotalWidth = 0;
		var iNewColWidth = 0;
		var iAdjustedColWidth = 0;
		if (oColHeaderArea.getRenderStartCol() > 0
				&& oColHeaderArea.getRenderStartCol() + oColHeaderArea.getRenderColCnt() === oColHeaderArea.getColCnt()) {
			// we have a scrolled state
			var iAvailableWidth = oCrosstab.getContentWidth() - oMeasuring.getAreaWidth(oDimensionHeaderArea);
			var iEffectiveWidth = oDomColHeaderArea.outerWidth();
			iTotalWidth = iEffectiveWidth;
			var bColAppended = false;
			if (!oCrosstab.getPropertyBag().isDebugMode()) {
				oDomColHeaderArea.hide();
			}
			while (iEffectiveWidth <= iAvailableWidth && oColHeaderArea.getRenderStartCol() > 0) {
				this.appendLeftCols(oColHeaderArea, 1);
				this.appendLeftCols(oDataArea, 1);
				bColAppended = true;
				iAdjustedColWidth = oColHeaderArea.getFinalColWidth(oColHeaderArea.getRenderStartCol());
				if (iAdjustedColWidth) {
					iEffectiveWidth += iAdjustedColWidth;
				} else {
					iNewColWidth = oDomColHeaderArea.outerWidth() - iTotalWidth;
					iEffectiveWidth += iNewColWidth;
				}
				iTotalWidth = oDomColHeaderArea.outerWidth();
			}
			oDomColHeaderArea.show();
			if (bColAppended) {
				this.adjustRowHeights(oDimensionHeaderArea, oColHeaderArea);
				this.adjustRowHeights(oRowHeaderArea, oDataArea);
				this.adjustColWidths(oColHeaderArea, oDataArea);
				oMeasuring.calculateRenderSize(true);
				this.calculateRenderSizeDivSize();
				if (!oScrollManager) {
					oScrollManager = oCrossRequestManager.getScrollManager();
				}
				oScrollManager.commandHScrolledToEnd();
			}
		}
		oDomColHeaderArea = oDomElementProvider.getElement(oColHeaderArea.getId());
	};

	function prepareColHeaderRows (oDomColHeaderArea) {
		var iEndRow = oColHeaderArea.getRowCnt();
		var iRow = 0;

		for (iRow = 0; iRow < iEndRow; iRow++) {
			oRenderManager.write("<tr");
			oRenderManager.writeAttribute("class", "sapzencrosstab-HeaderRow");
			oRenderManager.writeAttribute("id", oCrosstab.getId() + "_ColHeaderRow_" + iRow);
			oRenderManager.write(">");
			oRenderManager.write("</tr>");
		}

		oRenderManager.flush(oDomColHeaderArea[0]);
	}

	function renderFirstRowInRowHeader (iStartRow) {
		var iEndRow = iStartRow + 1;
		var iStartCol = 0;
		var iEndCol = iStartCol + oRowHeaderArea.getColCnt();

		var iRow = 0;
		var iCol = 0;

		for (iRow = iStartRow; iRow < iEndRow; iRow++) {
			oRenderManager.write("<tr");
			oRenderManager.writeAttribute("class", "sapzencrosstab-HeaderRow");
			oRenderManager.write(">");
			for (iCol = iStartCol; iCol < iEndCol; iCol++) {
				var oCell = oRowHeaderArea.getCellWithRowSpan(iRow, iCol);
				if (oCell) {
					oRenderManager.renderControl(oCell);
				}
			}
			oRenderManager.write("</tr>");
		}
	}

	this.isVScrolledToEnd = function () {
		var bVScrolledToEnd = false;
		if (oScrollManager) {
			bVScrolledToEnd = oScrollManager.isVScrolledToEnd();
		}
		return bVScrolledToEnd;
	};

	this.isHScrolledToEnd = function () {
		var bHScrolledToEnd = false;
		if (oScrollManager) {
			bHScrolledToEnd = oScrollManager.isHScrolledToEnd();
		}
		return bHScrolledToEnd;
	};

	function conditionRenderArea (iOffset, iMaxOffset, iSpace, iAvailableSpace, bScrolledToEnd) {
		return ((iSpace < iAvailableSpace) || bScrolledToEnd) && iOffset < iMaxOffset;
	}

	function conditionRenderAreaFull (iOffset, iMaxOffset) {
		return iOffset < iMaxOffset;
	}

	this.renderRowHeaderArea = function (iStartRow) {
		var sInnerHtml = "";
		var oDomRowHeaderArea = oDomElementProvider.getElement(oRowHeaderArea.getId());
		var iRowOffset = 0;
		var iDimensionHeaderAreaHeight = oMeasuring.getAreaHeight(oDimensionHeaderArea);
		var iTotalHeight = iDimensionHeaderAreaHeight;
		var iCrosstabHeight = oCrosstab.getContentHeight();
		var iRowHeaderAreaRowCnt = oRowHeaderArea.getRowCnt();
		var iMaxRowOffset = 0;
		var iRowsToBeRendered = 1;
		var sRowHeaderAreaId = oRowHeaderArea.getId();
		var checkFunclet = null;

		if (!oCrosstab.getPropertyBag().isDebugMode()) {
			oDomRowHeaderArea.hide();
		}
		$(document.getElementById(sRowHeaderAreaId).firstChild).html("");
		var bVScrolledToEnd = false;

		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			checkFunclet = conditionRenderAreaFull;
			iStartRow = 0;
			iMaxRowOffset = iRowHeaderAreaRowCnt;
		} else {
			checkFunclet = conditionRenderArea;
			iMaxRowOffset = iRowHeaderAreaRowCnt - iStartRow;
			bVScrolledToEnd = this.isVScrolledToEnd();
		}

		while (checkFunclet(iRowOffset, iMaxRowOffset, iTotalHeight, iCrosstabHeight, bVScrolledToEnd)) {
			// We need to get this every time in order to reflect the changes in HTML
			sInnerHtml = $(document.getElementById(sRowHeaderAreaId).firstChild).html() || "";
			oRenderManager.write(sInnerHtml);
			iRowsToBeRendered = 1;

			if (iRowOffset > 0) {
				if (oCrosstab.getPropertyBag().isPixelScrolling()) {
					// In pixel scrolling mode there is no need to render the rows separately
					iRowsToBeRendered = iMaxRowOffset - iRowOffset;
				} else {
					// Performance optimization: render multiple rows at once because flushing is way more expensive
					// than rendering too many rows
					if (iRowOffset < iMaxRowOffset - 2) {
						iRowsToBeRendered = 3;
					} else if (iRowOffset < iMaxRowOffset - 1) {
						iRowsToBeRendered = 2;
					}
				}
				this.renderArea(oRowHeaderArea, iStartRow + iRowOffset, iRowsToBeRendered, 0, oRowHeaderArea
						.getColCnt(), "sapzencrosstab-HeaderRow");

			} else {
				renderFirstRowInRowHeader(iStartRow);
			}
			oRenderManager.flush(oDomRowHeaderArea[0]);
			iRowOffset += iRowsToBeRendered;
			iTotalHeight = iDimensionHeaderAreaHeight + oDomRowHeaderArea.outerHeight();

		}
		oDomRowHeaderArea.show();
		oRowHeaderArea.setRenderSize(iStartRow, iRowOffset, 0, oRowHeaderArea.getColCnt());
		if (bIsIE8) {
			fixIE8RowSpanCells(oRowHeaderArea);
		}
	};

	function determineHtmlIE8RowSpan (oRowHeaderArea, iRow, iCol) {
		var iRowSpanCounter = 1;
		var oCell = oRowHeaderArea.getCell(iRow, iCol, true);
		if (!oCell) {
			while (!oCell && iRow > 0) {
				iRow--;
				iRowSpanCounter++;
				oCell = oRowHeaderArea.getCell(iRow, iCol, true);
			}
		}
		return iRowSpanCounter;
	}

	function fixIE8RowSpanCells (oRowHeaderArea) {
		var iLastRow = oRowHeaderArea.getRenderStartRow() + oRowHeaderArea.getRenderRowCnt() - 1;
		var iStartCol = oRowHeaderArea.getRenderStartCol();
		var iEndCol = iStartCol + oRowHeaderArea.getRenderColCnt() - 1;
		var iCol = 0;
		var oCell = null;
		var iHtmlRowSpan = 1;

		for (iCol = iStartCol; iCol <= iEndCol; iCol++) {
			oCell = oRowHeaderArea.getCellWithRowSpan(iLastRow, iCol);
			if (oCell) {
				iHtmlRowSpan = determineHtmlIE8RowSpan(oRowHeaderArea, iLastRow, iCol);
				oCell.setHtmlIE8RowSpan(iHtmlRowSpan);
			}
		}
	}

	this.appendRowsAfterResize = function () {
		var oDomRowHeaderArea = oDomElementProvider.getElement(oRowHeaderArea.getId());
		var iTotalHeight = 0;
		var iNewRowHeight = 0;
		var iAdjustedRowHeight = 0;
		if (oRowHeaderArea.getRenderStartRow() > 0) {
			var iAvailableHeight = oCrosstab.getContentHeight() - oMeasuring.getAreaHeight(oDimensionHeaderArea);
			var iEffectiveHeight = oDomRowHeaderArea.outerHeight();
			// init
			iTotalHeight = iEffectiveHeight;
			var bRowAppended = false;
			if (!oCrosstab.getPropertyBag().isDebugMode()) {
				oDomRowHeaderArea.hide();
			}
			while (iEffectiveHeight <= iAvailableHeight
					&& oRowHeaderArea.getRenderStartRow() > 0
					&& oRowHeaderArea.getRenderStartRow() + oRowHeaderArea.getRenderRowCnt() === oRowHeaderArea
							.getRowCnt()) {
				this.appendTopRows(oRowHeaderArea, 1);
				this.appendTopRows(oDataArea, 1);
				bRowAppended = true;
				iAdjustedRowHeight = oRowHeaderArea.getFinalRowHeight(oRowHeaderArea.getRenderStartRow());
				if (iAdjustedRowHeight) {
					iEffectiveHeight += iAdjustedRowHeight;
				} else {
					iNewRowHeight = oDomRowHeaderArea.outerHeight() - iTotalHeight;
					iEffectiveHeight += iNewRowHeight;
				}
				iTotalHeight = oDomRowHeaderArea.outerHeight();
			}
			oDomRowHeaderArea.show();
			if (bRowAppended) {
				this.adjustRowHeights(oRowHeaderArea, oDataArea);
				this.adjustColWidths(oDimensionHeaderArea, oRowHeaderArea);
				this.adjustColWidths(oColHeaderArea, oDataArea);
				oMeasuring.calculateRenderSize(true);
				this.calculateRenderSizeDivSize();
				if (!oScrollManager) {
					oScrollManager = oCrossRequestManager.getScrollManager();
				}
				oScrollManager.commandVScrolledToEnd();
			}
		}
		oDomRowHeaderArea = oDomElementProvider.getElement(oRowHeaderArea.getId());
	};

	this.setUserColWidths = function (oArea) {
		if (!oArea.hasContent() || !oArea.hasUserColWidths()) {
			return;
		}
		oArea.calculateColGranularity();
		var aAreaColWidths = oArea.measureColGranularityCells();
		oArea.applyColWidthsToGranularityCells(aAreaColWidths);

		var oDomArea = oDomElementProvider.getElement(oArea.getId());
		var oDomAreaClone = cloneArea(oDomArea);

		setColWidths(oArea, oDomArea, oDomAreaClone, true);

		oDomArea.replaceWith(oDomAreaClone);

		oDomArea = $(document.getElementById(oArea.getId()));

		forceColWidths(oArea, oDomArea, true);

		oDomElementProvider.addElement(oArea.getId(), $(document.getElementById(oArea.getId())));
		oArea.setColGranularityCalculatedAndMeasured(true);
	};

	this.adjustColWidths = function (oUpperArea, oLowerArea) {
		if (!oLowerArea.hasContent() || !oUpperArea.hasContent()) {
			if (!oUpperArea.hasUserColWidths() && !oLowerArea.hasUserColWidths()) {
				return;
			}
		}

		var oDomUpperArea = oDomElementProvider.getElement(oUpperArea.getId());
		var oDomLowerArea = oDomElementProvider.getElement(oLowerArea.getId());

		oUpperArea.calculateColGranularity();
		oLowerArea.calculateColGranularity();

		var aUpperColWidths = oUpperArea.measureColGranularityCells();
		var aLowerColWidths = oLowerArea.measureColGranularityCells();

		oUpperArea.setColGranularityCalculatedAndMeasured(false);
		oLowerArea.setColGranularityCalculatedAndMeasured(false);

		var i = 0;
		var iResultWidth;

		for (i = oUpperArea.getRenderStartCol(); i < aUpperColWidths.length; i++) {
			iResultWidth = Math.max(aUpperColWidths[i] || 0, aLowerColWidths[i] || 0);
			aUpperColWidths[i] = iResultWidth;
			aLowerColWidths[i] = iResultWidth;
		}

		// forcing of the colwidth setting needs to be done in case the respective area
		// has user col width settings. In that case, the calculatedColWidths are already set
		// and would not get set again to the adjusted values from this method.
		oUpperArea.applyColWidthsToGranularityCells(aUpperColWidths, oUpperArea.hasUserColWidths());
		oLowerArea.applyColWidthsToGranularityCells(aLowerColWidths, oLowerArea.hasUserColWidths());

		var oDomUpperAreaClone = cloneArea(oDomUpperArea);
		
		var oDomLowerAreaClone = cloneArea(oDomLowerArea);

		setColWidths(oUpperArea, oDomUpperArea, oDomUpperAreaClone);
		setColWidths(oLowerArea, oDomLowerArea, oDomLowerAreaClone);

		oDomUpperArea.replaceWith(oDomUpperAreaClone);
		oDomLowerArea.replaceWith(oDomLowerAreaClone);

		oDomUpperArea = $(document.getElementById(oUpperArea.getId()));
		oDomLowerArea = $(document.getElementById(oLowerArea.getId()));

		forceColWidths(oUpperArea, oDomUpperArea);
		forceColWidths(oLowerArea, oDomLowerArea);

		if (oLowerArea.isRowHeaderArea() && oCrosstab.getNewLinesCnt() > 0 && oCrosstab.getCallValueHelpCommand()) {
			postProcessRowHeaderInputCells();
		}

		oDomElementProvider.addElement(oUpperArea.getId(), $(document.getElementById(oUpperArea.getId())));
		oDomElementProvider.addElement(oLowerArea.getId(), $(document.getElementById(oLowerArea.getId())));
	};

	function postProcessInputRow (iRow, iColCnt) {
		var oJqLayoutDiv = null;
		var oJqCell = null;
		var oJqContentDiv = null;
		var sSetWidth = null;
		var iCol = 0;
		var oCell = null;
		var aColGranularity = oRowHeaderArea.getColGranularity();
		var iCellLayoutDivWidth = 0;
		var iCalculatedColWidth = aColGranularity[iCol].iWidth;
		var iPaddingLeft = 0;
		var iPaddingRight = 0;
		var iBorderLeft = 0;
		var iBorderRight = 0;
		var iIconTdWidth = 0;
		var oJqTd = null;
		var iContentDivWidth = 0;

		for (iCol = 0; iCol < iColCnt; iCol++) {
			oCell = oRowHeaderArea.getCell(iRow, iCol);
			if (oCell && oCell.isEntryEnabled()) {
				oJqCell = $(document.getElementById(oCell.getId()));
				oJqLayoutDiv = $(document.getElementById(oCell.getId() + "_cellLayoutDiv"));
				sSetWidth = sap.zen.crosstab.utils.Utils.getWidthFromStyle(oJqLayoutDiv);
				if (aColGranularity && aColGranularity.length > 0) {
					iCalculatedColWidth = aColGranularity[iCol].iWidth;

					iPaddingLeft = parseInt(oJqCell.css("padding-left")) || 0;
					iPaddingRight = parseInt(oJqCell.css("padding-right")) || 0;
					iBorderLeft = parseInt(oJqCell.css("border-left-width")) || 0;
					iBorderRight = parseInt(oJqCell.css("border-right-width")) || 0;

					iCellLayoutDivWidth = iCalculatedColWidth - iPaddingLeft - iPaddingRight - iBorderLeft
							- iBorderRight;
					oJqLayoutDiv.css("width", iCellLayoutDivWidth + "px");

					// fix the content div
					iIconTdWidth = $(oJqLayoutDiv.find("td")[1]).outerWidth();
					oJqTd = $(oJqLayoutDiv.find("td")[0]);
					iPaddingLeft = parseInt(oJqTd.css("padding-left")) || 0;
					iPaddingRight = parseInt(oJqTd.css("padding-right")) || 0;

					oJqContentDiv = oJqTd.find("#" + $.sap.encodeCSS(oCell.getId() + "_contentDiv"));
					iContentDivWidth = iCellLayoutDivWidth - iPaddingLeft - iPaddingRight - iIconTdWidth;
					oJqContentDiv.css("width", iContentDivWidth + "px");
				}
			}
		}
	}

	function postProcessRowHeaderInputCells () {
		var iColCnt = oRowHeaderArea.getRenderColCnt();
		var iRowCnt = oRowHeaderArea.getRenderRowCnt();
		var iStartRow = oRowHeaderArea.getRenderStartRow();
		var iTotalRowCnt = oRowHeaderArea.getRowCnt();
		var iNewLinesCnt = oCrosstab.getNewLinesCnt();
		var iRow = 0;
		var i = 0;

		if (oCrosstab.isNewLinesTop()) {
			if (iStartRow < iNewLinesCnt) {
				for (iRow = iStartRow; iRow < iNewLinesCnt; iRow++) {
					postProcessInputRow(iRow, iColCnt);
				}
			}
		} else if (oCrosstab.isNewLinesBottom()) {
			var iLinesToBeFixed = (iStartRow + iRowCnt) - (iTotalRowCnt - iNewLinesCnt);
			if (iLinesToBeFixed > 0) {
				var iFixRow = iStartRow + iRowCnt - 1;
				for (i = 0; i < iLinesToBeFixed; i++) {
					postProcessInputRow(iFixRow, iColCnt);
					iFixRow--;
				}
			}
		}
	}
	
	this.adjustRowHeights = function (oLeftArea, oRightArea) {
		if (!oRightArea.hasContent() || !oLeftArea.hasContent()) {
			return;
		}

		var oDomLeftArea = oDomElementProvider.getElement(oLeftArea.getId());
		var oDomRightArea = oDomElementProvider.getElement(oRightArea.getId());

		oLeftArea.calculateRowGranularity();
		oRightArea.calculateRowGranularity();

		var aLeftRowHeights = oLeftArea.measureRowGranularityCells();
		var aRightRowHeights = oRightArea.measureRowGranularityCells();

		var i = 0;
		var iResultHeight;
		for (i = oLeftArea.getRenderStartRow(); i < aLeftRowHeights.length; i++) {
			iResultHeight = Math.max(aLeftRowHeights[i] || 0, aRightRowHeights[i] || 0);
			aLeftRowHeights[i] = iResultHeight;
			aRightRowHeights[i] = iResultHeight;
		}

		var aLevelCells = oRightArea.isColHeaderArea() ? oRightArea.getLevelCells() : null;
		
		var bInvalidate = oLeftArea.applyRowHeightsToGranularityCells(aLeftRowHeights, aLevelCells);
		bInvalidate = bInvalidate || oRightArea.applyRowHeightsToGranularityCells(aRightRowHeights, aLevelCells);
		
		if (bInvalidate === true && oScrollbarVisibility && oScrollbarVisibility.bHasHScrollbar === true && !oCrosstab.getPropertyBag().isPixelScrolling()) {
			if (oScrollManager) {
				oCrosstab.setScrollInvalidate(bInvalidate);
			}
		}

		var oDomLeftAreaClone = cloneArea(oDomLeftArea);
		var oDomRightAreaClone = cloneArea(oDomRightArea);

		setRowHeights(oLeftArea, oDomLeftArea, oDomLeftAreaClone);
		setRowHeights(oRightArea, oDomRightArea, oDomRightAreaClone);

		oDomLeftArea.replaceWith(oDomLeftAreaClone);
		oDomRightArea.replaceWith(oDomRightAreaClone);

		oDomLeftArea = $(document.getElementById(oLeftArea.getId()));
		oDomRightArea = $(document.getElementById(oRightArea.getId()));

		// Needs to be called AFTER the new table is attached to the DOM, because it needs to measure if the set row
		// heights have been applied
		forceRowHeights(oLeftArea, oDomLeftArea);
		forceRowHeights(oRightArea, oDomRightArea);

		if (bIsMsIE) {
			postProcessRowHeightsForIE(oLeftArea);
			postProcessRowHeightsForIE(oRightArea);
		}

		oDomElementProvider.addElement(oLeftArea.getId(), $(document.getElementById(oLeftArea.getId())));
		oDomElementProvider.addElement(oRightArea.getId(), $(document.getElementById(oRightArea.getId())));
	};

	function postProcessRowHeightsForIE (oArea) {
		var oCellsWithLineBreakTexts = oArea.getCellsWithLineBreakTexts();
		var iRow = 0;
		var iCol = 0;
		var iRenderStartRow = 0;
		var iRenderEndRow = 0;
		var iRenderStartCol = 0;
		var iRenderEndCol = 0;
		var oCell = null;
		var oContentDiv = null;

		if (oCellsWithLineBreakTexts) {
			iRenderStartRow = oArea.getRenderStartRow();
			iRenderEndRow = iRenderStartRow + oArea.getRenderRowCnt() - 1;
			iRenderStartCol = oArea.getRenderStartCol();
			iRenderEndCol = iRenderStartCol + oArea.getRenderColCnt() - 1;

			for (iRow = iRenderStartRow; iRow <= iRenderEndRow; iRow++) {
				for (iCol = iRenderStartCol; iCol <= iRenderEndCol; iCol++) {
					oCell = oArea.getCell(iRow, iCol);
					if (oCell) {
						oCell = oCellsWithLineBreakTexts[oCell.getId()];
						if (oCell) {
							oContentDiv = $(document.getElementById(oCell.getId() + "_contentDiv"));
							if (oContentDiv && oContentDiv.length > 0) {
								oContentDiv.css("height", oContentDiv.outerHeight() + "px");
							}
						}
					}
				}
			}
		}
	}

	function postProcessRowHeightsForIE (oArea) {
		var oCellsWithLineBreakTexts = oArea.getCellsWithLineBreakTexts();
		var iRow = 0;
		var iCol = 0;
		var iRenderStartRow = 0;
		var iRenderEndRow = 0;
		var iRenderStartCol = 0;
		var iRenderEndCol = 0;
		var oCell = null;
		var oContentDiv = null;

		if (oCellsWithLineBreakTexts) {
			iRenderStartRow = oArea.getRenderStartRow();
			iRenderEndRow = iRenderStartRow + oArea.getRenderRowCnt() - 1;
			iRenderStartCol = oArea.getRenderStartCol();
			iRenderEndCol = iRenderStartCol + oArea.getRenderColCnt() - 1;

			for (iRow = iRenderStartRow; iRow <= iRenderEndRow; iRow++) {
				for (iCol = iRenderStartCol; iCol <= iRenderEndCol; iCol++) {
					oCell = oArea.getCell(iRow, iCol);
					if (oCell) {
						oCell = oCellsWithLineBreakTexts[oCell.getId()];
						if (oCell) {
							oContentDiv = $(document.getElementById(oCell.getId() + "_contentDiv"));
							if (oContentDiv && oContentDiv.length > 0) {
								oContentDiv.css("height", oContentDiv.outerHeight() + "px");
							}
						}
					}
				}
			}
		}
	}

	function setColWidths (oArea, oDomArea, oDomAreaClone, bCheckFixedSetting) {
		var i = 0;
		var aCellInfo = oArea.getColGranularity();
		var oCellInfo = null;
		var oDomCell = null;
		var oDomCellClone = null;
		var oDomContentDiv = null;
		var iContentWidth = 0;

		for (i = 0; i < aCellInfo.length; i++) {

			oCellInfo = aCellInfo[i];
			if (oCellInfo) {
				if (bCheckFixedSetting === true) {
					if (!oArea.isFixedColWidthSet(oCellInfo.iCol)) {
						continue;
					}
				}
				oDomCell = oDomArea.find("#" + $.sap.encodeCSS(oCellInfo.sId));
				oDomCellClone = oDomAreaClone.find("#" + $.sap.encodeCSS(oCellInfo.sId));
				iContentWidth = calculateContentWidth(oDomCell, oCellInfo.iWidth, oArea.getCell(oCellInfo.iRow,
						oCellInfo.iCol));
				var oCell = sap.ui.getCore().getControl(oCellInfo.sId);
				if (oCell.isEntryEnabled() && oArea.isRowHeaderArea()) {
					oDomContentDiv = $(oDomCellClone.find("#" + $.sap.encodeCSS(oCellInfo.sId + "_cellLayoutDiv")));
				} else {
					oDomContentDiv = $(oDomCellClone.find("#" + $.sap.encodeCSS(oCellInfo.sId + "_contentDiv")));
				}
				oDomContentDiv.width(iContentWidth);
			}
		}
	}

	function forceColWidths (oArea, oDomArea, bCheckFixedSetting) {
		var i = 0;
		var aCellInfo = oArea.getColGranularity();
		var oCellInfo = null;
		var oDomCell = null;
		var oDomAreaClone = null;
		var iCellWidth = 0;
		var oHandledColSpanCells = {};

		for (i = 0; i < aCellInfo.length; i++) {
			oCellInfo = aCellInfo[i];
			if (oCellInfo) {
				if (bCheckFixedSetting === true) {
					if (!oArea.isFixedColWidthSet(oCellInfo.iCol)) {
						continue;
					}
				}
				oDomCell = oDomArea.find("#" + $.sap.encodeCSS(oCellInfo.sId));
				iCellWidth = oDomCell.outerWidth();
				if (iCellWidth > oCellInfo.iWidth) {
					if (!oDomAreaClone) {
						oDomAreaClone = cloneArea(oDomArea);
					}
					forceColWidth(oArea, oDomArea, oDomAreaClone, oCellInfo, oHandledColSpanCells);
				}
			}
		}
		if (oDomAreaClone) {
			oDomArea.replaceWith(oDomAreaClone);
		}
	}

	function setRowHeights (oArea, oDomArea, oDomAreaClone) {
		var i = 0;
		var aCellInfo = oArea.getRowGranularity();
		var oCellInfo = null;
		var oDomCell = null;
		var oDomCellClone = null;
		var oDomRow = null;
		var iCalculatedRowHeight = 0;

		for (i = 0; i < aCellInfo.length; i++) {
			oCellInfo = aCellInfo[i];
			if (oCellInfo) {
				oDomCell = oDomArea.find("#" + $.sap.encodeCSS(oCellInfo.sId));
				oDomCellClone = oDomAreaClone.find("#" + $.sap.encodeCSS(oCellInfo.sId));
				oDomRow = oDomCellClone.parent();
				iCalculatedRowHeight = calculateRowHeight(oDomCell, oCellInfo.iHeight);
				oDomRow.height(iCalculatedRowHeight);
			}
		}
	}

	function forceRowHeights (oArea, oDomArea) {
		var i = 0;
		var aCellInfo = oArea.getRowGranularity();
		var oCellInfo = null;
		var oDomCell = null;
		var iCellHeight = 0;
		var oDomAreaClone = null;
		var oHandledRowSpanCells = {};

		for (i = 0; i < aCellInfo.length; i++) {
			oCellInfo = aCellInfo[i];
			if (oCellInfo) {
				oDomCell = oDomArea.find("#" + $.sap.encodeCSS(oCellInfo.sId));
				// getting the row height in IE8 with cells with rowspan > 1 present
				// returns the height of the rowspan cell, not of the row. This is a
				// bug in IE8. It's fixed in IE9 and does not occur with any other current browser.
				// Hence, we need to derive the row height from a cell height instead of the row itself.
				// iRowHeight = oDomRow.outerHeight(); // doesn't work right in IE8
				// iCellHeight = oDomCell.outerHeight();
				var oDomRow = oDomCell.parent();
				iCellHeight = oDomRow.outerHeight();
				// var iCellHeight2 = oDomCell.outerHeight();
				// if (iCellHeight2 > oCellInfo.iHeight) {
				//
				// }
				if (iCellHeight > oCellInfo.iHeight) {
					if (!oDomAreaClone) {
						oDomAreaClone = cloneArea(oDomArea);
					}
					forceRowHeight(oArea, oDomArea, oDomAreaClone, oCellInfo, oHandledRowSpanCells);
				}
			}
		}
		if (oDomAreaClone) {
			oDomArea.replaceWith(oDomAreaClone);
		}
	}

	function determineContentHeight (oDomCell, iCellHeight) {
		var iHeight = 0;
		if (bIsIE8) {
			// check if the cell contains a table.
			// Assumption: a cell that contains more than one
			// element will organize it in a <table> as it is
			// the case with hierarchies.
			var oTables = oDomCell.find("table");
			if (oTables === null || oTables.length === 0) {
				iHeight = calculateContentHeight(oDomCell, iCellHeight);
			}
			// for IE8, return height 0 in case we have a table in the cell,
			// otherwise we'll see misalignment due to the rowheight bugs in IE8
		} else {
			iHeight = calculateContentHeight(oDomCell, iCellHeight);
		}
		return iHeight;
	}

	function forceRowHeight (oArea, oDomArea, oDomAreaClone, oCellInfo, oHandledRowSpanCells) {
		var iEndCol = oArea.getRenderStartCol() + oArea.getRenderColCnt();
		var iCol = 0;
		var oCell = null;
		var iCellHeight = 0;
		var i = 0;
		var aCalculatedRowHeights = oArea.getCalculatedRowHeights();
		var oDomContentDiv = null;
		var oDomCell = null;
		var oDomCellClone = null;
		var iContentHeight = 0;
		var iRowSpan = 0;
		var iRenderedRows;
		var iMaxHeightsToConsider;

		for (iCol = oArea.getRenderStartCol(); iCol < iEndCol; iCol++) {
			oCell = oArea.getCellWithColSpan(oCellInfo.iRow, iCol);
			// adjust cell with rowspans that are left of the row granularity cells.
			// algorithm symmetrical and same intention as in forceColWidth
			if (!oCell) {
				oCell = oArea.getCellWithRowSpan(oCellInfo.iRow, iCol);
				if (oCell && (iCol < oCellInfo.iCol) && oCell.getEffectiveRowSpan() > 1) {
					if (!oHandledRowSpanCells[oCell.getId()]) {
						oHandledRowSpanCells[oCell.getId()] = oCell;
					} else {
						oCell = null;
					}
				}
			}
			if (oCell) {
				oDomCell = oDomArea.find("#" + $.sap.encodeCSS(oCell.getId()));
				oDomCellClone = oDomAreaClone.find("#" + $.sap.encodeCSS(oCell.getId()));
				if (oDomCell.length > 0) {
					iCellHeight = 0;
					iRowSpan = bIsIE8 ? oCell.getHtmlIE8RowSpan() : oCell.getEffectiveRowSpan();
					
					// how many cells are actually being rendered, started from the row of the cell in question
					iRenderedRows = oArea.getRenderRowCnt() - (Math.max(oCell.getRow(), oArea.getRenderStartRow()) - oArea.getRenderStartRow());
					iMaxHeightsToConsider = Math.min(iRenderedRows, iRowSpan);
					
					for (i = 0; i < iMaxHeightsToConsider; i++) {
						iCellHeight += aCalculatedRowHeights[oCellInfo.iRow + i] || 0;
					}
					iContentHeight = determineContentHeight(oDomCell, iCellHeight);
					oDomContentDiv = $(oDomCellClone.find("#" + $.sap.encodeCSS(oCell.getId() + "_contentDiv")));
					oDomContentDiv.css("line-height", iContentHeight + "px");
					if (oCell.getEffectiveRowSpan() > 1) {
						oHandledRowSpanCells[oCell.getId()] = oCell;
					}
				}
			}
		}
	}

	function forceColWidth (oArea, oDomArea, oDomAreaClone, oCellInfo, oHandledColSpanCells) {
		var iRow = 0;
		var oCell = null;
		var oDomCell = null;
		var oDomCellClone = null;
		var oDomContentDiv = null;
		var iContentWidth = 0;
		var iCellWidth = 0;
		var i = 0;
		var aCalculatedColWidths = oArea.getCalculatedColWidths();
		var iEffectiveColSpan;
		var iRenderedCols;
		var iMaxWidthsToConsider;

		var iEndRow = oArea.getRenderStartRow() + oArea.getRenderRowCnt();
		for (iRow = oArea.getRenderStartRow(); iRow < iEndRow; iRow++) {
			oCell = oArea.getCellWithRowSpan(iRow, oCellInfo.iCol);
			// adjust cells with colspan that are above the granularity cells.
			// otherwise, it can happen that due to a large content, the colspanned cell
			// will expand the granularity cells despite that they have a width enforced
			if (!oCell) {
				oCell = oArea.getCellWithColSpan(iRow, oCellInfo.iCol);
				// Test for effective ColSpan! Situations may occur in which there is a cell with
				// effective colspan = 1 which needs the "normal" non-cell-spanned handling, but which
				// is only accessible via getCellWithColSpan() because in the model, it is a cell with a colspan > 1.
				// if those cells are not handled as normal cells because they are not found with the getCellWithRowSpan() API,
				// misalignments may occur
				if (oCell && (iRow < oCellInfo.iRow) && oCell.getEffectiveColSpan() > 1) {
					if (!oHandledColSpanCells[oCell.getId()]) {
						oHandledColSpanCells[oCell.getId()] = oCell;
					} else {
						oCell = null;
					}
				}
			}
			if (oCell) {
				if (oHandledColSpanCells[oCell.getId()]) {
					continue; // cell has already been handled
				}
				
				oDomCell = oDomArea.find("#" + $.sap.encodeCSS(oCell.getId()));
				oDomCellClone = oDomAreaClone.find("#" + $.sap.encodeCSS(oCell.getId()));
				if (oDomCell.length > 0) {
					iCellWidth = 0;
					iEffectiveColSpan = oCell.getEffectiveColSpan();
					
					// how many cells are actually being rendered, started from the column of the cell in question
					iRenderedCols = oArea.getRenderColCnt() - (Math.max(oCell.getCol(), oArea.getRenderStartCol()) - oArea.getRenderStartCol());
					iMaxWidthsToConsider = Math.min(iRenderedCols, iEffectiveColSpan);
					
					for (i = 0; i < iMaxWidthsToConsider; i++) {
						iCellWidth += aCalculatedColWidths[oCellInfo.iCol + i] || 0;
					}
					iContentWidth = calculateContentWidth(oDomCell, iCellWidth, oCell);
					if (oCell.isEntryEnabled() && oArea.isRowHeaderArea()) {
						oDomContentDiv = $(oDomCellClone.find("#" + $.sap.encodeCSS(oCell.sId + "_cellLayoutDiv")));
					} else {
						oDomContentDiv = $(oDomCellClone.find("#" + $.sap.encodeCSS(oCell.getId() + "_contentDiv")));
					}
					oDomContentDiv.width(iContentWidth);
					if(oCell.getEffectiveColSpan() > 1) {
						oHandledColSpanCells[oCell.getId()] = oCell;
					}
				}
			}
		}
	}

	function calculateContentWidth (oDomCell, iCommonWidth, oCell) {
		var iPaddingLeft = parseInt(oDomCell.css("padding-left")) || 0;
		var iPaddingRight = parseInt(oDomCell.css("padding-right")) || 0;
		var iBorderLeft = parseInt(oDomCell.css("border-left-width")) || 0;
		var iBorderRight = parseInt(oDomCell.css("border-right-width")) || 0;

		var iContentDivBorderLeft = 0;
		var iContentDivBorderRight = 0;

		if (oCell !== null && oCell.isEntryEnabled()) {
			if (oCell.isEntryEnabled() && oCell.getArea().isRowHeaderArea()) {
				var oDomContentDiv = $(oDomCell.find("#" + $.sap.encodeCSS(oCell.getId() + "_cellLayoutDiv")));
			} else {
				var oDomContentDiv = oDomCell.find("#" + $.sap.encodeCSS(oCell.getId() + "_contentDiv"));
			}

			iContentDivBorderLeft = parseInt(oDomContentDiv.css("border-left-width")) || 0;
			iContentDivBorderRight = parseInt(oDomContentDiv.css("border-right-width")) || 0;
		}

		// don't let a width be 0 since soome browsers have problem with this, e. g. Safari iPad iOS 6
		// make it at least 1 px
		var iContentWidth = Math.max(1, iCommonWidth - iPaddingLeft - iPaddingRight - iBorderLeft - iBorderRight
				- iContentDivBorderLeft - iContentDivBorderRight);

		return iContentWidth;
	}

	function calculateRowHeight (oDomCell, iCellHeight) {
		var oParent = $(oDomCell).parent();
		var iTopRowBorderWidth = parseInt(oParent.css("border-top-width"), 10) || 0;
		var iBottomRowBorderWidth = parseInt(oParent.css("border-bottom-width"), 10) || 0;

		var iRowHeight = iCellHeight + iTopRowBorderWidth + iBottomRowBorderWidth;

		return iRowHeight;
	}

	function calculateContentHeight (oDomCell, iCellHeight) {
		var iPaddingTop = parseInt(oDomCell.css("padding-top")) || 0;
		var iPaddingBottom = parseInt(oDomCell.css("padding-bottom")) || 0;
		var iBorderTop = parseInt(oDomCell.css("border-top-width")) || 0;
		var iBorderBottom = parseInt(oDomCell.css("border-bottom-width")) || 0;

		var iContentHeight = iCellHeight - iPaddingTop - iPaddingBottom - iBorderTop - iBorderBottom;

		return iContentHeight;
	}

	this.determineHeaderScrollbarVisible = function () {
		// currently only horizontally => width is relevant
		if (oScrollbarVisibility) {
			var iHeaderWidth = 0;
			var oJqScrollDiv = null;
			var oJqContainerDiv = null;
			var bNeedHorizontalHeaderScrolling = false;

			if (oDimensionHeaderArea.getColCnt() > 0) {
				iHeaderWidth = oMeasuring.getAreaSize(oDimensionHeaderArea).iWidth;
				oJqContainerDiv = $(document.getElementById(oCrosstab.getId() + "_dimHeaderArea_container"));
				oJqScrollDiv = $(document.getElementById(oCrosstab.getId() + "_upperLeft_scrollDiv"));
			}
			if (iHeaderWidth === 0) {
				if (oRowHeaderArea.getColCnt() > 0) {
					iHeaderWidth = oMeasuring.getAreaSize(oRowHeaderArea).iWidth;
					oJqContainerDiv = $(document.getElementById(oCrosstab.getId() + "_rowHeaderArea_container"));
					oJqScrollDiv = $(document.getElementById(oCrosstab.getId() + "_lowerLeft_scrollDiv"));
				}
			}

			if (iHeaderWidth > 0) {
				// check if the accomodating div is wide enough
				bNeedHorizontalHeaderScrolling = (oJqContainerDiv.outerWidth() > oJqScrollDiv.outerWidth());
			}
			oScrollbarVisibility.bHasHHeaderScrollbar = bNeedHorizontalHeaderScrolling;
		}
		if (!oScrollbarVisibility || !oScrollbarVisibility.bHasHHeaderScrollbar) {
			oCrosstab.setHeaderHScrolling(false);
		}
	};
	
	this.determineDefaultScrollbarsVisible = function() {
		oScrollbarVisibility = {};

		var oDimensionHeaderAreaSize = oMeasuring.getAreaSize(oDimensionHeaderArea);
		var oRenderSize = oMeasuring.calculateRenderSize();
		var oRenderSizeDivSize = oMeasuring.getRenderSizeDivSize(oCrosstab);
		var iIntWidth = oCrosstab.getContentWidth();
		var iIntHeight = oCrosstab.getContentHeight();
		var iScrollbarWidth = oMeasuring.getBrowserScrollbarWidth();
		var oRenderSizeDivBorders = null;

		var bHAllRendered = oDataArea.getRenderColCnt() === oDataArea.getColCnt();
		var bVAllRendered = oDataArea.getRenderRowCnt() === oDataArea.getRowCnt();

		oScrollbarVisibility.bHasHScrollbar = ((oRenderSize.iWidth > iIntWidth || !bHAllRendered) && oRenderSizeDivSize.iWidth > oDimensionHeaderAreaSize.iWidth);
		oScrollbarVisibility.bHasVScrollbar = ((oRenderSize.iHeight > iIntHeight || !bVAllRendered) && oRenderSizeDivSize.iHeight > oDimensionHeaderAreaSize.iHeight);

		if (oScrollbarVisibility.bHasHScrollbar && !oScrollbarVisibility.bHasVScrollbar) {
			oRenderSizeDivBorders = oMeasuring.getRenderSizeDivBorders();

			if (iIntHeight <= oRenderSize.iHeight + iScrollbarWidth + oRenderSizeDivBorders.borders.iBottomBorderWidth
					+ oRenderSizeDivBorders.borders.iTopBorderWidth) {
				oScrollbarVisibility.bHasVScrollbar = true;
			}
		} else if (!oScrollbarVisibility.bHasHScrollbar && oScrollbarVisibility.bHasVScrollbar) {
			oRenderSizeDivBorders = oMeasuring.getRenderSizeDivBorders();

			if (iIntWidth <= oRenderSize.iWidth + iScrollbarWidth + oRenderSizeDivBorders.borders.iRightBorderWidth
					+ oRenderSizeDivBorders.borders.iLeftBorderWidth) {
				oScrollbarVisibility.bHasHScrollbar = true;
			}
		}
	};

	this.determineScrollbarsVisible = function () {
		this.determineDefaultScrollbarsVisible();
		this.determineHeaderScrollbarVisible();
	};

	this.setAdjustFrameDivs = function (pbAdjustFrameDivs) {
		bAdjustFrameDivs = pbAdjustFrameDivs;
	};

	this.removeOuterDivBorders = function () {
		var oDomRenderSizeDiv = $(jQuery.sap.byId(oCrosstab.getId() + "_renderSizeDiv"));
		oDomRenderSizeDiv.css("border-bottom-width", "");
		oDomRenderSizeDiv.css("border-top-width", "");
		oDomRenderSizeDiv.css("border-left-width", "");
		oDomRenderSizeDiv.css("border-right-width", "");
	};

	this.setDivSizeValidity = function () {
		bDivSizesValid = !oCrosstab.getRowHeaderArea().hasLoadingPages()
				&& !oCrosstab.getColumnHeaderArea().hasLoadingPages();
	};

	// this method is used for an all new calculation. RenderSizeDiv might have been adjusted before, hence this method
	// will
	// contain adjustments to take a bottom border zero into account as it might have been set in COMPACT MODE in
	// adjustRenderSizeDivSize
	this.calculateRenderSizeDivSize = function () {
		if (bAdjustFrameDivs || !bDivSizesValid) {
			var oRenderSize = oMeasuring.calculateRenderSize(true);
			var oDomRenderSizeDiv = $(jQuery.sap.byId(oCrosstab.getId() + "_renderSizeDiv"));
			var oBorders = oMeasuring.getRenderSizeDivBorders(oDomRenderSizeDiv);

			// correct bottom border if set to zero before. This is needed for new calculation because in
			// adjustRenderSizeDivSize,
			// the bottom border of the renderSizeDiv may have been set to zero (COMPACT_MODE) and any new calculation
			// will yield
			// in wrong renderSizeDiv heights
			if (iRenderSizeDivOrigBottom !== -1) {
				oBorders.borders.iBottomBorderWidth = iRenderSizeDivOrigBottom;
			}

			var iMaxWidth = oCrosstab.getContentWidth() - oBorders.borders.iLeftBorderWidth
					- oBorders.borders.iRightBorderWidth;

			var iWidth = oRenderSize.iWidth;
			oDomRenderSizeDiv.width(Math.min(iMaxWidth, iWidth) + "px");

			var iMaxHeight = oCrosstab.getContentHeight() - oBorders.borders.iBottomBorderWidth
					- oBorders.borders.iTopBorderWidth;

			var iHeight = oRenderSize.iHeight;
			oDomRenderSizeDiv.height(Math.min(iMaxHeight, iHeight) + "px");
		}
	};

	// this method is used for an all new calculation. RenderSizeDiv might have been adjusted before, hence this method
	// will
	// contain adjustments to take a bottom border zero into account as it might have been set in this method during
	// COMPACT_MODE
	this.adjustRenderSizeDivSize = function () {
		if (bAdjustFrameDivs || !bDivSizesValid) {
			var oDomRenderSizeDiv = $(jQuery.sap.byId(oCrosstab.getId() + "_renderSizeDiv"));
			var oBorders = oMeasuring.getRenderSizeDivBorders(oDomRenderSizeDiv);
			// correct bottom border if set to zero before. This is needed for new calculation because in
			// adjustRenderSizeDivSize,
			// the bottom border of the renderSizeDiv may have been set to zero (COMPACT_MODE) and any new calculation
			// will yield
			// in wrong renderSizeDiv heights
			if (iRenderSizeDivOrigBottom !== -1) {
				oBorders.borders.iBottomBorderWidth = iRenderSizeDivOrigBottom;
			}

			var iRenderSizeDivHeight = oMeasuring.getRenderSizeDivSize().iHeight;
			// outerDiv calculation from Measuring might operate on renderSizeDiv that has bottom border set to zero.
			// Hence, for a new calculation as requested here, this needs to be compensated for.
			if (iRenderSizeDivOrigBottom !== -1) {
				iRenderSizeDivHeight += iRenderSizeDivOrigBottom;
			}

			var iRenderSizeDivWidth = oMeasuring.getRenderSizeDivSize().iWidth;

			var iAvailableHeight = oCrosstab.getContentHeight();
			if (oScrollbarVisibility.bHasHScrollbar || oScrollbarVisibility.bHasHHeaderScrollbar) {
				iAvailableHeight -= oMeasuring.getBrowserScrollbarWidth();
			}

			if (oCrosstab.getRenderMode() === sap.zen.crosstab.rendering.RenderingConstants.RENDERMODE_COMPACT) {
				var iScrollbarHeight = (oScrollbarVisibility.bHasHScrollbar || oScrollbarVisibility.bHasHHeaderScrollbar) ? oMeasuring
						.getBrowserScrollbarWidth()
						: 0;

				var iToolbarHeight = oCrosstab.getPropertyBag().getToolbarHeight();

				var iRenderSizeDivWithScrollbarHeightAndToolbar = iRenderSizeDivHeight + iScrollbarHeight
						+ oBorders.borders.iBottomBorderWidth + oBorders.borders.iTopBorderWidth + iToolbarHeight;

				var iTotalAvailableHeight = iAvailableHeight + iScrollbarHeight + iToolbarHeight;

				if (iTotalAvailableHeight >= iRenderSizeDivWithScrollbarHeightAndToolbar) {
					iAvailableHeight = iRenderSizeDivWithScrollbarHeightAndToolbar;
					var oTableDiv = oDomElementProvider.getElement(oCrosstab.getId());
					oTableDiv.css("height", iAvailableHeight + "px");
					if (iRenderSizeDivOrigBottom === -1) {
						iRenderSizeDivOrigBottom = parseInt(oDomRenderSizeDiv.css("border-bottom-width"), 10);
					}
					oDomRenderSizeDiv.css("border-bottom-width", "0px");
				}
			}

			if (iRenderSizeDivHeight >= iAvailableHeight) {
				if (iRenderSizeDivOrigBottom === -1) {
					iRenderSizeDivOrigBottom = parseInt(oDomRenderSizeDiv.css("border-bottom-width"), 10);
				}
				oDomRenderSizeDiv.css("border-bottom-width", "0px");
			}
			var iCalculatedRenderSizeDivHeight = Math.min(iRenderSizeDivHeight, iAvailableHeight);
			oDomRenderSizeDiv.css("height", iCalculatedRenderSizeDivHeight);

			var iAvailableWidth = oCrosstab.getContentWidth();
			if (oScrollbarVisibility.bHasVScrollbar) {
				iAvailableWidth -= oMeasuring.getBrowserScrollbarWidth();
			}

			if (oCrosstab.getRenderMode() === sap.zen.crosstab.rendering.RenderingConstants.RENDERMODE_COMPACT) {
				var iScrollbarWidth = oScrollbarVisibility.bHasVScrollbar ? oMeasuring.getBrowserScrollbarWidth() : 0;
				var iRenderSizeDivWidthScrollbarWidth = iRenderSizeDivWidth + iScrollbarWidth
						+ oBorders.borders.iLeftBorderWidth + oBorders.borders.iRightBorderWidth;

				var iTotalAvailableWidth = iAvailableWidth + iScrollbarWidth;

				if (iTotalAvailableWidth >= iRenderSizeDivWidthScrollbarWidth) {
					iAvailableWidth = iRenderSizeDivWidthScrollbarWidth;
					var oTableDiv = oDomElementProvider.getElement(oCrosstab.getId());
					oTableDiv.css("width", iAvailableWidth + "px");
					oDomRenderSizeDiv.css("border-right-width", "0px");
				}
			}

			if (iRenderSizeDivWidth >= iAvailableWidth) {
				oDomRenderSizeDiv.css("border-right-width", "0px");
			}
			var iCalculatedRenderSizeDivWidth = Math.min(iRenderSizeDivWidth, iAvailableWidth);
			oDomRenderSizeDiv.css("width", iCalculatedRenderSizeDivWidth);
			
			this.adjustGlassPaneSize();
		}
	};

	this.adjustGlassPaneSize = function() {
		var oJqGlassPane = oCrosstab.getGlassPane();
		var oJqRenderSizeDiv = oCrosstab.getRenderSizeDiv();
		oJqGlassPane.css("width", oJqRenderSizeDiv.outerWidth() + "px");
		oJqGlassPane.css("height", oJqRenderSizeDiv.outerHeight() + "px");
	};
	
	this.renderScrollbars = function () {
		this.determineScrollbarsVisible();
		if (oScrollbarVisibility.bHasHScrollbar || oScrollbarVisibility.bHasVScrollbar
				|| oScrollbarVisibility.bHasHHeaderScrollbar) {
			if (!oScrollManager) {
				oScrollManager = oCrossRequestManager.getScrollManager();
			}
			if (oScrollbarVisibility.bHasHHeaderScrollbar) {
				oHeaderScrollManager = oCrossRequestManager.getHeaderScrollManager();
			}
			if (oScrollbarRenderer) {
				oScrollbarRenderer.destroy();
				oScrollbarRenderer = null;
			}
			oScrollbarRenderer = new sap.zen.crosstab.rendering.ScrollbarRenderer(oCrosstab, oRenderManager,
					oMeasuring, oDomElementProvider);
			oScrollbarRenderer.renderScrollbars(oScrollbarVisibility);
			oScrollbarRenderer.attachHandlers(oScrollManager.hScrollHandler, oScrollManager.vScrollHandler,
					oScrollbarVisibility.bHasHHeaderScrollbar ? oHeaderScrollManager.hScrollHandler : null);
			notifyNewScrollbars();
		} else {
			oScrollManager = null;
		}
	};

	function notifyNewScrollbars () {
		var i = 0;
		for (i = 0; i < aNewScrollbarEventHandlers.length; i++) {
			aNewScrollbarEventHandlers[i]();
		}
	}

	this.setScrollbarSteps = function () {
		if (oScrollbarRenderer) {
			oScrollbarRenderer.setScrollbarSteps();
		}
	};

	this.adjustScrollDivSizes = function () {
		// data area and column header area
		var oDomLowerLeftArea = jQuery.sap.byId(oCrosstab.getId() + "_lowerLeft");
		var iLowerLeftAreaWidth = oDomLowerLeftArea.outerWidth();
		var iRenderSizeDivSize = oMeasuring.getRenderSizeDivSize();

		var sDataColHeaderScrollDivWidth = (iRenderSizeDivSize.iWidth - iLowerLeftAreaWidth) + "px";

		var oDomDataScrollDiv = jQuery.sap.byId(oCrosstab.getId() + "_lowerRight_scrollDiv");
		oDomDataScrollDiv.width(sDataColHeaderScrollDivWidth);

		var oDomColHeaderScrollDiv = jQuery.sap.byId(oCrosstab.getId() + "_upperRight_scrollDiv");
		oDomColHeaderScrollDiv.width(sDataColHeaderScrollDivWidth);

		// data area and row header area
		var oDomUpperLeftArea = jQuery.sap.byId(oCrosstab.getId() + "_upperLeft");
		var iUpperAreaHeight = oDomUpperLeftArea.outerHeight();

		if (!iUpperAreaHeight) {
			// Required for IE if there is no dimension header
			var oDomUpperRightArea = jQuery.sap.byId(oCrosstab.getId() + "_upperRight");
			iUpperAreaHeight = oDomUpperRightArea.outerHeight();
		}

		var sDataRowHeaderScrollDivHeight = (iRenderSizeDivSize.iHeight - iUpperAreaHeight) + "px";

		oDomDataScrollDiv.height(sDataRowHeaderScrollDivHeight);

		var oDomRowHeaderScrollDiv = jQuery.sap.byId(oCrosstab.getId() + "_lowerLeft_scrollDiv");
		oDomRowHeaderScrollDiv.height(sDataRowHeaderScrollDivHeight);
	};

	this.appendLeftCols = function (oArea, iNumberOfCols) {
		var iStartCol = Math.max(0, oArea.getRenderStartCol() - iNumberOfCols);
		var iEndCol = Math.max(0, oArea.getRenderStartCol() - 1);
		var iActualNumberOfCols = iNumberOfCols;
		if (iStartCol === iEndCol) {
			iActualNumberOfCols = 1;
		}

		var iStartRow = oArea.getRenderStartRow();
		var iEndRow = iStartRow + oArea.getRenderRowCnt() - 1;
		var oCell = null;

		var iRowCounter = 0;
		var iColCounter = 0;
		var iRow = 0;

		var oJqTable = $(document.getElementById(oArea.getId()));
		var oJqTableBody = oJqTable.children("tbody");

		if (oJqTableBody.length === 0) {
			oJqTable.append("<tbody></tbody>");
			oJqTableBody = oJqTable.children("tbody");
			for (iRow = iStartRow; iRow <= iEndRow; iRow++) {
				oJqTableBody.append("<tr/>");
			}
		}

		var oRows = oJqTableBody.children("tr");

		for (iRow = iStartRow; iRow <= iEndRow; iRow++) {
			var oRow = oRows[iRowCounter];

			iColCounter = 0;

			for (var iCol = iStartCol; iCol <= iEndCol; iCol++) {
				if (iColCounter === 0) {
					oCell = oArea.getCellWithColSpan(iRow, iCol);
				} else {
					oCell = oArea.getCell(iRow, iCol);
				}

				if (oCell) {
					var iColSpan = oCell.getColSpan();

					if (iColSpan > 1) {

						var iEffectiveColSpan = oCell.getEffectiveColSpan();
						var iRenderedColCnt = Math.min(iActualNumberOfCols, (oArea.getRenderStartCol() - iStartCol));
						var iRemainingColSpan = iEffectiveColSpan - (iRenderedColCnt - iColCounter);

						if (iRemainingColSpan > 0) {
							var oCellToBeRemoved = $(oRow).find("> :first-child");
							oCellToBeRemoved.remove();
						}

					}
					oRenderManager.renderControl(oCell);
				}
				iColCounter++;
			}

			var sRowHtml = $($(oRows[iRowCounter])).html();
			oRenderManager.write(sRowHtml);
			oRenderManager.flush(oRow);
			iRowCounter++;
		}

		var iRenderColCnt = oArea.getRenderColCnt();
		var iAdditionalCols = iEndCol - iStartCol + 1;
		oArea.setRenderColCnt(iRenderColCnt + iAdditionalCols);
		oArea.setRenderStartCol(iStartCol);
	};

	this.appendTopRows = function (oArea, iNumberOfRows) {
		var iStartRow = Math.max(0, oArea.getRenderStartRow() - iNumberOfRows);
		var iEndRow = Math.max(0, oArea.getRenderStartRow() - 1);
		var iActualNumberOfRows = iNumberOfRows;
		if (iStartRow === iEndRow) {
			iActualNumberOfRows = 1; // can't get bigger than that no matter what iNumberOfRows
		}
		var iStartCol = oArea.getRenderStartCol();
		var iEndCol = iStartCol + oArea.getRenderColCnt() - 1;

		var oJqTable = $(document.getElementById(oArea.getId()));
		var oJqTBody = oJqTable.children("tbody");

		if (oJqTBody.length === 0) {
			oJqTable.append("<tbody/>");
			oJqTBody = oJqTable.children("tbody");
		}

		var sRows = oJqTBody.html();
		var aColIndexes = [];

		var iRowCounter = 0;
		var iColCounter = 0;

		var oCell = null;

		if (!oCrosstab.getPropertyBag().isDebugMode()) {
			oJqTBody.hide();
		}
		// Render the new rows & find cells that need to be deleted in the old rows
		for (var iRow = iStartRow; iRow <= iEndRow; iRow++) {
			iColCounter = 0;
			oRenderManager.write("<tr");
			oRenderManager.writeAttribute("class", "sapzencrosstab-HeaderRow");
			oRenderManager.write(">");
			for (var iCol = iStartCol; iCol <= iEndCol; iCol++) {
				oCell = null;
				if (iRowCounter === 0) {
					oCell = oArea.getCellWithRowSpan(iRow, iCol);
				} else {
					oCell = oArea.getCell(iRow, iCol);
				}

				if (oCell) {
					var iRowSpan = oCell.getRowSpan();
					if (iRowSpan > 1) {
						var iEffectiveRowSpan = oCell.getEffectiveRowSpan();
						var iRemainingRowSpan = iEffectiveRowSpan - (iActualNumberOfRows - iRowCounter);

						if (iRemainingRowSpan > 0) {
							aColIndexes.push(iCol);
						}
					}
					oRenderManager.renderControl(oCell);
				}
				iColCounter++;
			}
			oRenderManager.write("</tr>");
			iRowCounter++;
		}

		var aCellIds = [];
		// delete old cells
		if (aColIndexes.length > 0) {
			var oRows = $(document.getElementById(oArea.getId())).children("tbody").children("tr");
			var oFirstRow = $(oRows[0]);
			var i = 0;
			for (i = 0; i < aColIndexes.length; i++) {
				var oCell = oFirstRow.find("> :nth-child(" + (aColIndexes[i] + 1) + ")");
				if (oCell.length > 0) {
					var sCellId = oCell.attr('id');
					aCellIds.push(sCellId);
				}
			}

			for (var j = 0; j < aCellIds.length; j++) {
				var oCellToBeRemoved = oFirstRow.find("#" + $.sap.encodeCSS(aCellIds[j]));
				oCellToBeRemoved.remove();
			}

			oRenderManager.write("<tr");
			oRenderManager.writeAttribute("class", "sapzencrosstab-HeaderRow");
			oRenderManager.write(">");
			oRenderManager.write(oFirstRow.html() + "</tr>");

			for (i = 1; i < oRows.length; i++) {
				oRenderManager.write("<tr");
				oRenderManager.writeAttribute("class", "sapzencrosstab-HeaderRow");
				oRenderManager.write(">");
				oRenderManager.write($(oRows[i]).html() + "</tr>");
			}

		} else {
			oRenderManager.write(sRows);
		}

		oArea.setRenderStartRow(iStartRow);
		oArea.setRenderRowCnt(oArea.getRenderRowCnt() + iEndRow - iStartRow + 1);

		oRenderManager.flush(oJqTBody[0]);
		oJqTBody.show();
	};

	function createScrollEvent (iPos, oScrollbar, bIsScrollableHeaderCell) {
		var iNewPos = 0;
		var iOldScrollPos = oScrollbar.getScrollPosition();

		var oEvent = {};
		oEvent.parameters = {};
		oEvent.oSource = oScrollbar;
		oEvent.parameters.oldScrollPos = iOldScrollPos;

		if (oCrosstab.getPropertyBag().isPixelScrolling() || bIsScrollableHeaderCell) {
			iNewPos = Math.max(0, Math.min(iPos, parseInt(oScrollbar.getContentSize(), 10)));
			oEvent.parameters.action = "Drag";
		} else {
			iNewPos = Math.max(0, Math.min(iPos, oScrollbar.getSteps()));
			oEvent.parameters.action = "STEP";
		}

		oEvent.getParameters = function () {
			return this.parameters;
		};

		oEvent.parameters.newScrollPos = iNewPos;
		oEvent.parameters.forward = (iNewPos - iOldScrollPos) > 0;

		return oEvent;
	}

	this.scrollHorizontal = function (iHPos) {
		if (oCrosstab.getHScrollbar()) {
			var oEvent = createScrollEvent(iHPos, oCrosstab.getHScrollbar());
			oCrosstab.getHScrollbar().setScrollPosition(oEvent.getParameters().newScrollPos);
			oScrollManager.hScrollHandler(oEvent, true);
		}
	};

	this.scrollVertical = function (iVPos, bUseTimer) {
		if (oCrosstab.getVScrollbar()) {
			var oEvent = createScrollEvent(iVPos, oCrosstab.getVScrollbar());
			oCrosstab.getVScrollbar().setScrollPosition(oEvent.getParameters().newScrollPos);
			var bNoTimer = false;
			if (!bUseTimer) {
				bNoTimer = true;
			}
			oScrollManager.vScrollHandler(oEvent, bNoTimer);
		}
	};

	this.scrollHeaderHorizontal = function (iPos) {
		var oHScrollbar = oCrosstab.getHorizontalHeaderScrollbar();
		if (oHScrollbar) {
			var oEvent = createScrollEvent(iPos, oHScrollbar, true);
			oHScrollbar.setScrollPosition(oEvent.getParameters().newScrollPos);
			oHeaderScrollManager.hScrollHandler(oEvent);
		}
	};

	this.getMeasuringHelper = function () {
		return oMeasuring;
	};

	this.reset = function (bKeepCalculatedColWidths) {
		oCrossRequestManager.reset();
		if (!bKeepCalculatedColWidths) {
			oCrossRequestManager.clearSavedColWidths();
		}
		oScrollManager = null;
		oMeasuring.reset();
		if (oScrollbarRenderer) {
			oScrollbarRenderer.destroy();
			oScrollbarRenderer = null;
		}
		aNewScrollbarEventHandlers = [];
		bDivSizesValid = false;
		iRenderSizeDivOrigBottom = -1;
	};

	this.adjustScrollPositions = function (bRenderScrollbars) {
		if (oScrollbarVisibility.bHasHScrollbar || oScrollbarVisibility.bHasVScrollbar) {
			if (bDeferredVScrollPosDetermination && oCrosstab.getPropertyBag().isPixelScrolling()) {
				// calculate actual heuristic pixel scrolltop from row information based
				// on the area sizes.
				// in case of deferred position determination (as it currently only occurs when
				// sorting in a crosstab with selection and pixel scrolling enabled), the iPos information
				// in the VScrollInfo object contains the row which needs to be transferred into a
				// pixel scrolltop value
				var iScrollTop = 0;
				var oVScrollInfo = oCrossRequestManager.getSavedVScrollInfo();
				if (oVScrollInfo) {
					var oDataArea = oCrosstab.getDataArea();
					var iDataAreaHeight = oMeasuring.getAreaHeight(oDataArea);
					var iTotalDataRows = oDataArea.getRowCnt();
					var iAverageRowHeight = Math.round(iDataAreaHeight / iTotalDataRows);
					iScrollTop = oVScrollInfo.iPos * iAverageRowHeight;
				}
				oScrollManager.setVScrollPos(iScrollTop);
			}

			var bHScrolledToEnd = undefined;
			var bVScrolledToEnd = undefined;
			if (oCrossRequestManager) {
				if (oCrossRequestManager.hasSavedInfo()) {
					var oScrollInfo = oCrossRequestManager.getSavedHScrollInfo();
					if (oScrollInfo) {
						bHScrolledToEnd = oScrollInfo.bScrolledToEnd;
					}
					oScrollInfo = oCrossRequestManager.getSavedVScrollInfo();
					if (oScrollInfo) {
						bVScrolledToEnd = oScrollInfo.bScrolledToEnd;
					}
				}
			}
			oScrollManager.moveScrollbars(oScrollbarVisibility, bRenderScrollbars, bHScrolledToEnd, bVScrolledToEnd);
			bDeferredVScrollPosDetermination = false;
		}

		// adjust header scrollbar
		if (oCrosstab.isHeaderHScrolling() === true) {
			if (oCrossRequestManager && oCrossRequestManager.hasSavedInfo() === true) {
				oHeaderScrollManager.setHScrollData(oCrossRequestManager.getHeaderScrollData());
				oHeaderScrollManager.moveScrollbars();
			}
		}
	};

	this.hasCrosstabSizeChanged = function () {
		return oMeasuring.hasCrosstabSizeChanged(true);
	};

	this.getTableDivValues = function () {
		return oMeasuring.getTableDivBordersAndPadding();
	};

	function initDomElementProvider () {
		var oTableDiv = oCrosstab.getTableDiv();

		var sColHeaderAreaId = oColHeaderArea.getId();
		var sRowHeaderAreaId = oRowHeaderArea.getId();
		var sDimHeaderAreaId = oDimensionHeaderArea.getId();
		var sDataAreaId = oDataArea.getId();

		oDomElementProvider.addElement(oCrosstab.getId(), oTableDiv);
		oDomElementProvider.addElement(sColHeaderAreaId, oTableDiv.find("#" + $.sap.encodeCSS(sColHeaderAreaId)));
		oDomElementProvider.addElement(sRowHeaderAreaId, oTableDiv.find("#" + $.sap.encodeCSS(sRowHeaderAreaId)));
		oDomElementProvider.addElement(sDimHeaderAreaId, oTableDiv.find("#" + $.sap.encodeCSS(sDimHeaderAreaId)));
		oDomElementProvider.addElement(sDataAreaId, oTableDiv.find("#" + $.sap.encodeCSS(sDataAreaId)));
	}

	this.showLoadingIndicator = function () {
		if (!sLoadingTimerId && !bIsLoadingAnimationVisible) {
			sLoadingTimerId = setTimeout(displayLoadingIndicator, 300);
		} else if (bIsLoadingAnimationVisible) {
			displayLoadingIndicator();
		}
	};

	function displayLoadingIndicator () {
		bIsLoadingAnimationVisible = true;
		var oTableDiv = oDomElementProvider.getElement(oCrosstab.getId());
		oTableDiv.addClass("sapzencrosstab-TableDivLoading");
		var oAnimDiv = oTableDiv.find("#" + $.sap.encodeCSS(oCrosstab.getId() + "_loadingAnimationDiv"));
		var iWidth = parseInt(oAnimDiv.css("width"), 10);
		var iHeight = parseInt(oAnimDiv.css("height"), 10);
		var oRenderSizeDivSize = oMeasuring.getRenderSizeDivSize(oCrosstab);
		var iLeft = oRenderSizeDivSize.iWidth / 2 - iWidth / 2;
		var iTop = oRenderSizeDivSize.iHeight / 2 - iHeight / 2;
		oAnimDiv.css("top", iTop + "px");
		oAnimDiv.css("left", iLeft + "px");
		oAnimDiv.css("visibility", "visible");
	}

	function cleanupTimer () {
		if (sLoadingTimerId) {
			clearTimeout(sLoadingTimerId);
			sLoadingTimerId = "";
		}
	}

	this.hideLoadingIndicator = function () {
		cleanupTimer();
		var oTableDiv = oDomElementProvider.getElement(oCrosstab.getId());
		oTableDiv.removeClass("sapzencrosstab-TableDivLoading");
		var oAnimationDiv = oTableDiv.find("#" + $.sap.encodeCSS(oCrosstab.getId() + "_loadingAnimationDiv"));
		if (oAnimationDiv && oAnimationDiv[0]) {
			oAnimationDiv.css("visibility", "hidden");
		}
		bIsLoadingAnimationVisible = false;
	};

	this.showLoadingVisualization = function () {
		if (oDataArea.hasLoadingPages()) {
			this.showLoadingIndicator();
		} else {
			this.hideLoadingIndicator();
		}
	};

	this.moveScrollDivs = function () {
		if (oScrollManager) {
			if (oScrollbarVisibility) {
				if (oScrollbarVisibility.bHasHScrollbar) {
					oScrollManager.positionHScrollDiv();
				}
				if (oScrollbarVisibility.bHasVScrollbar) {
					oScrollManager.positionVScrollDiv();
				}
			}
		}
	};

	this.getCrossRequestManager = function () {
		return oCrossRequestManager;
	};

	this.registerNewScrollbarsNotification = function (fHandler) {
		if ($.inArray(fHandler, aNewScrollbarEventHandlers) === -1) {
			aNewScrollbarEventHandlers.push(fHandler);
		}
	};

	this.checkScrollbarSize = function () {
		if (oScrollbarVisibility.bHasVScrollbar) {
			var oDomUpperRightPad = $(document.getElementById(oCrosstab.getId() + '_upperRightPad'));
			var oDomUpperScrollDiv = null;

			if (oCrosstab.hasDimensionHeaderArea()) {
				oDomUpperScrollDiv = $(document.getElementById(oCrosstab.getId() + '_upperLeft_scrollDiv'));
			} else if (oCrosstab.hasColHeaderArea()) {
				oDomUpperScrollDiv = $(document.getElementById(oCrosstab.getId() + '_upperRight_scrollDiv'));
			}

			if (oDomUpperRightPad !== null && oDomUpperRightPad.length > 0 && oDomUpperScrollDiv !== null
					&& oDomUpperScrollDiv.length > 0) {
				var iUpperScrollDivHeight = oDomUpperScrollDiv.outerHeight();
				if (iUpperScrollDivHeight !== oDomUpperRightPad.outerHeight()) {
					if (oScrollbarRenderer) {
						oScrollbarRenderer.adjustVScrollbarHeight(iUpperScrollDivHeight);
					}
				}
			}
		}

		if (oScrollbarVisibility.bHasHScrollbar) {
			var oDomLowerLeftPad = $(document.getElementById(oCrosstab.getId() + '_lowerLeftPad'));
			var oDomLeftScrollDiv;

			if (oCrosstab.hasRowHeaderArea()) {
				oDomLeftScrollDiv = $(document.getElementById(oCrosstab.getId() + '_lowerLeft_scrollDiv'));
			} else {
				oDomLeftScrollDiv = $(document.getElementById(oCrosstab.getId() + '_upperLeft_scrollDiv'));
			}

			var iLeftScrollDivWidth = oDomLeftScrollDiv.outerWidth();

			if (iLeftScrollDivWidth !== oDomLowerLeftPad.outerWidth()) {
				if (oScrollbarRenderer) {
					oScrollbarRenderer.adjustHScrollbarWidth(iLeftScrollDivWidth);
				}
			}
		}

	};

	this.updateRenderingOfInputCellAfterCheck = function (oCell) {
		var oJqCell = $(document.getElementById(oCell.getId()));
		if (oJqCell.length > 0) {
			var sClassName = sap.zen.crosstab.CellStyleHandler.getCompleteStyleName(
					sap.zen.crosstab.rendering.RenderingConstants.STYLE_INVALID_VALUE, oCell.getCellType());
			if (oCell.hasStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_INVALID_VALUE) === true) {
				oJqCell.addClass(sClassName);
			} else {
				oJqCell.removeClass(sClassName);
			}
			var oJqContentDiv = oJqCell.find("#" + $.sap.encodeCSS(oCell.getId() + "_contentDiv"));
			oJqContentDiv.html(oCell.getText());
		}
	};

	this.updateHeaderScrollbarSizes = function () {
		if (oScrollbarRenderer) {
			oScrollbarRenderer.setHorizontalHeaderScrollbarSteps();
			oScrollbarRenderer.adjustHorizontalHeaderScrollbarContainerSize();
		}
	};

	function manipulateHeaderAreaClass (sPostFix, bAdd) {
		var oArea = $(document.getElementById(oCrosstab.getId() + sPostFix));
		if (oArea.length > 0) {
			if (bAdd === true) {
				oArea.find("tbody>tr[class=sapzencrosstab-HeaderRow]>td:last-child").addClass(
						"sapzencrosstab-removeRightBorder");
			} else {
				oArea.find("tbody>tr[class=sapzencrosstab-HeaderRow]>td:last-child").removeClass(
						"sapzencrosstab-removeRightBorder");
			}
		}
	}

	function setHeaderScrollStyles (oJqRowHeaderDiv, oJqDimHeaderDiv) {
		if (oJqRowHeaderDiv && oJqRowHeaderDiv.length > 0) {
			oJqRowHeaderDiv.addClass("sapzencrosstab-lowerScrollHeaderSeparator");
			manipulateHeaderAreaClass("_rowHeaderArea", true);
		}

		if (oJqDimHeaderDiv && oJqDimHeaderDiv.length > 0) {
			oJqDimHeaderDiv.addClass("sapzencrosstab-upperScrollHeaderSeparator");
			manipulateHeaderAreaClass("_dimHeaderArea", true);
		}
	}

	function removeHeaderScrollStyles (oJqRowHeaderDiv, oJqDimHeaderDiv) {
		if (oJqRowHeaderDiv && oJqRowHeaderDiv.length > 0) {
			oJqRowHeaderDiv.removeClass("sapzencrosstab-lowerScrollHeaderSeparator");
			manipulateHeaderAreaClass("_rowHeaderArea", false);
		}
		if (oJqDimHeaderDiv && oJqDimHeaderDiv.length > 0) {
			oJqDimHeaderDiv.removeClass("sapzencrosstab-upperScrollHeaderSeparator");
			manipulateHeaderAreaClass("_dimHeaderArea", false);
		}
	}

	this.getLeftScrollDivs = function () {
		var oJqRowHeaderDiv = null;
		var oJqDimHeaderDiv = null;

		if (oCrosstab.hasRowHeaderArea()) {
			oJqRowHeaderDiv = $(document.getElementById(oCrosstab.getId() + '_lowerLeft_scrollDiv'));
		}
		if (oCrosstab.hasDimensionHeaderArea()) {
			oJqDimHeaderDiv = $(document.getElementById(oCrosstab.getId() + '_upperLeft_scrollDiv'));
		}

		return {
			"oJqRowHeaderDiv": oJqRowHeaderDiv,
			"oJqDimHeaderDiv": oJqDimHeaderDiv
		};
	};
	
	this.determineUnrestrictedRightAreaWidth = function() {
		var iWidth = 0;
		var oArea;
		var oCell;
		var iShim = 1; // default right border

		if (oCrosstab.hasDimensionHeaderArea()) {
			oArea = oCrosstab.getDimensionHeaderArea();
		} else if (oCrosstab.hasRowHeaderArea()) {
			oArea = oCrosstab.getRowHeaderArea();
		}
		
		if (oArea && oArea.getRenderColCnt() > 0) {
			oCell = oCrosstab.getTableCellWithSpans(0, oArea.getRenderColCnt() - 1);
			if (oCell) {
				iShim = parseInt($(document.getElementById(oCell.getId())).css("border-right-width"), 10);
			}
		}
		
		if (oDataArea) {
			oDataArea.saveData();
		}
		if (oColHeaderArea) {
			oColHeaderArea.saveData();
		}
		this.renderRightAreas(true);
		this.determineDefaultScrollbarsVisible();
		iWidth = this.getRightAreaContainerWidth() + (oScrollbarVisibility.bHasVScrollbar ? oMeasuring.getBrowserScrollbarWidth() : 0) + iShim;
		
		if (oDataArea) {
			$(document.getElementById(oDataArea.getId())).find("tbody").empty();
			oDataArea.restoreData();
		}
		if (oColHeaderArea) {
			$(document.getElementById(oColHeaderArea.getId())).find("tbody").empty();
			oColHeaderArea.restoreData();
		}
		
		return iWidth;
	};
	
	this.calculateLeftAreaHeaderWidth = function(iMaxContentWidth, iLeftAreaWidth, iRightAreaWidth) {
		var iWidth = 0;
		var iMaxHeaderWidth = oCrosstab.getPropertyBag().getMaxHeaderWidth();
		var iUserHeaderWidth = oCrosstab.getPropertyBag().getUserHeaderWidth();
		var oJqRenderSizeDiv;
		var iHalfWidth = Math.round(iMaxContentWidth / 2.0);
		
		if (iMaxHeaderWidth > 0) {
			if (iUserHeaderWidth > 0) {
				iWidth = Math.min(iMaxHeaderWidth, iUserHeaderWidth);
			} else {
				iWidth = Math.min(iMaxHeaderWidth, iLeftAreaWidth);
			}
		} else {
			iWidth = iUserHeaderWidth;
		}
		
		if (iWidth >= iMaxContentWidth) {
			iWidth = 0;
		}
		
		if (iWidth >= iLeftAreaWidth) {
			iWidth = 0;
		}
		
		if (iLeftAreaWidth + iRightAreaWidth > iMaxContentWidth) {
			if (this.hasRightArea()) {
				if (iWidth === 0) {
					if (iRightAreaWidth <= iHalfWidth) {
						// render all of the right area. Make the left area appropriately wide
						oJqRenderSizeDiv = oCrosstab.getRenderSizeDiv();
						iWidth = iMaxContentWidth - iRightAreaWidth - parseInt(oJqRenderSizeDiv.css("border-right-width"), 10) - parseInt(oJqRenderSizeDiv.css("border-left-width"), 10) - 1;
					} else if (iLeftAreaWidth <= iHalfWidth) {
						// render all of the left area
						iWidth = iLeftAreaWidth;
					} else {
						// no area fits fully, so split them up evenly
						iWidth = iHalfWidth;							
					}
				}
			} else {
				// no right area => scroll across the whole crosstab width, only one area
				iWidth = iMaxContentWidth;
			}
		} else {
			// we don't need any scrolling since everything fits into the given overall Crosstab width
			iWidth = 0;
		}
		
		// impose any user-set header width limit
		iWidth = this.limitHeaderWidth(iWidth);
		
		return iWidth;
	};
	
	this.enableHeaderResizeHandle = function(bEnable) {
		var oJqHeaderResizeHandle;
		
		oJqHeaderResizeHandle = $(document.getElementById(oCrosstab.getId() + "_headerResizeHandle"));
		if (oJqHeaderResizeHandle && oJqHeaderResizeHandle.length > 0) {
			oJqHeaderResizeHandle.css("visibility", bEnable ? "visible" : "hidden");
		}
	};

	this.forceHeaderWidth = function () {
		var oJqRowHeaderDiv = null;
		var oJqDimHeaderDiv = null;
		var iLeftAreaWidth = 0;
		var iRightAreaWidth = 0;
		var iWidth = 0;
		var iMaxContentWidth = 0;
		var oScrollDivs = null;
		var iCurrentWidth = 0;

		if (oCrosstab.hasRowHeaderArea() === false && oCrosstab.hasDimensionHeaderArea() === false) {
			return;
		}
		
		oScrollDivs = this.getLeftScrollDivs();
		oJqRowHeaderDiv = oScrollDivs.oJqRowHeaderDiv;
		oJqDimHeaderDiv = oScrollDivs.oJqDimHeaderDiv;

		iLeftAreaWidth = this.getLeftAreaContainerWidth();
		if (this.hasRightArea()) {
			iRightAreaWidth = this.determineUnrestrictedRightAreaWidth();
		}
		iMaxContentWidth = oCrosstab.getContentWidth();
		
		iWidth = this.calculateLeftAreaHeaderWidth(iMaxContentWidth, iLeftAreaWidth, iRightAreaWidth);

		if (iWidth > 0) {
			// force widths
			this.setDivWidth(oJqRowHeaderDiv, iWidth);
			this.setDivWidth(oJqDimHeaderDiv, iWidth);

			oCrosstab.setHeaderHScrolling(true);
			iCurrentHeaderWidth = iWidth;
			setHeaderScrollStyles(oJqRowHeaderDiv, oJqDimHeaderDiv);
			this.enableHeaderResizeHandle(true);
		} else {
			oCrosstab.setHorizontalHeaderScrollbar(null);
			oCrosstab.setHeaderHScrolling(false);
			iCurrentHeaderWidth = 0;
			removeHeaderScrollStyles(oJqRowHeaderDiv, oJqDimHeaderDiv);
			this.enableHeaderResizeHandle(false);
			oCrosstab.getUtils().sendClientScrollPosUpdate(0, undefined, undefined, undefined, true);
			oCrosstab.getPropertyBag().setUserHeaderWidth(0);
			this.sendHeaderLimit("N0", true);
		}
	};

	this.hasRightArea = function () {
		return oCrosstab.hasDataArea() || oCrosstab.hasColHeaderArea();
	};

	this.hasLeftArea = function () {
		return oCrosstab.hasDimensionHeaderArea() || oCrosstab.hasRowHeaderArea();
	};

	this.getLeftAreaContainerWidth = function () {
		var iLeftAreaContainerWidth = 0;
		var oJqLeftAreaContainer = null;

		if (oCrosstab.hasDimensionHeaderArea() === true) {
			oJqLeftAreaContainer = $(document.getElementById(oCrosstab.getId() + "_dimHeaderArea_container"));
			iLeftAreaContainerWidth = oJqLeftAreaContainer.outerWidth();
		} else if (oCrosstab.hasRowHeaderArea() === true) {
			oJqLeftAreaContainer = $(document.getElementById(oCrosstab.getId() + "_rowHeaderArea_container"));
			iLeftAreaContainerWidth = oJqLeftAreaContainer.outerWidth();
		}
		
		return iLeftAreaContainerWidth;
	};

	this.getRightAreaContainerWidth = function () {
		var iRightAreaContainerWidth = 0;
		var oJqRightAreaContainer = null;

		if (oCrosstab.hasColHeaderArea() === true) {
			oJqRightAreaContainer = $(document.getElementById(oCrosstab.getId() + "_colHeaderArea_container"));
			iRightAreaContainerWidth = oJqRightAreaContainer.outerWidth();
		} else if (oCrosstab.hasDataArea() === true) {
			oJqRightAreaContainer = $(document.getElementById(oCrosstab.getId() + "_dataArea_container"));
			iRightAreaContainerWidth = oJqRightAreaContainer.outerWidth();
		}

		return iRightAreaContainerWidth;
	};

	this.getSectionWidth = function () {
		var iLeftAreaContainerWidth = this.getLeftAreaContainerWidth();
		var iRightAreaContainerWidth = this.getRightAreaContainerWidth();

		var oJqLeftScrollDiv = null;
		var oJqRightScrollDiv = null;

		var iLeftSectionCssContribution = 0;
		var iRightSectionCssContribution = 0;

		if (oCrosstab.hasDimensionHeaderArea()) {
			oJqLeftScrollDiv = $(document.getElementById(oCrosstab.getId() + "_upperLeft_scrollDiv"));
		} else if (oCrosstab.hasRowHeaderArea()) {
			oJqLeftScrollDiv = $(document.getElementById(oCrosstab.getId() + "_lowerLeft_scrollDiv"));
		}

		iLeftSectionCssContribution = sap.zen.crosstab.utils.Utils.getWidthOfMarginBorderPadding(oJqLeftScrollDiv);

		if (oCrosstab.hasColHeaderArea()) {
			oJqRightScrollDiv = $(document.getElementById(oCrosstab.getId() + "_upperRight_scrollDiv"));
		} else if (oCrosstab.hasDataArea()) {
			oJqRightScrollDiv = $(document.getElementById(oCrosstab.getId() + "_lowerRight_scrollDiv"));
		}

		iRightSectionCssContribution = sap.zen.crosstab.utils.Utils.getWidthOfMarginBorderPadding(oJqRightScrollDiv);

		var iSectionWidth = iLeftAreaContainerWidth + iRightAreaContainerWidth + iLeftSectionCssContribution
				+ iRightSectionCssContribution;

		return iSectionWidth;
	};

	this.updateHeaderResizeDiv = function () {
		var oJqHeaderResizeDiv = $(document.getElementById(oCrosstab.getId() + "_headerResizeHandle"));
		var oLeftScrollDiv = null;
		var iCssLeft = 0;
		var iMaxLeft = oCrosstab.getPropertyBag().getMaxHeaderWidth();

		if (oJqHeaderResizeDiv && oJqHeaderResizeDiv.length > 0) {
			iCssLeft = iCurrentHeaderWidth;
			if (isNaN(iCssLeft) || !iCssLeft) {
				if (iMaxLeft > 0) {
					iCssLeft = Math.min(iCssLeft, iMaxLeft);
				}
				var iLeftAreaWidth = this.getLeftAreaContainerWidth();
				var iRenderSizeDivWidth = $(document.getElementById(oCrosstab.getId() + "_renderSizeDiv")).outerWidth();
				var iResizeDivWidth = oJqHeaderResizeDiv.outerWidth();
				iCssLeft = (iLeftAreaWidth <= iRenderSizeDivWidth) ? (iLeftAreaWidth)
						: (iRenderSizeDivWidth - iResizeDivWidth);
			}
			if (oCrosstab.getPropertyBag().isRtl()) {
				oJqHeaderResizeDiv.css("right", iCssLeft + "px");
			} else {
				oJqHeaderResizeDiv.css("left", iCssLeft + "px");
			}
		}
	};
	
	this.getIntHeaderLimit = function(sLimit) {
		var iLimit;
		var sTempLimit;
		if (sLimit.indexOf("N") === 0) {
			sTempLimit = sLimit.substring(1);
		} else {
			sTempLimit = sLimit;
		}
		iLimit = parseInt(sTempLimit, 10);
		return iLimit;
	};
	
	this.sendHeaderLimit = function (sLimit, bAutoDetermination) {
		var sCommand = oCrosstab.getUserHeaderWidthCommand();
		var iLimit = 0;
		
		iLimit = this.getIntHeaderLimit(sLimit);
		if (iCurrentHeaderWidthLimit === iLimit) {
			return;
		}

		if (sCommand && sCommand.length > 0) {
			iCurrentHeaderWidthLimit = iLimit;
			oCrossRequestManager.saveColWidths();
			sCommand = sCommand.replace("__HEADER_WIDTH__", sLimit);
			oCrosstab.getUtils().executeCommandAction(sCommand, bAutoDetermination);
		}
	};

	this.getHeaderScrollManager = function () {
		return oHeaderScrollManager;
	};

	this.limitHeaderWidth = function (iWidth) {
		var iMaxWidth = oCrosstab.getPropertyBag().getMaxHeaderWidth();
		var iCalcWidth = 0;
		if (iMaxWidth > 0 && iWidth > 0) {
			iCalcWidth = Math.min(iMaxWidth, iWidth);
		} else {
			iCalcWidth = iWidth;
		}
		return iCalcWidth;
	};

	this.setDivWidth = function (oJqDiv, iWidth) {
		var sWidth = "";
		if (oJqDiv && oJqDiv.length > 0) {
			if (!iWidth) {
				sWidth = "100%";
			} else {
				sWidth = iWidth + "px";
			}

			oJqDiv.css("width", sWidth);
		}
	};
	
	this.renderLeftAreas = function() {
		this.renderDimensionHeaderArea();
		this.setUserColWidths(oCrosstab.getDimensionHeaderArea());

		this.renderRowHeaderArea(oCrosstab.getRowHeaderArea().getRenderStartRow());
		this.setUserColWidths(oCrosstab.getRowHeaderArea());

		this.adjustColWidths(oCrosstab.getDimensionHeaderArea(), oCrosstab.getRowHeaderArea());
	};
	
	this.renderRightAreas = function(bUseFullContentWidth) {	
		var iRenderStartCol = oColHeaderArea.getRenderStartCol();
		
		if (bUseFullContentWidth === true) {
			iRenderStartCol = 0;
		}
		this.renderColHeaderArea(iRenderStartCol, bUseFullContentWidth);
		this.setUserColWidths(oCrosstab.getColumnHeaderArea());

		this.renderDataArea();
		this.setUserColWidths(oCrosstab.getDataArea());

		this.adjustColWidths(oCrosstab.getColumnHeaderArea(), oCrosstab.getDataArea());		
	};
	
	this.renderCrosstabAreas = function () {
		var bIsHeaderScrollingConfigured = oCrosstab.isHeaderScrollingConfigured();

			this.renderLeftAreas();

			// all of the steps above (especially the col width adjuster) must have been done before forcing a width on
			// the header area in case of scrolling
			if (bIsHeaderScrollingConfigured === true && !oCrosstab.isPreparedDom()) {
				this.forceHeaderWidth();
			}

			this.renderRightAreas();

		this.adjustRowHeights(oCrosstab.getDimensionHeaderArea(), oCrosstab.getColumnHeaderArea());
		this.adjustRowHeights(oCrosstab.getRowHeaderArea(), oCrosstab.getDataArea());
	};
	
	this.getScrollManager = function() {
		return oScrollManager;
	};
	
	this.getScrollbarVisibility = function() {
		return oScrollbarVisibility;
	};

};
