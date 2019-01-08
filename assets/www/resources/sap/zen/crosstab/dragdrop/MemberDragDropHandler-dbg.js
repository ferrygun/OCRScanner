jQuery.sap.declare("sap.zen.crosstab.dragdrop.MemberDragDropHandler");
jQuery.sap.require("sap.zen.crosstab.dragdrop.DragDropUtils");
jQuery.sap.require("sap.zen.crosstab.dragdrop.DragDropAreaRenderer");
jQuery.sap.require("sap.zen.crosstab.dragdrop.DragDropHoverManager");
jQuery.sap.require("sap.zen.crosstab.TextConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");


sap.zen.crosstab.dragdrop.MemberDragDropHandler = function (oCrosstab, oDragDropCommands, oDragDropUtils, oDragDropAreaRenderer, oDragDropHoverManager) {
	"use strict";
	
	var that = this;
	var oValidRowHeaderRect;
	var oValidColHeaderRect;
	var oPivotCell;
	var bIsRepeatTexts;
	
	var oMemberDropAreaAboveInfo = {"sIdSuffix" : "member_droparea_above", "sCssClassName" : "sapzencrosstab-rowAboveCellMemberDropArea"};
	var oMemberDropAreaBelowInfo = {"sIdSuffix" : "member_droparea_below", "sCssClassName" : "sapzencrosstab-rowBelowCellMemberDropArea"};
	var oMemberDropAreaBeforeInfo = {"sIdSuffix" : "member_droparea_before", "sCssClassName" : "sapzencrosstab-columnBeforeCellMemberDropArea"};
	var oMemberDropAreaAfterInfo = {"sIdSuffix" : "member_droparea_after", "sCssClassName" : "sapzencrosstab-columnAfterCellMemberDropArea"};
	
	this.init = function(p_oPivotCell) {
		bIsRepeatTexts = oCrosstab.getPropertyBag().isRepeatTexts();
		oPivotCell = p_oPivotCell;
		oValidRowHeaderRect = oDragDropUtils.getBoundingClientRect(oCrosstab.getRowHeaderAreaDiv()[0]);
		oValidColHeaderRect = oDragDropUtils.getBoundingClientRect(oCrosstab.getColHeaderAreaDiv()[0]);
		this.removeRowHeaderDropAreas();
		this.enableMemberDragDrop();
	};
	
	this.removeRowHeaderDropAreas = function() {
		var oJqRenderSizeDiv;
		if (!oCrosstab.getPropertyBag().isPixelScrolling()) {
			oJqRenderSizeDiv = oCrosstab.getRenderSizeDiv();
			oJqRenderSizeDiv.find(".sapzencrosstab-rowAboveCellMemberDropArea").remove();
			oJqRenderSizeDiv.find(".sapzencrosstab-rowBelowCellMemberDropArea").remove();
			oJqRenderSizeDiv.find(".sapzencrosstab-columnBeforeCellMemberDropArea").remove();
			oJqRenderSizeDiv.find(".sapzencrosstab-columnAfterCellMemberDropArea").remove();
		}
	};
	
	this.getMemberCellHtml = function(oCell) {
		var oJqCell;
		var oJqCellLayoutDiv;
		var iWidth;
		var sHtml;
		
		oJqCell = $(document.getElementById(oCell.getId()));	
		oJqCellLayoutDiv = $(document.getElementById(oCell.getId() + "_cellLayoutDiv"));
		iWidth = oJqCellLayoutDiv.outerWidth();
	
		sHtml = "<td class=\"" + oJqCell.attr("class") + " sapzencrosstab-DragHeaderCell" + "\">";
		sHtml += "<div style=\"width: " + iWidth + "px\">" + oCell.getText() + "</div></td>";
		
		return sHtml;
	};
	
	this.createMemberCellDragObject = function(oAnchorCell, aDragCells) {
		var sHtml;
		var sAxisName;
		var sCssClassName;
		var oCell;
		var iHeight;
		var i;
		var iLength;
		var oJqHelper;
		
		if (oAnchorCell.getArea().isRowHeaderArea()) {
			sCssClassName = "sapzencrosstab-RowHeaderArea";
		} else if (oAnchorCell.getArea().isColHeaderArea()) {
			sCssClassName = "sapzencrosstab-ColumnHeaderArea";
		}
		
		sHtml = "<table style=\"z-index: 9999;border-collapse: collapse\" class=\"" + sCssClassName + "\"><tbody>";
		
		iLength = aDragCells.length;
		
		sHtml += oDragDropUtils.getDeleteDragGhostCellRowHtml(iLength);
		
		if (oAnchorCell.getArea().isRowHeaderArea()) {
			oCell = aDragCells[0];
			iHeight = $(document.getElementById(oCell.getId())).outerHeight();
			sHtml += "<tr style=\"height: " + iHeight + "px\">";
			
			for (i = 0; i < iLength; i++) {
				oCell = aDragCells[i];		
				sHtml += this.getMemberCellHtml(oCell);	
			}
			
			sHtml += "</tr>";
		} else if (oAnchorCell.getArea().isColHeaderArea()) {
			for (i = 0; i < iLength; i++) {
				oCell = aDragCells[i];
				
				iHeight = $(document.getElementById(oCell.getId())).outerHeight();
				sHtml += "<tr style=\"height: " + iHeight + "px\">";
				sHtml += this.getMemberCellHtml(oCell);
				
				sHtml += "</tr>";
			}
		}
		sHtml += "</tbody></table>";
		
		oJqHelper = $(sHtml);
		
		oCrosstab.setDragAction(true);
		return oJqHelper;
	};
	
	this.restrictDropIndexLimitsForHierarchyMember = function(oCell, oDropIndexLimits, sAxisName) {
		var oRowHeaderArea = oCrosstab.getRowHeaderArea();
		var oColHeaderArea = oCrosstab.getColumnHeaderArea();
		var iRow;
		var iCol;
		var oTempCell;
		var iFirstIndex = -1;
		var iLastIndex = -1;
		var oLastIndexCell = null;
		var oFirstIndexCell = null;
		
		if (oCell.getAlignment() === "TOP" || oCell.getAlignment === "DEFAULT") {
			if (sAxisName === "ROWS") {
				for (iRow = oDropIndexLimits.iMinIndex; iRow <= oDropIndexLimits.iMaxIndex; iRow++) {
					oTempCell = oRowHeaderArea.getCellWithRowSpan(iRow, oCell.getCol(), true);
					if (oTempCell && oTempCell.getLevel() === oCell.getLevel() && oTempCell.getParentMemberId() === oCell.getParentMemberId()) {
						if (iFirstIndex < 0) {
							iFirstIndex = iRow;
						} else {
							oLastIndexCell = oTempCell;
						}
					}
				}
				if (iFirstIndex > -1) {
					oDropIndexLimits.iMinIndex = iFirstIndex;
				}
				if (oLastIndexCell) {
					oDropIndexLimits.iMaxIndex = oLastIndexCell.getRow() + oLastIndexCell.getRowSpan() - 1;
				}
			} else if (sAxisName === "COLS") {
				for (iCol = oDropIndexLimits.iMinIndex; iCol <= oDropIndexLimits.iMaxIndex; iCol++) {
					oTempCell = oColHeaderArea.getCellWithColSpan(oCell.getRow(), iCol, true);
					if (oTempCell && oTempCell.getLevel() === oCell.getLevel() && oTempCell.getParentMemberId() === oCell.getParentMemberId()) {
						if (iFirstIndex < 0) {
							iFirstIndex = iCol;
						} else {
							oLastIndexCell = oTempCell;
						}
					}
				}
				if (iFirstIndex > -1) {
					oDropIndexLimits.iMinIndex = iFirstIndex;
				}
				if (oLastIndexCell) {
					oDropIndexLimits.iMaxIndex = oLastIndexCell.getCol() + oLastIndexCell.getColSpan() - 1;
				}
			}
		} else {
			if (sAxisName === "ROWS") {
				for (iRow = oDropIndexLimits.iMaxIndex; iRow >= oDropIndexLimits.iMinIndex; iRow--) {
					oTempCell = oRowHeaderArea.getCellWithRowSpan(iRow, oCell.getCol(), true);
					if (oTempCell && oTempCell.getLevel() === oCell.getLevel() && oTempCell.getParentMemberId() === oCell.getParentMemberId()) {
						if (iLastIndex < 0) {
							iLastIndex = iRow;
						} else {
							oFirstIndexCell = oTempCell;
						}
					}
				}
				if (oFirstIndexCell) {
					oDropIndexLimits.iMinIndex = oFirstIndexCell.getRow();
				}
				if (iLastIndex > -1) {
					oDropIndexLimits.iMaxIndex = iLastIndex;
				}
			} else if (sAxisName === "COLS") {
				for (iCol = oDropIndexLimits.iMaxIndex; iCol >= oDropIndexLimits.iMinIndex; iCol--) {
					oTempCell = oColHeaderArea.getCellWithColSpan(oCell.getRow(), iCol, true);
					if (oTempCell && oTempCell.getLevel() === oCell.getLevel() && oTempCell.getParentMemberId() === oCell.getParentMemberId()) {
						if (iLastIndex < 0) {
							iLastIndex = iCol;
						} else {
							oFirstIndexCell = oTempCell;
						}
					}
				}
				if (oFirstIndexCell) {
					oDropIndexLimits.iMinIndex = oFirstIndexCell.getCol();
				}
				if (iLastIndex > -1) {
					oDropIndexLimits.iMaxIndex = iLastIndex;
				}
			}				
		}
		return oDropIndexLimits;
	};
	
	this.filterResultCellsFromDropIndexLimits = function(oDropIndexLimits, oCell, sAxisName) {
		var oTempCell;
		var oRowHeaderArea = oCrosstab.getRowHeaderArea();
		var oColHeaderArea = oCrosstab.getColumnHeaderArea();
		var iRow;
		var iCol;
		
		if (sAxisName === "ROWS") {
			iRow = oDropIndexLimits.iMinIndex;
			oTempCell = oRowHeaderArea.getCellWithRowSpan(iRow, oCell.getCol());
			if (!oTempCell) {
				oTempCell = oRowHeaderArea.getCellWithColSpan(iRow, oCell.getCol());
			}
			while (oTempCell && oTempCell.isResult() && iRow < oDropIndexLimits.iMaxIndex) {
				oDropIndexLimits.iMinIndex = oTempCell.getRow() + oTempCell.getRowSpan();
				iRow++;
				oTempCell = oRowHeaderArea.getCellWithColSpan(iRow, oCell.getCol());
			}
			iRow = oDropIndexLimits.iMaxIndex;
			oTempCell = oRowHeaderArea.getCellWithRowSpan(iRow, oCell.getCol());
			if (!oTempCell) {
				oTempCell = oRowHeaderArea.getCellWithColSpan(iRow, oCell.getCol());
			}
			while (oTempCell && oTempCell.isResult() && iRow > oDropIndexLimits.iMinIndex) {
				oDropIndexLimits.iMaxIndex = oTempCell.getRow() - 1;
				iRow--;
				oTempCell = oRowHeaderArea.getCellWithColSpan(iRow, oCell.getCol());
			}
		} else if (sAxisName === "COLS") {
			iCol = oDropIndexLimits.iMinIndex;
			oTempCell = oColHeaderArea.getCellWithColSpan(oCell.getRow(), iCol);
			if (!oTempCell) {
				oTempCell = oColHeaderArea.getCellWithRowSpan(iRow, oCell.getCol());
			}
			while (oTempCell && oTempCell.isResult() && iCol < oDropIndexLimits.iMaxIndex) {
				oDropIndexLimits.iMinIndex = oTempCell.getCol() + oTempCell.getColSpan();
				iCol++;
				oTempCell = oColHeaderArea.getCellWithRowSpan(oCell.getRow(), iCol);
			}
			iCol = oDropIndexLimits.iMaxIndex;
			oTempCell = oColHeaderArea.getCellWithColSpan(oCell.getRow(), iCol);
			if (!oTempCell) {
				oTempCell = oColHeaderArea.getCellWithRowSpan(iRow, oCell.getCol());
			}
			while (oTempCell && oTempCell.isResult() && iRow > oDropIndexLimits.iMinIndex) {
				oDropIndexLimits.iMaxIndex = oTempCell.getCol() - 1;
				iCol--;
				oTempCell = oColHeaderArea.getCellWithRowSpan(oCell.getRow(), iCol);
			}
		}
		return oDropIndexLimits;
	};
	
	this.determineDropIndexLimitsFromPeerCell = function(oPeerCell, sAxisName) {
		var i = 0;
		var iBeginIndex;
		var iEndIndex;
		var oArea;
		var oCell;
		var oDropIndexLimits = {};
		
		oDropIndexLimits.iMinIndex = -1;
		oDropIndexLimits.iMaxIndex = -1;
		if (bIsRepeatTexts && oPeerCell.getMergeKey() && oPeerCell.getMergeKey().length > 0) {
			if (sAxisName === "COLS") {
				oArea = oCrosstab.getColHeaderArea();
				iBeginIndex = oArea.getRenderStartCol();
				iEndIndex = iBeginIndex + oArea.getRenderColCnt();
				for (i = iBeginIndex; (i < iEndIndex) && (oDropIndexLimits.iMaxIndex === -1); i++) {
					oCell = oArea.getCell(oPeerCell.getRow(), i);
					if (oCell.getMergeKey() === oPeerCell.getMergeKey() && oDropIndexLimits.iMinIndex === -1) {
						oDropIndexLimits.iMinIndex = i;
					}
					if (oCell.getMergeKey() !== oPeerCell.getMergeKey() && oDropIndexLimits.iMinIndex > -1) {
						oDropIndexLimits.iMaxIndex = i - 1;
					}
				}
			} else {
				oArea = oCrosstab.getRowHeaderArea();
				iBeginIndex = oArea.getRenderStartRow();
				iEndIndex = iBeginIndex + oArea.getRenderRowCnt();
				for (i = iBeginIndex; (i < iEndIndex) && (oDropIndexLimits.iMaxIndex === -1); i++) {
					oCell = oArea.getCell(i, oPeerCell.getCol());
					if (oCell.getMergeKey() === oPeerCell.getMergeKey() && oDropIndexLimits.iMinIndex === -1) {
						oDropIndexLimits.iMinIndex = i;
					}
					if (oCell.getMergeKey() !== oPeerCell.getMergeKey() && oDropIndexLimits.iMinIndex > -1) {
						oDropIndexLimits.iMaxIndex = i - 1;
					}
				}
			}
			if (oDropIndexLimits.iMaxIndex === -1) {
				oDropIndexLimits.iMaxIndex = iEndIndex;
			}
		} else {
			if (sAxisName === "COLS") {
				oDropIndexLimits.iMinIndex = oPeerCell.getCol();
				oDropIndexLimits.iMaxIndex = oPeerCell.getCol() + oPeerCell.getColSpan() - 1;
			} else {
				oDropIndexLimits.iMinIndex = oPeerCell.getRow();
				oDropIndexLimits.iMaxIndex = oPeerCell.getRow() + oPeerCell.getRowSpan() - 1;
			}
		}
		
		return oDropIndexLimits;
	};
	
	this.findDropIndexLimits = function(oCell, oDimInfo) {
		var oDropIndexLimits = {};	
		var iIndex;
		var oPeerCell;
		
		iIndex = oCrosstab.getHeaderInfo().findStartIndexOfPreviousDimension(oDimInfo.sDimensionName, oDimInfo.sAxisName);
		if (oDimInfo.sAxisName === "ROWS") {
			if (!oCrosstab.getHeaderInfo().isFirstDimensionOnAxis(oDimInfo)) {
				oPeerCell = oCrosstab.getRowHeaderArea().getCellWithRowSpan(oCell.getRow(), iIndex);
				oDropIndexLimits = this.determineDropIndexLimitsFromPeerCell(oPeerCell, oDimInfo.sAxisName);
			} else {
				oDropIndexLimits.iMinIndex = oCrosstab.getRowHeaderArea().getRenderStartRow();
				oDropIndexLimits.iMaxIndex = oDropIndexLimits.iMinIndex + oCrosstab.getRowHeaderArea().getRenderRowCnt() - 1;
			}
		} else if (oDimInfo.sAxisName === "COLS") {
			if (!oCrosstab.getHeaderInfo().isFirstDimensionOnAxis(oDimInfo)) {
				oPeerCell = oCrosstab.getColumnHeaderArea().getCellWithColSpan(iIndex, oCell.getCol());
				oDropIndexLimits = this.determineDropIndexLimitsFromPeerCell(oPeerCell, oDimInfo.sAxisName);
			} else {
				oDropIndexLimits.iMinIndex = oCrosstab.getColumnHeaderArea().getRenderStartCol();
				oDropIndexLimits.iMaxIndex = oDropIndexLimits.iMinIndex + oCrosstab.getColumnHeaderArea().getRenderColCnt() - 1;
			}
		}

		oDropIndexLimits = this.filterResultCellsFromDropIndexLimits(oDropIndexLimits, oCell, oDimInfo.sAxisName);
		
		if (oCell.getLevel() > -1) {
			oDropIndexLimits = this.restrictDropIndexLimitsForHierarchyMember(oCell, oDropIndexLimits, oDimInfo.sAxisName);
		}
		return oDropIndexLimits;
	};
			
	this.findPreviousPeerCell = function(oCell, sAxisName, oIndexLimits) {
		var oRowHeaderArea = oCrosstab.getRowHeaderArea();
		var oColHeaderArea = oCrosstab.getColumnHeaderArea();
		var oTempCell;
		var iRow; 
		var iCol;	
		var oPeerCell = null;
			
		if (oCell.getAlignment() === "TOP" || oCell.getAlignment === "DEFAULT") {
			if (sAxisName === "ROWS") {
				for (iRow = oCell.getRow(); iRow >= oIndexLimits.iMinIndex && !oPeerCell; iRow--) {
					oTempCell = oRowHeaderArea.getCellWithRowSpan(iRow, oCell.getCol(), true);
					if (oTempCell && oTempCell.getId() !== oCell.getId() && oTempCell.getLevel() === oCell.getLevel()) {
						oPeerCell = oTempCell;
					}
				}
			} else if (sAxisName === "COLS") {		
				for (iCol = oCell.getCol(); iCol >= oIndexLimits.iMinIndex && !oPeerCell; iCol--) {
					oTempCell = oColHeaderArea.getCellWithColSpan(oCell.getRow(), iCol, true);
					if (oTempCell && oTempCell.getId() !== oCell.getId() && oTempCell.getLevel() === oCell.getLevel()) {
						oPeerCell = oTempCell;
					}
				}
			}
		} else {
			if (sAxisName === "ROWS") {
				for (iRow = oCell.getRow(); iRow <= oIndexLimits.iMaxIndex && !oPeerCell; iRow++) {
					oTempCell = oRowHeaderArea.getCellWithRowSpan(iRow, oCell.getCol(), true);
					if (oTempCell && oTempCell.getId() !== oCell.getId() && oTempCell.getLevel() === oCell.getLevel()) {
						oPeerCell = oTempCell;
					}
				}
			} else if (sAxisName === "COLS") {
				for (iCol = oCell.getCol(); iCol <= oIndexLimits.iMaxIndex && !oPeerCell; iCol++) {
					oTempCell = oColHeaderArea.getCellWithColSpan(oCell.getRow(), iCol, true);
					if (oTempCell && oTempCell.getId() !== oCell.getId() && oTempCell.getLevel() === oCell.getLevel()) {
						oPeerCell = oTempCell;
					}
				}
			}
		}
		
		if (oPeerCell) {
			if (oPeerCell.getParentMemberId() !== oCell.getParentMemberId()) {
				oPeerCell = null;
			}
		}
		
		return oPeerCell;
	};
		
	function memberCellDraggableHelper(e) {
		var oCell;
		var oDragCell;
		var oHeaderInfo;
		var aDragCells;
		var oJqHelper;
		var oPayload;
		var oDimInfo;
		var oCoordinates;
		var i;
		var oDropIndexLimits;
		
		oHeaderInfo = oCrosstab.getHeaderInfo();
		oDragCell = oDragDropHoverManager.getCellFromJqCell(this);
		oCell = oDragDropUtils.getEffectiveCell(oDragCell);
		if (oCell) {
			oDragDropUtils.setCurrentJqDragCell($(document.getElementById(oCell.getId())));
			if (bIsRepeatTexts) {
				aDragCells = oDragDropUtils.getAllMemberCellsInRowOrCol(oCell);
			} else {
				aDragCells = oHeaderInfo.getMemberCellsForSameDimension(oCell);
			}
			oDragDropUtils.saveRevertCellPosInfo(oDragCell, aDragCells);
			oJqHelper = that.createMemberCellDragObject(oCell, aDragCells);
			oDragDropUtils.setCursorAt(oDragCell, oJqHelper);
					
			oDimInfo = oHeaderInfo.getDimensionInfoForMemberCell(oCell);
			oPayload = sap.zen.Dispatcher.instance.createDragDropPayload(oCrosstab.getId());
			oPayload.oDragDropInfo = oDragDropUtils.buildDimensionDragDropInfo(oDimInfo);
			
			// DropIndexLimits
			oDropIndexLimits = that.findDropIndexLimits(oCell, oDimInfo);
			oPayload.oDragDropInfo.oDropIndexLimits = oDropIndexLimits;
			
			// Hierarchy information
			if (oCell.getLevel() > -1) {
				oPayload.oDragDropInfo.bIsHierarchyMember = true;
			}	
						
			oPayload.oDragDropInfo.bIsMemberDrag = true;
			oCoordinates = oCrosstab.getUtils().translateCellCoordinatesForBackend(oCell);
			if (oCoordinates) {
				oPayload.oDragDropInfo.iMemberRow = oCoordinates.row;
				oPayload.oDragDropInfo.iMemberCol = oCoordinates.col;
			}	
			
			sap.zen.Dispatcher.instance.setDragDropPayload(oPayload);
		}
		return oJqHelper;
	}
	
	this.checkBasicMemberDropAccept = function(oPayload, sDropAxisName) {			
		if (!oPayload) {
			return false;
		}
		
		if (oPayload.oDragDropInfo.sAxisName !== sDropAxisName) {
			return false;
		}
		
		if (oDragDropUtils.isDragFromOtherCrosstab(oPayload)) {
			return false;
		}
		
		if (oDragDropUtils.isInterComponentDrag(oPayload)) {
			return false;
		}
		
		if (!oPayload.oDragDropInfo.bIsMemberDrag) {
			return false;
		}
		
		return true;
	};
	
	this.returnFromMemberCellAcceptCheck = function(oCell, bAccept) {
		oCell.setRevertDrop(!bAccept);
		sap.zen.Dispatcher.instance.setDropAccepted(oCell.getId(), bAccept);
		return bAccept;
	};
	
	this.checkDropLimitsAgainstCells = function(oDragCell, oDropCell, oDropIndexLimits, sAxisName) {
		var bAccept;
		var iIndex;
		
		if (oDropIndexLimits.iMinIndex === -1 && oDropIndexLimits.iMaxIndex === -1) {
			return true;
		}
		
		if (oDropIndexLimits.iMinIndex === oDropIndexLimits.iMaxIndex) {
			return false;
		}
		
		bAccept = true;
		
		if (sAxisName === "ROWS") {
			if (oDragCell.getRow() === oDropCell.getRow()) {
				bAccept = false;
			} else {
				if (oDragCell.getCol() > 0) {
					iIndex = oDropCell.getRow() + oDropCell.getRowSpan() - 1;
					bAccept = oDropIndexLimits.iMinIndex <= iIndex && oDropIndexLimits.iMaxIndex >= iIndex;
				} 
			}
		} else if (sAxisName === "COLS") {
			if (oDragCell.getCol() === oDropCell.getCol()) {
				bAccept = false;
			} else {
				if (oDragCell.getRow() > 0) {
					iIndex = oDropCell.getCol() + oDropCell.getColSpan() - 1;
					bAccept = oDropIndexLimits.iMinIndex <= iIndex && oDropIndexLimits.iMaxIndex >= iIndex;
				}
			} 
		} else {
			bAccept = false;
		}
		
		return bAccept;
	};
	
	this.checkMatchingHierarchyLevels = function(oDragCell, oDropCell) {
		if (oDropCell.getLevel() > -1 && oDragCell.getLevel() > -1) {
			// Hierarchy node/leaf must have same level and same parent
			return (oDropCell.getLevel() === oDragCell.getLevel() && oDropCell.getParentMemberId() === oDragCell.getParentMemberId());		
		}
		return true;
	};
	
	function checkMemberCellDropAccept(oDraggable) {
		var oDropCell;	
		var oDragCell;
		var oPayload;
		var oDropIndexLimits;
		var bAccept;
		var oDragDropInfo;
		var oDropDimensionInfo;
		
		if (!oCrosstab.isDragAction() || oCrosstab.isBlocked()) {
			return false;
		}
				
		oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		oDragDropInfo = oPayload.oDragDropInfo;
		oDropCell = oDragDropHoverManager.getCellFromJqCell($(this));
		oDropCell = oDragDropUtils.getEffectiveCell(oDropCell);
		oDropDimensionInfo = oCrosstab.getHeaderInfo().getDimensionInfoForMemberCell(oDropCell);
		
		if (!that.checkBasicMemberDropAccept(oPayload, oDropDimensionInfo.sAxisName)) {
			return that.returnFromMemberCellAcceptCheck(oDropCell, false);
		}		
			
		oDropIndexLimits = oPayload.oDragDropInfo.oDropIndexLimits;
		oDragCell = oDragDropHoverManager.getCellFromJqCell(oDraggable);
		oDragCell = oDragDropUtils.getEffectiveCell(oDragCell);

		bAccept = that.checkDropLimitsAgainstCells(oDragCell, oDropCell, oDropIndexLimits, oDragDropInfo.sAxisName);
		if (!bAccept) {
			return that.returnFromMemberCellAcceptCheck(oDropCell, false);
		}
		
		bAccept = that.checkMatchingHierarchyLevels(oDragCell, oDropCell);
		if (!bAccept) {
			return that.returnFromMemberCellAcceptCheck(oDropCell, false);
		}
		
		return that.returnFromMemberCellAcceptCheck(oDropCell, true);
	}
		
	this.returnFromMemberAreaAcceptCheck = function(oJqArea, bAccept) {
		oJqArea.data("xtabrevertdrop", !bAccept);
		sap.zen.Dispatcher.instance.setDropAccepted(oJqArea.attr("id"), bAccept);
		return bAccept;
	};
	
	this.checkDropAreaDropLimits = function(oDragCell, oDropCell, oDropIndexLimits, sAxisName, bIsBeginArea) {
		var oAreaIndexLimits;
		var bAccept;
		
		if (oDropIndexLimits.iMinIndex !== oDropIndexLimits.iMaxIndex && !bIsBeginArea) {
			// Bottom of a result cell should not be active drop area if result cell
			// is last cell in the allowed index block, since results cannot be reordered
			if (oDropCell.isResult()) {
				if (sAxisName === "ROWS") {
					if (oDropCell.getRow() + oDropCell.getRowSpan() - 1 === oDropIndexLimits.iMaxIndex) {
						return false;
					}
				} else if (sAxisName === "COLS") {
					if (oDropCell.getCol() + oDropCell.getColSpan() - 1 === oDropIndexLimits.iMaxIndex) {
						return false;
					}
				}
			}
			// adjust the limits for area logic: allow one further up for min index to get the droparea of the next cell
			// so stuff can be shoved ahead of the top cell in the allowed block
			oAreaIndexLimits = {"iMinIndex" : Math.max(0, oDropIndexLimits.iMinIndex - 1), "iMaxIndex" : oDropIndexLimits.iMaxIndex};
		} else {
			oAreaIndexLimits = oDropIndexLimits;
		}
		
		bAccept = this.checkDropLimitsAgainstCells(oDragCell, oDropCell, oAreaIndexLimits, sAxisName);
		
		return bAccept;
	};
	
	this.getDropCellFromAnchorCell = function(oAnchorCell, oDragCell, sAxisName, bIsBeginArea) {
		var oDropCell = null;
		var i;
		
		// Can only move within row in col header or within col in row header!
		if (sAxisName === "ROWS") {
			oDropCell = oCrosstab.getRowHeaderArea().getCellWithColSpan(oAnchorCell.getRow(), oDragCell.getCol(), true);
			if (!oDropCell) {
				oDropCell = oCrosstab.getRowHeaderArea().getCellWithRowSpan(oAnchorCell.getRow(), oDragCell.getCol(), true);
			}
			if (oDropCell && !bIsBeginArea) {
				if ((oAnchorCell.getRow() + oAnchorCell.getRowSpan()) !== (oDropCell.getRow() + oDropCell.getRowSpan())) {
					oDropCell = null;
				}
			} 
		} else if (sAxisName === "COLS") {
			oDropCell = oCrosstab.getColumnHeaderArea().getCellWithRowSpan(oDragCell.getRow(), oAnchorCell.getCol(), true);
			if (!oDropCell) {
				oDropCell = oCrosstab.getColumnHeaderArea().getCellWithColSpan(oDragCell.getRow(), oAnchorCell.getCol(), true);
			}
			if (oDropCell && !bIsBeginArea) {
				if ((oAnchorCell.getCol() + oAnchorCell.getColSpan()) !== (oDropCell.getCol() + oDropCell.getColSpan())) {
					oDropCell = null;
				}
			} 
		}
		return oDropCell;
	};
	
	this.checkAreaMoveOnPreviousCell = function(oDragCell, oDropCell, oAnchorCell, sAxisName, bIsBeginArea) {	
		if (sAxisName === "ROWS") {
			if (oDropCell.getRow() === oDragCell.getRow() || (oAnchorCell.getRow() + oAnchorCell.getRowSpan()) === oDragCell.getRow()) {
				if (!bIsBeginArea) {
					return false;
				}
			}
		} else if (sAxisName === "COLS") {
			if (oDropCell.getCol() === oDragCell.getCol() || (oAnchorCell.getCol() + oAnchorCell.getColSpan()) === oDragCell.getCol()) {
				if (!bIsBeginArea) {
					return false;
				}
			}
		}
		return true;
	};
	
	this.isDropCellOneBelowOrBeforeBlock = function(oDropCell, oDropIndexLimits, sAxisName) {
		var iIndex;
		if (sAxisName === "ROWS") {
			iIndex = oDropCell.getRow() + oDropCell.getRowSpan() - 1;
		} else if (sAxisName === "COLS") {
			iIndex = oDropCell.getCol() + oDropCell.getColSpan() - 1;
		} 
		return (Math.max(0, iIndex) === Math.max(0, (oDropIndexLimits.iMinIndex - 1))); 
	};
	
	this.getNextCell = function(oCell, sAxisName) {
		var oFollowingCell;
		
		if (sAxisName === "ROWS") {
			oFollowingCell = oCrosstab.getRowHeaderArea().getCellWithRowSpan(oCell.getRow() + oCell.getRowSpan(), oCell.getCol());
		} else if (sAxisName === "COLS") {
			oFollowingCell = oCrosstab.getColumnHeaderArea().getCellWithColSpan(oCell.getRow(), oCell.getCol() + oCell.getColSpan());
		}
		
		return oFollowingCell;
	};
	
	this.checkAreaMoveOnPreviousHierarchyPeerOrBeginOfFollowing = function(oDragCell, oDropCell, oDropIndexLimits, sAxisName, bIsBeginArea) {
		var oPrevPeerCell;
		var oParentCell;
		var oFollowingCell;
		var oCheckLevelDropCell = oDropCell;
		
		if (oDragCell.getLevel() > -1 && oDropCell.getLevel() > -1) {
			// for hierarchies, check it is not previous peer with same level and same parent
			oPrevPeerCell = this.findPreviousPeerCell(oDragCell, sAxisName, oDropIndexLimits);
			if (oPrevPeerCell) {
				if (oDropCell.getId() === oPrevPeerCell.getId()) {
					return false;
				}
				if ((sAxisName === "ROWS" && (oDropCell.getRow() + oDropCell.getRowSpan() - 1) === (oPrevPeerCell.getRow() - 1)) || 
						(sAxisName === "COLS" && (oDropCell.getCol() + oDropCell.getColSpan() - 1) === (oPrevPeerCell.getCol() - 1))) {
					if (oDragCell.getLevel() !== oDropCell.getLevel() && bIsBeginArea) {
						return false;
					}
				} else {	
					if (!this.isDropCellOneBelowOrBeforeBlock(oDropCell, oDropIndexLimits, sAxisName)) {
						if (!this.checkMatchingHierarchyLevels(oDragCell, oDropCell)) {
							return false;
						}
					}
				}
			} else {
				if (!this.isDropCellOneBelowOrBeforeBlock(oDropCell, oDropIndexLimits, sAxisName)) {
					if (!bIsBeginArea && oDropCell.getLevel() !== oDragCell.getLevel()) {
						oFollowingCell = this.getNextCell(oDropCell, sAxisName);
						if (oFollowingCell) {
							oPrevPeerCell = this.findPreviousPeerCell(oFollowingCell, sAxisName, oDropIndexLimits);
							if (oPrevPeerCell && oPrevPeerCell.getId() === oDragCell.getId()) {
								return false;
							}
							oCheckLevelDropCell = oFollowingCell;
						}
					}	
					if (!this.checkMatchingHierarchyLevels(oDragCell, oCheckLevelDropCell)) {
						return false;
					}
				}
			}	
		} 
		return true;
	};
		
	function checkMemberDropAreaAccept(oDraggable) {
		var oPayload;
		var oJqArea;
		var oDropCell;
		var oDragCell;
		var sAreaType;
		var sDropAxisName;
		var sDragAxisName;
		var bAccept;
		var bIsBeginArea;
		var oDropIndexLimits;
		var oDragDropInfo;
		var oAnchorCell;
		
		if (!oCrosstab.isDragAction() || oCrosstab.isBlocked()) {
			return false;
		}
				
		oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		oJqArea = $(this);
			
		// Basic area data
		sAreaType = oDragDropUtils.getDropAreaTypeFromDropAreaId(oJqArea.attr("id"));
		sDropAxisName = (sAreaType === "droparea_above" || sAreaType === "droparea_below") ? "ROWS" : "COLS";
		bIsBeginArea = (sAreaType === "droparea_above" || sAreaType === "droparea_before");
		
		// Basic check
		if (!that.checkBasicMemberDropAccept(oPayload, sDropAxisName)) {
			return that.returnFromMemberAreaAcceptCheck(oJqArea, false);
		}
		
		// DragCell
		oDragCell = oDragDropUtils.getCrosstabHeaderCellFromDraggable(oDraggable);
		oDragCell = oDragDropUtils.getEffectiveCell(oDragCell);
		sDragAxisName = oDragCell.getArea().isRowHeaderArea() ? "ROWS" : "COLS";

		if (sDragAxisName !== sDropAxisName) {
			return that.returnFromMemberAreaAcceptCheck(oJqArea, false);
		}
		
		// AnchorCell and DropCell
		oAnchorCell = sap.ui.getCore().getControl(oJqArea.data("xtabcellid"));
		oDropCell = that.getDropCellFromAnchorCell(oAnchorCell, oDragCell, sDragAxisName, bIsBeginArea);
		oDropCell = oDragDropUtils.getEffectiveCell(oDropCell);

		if (!oDropCell || (oDropCell && (oDropCell.getId() === oDragCell.getId()))) {
			return that.returnFromMemberAreaAcceptCheck(oJqArea, false);
		}
			
		// Check against DropIndexLimits
		oDragDropInfo = oPayload.oDragDropInfo;
		oDropIndexLimits = oDragDropInfo.oDropIndexLimits;	
		
		bAccept = that.checkDropAreaDropLimits(oDragCell, oDropCell, oDropIndexLimits, sDragAxisName, bIsBeginArea);
		if (!bAccept) {
			return that.returnFromMemberAreaAcceptCheck(oJqArea, false);
		}
			
		// Check for move above/before next cell
		
		// Do not allow a cell to be dropped on a direct predecessor area except if this area is a begin area.
		// If it is not a begin area that belongs to the block, the previous checks will already have failed,
		// so the order of the checks here in this function are important!
		bAccept = that.checkAreaMoveOnPreviousCell(oDragCell, oDropCell, oAnchorCell, sDragAxisName, bIsBeginArea);
		if (!bAccept) {
			return that.returnFromMemberAreaAcceptCheck(oJqArea, false);
		}
		
		// check for Hierarchy stuff: no move on logically previous peer in hierarchy, but move before a same level cell allowed if stuff expanded
		bAccept = that.checkAreaMoveOnPreviousHierarchyPeerOrBeginOfFollowing(oDragCell, oDropCell, oDropIndexLimits, sDragAxisName, bIsBeginArea);
		if (!bAccept) {
			return that.returnFromMemberAreaAcceptCheck(oJqArea, false);
		}
		
		return that.returnFromMemberAreaAcceptCheck(oJqArea, true);
	}
	
	this.getCommonDropCommand = function(oCoordinates, sCommand) {
		var oDragDropInfo;
		var iNewIndex;
		
		oDragDropInfo = sap.zen.Dispatcher.instance.getDragDropPayload().oDragDropInfo;
		
		if (oDragDropInfo.sAxisName === "ROWS") {
			iNewIndex = oCoordinates.row;
		} else if (oDragDropInfo.sAxisName === "COLS") {
			iNewIndex = oCoordinates.col;
		}
		
		sCommand = sCommand.replace("__AXIS__", oDragDropInfo.sAxisName);
		sCommand = sCommand.replace("__ROW__", oDragDropInfo.iMemberRow);
		sCommand = sCommand.replace("__COL__", oDragDropInfo.iMemberCol);
		sCommand = sCommand.replace("__NEW_INDEX__", iNewIndex);
		
		return sCommand;
	};
	
	function handleDropOnMemberCell(e, ui) {
		var oDropCell;
		var oCoordinates;
		var sCommand;

		if (oDragDropUtils.checkDropAllowedOnCrosstabElement(e)) {
			oDropCell = oDragDropHoverManager.getCellFromJqCell($(this));
			oDropCell = oDragDropUtils.getEffectiveCell(oDropCell);
			oCoordinates = oCrosstab.getUtils().translateCellCoordinatesForBackend(oDropCell);
			
			sCommand = that.getCommonDropCommand(oCoordinates, oDragDropCommands.swapmemberscommand);
			oCrosstab.getUtils().executeCommandAction(sCommand);
			
			oDragDropUtils.resetDragDrop();
		} else if (!oDragDropUtils.checkMouseInRenderSizeDiv(e)) {
			// mouse not in render size div, but we get a drop event.
			// this is a cell with rowspan/colspan that is cut off by the render size div
			// but is logically there. We need to handle that kind of drop as unhandled drop
			sap.zen.Dispatcher.instance.onUnhandledDrop(e, ui);
		}
	}
	
	function handleDropAreaDrop(e, ui) {
		var oAnchorCell;
		var oDragCell;
		var oDropCell;
		var oCoordinates;
		var sAreaType;
		var oDragDropInfo;
		var oDropIndexLimits;
		var sAxisName;
		var sCommand;
		var bBefore = false;
		
		if (oDragDropUtils.checkDropAllowedOnCrosstabElement(e)) {
			oDragDropInfo = sap.zen.Dispatcher.instance.getDragDropPayload().oDragDropInfo;
			oDropIndexLimits = oDragDropInfo.oDropIndexLimits;
			sAxisName = oDragDropInfo.sAxisName;
			
			oAnchorCell = sap.ui.getCore().getControl($(this).data("xtabcellid"));
			oDragCell = oDragDropUtils.getCrosstabHeaderCellFromDraggable($(ui.draggable));
			oDragCell = oDragDropUtils.getEffectiveCell(oDragCell);
			
			sAreaType = oDragDropUtils.getDropAreaTypeFromDropAreaId($(this).attr("id"));
			if (sAreaType === "droparea_above" || sAreaType === "droparea_before") {
				bBefore = true;
			}
			
			oDropCell = that.getDropCellFromAnchorCell(oAnchorCell, oDragCell, sAxisName, bBefore);
			oDropCell = oDragDropUtils.getEffectiveCell(oDropCell);
			
			if (that.isDropCellOneBelowOrBeforeBlock(oDropCell, oDropIndexLimits, sAxisName)) {
				bBefore = true;
				if (sAxisName === "ROWS") {
					oDropCell = oCrosstab.getRowHeaderArea().getCellWithRowSpan(oDropIndexLimits.iMinIndex, oDropCell.getCol());
				} else if (sAxisName === "COLS") {
					oDropCell = oCrosstab.getColumnHeaderArea().getCellWithColSpan(oDropCell.getRow(), oDropIndexLimits.iMinIndex);
				}
			}
			
			if (oDragCell.getLevel() !== oDropCell.getLevel()) {
				// this can only happen if D&D was allowed of a DragCell that moves in front of a same-level hierarchy by hitting the after/below area of some expanded stuff of a previous cell
				// In that case, take the next cell as the actual drop cell and make it a "before" drop for that cell
				oDropCell = that.getNextCell(oDropCell, sAxisName);
				bBefore = true;
			}
			

		
			oCoordinates = oCrosstab.getUtils().translateCellCoordinatesForBackend(oDropCell);
			sCommand = that.getCommonDropCommand(oCoordinates, oDragDropCommands.insertmembercommand);
			sCommand = sCommand.replace("__INSERT_BEFORE__", bBefore);
			oCrosstab.getUtils().executeCommandAction(sCommand);
			
			oDragDropUtils.resetDragDrop();
		} else if (!oDragDropUtils.checkMouseInRenderSizeDiv(e)) {
			// mouse not in render size div, but we get a drop event.
			// this is a cell with rowspan/colspan that is cut off by the render size div
			// but is logically there. We need to handle that kind of drop as unhandled drop
			sap.zen.Dispatcher.instance.onUnhandledDrop(e, ui);
		}
	}
			
	this.getLeftOfBeginCellInRowHeader = function(oRowHeaderArea, oCell) {
		var iStartCol;
		var iRow;
		var iCol;
		var oTempCell = oCell;
		var oRect;
		
		iStartCol = oCell.getCol();
		iCol = iStartCol;

		// look one line down to get the left alignment right according to spans!
		iRow = oCell.getRow();
		if (iRow < oRowHeaderArea.getRenderStartRow() + oRowHeaderArea.getRenderRowCnt() - 1) {
			iRow++;
		}
		
		while (oTempCell && iCol >= 0) {
			oTempCell = oRowHeaderArea.getCellWithColSpan(iRow, iCol);
			if (oTempCell) {
				oCell = oTempCell;
				iCol = oTempCell.getCol() - 1;
			} 
		}
		
		oRect = oDragDropUtils.getBoundingClientRect(document.getElementById(oCell.getId()));
		return oRect.begin;
	};
	
	this.getTopOfBeginCellInColHeader = function(oColHeaderArea, oCell) {
		var iStartRow;
		var iRow;
		var iCol;
		var oTempCell = oCell;
		var oRect;
		
		iStartRow = oCell.getRow();
		iRow = iStartRow;

		// look one cell to the right to get the left alignment right according to spans!
		iCol = oCell.getCol();
		if (iCol < oColHeaderArea.getRenderStartCol() + oColHeaderArea.getRenderColCnt() - 1) {
			iCol++;
		}
		
		while (oTempCell && iRow >= 0) {
			oTempCell = oColHeaderArea.getCellWithRowSpan(iRow, iCol);
			if (oTempCell) {
				oCell = oTempCell;
				iRow = oTempCell.getRow() - 1;
			} 
		}
		
		oRect = oDragDropUtils.getBoundingClientRect(document.getElementById(oCell.getId()));
		return oRect.top;
	};
	
	this.isRowContainsResultCell = function(oRowHeaderArea, iRow) {
		var i = 0;
		var oCell = null;
		
		for (i = 0; i < oRowHeaderArea.getColCnt(); i++) {
			oCell = oRowHeaderArea.getCellWithColSpan(iRow, i);
			if (oCell && oCell.isResult()) {
				return true;
			}
		}
		return false;
	};
	
	this.isColContainsResultCell = function(oColHeaderArea, iCol) {
		var i = 0;
		var oCell = null;
		
		for (i = 0; i < oColHeaderArea.getRowCnt(); i++) {
			oCell = oColHeaderArea.getCellWithRowSpan(i, iCol);
			if (oCell && oCell.isResult()) {
				return true;
			}
		}
		return false;
	}
	
	this.enableRowHeaderCellsAndAreas = function() {
		var iCol = 0;
		var iRow = 0;
		var iStartRow = 0;
		var iEndRow = 0;
		var oRowHeaderArea;
		var oCell;
		var oRect;
		var oJqArea;
		var oJqCell;
		var iFinestRowSpanCol;
		var bOnlyDraggable = false;
		var oDimInfo = null;
		var bRowContainsResultCell = false;
		var bIsResult = false;
		
		oRowHeaderArea = oCrosstab.getRowHeaderArea();
		if (!oCrosstab.hasRowHeaderArea() || (oRowHeaderArea && oRowHeaderArea.getRenderRowCnt() < 2)) {
			bOnlyDraggable = true;
		}
		
		if (oPivotCell) {
			iFinestRowSpanCol = oPivotCell.getTableCol() + oPivotCell.getColSpan() - 1;
			if (!oPivotCell.isSplitPivotCell() && oPivotCell.sScalingAxis === "ROWS") {
				iFinestRowSpanCol--;
			}
		} else {
			iFinestRowSpanCol = 0;
		}
				
		iStartRow = oRowHeaderArea.getRenderStartRow();
		iEndRow = iStartRow + oRowHeaderArea.getRenderRowCnt() - 1;
				
		for (iRow = iStartRow; iRow <= iEndRow; iRow++) {
			if (bIsRepeatTexts) {
				bRowContainsResultCell = this.isRowContainsResultCell(oRowHeaderArea, iRow);
			}
			for (iCol = 0; iCol <= iFinestRowSpanCol; iCol++) {
				oCell = oRowHeaderArea.getCellWithColSpan(iRow, iCol);
				if (!oCell && iRow === iStartRow) {
					// first cell might have a rowspan > 1 and start "before" visible area
					oCell = oRowHeaderArea.getCellWithRowSpan(iRow, iCol);
				}
				if (oCell) {
					if (bOnlyDraggable) {
						// only one row. Check if that is a valid dimension member to drag at all
						oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByCol(oCell.getTableCol());
						if (!oDimInfo) {
							return;
						}
					}
					oJqCell = $(document.getElementById(oCell.getId()));
					oRect = oDragDropUtils.getBoundingClientRect(oJqCell[0]);
					if (iCol === iFinestRowSpanCol && !bOnlyDraggable) {
						if (iRow === iStartRow && oRect.top >= oValidRowHeaderRect.top) {
							oMemberDropAreaAboveInfo.iEnd = 0;  // oRect.end
							oJqArea = oDragDropAreaRenderer.createAboveDropArea(oCell, oMemberDropAreaAboveInfo);
							oDragDropUtils.makeDropAreaDroppable(oJqArea, "sapzencrosstab-rowAboveCellMemberDropArea", checkMemberDropAreaAccept, handleDropAreaDrop);
						} 
						if (oRect.bottom <= oValidRowHeaderRect.bottom) {
							oMemberDropAreaBelowInfo.iEnd = 0; // oRect.end
							oMemberDropAreaBelowInfo.iBegin = this.getLeftOfBeginCellInRowHeader(oRowHeaderArea, oCell);
							oJqArea = oDragDropAreaRenderer.createBelowDropArea(oCell, oMemberDropAreaBelowInfo);
							oDragDropUtils.makeDropAreaDroppable(oJqArea, "sapzencrosstab-rowBelowCellMemberDropArea", checkMemberDropAreaAccept, handleDropAreaDrop);
						}
					}
					if (bIsRepeatTexts) {
						bIsResult = bRowContainsResultCell;
					} else {
						bIsResult = oCell.isResult();
					}
					if (!bIsResult && oRect.top < oValidRowHeaderRect.bottom) {
						oDragDropUtils.makeCellDraggable(oJqCell, memberCellDraggableHelper);
						if (!bOnlyDraggable) {
							oDragDropUtils.makeCellDroppable(oJqCell, checkMemberCellDropAccept, handleDropOnMemberCell);
						}
					}
				} 
			}
		}
	};
	
	this.enableColHeaderCellsAndAreas = function() {
		var iCol = 0;
		var iRow = 0;
		var iStartCol = 0;
		var oColHeaderArea;
		var oCell;
		var oRect;
		var oJqArea;
		var iEndCol = 0;
		var oJqCell;
		var iFinestColSpanRow;
		var bOnlyDraggable = false;
		var oDimInfo = null;
		var bColContainsResultCell = false;
		var bIsResult = false;
		var oResultLookUp = {};
		
		oColHeaderArea = oCrosstab.getColumnHeaderArea();
		if (!oCrosstab.hasColHeaderArea() || (oColHeaderArea && oColHeaderArea.getRenderColCnt() < 2)) {
			bOnlyDraggable = true;
		}
		
		if (oPivotCell) {
			iFinestColSpanRow = oPivotCell.getTableRow() + oPivotCell.getRowSpan() - 1;
			if (!oPivotCell.isSplitPivotCell() && oPivotCell.sScalingAxis === "COLS") {
				iFinestColSpanRow--;
			}
		} else {
			iFinestColSpanRow = 0;
		}
				
		iStartCol = oColHeaderArea.getRenderStartCol();
		iEndCol = iStartCol + oColHeaderArea.getRenderColCnt() - 1;
				
		for (iRow = 0; iRow <= iFinestColSpanRow; iRow++) {
			for (iCol = iStartCol; iCol <= iEndCol; iCol++) {
				if (bIsRepeatTexts) {
					if (typeof oResultLookUp[iCol] != "undefined") {
						bColContainsResultCell = oResultLookUp[iCol];
					} else {
						bColContainsResultCell = this.isColContainsResultCell(oColHeaderArea, iCol);
						oResultLookUp[iCol] = bColContainsResultCell;
					}
				}
				oCell = oColHeaderArea.getCellWithRowSpan(iRow, iCol);
				if (!oCell && iCol === iStartCol) {
					// first cell might have a colspan > 1 and start "before" visible area
					oCell = oColHeaderArea.getCellWithColSpan(iRow, iCol);
				}
				if (oCell) {
					if (bOnlyDraggable) {
						// only one column. Check if that is a valid dimension member to drag at all
						oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRow(oCell.getTableRow());
						if (!oDimInfo) {
							return;
						}
					}
					oJqCell = $(document.getElementById(oCell.getId()));
					oRect = oDragDropUtils.getBoundingClientRect(oJqCell[0]);
					if (iRow === iFinestColSpanRow && !bOnlyDraggable) {
						if (iCol === iStartCol && oRect.begin >= oValidColHeaderRect.begin) {
							oMemberDropAreaBeforeInfo.iBottom = 0; //oRect.bottom;
							oJqArea = oDragDropAreaRenderer.createBeforeDropArea(oCell, oMemberDropAreaBeforeInfo);
							oDragDropUtils.makeDropAreaDroppable(oJqArea, "sapzencrosstab-columnBeforeCellMemberDropArea", checkMemberDropAreaAccept, handleDropAreaDrop);
						} 
						if (oRect.end <= oValidColHeaderRect.end) {
							oMemberDropAreaAfterInfo.iBottom = 0; //oRect.bottom;
							oMemberDropAreaAfterInfo.iTop = this.getTopOfBeginCellInColHeader(oColHeaderArea, oCell);
							oJqArea = oDragDropAreaRenderer.createAfterDropArea(oCell, oMemberDropAreaAfterInfo);
							oDragDropUtils.makeDropAreaDroppable(oJqArea, "sapzencrosstab-columnAfterCellMemberDropArea", checkMemberDropAreaAccept, handleDropAreaDrop);
						}
					}
					if (bIsRepeatTexts) {
						bIsResult = bColContainsResultCell;
					} else {
						bIsResult = oCell.isResult();
					}
					if (!bIsResult && oRect.begin < oValidColHeaderRect.end) {
						oDragDropUtils.makeCellDraggable(oJqCell, memberCellDraggableHelper);
						if (!bOnlyDraggable) {
							oDragDropUtils.makeCellDroppable(oJqCell, checkMemberCellDropAccept, handleDropOnMemberCell);
						}
					}
				} 
			}
		}
	};
	
	this.enableMemberDragDrop = function() {	
		this.enableRowHeaderCellsAndAreas();
		this.enableColHeaderCellsAndAreas();
	};
	
	this.removeMember = function(e, ui, oDragDropInfo) {
		if (oDragDropInfo.bIsMemberDrag && oDragDropInfo.iMemberRow > -1 && oDragDropInfo.iMemberCol > -1 && !oDragDropInfo.bIsHierarchyMember) {
			var sCommand = oDragDropCommands.removemembercommand.replace("__AXIS__", oDragDropInfo.sAxisName);
			sCommand = sCommand.replace("__ROW__", oDragDropInfo.iMemberRow);
			sCommand = sCommand.replace("__COL__", oDragDropInfo.iMemberCol);
			oCrosstab.getUtils().executeCommandAction(sCommand);
		} else {
			sap.zen.Dispatcher.instance.setDragDropCanceled(true);
		}
	};

};
