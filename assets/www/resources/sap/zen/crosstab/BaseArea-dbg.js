jQuery.sap.declare("sap.zen.crosstab.BaseArea");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderEngine");
jQuery.sap.require("sap.zen.crosstab.rendering.DataModel");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

sap.zen.crosstab.BaseArea = function (oCrosstab) {
	"use strict";
	this.sAreaType = "";
	this.sId = "";
	this.oCrosstab = oCrosstab;
	this.iRenderStartRow = 0;
	this.iRenderRowCnt = 0;
	this.iRenderStartCol = 0;
	this.iRenderColCnt = 0;
	this.bHasContent = false;
	this.fRenderCellCallback = null;
	this.oDataModel = new sap.zen.crosstab.rendering.DataModel(this);

	this.aColGranularity = [];
	this.aColWidths = [];

	this.aCalculatedColWidths = [];
	this.aTemporaryColWidths = [];

	this.aRowGranularity = [];
	this.aRowHeights = [];

	this.aCalculatedRowHeights = [];
	this.aTemporaryRowHeights = [];

	this.oColsWithSymbolException = {};

	this.oColUserWidth = {};

	this.aLevelCells = [];

	this.iLoadingPageCnt = 0;

	this.bColGranularityCalculatedAndMeasured = false;

	this.oUserResizedCols = {};
	
	this.oCellsWithLineBreakTexts = null;
	
	this.iMaxNumberOfLineBreaks = 0;
	
	
	// data save for header width handling
	this.iSaveRenderStartRow = 0;
	this.iSaveRenderRowCnt = 0;
	this.iSaveRenderStartCol = 0;
	this.iSaveRenderColCnt = 0;
	this.aSaveColGranularity = [];
	this.aSaveColWidths = [];
	this.aSaveCalculatedColWidths = [];
	this.aSaveTemporaryColWidths = [];
	this.aSaveRowGranularity = [];
	this.aSaveRowHeights = [];
	this.aSaveCalculatedRowHeights = [];
	this.aSaveTemporaryRowHeights = [];
	this.oSaveColsWithSymbolException = {};
	this.oSaveColUserWidth = {};
	this.aSaveLevelCells = [];
	this.iSaveLoadingPageCnt = 0;
	this.bSaveColGranularityCalculatedAndMeasured = false;
	this.oSaveUserResizedCols = {};
	this.oSaveCellsWithLineBreakTexts = null;
	this.iSaveMaxNumberOfLineBreaks = 0;
};

sap.zen.crosstab.BaseArea.prototype.saveData = function() {
	this.iSaveRenderStartRow = this.iRenderStartRow;
	this.iSaveRenderRowCnt = this.iRenderRowCnt;
	this.iSaveRenderStartCol = this.iRenderStartCol;
	this.iSaveRenderColCnt = this.iRenderColCnt;
	this.aSaveColGranularity = this.aColGranularity.slice();
	this.aSaveColWidths = this.aColWidths.slice();
	this.aSaveCalculatedColWidths = this.aCalculatedColWidths.slice();
	this.aSaveTemporaryColWidths = this.aTemporaryColWidths.slice();
	this.aSaveRowGranularity = this.aRowGranularity.slice();
	this.aSaveRowHeights = this.aRowHeights.slice();
	this.aSaveCalculatedRowHeights = this.aCalculatedRowHeights.slice();
	this.aSaveTemporaryRowHeights = this.aTemporaryRowHeights.slice();
	this.oSaveColsWithSymbolException = jQuery.extend({}, this.oColsWithSymbolException);
	this.oSaveColUserWidth = jQuery.extend({}, this.oColUserWidth);
	this.aSaveLevelCells = this.aLevelCells.slice();
	this.iSaveLoadingPageCnt = this.iLoadingPageCnt;
	this.bSaveColGranularityCalculatedAndMeasured = this.bColGranularityCalculatedAndMeasured;
	this.oSaveUserResizedCols = jQuery.extend({}, this.oUserResizedCols);
	this.oSaveCellsWithLineBreakTexts = jQuery.extend({}, this.oCellsWithLineBreakTexts);
	this.iSaveMaxNumberOfLineBreaks = this.iMaxNumberOfLineBreaks;
};

sap.zen.crosstab.BaseArea.prototype.restoreData = function() {
	this.iRenderStartRow = this.iSaveRenderStartRow;
	this.iRenderRowCnt = this.iSaveRenderRowCnt;
	this.iRenderStartCol = this.iSaveRenderStartCol;
	this.iRenderColCnt = this.iSaveRenderColCnt;
	this.aColGranularity = this.aSaveColGranularity;
	this.aColWidths = this.aSaveColWidths;
	this.aCalculatedColWidths = this.aSaveCalculatedColWidths;
	this.aTemporaryColWidths = this.aSaveTemporaryColWidths;
	this.aRowGranularity = this.aSaveRowGranularity;
	this.aRowHeights = this.aSaveRowHeights;
	this.aCalculatedRowHeights = this.aSaveCalculatedRowHeights;
	this.aTemporaryRowHeights = this.aSaveTemporaryRowHeights;
	this.oColsWithSymbolException = this.oSaveColsWithSymbolException;
	this.oColUserWidth = this.oSaveColUserWidth;
	this.aLevelCells = this.aSaveLevelCells;
	this.iLoadingPageCnt = this.iSaveLoadingPageCnt;
	this.bColGranularityCalculatedAndMeasured = this.bSaveColGranularityCalculatedAndMeasured;
	this.oUserResizedCols = this.oSaveUserResizedCols;
	this.oCellsWithLineBreakTexts = this.oSaveCellsWithLineBreakTexts;
	this.iMaxNumberOfLineBreaks = this.iSaveMaxNumberOfLineBreaks;
};

