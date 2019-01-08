jQuery.sap.declare("sap.zen.crosstab.ColumnHeaderArea");
jQuery.sap.require("sap.zen.crosstab.BaseArea");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");

sap.zen.crosstab.ColumnHeaderArea = function (oCrosstab) {
	"use strict";
	sap.zen.crosstab.BaseArea.call(this, oCrosstab);
	this.sAreaType = sap.zen.crosstab.rendering.RenderingConstants.TYPE_COLUMN_HEADER_AREA;
	this.iRenderStartCol = 0;
	this.iRenderColCnt = 0;
	this.bLastPageLoaded = false;
};

sap.zen.crosstab.ColumnHeaderArea.prototype = jQuery.sap.newObject(sap.zen.crosstab.BaseArea.prototype);

sap.zen.crosstab.ColumnHeaderArea.prototype.renderArea = function (oRenderManager) {
	this.renderContainerStructure(oRenderManager, "sapzencrosstab-ColumnHeaderArea", false, this.oCrosstab.isHCutOff());
};

sap.zen.crosstab.ColumnHeaderArea.prototype.getSelectedCellsBySelectionCoordinates = function (iRow, iCol) {
	var oClickedCell = this.oDataModel.getCellWithSpan(iRow, iCol);
	var oResultCells = {};
	if(oClickedCell){
		//Search all cells below the clicked cell
		oResultCells[oClickedCell.getId()] = oClickedCell;
		var iSpan = oClickedCell.getColSpan();
		var iStartRow = oClickedCell.getRow()+1;
		var iRowCnt = this.getRowCnt() - iStartRow;
		var iSearchCol = 0;
		var aCellsInCol = null;
		for(var i = 0; i<iSpan; i++){
			iSearchCol = oClickedCell.getCol()+i;
			aCellsInCol = this.oDataModel.getCellsByCol(iSearchCol, iStartRow, iRowCnt);
			for(var j = 0; j<aCellsInCol.length; j++){
				oResultCells[aCellsInCol[j].getId()] = aCellsInCol[j];
			}
		}
		return oResultCells;
	}
};

sap.zen.crosstab.ColumnHeaderArea.prototype.getSelectedCellsByDataSelection = function (oDataCell) {
	var oResultCells = {};
	var iStartRow = 0;
	var iEndRow = this.getRowCnt();
	var iCol = oDataCell.getCol();
	for(var iRow = iStartRow; iRow<iEndRow; iRow++){
		var oCell = this.oDataModel.getCellWithSpan(iRow, iCol);
		oResultCells[oCell.getId()] = oCell;
	}
	return oResultCells;
};
