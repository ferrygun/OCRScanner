jQuery.sap.declare("sap.zen.crosstab.CrosstabHeaderInfo");
/**
 * 
 */
sap.zen.crosstab.CrosstabHeaderInfo = function(oCrosstab, oHeaderInfo) {
	"use strict"
	
	// "absolute" indices are e. g. BICS coordinates
	// all other col/row indices are matrix coordinates (including key/text, attributes etc)
	
	var oColInfoArray = oHeaderInfo.cols;
	var oRowInfoArray = oHeaderInfo.rows;
	var oColInfo = null;
	var oRowInfo = null;
	var oDimensionByCol = {};
	var oDimensionByRow = {};
	var oFirstColIndexByDimension = {};
	var oFirstRowIndexByDimension = {};
	
	var iRowDimensionCount = 0;
	var iColDimensionCount = 0;
	var iStartColForInnermostDimension = 0;
	var oAbsoluteColIndexByDimension = {};
	var oAbsoluteRowIndexByDimension = {};
	
	var oRowIndexByAbsoluteRowIndex = {};
	var oColIndexByAbsoluteColIndex = {};
	
	var i = 0;
	var index = 0;
	var iMaxColIndex;
	var sDimName;
	var sPeekDimName;
	var oDimensionNames = {};
	
	function addDimensionName(sDimensionName) {
		if (!oDimensionNames.hasOwnProperty(sDimensionName)) {
			oDimensionNames[sDimensionName] = {};
		}
	}
	
	function translateLegacyProperties(oArray, i) {
		if (oArray[i].charname) {
			oArray[i].sDimensionName = oArray[i].charname;
			delete oArray[i].charname;
			addDimensionName(oArray[i].sDimensionName);
		}
		
		if (oArray[i].attrname) {
			oArray[i].sAttributeName = oArray[i].attrname;
			delete oArray[i].attrname;
		}
		
		if (oArray[i].iskey) {
			oArray[i].bIsKeyPresentation = oArray[i].iskey;
			delete oArray[i].iskey;
		}
	}
	
	if (oColInfoArray) {
		for (i = 0; i < oColInfoArray.length; i++) {
			translateLegacyProperties(oColInfoArray, i);
											
			oColInfoArray[i].sAxisName = "ROWS";
			oColInfoArray[i].iIndex = i;
			oColInfo = oColInfoArray[i];
			oDimensionByCol[i] = oColInfo;
			
			if (oFirstColIndexByDimension[oColInfo.sDimensionName] === undefined) {
				oFirstColIndexByDimension[oColInfo.sDimensionName] = i;
			}
			
			if (oAbsoluteColIndexByDimension[oColInfo.sDimensionName] === undefined) {
				oAbsoluteColIndexByDimension[oColInfo.sDimensionName] = index;
				
				oColIndexByAbsoluteColIndex[index] = i;
				
				index++;
			}
		}
		iColDimensionCount = index;
		
		iStartColForInnermostDimension = 0;
		iMaxColIndex = oColInfoArray.length - 1;
		sDimName = oColInfoArray[iMaxColIndex].sDimensionName;
		for (i = iMaxColIndex; i > 0; i--) {
			sPeekDimName = oColInfoArray[i - 1].sDimensionName;
			if (sPeekDimName !== sDimName) {
				iStartColForInnermostDimension = i;
				break;
			}
		}
	}
	
	if (oRowInfoArray) {
		index = 0;
		for (i = 0; i < oRowInfoArray.length; i++) {
			translateLegacyProperties(oRowInfoArray, i);
			
			oRowInfoArray[i].sAxisName = "COLS";
			oRowInfoArray[i].iIndex = i;
			oRowInfo = oRowInfoArray[i];
			oDimensionByRow[i] = oRowInfo;
			
			if (oFirstRowIndexByDimension[oRowInfo.sDimensionName] === undefined) {
				oFirstRowIndexByDimension[oRowInfo.sDimensionName] = i;
			}
			
			if (oAbsoluteRowIndexByDimension[oRowInfo.sDimensionName] === undefined) {
				oAbsoluteRowIndexByDimension[oRowInfo.sDimensionName] = index;
				
				oRowIndexByAbsoluteRowIndex[index] = i;
				
				index++;
			}
		}
		iRowDimensionCount = index;
	}
	
	this.getDimensionNameByCol = function(iCol) {
		if(oDimensionByCol && oDimensionByCol[iCol]){			
			return oDimensionByCol[iCol].sDimensionName;
		} else {
			return null;
		}
	};
	
	this.getDimensionNameByRow = function(iRow) {
		if(oDimensionByRow && oDimensionByRow[iRow]){	
			return oDimensionByRow[iRow].sDimensionName;
		} else {
			return null;
		}
	};

	this.getFirstColForDimension = function(sDimName) {
		var col = -1;
		if (oFirstColIndexByDimension[sDimName] >= 0) {
			col = oFirstColIndexByDimension[sDimName];
		}
		return col;
	};
	
	this.getFirstRowForDimension = function(sDimName) {
		var row = -1;
		if (oFirstRowIndexByDimension[sDimName] >= 0) {
			row = oFirstRowIndexByDimension[sDimName];
		}
		return row;
	};
	
	this.getAbsoluteColIndexForDimension = function(sDimName) {
		var col = -1;
		if (oAbsoluteColIndexByDimension[sDimName] >= 0) {
			col = oAbsoluteColIndexByDimension[sDimName];
		}
		return col;
	};
	
	this.getAbsoluteRowIndexForDimension = function(sDimName) {
		var row = -1;
		if (oAbsoluteRowIndexByDimension[sDimName] >= 0) {
			row = oAbsoluteRowIndexByDimension[sDimName];
		}
		return row;
	};
	
	this.getRowForAbsoluteRow = function(iAbsRow) {
		var iRow = -1;
		if (oRowIndexByAbsoluteRowIndex[iAbsRow] >= 0) {
			iRow = oRowIndexByAbsoluteRowIndex[iAbsRow];
		}
		return iRow;
	};
	
	this.getColForAbsoluteCol = function(iAbsCol) {
		var iCol = -1;
		if (oColIndexByAbsoluteColIndex[iAbsCol] >= 0) {
			iCol = oColIndexByAbsoluteColIndex[iAbsCol];
		}
		return iCol;
	};
	
	this.getNumberOfDimensionsOnColsAxis = function() {
		if (oRowInfoArray) {
			return oRowInfoArray.length;
		}
		return 0;
	};
	
	this.getNumberOfDimensionsOnRowsAxis = function() {
		if (oColInfoArray) {
			return oColInfoArray.length;
		}
		return 0;
	};
	
	this.isColOfInnermostDimension = function (iCol) {
		var sDimensionName = this.getDimensionNameByCol(iCol);
		if (sDimensionName){			
			var iAbsCol = this.getAbsoluteColIndexForDimension(sDimensionName);
			if (iAbsCol !== iColDimensionCount - 1) {
				return false;
			}
			return true;
		}
		return false;
	};
	
	this.getStartColForInnermostDimension = function() {
		return iStartColForInnermostDimension;
	};

	this.isRowOfInnermostDimension = function (iRow){
		var sDimensionName = this.getDimensionNameByRow(iRow);
		if(sDimensionName){			
			var iAbsRow = this.getAbsoluteRowIndexForDimension(sDimensionName);
			if (iAbsRow !== iRowDimensionCount - 1) {
				return false;
			}
			return true;
		}
		return false;
	};
	
	this.isBottomRightDimHeaderCell = function(oCell) {
		return ((this.isBottomRowDimHeaderCell(oCell) === true) && (this.isRightColDimHeaderCell(oCell) === true));
	};

	this.isBottomRowDimHeaderCell = function(oCell) {
		var iMaxDimHeaderRow = oCrosstab.getTableMaxDimHeaderRow();
		var bIsBottomRowDimHeaderCell = ((oCell.getTableRow() + oCell.getRowSpan() - 1) === iMaxDimHeaderRow);
		return bIsBottomRowDimHeaderCell;
	};

	this.isRightColDimHeaderCell = function(oCell) {
		var iMaxDimHeaderCol = oCrosstab.getTableMaxDimHeaderCol();
		var isRightColDimHeaderCell = ((oCell.getTableCol() + oCell.getColSpan() - 1) === iMaxDimHeaderCol);
		return isRightColDimHeaderCell;
	};
	
	this.getDimensionInfoForNonSplitPivotCell = function(oCell) {
		var oDimInfo;
		if (oCell.getScalingAxis() === "ROWS") {
			oDimInfo = oRowInfoArray[oCell.getTableRow()];
		} else if (oCell.getScalingAxis() === "COLS") {
			oDimInfo = oColInfoArray[oCell.getTableCol()];
		} 
		return oDimInfo;
	};
	
	this.getDimensionInfoForSplitPivotCell = function(oCell, sSplitCellAxisName) {
		var oDimInfo;
		
		if (sSplitCellAxisName) {
			if (sSplitCellAxisName == "ROWS") {
				oDimInfo = oColInfoArray[oCell.getTableCol()];
			} else if (sSplitCellAxisName == "COLS") {
				oDimInfo = oRowInfoArray[oCell.getTableRow()];
			}
		}
		return oDimInfo;
	};
	
	this.getDimensionInfoByRowCol = function(oCell, sSplitCellAxisName) {
		var oDimInfo = null;
		var iMaxDimHeaderRow = oCrosstab.getTableMaxDimHeaderRow();
		var iMaxDimHeaderCol = oCrosstab.getTableMaxDimHeaderCol();
		var iRow = oCell.getTableRow();
		var iCol = oCell.getTableCol();
		
		if (oCell.isPivotCell() === true) {
			if (oCell.isSplitPivotCell() === true) {
				oDimInfo = this.getDimensionInfoForSplitPivotCell(oCell, sSplitCellAxisName);
			} else {
				// no split dim cell => we have a scaling factor
				oDimInfo = this.getDimensionInfoForNonSplitPivotCell(oCell);
			}
		} else if (this.isBottomRowDimHeaderCell(oCell) === true) {
			// stuff on the rows axis, i. e. the columns of the dimension header
			if (oColInfoArray) {
				oDimInfo = oColInfoArray[iCol];
			} else {
				// nothing on rows, i. e. only one column in dimension header
				oDimInfo = oRowInfoArray[iRow];
			}
		} else if (this.isRightColDimHeaderCell(oCell) === true) {
			// stuff on the columns axis, i. e. the rows of the dimension header
			if (oRowInfoArray) {
				oDimInfo = oRowInfoArray[iRow];
			} else {
				// nothing on columns, i. e. only one row in dimension header
				oDimInfo = oColInfoArray[iCol];
			}
		}
		return oDimInfo;
	};
	
	this.getDimensionInfoByRow = function(iRow) {
		var oDimInfo = null;
		if (oRowInfoArray) {
			oDimInfo = oRowInfoArray[iRow];
		}
		return oDimInfo;
	};
	
	this.getDimensionInfoByCol = function(iCol) {
		var oDimInfo = null;
		if (oColInfoArray) {
			oDimInfo = oColInfoArray[iCol];
		}
		return oDimInfo;		
	};
	
	this.hasDimensionsOnRowsAxis = function() {
		if (oColInfoArray) {
			return true;
		}
		return false;
	};
	
	this.hasDimensionsOnColsAxis = function() {
		if (oRowInfoArray) {
			return true;
		}
		return false;		
	};
	
	this.findIndexInterval = function(sDimensionName, sAxisName) {
		var iIndex;
		var aArray;
		var iLength;
		var sLoopDimName;
		var oIndexInterval = {"iStartIndex" : -1, "iEndIndex" : -1};
		
		if (sAxisName === "ROWS") {
			aArray = oColInfoArray;
		} else if (sAxisName === "COLS") {
			aArray = oRowInfoArray;
		}
		
		iLength = aArray.length;
		sLoopDimName = null;
		
		for (iIndex = 0; iIndex < iLength && oIndexInterval.iStartIndex < 0; iIndex++) {
			sLoopDimName = aArray[iIndex].sDimensionName;
			if (sLoopDimName === sDimensionName) {
				oIndexInterval.iStartIndex = iIndex;
			}
		}
		
		if (oIndexInterval.iStartIndex >= 0) {
			for (iIndex = oIndexInterval.iStartIndex; iIndex < iLength && oIndexInterval.iEndIndex < 0; iIndex++) {
				sLoopDimName = aArray[iIndex].sDimensionName;
				if (sLoopDimName !== sDimensionName) {
					oIndexInterval.iEndIndex = iIndex - 1;
				}
			}
			if (oIndexInterval.iEndIndex < 0) {
				oIndexInterval.iEndIndex = iLength - 1;
			}
		}
				
		return oIndexInterval;
	};
	
	this.isEqualDimInfo = function(oDimInfo1, oDimInfo2) {
		if (oDimInfo1.sDimensionName !== oDimInfo2.sDimensionName) {
			return false;
		}
		if (oDimInfo1.sAttributeName !== oDimInfo2.sAttributeName) {
			return false;
		}
		if (oDimInfo1.bIsKeyPresentation !== oDimInfo2.bIsKeyPresentation) {
			return false;
		}
		if (oDimInfo1.bIsTextPresentation !== oDimInfo2.bIsTextPresentation) {
			return false;
		}
		if (oDimInfo1.bIsMeasureStructure !== oDimInfo2.bIsMeasureStructure) {
			return false;
		}
		if (oDimInfo1.bIsStructure !== oDimInfo2.bIsStructure) {
			return false;
		}
		if (oDimInfo1.bIsScaling !== oDimInfo2.bIsScaling) {
			return false;
		}
		return true;
	};
	
	this.includeBottomRightCell = function(i, oCell, oArray, oArray2) {
		var oDimInfo;
		var oDimInfo2;
		var bIncludeCell = true;
		
		if (this.isBottomRightDimHeaderCell(oCell) === true) {
			if (!oCell.isSplitPivotCell() && i > 0) {
				oDimInfo = oArray[i];
				oDimInfo2 = oArray[i - 1];
				bIncludeCell = (oDimInfo.sDimensionName === oDimInfo2.sDimensionName) && (!oDimInfo.bIsScaling);
			}
		}
		return bIncludeCell;
	};
	
	this.getCellsForInterval = function(oIndexInterval, sAxisName) {
		var oCell;
		var oDimInfo;
		var oDimInfo2;
		var i = oIndexInterval.iStartIndex;
		var iMaxDimHeaderRow = oCrosstab.getTableMaxDimHeaderRow();
		var iMaxDimHeaderCol = oCrosstab.getTableMaxDimHeaderCol();
		var aIndexCells = [];
		var bIncludeCell;
		var bSingleCell = oIndexInterval.iStartIndex === oIndexInterval.iEndIndex;
		
		while (i <= oIndexInterval.iEndIndex) {
			bIncludeCell = true;
			if (sAxisName === "ROWS") {
				oCell = oCrosstab.getTableCellWithColSpan(iMaxDimHeaderRow, i);
				bIncludeCell = bSingleCell || this.includeBottomRightCell(i, oCell, oColInfoArray, oRowInfoArray);
				i = i + oCell.getColSpan();
			} else if (sAxisName === "COLS") {
				oCell = oCrosstab.getTableCellWithRowSpan(i, iMaxDimHeaderCol);
				bIncludeCell = bSingleCell || this.includeBottomRightCell(i, oCell, oRowInfoArray, oColInfoArray);
				i = i + oCell.getRowSpan();
			} 
			
			if (bIncludeCell === true) {
				aIndexCells.push(oCell);
			}
		}
		return aIndexCells;
	};
	
	this.getCellsWithSameDimensionByDimInfo = function(oDimInfo) {
		var aIndexCells;
		var oIndexInterval;
		var sDimName;
		var sAxisName;
		
		if (oDimInfo) {
			sDimName = oDimInfo.sDimensionName;
			sAxisName = oDimInfo.sAxisName;
			oIndexInterval = this.findIndexInterval(sDimName, sAxisName);
			aIndexCells = this.getCellsForInterval(oIndexInterval, sAxisName);
		}
		return aIndexCells;
	};
	
	this.getCellsWithSameDimension = function(oCell, sAxisName) {
		var oDimInfo;
		var aIndexCells;
		
		if (!sAxisName && oCell.isPivotCell() === true && oCell.isSplitPivotCell() === true) {
				return [];
		} else {
			oDimInfo = this.getDimensionInfoByRowCol(oCell, sAxisName);
		}
		
		aIndexCells = this.getCellsWithSameDimensionByDimInfo(oDimInfo);
		
		return aIndexCells;
	};
	
	this.setupPivotCell = function() {
		var oCell;
		var bIsPivotCell = false;
		var bIsSplitPivotCell = false;
		var iCol = -1;
		var iRow = -1;
		var oDimInfoByCol;
		var oDimInfoByRow;
		
		oCell = oCrosstab.getTableCellWithSpans(oCrosstab.getTableMaxDimHeaderRow(), oCrosstab.getTableMaxDimHeaderCol());
		if (oCell) {
			iRow = oCell.getTableRow();
			iCol = oCell.getTableCol();
			
			// Pivot?
			if (this.isBottomRightDimHeaderCell(oCell) === true) {
				bIsPivotCell = this.hasDimensionsOnRowsAxis() === true && this.hasDimensionsOnColsAxis() === true;
			}
			oCell.setPivotCell(bIsPivotCell);
			
			oDimInfoByCol = this.getDimensionInfoByCol(iCol);	
			oDimInfoByRow = this.getDimensionInfoByRow(iRow);
			
			// Split Pivot Cell
			if (oCell.isPivotCell() === true) {
				if (!(oDimInfoByCol && oDimInfoByCol.bIsScaling) && !(oDimInfoByRow && oDimInfoByRow.bIsScaling)) {
					bIsSplitPivotCell = true;
				}
			}
			oCell.setSplitPivotCell(bIsSplitPivotCell);
			
			// scaling factor
			if (oDimInfoByCol && oDimInfoByCol.bIsScaling === true) {
				oCell.setScalingAxis("ROWS");
			} else if (oDimInfoByRow && oDimInfoByRow.bIsScaling === true) {
				oCell.setScalingAxis("COLS");
			}
			
		}
		return oCell;
	};
	
	this.getDimensionInfoForMemberCell = function(oCell) {
		if (oCell.getArea().isRowHeaderArea()) {
			return oColInfoArray[oCell.getTableCol()];
		} else if (oCell.getArea().isColHeaderArea()) {
			return oRowInfoArray[oCell.getTableRow()];
		}
		return null;
	};
	
	this.getMemberCellsForSameDimension = function(oCell) {
		var aCells;
		var bExcludeLast;
		
		// pivot cell may be null if e. g. only measure structure in drilldown
		if (oCell.getArea().isRowHeaderArea()) {
			if (oColInfoArray) {
				bExcludeLast = oColInfoArray[oColInfoArray.length - 1].bIsScaling;
			}
			aCells = this.getRowHeaderMemberCellsForSameDimension(oCell, bExcludeLast);
		} else if (oCell.getArea().isColHeaderArea()) {
			if (oRowInfoArray) {
				bExcludeLast = oRowInfoArray[oRowInfoArray.length - 1].bIsScaling;
			}
			aCells = this.getColHeaderMemberCellsForSameDimension(oCell, bExcludeLast);
		}
		
		return aCells;
	};
	
	this.getRowHeaderMemberCellsForSameDimension = function(oCell, bExcludeLastCol) {
		var oDimInfo;
		var aMemberCell;
		var aMemberCells;
		var i = 0;
		var oIndexInterval;
		var oRowHeaderArea;
		var iMaxCol;
		
		oDimInfo = this.getDimensionInfoByCol(oCell.getTableCol());
		oIndexInterval = this.findIndexInterval(oDimInfo.sDimensionName, "ROWS");
		aMemberCells = [];
		oRowHeaderArea = oCrosstab.getRowHeaderArea();
		iMaxCol = oRowHeaderArea.getColCnt() - 1;
		
		i = oIndexInterval.iStartIndex;
		while (i <= oIndexInterval.iEndIndex) {
			aMemberCell = oRowHeaderArea.getCellWithColSpan(oCell.getRow(), i);
			if (aMemberCell) {
				if (bExcludeLastCol) {
					if (aMemberCell.getCol() < iMaxCol) {
						aMemberCells.push(aMemberCell);
					}
				} else {
					aMemberCells.push(aMemberCell);
				}
				i = i + aMemberCell.getColSpan();
			} else {
				i++;
			}
		}
		
		return aMemberCells;
	};
	
	this.getColHeaderMemberCellsForSameDimension = function(oCell, bExcludeLastRow) {
		var oDimInfo;
		var aMemberCell;
		var aMemberCells;
		var i = 0;
		var oIndexInterval;
		var oColHeaderArea;
		var iMaxRow;
		
		oDimInfo = this.getDimensionInfoByRow(oCell.getTableRow());
		oIndexInterval = this.findIndexInterval(oDimInfo.sDimensionName, "COLS");
		aMemberCells = [];
		oColHeaderArea = oCrosstab.getColumnHeaderArea();
		iMaxRow = oColHeaderArea.getRowCnt() - 1;
		
		i = oIndexInterval.iStartIndex;
		while (i <= oIndexInterval.iEndIndex) {
			aMemberCell = oColHeaderArea.getCellWithRowSpan(i, oCell.getCol());
			if (aMemberCell) {
				if (bExcludeLastRow) {
					if (aMemberCell.getRow() < iMaxRow) {
						aMemberCells.push(aMemberCell);
					}
				} else {
					aMemberCells.push(aMemberCell);
				}
				i = i + aMemberCell.getRowSpan();
			} else {
				i++;
			}
		}
		
		return aMemberCells;
	};
	
	this.findStartIndexOfPreviousDimension = function(sDimensionName, sAxisName) {
		var oInfoArray;
		var iMaxIndex;
		var i;
		var bFound;
		var oInfo;
		var iFirstPreviousDimensionIndex = 0;
		var i
		var sPreviousDimensionName;
		
		if (sAxisName === "ROWS") {
			oInfoArray = oColInfoArray;
		} else if (sAxisName === "COLS") {
			oInfoArray = oRowInfoArray;
		}
		if (oInfoArray) {
			iMaxIndex = oInfoArray.length - 1;
			i = iMaxIndex;
			bFound = false;
			while (i >= 0 && !bFound) {
				oInfo = oInfoArray[i];
				if (oInfo.sDimensionName === sDimensionName) {
					bFound = true;
				} else {
					i--;
				}
			}
			while (oInfo.sDimensionName === sDimensionName && i >= 0) {
				oInfo = oInfoArray[i];
				if (oInfo.sDimensionName === sDimensionName) {
					i--;
				}
			}
			sPreviousDimensionName = oInfo.sDimensionName;
			while (oInfo.sDimensionName === sPreviousDimensionName && i >= 0) {
				oInfo = oInfoArray[i];
				if (oInfo.sDimensionName !== sPreviousDimensionName) {
					iFirstPreviousDimensionIndex = i + 1;
				} else {
					i--;
				}
			}
		}
		return iFirstPreviousDimensionIndex;
	};
	
	this.isFirstDimensionOnAxis = function(oDimInfo) {
		if (oDimInfo.sAxisName === "ROWS" && oColInfoArray) {
			return oColInfoArray[0].sDimensionName === oDimInfo.sDimensionName;
		} else if (oDimInfo.sAxisName === "COLS" && oRowInfoArray) {
			return oRowInfoArray[0].sDimensionName === oDimInfo.sDimensionName;
		}
		return true;
	};
	
	this.isDimensionInCrosstab = function(sDimensionName) {
		if (oDimensionNames) {
			if (oDimensionNames.hasOwnProperty(sDimensionName)) {
				return true;
			}
		}
		return false;
	};
	
	this.hasOnlyMeasureStructure = function() {
		var oInfoArray = null;
		var i = 0;
		var cnt = 0;
		var sAxisName = null;
		var bHasOnlyMeasures = false;
		
		if (!oColInfoArray && oRowInfoArray) {
			oInfoArray = oRowInfoArray;
			sAxisName = "ROWS";
		} else if (!oRowInfoArray && oColInfoArray) {
			oInfoArray = oColInfoArray;
			sAxisName = "COLS";
		}
		
		if (oInfoArray && oInfoArray.length > 0) {
			bHasOnlyMeasures = true;
			for (i = 0; i < oInfoArray.length; i++) {
				if (!oInfoArray[i].bIsMeasureStructure) {
					bHasOnlyMeasures = false;
					break;
				}
			}			
		}
		return bHasOnlyMeasures;
	};
}