sap.zen.crosstab.BaseArea.prototype.insertCell = function (oCell, iRow, iCol) {
	if (oCell) {
		var iNumberOfLineBreaks = oCell.getNumberOfLineBreaks();
		if (iNumberOfLineBreaks > this.iMaxNumberOfLineBreaks) {
			this.iMaxNumberOfLineBreaks = iNumberOfLineBreaks;
		}
		if (iNumberOfLineBreaks > 0) {
			if (!this.oCellsWithLineBreakTexts) {
				this.oCellsWithLineBreakTexts = {};
			}
			this.oCellsWithLineBreakTexts[oCell.getId()] = oCell;
		}
		this.bHasContent = true;
		var oModelCoordinates = this.oCrosstab.getUtils().getModelCoordinates(iRow, iCol, this.sAreaType);

		if (oModelCoordinates.iCol === 0) {
			oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_FIRST_IN_ROW);
		}
		if (oModelCoordinates.iRow === 0) {
			oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_FIRST_IN_COL);
		}
		if ((oModelCoordinates.iCol + oCell.getColSpan()) === this.oCrosstab.getTotalCols()) {
			oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_LAST_IN_ROW);
		}
		if ((oModelCoordinates.iRow + oCell.getRowSpan()) === this.oCrosstab.getTotalRows()) {
			oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_LAST_IN_COL);
		}
	}
	this.oDataModel.insertCell(oCell, iRow, iCol);
};

sap.zen.crosstab.BaseArea.prototype.addHighlightingForCell = function (iRow, iCol) {
	var oCell = this.oDataModel.getCellWithSpan(iRow, iCol);
	if (oCell) {
		// In future render cycles, the cell needs to keep the highlighted state
		oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_HIGHLIGHTED);

		// To get the cell to highlight immediately the style is set in the DOM. This is cheaper than rerendering.
		var oDomCell = $(document.getElementById(oCell.getId()));
		if (this.isDataArea()) {
			oDomCell.addClass("sapzencrosstab-DataCellHighlighted");
		} else {
			oDomCell.addClass("sapzencrosstab-HeaderCellHighlighted");
		}
	}
};

sap.zen.crosstab.BaseArea.prototype.removeHighlightingForCell = function (iRow, iCol) {
	var oCell = this.oDataModel.getCellWithSpan(iRow, iCol);
	if (oCell) {
		oCell.removeStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_HIGHLIGHTED);
		var oDomCell = $(document.getElementById(oCell.getId()));
		if (this.isDataArea()) {
			oDomCell.removeClass("sapzencrosstab-DataCellHighlighted");
		} else {
			oDomCell.removeClass("sapzencrosstab-HeaderCellHighlighted");
		}
	}
};

sap.zen.crosstab.BaseArea.prototype.resetColGranularity = function () {
	this.aColGranularity = [];
};

sap.zen.crosstab.BaseArea.prototype.resetRowGranularity = function () {
	this.aRowGranularity = [];
};

sap.zen.crosstab.BaseArea.prototype.calculateColGranularity = function () {
	if (this.bColGranularityCalculatedAndMeasured === false) {
		var iRow = 0;
		var iEndRow = this.iRenderStartRow + this.iRenderRowCnt;
		var iCol = 0;
		var iEndCol = this.iRenderStartCol + this.iRenderColCnt;

		this.aColGranularity = [];
		for (iCol = this.iRenderStartCol; iCol < iEndCol; iCol++) {
			for (iRow = this.iRenderStartRow; iRow < iEndRow; iRow++) {
				if (this.collectColGranularity(iRow, iCol, this)) {
					break;
				}
			}
		}
	}
};

sap.zen.crosstab.BaseArea.prototype.calculateRowGranularity = function () {
	var iRow = 0;
	var iEndRow = this.iRenderStartRow + this.iRenderRowCnt;
	var iCol = 0;
	var iEndCol = this.iRenderStartCol + this.iRenderColCnt;

	this.aRowGranularity = [];
	for (iRow = this.iRenderStartRow; iRow < iEndRow; iRow++) {
		for (iCol = this.iRenderStartCol; iCol < iEndCol; iCol++) {
			if (this.collectRowGranularity(iRow, iCol, this)) {
				break;
			}
		}
	}
};

