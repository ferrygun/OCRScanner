jQuery.sap.declare("sap.zen.crosstab.rendering.CrossRequestManager");
jQuery.sap.require("sap.zen.crosstab.rendering.ScrollManager");
jQuery.sap.require("sap.zen.crosstab.rendering.PixelScrollManager");
jQuery.sap.require("sap.zen.crosstab.rendering.HeaderScrollManager");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

sap.zen.crosstab.rendering.CrossRequestManager = function (oCrosstab, oRenderEngine) {
	"use strict";

	var oScrollManager = null;
	var oHeaderScrollManager = null;
	var iHScrollPos = 0;
	var sHScrollAction = "";
	var iVScrollPos = 0;
	var sVScrollAction = "";
	var bHasSavedInfo = false;
	var aColHeaderSavedColWidths = null;
	var aDimHeaderSavedColWidths = null;
	var aDataAreaSavedColWidths = null;
	var aRowHeaderSavedColWidths = null;
	var bRequestIsHierarchyDirectionDown = false;
	var sRequestRootCause = "";
	var sRequestHierarchyAction = "";
	var iTotalRowCnt = 0;
	var iTotalColCnt = 0;
	var iDataAreaHeight = 0;
	var iDataWidth = 0;
	var bAdjustHPixelPos = false;
	var bAdjustVPixelPos = false;
	var bRootCauseHandled = false;
	var bHScrolledToEnd = undefined;
	var bVScrolledToEnd = undefined;
	var oHeaderScrollData = null;
	var oDataArea = oCrosstab.getDataArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oDimHeaderArea = oCrosstab.getDimensionHeaderArea();
	var bHasSavedHScrollInfo = false;
	var bHasSavedVScrollInfo = false;

	this.reset = function () {
		if (oScrollManager) {
			oScrollManager.destroy();
		}
		oScrollManager = null;
		if (oHeaderScrollManager) {
			oHeaderScrollManager.destroy();
		}
		oHeaderScrollManager = null;
	};
	
	this.clearSavedColWidths = function() {
		aColHeaderSavedColWidths = null;
		aDimHeaderSavedColWidths = null;
		aDataAreaSavedColWidths = null;
		aRowHeaderSavedColWidths = null;
	};

	this.clearSavedData = function () {
		oScrollManager = null;
		oHeaderScrollManager = null;
		iHScrollPos = 0;
		sHScrollAction = "";
		iVScrollPos = 0;
		sVScrollAction = "";
		bHasSavedInfo = false;
		this.clearSavedColWidths();
		bRequestIsHierarchyDirectionDown = false;
		sRequestRootCause = "";
		sRequestHierarchyAction = "";
		iTotalRowCnt = 0;
		iTotalColCnt = 0;
		oHeaderScrollData = null;
		bHasSavedHScrollInfo = false;
		bHasSavedVScrollInfo = false;
	};

	this.saveTableDimensions = function () {
		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			var oDomDataArea = $(document.getElementById(oCrosstab.getId() + "_dataArea"));
			iDataAreaHeight = oDomDataArea.outerHeight();
			iDataWidth = oDomDataArea.outerWidth();
		}
		iTotalRowCnt = oCrosstab.getTotalRows();
		iTotalColCnt = oCrosstab.getTotalCols();
	};

	function checkHierarchyAction (iDeltaBeforeMinusAfter) {
		if (sRequestHierarchyAction === "expanded") {
			return (iDeltaBeforeMinusAfter < 0);
		} else if (sRequestHierarchyAction === "collapsed") {
			return (iDeltaBeforeMinusAfter > 0);
		} else {
			return false;
		}
	}

	this.handleRootCause = function () {
		var iOldVScrollPos = iVScrollPos;
		var iOldHScrollPos = iHScrollPos;
		var bOldHScrolledToEnd = bHScrolledToEnd;
		var bOldVScrolledToEnd = bVScrolledToEnd;
		
		if (sRequestRootCause === "plan") {
			if (sHScrollAction !== "plan" && sVScrollAction !== "plan") {
				this.clearSavedData();
			}
		} else if (sRequestRootCause === "sorting") {
			if (sHScrollAction !== "sort") {
				this.clearSavedData();
			} else {
				iVScrollPos = 0;
				bVScrolledToEnd = false;
			}
		} else if (sRequestRootCause === "hierarchy") {
			if (sHScrollAction === "hier" && sVScrollAction === "hier") {
				var iRowDelta = iTotalRowCnt - oCrosstab.getTotalRows();
				var iColDelta = iTotalColCnt - oCrosstab.getTotalCols();
				if (iRowDelta !== 0) {
					if (checkHierarchyAction(iRowDelta)) {
						if (!bRequestIsHierarchyDirectionDown) {
							if (oCrosstab.getPropertyBag().isPixelScrolling()) {
								bAdjustVPixelPos = true;
							} else {
								iVScrollPos = Math.max(0, iVScrollPos - iRowDelta);
							}
						}
					} else {
						this.clearSavedData();
					}
				} else if (iColDelta !== 0) {
					if (checkHierarchyAction(iColDelta)) {
						if (!bRequestIsHierarchyDirectionDown) {
							if (oCrosstab.getPropertyBag().isPixelScrolling()) {
								bAdjustHPixelPos = true;
							} else {
								iHScrollPos = Math.max(0, iHScrollPos - iColDelta);
							}
						}
					} else {
						this.clearSavedData();
					}
				}

			} else {
				this.clearSavedData();
			}
		}
		// cleanup
		bRequestIsHierarchyDirectionDown = false;
		sRequestRootCause = "";
		sRequestHierarchyAction = "";
		iTotalRowCnt = 0;
		iTotalColCnt = 0;
		
		// This doesn't need to be done for header scrolling since the scrollpos based on a rootcause will never get changed
		if (iOldHScrollPos !== iHScrollPos || iOldVScrollPos !== iVScrollPos || bOldHScrolledToEnd !== bHScrolledToEnd || bOldVScrolledToEnd !== bVScrolledToEnd) {
			oCrosstab.getUtils().sendScrollPosUpdate(iHScrollPos, bHScrolledToEnd, iVScrollPos, bVScrolledToEnd);
		}
		
		bRootCauseHandled = true;
	};

	this.getHPixelScrollPosAfterRendering = function () {
		var iPos = -1;
		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			var oDomDataArea = $(document.getElementById(oCrosstab.getId() + "_dataArea"));
			if (bAdjustHPixelPos) {
				var iHDelta = oDomDataArea.outerWidth() - iDataWidth;
				iPos = iHScrollPos + iHDelta;
				bAdjustHPixelPos = false;
			}
		}
		return iPos;
	};

	this.getVPixelScrollPosAfterRendering = function () {
		var iPos = -1;
		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			var oDomDataArea = $(document.getElementById(oCrosstab.getId() + "_dataArea"));
			if (bAdjustVPixelPos) {
				var iVDelta = oDomDataArea.outerHeight() - iDataAreaHeight;
				iPos = iVScrollPos + iVDelta;
				bAdjustVPixelPos = false;
			}
		}
		return iPos;
	};

	this.setRootCause = function (sRootCause) {
		sRequestRootCause = sRootCause;
	};

	this.setHierarchyAction = function (sHierarchyAction) {
		sRequestHierarchyAction = sHierarchyAction;
	};

	this.setIsHierarchyDirectionDown = function (bIsHierarchyDirectionDown) {
		bRequestIsHierarchyDirectionDown = bIsHierarchyDirectionDown;
	};

	this.getScrollManager = function () {
		if (!oScrollManager) {
			if (oCrosstab.getPropertyBag().isPixelScrolling()) {
				oScrollManager = new sap.zen.crosstab.rendering.PixelScrollManager(oCrosstab, oRenderEngine);
			} else {
				oScrollManager = new sap.zen.crosstab.rendering.ScrollManager(oCrosstab, oRenderEngine);
			}
			if (bHasSavedInfo) {
				oScrollManager.setHScrollPos(iHScrollPos);
				oScrollManager.setVScrollPos(iVScrollPos);
			}
		}
		return oScrollManager;
	};
	
	this.getHeaderScrollManager = function() {
		if (!oHeaderScrollManager) {
			oHeaderScrollManager = new sap.zen.crosstab.rendering.HeaderScrollManager(oCrosstab, oRenderEngine);
			if (bHasSavedInfo) {
				oHeaderScrollManager.setHScrollData(oHeaderScrollData);
			}
		}
		return oHeaderScrollManager;
	};

	this.saveHScrollInfo = function (spAction, bResetVPosition) {
		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			var oScrollManager = oCrosstab.getRenderEngine().getScrollManager();
			iHScrollPos = 0;
			if (oScrollManager) {
				// we need the untranslated scroll pos otherwise there will be
				// problems in RTL case
				iHScrollPos = oScrollManager.getCurrentHScrollPos();
			}
		} else {
			iHScrollPos = oCrosstab.getColumnHeaderArea().getRenderStartCol();
			if (oScrollManager && oScrollManager.isHScrolledToEnd()) {
				iHScrollPos++;
				bHScrolledToEnd = true;
			}
		}
		if (bResetVPosition) {
			iVScrollPos = 0;
		}
		sHScrollAction = spAction;
		bHasSavedInfo = true;
		bHasSavedHScrollInfo = true;
	};
	
	this.saveVScrollInfo = function (spAction, bResetHPosition) {
		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			var oDomLowerRightScrollDiv = $(document.getElementById(oCrosstab.getId() + "_lowerRight_scrollDiv"));
			iVScrollPos = 0;
			if (oDomLowerRightScrollDiv && oDomLowerRightScrollDiv.length > 0) {
				iVScrollPos = oDomLowerRightScrollDiv.scrollTop();
			}
		} else {
			iVScrollPos = oCrosstab.getRowHeaderArea().getRenderStartRow();
			if (oScrollManager && oScrollManager.isVScrolledToEnd()) {
				iVScrollPos++;
				bVScrolledToEnd = true;
			}
		}
		if (bResetHPosition) {
			iHScrollPos = 0;
		}
		sVScrollAction = spAction;
		bHasSavedInfo = true;
		bHasSavedVScrollInfo = true;
	};

	this.savedInfoHandled = function () {
		if (bRootCauseHandled === true) {
			iHScrollPos = 0;
			sHScrollAction = "";
			iVScrollPos = 0;
			sVScrollAction = "";
			bHasSavedInfo = false;
			aColHeaderSavedColWidths = null;
			aDimHeaderSavedColWidths = null;
			aDataAreaSavedColWidths = null;
			aRowHeaderSavedColWidths = null;
			bRootCauseHandled = false;
			bHScrolledToEnd = undefined;
			bVScrolledToEnd = undefined;
			oHeaderScrollData = null;
			bHasSavedHScrollInfo = false;
			bHasSavedVScrollInfo = false;
		}
	};

	this.hasSavedInfo = function () {
		return bHasSavedInfo;
	};

	this.getSavedHScrollInfo = function () {
		var oHScrollInfo = {};
		oHScrollInfo.iPos = iHScrollPos;
		oHScrollInfo.sAction = sHScrollAction;
		oHScrollInfo.bScrolledToEnd = bHScrolledToEnd;
		return oHScrollInfo;
	};

	this.getSavedVScrollInfo = function () {
		var oVScrollInfo = {};
		oVScrollInfo.iPos = iVScrollPos;
		oVScrollInfo.sAction = sVScrollAction;
		oVScrollInfo.bScrolledToEnd = bVScrolledToEnd;
		return oVScrollInfo;
	};

	this.saveColWidths = function () {
		var oColHeaderArea = oCrosstab.getColumnHeaderArea();
		var oDimHeaderArea = oCrosstab.getDimensionHeaderArea();
		var oRowHeaderArea = oCrosstab.getRowHeaderArea();
		var oDataArea = oCrosstab.getDataArea();
		if (!oColHeaderArea.hasLoadingPages()) {
			aColHeaderSavedColWidths = oColHeaderArea.getColWidths();
			bHasSavedInfo = true;
		}
		if (!oDataArea.hasLoadingPages()) {
			aDataAreaSavedColWidths = oDataArea.getColWidths();
			bHasSavedInfo = true;
		}
		if (!oDimHeaderArea.hasLoadingPages()) {
			aDimHeaderSavedColWidths = oDimHeaderArea.getColWidths();
			bHasSavedInfo = true;
		}
		if (!oRowHeaderArea.hasLoadingPages()) {
			aRowHeaderSavedColWidths = oRowHeaderArea.getColWidths();
			bHasSavedInfo = true;
		}
	};

	this.restoreColWidths = function () {
		var oColHeaderArea = oCrosstab.getColumnHeaderArea();
		var oDimHeaderArea = oCrosstab.getDimensionHeaderArea();
		var oRowHeaderArea = oCrosstab.getRowHeaderArea();
		var oDataArea = oCrosstab.getDataArea();

		if (aColHeaderSavedColWidths) {
			oColHeaderArea.setColWidths(aColHeaderSavedColWidths);
			aColHeaderSavedColWidths = null;
		}
		if (aDataAreaSavedColWidths) {
			oDataArea.setColWidths(aDataAreaSavedColWidths);
			aDataAreaSavedColWidths = null;
		}
		if (aDimHeaderSavedColWidths) {
			oDimHeaderArea.setColWidths(aDimHeaderSavedColWidths);
			aDimHeaderSavedColWidths = null;
		}
		if (aRowHeaderSavedColWidths) {
			oRowHeaderArea.setColWidths(aRowHeaderSavedColWidths);
			aRowHeaderSavedColWidths = null;
		}
	};
	
	function determineCheckedScrollValues(piHScrollPos, pbHScrolledToEnd, piVScrollPos, pbVScrolledToEnd) {
		var oCheckedValues = {
				iHScrollPos : piHScrollPos,
				bHScrolledToEnd : pbHScrolledToEnd,
				iVScrollPos : piVScrollPos,
				bVScrolledToEnd : pbVScrolledToEnd
		};
			
		if (oCheckedValues.iHScrollPos < 0) {
			oCheckedValues.iHScrollPos = 0;
			oCheckedValues.bHScrolledToEnd = false;
		}
		
		if (oCheckedValues.iVScrollPos < 0) {
			oCheckedValues.iVScrollPos = 0;
			oCheckedValues.bVScrolledToEnd = false;
		}
		
		if (!oCrosstab.getPropertyBag().isPixelScrolling()) {
			var oArea = oDataArea ? oDataArea : oColHeaderArea;
			var iLastColPos = oArea.getColCnt() - 1;
			
			if (oCheckedValues.iHScrollPos > iLastColPos) {
				oCheckedValues.iHScrollPos = 0;
				oCheckedValues.bHScrolledToEnd = false;
			}
			
			oArea = oDataArea ? oDataArea : oRowHeaderArea;
			var iLastRowPos = oArea.getRowCnt() - 1;
			
			if (oCheckedValues.iVScrollPos > iLastRowPos) {
				oCheckedValues.iVScrollPos = 0;
				oCheckedValues.bVScrolledToEnd = false;
			}
		}
		
		if ((oCheckedValues.iHScrollPos !== piHScrollPos) || (oCheckedValues.iVScrollPos !== piVScrollPos)) {
			// reset scroll position on server
			oCrosstab.getUtils().sendScrollPosUpdate(0, false, 0, false);
		}
		return oCheckedValues;
	}
	
	this.setHScrollInfo = function(piHScrollPos, pbHScrolledToEnd) {
		iHScrollPos = piHScrollPos;
		bHScrolledToEnd = pbHScrolledToEnd;
		bHasSavedInfo = true;
		bHasSavedHScrollInfo = true;
	};
	
	this.setVScrollInfo = function(piVScrollPos, pbVScrolledToEnd) {
		iVScrollPos = piVScrollPos;
		bVScrolledToEnd = pbVScrolledToEnd;
		bHasSavedInfo = true;
		bHasSavedVScrollInfo = true;
	};	
	
	this.setScrollData = function(piHScrollPos, pbHScrolledToEnd, piVScrollPos, pbVScrolledToEnd) {
		var oCheckedValues = determineCheckedScrollValues(piHScrollPos, pbHScrolledToEnd, piVScrollPos, pbVScrolledToEnd);
		iHScrollPos = oCheckedValues.iHScrollPos;
		iVScrollPos = oCheckedValues.iVScrollPos;
		bHScrolledToEnd = oCheckedValues.bHScrolledToEnd;
		bVScrolledToEnd = oCheckedValues.bVScrolledToEnd;
		bHasSavedInfo = true;
		bHasSavedHScrollInfo = true;
		bHasSavedVScrollInfo = true;
	};
	
	function determineCheckedHeaderScrollValues(poHeaderScrollData) {
		var oCheckedData = poHeaderScrollData;
		if (oCheckedData.iHPos < 0) {
			oCheckedData.iHPos = 0;
		}
		
		// header scrolling uses pixel scrolling only. If the headers change due to e. g. a context menu action
		// so that the scrollpos is bigger than the div size, browsers should handle this gracefully, so currently
		// there is no need to adapt the pixel HPOS
		
		if (oCheckedData.iHPos !== poHeaderScrollData.iHPos) {
			oCrosstab.getUtils().sendScrollPosUpdate(oCheckedData.iHPos, undefined, undefined, undefined, true);
		}
		return oCheckedData;
	}
	
	this.setHeaderScrollData = function(poHeaderScrollData) {
		var oCheckedData = determineCheckedHeaderScrollValues(poHeaderScrollData);
		bHasSavedInfo = true;
		oHeaderScrollData = oCheckedData;
	};
	
	this.getHeaderScrollData = function() {
		return oHeaderScrollData;
	};
	
	this.hasSavedHScrollInfo = function() {
		return bHasSavedHScrollInfo;
	};
	
	this.hasSavedVScrollInfo = function() {
		return bHasSavedVScrollInfo;
	};
};