jQuery.sap.declare("sap.zen.crosstab.dragdrop.DragDropHoverManager");

sap.zen.crosstab.dragdrop.DragDropHoverManager = function (oCrosstab) {
	"use strict"
	
	var that = this;
	var oDroppablesDisabledByArea = {};
	var oJqCurrentDropArea = null;
	var oDragDropUtils;
	var bMovedOutOfCrosstab = false;
	var oCurrentDropCell;
	
	this.init = function(p_oDragDropUtils) {
		oDragDropUtils = p_oDragDropUtils;
	};
			
	this.getCellFromId = function(sId) {
		var oCell = sap.ui.getCore().getControl(sId);
		return oCell;
	};
	
	this.getCellFromJqCell = function(oJqCell) {
		var sId = $(oJqCell).attr("id");
		return this.getCellFromId(sId);
	};
	
	this.findAllDroppableCells = function() {
		var aDroppables;
		var oJqFindArea;
		var oPayload;
		
		oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		if (!oPayload) {
			return [];
		}
		
		if (oPayload.oDragDropInfo.bIsMemberDrag) {
			oJqFindArea = oPayload.oDragDropInfo.sAxisName === "ROWS" ? oCrosstab.getRowHeaderAreaDiv() : oCrosstab.getColHeaderAreaDiv();
		} else {
			oJqFindArea = oCrosstab.getDimHeaderAreaDiv();
		}
		aDroppables = oJqFindArea.find("td .ui-droppable, .ui-droppable-disabled");
		return aDroppables;
	};
	
	this.getDropCell = function(e) {
		var aDroppables;
		var oClientRect;
		var oDropCell;
		
		aDroppables = this.findAllDroppableCells();
		$.each(aDroppables, function(iIndex, oDomCell) {
			oClientRect = oDomCell.getBoundingClientRect();
			if (e.clientX > oClientRect.left && e.clientX < oClientRect.right) {
				if (e.clientY > oClientRect.top && e.clientY < oClientRect.bottom) {
					oDropCell = that.getCellFromJqCell(oDomCell);
					return false;
				}
			}
		});

		return oDropCell;
	};
	
	this.getCellsForDimensionDrop = function(oDropCell) {
		var oDimInfo;
		var oPayload;
		var oDragDropInfo;
		var aCells = null;
		
		oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRowCol(oDropCell);
		oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		if (!oDragDropUtils.isExternalDropOnNonRemovableStructure(oDimInfo, oPayload)) {
    		oDragDropInfo = oPayload.oDragDropInfo;
    		// do not visualize drop on dragged cells
    		if (oDragDropInfo.sDimensionName !== oDimInfo.sDimensionName && !sap.zen.Dispatcher.instance.isDragDropCanceled() && !oDropCell.isRevertDrop()) {
	    		aCells = oCrosstab.getHeaderInfo().getCellsWithSameDimension(oDropCell);
    		}
    	}
		return aCells;
	};
	
	this.getCellsForMemberDrop = function(oDropCell) {
		var oDimInfo;
		var oDragDropInfo;
		var aCells;
		
		oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoForMemberCell(oDropCell);
		oDragDropInfo = sap.zen.Dispatcher.instance.getDragDropPayload().oDragDropInfo;
		
		if (oDragDropInfo.sDimensionName === oDimInfo.sDimensionName && !sap.zen.Dispatcher.instance.isDragDropCanceled() && !oDropCell.isRevertDrop()) {
			if (oCrosstab.getPropertyBag().isRepeatTexts()) {
				aCells = oDragDropUtils.getAllMemberCellsInRowOrCol(oDropCell);
			} else {
				aCells = oCrosstab.getHeaderInfo().getMemberCellsForSameDimension(oDropCell);
			}
		}
		return aCells;
	};
	
	this.provideDropCellHoverEffect = function(oDropCell) {
		var aCells;
		var i;
    	var oCell;
    	var oJqCell;
    	var oDimInfo;
    	var oDragDropInfo;
    	var oPayload;
    	var sCssClassName;
    	
		oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		if (!oPayload) {
			return;
		}
		    	
    	if (oDropCell) {
    		if (!oPayload.oDragDropInfo.bIsMemberDrag) {
    			aCells = this.getCellsForDimensionDrop(oDropCell);
	    	} else {
	    		aCells = this.getCellsForMemberDrop(oDropCell);
	    	}
    		
    		sCssClassName = this.getDropCellClassName();
    		if (aCells) {
    			for (i = 0; i < aCells.length; i++) {
    				oCell = aCells[i];
    				oJqCell = $(document.getElementById(oCell.getId()));
    				oJqCell.addClass(sCssClassName);
    				if (oJqCell.hasClass("sapzencrosstab-HeaderCellAlternating")) {
    					oJqCell.removeClass("sapzencrosstab-HeaderCellAlternating");
    					oJqCell.data("bAlternating", true);
    				}
    				oJqCell.removeClass("sapzencrosstab-HeaderCellAlternating");
    			} 
    		}
    	}
	};
	
	this.cleanupDropCells = function() {
		var sCssClassName = that.getDropCellClassName();
		var oJqCell;
		
		var aMarkedDropCells = oCrosstab.getRenderSizeDiv().find("." + sCssClassName);
		$.each(aMarkedDropCells, function(index, oDomCell) {
			oJqCell = $(oDomCell);
			oJqCell.removeClass(sCssClassName);
			if (oJqCell.data("bAlternating") === true) {
				oJqCell.addClass("sapzencrosstab-HeaderCellAlternating");
			}
		});
	};
	
	this.getDropCellClassName = function() {
		var oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		if (!oPayload) {
			return null;
		}
		
		if (oPayload.oDragDropInfo.bIsMemberDrag) {
			return "sapzencrosstab-DropMemberCell";
		} else {
			return "sapzencrosstab-DropHeaderCell";
		}
	};
	
	this.doOnDropCellOver = function(oCell, e) {
		var oJqCell;
		
    	if (!oJqCurrentDropArea) {
	    	oJqCell = $(document.getElementById(oCell.getId())); 
	    	if (oDragDropUtils.checkMouseInRenderSizeDiv(e)) {
		    	if (!oJqCell.hasClass(that.getDropCellClassName())) {
		    		that.cleanupDropCells();
		    		that.provideDropCellHoverEffect(oCell);
		    	}
	    	} else {
	    		oJqCell.droppable().trigger("mouseout");
	    	}
    	}
	};
	
	this.onDropCellOver = function(e, ui) {
		oCurrentDropCell = that.getCellFromId(e.target.id);
		oCurrentDropCell = oDragDropUtils.getEffectiveCell(oCurrentDropCell);
		that.doOnDropCellOver(oCurrentDropCell, e);
	};
	
	this.doOnDropCellOut = function(oCell) {
		var oJqCell;
		
		if (!oJqCurrentDropArea) {		
			that.cleanupDropCells();	
			if (oCell) {
				oJqCell = $(document.getElementById(oCell.getId()));
				if (!oJqCell.hasClass(that.getDropCellClassName())) { 
					that.provideDropCellHoverEffect(oCell);
				}
			}
		}
	};
	
	this.onDropCellOut = function(e, ui) {	
		var oCell = that.getDropCell(e);
		oCell = oDragDropUtils.getEffectiveCell(oCell);
		that.doOnDropCellOut(oCell);
	};
	
	this.disableDropCell = function(oCell) {
		var oJqCell;
		
		if (!oDroppablesDisabledByArea[oCell.getId()]) {
			oJqCell = $(document.getElementById(oCell.getId()));
			if (oJqCell.hasClass("ui-droppable")) {
				oJqCell.droppable("disable");
				oJqCell.removeClass(this.getDropCellClassName());
				oDroppablesDisabledByArea[oCell.getId()] = oJqCell;
			}
		}
	};
	
	this.getDisableDimHeaderDropCellsForArea = function(sDragAreaType, oAnchorCell) {
		var iCol;
		var iRow;
		var iMaxDimHeaderRow = oCrosstab.getTableMaxDimHeaderRow();
		var iMaxDimHeaderCol = oCrosstab.getTableMaxDimHeaderCol();
		var i;
		var oCell;
		var aCells;
		
		aCells = oCrosstab.getHeaderInfo().getCellsWithSameDimension(oAnchorCell);
		
		if (!aCells) {
			return [];
		}
		
		if (sDragAreaType === "droparea_above" || sDragAreaType === "droparea_below") {
			iRow = oAnchorCell.getTableRow();
			i = 0;
			while (i <= iMaxDimHeaderCol) {
				oCell = oCrosstab.getTableCellWithColSpan(iRow, i);
				if (oCell) {
					i = i + oCell.getColSpan();
					aCells.push(oCell);
				} else {
					i++;
				}
			}
		} else if (sDragAreaType === "droparea_before" || sDragAreaType === "droparea_after") { 
			iCol = oAnchorCell.getTableCol();
			i = 0;
			while (i <= iMaxDimHeaderRow) {
				oCell = oCrosstab.getTableCellWithRowSpan(i, iCol);
				if (oCell) {
					i = i + oCell.getRowSpan();
					aCells.push(oCell);
				} else {
					i++;
				}
			}
		}
		return aCells;
	};
	
	this.getDisableMemberDropCellsForArea = function(sDragAreaType, oAnchorCell) {
		var aCells;
		var oRowHeaderArea;
		var oColHeaderArea;
		var iStartRow;
		var iEndRow;
		var iStartCol;
		var iEndCol;
		var iRow;
		var iCol;
		var oCell;
		
		aCells = oCrosstab.getHeaderInfo().getMemberCellsForSameDimension(oAnchorCell);
		
		if ((sDragAreaType === "droparea_above" || sDragAreaType === "droparea_below") && oCrosstab.hasRowHeaderArea()) {
			oRowHeaderArea = oCrosstab.getRowHeaderArea();
			iRow = Math.max(oAnchorCell.getRow(), oRowHeaderArea.getRenderStartRow());
			iStartCol = oRowHeaderArea.getRenderStartCol();
			iEndCol = iStartCol + oRowHeaderArea.getRenderColCnt() - 1;
			
			iCol = iStartCol;
			while (iCol <= iEndCol) {
				oCell = oRowHeaderArea.getCellWithRowSpan(iRow, iCol);
				if (oCell) {
					if (sDragAreaType === "droparea_below") {
						if (oAnchorCell.getRow() === (oCell.getRow() + oCell.getRowSpan() - 1)) {
							aCells.push(oCell);
						} 
					} else {
						if (oAnchorCell.getRow() === oCell.getRow()) {
							aCells.push(oCell);
						}
					}
					iCol = iCol + oCell.getColSpan();
				} else {
					iCol++;
				}
			}	
		} else if ((sDragAreaType === "droparea_before" || sDragAreaType === "droparea_after") && oCrosstab.hasColHeaderArea()) {
			oColHeaderArea = oCrosstab.getColumnHeaderArea();
			iCol = Math.max(oAnchorCell.getCol(), oColHeaderArea.getRenderStartCol());
			iStartRow = oColHeaderArea.getRenderStartRow();
			iEndRow = iStartRow + oColHeaderArea.getRenderRowCnt() - 1;
			
			iRow = iStartRow;
			while (iRow <= iEndRow) {
				oCell = oColHeaderArea.getCellWithColSpan(iRow, iCol);
				if (oCell) {
					if (sDragAreaType === "droparea_after") {
						if (oAnchorCell.getCol() === (oCell.getCol() + oCell.getColSpan() - 1)) {
							aCells.push(oCell);
						}
					} else {
						if (oAnchorCell.getCol() === oCell.getCol()) {
							aCells.push(oCell);
						}
					}
					iRow = iRow + oCell.getRowSpan();
				} else {
					iRow++;
				}
			}	
		}
		return aCells;
	};
		
	this.disableDropCellsForArea = function(sDragAreaType, oAnchorCell) {
		var aCells;
		var oCell;
		var i;
		var oPayload;
		
		oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		if (!oPayload) {
			return;
		}
		
		if (oPayload.oDragDropInfo.bIsMemberDrag) {
			aCells = this.getDisableMemberDropCellsForArea(sDragAreaType, oAnchorCell);
		} else {
			aCells = this.getDisableDimHeaderDropCellsForArea(sDragAreaType, oAnchorCell);
		}
		
		for (i = 0; i < aCells.length; i++) {
			oCell = aCells[i];
			this.disableDropCell(oCell);
		}
	};
	
	this.cleanupDropAreas = function() {
		if (oJqCurrentDropArea) {
			$.each(oDroppablesDisabledByArea, function(sId, oDroppable) {
				if (oDroppable.hasClass("ui-droppable-disabled")) {
					oDroppable.droppable("enable");
				}
			});
			oDroppablesDisabledByArea = {};
			oJqCurrentDropArea = null;
		}
	};
	
	this.onDropAreaOver = function(e, ui) {
		var sCellId;
		var oCell;
		var sDragAreaType;
				
		that.cleanupDropAreas();
		oJqCurrentDropArea = $(document.getElementById(e.target.id));
		
		if (!oDragDropUtils.isOnlyMeasuresMode()) {
			that.cleanupDropCells();
			sCellId = oJqCurrentDropArea.data("xtabcellid");
			sDragAreaType = oDragDropUtils.getDropAreaTypeFromDropAreaId(e.target.id);
			oCell = sap.ui.getCore().getControl(sCellId);
			that.disableDropCellsForArea(sDragAreaType, oCell);
		}
	};
	
	this.onDropAreaOut = function(e, ui) {
		var oDropCell;
		
		if (!oDragDropUtils.isOnlyMeasuresMode()) {
			that.cleanupDropCells();
		}
		
		if (oJqCurrentDropArea) {
			$.each(oDroppablesDisabledByArea, function(sId, oDroppable) {
				if (oDroppable.hasClass("ui-droppable-disabled")) {
					oDroppable.droppable("enable");
				}
			});
			
			if (!oDragDropUtils.isOnlyMeasuresMode()) {
				oDropCell = that.getDropCell(e);
				if (oDropCell) {
					that.provideDropCellHoverEffect(oDropCell);
				}
			}
			
			oDroppablesDisabledByArea = {};
			oJqCurrentDropArea = null;
		}
	};
	
	this.getCurrentDropArea = function() {
		return oJqCurrentDropArea;
	};
	
	this.provideDraggableCellCursor = function(oJqCell) {
		// Provide visualization for draggable
		oJqCell.mouseenter(function() {
			$(this).css("cursor", "move");
			$(this).find("div").not(".sapzencrosstab-HeaderCellDivSortable, .sapzencrosstab-columnResizeHandle, .sapzencrosstab-columnResizeHandleWithSort, .sapzencrosstab-HeaderCellDivHierarchy").css("cursor", "move");
		});
		
		oJqCell.mouseleave(function() {
			$(this).css("cursor", "default");
			$(this).find("div").not(".sapzencrosstab-HeaderCellDivSortable, .sapzencrosstab-columnResizeHandle, .sapzencrosstab-columnResizeHandleWithSort, .sapzencrosstab-HeaderCellDivHierarchy").css("cursor", "default");
		});
		
		oJqCell.draggable("option", "drag", function(e, ui) {
			var bIsWithinCrosstab = oDragDropUtils.checkMouseInRenderSizeDiv(e);
			var aAlternatingElements;
			var oCell;
			
			oDragDropUtils.setCurrentDragHelper($(ui.helper));
					
			if (!bIsWithinCrosstab) {
				aAlternatingElements = ui.helper.find(".sapzencrosstab-HeaderCellAlternating");
				jQuery.each(aAlternatingElements, function(iIndex, oDomElement) {
					if (oDomElement) {
						$(oDomElement).removeClass("sapzencrosstab-HeaderCellAlternating");
						$(oDomElement).addClass("sapzencrosstab-AlternatingDummy");
					}
				});
				// ui.helper.addClass("ui-icon ui-icon-trash");
				$(ui.helper).find(".sapzencrosstab-Trashcan").show();
				if (!bMovedOutOfCrosstab) {
					that.cleanupDropCells();
					bMovedOutOfCrosstab = true;
				}
			} else {
				// ui.helper.removeClass("ui-icon ui-icon-trash");
				$(ui.helper).find(".sapzencrosstab-Trashcan").hide();
				aAlternatingElements = ui.helper.find(".sapzencrosstab-AlternatingDummy");
				jQuery.each(aAlternatingElements, function(iIndex, oDomElement) {
					if (oDomElement) {
						$(oDomElement).addClass("sapzencrosstab-HeaderCellAlternating");
						$(oDomElement).removeClass("sapzencrosstab-AlternatingDummy");
					}
				});
				if (bMovedOutOfCrosstab) {
					if (oCurrentDropCell) {
						oCell = oDragDropUtils.findCell($(e.toElement));
						if (oCell && oCell.getId() === oCurrentDropCell.getId()) {
							that.doOnDropCellOver(oCurrentDropCell, e);
						}
					}
					bMovedOutOfCrosstab = false;
				}
			}
		});
	};
};