sap.zen.crosstab.BaseArea.prototype.getCellForGranularity = function (iRow, iCol, that) {
	var oCell = null;

	if (iCol === that.iRenderStartCol && iRow === that.iRenderStartRow) {
		oCell = that.oDataModel.getCellWithSpan(iRow, iCol);
	} else if (iCol === that.iRenderStartCol) {
		oCell = that.oDataModel.getCellWithColSpan(iRow, iCol);
	} else if (iRow === that.iRenderStartRow) {
		oCell = that.oDataModel.getCellWithRowSpan(iRow, iCol);
	} else {
		oCell = that.oDataModel.getCellDirect(iRow, iCol);
	}
	return oCell;
};

sap.zen.crosstab.BaseArea.prototype.collectColGranularity = function (iRow, iCol, that) {
	var oCell = that.getCellForGranularity(iRow, iCol, that);
	var iColSpan = -1;
	if (oCell) {
		iColSpan = oCell.getEffectiveColSpan();

		var oCellInfo = that.aColGranularity[iCol];
		if (oCellInfo) {
			if (iColSpan < oCellInfo.iColSpan) {
				oCellInfo.sId = oCell.getId();
				oCellInfo.iRow = iRow;
				oCellInfo.iCol = iCol;
				oCellInfo.iColSpan = iColSpan;
				oCellInfo.iWidth = 0;
			}
		} else {
			oCellInfo = {};
			oCellInfo.sId = oCell.getId();
			oCellInfo.iRow = iRow;
			oCellInfo.iCol = iCol;
			oCellInfo.iColSpan = iColSpan;
			oCellInfo.iWidth = 0;
			that.aColGranularity[iCol] = oCellInfo;
		}
	}

	return iColSpan === 1;
};

sap.zen.crosstab.BaseArea.prototype.collectRowGranularity = function (iRow, iCol, that) {
	var oCell = that.getCellForGranularity(iRow, iCol, that);
	var iRowSpan = -1;
	var iNumberOfLineBreaks = 0;
	if (oCell) {
		iRowSpan = oCell.getEffectiveRowSpan();
		iNumberOfLineBreaks = sap.zen.crosstab.utils.Utils.getNumberOfLineBreaks(oCell.getText());
		
		var oCellInfo = that.aRowGranularity[iRow];
		if (oCellInfo) {
			if (iRowSpan < oCellInfo.iRowSpan || iNumberOfLineBreaks > oCellInfo.iNumberOfLineBreaks) {
				oCellInfo.sId = oCell.getId();
				oCellInfo.iRow = iRow;
				oCellInfo.iCol = iCol;
				oCellInfo.iRowSpan = iRowSpan;
				oCellInfo.iHeight = 0;
				oCellInfo.isLevelCell = this.isColHeaderArea() && oCell.getLevel && oCell.getLevel() > -1;
				oCellInfo.isEntryEnabled = false; // oCell.isEntryEnabled();
				oCellInfo.iNumberOfLineBreaks = iNumberOfLineBreaks;
			}
		} else {
			oCellInfo = {};
			oCellInfo.sId = oCell.getId();
			oCellInfo.iRow = iRow;
			oCellInfo.iCol = iCol;
			oCellInfo.iRowSpan = iRowSpan;
			oCellInfo.iHeight = 0;
			oCellInfo.isLevelCell = this.isColHeaderArea() && oCell.getLevel && oCell.getLevel() > -1;
			oCellInfo.isEntryEnabled = false; // oCell.isEntryEnabled();
			oCellInfo.iNumberOfLineBreaks = iNumberOfLineBreaks;
			that.aRowGranularity[iRow] = oCellInfo;
		}
	}
	
	return (iRowSpan === 1) && (iNumberOfLineBreaks === this.iMaxNumberOfLineBreaks);
};

