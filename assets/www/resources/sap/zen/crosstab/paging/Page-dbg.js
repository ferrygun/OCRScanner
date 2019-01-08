jQuery.sap.require("sap.zen.crosstab.paging.PagingConstants");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.declare("sap.zen.crosstab.paging.Page");

// This is the page that represents the runtime page.
// It is responsible for distributing data from one runtime page
// to all the areas of the crosstab
sap.zen.crosstab.paging.Page = function (oPagePos, sPageKey, oPageManager) {
	"use strict";

	var iStatus = sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN;
	var iPageDataRowCnt = 0;
	var iPageDataColCnt = 0;
	var iPageTileRowCnt = oPageManager.getTileRowCnt();
	var iPageTileColCnt = oPageManager.getTileColCnt();
	var oCellMerger = oPageManager.getCellMerger();
	var oDataHandler = oPageManager.getDataHandler();
	var oCrosstab = oPageManager.getCrosstab();
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oDataArea = oCrosstab.getDataArea();
	var oCrosstabAreasToBeFilled = {};
	var aAreaKeys = [];

	fillAreaKeys();

	function fillAreaKeys () {
		aAreaKeys.push(oDimensionHeaderArea.getAreaType());
		aAreaKeys.push(oColHeaderArea.getAreaType());
		aAreaKeys.push(oRowHeaderArea.getAreaType());
		aAreaKeys.push(oDataArea.getAreaType());
	}

	this.getPageKey = function () {
		return sPageKey;
	};

	this.getRow = function () {
		return oPageCoordinates.iRow;
	};

	this.getCol = function () {
		return oPageCoordinates.iCol;
	};

	this.getPosition = function () {
		return oPagePos;
	};

	this.getStatus = function () {
		return iStatus;
	};

	this.setStatus = function (iNewStatus) {
		iStatus = iNewStatus;
	};

	this.getPageDataRowCnt = function () {
		return iPageDataRowCnt;
	};

	this.getPageDataColCnt = function () {
		return iPageDataColCnt;
	};

	this.receiveData = function (oCrosstabData, bIsFirstPageData) {
		// what has actually been sent
		iPageDataRowCnt = oCrosstabData.sentdatarows;
		iPageDataColCnt = oCrosstabData.sentdatacols;
		// the maximum page size. These data correspond to DATA rows/cols (without headers)
		iPageTileRowCnt = oCrosstabData.tilerows;
		iPageTileColCnt = oCrosstabData.tilecols;

		oDataHandler.determineBasicAreaData(oCrosstabData, bIsFirstPageData);

		checkAreas();

		var oPageInfo = {};

		oPageInfo.iRowOffset = oPagePos.iRow * iPageTileRowCnt;
		oPageInfo.iColOffset = oPagePos.iCol * iPageTileColCnt;
		oPageInfo.bIsFirstPage = bIsFirstPageData;
		oPageInfo.oCrosstabAreasToBeFilled = oCrosstabAreasToBeFilled;
		oPageInfo.oCrosstabData = oCrosstabData;

		oDataHandler.jsonToDataModel(oPageInfo);
		setLoadedStatusAfterDataHandling();

		handleLoadedPage();
	};

	this.removeData = function () {
		iStatus = sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN;
		oCrosstabAreasToBeFilled = {};
		addArea(oDataArea);
		removePageFromHeaderTiles();
		clearDataSections();
	};

	function clearDataSections () {
		var i = 0;
		var oAreaInfo = null;
		for (i = 0; i < aAreaKeys.length; i++) {
			oAreaInfo = oCrosstabAreasToBeFilled[aAreaKeys[i]];
			if (oAreaInfo) {
				fillAreaRegionWithCells(oAreaInfo, false);
				oAreaInfo.oArea.decreaseLoadingPageCnt();
			}
		}
	}

	function checkHeaderAreaForRemoval (oArea, iTileIndex) {
		var oAreaTileInfo = decreaseTileRefCnt(oArea, iTileIndex);
		if (oAreaTileInfo.iRefCnt === 0) {
			oAreaTileInfo.iStatus = sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN;
			oPageManager.setHeaderTileInfo(oArea, iTileIndex, oAreaTileInfo);
			addArea(oArea);
		}
	}

	function removePageFromHeaderTiles () {
		checkHeaderAreaForRemoval(oDimensionHeaderArea, 0);
		checkHeaderAreaForRemoval(oRowHeaderArea, oPagePos.iRow);
		checkHeaderAreaForRemoval(oColHeaderArea, oPagePos.iCol);
	}

	function addPageToTileRefCnt () {
		increaseTileRefCnt(oDimensionHeaderArea, 0);
		increaseTileRefCnt(oRowHeaderArea, oPagePos.iRow);
		increaseTileRefCnt(oColHeaderArea, oPagePos.iCol);
	}

	function setHeaderTileStatus (oArea, iTileIndex, iStatus) {
		var oTileInfo = oPageManager.getHeaderTileInfo(oArea, iTileIndex);
		oTileInfo.iStatus = iStatus;
		oPageManager.setHeaderTileInfo(oArea, iTileIndex, oTileInfo);
	}

	function increaseTileRefCnt (oArea, iTileIndex) {
		var oTileInfo = oPageManager.getHeaderTileInfo(oArea, iTileIndex);
		oTileInfo.iRefCnt++;
		oPageManager.setHeaderTileInfo(oArea, iTileIndex, oTileInfo);
	}

	function decreaseTileRefCnt (oArea, iTileIndex) {
		var oTileInfo = oPageManager.getHeaderTileInfo(oArea, iTileIndex);
		oTileInfo.iRefCnt--;
		oPageManager.setHeaderTileInfo(oArea, iTileIndex, oTileInfo);
		return oTileInfo;
	}

	function checkAreas () {
		oCrosstabAreasToBeFilled = {};

		addArea(oDataArea, 0);

		if (oPageManager.getHeaderTileInfo(oRowHeaderArea, oPagePos.iRow).iStatus !== sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED) {
			addArea(oRowHeaderArea, oPagePos.iRow);
		}
		if (oPageManager.getHeaderTileInfo(oColHeaderArea, oPagePos.iCol).iStatus !== sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED) {
			addArea(oColHeaderArea, oPagePos.iCol);
		}
		if (oPageManager.getHeaderTileInfo(oDimensionHeaderArea, 0).iStatus !== sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED) {
			addArea(oDimensionHeaderArea, 0);
		}
	}

	function handleLoadedPage () {
		var i = 0;
		var oAreaInfo = null;
		for (i = 0; i < aAreaKeys.length; i++) {
			oAreaInfo = oCrosstabAreasToBeFilled[aAreaKeys[i]];
			if (oAreaInfo) {
				// Handle col/row measurements
				changeColWidthTemporaryFlag(oAreaInfo, false);
				changeRowHeightTemporaryFlag(oAreaInfo, false);
				oAreaInfo.oArea.decreaseLoadingPageCnt();
			}
		}
	}

	function addArea (oArea, iTileIndex) {
		var sKey = oArea.getAreaType();
		var oAreaInfo = {};
		oAreaInfo.oArea = oArea;
		oAreaInfo.oAreaRegion = getAreaCellRegionFromPagePos(oArea);
		oAreaInfo.iTileIndex = iTileIndex;
		oCrosstabAreasToBeFilled[sKey] = oAreaInfo;
	}

	this.provideLoadingCells = function (oArea) {
		iStatus = sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADING;
		determineAreasForLoadingCells(oArea);
		addPageToTileRefCnt();
		handleLoadingPage();
	};

	function setLoadedStatusAfterDataHandling () {
		iStatus = sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED;
		var oAreaInfo = null;

		oAreaInfo = oCrosstabAreasToBeFilled[oColHeaderArea.getAreaType()];
		if (oAreaInfo) {
			oCellMerger.mergeColHeaderCells(oPagePos.iCol);
			setHeaderTileStatus(oAreaInfo.oArea, oPagePos.iCol,
					sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED);
		}

		oAreaInfo = oCrosstabAreasToBeFilled[oRowHeaderArea.getAreaType()];
		if (oAreaInfo) {
			oCellMerger.mergeRowHeaderCells(oPagePos.iRow);
			setHeaderTileStatus(oAreaInfo.oArea, oPagePos.iRow,
					sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED);
		}

		oAreaInfo = oCrosstabAreasToBeFilled[oDimensionHeaderArea.getAreaType()];
		if (oAreaInfo) {
			setHeaderTileStatus(oAreaInfo.oArea, 0, sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED);
		}
	}

	function determineAreasForLoadingCells (oArea) {
		oCrosstabAreasToBeFilled = {};
		addArea(oDataArea, 0);

		if (oArea.isDataArea()) {
			if (oPageManager.getHeaderTileInfo(oRowHeaderArea, oPagePos.iRow).iStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN) {
				addArea(oRowHeaderArea, oPagePos.iRow);
				setHeaderTileStatus(oRowHeaderArea, oPagePos.iRow,
						sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADING);
			}
			if (oPageManager.getHeaderTileInfo(oColHeaderArea, oPagePos.iCol).iStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN) {
				addArea(oColHeaderArea, oPagePos.iCol);
				setHeaderTileStatus(oColHeaderArea, oPagePos.iCol,
						sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADING);
			}
			if (oPageManager.getHeaderTileInfo(oDimensionHeaderArea, 0).iStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_UNKNOWN) {
				addArea(oDimensionHeaderArea, 0);
				setHeaderTileStatus(oDimensionHeaderArea, 0,
						sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADING);
			}
		} else {
			if (oArea.isColHeaderArea()) {
				addArea(oArea, oPagePos.iCol);
				setHeaderTileStatus(oArea, oPagePos.iCol, sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADING);
			} else if (oArea.isRowHeaderArea()) {
				addArea(oArea, oPagePos.iRow);
				setHeaderTileStatus(oArea, oPagePos.iRow, sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADING);
			} else if (oArea.isDimensionHeaderArea()) {
				addArea(oArea, 0);
				setHeaderTileStatus(oArea, 0, sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADING);
			}
		}
	}

	function handleLoadingPage () {
		var i = 0;
		var oAreaInfo = null;

		for (i = 0; i < aAreaKeys.length; i++) {
			oAreaInfo = oCrosstabAreasToBeFilled[aAreaKeys[i]];
			if (oAreaInfo) {
				fillAreaRegionWithCells(oAreaInfo, true);
				changeColWidthTemporaryFlag(oAreaInfo, true);
				changeRowHeightTemporaryFlag(oAreaInfo, true);
				oAreaInfo.oArea.increaseLoadingPageCnt();
			}
		}
	}

	function fillAreaRegionWithCells (oAreaInfo, bIsLoading) {
		var iRow = 0;
		var iCol = 0;
		var oCell = null;
		var oAreaRegion = oAreaInfo.oAreaRegion;
		var oArea = oAreaInfo.oArea;

		for (iRow = oAreaRegion.iStartRow; iRow <= oAreaRegion.iEndRow; iRow++) {
			for (iCol = oAreaRegion.iStartCol; iCol <= oAreaRegion.iEndCol; iCol++) {
				if (bIsLoading) {
					oCell = createLoadingCell(oArea, iRow, iCol);
				}
				oArea.insertCell(oCell, iRow, iCol);
			}
		}
	}

	function changeColWidthTemporaryFlag (oAreaInfo, bIsTemporary) {
		var oAreaRegion = oAreaInfo.oAreaRegion;
		var oArea = oAreaInfo.oArea;
		var iCol = 0;

		for (iCol = oAreaRegion.iStartCol; iCol <= oAreaRegion.iEndCol; iCol++) {
			oArea.changeColWidthTemporaryFlag(iCol, sPageKey, bIsTemporary);
		}
	}

	function changeRowHeightTemporaryFlag (oAreaInfo, bIsTemporary) {
		var oAreaRegion = oAreaInfo.oAreaRegion;
		var oArea = oAreaInfo.oArea;
		var iRow = 0;

		for (iRow = oAreaRegion.iStartRow; iRow <= oAreaRegion.iEndRow; iRow++) {
			oArea.changeRowHeightTemporaryFlag(iRow, sPageKey, bIsTemporary);
		}
	}

	function getAreaCellRegionFromPagePos (oArea) {
		var oAreaRegion = {};

		if (oArea.isDimHeaderArea()) {
			// always full size for dimension header. Should not be necessary for paging though.
			oAreaRegion.iStartRow = 0;
			oAreaRegion.iEndRow = oArea.getRowCnt() - 1;
			oAreaRegion.iStartCol = 0;
			oAreaRegion.iEndCol = oArea.getColCnt() - 1;
		} else if (oArea.isRowHeaderArea()) {
			oAreaRegion.iStartRow = oPagePos.iRow * iPageTileRowCnt;
			oAreaRegion.iEndRow = Math.min(oAreaRegion.iStartRow + iPageTileRowCnt - 1, oArea.getRowCnt() - 1);
			oAreaRegion.iStartCol = 0;
			oAreaRegion.iEndCol = oArea.getColCnt() - 1;
		} else if (oArea.isColHeaderArea()) {
			oAreaRegion.iStartRow = 0;
			oAreaRegion.iEndRow = oArea.getRowCnt() - 1;
			oAreaRegion.iStartCol = oPagePos.iCol * iPageTileColCnt;
			oAreaRegion.iEndCol = Math.min(oAreaRegion.iStartCol + iPageTileColCnt - 1, oArea.getColCnt() - 1);
		} else if (oArea.isDataArea()) {
			oAreaRegion.iStartRow = oPagePos.iRow * iPageTileRowCnt;
			oAreaRegion.iEndRow = Math.min(oAreaRegion.iStartRow + iPageTileRowCnt - 1, oArea.getRowCnt() - 1);
			oAreaRegion.iStartCol = oPagePos.iCol * iPageTileColCnt;
			oAreaRegion.iEndCol = Math.min(oAreaRegion.iStartCol + iPageTileColCnt - 1, oArea.getColCnt() - 1);
		}

		return oAreaRegion;
	}

	function createLoadingCell (oArea, iRow, iCol) {
		var oCell = null;
		if (oArea.isDataArea()) {
			oCell = new sap.zen.crosstab.DataCell();
			oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_DATA_CELL);
		} else {
			oCell = new sap.zen.crosstab.HeaderCell();
			oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_HEADER_CELL);
			oCell.setRowSpan(1);
			oCell.setColSpan(1);
		}
		oCell.setArea(oArea);
		oCell.setRow(iRow);
		oCell.setCol(iCol);
		// oCell.setText("Loading...");
		oCell.setLoading(true);
		oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_LOADING);
		return oCell;
	}
};
