jQuery.sap.declare("sap.zen.crosstab.HeaderResizer");

sap.zen.crosstab.HeaderResizer = function (oCrosstab) {
	"use strict";
	
	var that = this;
	var oRenderEngine = oCrosstab.getRenderEngine();
	var oJqResizeHandle = null;
	var oJqRenderSizeDiv = null;
	var iRenderSizeDivWidthForHeaderResize = 0;
	var iLeftAreaContainerWidthForHeaderResize = 0;
	var iOldMouseX = 0;
	var bResizeActive = false;
	
	/**
	 * initialize
	 */	
	this.initialize = function() {
		oJqRenderSizeDiv = oCrosstab.getRenderSizeDiv();
		this.attachEvents();
	};
	
	/**
	 * attachEvents
	 */	
	this.attachEvents = function() {
		var oResizeHandle = $(document.getElementById(oCrosstab.getId() + "_headerResizeHandle"));

		oResizeHandle.unbind("hover");
		oResizeHandle.hover(function() {
			oResizeHandle.addClass("sapzencrosstab-headerResizeHandleActive");
		}, function() {
			if (!bResizeActive) {
				oResizeHandle.removeClass("sapzencrosstab-headerResizeHandleActive");
			}
		});
		
		oResizeHandle.unbind("mousedown", this.onMouseDown);
		oResizeHandle.bind("mousedown", this.onMouseDown);
		
		oResizeHandle.unbind("mousemove", this.onMouseMove);
		oResizeHandle.bind("mousemove", this.onMouseMove);
		
		oResizeHandle.unbind("mouseup", this.onMouseUp);
		oResizeHandle.bind("mouseup", this.onMouseUp);
	};

	/**
	 * onMouseUp
	 */	
	this.onMouseUp = function(e) {	
		var iMaxLeft = oRenderEngine.getLeftAreaContainerWidth();
		var iLeft;
		var sWidth = "";
		
		if (oCrosstab.getPropertyBag().isRtl()) {
			iLeft = parseInt(oJqResizeHandle.css("right"), 10);
		} else {
			iLeft = parseInt(oJqResizeHandle.css("left"), 10);			
		}

		sWidth = iLeft + "";
		oRenderEngine.sendHeaderLimit(sWidth, false);
		
		// cleanup
		bResizeActive = false;
		oJqResizeHandle.removeClass("sapzencrosstab-headerResizeHandleActive");
		oJqResizeHandle = null;
		$(document).unbind("mouseup", that.handleMouseUpHeaderResizeHandle);
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
	};

	/**
	 * onMouseDown
	 */	
	this.onMouseDown = function(e) {
		oJqResizeHandle = $(e.currentTarget);
		iRenderSizeDivWidthForHeaderResize = oJqRenderSizeDiv.outerWidth();
		iLeftAreaContainerWidthForHeaderResize = oRenderEngine.getLeftAreaContainerWidth();
		iOldMouseX = e.clientX;
		$(document).on("mouseup", that.handleMouseUpHeaderResizeHandle);
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
	};
	
	/**
	 * onMouseMove
	 */	
	this.onMouseMove = function(e) {
		var iOldLeft;
		var iDelta;
		var iNewLeft;
		var iMaxLeft;
		var iMaxLimit = oCrosstab.getPropertyBag().getMaxHeaderWidth();

		if (oJqResizeHandle) {
			bResizeActive = true;
			if (oCrosstab.getPropertyBag().isRtl()) {
				iOldLeft = parseInt(oJqResizeHandle.css("right"), 10);
				iDelta = iOldMouseX - e.clientX;
			} else {
				iOldLeft = parseInt(oJqResizeHandle.css("left"), 10);				
				iDelta = e.clientX - iOldMouseX;
			}
			iOldMouseX = e.clientX;
			
			// don't allow larger left values than the non-reduced header size or the size of the rendersizeDiv,
			// depending on what is smaller
			iMaxLeft = Math.min(iLeftAreaContainerWidthForHeaderResize, iRenderSizeDivWidthForHeaderResize);
			if (iMaxLimit > 0) {
				iMaxLeft = Math.min(iMaxLeft, iMaxLimit);
			}
			
			// don't let "left" become 0 by user interaction since this will lead to the weird
			// effect that that this will lead to no limiting at all
			iNewLeft = Math.max(1, Math.min(iOldLeft + iDelta, iMaxLeft));
			if (oCrosstab.getPropertyBag().isRtl()) {
				oJqResizeHandle.css("right", iNewLeft + "px");
			} else {
				oJqResizeHandle.css("left", iNewLeft + "px");
			}
			sap.zen.crosstab.utils.Utils.cancelEvent(e);
		}		
	};
		
	/**
	 * isResizeAction
	 */	
	this.isResizeAction = function() {
		return bResizeActive;
	};
};