sap.zen.crosstab.BaseArea.prototype.measureColGranularityCells = function () {
	var iCol = 0;
	var oCellInfo = null;
	var oDomCell = null;
	var iCellWidth = 0;
	var iWidth = 0;
	var iModulo = 0;
	var i = 0;
	var bIsMsIE;

	if (this.bColGranularityCalculatedAndMeasured === false) {
		this.aColWidths = [];

		bIsMsIE = this.oCrosstab.getUtils().isMsIE();
		for (iCol = this.iRenderStartCol; iCol < this.aColGranularity.length; iCol++) {
			oCellInfo = this.aColGranularity[iCol];
			if (oCellInfo) {
				oDomCell = jQuery.sap.byId(oCellInfo.sId);
				if (oDomCell) {
					iCellWidth = oDomCell.outerWidth();
					if(bIsMsIE && !oDomCell.data("IeFixApplied")){
						iCellWidth = iCellWidth + 1;
						oDomCell.data("IeFixApplied", true);
					}
					iWidth = Math.floor(iCellWidth / oCellInfo.iColSpan);
					iModulo = iCellWidth % oCellInfo.iColSpan;

					for (i = 0; i < oCellInfo.iColSpan; i++) {
						if (this.aCalculatedColWidths[iCol + i] && !this.aTemporaryColWidths[iCol + i]) {
							this.aColWidths[iCol + i] = this.aCalculatedColWidths[iCol + i];
						} else {
							if (i === oCellInfo.iColSpan - 1) {
								iWidth += iModulo;
							}
							if (this.aColWidths[iCol + i]) {
								if (this.aColWidths[iCol + i] < iWidth) {
									this.aColWidths[iCol + i] = iWidth;
								}
							} else {
								this.aColWidths[iCol + i] = iWidth;
							}
						}
					}
				}
			}
		}

		// When there are Exceptions with symbols present, the cell width needs to be increased because the symbol is a
		// background image and not measured
		if (sap.zen.crosstab.utils.Utils.hasEntries(this.oColsWithSymbolException)) {
			var correctedWidth = null;
			var width;
			for ( var colIndex in this.oColsWithSymbolException) {
				if (this.oColsWithSymbolException.hasOwnProperty(colIndex)) {
					correctedWidth = this.oColsWithSymbolException[colIndex];
					if (correctedWidth === undefined || correctedWidth === null || isNaN(correctedWidth) === true) {
						width = this.aColWidths[colIndex];
						correctedWidth = width + this.oCrosstab.getExceptionSymbolWidth();
						this.oColsWithSymbolException[colIndex] = correctedWidth;
					}
					this.aColWidths[colIndex] = this.oColsWithSymbolException[colIndex];
				}
			}
		}

		// user defined column widths take precedence
		if (this.oColUserWidth && sap.zen.crosstab.utils.Utils.hasEntries(this.oColUserWidth)) {
			var iUserColWidth;
			for (var i = 0; i < this.aColWidths.length; i++) {
				iUserColWidth = this.determineUserColWidth(i);
				if (iUserColWidth > -1) {
					this.aColWidths[i] = iUserColWidth;
				}
			}
		}
	}
	return this.aColWidths;
};

sap.zen.crosstab.BaseArea.prototype.measureRowGranularityCells = function () {
	var iRow = 0;
	var oCellInfo = null;
	var oDomCell = null;
	var iCellHeight = 0;
	var iHeight = 0;
	var iModulo = 0;
	var i = 0;

	this.aLevelCells = [];
	this.aRowHeights = [];

	for (iRow = this.iRenderStartRow; iRow < this.aRowGranularity.length; iRow++) {
		oCellInfo = this.aRowGranularity[iRow];
		if (oCellInfo) {
			oDomCell = jQuery.sap.byId(oCellInfo.sId);
			if (oDomCell) {
				iCellHeight = oDomCell.outerHeight();
				iHeight = Math.floor(iCellHeight / oCellInfo.iRowSpan);
				iModulo = iCellHeight % oCellInfo.iRowSpan;

				if (oCellInfo.isLevelCell) {
					for (i = 0; i < oCellInfo.iRowSpan; i++) {
						if (i === oCellInfo.iRowSpan - 1) {
							iHeight += iModulo;
						}
						if (this.aRowHeights[iRow + i]) {
							if (this.aRowHeights[iRow + i] < iHeight) {
								this.aRowHeights[iRow + i] = iHeight;
							}
						} else {
							this.aRowHeights[iRow + i] = iHeight;
						}
						if (this.aCalculatedRowHeights[iRow + i] && !this.aTemporaryRowHeights[iRow + i]) {
							if (this.aRowHeights[iRow + i] < this.aCalculatedRowHeights[iRow + i]) {
								this.aRowHeights[iRow + i] = this.aCalculatedRowHeights[iRow + i];
							}
						}
						this.aLevelCells[iRow + i] = true;
					}
				} else {
					for (i = 0; i < oCellInfo.iRowSpan; i++) {
						if (this.aCalculatedRowHeights[iRow + i] && !this.aTemporaryRowHeights[iRow + i] && this.iMaxNumberOfLineBreaks === 0) {
							this.aRowHeights[iRow + i] = this.aCalculatedRowHeights[iRow + i];
						} else {
							if (i === oCellInfo.iRowSpan - 1) {
								iHeight += iModulo;
							}
							if (this.aRowHeights[iRow + i]) {
								if (this.aRowHeights[iRow + i] < iHeight) {
									this.aRowHeights[iRow + i] = iHeight;
								}
							} else {
								this.aRowHeights[iRow + i] = iHeight;
							}
							if (this.aCalculatedRowHeights[iRow + i] && !this.aTemporaryRowHeights[iRow + i]) {
								this.aRowHeights[iRow + i] = Math.max(this.aRowHeights[iRow + i], this.aCalculatedRowHeights[iRow + i]);
							}
						}
						this.aLevelCells[iRow + i] = false;
					}
				}
			}
		}
	}
	return this.aRowHeights;
};

sap.zen.crosstab.BaseArea.prototype.getLevelCells = function () {
	return this.aLevelCells;
};

sap.zen.crosstab.BaseArea.prototype.hasLoadingPages = function () {
	return this.iLoadingPageCnt > 0;
};

sap.zen.crosstab.BaseArea.prototype.getCalculatedColWidths = function () {
	return this.aCalculatedColWidths;
};

sap.zen.crosstab.BaseArea.prototype.getCalculatedRowHeights = function () {
	return this.aCalculatedRowHeights;
};

