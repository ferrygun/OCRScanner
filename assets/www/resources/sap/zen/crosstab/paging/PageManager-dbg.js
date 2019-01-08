jQuery.sap.declare("sap.zen.crosstab.paging.PageManager");
jQuery.sap.require("sap.zen.crosstab.paging.Page");
jQuery.sap.require("sap.zen.crosstab.paging.PagingConstants");
jQuery.sap.require("sap.zen.crosstab.paging.RequestHandler");
jQuery.sap.require("sap.zen.crosstab.paging.CellMerger");
jQuery.sap.require("sap.zen.crosstab.datahandler.JsonDataHandler");

sap.zen.crosstab.paging.PageManager = function (oCrosstab) {
	"use strict";

	var oJsonDataHandler = new sap.zen.crosstab.datahandler.JsonDataHandler(oCrosstab);
	var oCellMerger = new sap.zen.crosstab.paging.CellMerger(this);
	var oRequestHandler = null;

	var oPages = {};
	var oHeaderTileStatus = {};

	var iPageTileRowCnt = 0;
	var iPageTileColCnt = 0;
	var sRequestCommandTemplate = "";
	var iPageRowPos = 0;
	var iPageColPos = 0;
	var bHasPages = false;
	var aRemovedPages = [];

	var bResizeEventReceived = false;
	var bNewDataModel = true;

	var oReceivedData = {};
	var oAlreadyLoadedCells = {};
	var oAvailableRowHeaderCellsByRow = {};
	var oAvailableRowHeaderCellsByCol = {};
	var oAvailableColHeaderCellsByRow = {};
	var oAvailableColHeaderCellsByCol = {};
	var oAvailableDataAreaCellsByRow = {};
	var oAvailableDataAreaCellsByCol = {};

	function afterRenderingActions () {
		cleanupRemovedPages();
		if (bResizeEventReceived || bNewDataModel) {
			bResizeEventReceived = false;
			bNewDataModel = false;
			adjustRequestStackSize();
		}
	}

	function adjustRequestStackSize () {
		var oDataArea = oCrosstab.getDataArea();
		var iRenderedRowCnt = oDataArea.getRenderRowCnt();
		var iRenderedColCnt = oDataArea.getRenderColCnt();

		var iHPageCnt = Math.round(iRenderedColCnt / iPageTileColCnt) + 1;
		var iVPageCnt = Math.round(iRenderedRowCnt / iPageTileRowCnt) + 1;

		// heuristics
		var iMaxRequestCnt = Math.max(1, iHPageCnt * iVPageCnt * 2);

		if (oRequestHandler) {
			oRequestHandler.setMaxQueueRequests(iMaxRequestCnt);
		}
	}
	
	this.enableTimeout = function(bEnableTimeout) {
		if (oRequestHandler) {
			oRequestHandler.enableTimeout(bEnableTimeout);
		}
	};

	this.getRequestStackSize = function () {
		var iRequestStackSize = -1;
		if (oRequestHandler) {
			iRequestStackSize = oRequestHandler.getMaxQueueRequests();
		}
		return iRequestStackSize;
	};

	this.resizeEvent = function () {
		bResizeEventReceived = true;
		if (oRequestHandler) {
			oRequestHandler.unlimitStack();
		}
	};

	this.checkResponseConsistency = function (oCrosstabData) {
		if (oCrosstabData.pvcheck || oCrosstabData.removeselection) {
			return true;
		}
		if (iPageTileRowCnt > 0 && iPageTileColCnt > 0) {
			return (oCrosstabData.tilerows === iPageTileRowCnt && oCrosstabData.tilecols === iPageTileColCnt);
		}
		return true;
	};

	this.receiveData = function (oCrosstabData) {
		var bIsConsistent = this.checkResponseConsistency(oCrosstabData);
		if (bIsConsistent) {
			parsePagingData(oCrosstabData);

			var oPagePos = {};
			oPagePos.iRow = iPageRowPos;
			oPagePos.iCol = iPageColPos;

			var oPage = null;
			var bIsFirstPage = isFirstPageData();
			if (bIsFirstPage) {
				oPage = this.createPage(oPagePos);
				bHasPages = true;
			} else {
				oPage = this.getPage(oPagePos);
			}
			if (oPage) {
				oPage.receiveData(oCrosstabData, bIsFirstPage);
			}

			if (oCrosstab.getPropertyBag().isDebugMode()) {
				var oPageCoordinates = oPage.getPosition();
				var sKey = oPageCoordinates.iRow + "_" + oPageCoordinates.iCol;
				oReceivedData[sKey] = {};
				oReceivedData[sKey].component = oCrosstabData;
			}
		}
	};

	function cleanupRemovedPages () {
		var i = 0;
		var oPage = null;
		var sPageKey = "";
		for (i = 0; i < aRemovedPages.length; i++) {
			oPage = aRemovedPages[i];
			if (oPage) {
				oPage.removeData();
				sPageKey = oPage.getPageKey();
				delete oPages[sPageKey];
			}
		}
		aRemovedPages = [];
	}

	oCrosstab.getRenderEngine().addAfterFinishRenderingHandler(afterRenderingActions);

	this.removeRequest = function (oPage) {
		aRemovedPages.push(oPage);
	};

	this.getRequestCommandTemplate = function () {
		return sRequestCommandTemplate;
	};

	this.removeHeaderTileRequest = function (oArea, iTileIndex, sPageKey) {
		var oTiles = oHeaderTileStatus[oArea.getAreaType()];
		if (oTiles) {
			var oTileInfo = oTiles[iTileIndex];
			if (oTileInfo) {
				var iRequestIndex = $.inArray(sPageKey, oTileInfo.aRequestingPages);
				if (iRequestIndex !== -1) {
					oTileInfo.aRequestingPages.splice(iRequestIndex, 1);
					if (oTileInfo.aRequestingPages.length === 0) {
						oTileInfo.iStatus = sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN;
					}
				}
			}
		}
	};

	this.getHeaderTileInfo = function (oArea, iTileIndex) {
		return getHeaderTileInfo(oArea, iTileIndex);
	};

	this.setHeaderTileInfo = function (oArea, iTileIndex, oTileInfo) {
		var oTiles = getHeaderTiles(oArea);
		oTiles[iTileIndex] = oTileInfo;
	};

	function getHeaderTiles (oArea) {
		var oTiles = oHeaderTileStatus[oArea.getAreaType()];
		if (!oTiles) {
			oTiles = {};
			oHeaderTileStatus[oArea.getAreaType()] = oTiles;
		}
		return oTiles;
	}

	function getHeaderTileInfo (oArea, iTileIndex) {
		var oTiles = getHeaderTiles(oArea);
		var oTileInfo = oTiles[iTileIndex];
		if (!oTileInfo) {
			oTileInfo = {};
			oTileInfo.iStatus = sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN;
			oTileInfo.iRefCnt = 0;
			oTiles[iTileIndex] = oTileInfo;
		}
		return oTileInfo;
	}

	this.ensureCellAvailable = function (oArea, iRow, iCol) {
		var oPage = null;
		var iTileStatus = sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN;
		var bIsHeaderCell = false;
		var bRequest = false;
		var sCellKey = oArea.getAreaType() + "/" + iRow + "/" + iCol;

		// if a cell is already available (page requested and received, cell is really there) this check isn't necessary
		// anymore
		if (!oAlreadyLoadedCells[sCellKey]) {
			var oPagePos = getPagePosFromAreaCellPos(iRow, iCol, oArea);
			if (oPagePos) {
				if (oArea.isRowHeaderArea()) {
					iTileStatus = this.getHeaderTileInfo(oArea, oPagePos.iRow).iStatus;
					bIsHeaderCell = true;
				} else if (oArea.isColHeaderArea()) {
					iTileStatus = this.getHeaderTileInfo(oArea, oPagePos.iCol).iStatus;
					bIsHeaderCell = true;
				}
				oPage = this.getPage(oPagePos);
				if (bIsHeaderCell) {
					if (iTileStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN) {
						bRequest = true;
					}
				} else {
					bRequest = !oPage;
				}
				if (bRequest) {
					oPage = this.createPage(oPagePos);
					oPage.provideLoadingCells(oArea);
					if (!oRequestHandler) {
						oRequestHandler = new sap.zen.crosstab.paging.RequestHandler(this);
					}
					oRequestHandler.sendPageRequest(oPage);
				} else {
					if ((oPage && oPage.getStatus() === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED)
							|| iTileStatus
							&& iTileStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED) {
						oAlreadyLoadedCells[sCellKey] = true;
						fillLookupTables(oArea, iRow, iCol);
					}
				}
			}
		}
	};
	
	this.reset = function () {
		oPages = {};
		oHeaderTileStatus = {};
		bHasPages = false;
		if (oRequestHandler) {
			oRequestHandler.reset();
		}
		bNewDataModel = true;
		oReceivedData = {};
		oAlreadyLoadedCells = {};
		oAvailableRowHeaderCellsByRow = {};
		oAvailableRowHeaderCellsByCol = {};
		oAvailableColHeaderCellsByRow = {};
		oAvailableColHeaderCellsByCol = {};
		oAvailableDataAreaCellsByRow = {};
		oAvailableDataAreaCellsByCol = {};
		iPageTileRowCnt = 0;
		iPageTileColCnt = 0;
	};

	this.getDataHandler = function () {
		return oJsonDataHandler;
	};

	this.getTileRowCnt = function () {
		return iPageTileRowCnt;
	};

	this.getTileColCnt = function () {
		return iPageTileColCnt;
	};

	this.getPageKeyFromPos = function (oPagePos) {
		return this.getPageKeyFromRowCol(oPagePos.iRow, oPagePos.iCol);
	};

	this.getPageKeyFromRowCol = function (iRow, iCol) {
		return iRow + "/" + iCol;
	};

	this.getPagePosFromKey = function (sKey) {
		var oPagePos = {};
		var aRowCol = sKey.split("/");
		oPagePos.iRow = parseInt(aRowCol[0], 10);
		oPagePos.iCol = parseInt(aRowCol[1], 10);
		return oPagePos;
	};

	this.getCrosstab = function () {
		return oCrosstab;
	};

	this.createPage = function (oPagePos) {
		var oPage = null;
		var sPageKey = this.getPageKeyFromPos(oPagePos);
		if (sPageKey) {
			oPage = new sap.zen.crosstab.paging.Page(oPagePos, sPageKey, this);
			oPages[sPageKey] = oPage;
		}
		return oPage;
	};

	this.getPage = function (oPagePos) {
		return this.getPageFromRowCol(oPagePos.iRow, oPagePos.iCol);
	};

	this.getPageFromRowCol = function (iRow, iCol) {
		var oPage = null;
		var sPageKey = this.getPageKeyFromRowCol(iRow, iCol);
		if (sPageKey) {
			oPage = oPages[sPageKey];
		}
		return oPage;
	};

	this.getCellMerger = function () {
		return oCellMerger;
	};

	function isFirstPageData () {
		return (iPageRowPos === 0 && iPageColPos === 0) || !bHasPages;
	}

	function parsePagingData (oJsonTableControl) {
		// max Page (Tile) size
		iPageTileRowCnt = oJsonTableControl.tilerows;
		iPageTileColCnt = oJsonTableControl.tilecols;

		sRequestCommandTemplate = oJsonTableControl.scrollaction;

		// coordinate of the page itself
		iPageRowPos = oJsonTableControl.v_pos;
		if (iPageRowPos) {
			iPageRowPos = Math.floor(iPageRowPos / iPageTileRowCnt);
		} else {
			iPageRowPos = 0;
		}
		iPageColPos = oJsonTableControl.h_pos;
		if (iPageColPos) {
			iPageColPos = Math.floor(iPageColPos / iPageTileColCnt);
		} else {
			iPageColPos = 0;
		}
	}

	function getPagePosFromAreaCellPos (iCellRow, iCellCol, oArea) {
		// Contract with runtime:
		// Dimension header, row header columns and column header rows
		// can never span across multiple pages
		var oPagePos = {
			iRow: 0,
			iCol: 0
		};
		// For requesting RowHeaderArea and ColHeaderArea tiles:
		// Make sure that a page gets requested that can actually be used, i. e. that
		// is based on the renderStartRow for ColHeaderArea and on renderStartCol for RowHeaderArea.
		// This way, we can save quite some requests which not only cost performance but might lead to
		// crucial requests being removed from the request queue.
		if (oArea.isRowHeaderArea()) {
			oPagePos.iRow = Math.floor(iCellRow / iPageTileRowCnt);
			oPagePos.iCol = Math.floor(oCrosstab.getColumnHeaderArea().getRenderStartCol() / iPageTileColCnt);
		} else if (oArea.isColHeaderArea()) {
			oPagePos.iRow = Math.floor(oCrosstab.getRowHeaderArea().getRenderStartRow() / iPageTileRowCnt);
			oPagePos.iCol = Math.floor(iCellCol / iPageTileColCnt);
		} else if (oArea.isDataArea()) {
			oPagePos.iRow = Math.floor(iCellRow / iPageTileRowCnt);
			oPagePos.iCol = Math.floor(iCellCol / iPageTileColCnt);
		}
		return oPagePos;
	}

	this.getReceivedPages = function () {
		return JSON.stringify(oReceivedData);
	};
	
	function fillLookupTables(oArea, iRow, iCol) {
		if (oArea.isRowHeaderArea()) {
			addToLookup(oAvailableRowHeaderCellsByRow, iRow, iCol);
			addToLookup(oAvailableRowHeaderCellsByCol, iCol, iRow);
		} else if (oArea.isColHeaderArea()) {
			addToLookup(oAvailableColHeaderCellsByRow, iRow, iCol);
			addToLookup(oAvailableColHeaderCellsByCol, iCol, iRow);							
		} else if (oArea.isDataArea()) {
			addToLookup(oAvailableDataAreaCellsByRow, iRow, iCol);
			addToLookup(oAvailableDataAreaCellsByCol, iCol, iRow);
		}
	}
	
	function addToLookup(oLookup, iKey, iValue) {
		if (!oLookup[iKey]) {
			oLookup[iKey] = [];
		}
		oLookup[iKey].push(iValue);
	}
	
	function getLookup(oArea, bIsRowLookup) {
		var oLookup = null;
		if (oArea.isDataArea()) {
			oLookup = bIsRowLookup ? oAvailableDataAreaCellsByRow : oAvailableDataAreaCellsByCol; 
		} else if (oArea.isRowHeaderArea()) {
			oLookup = bIsRowLookup ? oAvailableRowHeaderCellsByRow : oAvailableRowHeaderCellsByCol;
		} else if (oArea.isColHeaderArea()) {
			oLookup = bIsRowLookup ? oAvailableColHeaderCellsByRow : oAvailableColHeaderCellsByCol;
		}
		return oLookup;
	}
	
	this.getLoadedCellColumnsByRow = function(oArea, iRow) {
		var aCols = [];
		var oLookup = getLookup(oArea, true);
		if (oLookup) {
			aCols = oLookup[iRow];
		}
		return aCols;
	};
	
	this.getLoadedCellRowsByCol = function(oArea, iCol) {
		var aRows = [];
		var oLookup = getLookup(oArea, false);
		if (oLookup) {
			aRows = oLookup[iCol];
		}
		return aRows;
	};
	
	this.getPages = function() {
		return oPages;
	};
	
	this.isCellLoaded = function(oArea, iRow, iCol) {
		var sCellKey = oArea.getAreaType() + "/" + iRow + "/" + iCol;
		if (oAlreadyLoadedCells[sCellKey]) {
			return true;
		}
		return false;
	};
};