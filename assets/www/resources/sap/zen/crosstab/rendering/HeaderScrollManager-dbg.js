jQuery.sap.declare("sap.zen.crosstab.rendering.HeaderScrollManager");

sap.zen.crosstab.rendering.HeaderScrollManager = function (oCrosstab, oRenderEngine) {
	"use strict";

	var oScrollDivs = {};
	var iCurrentHScrollPos = 0;
	var that = this;
	var oCrossRequestManager = oRenderEngine.getCrossRequestManager();
	var oUpdateTimer = null;
	var oDragDropHandler;

	this.destroy = function () {
		// do nothing
	};

	this.onNewScrollbars = function () {
		oScrollDivs = {};
	};

	oRenderEngine.registerNewScrollbarsNotification(this.onNewScrollbars);

	function getDomScrollDiv (sScrollDivSuffix) {
		var oJqScrollDiv = oScrollDivs[sScrollDivSuffix];
		if (!oJqScrollDiv) {
			oJqScrollDiv = $(document.getElementById(oCrosstab.getId() + sScrollDivSuffix));
			if (oJqScrollDiv && oJqScrollDiv.length > 0) {
				oScrollDivs[sScrollDivSuffix] = oJqScrollDiv;
			}
		}
		return oJqScrollDiv;
	}

	function moveHorizontal () {
		var oLLS = getDomScrollDiv("_lowerLeft_scrollDiv");
		var oULS = getDomScrollDiv("_upperLeft_scrollDiv");
		var iActualScrollPos;
		var oDomDiv;
		
		if (oULS[0]) {
			oDomDiv = oULS[0];
		} else if (oLLS[0]) {
			oDomDiv = oLLS[0];
		}
		
		if (oDomDiv) {
			iActualScrollPos = oCrosstab.getUtils().translateScrollLeft(oDomDiv, iCurrentHScrollPos);			
			oULS.scrollLeft(iActualScrollPos);
			oLLS.scrollLeft(iActualScrollPos);
		}
	}
		
	this.hScrollHandler = function (oEvent) {
		oCrosstab.postPlanningValue();
		var iOldHScrollPos = iCurrentHScrollPos;
		iCurrentHScrollPos = oEvent.getParameters().newScrollPos;
		moveHorizontal();
		if (iOldHScrollPos !== iCurrentHScrollPos) {
			that.sendClientScrollPosUpdateAndAdjustDropAreas();
		}
	};
	
	this.sendClientScrollPosUpdateAndAdjustDropAreas = function() {
		if (oUpdateTimer) {
			clearTimeout(oUpdateTimer);
			oUpdateTimer = null;
		}
		oUpdateTimer = setTimeout(that.doSendPosUpdateAndUpdateDropAreas, 200, null);
	};
	
	this.adjustVerticalDropAreas = function() {		
		if (oCrosstab.getDragDropHandler()) {
			oCrosstab.getDragDropHandler().repositionDropAreasForHeaderScrolling();
		}		
	};
	
	this.doSendPosUpdateAndUpdateDropAreas = function() {	
		oCrosstab.getUtils().sendClientScrollPosUpdate(iCurrentHScrollPos, undefined, undefined, undefined, true);		
		that.adjustVerticalDropAreas();
	};

	this.setHScrollData = function(oHScrollData) {
		if (oHScrollData) {
			iCurrentHScrollPos = oHScrollData.iHPos;
		} else {
			iCurrentHScrollPos = 0;
		}
	};
	
	this.moveScrollbars = function() {
		var oHScrollbar = oCrosstab.getHorizontalHeaderScrollbar();
		if (oHScrollbar) {
			moveHorizontal();
			oHScrollbar.setScrollPosition(iCurrentHScrollPos);
		}
	};
};