sap.zen.crosstab.BaseArea.prototype.addPageToTempArray = function (aArray, iIndex, sPageKey) {
	if (!aArray[iIndex]) {
		aArray[iIndex] = [];
	}
	aArray[iIndex].push(sPageKey);
};

sap.zen.crosstab.BaseArea.prototype.removePageFromTempArray = function (aArray, iIndex, sPageKey) {
	var aPageArray = aArray[iIndex];
	if (aPageArray) {
		for (var i = 0; i < aPageArray.length; i++) {
			if (aPageArray[i] === sPageKey) {
				aPageArray.splice(i, 1);
				break;
			}
		}
		if (aPageArray.length === 0) {
			aArray[iIndex] = null;
		}
	}
};

sap.zen.crosstab.BaseArea.prototype.changeColWidthTemporaryFlag = function (iCol, sPageKey, bIsTemporary) {
	// if there is already a measurement we don't need to flag as temporary because it must be valid
	if (!this.aCalculatedColWidths[iCol] && bIsTemporary) {
		this.addPageToTempArray(this.aTemporaryColWidths, iCol, sPageKey);
	} else if (!bIsTemporary && this.aTemporaryColWidths[iCol]) {
		this.removePageFromTempArray(this.aTemporaryColWidths, iCol, sPageKey);
		if (!this.aTemporaryColWidths[iCol]) {
			this.aCalculatedColWidths[iCol] = null;
		}
	}
};

sap.zen.crosstab.BaseArea.prototype.changeRowHeightTemporaryFlag = function (iRow, sPageKey, bIsTemporary) {
	if (!this.aCalculatedRowHeights[iRow] && bIsTemporary) {
		this.addPageToTempArray(this.aTemporaryRowHeights, iRow, sPageKey);
	} else if (!bIsTemporary && this.aTemporaryRowHeights[iRow]) {
		this.removePageFromTempArray(this.aTemporaryRowHeights, iRow, sPageKey);
		if (!this.aTemporaryRowHeights[iRow]) {
			this.aCalculatedRowHeights[iRow] = null;
		}
	}
};

sap.zen.crosstab.BaseArea.prototype.applyColWidthsToGranularityCells = function (aColWidths, bForceColWidth) {
	var iCol = 0;
	var oCellInfo = null;
	var i = 0;
	var iWidth = 0;
	var iCalculatedWidth = 0;

	for (iCol = this.iRenderStartCol; iCol < this.aColGranularity.length; iCol++) {
		oCellInfo = this.aColGranularity[iCol];
		if (oCellInfo) {
			iWidth = 0;
			for (i = 0; i < oCellInfo.iColSpan; i++) {
				iCalculatedWidth = aColWidths[iCol + i];
				iWidth += iCalculatedWidth;
				if (!this.aCalculatedColWidths[iCol + i] || bForceColWidth === true) {
					this.aCalculatedColWidths[iCol + i] = iCalculatedWidth;
				}
			}
			oCellInfo.iWidth = iWidth;
		}
	}
};

sap.zen.crosstab.BaseArea.prototype.applyRowHeightsToGranularityCells = function (aRowHeights, aLevelCells) {
	var iRow = 0;
	var oCellInfo = null;
	var i = 0;
	var iHeight = 0;
	var iCalculatedHeight = 0;
	var bIsNewHeightGreater = false;
	var bTriggerReRendering = false;

	for (iRow = this.iRenderStartRow; iRow < this.aRowGranularity.length; iRow++) {
		oCellInfo = this.aRowGranularity[iRow];
		if (oCellInfo) {
			iHeight = 0;
			for (i = 0; i < oCellInfo.iRowSpan; i++) {
				iCalculatedHeight = aRowHeights[iRow + i];
				iHeight += iCalculatedHeight;
				bIsNewHeightGreater = (this.aCalculatedRowHeights[iRow + i] && iCalculatedHeight > this.aCalculatedRowHeights[iRow + i]);
				if (!this.aCalculatedRowHeights[iRow + i] || (aLevelCells && aLevelCells[iRow + i]) || bIsNewHeightGreater === true) {
					if (bIsNewHeightGreater === true) {
						bTriggerReRendering = true;
					}
					this.aCalculatedRowHeights[iRow + i] = iCalculatedHeight;
				}
			}
			oCellInfo.iHeight = iHeight;
		}
	}
	return bTriggerReRendering;
};

sap.zen.crosstab.BaseArea.prototype.getColGranularity = function () {
	return this.aColGranularity;
};

sap.zen.crosstab.BaseArea.prototype.getRowGranularity = function () {
	return this.aRowGranularity;
};

sap.zen.crosstab.BaseArea.prototype.getCellDirect = function (iRow, iCol) {
	return this.oDataModel.getCellDirect(iRow, iCol);
};

sap.zen.crosstab.BaseArea.prototype.getCell = function (iRow, iCol) {
	return this.oDataModel.getCell(iRow, iCol);
};

sap.zen.crosstab.BaseArea.prototype.renderBaseArea = function (oRenderManager) {
	this.oCrosstab.getRenderEngine().renderArea(this, oRenderManager);
};

