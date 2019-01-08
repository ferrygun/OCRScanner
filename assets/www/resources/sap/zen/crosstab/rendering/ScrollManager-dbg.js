jQuery.sap.declare("sap.zen.crosstab.rendering.ScrollManager");
jQuery.sap.require("sap.zen.crosstab.utils.Measuring");
jQuery.sap.require("sap.ui.core.Popup");
jQuery.sap.require("sap.ui.core.OpenState");
jQuery.sap.require("sap.zen.crosstab.TextConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

sap.zen.crosstab.rendering.ScrollManager = function (oCrosstab, oRenderEngine) {
	"use strict";
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	var oDataArea = oCrosstab.getDataArea();
	var oMeasuring = oRenderEngine.getMeasuringHelper();

	var iCurrentVScrollStep = 0;
	var iCurrentHScrollStep = 0;
	var bHScrolledToEnd = false;
	var bVScrolledToEnd = false;

	var iHScrollValue = 0;
	var iVScrollValue = 0;

	var oLastHScrollParams = null;
	var oHScrollTimer = null;

	var oLastVScrollParams = null;
	var oVScrollTimer = null;

	var oPopup = new sap.ui.core.Popup();
	var oTextComponent = null;
	if (sap.zen.crosstab.utils.Utils.isMainMode()) {
		oTextComponent = new sap.m.Text();
	} else {
		oTextComponent = new sap.ui.commons.TextView();
		oTextComponent.setWrapping(false);
	}
	  	
	oPopup.setContent(oTextComponent);
	oPopup.setDurations(125, 500);
	oPopup.setAutoClose(true);
	oPopup.getContent().addStyleClass("sapzencrosstab-ScrollPopup");

	var iRowCntLength = (oDataArea.getRowCnt() + "").length;
	var iColCntLength = (oDataArea.getColCnt() + "").length;

	var iVPopupWidth = 0;
	var iHPopupWidth = 0;

	var bBlockHScrollEvent = false;
	var bBlockVScrollEvent = false;
	
	var that = this;

	this.destroy = function () {
		oPopup.destroy();
	};

	this.setHScrollPos = function (iHScrollPos) {
		iCurrentHScrollStep = iHScrollPos;
	};

	this.setVScrollPos = function (iVScrollPos) {
		iCurrentVScrollStep = iVScrollPos;
	};
	
	function determineRenderedRowsInArea(oArea) {
		var iRowCnt = 0;
		if (oArea) {
			iRowCnt = $(document.getElementById(oArea.getId())).children("tbody").children("tr").length;
		}
		return iRowCnt;
	}
	
	function ensureRowsInDataArea() {
		// what has been rendered in Col Header Area? Data Area must be aligned!
		var sRowSpan = "";
		var iRowSpan = 1;
		var iRenderedRowsOfRowHeader = determineRenderedRowsInArea(oRowHeaderArea);
		var iRenderedRowsOfDataArea = determineRenderedRowsInArea(oDataArea);
		
		var iMissingRows = iRenderedRowsOfRowHeader - iRenderedRowsOfDataArea;
		
		if (iMissingRows > 0) {
			oRenderEngine.beginRendering();
			oRenderEngine.appendTopRows(oDataArea, iMissingRows);
			oRowHeaderArea.setRenderStartRow(oDataArea.getRenderStartRow());
			oRowHeaderArea.setRenderRowCnt(oDataArea.getRenderRowCnt());
			oRenderEngine.adjustColWidths(oDimensionHeaderArea, oRowHeaderArea);
			oRenderEngine.adjustColWidths(oColHeaderArea, oDataArea);
			oRenderEngine.adjustRowHeights(oRowHeaderArea, oDataArea);
			oRenderEngine.finishRendering(true);
		}
	}

	function handleHScrolling (poEvent) {
		oCrosstab.getPageManager().enableTimeout(true);
		oHScrollTimer = null;
		var oParameters = null;
		if (!poEvent) {
			oParameters = oLastHScrollParams;
		} else {
			oParameters = poEvent.getParameters();
		}
		if (oParameters) {
			oCrosstab.postPlanningValue();
			var oHScrollbar = oCrosstab.getHScrollbar();
			var iMaxSteps = oHScrollbar.getSteps();
			bHScrolledToEnd = oParameters.newScrollPos === iMaxSteps;
			iCurrentHScrollStep = oParameters.newScrollPos;
			that.sendClientScrollPosUpdate();
			var iStartCol = oParameters.newScrollPos;

			if (iStartCol !== oColHeaderArea.getRenderStartCol()) {

				// If iStartCol == oColHeaderArea.getColCnt() this means that there is a need to scroll to see the end
				// of the last column.
				// The last column is already rendered but not fully visible. In this case, omit the rendering and move
				// the div.
				if (iStartCol !== oColHeaderArea.getColCnt()) {
					oRenderEngine.beginRendering();
					oRenderEngine.renderColHeaderArea(iStartCol);
					oRenderEngine.renderDataArea();
					oRenderEngine.adjustColWidths(oColHeaderArea, oDataArea);
					oRenderEngine.adjustRowHeights(oRowHeaderArea, oDataArea);
					oRenderEngine.adjustRowHeights(oDimensionHeaderArea, oColHeaderArea);
					oRenderEngine.finishRendering(true);
				}

				var iColHeaderAreaWidth = oMeasuring.getAreaWidth(oColHeaderArea);

				// The visible width of the column header area
				var iAvailableColHeaderAreaWidth = oMeasuring.getUpperRightScrollDivWidth();

				var bHasUnusedSpace = iColHeaderAreaWidth < iAvailableColHeaderAreaWidth;
				var bLastColRendered = oColHeaderArea.getRenderColCnt() + oColHeaderArea.getRenderStartCol() === oColHeaderArea
						.getColCnt();

				if (bHScrolledToEnd || bHasUnusedSpace && bLastColRendered) {
					if (bHasUnusedSpace && iStartCol > 0) {
						oRenderEngine.beginRendering();
						// "4" is purely based on heuristics
						oRenderEngine.appendLeftCols(oColHeaderArea, 4);
						oRenderEngine.appendLeftCols(oDataArea, 4);
						oRenderEngine.adjustColWidths(oColHeaderArea, oDataArea);
						oRenderEngine.adjustRowHeights(oRowHeaderArea, oDataArea);
						oRenderEngine.adjustRowHeights(oDimensionHeaderArea, oColHeaderArea);
						oRenderEngine.finishRendering(true);
					}

					// If the user scrolls to the left you can't move the scrollbar to the right, or he won't be able to
					// scroll to the left again
					if (!bHScrolledToEnd && oParameters.forward) {
						moveHScrollbar(0, true);
					}

					moveHScrollDiv(true);
				} else {
					moveHScrollDiv(false);
				}
			} else {
				if (bHScrolledToEnd) {
					moveHScrollDiv(true);
				}
			}

			if (bVScrolledToEnd) {
				ensureRowsInDataArea();
				moveVScrollDiv(true);
			}

			if (oParameters.newScrollPos === 0) {
				moveHScrollDiv(false);
			}
		}
		oPopup.close();
		
		if (oCrosstab.isScrollInvalidate() === true && !oCrosstab.hasLoadingPages()) {
			oCrosstab.setInvalidateCalledByScrolling();
			oCrosstab.invalidate();
		}
	}

	this.hScrollHandler = function (oEvent, bNoTimer) {
		if (!bBlockHScrollEvent) {
			if (bNoTimer) {
				handleHScrolling(oEvent);
			} else {
				// don't save the oEvent instance itself. It will be discarded by PHX
				oLastHScrollParams = oEvent.getParameters();
				if (oHScrollTimer) {
					clearTimeout(oHScrollTimer);
					oHScrollTimer = null;
					displayHPopup(oLastHScrollParams.newScrollPos);
				}
				oHScrollTimer = setTimeout(handleHScrolling, 200, null);
				iCurrentHScrollStep = oLastHScrollParams.newScrollPos;
			}
		} else {
			bBlockHScrollEvent = false;
		}
	};

	function moveHScrollbar (iStep, bScrollToEnd) {
		var oHScrollbar = oCrosstab.getHScrollbar();
		var iCurrentStep = oHScrollbar.getScrollPosition();
		var oCrossRequestManager;
		
		if (bScrollToEnd) {
			iStep = oHScrollbar.getSteps();
			if (oCrosstab.getPropertyBag().isRtl() && oCrosstab.getUtils().isMozilla()) {
				// HACK:
				// workaround for UI5 scrollbar not repositioning itself properly although it has correct scroll position > 0.
				// it will re-render at position 0 in rtl, regardless whether the internal scroll step is != 0 or not
				oHScrollbar.setScrollPosition(0);
				oHScrollbar.setScrollPosition(iStep);
			} 
			bHScrolledToEnd = true;
		}
		if (iCurrentStep !== iStep) {
			oHScrollbar.setScrollPosition(iStep);
			bBlockHScrollEvent = true;
		}
		iCurrentHScrollStep = iStep;
		oCrossRequestManager = oCrosstab.getRenderEngine().getCrossRequestManager();
		if (oCrossRequestManager) {
			oCrossRequestManager.setHScrollInfo(iCurrentHScrollStep, bHScrolledToEnd);
		}
	}

	function moveHScrollDiv (bScrollToEnd) {
		that.positionHScrollDiv(bScrollToEnd);
	}

	this.positionHScrollDiv = function (bScrollToEnd) {
		var oURS = $(document.getElementById(oCrosstab.getId() + "_upperRight_scrollDiv"));
		var oLRS = $(document.getElementById(oCrosstab.getId() + "_lowerRight_scrollDiv"));
		var iActualScrollValue;
		
		if (typeof(bScrollToEnd) === "undefined") {
			bScrollToEnd = bHScrolledToEnd;
		}
		
		iHScrollValue = bScrollToEnd ? oLRS[0].scrollWidth : 0;
		
		if (oCrosstab.getPropertyBag().isRtl()) {
			if ($.browser.webkit) {
				iActualScrollValue = bScrollToEnd ? 0 : oLRS[0].scrollWidth;
			} else if (oCrosstab.getUtils().isMozilla()) {
				iActualScrollValue = bScrollToEnd ? -oLRS[0].scrollWidth : 0;
			} else {
				// let the browser do the magic
				iActualScrollValue =  bScrollToEnd ? oLRS[0].scrollWidth : 0;
			}
		} else {
			iActualScrollValue = bScrollToEnd ? oLRS[0].scrollWidth : 0;
		}
		
		oLRS.scrollLeft(iActualScrollValue);
		oURS.scrollLeft(iActualScrollValue);
	};

	this.vScrollHandler = function (oEvent, bNoTimer) {
		if (!bBlockVScrollEvent) {
			if (bNoTimer) {
				handleVScrolling(oEvent);
			} else {
				// don't save the oEvent instance itself. It will be discarded by PHX
				oLastVScrollParams = oEvent.getParameters();
				if (oVScrollTimer) {
					clearTimeout(oVScrollTimer);
					oVScrollTimer = null;
					displayVPopup(oLastVScrollParams.newScrollPos);
				}
				oVScrollTimer = setTimeout(handleVScrolling, 200, null);
				iCurrentVScrollStep = oLastVScrollParams.newScrollPos;
			}
		} else {
			bBlockVScrollEvent = false;
		}
	};
	
	this.sendClientScrollPosUpdate = function() {
		oCrosstab.getUtils().sendClientScrollPosUpdate(iCurrentHScrollStep, bHScrolledToEnd, iCurrentVScrollStep, bVScrolledToEnd);
	};
	
	function displayHPopup (iScrollPos) {
		var oColHeaderArea = oCrosstab.getColumnHeaderArea();
		var oCell = null;
		var aHeaderTexts = [];
		for ( var iRow = 0; iRow < 1; iRow++) {
			oCell = oColHeaderArea.getCellWithColSpan(iRow, iScrollPos, true);
			if (oCell) {
				aHeaderTexts.push(oCell.getUnescapedText());
			} else {
				aHeaderTexts.push("?");
			}
		}
		var sLabelText = oCrosstab.getPropertyBag().getText(sap.zen.crosstab.TextConstants.COL_TEXT_KEY) + " "
				+ sap.zen.crosstab.utils.Utils.padWithZeroes(iScrollPos + 1, iColCntLength) + "/" + oColHeaderArea.getColCnt();

		if (!iHPopupWidth) {
			if (sap.zen.crosstab.utils.Utils.isMainMode()) {
				oPopup.getContent().setWrapping(false);
			}
			renderHPopup(sLabelText);
			if (sap.zen.crosstab.utils.Utils.isMainMode()) {
				iHPopupWidth = $(document.getElementById(oPopup.getContent().getId())).outerWidth();
			} else {
				iHPopupWidth = $(document.getElementById(oPopup.getContent().getId())).innerWidth();				
			}
		}

		if (sap.zen.crosstab.utils.Utils.isMainMode()) {
			oPopup.getContent().setMaxLines(aHeaderTexts.length + 1);
			oPopup.getContent().setWrapping(true);
		}
		
		sLabelText = sLabelText + "\n" + aHeaderTexts.join("\n");
		renderHPopup(sLabelText);
	}

	function renderHPopup (sLabelText) {
		oPopup.getContent().setProperty("text", sLabelText, true);
		var eDock = sap.ui.core.Popup.Dock;

		if (iHPopupWidth) {
			oPopup.getContent().setWidth(iHPopupWidth + "px");
		}

		var oHScrollbar = oCrosstab.getHScrollbar();
		var iWidth = oMeasuring.getRenderSizeDivSize().iWidth - oMeasuring.getAreaWidth(oCrosstab.getRowHeaderArea());
		var iPopupWidth = $(document.getElementById(oPopup.getContent().getId())).outerWidth();
		iWidth = iWidth - iPopupWidth;
		var rPercent = oHScrollbar.getScrollPosition() / oHScrollbar.getSteps();
		var sXCoord = (iWidth * rPercent) + " ";

		oPopup.setPosition(eDock.BeginBottom, eDock.BeginTop, document.getElementById(oCrosstab.getHScrollbar().getId()), sXCoord
				+ "-20");

		if (oPopup.getOpenState() === sap.ui.core.OpenState.CLOSED) {
			oPopup.open(-1);
		}
		oPopup.getContent().rerender();
	}

	function displayVPopup (iScrollPos) {
		var oRowHeaderArea = oCrosstab.getRowHeaderArea();
		var oCell = null;
		var aHeaderTexts = [];
		// oRowHeaderArea.getColCnt()
		for ( var iCol = 0; iCol < 1; iCol++) {
			oCell = oRowHeaderArea.getCellWithRowSpan(iScrollPos, iCol, true);
			if (oCell) {
				aHeaderTexts.push(oCell.getUnescapedText());
			} else {
				aHeaderTexts.push("?");
			}
		}
		var sLabelText = oCrosstab.getPropertyBag().getText(sap.zen.crosstab.TextConstants.ROW_TEXT_KEY) + " "
				+ sap.zen.crosstab.utils.Utils.padWithZeroes(iScrollPos + 1, iRowCntLength) + "/" + oRowHeaderArea.getRowCnt();

		if (!iVPopupWidth) {
			if (sap.zen.crosstab.utils.Utils.isMainMode()) {
				oPopup.getContent().setWrapping(false);
			}
			renderVPopup(sLabelText);
			if (sap.zen.crosstab.utils.Utils.isMainMode()) {
				iVPopupWidth = $(document.getElementById(oPopup.getContent().getId())).outerWidth();
			} else {
				iVPopupWidth = $(document.getElementById(oPopup.getContent().getId())).innerWidth();				
			}
		}
		sLabelText = sLabelText + "\n" + aHeaderTexts.join("\n");
		
		if (sap.zen.crosstab.utils.Utils.isMainMode()) {
			oPopup.getContent().setMaxLines(aHeaderTexts.length + 1);
			oPopup.getContent().setWrapping(true);
		}
		
		renderVPopup(sLabelText);
	}

	function renderVPopup (sLabelText) {
		oPopup.getContent().setProperty("text", sLabelText, true);
		var eDock = sap.ui.core.Popup.Dock;
		var oVScrollbar = oCrosstab.getVScrollbar();
		var iHeight = oMeasuring.getRenderSizeDivSize().iHeight
				- oMeasuring.getAreaHeight(oCrosstab.getColumnHeaderArea());
		var iPopupHeight = $(document.getElementById(oPopup.getContent().getId())).outerHeight();
		iHeight = iHeight - iPopupHeight;
		var rPercent = oVScrollbar.getScrollPosition() / oVScrollbar.getSteps();
		var sYCoord = " " + (iHeight * rPercent);

		oPopup
				.setPosition(eDock.EndTop, eDock.BeginTop, document.getElementById(oCrosstab.getVScrollbar().getId()), "-20"
						+ sYCoord);

		if (iVPopupWidth) {
			oPopup.getContent().setWidth(iVPopupWidth + "px");
		}

		if (oPopup.getOpenState() === sap.ui.core.OpenState.CLOSED) {
			oPopup.open(-1);
		}
		oPopup.getContent().rerender();
	}
	
	function determineRenderedColsInArea(oArea) {
		var sColSpan = "";
		var iColSpan = 1;
		var iColCnt = 0;
		$(document.getElementById(oArea.getId())).children("tbody").children("tr:last").children("td").each(function(index, domTd) {
			sColSpan = $(domTd).attr("colspan");
			if (!sColSpan) {
				iColSpan = 1;
			} else {
				iColSpan = parseInt(sColSpan, 10);
			}
			iColCnt = iColCnt + iColSpan;
		});
		return iColCnt;
	}
	
	function ensureColsInDataArea() {
		// what has been rendered in Col Header Area? Data Area must be aligned!
		var sColSpan = "";
		var iColSpan = 1;
		var iCellCnt = determineRenderedColsInArea(oColHeaderArea);
	
		var iRenderedCols = determineRenderedColsInArea(oDataArea);
		var iMissingCols = iCellCnt - iRenderedCols;
		
		if (iMissingCols > 0) {
			oRenderEngine.beginRendering();
			oRenderEngine.appendLeftCols(oDataArea, iMissingCols);
			oColHeaderArea.setRenderStartCol(oDataArea.getRenderStartCol());
			oColHeaderArea.setRenderColCnt(oDataArea.getRenderColCnt());
			oRenderEngine.adjustColWidths(oColHeaderArea, oDataArea);
			oRenderEngine.adjustRowHeights(oRowHeaderArea, oDataArea);
			oRenderEngine.adjustRowHeights(oDimensionHeaderArea, oColHeaderArea);
			oRenderEngine.finishRendering(true);
		}
	}
	
	function handleVScrolling (poEvent) {
		oCrosstab.getPageManager().enableTimeout(true);
		oVScrollTimer = null;
		var oParameters = null;
		if (!poEvent) {
			oParameters = oLastVScrollParams;
		} else {
			oParameters = poEvent.getParameters();
		}
		if (oParameters) {
			oCrosstab.postPlanningValue();
			var oVScrollbar = oCrosstab.getVScrollbar();
			var iMaxSteps = oVScrollbar.getSteps();
			bVScrolledToEnd = oParameters.newScrollPos === iMaxSteps;
			iCurrentVScrollStep = oParameters.newScrollPos;
			that.sendClientScrollPosUpdate();
			var iStartRow = oParameters.newScrollPos;

			// TODO: make sure this is not executed because of stray scrolling events that do not result from any
			// scrolling

			if (iStartRow !== oRowHeaderArea.getRenderStartRow()) {
				
				// If iStartRow == oRowHeaderArea.getRowCnt() this means that there is a need to scroll to see the end
				// of the last row.
				// The last row is already rendered but not fully visible. In this case, omit the rendering and move
				// the div.
				if (iStartRow !== oRowHeaderArea.getRowCnt()) {
					oRenderEngine.beginRendering();
					oRenderEngine.renderRowHeaderArea(iStartRow);
					oRenderEngine.renderDataArea();
					oRenderEngine.adjustColWidths(oDimensionHeaderArea, oRowHeaderArea);
					oRenderEngine.adjustColWidths(oColHeaderArea, oDataArea);
					oRenderEngine.adjustRowHeights(oRowHeaderArea, oDataArea);
					oRenderEngine.finishRendering(true);
				}

				var iRowHeaderAreaHeight = oMeasuring.getAreaHeight(oRowHeaderArea);

				// The visible height of the row header area
				var iAvailableRowHeaderAreaHeight = oMeasuring.getLowerScrollDivHeight();

				var bHasUnusedSpace = iRowHeaderAreaHeight < iAvailableRowHeaderAreaHeight;
				var bLastRowRendered = oRowHeaderArea.getRenderRowCnt() + oRowHeaderArea.getRenderStartRow() === oRowHeaderArea
						.getRowCnt();

				if (bVScrolledToEnd || bHasUnusedSpace && bLastRowRendered) {
					if (bHasUnusedSpace && iStartRow > 0) {
						oRenderEngine.beginRendering();
						// "2" is purely based on heuristics
						oRenderEngine.appendTopRows(oRowHeaderArea, 2);
						oRenderEngine.appendTopRows(oDataArea, 2);
						oRenderEngine.adjustColWidths(oDimensionHeaderArea, oRowHeaderArea);
						oRenderEngine.adjustColWidths(oColHeaderArea, oDataArea);
						oRenderEngine.adjustRowHeights(oRowHeaderArea, oDataArea);
						oRenderEngine.finishRendering(true);
					}

					// If the user scrolls to the top you can't move the scrollbar to the bottom, or he won't be able to
					// scroll to the top again
					if (!bVScrolledToEnd && oParameters.forward) {
						moveVScrollbar(0, true);
					}

					moveVScrollDiv(true);
				} else {
					moveVScrollDiv(false);
				}
			} else {
				if (bVScrolledToEnd) {
					moveVScrollDiv(true);
				}
			}

			if (oParameters.newScrollPos === 0) {
				moveVScrollDiv(false);
			}

			if (bHScrolledToEnd) {
				ensureColsInDataArea();
				moveHScrollDiv(true);
			}
		}
		oPopup.close();
		adjustHeaderScrollDivs();
	}
	
	function adjustHeaderScrollDivs() {
		var oHeaderScrollManager = oCrosstab.getRenderEngine().getHeaderScrollManager();
		if (oHeaderScrollManager) {
			oHeaderScrollManager.moveScrollbars();
		}
	}

	function moveVScrollbar (iStep, bScrollToEnd) {
		var oVScrollbar = oCrosstab.getVScrollbar();
		var iCurrentStep = oVScrollbar.getScrollPosition();
		var oCrossRequestManager;
		
		if (bScrollToEnd) {
			iStep = oVScrollbar.getSteps();
			bVScrolledToEnd = true;
		}
		if (iCurrentStep !== iStep) {
			oVScrollbar.setScrollPosition(iStep);
			bBlockVScrollEvent = true;
		}
		iCurrentVScrollStep = iStep;
		oCrossRequestManager = oCrosstab.getRenderEngine().getCrossRequestManager();
		if (oCrossRequestManager) {
			oCrossRequestManager.setVScrollInfo(iCurrentVScrollStep, bVScrolledToEnd);
		}
	}

	function moveVScrollDiv (bScrollToEnd) {
		that.positionVScrollDiv(bScrollToEnd);
	}

	this.positionVScrollDiv = function(bScrollToEnd) {
		var	oLRS = $(document.getElementById(oCrosstab.getId() + "_lowerRight_scrollDiv"));
		var oLLS = $(document.getElementById(oCrosstab.getId() + "_lowerLeft_scrollDiv"));

		if (typeof(bScrollToEnd) === "undefined") {
			bScrollToEnd = bVScrolledToEnd;
		}
		
		iVScrollValue = bScrollToEnd ? oLRS[0].scrollHeight : 0;
		
		oLRS.scrollTop(iVScrollValue);
		oLLS.scrollTop(iVScrollValue);
	};

	this.moveScrollbars = function (oScrollbarVisibility, bRenderScrollbars, pbHScrolledToEnd, pbVScrolledToEnd) {
		var oHScrollbar = oCrosstab.getHScrollbar();
		if (oHScrollbar) {
			// scrollstep can be greater than actual scrollbar steps, e. g. if a hierarchy node was collapsed
			if (pbHScrolledToEnd !== undefined) {
				bHScrolledToEnd = pbHScrolledToEnd;
			} else {
				bHScrolledToEnd = (oHScrollbar.getSteps() <= iCurrentHScrollStep)
						&& (oColHeaderArea.getRenderStartCol() + oColHeaderArea.getRenderColCnt() >= oColHeaderArea
								.getColCnt());
			}
			if (bHScrolledToEnd) {
				moveHScrollDiv(true);
				moveHScrollbar(0, true);
			} else {
				moveHScrollbar(iCurrentHScrollStep, false);
			}
		}
		var oVScrollbar = oCrosstab.getVScrollbar();
		if (oVScrollbar) {
			if (pbVScrolledToEnd !== undefined) {
				bVScrolledToEnd = pbVScrolledToEnd;
			} else {
				// scrollstep can be greater than actual scrollbar steps, e. g. if a hierarchy node was collapsed
				bVScrolledToEnd = (oVScrollbar.getSteps() <= iCurrentVScrollStep)
						&& (oRowHeaderArea.getRenderStartRow() + oRowHeaderArea.getRenderRowCnt() >= oRowHeaderArea
								.getRowCnt());
			}
			if (bVScrolledToEnd) {
				moveVScrollbar(0, true);
				moveVScrollDiv(true);
			} else {
				moveVScrollbar(iCurrentVScrollStep, false);
			}
		}
	};

	this.commandHScrolledToEnd = function () {
		bHScrolledToEnd = true;
	};

	this.commandVScrolledToEnd = function () {
		bVScrolledToEnd = true;
	};

	this.isVScrolledToEnd = function () {
		return bVScrolledToEnd;
	};

	this.isHScrolledToEnd = function () {
		return bHScrolledToEnd;
	};
	
	this.setVScrolledToEnd = function(pbVScrolledToEnd) {
		bVScrolledToEnd = pbVScrolledToEnd;
	};
	
	this.setHScrolledToEnd = function(pbHScrolledToEnd) {
		bHScrolledToEnd = pbHScrolledToEnd;
	};
};
