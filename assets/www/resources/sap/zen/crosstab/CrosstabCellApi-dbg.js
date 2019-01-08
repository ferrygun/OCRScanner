jQuery.sap.declare("sap.zen.crosstab.CrosstabCellApi");

// for external API to the outside: iRow/iCol is zero-based in the grid
sap.zen.crosstab.CrosstabCellApi = function (oCrosstab, iFixedRowHeaders, iFixedColHeaders, iTotalDataColumns,
		iTotalDataRows) {
	"use strict";

	var oDataArea = oCrosstab.getDataArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	var iMaxDimHeaderRow = iFixedColHeaders - 1;
	var iMaxDimHeaderCol = iFixedRowHeaders - 1;

	this.getTableCell = function (iRow, iCol) {
		var oCell = null;
		if (iCol >= iFixedRowHeaders && iRow >= iFixedColHeaders) {
			// data cell
			oCell = oDataArea.getCell(iRow - iFixedColHeaders, iCol - iFixedRowHeaders);
		} else if (iCol < iFixedRowHeaders && iRow < iFixedColHeaders) {
			// dim header cell
			oCell = oDimensionHeaderArea.getCell(iRow, iCol);
		} else if (iCol >= iFixedRowHeaders && iRow < iFixedColHeaders) {
			// col header cell
			oCell = oColHeaderArea.getCell(iRow, iCol - iFixedRowHeaders);
		} else if (iCol < iFixedRowHeaders && iRow >= iFixedColHeaders) {
			// row header cell
			oCell = oRowHeaderArea.getCell(iRow - iFixedColHeaders, iCol);
		}
		return oCell;
	};
	
	this.getTableCellWithColSpan = function (iRow, iCol) {
		var oCell = null;
		if (iCol >= iFixedRowHeaders && iRow >= iFixedColHeaders) {
			// data cell
			oCell = oDataArea.getDataModel().getCellWithColSpan(iRow - iFixedColHeaders, iCol - iFixedRowHeaders, true);
		} else if (iCol < iFixedRowHeaders && iRow < iFixedColHeaders) {
			// dim header cell
			oCell = oDimensionHeaderArea.getDataModel().getCellWithColSpan(iRow, iCol, true);
		} else if (iCol >= iFixedRowHeaders && iRow < iFixedColHeaders) {
			// col header cell
			oCell = oColHeaderArea.getDataModel().getCellWithColSpan(iRow, iCol - iFixedRowHeaders, true);
		} else if (iCol < iFixedRowHeaders && iRow >= iFixedColHeaders) {
			// row header cell
			oCell = oRowHeaderArea.getDataModel().getCellWithColSpan(iRow - iFixedColHeaders, iCol, true);
		}
		return oCell;
	};
	
	this.getTableCellWithRowSpan = function (iRow, iCol) {
		var oCell = null;
		if (iCol >= iFixedRowHeaders && iRow >= iFixedColHeaders) {
			// data cell
			oCell = oDataArea.getDataModel().getCellWithRowSpan(iRow - iFixedColHeaders, iCol - iFixedRowHeaders, true);
		} else if (iCol < iFixedRowHeaders && iRow < iFixedColHeaders) {
			// dim header cell
			oCell = oDimensionHeaderArea.getDataModel().getCellWithRowSpan(iRow, iCol, true);
		} else if (iCol >= iFixedRowHeaders && iRow < iFixedColHeaders) {
			// col header cell
			oCell = oColHeaderArea.getDataModel().getCellWithRowSpan(iRow, iCol - iFixedRowHeaders, true);
		} else if (iCol < iFixedRowHeaders && iRow >= iFixedColHeaders) {
			// row header cell
			oCell = oRowHeaderArea.getDataModel().getCellWithRowSpan(iRow - iFixedColHeaders, iCol, true);
		}
		return oCell;
	};

	// gets a table cell when arbitrary row/col is given.
	// iRow/iCol may point to a NULL cell in case a cell
	// has row or col span > 1. In that case, return
	// the "actual" non-null cell that belongs to the coordinates
	this.getTableCellWithSpans = function (iRow, iCol) {
		var oCell = this.getTableCell(iRow, iCol);
		// search backward horizontally first
		// on each horizontal position, search for a vertical cell
		var iColIdx = iCol--;
		while (!oCell && iColIdx >= 0) {
			var iRowIdx = iRow;
			oCell = this.getTableCell(iRowIdx, iColIdx);
			if (oCell && oCell.isLoading()) {
				// stop processing when finding loading cell
				// caller must react and cancel all calculations
				return oCell;
			}
			if (!oCell) {
				iRowIdx--;
				while (!oCell && iRowIdx >= 0) {
					oCell = this.getTableCell(iRowIdx, iColIdx);
					iRowIdx--;
				}
				if (oCell) {
					if (oCell.isLoading()) {
						return oCell;
					}
					var iLastRow = oCell.getTableRow() + oCell.getRowSpan() - 1;
					if (iLastRow < iRow) {
						// plausibility check: the found cell must have the
						// initial row in its rowspan, otherwise it is
						// a different cell already which we don't want
						oCell = null;
					}
				}
			}
			iColIdx--;
		}
		return oCell;
	};

	this.getTableRowCnt = function () {
		return iTotalDataRows + iFixedColHeaders;
	};

	this.getTableColCnt = function () {
		return iTotalDataColumns + iFixedRowHeaders;
	};

	this.getTableMaxScrollRowCnt = function () {
		return iTotalDataRows;
	};

	this.getTableMaxScrollColCnt = function () {
		return iTotalDataColumns;
	};

	this.getTableFixedRowHeaderColCnt = function () {
		return iFixedRowHeaders;
	};

	this.getTableFixedColHeaderRowCnt = function () {
		return iFixedColHeaders;
	};
	
	this.getTableMaxDimHeaderRow = function() {
		return iMaxDimHeaderRow;
	};
	
	this.getTableMaxDimHeaderCol = function() {
		return iMaxDimHeaderCol;
	};

};