sap.zen.crosstab.BaseArea.prototype.setRowCnt = function (iRowCnt) {
	this.oDataModel.setRowCnt(iRowCnt);
};

sap.zen.crosstab.BaseArea.prototype.getRowCnt = function () {
	return this.oDataModel.getRowCnt();
};

sap.zen.crosstab.BaseArea.prototype.setColCnt = function (iColCnt) {
	this.oDataModel.setColCnt(iColCnt);
};

sap.zen.crosstab.BaseArea.prototype.getColCnt = function () {
	return this.oDataModel.getColCnt();
};

sap.zen.crosstab.BaseArea.prototype.clear = function (bKeepUserColWidths, bKeepCalculatedColWidths) {
	this.oDataModel.clear();
	this.iRenderStartRow = 0;
	this.iRenderRowCnt = 0;
	this.iRenderStartCol = 0;
	this.iRenderColCnt = 0;
	this.bHasContent = false;
	this.fRenderCellCallback = null;
	this.aColGranularity = [];
	this.aColWidths = [];

	this.aTemporaryColWidths = [];

	this.aRowGranularity = [];
	this.aRowHeights = [];

	this.aCalculatedRowHeights = [];
	this.aTemporaryRowHeights = [];

	this.iLoadingPageCnt = 0;

	this.aLevelCells = [];

	this.oColUserWidth = {};

	this.oColsWithSymbolException = {};

	if (!bKeepUserColWidths) {
		this.oUserResizedCols = {};
	}
	
	if (!bKeepCalculatedColWidths) {
		this.aCalculatedColWidths = [];
	}
	
	this.oCellsWithLineBreakTexts = null;
	this.iMaxNumberOfLineBreaks = 0;
};

sap.zen.crosstab.BaseArea.prototype.getDataModel = function () {
	return this.oDataModel;
};

sap.zen.crosstab.BaseArea.prototype.setDataModel = function (oDataModel) {
	this.oDataModel = oDataModel;
};

sap.zen.crosstab.BaseArea.prototype.getId = function () {
	return this.sId;
};

sap.zen.crosstab.BaseArea.prototype.setId = function (sId) {
	this.sId = sId;
};

sap.zen.crosstab.BaseArea.prototype.getAreaType = function () {
	return this.sAreaType;
};

sap.zen.crosstab.BaseArea.prototype.getAxisName = function () {
	if(this.sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_ROW_HEADER_AREA){
		return sap.zen.crosstab.rendering.RenderingConstants.ROW_AXIS;
	} else if(this.sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_COLUMN_HEADER_AREA){
		return sap.zen.crosstab.rendering.RenderingConstants.COL_AXIS;
	} else if(this.sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_AREA){
		return sap.zen.crosstab.rendering.RenderingConstants.DATA_AXIS;
	} else {
		return "";
	}
};

sap.zen.crosstab.BaseArea.prototype.getCrosstab = function () {
	return this.oCrosstab;
};

sap.zen.crosstab.BaseArea.prototype.getPageManager = function () {
	return this.oCrosstab.getPageManager();
};

sap.zen.crosstab.BaseArea.prototype.getCellWithColSpan = function (iRow, iCol, bDoNotLoadPage) {
	return this.oDataModel.getCellWithColSpan(iRow, iCol, bDoNotLoadPage);
};

sap.zen.crosstab.BaseArea.prototype.getCellWithRowSpan = function (iRow, iCol, bDoNotLoadPage) {
	return this.oDataModel.getCellWithRowSpan(iRow, iCol, bDoNotLoadPage);
};

sap.zen.crosstab.BaseArea.prototype.setRenderSize = function (iRenderStartRow, iRenderRowCnt, iRenderStartCol,
		iRenderColCnt) {
	var iMaxRowCnt = this.oDataModel.getRowCnt();
	var iMaxColCnt = this.oDataModel.getColCnt();
	var iCalculatedMax = 0;
	
	this.iRenderStartRow = iRenderStartRow;
	this.iRenderRowCnt = iRenderRowCnt;
	iCalculatedMax = this.iRenderStartRow + this.iRenderRowCnt;
	if (iCalculatedMax > iMaxRowCnt) {
		this.iRenderRowCnt = iMaxRowCnt - this.iRenderStartRow;
	}
	
	this.iRenderStartCol = iRenderStartCol;
	this.iRenderColCnt = iRenderColCnt;
	
	iCalculatedMax = this.iRenderStartCol + this.iRenderColCnt;
	if (iCalculatedMax > iMaxColCnt) {
		this.iRenderColCnt = iMaxColCnt - this.iRenderStartCol;
	}
};

sap.zen.crosstab.BaseArea.prototype.setRenderStartRow = function (iRow) {
	this.iRenderStartRow = iRow;
};

sap.zen.crosstab.BaseArea.prototype.setRenderRowCnt = function (iRowCnt) {
	this.iRenderRowCnt = iRowCnt;
};

sap.zen.crosstab.BaseArea.prototype.setRenderStartCol = function (iCol) {
	this.iRenderStartCol = iCol;
};

