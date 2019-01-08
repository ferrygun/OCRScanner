jQuery.sap.declare("sap.zen.crosstab.rendering.DataModel");

sap.zen.crosstab.rendering.DataModel = function (oArea) {
	"use strict";
	var aModelRows = [];
	var iRowCnt = 0;
	var iColCnt = 0;
	var oPageManager = null;
	var that = this;

	this.insertCell = function (oCell, iRow, iCol) {
		if (iRow > iRowCnt - 1 || iCol > iColCnt - 1) {
			throw {
				name: "DataModelIndexOutOfBounds",
				message: "A cell cannot be inserted out of the bounds defined by iRowCnt and iColCnt"
			};
		}

		var aModelRow = getModelRow(iRow);
		aModelRow[iCol] = oCell;

		if (oCell) {
			var i = 0;
			var j = 0;
			for (i = 1; i < oCell.getColSpan(); i++) {
				aModelRow[iCol + i] = null;
			}
			for (i = 0; i < oCell.getColSpan(); i++) {
				for (j = 1; j < oCell.getRowSpan(); j++) {
					aModelRow = getModelRow(iRow + j);
					aModelRow[iCol + i] = null;
				}
			}
		}
	};

	this.getCellDirect = function (iRow, iCol) {
		var oCell = null;
		var aModelRow = aModelRows[iRow];
		if (aModelRow) {
			oCell = aModelRow[iCol];
		}
		if (oCell && oCell.setEffectiveRowSpan && oCell.setEffectiveColSpan) {
			oCell.setEffectiveRowSpan(oCell.getRowSpan());
			oCell.setEffectiveColSpan(oCell.getColSpan());
		}
		return oCell;
	};

	function getModelRow (iRow) {
		var aModelRow = aModelRows[iRow];
		if (!aModelRow) {
			aModelRow = [];
			aModelRows[iRow] = aModelRow;
		}
		return aModelRow;
	}

	this.getCell = function (iRow, iCol, bDoNotLoadPage) {
		var oCell = getCellInternal(iRow, iCol, bDoNotLoadPage);
		if (oCell && oCell.setEffectiveRowSpan && oCell.setEffectiveColSpan) {
			oCell.setEffectiveRowSpan(oCell.getRowSpan());
			oCell.setEffectiveColSpan(oCell.getColSpan());
		}
		return oCell;
	};

	function getCellInternal (iRow, iCol, bDoNotLoadPage) {
		if (!oPageManager && oArea) {
			oPageManager = oArea.getPageManager();
		}
		if (oPageManager && !bDoNotLoadPage) {
			oPageManager.ensureCellAvailable(oArea, iRow, iCol);
		}
		var oCell = null;
		var aModelRow = aModelRows[iRow];
		if (aModelRow) {
			oCell = aModelRow[iCol];
		}
		return oCell;
	}

	this.setRowCnt = function (iRowCount) {
		iRowCnt = iRowCount;
	};

	this.getRowCnt = function () {
		return iRowCnt;
	};

	this.setColCnt = function (iColCount) {
		iColCnt = iColCount;
	};

	this.getColCnt = function () {
		return iColCnt;
	};

	this.clear = function () {
		aModelRows = [];
		iRowCnt = 0;
		iColCnt = 0;
	};

	this.hasData = function () {
		return aModelRows.length > 0;
	};

	this.getCellWithSpan = function (iRow, iCol, bDoNotLoadPage) {
		var oCell = this.getCellWithColSpan(iRow, iCol, bDoNotLoadPage);
		if (!oCell) {
			oCell = this.getCellWithRowSpan(iRow, iCol, bDoNotLoadPage);
		}
		return oCell;
	};

	this.getCellWithRowSpan = function (iRow, iCol, bDoNotLoadPage) {
		var oCell = this.getCell(iRow, iCol, bDoNotLoadPage);
		if (!oCell) {
			var iRowSpanCounter = 1;
			while (!oCell && iRow > 0) {
				iRow--;
				iRowSpanCounter++;
				oCell = this.getCell(iRow, iCol, bDoNotLoadPage);
			}
			if (oCell && oCell.getRowSpan() < iRowSpanCounter) {
				oCell = null;
			}
			if (oCell && oCell.setEffectiveRowSpan) {
				oCell.setEffectiveRowSpan(oCell.getRowSpan() - iRowSpanCounter + 1);
			}
		} else {
			if (oCell.setEffectiveRowSpan) {
				oCell.setEffectiveRowSpan(oCell.getRowSpan());
			}
		}
		return oCell;
	};

	this.getCellWithColSpan = function (iRow, iCol, bDoNotLoadPage) {
		var oCell = this.getCell(iRow, iCol, bDoNotLoadPage);
		if (!oCell) {
			var iColSpanCounter = 1;
			while (!oCell && iCol > 0) {
				iCol--;
				iColSpanCounter++;
				oCell = this.getCell(iRow, iCol, bDoNotLoadPage);
			}
			if (oCell && oCell.getColSpan() < iColSpanCounter) {
				oCell = null;
			}
			if (oCell && oCell.setEffectiveColSpan) {
				oCell.setEffectiveColSpan(oCell.getColSpan() - iColSpanCounter + 1);
			}

		} else {
			if (oCell.setEffectiveColSpan) {
				oCell.setEffectiveColSpan(oCell.getColSpan());
			}
		}
		return oCell;
	};
	
	this.getAllLoadedCellsByCol = function(oArea, iCol) {
		var aCells = [];
		var aLoadedCells = null;
		var i = 0;
		var oCell = null;
		
		if (!oPageManager && oArea) {
			oPageManager = oArea.getPageManager();
		}
		if (oPageManager) {
			aLoadedCells = oPageManager.getLoadedCellRowsByCol(oArea, iCol);
		}
		if (aLoadedCells) {
			for (i = 0; i < aLoadedCells.length; i++) {
				oCell = this.getCellWithColSpan(aLoadedCells[i], iCol, true);
				if (oCell) {
					aCells.push(oCell);
				}
			}
		}
		return aCells;
	};

	this.getCellsByCol = function (iCol, iStartRow, iRowCnt) {
		var aCells = [];
		var iRow = 0;
		var iMaxRow = 0;
		var oCell = null;

		iRow = iStartRow;
		iMaxRow = iStartRow + iRowCnt;
		for (iRow; iRow < iMaxRow; iRow++) {
			oCell = this.getCellWithColSpan(iRow, iCol, true);
			if (oCell) {
				aCells.push(oCell);
			}
		}

		return aCells;
	};
	

	this.getAllLoadedCellsByRow = function (oArea, iRow) {
		var aCells = [];
		var aLoadedCells = null;
		var i = 0;
		var oCell = null;
		
		if (!oPageManager && oArea) {
			oPageManager = oArea.getPageManager();
		}
		if (oPageManager) {
			aLoadedCells = oPageManager.getLoadedCellColumnsByRow(oArea, iRow);
		}
		if (aLoadedCells) {
			for (i = 0; i < aLoadedCells.length; i++) {
				oCell = this.getCellWithRowSpan(iRow, aLoadedCells[i], true);
				if (oCell) {
					aCells.push(oCell);
				}
			}
		}
		return aCells;
	};

	this.getCellsByRow = function (iRow, iStartCol, iColCnt) {
		var aCells = [];
		var iCol = 0;
		var iMaxCol = 0;
		var oCell = null;

		iCol = iStartCol;
		iMaxCol = iStartCol + iColCnt;
		for (iCol; iCol < iMaxCol; iCol++) {
			oCell = this.getCellWithRowSpan(iRow, iCol, true);
			if (oCell) {
				aCells.push(oCell);
			}
		}

		return aCells;
	};

	this.getModelRows = function () {
		return aModelRows;
	};
};
