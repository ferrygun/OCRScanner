jQuery.sap.declare("sap.zen.crosstab.paging.CellMerger");
jQuery.sap.require("sap.zen.crosstab.paging.PagingConstants");

sap.zen.crosstab.paging.CellMerger = function (oPageManager) {
	"use strict";

	var oRowHeaderArea = null;
	var oColHeaderArea = null;

	this.mergeRowHeaderCells = function (iPagePosRow) {
		oRowHeaderArea = oPageManager.getCrosstab().getRowHeaderArea();
		var iCol = 0;
		var oMergeCell = null;
		for (iCol = 0; iCol < oRowHeaderArea.getColCnt(); iCol++) {
			// the order is important: go from bottom to top, otherwise cell might be
			// deleted before it can be handled
			oMergeCell = getBottomCellWithMergeKey(iPagePosRow, iCol);
			if (oMergeCell) {
				mergeCellWithLowerPage(oMergeCell, iPagePosRow, iCol);
			}
			oMergeCell = getTopCellWithMergeKey(iPagePosRow, iCol);
			if (oMergeCell) {
				mergeCellWithUpperPages(oMergeCell, iPagePosRow, iCol);
			}
		}
	};

	function mergeCellWithUpperPages (oMergeCell, iPagePosRow, iCol) {
		var iCurrentPagePosRow = iPagePosRow - 1;
		var oCell = null;
		var oUpperMergeCell = null;
		var oRowIndices = null;
		var iRow = 0;
		var iRowSpan = oMergeCell.getRowSpan();

		var iStatus = oPageManager.getHeaderTileInfo(oRowHeaderArea, iCurrentPagePosRow).iStatus;
		while (iStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED && iCurrentPagePosRow >= 0 && !oUpperMergeCell) {
			oRowIndices = getRowIndices(iCurrentPagePosRow);
			for (iRow = oRowIndices.iMaxRowIndex; iRow >= oRowIndices.iMinRowIndex && !oUpperMergeCell; iRow--) {
				oCell = oRowHeaderArea.getCellDirect(iRow, iCol);
				if (oCell) {
					if (oCell.getMergeKey()) {					
						if (oMergeCell.getMergeKey() === oCell.getMergeKey()) {
							if (iRow === oRowIndices.iMaxRowIndex || oCell.getRowSpan() > 1) {
								oUpperMergeCell = oCell;
							} else {
								// we have a cell with same merge key, but it is not at the bottom of the tile of the upper page
								// or it does not have any rowspan. Hence, this cannot be a cell relevant
								// for rowspan merging and any further searching is not necessary (there cannot be any cell above the already found
								// cell that still rowspan-merges with the cell in the bottom page).
								return;
							}
						} else {
							// we have found the first cell with merge key while searching upward in the same column of an upper page, 
							// but it does not fit the requested key of the merge cell.
							// Hence, this merge key must be for something else. Don't use it for rowspan merging.
							// Any further searching upward is now pointless since if it isn't the first cell with merge key that is found, 
							// there cannot be any rowspan merging any more
							return;
						}
					}
				}
			}

			iCurrentPagePosRow--;
			iStatus = oPageManager.getHeaderTileInfo(oRowHeaderArea, iCurrentPagePosRow).iStatus;
		}

		if (oUpperMergeCell) {
			copyCellStyles(oMergeCell, oUpperMergeCell);
			oUpperMergeCell.setRowSpan(iRowSpan + oUpperMergeCell.getRowSpan());
			oRowHeaderArea.insertCell(null, oMergeCell.getRow(), oMergeCell.getCol());
		}
	}

	function getRowIndices (iPagePosRow) {
		var oRowIndices = {};
		oRowIndices.iMinRowIndex = iPagePosRow * oPageManager.getTileRowCnt();
		oRowIndices.iMaxRowIndex = (iPagePosRow + 1) * oPageManager.getTileRowCnt() - 1;
		oRowIndices.iMaxRowIndex = Math.min(oRowIndices.iMaxRowIndex, oRowHeaderArea.getRowCnt() - 1);
		return oRowIndices;
	}

	function getTopCellWithMergeKey (iPagePosRow, iCol) {
		var oTopMergeCell = null;
		var oIndices = getRowIndices(iPagePosRow);
		var iRow = 0;
		var oCell = null;
		var sMergeKey = "";

		for (iRow = oIndices.iMinRowIndex; iRow <= oIndices.iMaxRowIndex && !oTopMergeCell; iRow++) {
			oCell = oRowHeaderArea.getCellDirect(iRow, iCol);
			if (oCell) {
				sMergeKey = oCell.getMergeKey();
				if (sMergeKey) {
					oTopMergeCell = oCell;
				}
			}
		}

		return oTopMergeCell;
	}

	function mergeCellWithLowerPage (oMergeCell, iPagePosRow, iCol) {
		var oCell = null;
		var iFoundRowSpan = 0;
		var sMergeKey = "";
		var oIndices = null;

		var iStatus = oPageManager.getHeaderTileInfo(oRowHeaderArea, iPagePosRow + 1).iStatus;
		if (iStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED) {
			oIndices = getRowIndices(iPagePosRow + 1);
			oCell = oRowHeaderArea.getCellDirect(oIndices.iMinRowIndex, iCol);
			if (oCell) {
				sMergeKey = oCell.getMergeKey();
				if (sMergeKey && sMergeKey === oMergeCell.getMergeKey()) {
					iFoundRowSpan = oCell.getRowSpan();
					oRowHeaderArea.insertCell(null, oIndices.iMinRowIndex, iCol);
					copyCellStyles(oCell, oMergeCell);
				}
			}
		}

		if (iFoundRowSpan) {
			oMergeCell.setRowSpan(oMergeCell.getRowSpan() + iFoundRowSpan);
		}
	}

	function getBottomCellWithMergeKey (iPagePosRow, iCol) {
		var oBottomMergeCell = null;
		var oIndices = getRowIndices(iPagePosRow);
		var iRow = 0;
		var sMergeKey = "";
		var oCell = null;

		for (iRow = oIndices.iMaxRowIndex; iRow >= oIndices.iMinRowIndex && !oBottomMergeCell; iRow--) {
			oCell = oRowHeaderArea.getCellDirect(iRow, iCol);
			if (oCell) {
				sMergeKey = oCell.getMergeKey();
				if (sMergeKey) {
					oBottomMergeCell = oCell;
				}
			}
		}

		return oBottomMergeCell;
	}

	// Col Header merging ///////////////////////////////////////////////////////////////////////////
	this.mergeColHeaderCells = function (iPagePosCol) {
		oColHeaderArea = oPageManager.getCrosstab().getColumnHeaderArea();
		var iRow = 0;
		var oMergeCell = null;
		for (iRow = 0; iRow < oColHeaderArea.getRowCnt(); iRow++) {
			// the order is important: go from right to left, otherwise cell might be
			// deleted before it can be handled
			oMergeCell = getRightCellWithMergeKey(iPagePosCol, iRow);
			if (oMergeCell) {
				mergeCellWithRightPage(oMergeCell, iPagePosCol, iRow);
			}
			oMergeCell = getLeftCellWithMergeKey(iPagePosCol, iRow);
			if (oMergeCell) {
				mergeCellWithLeftPages(oMergeCell, iPagePosCol, iRow);
			}
		}
	};

	function getColIndices (iPagePosCol) {
		var oColIndices = {};
		oColIndices.iMinColIndex = iPagePosCol * oPageManager.getTileColCnt();
		oColIndices.iMaxColIndex = (iPagePosCol + 1) * oPageManager.getTileColCnt() - 1;
		oColIndices.iMaxColIndex = Math.min(oColIndices.iMaxColIndex, oColHeaderArea.getColCnt() - 1);
		return oColIndices;
	}

	function mergeCellWithRightPage (oMergeCell, iPagePosCol, iRow) {
		var oCell = null;
		var iFoundColSpan = 0;
		var sMergeKey = "";
		var oIndices = null;

		var iStatus = oPageManager.getHeaderTileInfo(oColHeaderArea, iPagePosCol + 1).iStatus;
		if (iStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED) {
			oIndices = getColIndices(iPagePosCol + 1);
			oCell = oColHeaderArea.getCellDirect(iRow, oIndices.iMinColIndex);
			if (oCell) {
				sMergeKey = oCell.getMergeKey();
				if (sMergeKey && sMergeKey === oMergeCell.getMergeKey()) {
					iFoundColSpan = oCell.getColSpan();
					oColHeaderArea.insertCell(null, iRow, oIndices.iMinColIndex);
					copyCellStyles(oCell, oMergeCell);
				}
			}
		}

		if (iFoundColSpan) {
			oMergeCell.setColSpan(oMergeCell.getColSpan() + iFoundColSpan);
		}
	}

	function getRightCellWithMergeKey (iPagePosCol, iRow) {
		var oRightMergeCell = null;
		var oIndices = getColIndices(iPagePosCol);
		var iCol = 0;
		var sMergeKey = "";
		var oCell = null;

		for (iCol = oIndices.iMaxColIndex; iCol >= oIndices.iMinColIndex && !oRightMergeCell; iCol--) {
			oCell = oColHeaderArea.getCellDirect(iRow, iCol);
			if (oCell) {
				sMergeKey = oCell.getMergeKey();
				if (sMergeKey) {
					oRightMergeCell = oCell;
				}
			}
		}

		return oRightMergeCell;
	}

	function getLeftCellWithMergeKey (iPagePosCol, iRow) {
		var oLeftMergeCell = null;
		var oIndices = getColIndices(iPagePosCol);
		var iCol = 0;
		var oCell = null;
		var sMergeKey = "";

		for (iCol = oIndices.iMinColIndex; iCol <= oIndices.iMaxColIndex && !oLeftMergeCell; iCol++) {
			oCell = oColHeaderArea.getCellDirect(iRow, iCol);
			if (oCell) {
				sMergeKey = oCell.getMergeKey();
				if (sMergeKey) {
					oLeftMergeCell = oCell;
				}
			}
		}

		return oLeftMergeCell;
	}

	function mergeCellWithLeftPages (oMergeCell, iPagePosCol, iRow) {
		var iCurrentPagePosCol = iPagePosCol - 1;
		var oCell = null;
		var oLeftMergeCell = null;
		var oColIndices = null;
		var iCol = 0;
		var iColSpan = oMergeCell.getColSpan();

		var iStatus = oPageManager.getHeaderTileInfo(oColHeaderArea, iCurrentPagePosCol).iStatus;
		while (iStatus === sap.zen.crosstab.paging.PagingConstants.PAGE_STATUS_LOADED && iCurrentPagePosCol >= 0 && !oLeftMergeCell) {
			oColIndices = getColIndices(iCurrentPagePosCol);
			for (iCol = oColIndices.iMaxColIndex; iCol >= oColIndices.iMinColIndex && !oLeftMergeCell; iCol--) {
				oCell = oColHeaderArea.getCellDirect(iRow, iCol);
				if (oCell) {
					if (oCell.getMergeKey()) {
						if (oMergeCell.getMergeKey() === oCell.getMergeKey()) {
							if (iCol === oColIndices.iMaxColIndex || oCell.getColSpan() > 1) {
								oLeftMergeCell = oCell;
							} else {
								return;
							}
						} else {
							return;
						}
					}
				}
			}

			iCurrentPagePosCol--;
			iStatus = oPageManager.getHeaderTileInfo(oColHeaderArea, iCurrentPagePosCol).iStatus;
		}

		if (oLeftMergeCell) {
			copyCellStyles(oMergeCell, oLeftMergeCell);
			oLeftMergeCell.setColSpan(iColSpan + oLeftMergeCell.getColSpan());
			oColHeaderArea.insertCell(null, oMergeCell.getRow(), oMergeCell.getCol());
		}
	}

	function copyCellStyles (oSourceCell, oTargetCell) {
		var aStyleIdList = oSourceCell.getStyleIdList();
		oTargetCell.setStyleIdList(aStyleIdList);
	}
};