sap.zen.crosstab.BaseArea.prototype.setRenderColCnt = function (iColCnt) {
	this.iRenderColCnt = iColCnt;
};

sap.zen.crosstab.BaseArea.prototype.getRenderStartRow = function () {
	return this.iRenderStartRow;
};

sap.zen.crosstab.BaseArea.prototype.getRenderRowCnt = function () {
	return this.iRenderRowCnt;
};

sap.zen.crosstab.BaseArea.prototype.getRenderStartCol = function () {
	return this.iRenderStartCol;
};

sap.zen.crosstab.BaseArea.prototype.getRenderColCnt = function () {
	return this.iRenderColCnt;
};

sap.zen.crosstab.BaseArea.prototype.getRenderedCellsByCol = function (iCol) {
	return this.oDataModel.getCellsByCol(iCol, this.iRenderStartRow, this.iRenderRowCnt);
};

sap.zen.crosstab.BaseArea.prototype.getRenderedCellsByRow = function (iRow) {
	return this.oDataModel.getCellsByRow(iRow, this.iRenderStartCol, this.iRenderColCnt);
};

sap.zen.crosstab.BaseArea.prototype.resetColWidth = function (iCol) {
	this.aCalculatedColWidths[iCol] = 0;
};

sap.zen.crosstab.BaseArea.prototype.setColWidth = function(iCol, iWidth) {
	this.aCalculatedColWidths[iCol] = iWidth;
};

sap.zen.crosstab.BaseArea.prototype.getColWidth = function (iCol) {
	return this.aCalculatedColWidths[iCol];
};

sap.zen.crosstab.BaseArea.prototype.getColWidths = function () {
	return this.aCalculatedColWidths;
};

sap.zen.crosstab.BaseArea.prototype.setColWidths = function (aColWidths) {
	this.aCalculatedColWidths = aColWidths;
};

sap.zen.crosstab.BaseArea.prototype.determineUserColWidth = function (iCol) {
	var iColWidth = -1;
	if (!this.oUserResizedCols[iCol]) {
		var oWidthInfo = this.oColUserWidth[iCol];
		var oStarInfo = this.oColUserWidth['*'];

		if (oWidthInfo && !oWidthInfo.ignore) {
			iColWidth = oWidthInfo.width;
		} else {
			if (oStarInfo) {
				if (oWidthInfo) {
					if (!oWidthInfo.ignore) {
						iColWidth = oStarInfo.width;
					}
				} else {
					iColWidth = oStarInfo.width;
				}
			}
		}
	}
	return iColWidth;
};

sap.zen.crosstab.BaseArea.prototype.getFinalColWidth = function (iCol) {
	var iColWidth = 0;

	if (!this.hasLoadingPages()) {
		iColWidth = this.getColWidth(iCol);
	}

	var iUserColWidth = this.determineUserColWidth(iCol);
	if (iUserColWidth > -1) {
		iColWidth = iUserColWidth;
	}

	return iColWidth;
};

sap.zen.crosstab.BaseArea.prototype.getRowHeight = function (iRow) {
	return this.aCalculatedRowHeights[iRow];
};

sap.zen.crosstab.BaseArea.prototype.getFinalRowHeight = function (iRow) {
	var iRowHeight = 0;
	if (!this.hasLoadingPages()) {
		iRowHeight = this.getRowHeight(iRow);
	}
	return iRowHeight;
};

sap.zen.crosstab.BaseArea.prototype.hasContent = function () {
	return this.bHasContent;
};

sap.zen.crosstab.BaseArea.prototype.registerRenderCellCallback = function (fCallback) {
	this.fRenderCellCallback = fCallback;
};

sap.zen.crosstab.BaseArea.prototype.removeRenderCellCallback = function () {
	this.fRenderCellCallback = null;
};

sap.zen.crosstab.BaseArea.prototype.getRenderCellCallback = function () {
	return this.fRenderCellCallback;
};

sap.zen.crosstab.BaseArea.prototype.isDimHeaderArea = function () {
	return this.sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_DIMENSION_HEADER_AREA;
};

sap.zen.crosstab.BaseArea.prototype.isRowHeaderArea = function () {
	return this.sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_ROW_HEADER_AREA;
};

sap.zen.crosstab.BaseArea.prototype.isColHeaderArea = function () {
	return this.sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_COLUMN_HEADER_AREA;
};

sap.zen.crosstab.BaseArea.prototype.isDataArea = function () {
	return this.sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_AREA;
};

// static helper
sap.zen.crosstab.BaseArea.getArea = function (oCrosstab, sAreaType) {
	if (sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_DIMENSION_HEADER_AREA) {
		return oCrosstab.getDimensionHeaderArea();
	} else if (sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_ROW_HEADER_AREA) {
		return oCrosstab.getRowHeaderArea();
	} else if (sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_COLUMN_HEADER_AREA) {
		return oCrosstab.getColumnHeaderArea();
	} else if (sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_AREA) {
		return oCrosstab.getDataArea();
	} else {
		return null;
	}
};

sap.zen.crosstab.BaseArea.prototype.increaseLoadingPageCnt = function () {
	this.iLoadingPageCnt++;
};

