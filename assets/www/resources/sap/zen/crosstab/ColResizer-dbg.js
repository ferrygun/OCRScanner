jQuery.sap.declare("sap.zen.crosstab.ColResizer");

sap.zen.crosstab.ColResizer = function (oCrosstab) {
	"use strict";
	
	var that = this;
	var oDataArea = oCrosstab.getDataArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	
	var oResizeCell = null;
	var oResizeCellRect = null;
	var oRenderSizeDivRect = null;
	
	var oJqResizeRuler = null;
	var oJqTableDiv = null;
	var oJqRenderSizeDiv = null;
	
	var iMouseDownX = 0;
	var iRulerX = 0;
	var bRulerVisible = false;
	
	var oUtils;
	
	var bIsRtl = false;
	
	/**
	 * initialize
	 */
	this.initialize = function() {
		oUtils = oCrosstab.getUtils();
		bIsRtl = oCrosstab.getPropertyBag().isRtl();
		oJqTableDiv = oCrosstab.getTableDiv();
		oJqRenderSizeDiv = oCrosstab.getRenderSizeDiv();
		oRenderSizeDivRect = oUtils.getRtlAwareBoundingClientRect(oJqRenderSizeDiv[0]);
		oJqResizeRuler = $(document.getElementById(oCrosstab.getId() + "_colResizeRuler"));
		
		this.attachEvents();
	};
	
	/**
	 * attachEvents
	 */
	this.attachEvents = function() {		
		oJqTableDiv.unbind("dblclick");
		oJqTableDiv.bind("dblclick", this.onDoubleClick);
		
		oJqResizeRuler.unbind("mousemove", this.onMouseMove);
		oJqResizeRuler.bind("mousemove", this.onMouseMove);	
				
		var aResizers = oJqTableDiv.find(".sapzencrosstab-columnResizeHandleWithSort, .sapzencrosstab-columnResizeHandle");
		$.each(aResizers, function(iIndex, oDomResizer) {
			var oJqResizer = $(oDomResizer);
			oJqResizer.unbind("mousedown", that.onMouseDown);
			oJqResizer.bind("mousedown", that.onMouseDown);
			
			oJqResizer.unbind("mouseup", that.executeonMouseUp);
			oJqResizer.bind("mouseup", that.executeonMouseUp);
			
			oJqResizer.unbind("mousemove", that.onMouseMove);
			oJqResizer.bind("mousemove", that.onMouseMove);					
		});
	};
	
	/**
	 * onDoubleClick
	 */	
	this.onDoubleClick = function(e) {
		that.determineResizeCell(e, true);
		if (oResizeCell) {
			that.resizeCol(oResizeCell, -1);
			oResizeCell = null;
			
			// handled
			sap.zen.crosstab.utils.Utils.cancelEvent(e);
		}
	};
	
	/**
	 * onMouseUp
	 */	
	this.onMouseUp = function(e) {
		var iNewColWidth;
		
		if (oResizeCell && oResizeCellRect) {
			iNewColWidth = that.calculateNewColWidth(e);
			if (iNewColWidth > 0) {
				that.resizeCol(oResizeCell, iNewColWidth);
			}
			
			// cleanup
			oResizeCell = null;
			oResizeCellRect = null;
			oJqResizeRuler.css("visibility", "hidden");
			bRulerVisible = false;
			$(document).off("mouseup", that.onMouseUp);
			
			// handled
			sap.zen.crosstab.utils.Utils.cancelEvent(e);
		}
	};
	
	/**
	 * onMouseDown
	 */	
	this.onMouseDown = function(e) {
		if (!oResizeCell) {
			that.determineResizeCell(e);
			if (oResizeCell) {
				oResizeCellRect = oUtils.getRtlAwareBoundingClientRect(document.getElementById(oResizeCell.getId()));
				
				iMouseDownX = e.clientX;

				// show ruler
				oJqResizeRuler.outerHeight(oJqRenderSizeDiv.outerHeight());
				iRulerX = oResizeCellRect.end - oJqResizeRuler.outerWidth() - oRenderSizeDivRect.begin;
				oJqResizeRuler.css(bIsRtl ? "right" : "left", iRulerX + "px");
				$(document).on("mouseup", that.onMouseUp);
				
				// handled
				sap.zen.crosstab.utils.Utils.cancelEvent(e);
			}
		}
	};
	
	/**
	 * onMouseMove
	 */	
	this.onMouseMove = function(e) {
		var iCurrentRulerX;
		
		if (oResizeCell && oResizeCellRect) {
			iCurrentRulerX = iRulerX + that.getDelta(e);
			if (iCurrentRulerX !== iRulerX) {
				iCurrentRulerX = Math.max(iCurrentRulerX, (oResizeCellRect.begin - oRenderSizeDivRect.begin));
				if (!bRulerVisible) {
					oJqResizeRuler.css("visibility", "visible");
					bRulerVisible = true;
				}
				oJqResizeRuler.css(bIsRtl ? "right" : "left", iCurrentRulerX + "px");
			}
			
			// handled
			sap.zen.crosstab.utils.Utils.cancelEvent(e);
		}
	};
	
	/**
	 * isResizeAction
	 */	
	this.isResizeAction = function() {
		if (oResizeCell && oResizeCellRect) {
			return true;
		}
		return false;
	};

	/**
	 * determineResizeCell
	 */	
	this.determineResizeCell = function(e, bIsDoubleClick) {
		var iLastCol;
		var oArea;
		
		oResizeCell = sap.ui.getCore().byId(e.target.id.slice(5));
		
		// get cell with finest granularity in Area
		if (!bIsDoubleClick && oResizeCell.getColSpan() > 1) {
			iLastCol = oResizeCell.getCol() + oResizeCell.getColSpan() - 1;
			oArea = oResizeCell.getArea();
			oResizeCell = oArea.getCellWithColSpan(oArea.getRowCnt() - 1, iLastCol);
			if (!oResizeCell) {
				oResizeCell = oArea.getCellWithRowSpan(oArea.getRowCnt() - 1, iLastCol);
			}
		}
	};

	/**
	 * calculateNewColWidth
	 */	
	this.calculateNewColWidth = function(e) {
		var iDeltaX;
		var iNewColWidth = -1;
		
		if (oResizeCell && oResizeCellRect) {
			iDeltaX = that.getDelta(e);
			if (iDeltaX !== 0) {
				iNewColWidth = oResizeCellRect.width + iDeltaX;		
				// minimal cell width: 1 px -> will give default minimal cell width > 0 during rendering
				iNewColWidth = Math.max(1, iNewColWidth);
			}
		} 

		return iNewColWidth;
	};
	
	/**
	 * getDelta
	 */	
	this.getDelta = function(e) {
		if (bIsRtl) {
			return (iMouseDownX - e.clientX);
		} else {		
			return (e.clientX - iMouseDownX);
		}
	};
	
	/**
	 * resizeCol
	 */	
	this.resizeCol = function(oCell, iWidth) {
		var oUpperArea = oCell.getArea();
		if (oUpperArea.isColHeaderArea()) {
			this.setColWidths(oCell, oUpperArea, oDataArea, iWidth);
		} else if (oUpperArea.isDimHeaderArea()) {
			this.setColWidths(oCell, oUpperArea, oRowHeaderArea, iWidth);
		}
		this.sendUpdateColWidthCommand(oCell, iWidth);
		oCrosstab.invalidate();
	};
	
	/**
	 * setColWidths
	 */	
	this.setColWidths = function(oCell, oUpperArea, oLowerArea, iWidth) {
		var iEffectiveCol;
		var iCol;
		var iEndCol;
		
		iEffectiveCol = oCell.getCol() + oCell.getColSpan() - 1;
		
		if (iWidth > 0) {
			oUpperArea.setColWidth(iEffectiveCol, iWidth);
			oUpperArea.setUserResizedCol(iEffectiveCol);
			oLowerArea.setColWidth(iEffectiveCol, iWidth);
			oLowerArea.setUserResizedCol(iEffectiveCol);
		} else {
			// reset
			iCol = 0;
			iEndCol = oCell.getCol() + oCell.getColSpan() - oCell.getEffectiveColSpan();
			for (iCol = iEffectiveCol; iCol >= iEndCol; iCol--) {
				oUpperArea.resetColWidth(iCol);
				oLowerArea.resetColWidth(iCol);
				oUpperArea.setUserResizedCol(iCol);
				oLowerArea.setUserResizedCol(iCol);
			}			
		}
	};
	
	/**
	 * sendUpdateColWidthCommand
	 */	
	this.sendUpdateColWidthCommand = function(oCell, iWidth) {
		var sCommand = oCrosstab.getUpdateColWidthCommand();
		if (sCommand != null && sCommand.length > 0) {
			var iTableCol = oCell.getTableCol();
			sCommand = sCommand.replace("__COL__", iTableCol);
			sCommand = sCommand.replace("__WIDTH__", Math.round(iWidth));
			var fAction = new Function(sCommand);
			fAction();
		}
	};
};