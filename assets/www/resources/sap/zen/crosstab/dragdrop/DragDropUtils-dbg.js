jQuery.sap.declare("sap.zen.crosstab.dragdrop.DragDropUtils");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

sap.zen.crosstab.dragdrop.DragDropUtils = function (oCrosstab) {
	"use strict"
	
	var oHeaderInfo = oCrosstab.getHeaderInfo();
	var oCurrentJqDragCell;
	var oDragDropHoverManager;
	var oJqCurrentDragHelper;
	var that = this;
	var bOnlyMeasuresMode = false;
	
	this.init = function(p_oDragDropHoverManager) {
		oDragDropHoverManager = p_oDragDropHoverManager;
	}
	
	this.setOnlyMeasuresMode = function(pbOnlyMeasuresMode) {
		bOnlyMeasuresMode = pbOnlyMeasuresMode;
	};
	
	this.isOnlyMeasuresMode = function() {
		return bOnlyMeasuresMode;
	};
	
	this.getDimensionNameDromDragDropPayload = function() {
		var oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		var sDimensionName = null;
		var oDragDropInfo = null;
		
		if (oPayload) {
			oDragDropInfo = oPayload.oDragDropInfo;
			if (oDragDropInfo) {
				sDimensionName = oDragDropInfo.sDimensionName;
			}
		}
		return sDimensionName;
	};
	
	this.getAreaInfo = function(oJqArea, sAxisName) {
		var oAreaInfo = {};
		var sCellId;
		
		sCellId = oJqArea.data("xtabcellid");
		oAreaInfo.oJqCell = $(document.getElementById(sCellId));
		oAreaInfo.oCell = sap.ui.getCore().getControl(oAreaInfo.oJqCell.attr("id"));
		oAreaInfo.oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRowCol(oAreaInfo.oCell, sAxisName);	
		return oAreaInfo;
	};
	
	this.getCellInfoFromDropArea = function(e, sDropAreaSuffix) {
		var oDimInfo;
		var oCellInfo;
		var oCell;
		var sDragDimensionName;
		var iCol = -1;
		var iRow = -1;
		var sSplitCellAxisName;
		var oAreaInfo;
		var oJqDropArea;
		
		if (sDropAreaSuffix === "droparea_above" || sDropAreaSuffix === "droparea_below") {
			sSplitCellAxisName = "COLS";
		} else if (sDropAreaSuffix === "droparea_before" || sDropAreaSuffix === "droparea_after") {
			sSplitCellAxisName = "ROWS";
		}
		
		oJqDropArea = $(document.getElementById(e.target.id));
		oAreaInfo = this.getAreaInfo(oJqDropArea, sSplitCellAxisName);
		oDimInfo = oAreaInfo.oDimInfo;
		oCell = oAreaInfo.oCell;
		
		sDragDimensionName = this.getDimensionNameDromDragDropPayload();
		
		if (oCell && sDragDimensionName && oDimInfo) {
			iRow = oCell.getTableRow();
			iCol = oCell.getTableCol();
			oCellInfo = {};
			oCellInfo.sDropDimensionName = oDimInfo.sDimensionName;
			oCellInfo.oDropCell = oCell;
			oCellInfo.iDropCellTableRow = iRow;
			oCellInfo.iDropCellTableCol = iCol;
			oCellInfo.bDropCellIsBottomRight = (iRow === oCrosstab.getTableMaxDimHeaderRow() && iCol === oCrosstab.getTableMaxDimHeaderCol());
			oCellInfo.sDragDimensionName = sDragDimensionName;
			oCellInfo.sDropAxisName = oDimInfo.sAxisName;
			
			if (oCellInfo.sDropAxisName === "ROWS") {
				oCellInfo.iDropAxisIndex = oHeaderInfo.getAbsoluteColIndexForDimension(oCellInfo.sDropDimensionName);
			} else if (oCellInfo.sDropAxisName === "COLS") {
				oCellInfo.iDropAxisIndex = oHeaderInfo.getAbsoluteRowIndexForDimension(oCellInfo.sDropDimensionName);
			} 
		}
		return oCellInfo;
	};
		
	this.isExternalDropOnNonRemovableStructure = function(oDimInfo, oPayload) {
		var bResult = false;
		if (this.isInterComponentDrag(oPayload)) {
			return oDimInfo.bIsStructure && !oDimInfo.bIsRemoveStructureAllowed;
		} 
		return bResult;
	};
	
	this.isInterComponentDrag = function(oPayload) {
		return (oPayload.sComponentId !== oCrosstab.getId());
	};
	
	this.checkAcceptCrossComponent = function(oPayload) {
		if (!sap.zen.Dispatcher.instance.isInterComponentDragDropEnabled()) {
			if (this.isInterComponentDrag(oPayload)) {
				return false;
			}
		}
		return true;
	};
		
	this.isDragFromOtherCrosstab = function(oPayload) {
		var isXCrosstabDrag;
		var oDragSource;
		
		oDragSource = sap.zen.Dispatcher.instance.getControlForId(oPayload.sComponentId);
		isXCrosstabDrag = (oDragSource.zenControlType && oDragSource.zenControlType === "xtable") && oPayload.sComponentId !== oCrosstab.getId();

		return isXCrosstabDrag;
	};
	
	this.getCrosstabHeaderCellFromDraggable = function(oDraggable) {	
		var oCell = sap.ui.getCore().byId(oDraggable.attr("id"));
		if (oCell) {
			if (oCell.isHeaderCell && oCell.isHeaderCell()) {
				return oCell;
			}
		}
		
		return null;
	};
	
	this.getAxisNameFromAreaType = function(sAreaType) {
		if (sAreaType === "droparea_above" || sAreaType === "droparea_below") {
			return "COLS";
		} 
		return "ROWS";
	};
		
	this.checkDropAreaAccept = function(oDraggable, oDropCell, oPayload, sAreaType) {
		var oDraggedCell;
		var iDropCellRow = -1;
		var iDropCellCol = -1;
		var iLookAheadIndex = -1;
		var iMaxDimHeaderRow = oCrosstab.getTableMaxDimHeaderRow();
		var iMaxDimHeaderCol = oCrosstab.getTableMaxDimHeaderCol();
		var oLookAheadDimInfo = null;
		var sDraggedDimensionName;
		var sDraggedDimensionAxisName;
		var oDroppedDimInfo;
		var sAxisName;
		var bIsBeginArea;
		
		if (this.isDragFromOtherCrosstab(oPayload) === true) {
			return false;
		}
		
		sAxisName = this.getAxisNameFromAreaType(sAreaType);
			
		iDropCellRow = oDropCell.getTableRow();
		iDropCellCol = oDropCell.getTableCol();
		oDroppedDimInfo = oHeaderInfo.getDimensionInfoByRowCol(oDropCell, sAxisName);
		
		sDraggedDimensionAxisName = oPayload.oDragDropInfo.sAxisName;
		if (!sDraggedDimensionAxisName || sDraggedDimensionAxisName && sDraggedDimensionAxisName.length === 0) {
			// in case of drop from outside of Crosstab (NAV PANEL, no axis may be provided)
			sDraggedDimensionAxisName = sAxisName;
		}
		
		if (oPayload.sComponentId === oCrosstab.getId()) {
			// identical cell?
			oDraggedCell = this.getCrosstabHeaderCellFromDraggable(oDraggable);
			if (oDraggedCell.getId() === oDropCell.getId()) {
				if (sDraggedDimensionAxisName !== oDroppedDimInfo.sAxisName) {
					return true;
				}
			}
		}
					
		if (oDroppedDimInfo) {						
			sDraggedDimensionName = oPayload.oDragDropInfo.sDimensionName;
			if (sDraggedDimensionName === oDroppedDimInfo.sDimensionName) {
				return false;						
			}
					
			var bIsBeginArea = (sAreaType === "droparea_above" || sAreaType === "droparea_before");
			// not dragging just ahead or above of the same cell		
			if (!bIsBeginArea && sDraggedDimensionAxisName === oDroppedDimInfo.sAxisName) {
				if (oDroppedDimInfo.sAxisName == "ROWS") {
					iLookAheadIndex = iDropCellCol + oDropCell.getColSpan();
					if (iLookAheadIndex <= iMaxDimHeaderCol) {
						oLookAheadDimInfo = oHeaderInfo.getDimensionInfoByCol(iLookAheadIndex);
					}
				} else if (oDroppedDimInfo.sAxisName === "COLS") {
					iLookAheadIndex = iDropCellRow + oDropCell.getRowSpan();
					if (iLookAheadIndex <= iMaxDimHeaderRow) {
						oLookAheadDimInfo = oHeaderInfo.getDimensionInfoByRow(iLookAheadIndex);
					}
				}
				if (oLookAheadDimInfo) {
					if (oLookAheadDimInfo.sDimensionName === sDraggedDimensionName) {
						return false;
					}
				}
			}
		} else {
			return false;
		}

		return true;
	};
	
	this.returnFromGenericDimMoveToAreasCheck = function(oJqArea, bAccept) {
		oJqArea.data("xtabrevertdrop", !bAccept);
		sap.zen.Dispatcher.instance.setDropAccepted(oJqArea.attr("id"), bAccept);
		return bAccept;
	};
	
	this.checkAcceptExternalDimension = function(oPayload) {	
		if (this.isInterComponentDrag(oPayload)) {
			if (oCrosstab.getHeaderInfo().isDimensionInCrosstab(oPayload.oDragDropInfo.sDimensionName)) {
				return false;
			}
		}
		
		return true;
	};
		
	this.checkGenericDimMoveToAreasAccept = function(oJqArea, oDraggable, oDimInfo, oCell, sAreaType, bCheckValidHeaderRect) {	
		var oPayload;
		var oDragDropInfo;	
		var oJqCurrentDropArea = oDragDropHoverManager.getCurrentDropArea();
		
		oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		
		if (oCrosstab.isBlocked() || !oPayload || oPayload && oPayload.oDragDropInfo.bIsMemberDrag) {
			return this.returnFromGenericDimMoveToAreasCheck(oJqArea, false);
		}
		
		// do not accept dimensions dropped from external if the dimension is already in the Crosstab drilldown
		if (!this.checkAcceptExternalDimension(oPayload)) {
			return this.returnFromGenericDimMoveToAreasCheck(oJqArea, false);
		}
				
		// do not accept any handle that is outside the header area. This only applies to
		// vertical drop areas
		if (bCheckValidHeaderRect) {
			if (!this.checkDroppableInArea(oJqArea, this.determineValidHeaderRect())) {
				return this.returnFromGenericDimMoveToAreasCheck(oJqArea, false);
			}
		}
		
		// only accept first drop handle. Crossing area drop handles may occur vertically/horizontally!
		if (oJqCurrentDropArea) {
			if (oJqArea.attr("id") !== oJqCurrentDropArea.attr("id")) {
				return this.returnFromGenericDimMoveToAreasCheck(oJqArea, false);
			}
		}

		if (this.isInterComponentDrag(oPayload)) {
			if (!this.checkAcceptCrossComponent(oPayload)) {
				return this.returnFromGenericDimMoveToAreasCheck(oJqArea, false);
			}
		}
		if (!bOnlyMeasuresMode) {
			if (!this.checkDropAreaAccept(oDraggable, oCell, oPayload, sAreaType)) {
				return this.returnFromGenericDimMoveToAreasCheck(oJqArea, false);
			}
		}
		
		return this.returnFromGenericDimMoveToAreasCheck(oJqArea, true);
	};
			
	this.checkMouseInRenderSizeDiv = function(e) {
		var bMouseInDiv = false;
		var oRenderSizeDivRect;
		
		oRenderSizeDivRect = oCrosstab.getRenderSizeDiv()[0].getBoundingClientRect();
		bMouseInDiv = (e.clientX > oRenderSizeDivRect.left) && (e.clientX < oRenderSizeDivRect.right);
		bMouseInDiv = bMouseInDiv && (e.clientY > oRenderSizeDivRect.top && e.clientY < oRenderSizeDivRect.bottom);
		
		return bMouseInDiv;
	};
	
	// Dealing with header scrolling and hence potentially partly invisible header
	
	this.determineValidHeaderRect = function() {
		var oJqValidArea;
		var oValidRect;
		
		oJqValidArea = oCrosstab.getDimHeaderAreaDiv();
		if (oJqValidArea.length === 0) {
			oJqValidArea = oCrosstab.getRowHeaderAreaDiv();
		}
		oValidRect = this.getBoundingClientRect(oJqValidArea[0]);
		return oValidRect;
	};
		
	this.checkDroppableInArea = function(oJqDroppable, oValidRect) {
		var oRect;
		
		if (!oCrosstab.isHeaderHScrolling()) {
			return true;
		}

		oRect = oJqDroppable[0].getBoundingClientRect();
		
		if ((oRect.right > oValidRect.left && oRect.right < oValidRect.right) || 
				(oRect.left < oValidRect.right && oRect.right > oValidRect.right || 
						(oRect.left > oValidRect.left && oRect.right < oValidRect.right))) {
			return true;
		} 
		return false;
	};
		
	this.setCurrentJqDragCell = function(oJqDragCell) {
		oCurrentJqDragCell = oJqDragCell;
	};
	
	this.getCurrentJqDragCell = function() {
		return oCurrentJqDragCell;
	};
	
	this.checkDragRevert = function(oDroppable) {
		var oCell;
		var sId;
		var bRevertDrop;
		var oRevertPosInfo;
		var oPos;
		var oRect;
		
		oRevertPosInfo = $(this).data("oRevertPosInfo"); 
		if (oRevertPosInfo) {
			oPos = that.getRevertPosition(oRevertPosInfo);
			$(this).data("uiDraggable").originalPosition = oPos;
		}

		if (!sap.zen.Dispatcher.instance.isDragDropCanceled()) {
			sId = $(oDroppable).data("xtabcellid");
			if (sId && sId.length > 0) {
				bRevertDrop = $(oDroppable).data("xtabrevertdrop");
				return bRevertDrop;
			} else {
				sId = $(oDroppable).attr("id");
				oCell = sap.ui.getCore().getControl(sId);
				if (oCell && oCell.isRevertDrop) {
					return oCell.isRevertDrop();
				}
				return false;
			}
		}
		return true;
	};

	this.resetDragDrop = function() {
		sap.zen.Dispatcher.instance.setDragDropCanceled(false);
		oCrosstab.setDragAction(false);
		oJqCurrentDragHelper = null;
	};
	
	this.buildDimensionDragDropInfo = function(oDimInfo) {
		var oDragDropInfo = {};
		
		if (oDimInfo.sDimensionName && oDimInfo.sDimensionName.length > 0) {
			oDragDropInfo.sDimensionName = oDimInfo.sDimensionName;
		}
		if (oDimInfo.sAttributeName && oDimInfo.sAttributeName.length > 0) {
			oDragDropInfo.sAttributeName = oDimInfo.sAttributeName;
		}
		if (oDimInfo.sAxisName && oDimInfo.sAxisName.length > 0) {
			oDragDropInfo.sAxisName = oDimInfo.sAxisName;
		}
		if (oDimInfo.bIsMeasureStructure === true) {
			oDragDropInfo.bIsMeasureStructure = true;
		}
		if (oDimInfo.bIsStructure === true) {
			oDragDropInfo.bIsStructure = true;
			oDragDropInfo.bIsRemoveStructureAllowed = oDimInfo.bIsRemoveStructureAllowed;
		}
		
		oDragDropInfo.bIsMemberDrag = false;
		oDragDropInfo.iMemberRow = -1;
		oDragDropInfo.iMemberCol = -1;
		
		return oDragDropInfo;
	};
	
	this.makeDropAreaDroppable = function(oJqArea, sHoverClass, fCheckAccept, fHandleDrop) {
		oJqArea.droppable();
		oJqArea.droppable("option", "hoverClass", sHoverClass + "Active");
		oJqArea.droppable("option", "addClasses", false);
		oJqArea.droppable("option", "greedy", true);
		oJqArea.droppable("option", "tolerance", "pointer");
		oJqArea.droppable("option", "accept", fCheckAccept);
		oJqArea.droppable("option", "drop", fHandleDrop);
		oJqArea.droppable("option", "over", oDragDropHoverManager.onDropAreaOver);
		oJqArea.droppable("option", "out", oDragDropHoverManager.onDropAreaOut);
	};
	
	this.makeCellDroppable = function(oJqCell, fCheckAccept, fHandleDrop) {
		oJqCell.droppable();
		oJqCell.droppable("option", "addClasses", false);
		oJqCell.droppable("option", "greedy", true);
		oJqCell.droppable("option", "tolerance", "pointer");
		oJqCell.droppable("option", "accept", fCheckAccept);
		oJqCell.droppable("option", "drop", fHandleDrop);
		oJqCell.droppable("option", "over", oDragDropHoverManager.onDropCellOver);
		oJqCell.droppable("option", "out", oDragDropHoverManager.onDropCellOut);
	};
	
	this.makeCellDraggable = function(oJqCell, fHelper) {				
		oJqCell.draggable();
		oJqCell.draggable("option", "cursor", "move");
		oJqCell.draggable("option", "cursorAt", {top : -5});
		oJqCell.draggable("option", "appendTo", document.getElementById(oCrosstab.getId()));
		oJqCell.draggable("option", "addClasses", true);
		oJqCell.draggable("option", "helper", fHelper);
		oJqCell.draggable("option", "revert", this.checkDragRevert);
		oJqCell.draggable("option", "stop", this.resetDragDrop);
		
		oDragDropHoverManager.provideDraggableCellCursor(oJqCell);
		
		// Prevent pagebook from swapping pages when D&D in Crosstab
		$(oJqCell.draggable()).mousedown(function(e) {
			if (sap.zen.crosstab.utils.Utils.isDispatcherAvailable) {
				sap.zen.Dispatcher.instance.closeContextMenu();
			}
			sap.zen.crosstab.utils.Utils.cancelEvent(e);
		});
	};
	
	this.getDropAreaTypeFromDropAreaId = function(sId) {
		return sId.substring(sId.indexOf("droparea_"));
	};
	
	this.checkDropAllowedOnCrosstabElement = function(e) {
		return (!sap.zen.Dispatcher.instance.isDragDropCanceled() && !e.buttons && this.checkMouseInRenderSizeDiv(e));
	};
	
	this.findCell = function(oJqSource) {
		var oDiv = oJqSource.closest("div");
		var oCellId = oCrosstab.getUtils().getCellIdFromContenDivId(oDiv.attr("id"));
		var oCell = sap.ui.getCore().byId(oCellId);
		return oCell;
	};
	
	this.getBoundingClientRect = function(oDomElement) {
		return oCrosstab.getUtils().getRtlAwareBoundingClientRect(oDomElement);
	};
	
	this.getDeleteDragGhostCellRowHtml = function(iColSpan) {
		var sHtml = "<tr><td colspan=" + iColSpan + ">";
		sHtml += "<div id=\"" + oCrosstab.getId() + "_dragtrash\" class=\"sapzencrosstab-Trashcan\"></div>"
		sHtml += "</td></tr>";
		return sHtml;
	};
	
	this.setCurrentDragHelper = function(oJqHelper) {
		oJqCurrentDragHelper = oJqHelper;
	};
	
	this.saveRevertCellPosInfo = function(oCell, aCells, sAxisName) {
		var oPosInfo = {};
		var oJqCell;
		
		oPosInfo.oCell = oCell;
		oPosInfo.aCells = aCells;
		oPosInfo.sAxisName = sAxisName;
		
		oJqCell = $(document.getElementById(oCell.getId()));
		oJqCell.data("oRevertPosInfo", oPosInfo);
	};
		
	this.getRevertPosition = function(oRevertPosInfo) {
		var oJqCell;
		var oJqRevertCell;
		var oPos;
		var oRect;
		var oRevertCell;
		var iWidth;
		var oCell = oRevertPosInfo.oCell;
		var aCells = oRevertPosInfo.aCells;
		var sAxisName = oRevertPosInfo.sAxisName;

		// always take "top" from first cell to be correct on both rows and cols axis
		oRevertCell = aCells[0];
		oJqRevertCell = $(document.getElementById(oRevertCell.getId()));
		oPos = oJqRevertCell.position();
		
		// decide which cell contributes to the "left" coordinate
		if (oCrosstab.getPropertyBag().isRtl() || oCell.isSplitPivotCell()) {
			if (aCells.length > 1) {
				oRevertCell = aCells[aCells.length - 1];
				oJqRevertCell = $(document.getElementById(oRevertCell.getId()));
			}
		} 
		
		// RTL must take scrollbar at other end into account since jQuery revert coordinates always need to be "left" and "top".
		// It does not work with specifying "right" in the position object which would make things a lot easier for RTL, hence we need to do some magic
		if (oCrosstab.getPropertyBag().isRtl()) {
			oPos.left = oJqRevertCell.position().left + (oCrosstab.isVScrolling() ? oCrosstab.getRenderEngine().getMeasuringHelper().getBrowserScrollbarWidth() : 0);
		} 
		
		// fine tuning for split cell
		if (oRevertCell.isSplitPivotCell() && sAxisName && sAxisName === "COLS") {
			oRect = oCrosstab.getUtils().getRtlAwareBoundingClientRect(oJqRevertCell[0]);
			if (oCrosstab.getPropertyBag().isRtl()) {
				oPos.left = oPos.left - (oJqCurrentDragHelper ? Math.round(oJqCurrentDragHelper.outerWidth() / 2.0) : Math.round(oRect.width / 2.0));
			} else {
				oPos.left = oPos.left + Math.round(oRect.width / 2.0);				
			}
		}
		return oPos;
	};
	
	this.setCursorAt = function(oCell, oJqHelper) {
		var iWidth = 0;
		var iLeft = 0;
		var oJqCrosstabDiv = $(document.getElementById(oCrosstab.getId()));
		var oJqCell = $(document.getElementById(oCell.getId()));
		
		oJqCrosstabDiv.append(oJqHelper);
		iWidth = oJqHelper.outerWidth();
		oJqHelper.remove();
		
		iLeft = Math.round(iWidth / 2.0);
		oJqCell.draggable("option", "cursorAt", {top: -5, left: iLeft});
	};
	
	this.getAllMemberCellsInRowOrCol = function(oCell) {
		var oArea = oCell.getArea();
		var i = 0;
		var oTmpCell;
		var aCells = [];
		
		if (oArea.isRowHeaderArea()) {
			while (i < oArea.getColCnt()) {
				oTmpCell = oArea.getCellWithColSpan(oCell.getRow(), i);
				if (oTmpCell) {
					aCells.push(oTmpCell);
					i = i + oTmpCell.getColSpan();
				} else {
					i++;
				}
			}
		} else if (oArea.isColHeaderArea()) {
			while (i < oArea.getRowCnt()) {
				oTmpCell = oArea.getCellWithRowSpan(i, oCell.getCol());
				if (oTmpCell) {
					aCells.push(oTmpCell);
					i = i + oTmpCell.getRowSpan();
				} else {
					i++;
				}
			}
		}
		return aCells;
	};
	
	this.getEffectiveCell = function(oCell) {
		var oEffectiveCell = oCell;
		var oArea = null;
		
		if (oCell && oCrosstab.getPropertyBag().isRepeatTexts()) {
			oArea = oCell.getArea();
			if (oArea.isRowHeaderArea()) {
				oEffectiveCell = oArea.getCellWithColSpan(oCell.getRow(), oArea.getColCnt() - 1);
			} else if (oArea.isColHeaderArea()) {
				oEffectiveCell = oArea.getCellWithRowSpan(oArea.getRowCnt() - 1, oCell.getCol());
			}
		} 
		
		return oEffectiveCell;
	};
};