sap.zen.crosstab.BaseArea.prototype.decreaseLoadingPageCnt = function () {
	if (this.iLoadingPageCnt > 0) {
		this.iLoadingPageCnt--;
	}
};

// Area rendering helpers
sap.zen.crosstab.BaseArea.prototype.getLoadingPageCnt = function () {
	return this.iLoadingPageCnt;
};

sap.zen.crosstab.BaseArea.prototype.openContainerCell = function (oRm, sClass) {
	oRm.write("<td");
	oRm.addStyle("border-spacing", "0px");
	oRm.addStyle("padding", "0px");
	oRm.addStyle("border-width", "0px");
	oRm.addStyle("margin", "0px");
	oRm.writeStyles();
	if (sClass) {
		oRm.writeAttribute("class", sClass);
	}
	oRm.write(">");
};

sap.zen.crosstab.BaseArea.prototype.closeContainerCell = function (oRm) {
	oRm.write("</td>");
};

sap.zen.crosstab.BaseArea.prototype.openContainerTable = function (oRm) {
	oRm.write("<table");
	oRm.writeAttribute("id", this.sId + "_container");
	oRm.addStyle("border-collapse", "collapse");
	oRm.addStyle("border-spacing", "0px");
	oRm.addStyle("padding", "0px");
	oRm.addStyle("border-width", "0px");
	oRm.addStyle("margin", "0px");
	oRm.writeStyles();
	oRm.write(">");
};

sap.zen.crosstab.BaseArea.prototype.closeContainerTable = function (oRm) {
	oRm.write("</table>");
};

sap.zen.crosstab.BaseArea.prototype.renderContainerStructure = function (oRm, sStyle, bVCutOff, bHCutOff) {
	this.openContainerTable(oRm);

	// first row
	oRm.write("<tr>");

	this.openContainerCell(oRm);

	oRm.write("<table");
	oRm.writeAttribute("id", this.sId);
	oRm.writeAttribute("class", sStyle);
	oRm.write(">");
	oRm.write("</table>");

	this.closeContainerCell(oRm);

	if (bHCutOff) {
		this.openContainerCell(oRm, "sapzencrosstab-HorizontalCutOff-" + this.getAreaType());

		oRm.write("<div");
		oRm.writeAttribute("class", "sapzencrosstab-HorizontalCutOffSpacer");
		oRm.write(">");
		oRm.write("</div>");

		this.closeContainerCell(oRm);
	}

	oRm.write("</tr>");

	if (bVCutOff) {
		// second row
		oRm.write("<tr>");

		this.openContainerCell(oRm, "sapzencrosstab-VerticalCutOff-" + this.getAreaType());
		oRm.write("<div");
		oRm.writeAttribute("class", "sapzencrosstab-VerticalCutOffSpacer");
		oRm.write(">");
		oRm.write("</div>");

		this.closeContainerCell(oRm);

		if (bHCutOff) {
			this.openContainerCell(oRm, "sapzencrosstab-CutOffCorner");
			this.closeContainerCell(oRm);
		}

		oRm.write("</tr>");
	}

	this.closeContainerTable(oRm);
};

sap.zen.crosstab.BaseArea.prototype.columnHasSymbolException = function (iCol) {
	this.oColsWithSymbolException[iCol] = null;
};

sap.zen.crosstab.BaseArea.prototype.setColUserWidth = function (iCol, iWidthInPx, bIgnore) {
	this.oColUserWidth[iCol] = {
		"width": iWidthInPx,
		"ignore": bIgnore
	};
};

sap.zen.crosstab.BaseArea.prototype.clearColUserWidth = function (iCol) {
	delete this.oColUserWidth[iCol];
};


sap.zen.crosstab.BaseArea.prototype.hasUserColWidths = function () {
	var bHasUserColWidths = this.oColUserWidth && sap.zen.crosstab.utils.Utils.hasEntries(this.oColUserWidth);
	return bHasUserColWidths;
};

sap.zen.crosstab.BaseArea.prototype.isFixedColWidthSet = function (iCol) {
	if (!this.hasUserColWidths() && !sap.zen.crosstab.utils.Utils.hasEntries(this.oUserResizedCols)) {
		return false;
	}
	if (this.oColUserWidth[iCol] !== undefined) {
		return true;
	}
	if (this.oUserResizedCols[iCol] !== undefined) {
		return true;
	}
	return false;
};

sap.zen.crosstab.BaseArea.prototype.setColGranularityCalculatedAndMeasured = function (bColCalculationAndMeasuringDone) {
	this.bColGranularityCalculatedAndMeasured = bColCalculationAndMeasuringDone;
};

sap.zen.crosstab.BaseArea.prototype.setUserResizedCol = function (iCol) {
	this.oUserResizedCols[iCol] = true;
};

sap.zen.crosstab.BaseArea.prototype.clearUserResizedCol = function (iCol) {
	delete this.oUserResizedCols[iCol];
};


sap.zen.crosstab.BaseArea.prototype.getCellsWithLineBreakTexts = function () {
	return this.oCellsWithLineBreakTexts;
};
