jQuery.sap.declare("sap.zen.crosstab.DataArea");
jQuery.sap.require("sap.zen.crosstab.BaseArea");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");

sap.zen.crosstab.DataArea = function (oCrosstab) {
	"use strict";
	sap.zen.crosstab.BaseArea.call(this, oCrosstab);
	this.sAreaType = sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_AREA;
};

sap.zen.crosstab.DataArea.prototype = jQuery.sap.newObject(sap.zen.crosstab.BaseArea.prototype);

sap.zen.crosstab.DataArea.prototype.renderArea = function (oRenderManager) {
	this.renderContainerStructure(oRenderManager, "sapzencrosstab-DataArea", this.oCrosstab.isVCutOff(), this.oCrosstab
			.isHCutOff());
};

sap.zen.crosstab.DataArea.prototype.insertCell = function (oCell, iRow, iCol) {
	sap.zen.crosstab.BaseArea.prototype.insertCell.call(this, oCell, iRow, iCol);
	if (iCol === this.oDataModel.getColCnt() - 1 && oCell) {
		oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_LAST_IN_ROW);
	}

	if (iRow === this.oDataModel.getRowCnt() - 1 && oCell) {
		oCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_LAST_IN_COL);
	}
};

sap.zen.crosstab.DataArea.prototype.getSelectedCellsByHeaderSelection = function (oHeaderCell, bRemoveSelection) {
	var oResultCells = {};
	var oArea = oHeaderCell.getArea();
	if (oArea.isRowHeaderArea()) {
		var iStartRow = oHeaderCell.getRow();
		var iEndRow = 0;
		var iStartCol = 0;
		var iColCnt = 0;
		
		if (!bRemoveSelection) {
			iEndRow = Math.min((iStartRow + oHeaderCell.getRowSpan()), (this.getRenderStartRow() + this.getRenderRowCnt()));		
			iStartCol = this.getRenderStartCol();
			iColCnt = this.getRenderColCnt();
		} else {
			iEndRow = iStartRow + oHeaderCell.getRowSpan();
		}

		for (var i = iStartRow; i < iEndRow; i++) {		
			var aCellsInRow =  this.oDataModel.getAllLoadedCellsByRow(this, i);
			for(var j = 0; j < aCellsInRow.length; j++) {
				oResultCells[aCellsInRow[j].getId()] = aCellsInRow[j];
			}
		}
	} else if (oArea.isColHeaderArea()) {
		var iStartCol = oHeaderCell.getCol();
		var iEndCol = 0;
		var iStartRow = 0;
		var iRowCnt = 0;
		
		if (!bRemoveSelection) {
			iEndCol = Math.min((iStartCol + oHeaderCell.getColSpan()), (this.getRenderStartCol() + this.getRenderColCnt()));
			iStartRow = this.getRenderStartRow();
			iRowCnt = this.getRenderRowCnt();	
		} else {
			iEndCol = iStartCol + oHeaderCell.getColSpan();
		}
		
		for (var i = iStartCol; i < iEndCol; i++) {	
			var aCellsInCol = this.oDataModel.getAllLoadedCellsByCol(this, i);
			for(var j = 0; j < aCellsInCol.length; j++){
				oResultCells[aCellsInCol[j].getId()] = aCellsInCol[j];
			}
		}
	}
	return oResultCells;
};
