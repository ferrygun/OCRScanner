jQuery.sap.declare("sap.zen.crosstab.CrosstabContextMenu");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");

sap.zen.crosstab.CrosstabContextMenu = function (oCrosstab) {

	this.getContextMenuAction = function (sContextMenuComponentId, oDomClickedElement) {
		var oCore = sap.ui.getCore();
		var oElement = oDomClickedElement;
		while (!oCore.byId(oElement.attr("id"))) {
			oElement = oElement.parent();
		}

		if (oElement.attr("id") === oCrosstab.getId()) {
			return null;
		}

		var oCell = oCore.byId(oElement.attr("id"));
		var sCellType = null;
		if (oCell.getCellType) {
			sCellType = oCell.getCellType();
		} else {
			return null;
		}
		
		var bRemoveSelection = false;
		var sCssClass = null;
		if (oCrosstab.isSelectable() === true) {
			var oSelectionHandler = oCrosstab.getSelectionHandler();
			if (oSelectionHandler && oSelectionHandler.hasSelection() === true) {
				if (oCell.getArea().isDataArea() === true) {
					sCssClass = 'sapzencrosstab-DataCellSelectData'
				} else if (oCell.getArea().isRowHeaderArea() === true) {
					sCssClass = 'sapzencrosstab-HeaderCellSelectRow';
				} else if (oCell.getArea().isColHeaderArea() === true) {
					sCssClass = 'sapzencrosstab-HeaderCellSelectCol';
				}
				bRemoveSelection = !($(oElement).hasClass(sCssClass));
			}
		}

		var sAreaType = oCell.getArea().getAreaType();
		var sAxis = "";
		if (sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_COLUMN_HEADER_AREA) {
			sAxis = "COLS";
		} else if (sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_ROW_HEADER_AREA) {
			sAxis = "ROWS";
		} else if (sAreaType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_DIMENSION_HEADER_AREA) {
			var oDimInfo;
			if (oCell.isSplitPivotCell()) {
				var oDimInfo1 = oCrosstab.getHeaderInfo().getDimensionInfoByRowCol(oCell, "ROWS");
				var oDimInfo2 = oCrosstab.getHeaderInfo().getDimensionInfoByRowCol(oCell, "COLS");
				// dimension takes precedence over measure structure. If it is a "real" split cell with
				// two dimensions leave oDimInfo === null => no context menu on split cell
				if (oDimInfo1 && oDimInfo1.bIsMeasureStructure) {
					oDimInfo = oDimInfo2;
				} else if (oDimInfo2 && oDimInfo2.bIsMeasureStructure) {
					oDimInfo = oDimInfo1;
				}
			} else {
				oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRowCol(oCell);
			}
			if (!oDimInfo) {
				return null;
			}
			sAxis = oDimInfo.sAxisName;
		} else if (sCellType === sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_CELL) {
			sAxis = "DATA";
		} else {
			return null;
		}

		var iRow = oCell.getTableRow();
		var iCol = oCell.getTableCol();

		var sContextMenuCommand = oCrosstab.getPropertyBag().getContextMenuCommand();

		sContextMenuCommand = sContextMenuCommand.replace("__AXIS__", sAxis);
		sContextMenuCommand = sContextMenuCommand.replace("__ROW__", iRow);
		sContextMenuCommand = sContextMenuCommand.replace("__COL__", iCol);
		sContextMenuCommand = sContextMenuCommand.replace("__ID__", sContextMenuComponentId);
		sContextMenuCommand = sContextMenuCommand.replace("__DOM_REF_ID__", oDomClickedElement.attr("id"));
		
		if (sContextMenuCommand.indexOf("__REMOVE_SELECTION__") >= 0) {
			sContextMenuCommand = sContextMenuCommand.replace("__REMOVE_SELECTION__", bRemoveSelection);
		}
		
		var execFunction = function() {
			oCrosstab.getUtils().executeCommandAction(sContextMenuCommand);
		};
		
		oCrosstab.enableClick();

		return execFunction;
	};

};
