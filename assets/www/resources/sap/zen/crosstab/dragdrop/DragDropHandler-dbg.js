jQuery.sap.declare("sap.zen.crosstab.dragdrop.DragDropHandler");
jQuery.sap.require("sap.zen.crosstab.dragdrop.DragDropUtils");
jQuery.sap.require("sap.zen.crosstab.dragdrop.DragDropAreaRenderer");
jQuery.sap.require("sap.zen.crosstab.dragdrop.DragDropHoverManager");
jQuery.sap.require("sap.zen.crosstab.dragdrop.MemberDragDropHandler");
jQuery.sap.require("sap.zen.crosstab.TextConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");


sap.zen.crosstab.dragdrop.DragDropHandler = function (oCrosstab, oDragDropCommands) {
	"use strict";
	
	var that = this;
	var oDragDropUtils;
	var oDragDropAreaRenderer;
	var oDragDropHoverManager;
	var oMemberDragDropHandler;
	var oPivotCell;
		
	this.initDragDrop = function(bFromScrolling) {
		var bIsMemberDragDropEnabled = oDragDropCommands.insertmembercommand && oDragDropCommands.insertmembercommand.length > 0;
		
		sap.zen.Dispatcher.instance.registerUnhandledDropHandler(oCrosstab.getId(), oCrosstab.onUnhandledDrop);
		sap.zen.Dispatcher.instance.registerDragDropCancelHandler(oCrosstab.getId(), oCrosstab.onEscKeyPressed);

		// This is necessary in case the rendersizeDiv is smaller than the overall crosstab div!
		// Otherwise, removal of dimensions or members will not work when dragging out of the visible area of the crosstab
		this.registerCrosstabAsDropHandler();
		
		oDragDropHoverManager = new sap.zen.crosstab.dragdrop.DragDropHoverManager(oCrosstab);
		oDragDropUtils = new sap.zen.crosstab.dragdrop.DragDropUtils(oCrosstab);
		oDragDropAreaRenderer = new sap.zen.crosstab.dragdrop.DragDropAreaRenderer(oCrosstab);
		if (bIsMemberDragDropEnabled) {
			oMemberDragDropHandler = new sap.zen.crosstab.dragdrop.MemberDragDropHandler(oCrosstab, oDragDropCommands, oDragDropUtils, oDragDropAreaRenderer, oDragDropHoverManager);
		}
		
		oPivotCell = oCrosstab.getHeaderInfo().setupPivotCell();
		// Pivot cell may be null.
		// Member drag/drop must work even without a pivot cell, e. g. if there
		// is just the measure structure in the crosstab
		oDragDropHoverManager.init(oDragDropUtils);
		oDragDropUtils.init(oDragDropHoverManager);
		oDragDropAreaRenderer.init(oPivotCell, oDragDropUtils);
		if (bIsMemberDragDropEnabled) {
			oMemberDragDropHandler.init(oPivotCell);
		}
			
		if (oPivotCell) {
			this.enableDimHeaderNonPivotCells();
			this.enableDimHeaderPivotCell();
			
			// determine and enable drop areas for all cells, including the pivot cell
			if (!bFromScrolling) {
				oDragDropAreaRenderer.renderDimHeaderDropAreas();
				this.enableDimHeaderDropAreas();
			}	
		}
		
		this.addExternalDimensionDropAreasIfOnlyMeasures();
	};
	
	this.addExternalDimensionDropAreasIfOnlyMeasures = function() {
		var oCell;
		var oAreas;
		
		oDragDropUtils.setOnlyMeasuresMode(false);
		if (sap.zen.crosstab.utils.Utils.isDispatcherAvailable()) {
			if (sap.zen.Dispatcher.instance.isInterComponentDragDropEnabled() && oCrosstab.getHeaderInfo().hasOnlyMeasureStructure()) {
				oDragDropUtils.setOnlyMeasuresMode(true);
				// add dimension drop areas to be able to drag dimensions into the Crosstab from the outside
				oCell = oCrosstab.getTableCell(0, 0);
				if (oCell) {
					oAreas = oDragDropAreaRenderer.createExternalDimDropAreasForMemberCell(oCell);
					this.makeAboveAreaDroppable(oAreas.oJqAboveArea, "sapzencrosstab-rowAboveCellDropArea");
					this.makeBeforeAreaDroppable(oAreas.oJqBeforeArea, "sapzencrosstab-columnBeforeCellDropArea");
				}
			}
		}
	};
	
	this.returnFromDimHeaderDropAccept = function(oCell, bAccept, bCellRevert) {
		oCell.setRevertDrop(bCellRevert);
		sap.zen.Dispatcher.instance.setDropAccepted(oCell.getId(), bAccept);
		return bAccept;
	};
	
	function checkDimHeaderDropAccept(oDraggable) {
		var oPayload;
		var oDragDropInfo;
		var oDimInfo;
		var oCell;
		
		oCell = oDragDropHoverManager.getCellFromJqCell(this);
		oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();
		
		if (oCrosstab.isBlocked() || !oPayload || oPayload && oPayload.oDragDropInfo.bIsMemberDrag) {
			return that.returnFromDimHeaderDropAccept(oCell, false, true);
		}
		
		// do not accept drop from external source if the dimension is already in the Crosstab
		if (!oDragDropUtils.checkAcceptExternalDimension(oPayload)) {
			return that.returnFromDimHeaderDropAccept(oCell, false, true);
		}
		
		// in case of header scrolling do not accept drop on invisible cells but let it
		// go through to unhandled drop for dimension removal
		if (!oDragDropUtils.checkDroppableInArea($(this), oDragDropUtils.determineValidHeaderRect())) {
			return that.returnFromDimHeaderDropAccept(oCell, false, false);
		} 
		
		// "this" is bound to droppable			
		oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRowCol(oCell);
		
		if (oDragDropUtils.isExternalDropOnNonRemovableStructure(oDimInfo, oPayload)) {
			// would lead to exchanging measure structure with something else, effectively removing the measure
			// structure and hence yielding an invalid state
			return that.returnFromDimHeaderDropAccept(oCell, false, true);
		}

		if (oDragDropUtils.isDragFromOtherCrosstab(oPayload)) {
			return that.returnFromDimHeaderDropAccept(oCell, false, true);
		}

		if (!oDragDropUtils.checkAcceptCrossComponent(oPayload)) {
			return that.returnFromDimHeaderDropAccept(oCell, false, true);
		}

		if (oPayload.oDragDropInfo) {
			oDragDropInfo = oPayload.oDragDropInfo;
			if (oDimInfo.sDimensionName === oDragDropInfo.sDimensionName) {
				return that.returnFromDimHeaderDropAccept(oCell, false, true);
			}
		} else {
			return that.returnFromDimHeaderDropAccept(oCell, false, true);
		}
					
		return that.returnFromDimHeaderDropAccept(oCell, true, false);
	}
	
	function handleDimHeaderDrop(e, ui) {
    	var sSourceDimensionName;
    	var oDimInfo;
    	var sDestinationDimensionName;
    	var oDropCell;
    	var oPayload;   	
    	
    	if (oDragDropUtils.checkDropAllowedOnCrosstabElement(e)) {
	    	oPayload = sap.zen.Dispatcher.instance.getDragDropPayload();  
	    	if (oPayload && oPayload.oDragDropInfo) {
		    	// "this" is bound to droppable
	    		oDropCell = oDragDropHoverManager.getCellFromJqCell(this);
	    		sSourceDimensionName = oPayload.oDragDropInfo.sDimensionName;
		    	oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRowCol(oDropCell);
		    	sDestinationDimensionName = oDimInfo.sDimensionName;
		    	
		    	if (sSourceDimensionName && sSourceDimensionName.length > 0 && sDestinationDimensionName && sDestinationDimensionName.length > 0) {
		    		if (sSourceDimensionName !== sDestinationDimensionName) {
		    			var sCommand = oDragDropCommands.swapdimensionscommand.replace("__DIMENSION_NAME__", sSourceDimensionName);
		    			sCommand = sCommand.replace("__WITH_DIMENSION_NAME__", sDestinationDimensionName);
		    			oCrosstab.getUtils().executeCommandAction(sCommand);
		    		}
		    	}
	    	}
	    	// for all drops including from other components where "STOP" does not get called
	    	oDragDropUtils.resetDragDrop();
    	}
	}
			
	this.getTextForDragGhostCell = function(oCell, oDimInfo, sMeasureStructureText) {
		var sText = null;
		var oSplitDimInfo;
		
		if (oDimInfo.bIsMeasureStructure === true) {
			sText = sMeasureStructureText;
		} else {
			if (oCell.isSplitPivotCell() === true) {
				if (oDimInfo.sAxisName === "ROWS") {
					oSplitDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByCol(oCell.getTableCol());
				} else if (oDimInfo.sAxisName === "COLS") {
					oSplitDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRow(oCell.getTableRow());
				}
				if (oSplitDimInfo) {
					if (oSplitDimInfo.sAttributeName) {
						sText = oSplitDimInfo.sAttributeText;
					} else {
						sText = oSplitDimInfo.sDimensionText;
					}
				} else {
					sText = oCell.getText();
				}
			} else {
				sText = oCell.getText();
			}
		}
		
		if (!sText || sText && sText.length === 0) {
			sText = oDimInfo.sDimensionText;
		}
		return sText;
	};
	
	this.getDragGhostCellHtml = function(oCell, oDimInfo, sMeasureStructureText) {
		var sText;
		var oJqCell;
		var oJqCellLayoutDiv;
		var iWidth;
		var sHtml;
		var sWidthPart;
		
		oJqCell = $(document.getElementById(oCell.getId()));
		
		if (!oDimInfo.bIsStructure) {
			oJqCellLayoutDiv = $(document.getElementById(oCell.getId() + "_cellLayoutDiv"));
			iWidth = oJqCellLayoutDiv.outerWidth();
			sWidthPart = iWidth + "px";
		} else {
			sWidthPart = "100%";
		}
		
		sText = this.getTextForDragGhostCell(oCell, oDimInfo, sMeasureStructureText);
		
		sHtml = "<td class=\"" + oJqCell.attr("class") + " sapzencrosstab-DragHeaderCell" + "\">";
		sHtml += "<div style=\"width: " + sWidthPart + "\">" + sText + "</div></td>";
		
		return sHtml;
	};
		
	this.createDimHeaderCellDragObject = function(aDragCells, oDimInfo) {
		var oJqHelper = null;
		var sText = null;
		var i = 0;
		var oCell;
		var sHtml;
		var sMeasureStructureText;
		var iLength;
		var oSplitDimInfo;
		var iWidth;
		var iHeight;
		var oPayload;
		
		if (oDimInfo.bIsMeasureStructure === true) {		
			sMeasureStructureText = oCrosstab.getPropertyBag().getText(sap.zen.crosstab.TextConstants.MEASURE_STRUCTURE_TEXT_KEY);
			iLength = 1;
		} else {
			iLength = aDragCells.length;
		}
		
		sHtml = "<table id=\"" + oCrosstab.getId() + "_dragghost\" style=\"z-index: 9999;border-collapse: collapse\" class=\"sapzencrosstab-DimensionHeaderArea\"><tbody>";
		
		sHtml += oDragDropUtils.getDeleteDragGhostCellRowHtml(oDimInfo.sAxisName === "ROWS" ? aDragCells.length : 1);
		
	
		if (oDimInfo.sAxisName === "ROWS") {
			oCell = aDragCells[0];
			iHeight = $(document.getElementById(oCell.getId())).outerHeight();
			sHtml += "<tr style=\"height: " + iHeight + "px\">";
			
			for (i = 0; i < iLength; i++) {
				oCell = aDragCells[i];		
				sHtml += this.getDragGhostCellHtml(oCell, oDimInfo, sMeasureStructureText);	
			}
			
			sHtml += "</tr>";
		} else if (oDimInfo.sAxisName === "COLS") {
			for (i = 0; i < iLength; i++) {
				oCell = aDragCells[i];
				
				iHeight = $(document.getElementById(oCell.getId())).outerHeight();
				sHtml += "<tr style=\"height: " + iHeight + "px\">";
				sHtml += this.getDragGhostCellHtml(oCell, oDimInfo, sMeasureStructureText);
				
				sHtml += "</tr>";
			}
		}
		
		sHtml += "</tbody></table>";
				
		oJqHelper = $(sHtml);

		oPayload = sap.zen.Dispatcher.instance.createDragDropPayload(oCrosstab.getId());
		oPayload.oDragDropInfo = oDragDropUtils.buildDimensionDragDropInfo(oDimInfo);
		sap.zen.Dispatcher.instance.setDragDropPayload(oPayload);
		
		oCrosstab.setDragAction(true);
		return oJqHelper;
	};
		
	function dimHeaderCellDraggableHelper(e) {
		var oCell;
		var oJqHelper;
		var oDimInfo;
		var oDimInfo2;
		var sText;
		var aDragCells = [];
		
		// "this" is bound to draggable
		oCell = oDragDropHoverManager.getCellFromJqCell(this);
		if (oCell) {
			oDragDropUtils.setCurrentJqDragCell($(this));
			oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRowCol(oCell);
			aDragCells = oCrosstab.getHeaderInfo().getCellsWithSameDimension(oCell);	
			oDragDropUtils.saveRevertCellPosInfo(oCell, aDragCells);
			oJqHelper = that.createDimHeaderCellDragObject(aDragCells, oDimInfo);
			oDragDropUtils.setCursorAt(oCell, oJqHelper);
		}
		return oJqHelper;
	}
					
	this.makeAboveAreaDroppable = function(oJqAboveArea, sCssClass) {
		var oAreaInfo = oDragDropUtils.getAreaInfo(oJqAboveArea);
		
		var fHandleAboveAreaDrop = function(e, ui) {
			var oCellInfo;
			
			if (oDragDropUtils.checkDropAllowedOnCrosstabElement(e))  {
				if (oDragDropUtils.isOnlyMeasuresMode() === true) {
					oCellInfo = {};
					oCellInfo.sDragDimensionName = oDragDropUtils.getDimensionNameDromDragDropPayload();
					oCellInfo.sDropAxisName = "COLS";
					oCellInfo.iDropAxisIndex = 0;
				} else {
					oCellInfo = oDragDropUtils.getCellInfoFromDropArea(e, "droparea_above");
					if (oCellInfo) {
						if (oCellInfo.sDropAxisName === "ROWS" && oCrosstab.getTableMaxDimHeaderRow() === 0) {
							oCellInfo.sDropAxisName = "COLS";
							oCellInfo.iDropAxisIndex = 0;
						}
						
					}
				}
				if (oCellInfo) {
					that.sendInsertDimensionCommand(oCellInfo);
				}
				oDragDropUtils.resetDragDrop();
			}
		};
		
		var fCheckAboveAreaAccept = function(oDraggable) {
			return oDragDropUtils.checkGenericDimMoveToAreasAccept(oJqAboveArea, oDraggable, oAreaInfo.oDimInfo, oAreaInfo.oCell, "droparea_above", false); 
		};
		
		oDragDropUtils.makeDropAreaDroppable(oJqAboveArea, sCssClass, fCheckAboveAreaAccept, fHandleAboveAreaDrop);
	};
	
	this.makeBelowAreaDroppable = function(oJqBelowArea, sCssClass) {
		var oAreaInfo = oDragDropUtils.getAreaInfo(oJqBelowArea);
		
		var fHandleBelowAreaDrop = function(e, ui) {
			var oCellInfo;
			
			if (oDragDropUtils.checkDropAllowedOnCrosstabElement(e)) {
				oCellInfo = oDragDropUtils.getCellInfoFromDropArea(e, "droparea_below");
				if (oCellInfo) {
					if (oCellInfo.bDropCellIsBottomRight === true) {
						oCellInfo.sDropAxisName = "COLS";
						oCellInfo.iDropAxisIndex = oCrosstab.getHeaderInfo().getNumberOfDimensionsOnColsAxis();
					} else {
						oCellInfo.iDropAxisIndex++;
					}
					that.sendInsertDimensionCommand(oCellInfo);
				}
				oDragDropUtils.resetDragDrop();
			}
		};
		
		var fCheckBelowAreaAccept = function(oDraggable) {
			return oDragDropUtils.checkGenericDimMoveToAreasAccept(oJqBelowArea, oDraggable, oAreaInfo.oDimInfo, oAreaInfo.oCell, "droparea_below", false); 
		};
		
		oDragDropUtils.makeDropAreaDroppable(oJqBelowArea, sCssClass, fCheckBelowAreaAccept, fHandleBelowAreaDrop);
	};
	
	this.makeBeforeAreaDroppable = function(oJqBeforeArea, sCssClass) {
		var oAreaInfo = oDragDropUtils.getAreaInfo(oJqBeforeArea);
				
		var fHandleBeforeAreaDrop = function(e, ui) {
			var oCellInfo;
			
			if (oDragDropUtils.checkDropAllowedOnCrosstabElement(e)) {
				if (oDragDropUtils.isOnlyMeasuresMode() === true) {
					oCellInfo = {};
					oCellInfo.sDragDimensionName = oDragDropUtils.getDimensionNameDromDragDropPayload();
					oCellInfo.sDropAxisName = "ROWS";
					oCellInfo.iDropAxisIndex = 0;
				} else {
					oCellInfo = oDragDropUtils.getCellInfoFromDropArea(e, "droparea_before");
					if (oCellInfo) {
						if (oCellInfo.sDropAxisName === "COLS" && oCrosstab.getTableMaxDimHeaderCol() === 0) {
							oCellInfo.sDropAxisName = "ROWS";
							oCellInfo.iDropAxisIndex = 0;
						}
							
					}
				}
				if (oCellInfo) {
					that.sendInsertDimensionCommand(oCellInfo);
				}
				oDragDropUtils.resetDragDrop();
			}
		};
		
		var fCheckBeforeAreaAccept = function(oDraggable) {
			return oDragDropUtils.checkGenericDimMoveToAreasAccept(oJqBeforeArea, oDraggable, oAreaInfo.oDimInfo, oAreaInfo.oCell, "droparea_before", false); 
		};
			
		oDragDropUtils.makeDropAreaDroppable(oJqBeforeArea, sCssClass, fCheckBeforeAreaAccept, fHandleBeforeAreaDrop);
	};
	
	this.makeAfterAreaDroppable = function(oJqAfterArea, sCssClass) {
		var oAreaInfo = oDragDropUtils.getAreaInfo(oJqAfterArea);
		
		var fHandleAfterAreaDrop = function(e, ui) {
			var oCellInfo;
			
			if (oDragDropUtils.checkDropAllowedOnCrosstabElement(e)) {
				oCellInfo = oDragDropUtils.getCellInfoFromDropArea(e, "droparea_after");
				if (oCellInfo) {
					if (oCellInfo.bDropCellIsBottomRight === true) {
						oCellInfo.sDropAxisName = "ROWS";
						oCellInfo.iDropAxisIndex = oCrosstab.getHeaderInfo().getNumberOfDimensionsOnRowsAxis();
					} else {
						oCellInfo.iDropAxisIndex++;
					}
					that.sendInsertDimensionCommand(oCellInfo);
				}
				oDragDropUtils.resetDragDrop();
			}
		};
		
		var fCheckAfterAreaAccept = function(oDraggable) {
			var result = oDragDropUtils.checkGenericDimMoveToAreasAccept(oJqAfterArea, oDraggable, oAreaInfo.oDimInfo, oAreaInfo.oCell, "droparea_after", true);
			return result;
		};
		
		oDragDropUtils.makeDropAreaDroppable(oJqAfterArea, sCssClass, fCheckAfterAreaAccept, fHandleAfterAreaDrop);
	};
	
	this.enableDimHeaderDropAreas = function() {
		var oJqCrosstab = $(document.getElementById(oCrosstab.getId()));
		var sCssClass = null;
		var aBeforeAreas = null;
		var aAfterAreas = null;
		var aAfterAreasWithSort = null;
		var aAboveAreas = null;
		var aBelowAreas = null;
		
		sCssClass = "sapzencrosstab-columnBeforeCellDropArea";
		aBeforeAreas = oJqCrosstab.find("." + sCssClass);
		$.each(aBeforeAreas, function(index, oDomBeforeArea) {
			that.makeBeforeAreaDroppable($(oDomBeforeArea), sCssClass);
		});
		
		sCssClass = "sapzencrosstab-columnAfterCellDropArea";
		aAfterAreas = oJqCrosstab.find("." + sCssClass);
		$.each(aAfterAreas, function(index, oDomAfterArea) {
			that.makeAfterAreaDroppable($(oDomAfterArea), sCssClass);
		});
		
		sCssClass = "sapzencrosstab-columnAfterCellDropAreaWithSort";
		aAfterAreasWithSort = oJqCrosstab.find("." + sCssClass);
		$.each(aAfterAreasWithSort, function(index, oDomAfterAreaWithSort) {
			that.makeAfterAreaDroppable($(oDomAfterAreaWithSort), sCssClass);
		});
		
		sCssClass = "sapzencrosstab-rowAboveCellDropArea";
		aAboveAreas = oJqCrosstab.find("." + sCssClass);
		$.each(aAboveAreas, function(index, oDomAboveArea) {
			that.makeAboveAreaDroppable($(oDomAboveArea), sCssClass);
		});
		
		sCssClass = "sapzencrosstab-rowBelowCellDropArea";
		aBelowAreas = oJqCrosstab.find("." + sCssClass);
		$.each(aBelowAreas, function(index, oDomBelowArea) {
			that.makeBelowAreaDroppable($(oDomBelowArea), sCssClass);
		});
	};
	
	this.getPivotCellAreaFromMouseCoordinates = function(e, oCell) {
		var sArea = null;
		var oDomDragArea = document.getElementById(oCell.getId() + "_dragarea_cols");
		var oRect = oDomDragArea.getBoundingClientRect();
		
		var iX = e.clientX - oRect.left;
		var iY = e.clientY - oRect.top;
		var iBorderLineY = iX * oRect.height / oRect.width;
		
		if (oCrosstab.getPropertyBag().isRtl()) {
			iBorderLineY = oRect.height - iBorderLineY; 
		} 
		
		iY > iBorderLineY ? sArea = "ROWS" : sArea = "COLS";
				
		return sArea;
	};
	
	function pivotCellDraggableHelper(e) {
		var sArea;
		var iCol;
		var iRow;
		var aCells = null;
		var oDimInfo;
		var oJqHelper;
		var oCell;
		
		oCell = oDragDropHoverManager.getCellFromJqCell(this);
		iCol = oCell.getTableCol();
		iRow = oCell.getTableRow();
		sArea = that.getPivotCellAreaFromMouseCoordinates(e, oCell);
		if (sArea === "ROWS") {
			oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByCol(iCol);
		} else if (sArea === "COLS") {
			oDimInfo = oCrosstab.getHeaderInfo().getDimensionInfoByRow(iRow);
		}
		
		aCells = oCrosstab.getHeaderInfo().getCellsWithSameDimensionByDimInfo(oDimInfo);
		oDragDropUtils.saveRevertCellPosInfo(oCell, aCells, sArea);
		oJqHelper = that.createDimHeaderCellDragObject(aCells, oDimInfo);
		oDragDropUtils.setCursorAt(oCell, oJqHelper);
		
		return oJqHelper;
	}
	
	this.makeSplitPivotCellDraggable = function(oCell, oJqCell) {
		oDragDropAreaRenderer.renderSplitPivotCellDragAreas(oCell, oJqCell);	
		oDragDropUtils.makeCellDraggable(oJqCell, pivotCellDraggableHelper);
	};
	
	this.enableDimHeaderNonPivotCells = function() {
		var iRow = 0;
		var iCol = 0;
		var iMaxRow = oPivotCell.getTableRow();
		var iMaxCol = oPivotCell.getTableCol();
		var oCell = null;
		var iDimHeaderColCnt = oCrosstab.getDimensionHeaderArea().getColCnt();
		var iDimHeaderRowCnt = oCrosstab.getDimensionHeaderArea().getRowCnt();
		var oJqCell = null;
		
		// Handle all dimension header cells except the pivot cell
		// last row
		while (iCol < iMaxCol) {
			oCell = oCrosstab.getTableCellWithColSpan(iMaxRow, iCol);
			if (oCell) {
				oJqCell = $(document.getElementById(oCell.getId()));
				oDragDropUtils.makeCellDraggable(oJqCell, dimHeaderCellDraggableHelper);
				oDragDropUtils.makeCellDroppable(oJqCell, checkDimHeaderDropAccept, handleDimHeaderDrop);
				iCol = iCol + oCell.getColSpan();
			}
		}
		// last col
		while (iRow < iMaxRow) {
			oCell = oCrosstab.getTableCellWithRowSpan(iRow, iMaxCol);
			if (oCell) {
				oJqCell = $(document.getElementById(oCell.getId()));
				oDragDropUtils.makeCellDraggable(oJqCell, dimHeaderCellDraggableHelper);
				oDragDropUtils.makeCellDroppable(oJqCell, checkDimHeaderDropAccept, handleDimHeaderDrop);
				iRow = iRow + oCell.getRowSpan();
			}
		}
	};
	
	this.isNonSplitPivotCellDragDropEnabled = function() {
		var bEnableDragDrop = true;

		if (oPivotCell && !oPivotCell.isSplitPivotCell()) {
			if (oPivotCell.getScalingAxis() === "COLS") {
				bEnableDragDrop = oCrosstab.getHeaderInfo().hasDimensionsOnRowsAxis();
			} else if (oPivotCell.getScalingAxis() === "ROWS") {
				bEnableDragDrop = oCrosstab.getHeaderInfo().hasDimensionsOnColsAxis();
			}
		}
		
		return bEnableDragDrop;
	};
	
	this.enableDimHeaderPivotCell = function() {
		var oJqCell;
		if (oPivotCell) {
			oJqCell = $(document.getElementById(oPivotCell.getId()));	
			if (oPivotCell.isPivotCell() === true && oPivotCell.isSplitPivotCell() === true) {
				// split pivot cell is not droppable but may need split drag areas
				this.makeSplitPivotCellDraggable(oPivotCell, oJqCell);
			} else {
				if (this.isNonSplitPivotCellDragDropEnabled()) {
					oDragDropUtils.makeCellDraggable(oJqCell, dimHeaderCellDraggableHelper);
					oDragDropUtils.makeCellDroppable(oJqCell, checkDimHeaderDropAccept, handleDimHeaderDrop);
				}
			}
		}
	};
	
	this.onUnhandledDrop = function (e, ui, oPayload) {
		var oDragDropInfo;
		var bIsStructure = false;
		var bIsRemoveStructureAllowed = false;
		
		if (sap.zen.Dispatcher.instance.isDragDropCanceled()) {
			return;
		}
		
		if (!oPayload) {
			sap.zen.Dispatcher.instance.setDragDropCanceled(true);
			return;
		}
		
		if (oDragDropUtils.checkMouseInRenderSizeDiv(e) === true) {
			// unhandled drop but within crosstab, i. e. on a non-droppable Crosstab element => cancel drag/drop
			sap.zen.Dispatcher.instance.setDragDropCanceled(true);
		} else {
			oDragDropInfo = oPayload.oDragDropInfo;
			if (oDragDropInfo.bIsMemberDrag) {
				// Member drop
				oMemberDragDropHandler.removeMember(e, ui, oDragDropInfo);
			} else {
				// Dimension drop
				bIsStructure = oDragDropInfo.bIsStructure;
				bIsRemoveStructureAllowed = oDragDropInfo.bIsRemoveStructureAllowed;
				if (bIsStructure && !bIsRemoveStructureAllowed) {
					// Dropped inside Crosstab on element which is not a droppable -> cancel, no drop action
					sap.zen.Dispatcher.instance.setDragDropCanceled(true);
				} else {
					if (oDragDropInfo.sDimensionName && oDragDropInfo.sDimensionName.length > 0) {
						var sCommand = oDragDropCommands.removedimensioncommand.replace("__DIMENSION_NAME__", oDragDropInfo.sDimensionName);
						oCrosstab.getUtils().executeCommandAction(sCommand);
					} else {
						sap.zen.Dispatcher.instance.setDragDropCanceled(true);
					}
				}
			}
		}
	};
	
	this.onEscKeyPressed = function() {
		var oJqCell;
			
		sap.zen.Dispatcher.instance.setDragDropCanceled(true);
		oJqCell = oDragDropUtils.getCurrentJqDragCell();
		if (oJqCell) {
			// in case it is an own draggable from the Crosstab
			oJqCell.draggable().trigger("mouseup");
		} else {
			// otherwise carried out by "stop" event triggered by mouseup
			oDragDropUtils.resetDragDrop();
		}
		oDragDropHoverManager.cleanupDropCells();
		oDragDropHoverManager.cleanupDropAreas();
	};
		
	this.repositionDropAreasForHeaderScrolling = function() {
		oDragDropAreaRenderer.repositionDropAreasForHeaderScrolling();
	};
	
	this.sendInsertDimensionCommand = function(oCellInfo) {
		var sCommand = oDragDropCommands.insertdimensioncommand;
		if (oCellInfo && sCommand && sCommand.length > 0) {
			sCommand = sCommand.replace("__DIMENSION_NAME__", oCellInfo.sDragDimensionName);
			sCommand = sCommand.replace("__AXIS__", oCellInfo.sDropAxisName);
			sCommand = sCommand.replace("__AXIS_INDEX__", oCellInfo.iDropAxisIndex);
			oCrosstab.getUtils().executeCommandAction(sCommand);
		}
	};

	this.registerCrosstabAsDropHandler = function() {
		var oJqCrosstabDiv;
		
		oJqCrosstabDiv = $(document.getElementById(oCrosstab.getId()));
		if (!oJqCrosstabDiv.hasClass("ui-droppable")) {
			oJqCrosstabDiv.droppable({
				greedy: true,

				accept: function (oDraggable) {
					return true;
				},

				drop: function (e, ui) {
					if (!e.buttons) {
						sap.zen.Dispatcher.instance.onUnhandledDrop(e, ui);
					}
				}
			});
		}
	};	
}
