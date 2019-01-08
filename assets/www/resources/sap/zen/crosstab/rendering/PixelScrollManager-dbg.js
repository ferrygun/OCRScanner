jQuery.sap.declare("sap.zen.crosstab.rendering.PixelScrollManager");

sap.zen.crosstab.rendering.PixelScrollManager = function (oCrosstab, oRenderEngine) {
	"use strict";

	var oScrollDivs = {};
	var iCurrentVScrollPos = 0;
	var iCurrentHScrollPos = 0;
	var oCrossRequestManager = oRenderEngine.getCrossRequestManager();
	var that = this;
	var oUpdateTimer = null;
	
	this.getCurrentHScrollPos = function() {
		return iCurrentHScrollPos;
	};

	this.destroy = function () {
		// do nothing
	};

	this.onNewScrollbars = function () {
		oScrollDivs = {};
	};
	oRenderEngine.registerNewScrollbarsNotification(this.onNewScrollbars);

	function getDomScrollDiv (sScrollDivSuffix) {
		var oDomScrollDiv = oScrollDivs[sScrollDivSuffix];
		if (!oDomScrollDiv) {
			oDomScrollDiv = $(document.getElementById(oCrosstab.getId() + sScrollDivSuffix));
			if (oDomScrollDiv && oDomScrollDiv.length > 0) {
				oScrollDivs[sScrollDivSuffix] = oDomScrollDiv;
			}
		}
		return oDomScrollDiv;
	}

	function moveVertical (iPos) {
		getDomScrollDiv("_lowerLeft_scrollDiv").scrollTop(iPos);
		getDomScrollDiv("_lowerRight_scrollDiv").scrollTop(iPos);
	}
	
	function translateScrollPosAndGetDivs(iPos) {
		var iActualScrollPos;
		var oLRS = getDomScrollDiv("_lowerRight_scrollDiv");
		var oURS = getDomScrollDiv("_upperRight_scrollDiv");
		var oDomDiv;
		var oResult = {};
		
		oResult.oLRS = oLRS;
		oResult.oURS = oURS;
		
		if (oURS[0]) {
			oDomDiv = oURS[0];
		} else if (oLRS[0]) {
			oDomDiv = oLRS[0];
		}
		if (oDomDiv) {
			iActualScrollPos = oCrosstab.getUtils().translateScrollLeft(oDomDiv, iPos);
		}
		oResult.iPos = iActualScrollPos;
		
		return oResult;
	}

	function moveHorizontal (iPos) {
		var oMoveInfo = translateScrollPosAndGetDivs(iPos);

		oMoveInfo.oURS.scrollLeft(oMoveInfo.iPos);
		oMoveInfo.oLRS.scrollLeft(oMoveInfo.iPos);
	}

	this.hScrollHandler = function (oEvent) {
		oCrosstab.postPlanningValue();
		var iPos = oEvent.getParameters().newScrollPos;
		moveHorizontal(iPos);
		iCurrentHScrollPos = iPos;
		that.sendClientScrollPosUpdate();
	};

	this.vScrollHandler = function (oEvent) {
		oCrosstab.postPlanningValue();
		var iPos = oEvent.getParameters().newScrollPos;
		moveVertical(iPos);
		iCurrentVScrollPos = iPos;
		that.sendClientScrollPosUpdate();
	};
	
	this.sendClientScrollPosUpdate = function() {
		if (oUpdateTimer) {
			clearTimeout(oUpdateTimer);
			oUpdateTimer = null;
		}
		oUpdateTimer = setTimeout(that.doSendPosUpdate, 200, null);
	};
	
	this.doSendPosUpdate = function() {
		oCrosstab.getUtils().sendClientScrollPosUpdate(iCurrentHScrollPos, undefined, iCurrentVScrollPos, undefined);
	};

	function moveHScrollbar (iPos) {
		var oHScrollbar = oCrosstab.getHScrollbar();
		var oMoveInfo = translateScrollPosAndGetDivs(iPos);
		
		if (oHScrollbar) {
			oHScrollbar.setScrollPosition(iPos);
		}
		oMoveInfo.oURS.scrollLeft(oMoveInfo.iPos);
		oMoveInfo.oLRS.scrollLeft(oMoveInfo.iPos);
	}

	function moveVScrollbar (iPos) {
		var oVScrollbar = oCrosstab.getVScrollbar();
		if (oVScrollbar) {
			oVScrollbar.setScrollPosition(iPos);
		}
		var oDomLowerRightScrollDiv = $(document.getElementById(oCrosstab.getId() + "_lowerRight_scrollDiv"));
		if (oDomLowerRightScrollDiv && oDomLowerRightScrollDiv.length) {
			oDomLowerRightScrollDiv.scrollTop(iPos);
		}
		var oDomLowerLeftScrollDiv = $(document.getElementById(oCrosstab.getId() + "_lowerLeft_scrollDiv"));
		if (oDomLowerLeftScrollDiv && oDomLowerLeftScrollDiv.length) {
			oDomLowerLeftScrollDiv.scrollTop(iPos);
		}
	}

	this.moveScrollbars = function (oScrollbarVisibility, bRenderScrollbars, pbHScrolledToEnd, pbVScrolledToEnd) {
		moveHScrollbar(iCurrentHScrollPos);
		moveVScrollbar(iCurrentVScrollPos);
	};

	this.positionHScrollDiv = function () {
		var iPos = iCurrentHScrollPos;
		var iNewPos = oCrossRequestManager.getHPixelScrollPosAfterRendering();
		if (iNewPos > -1) {
			iPos = iNewPos;
			moveHScrollbar(iPos);
		}
		moveHorizontal(iPos);
	};

	this.positionVScrollDiv = function (oLRS) {
		var iPos = iCurrentVScrollPos;
		var iNewPos = oCrossRequestManager.getVPixelScrollPosAfterRendering();
		if (iNewPos > -1) {
			iPos = iNewPos;
			moveVScrollbar(iPos);
		}
		moveVertical(iPos);
	};

	this.setHScrollPos = function (iHScrollPos) {
		iCurrentHScrollPos = iHScrollPos;
	};

	this.setVScrollPos = function (iVScrollPos) {
		iCurrentVScrollPos = iVScrollPos;
	};

	this.adjustPixelScrollbarAfterRendering = function () {
		var oNewPositions = oCrossRequestManager.getNewPixelScrollPosAfterRendering();
		if (oNewPositions) {
			var iVPos = oNewPositions.iVPos;
			if (iVPos >= 0) {
				oVScrollbar = oCrosstab.getVScrollbar();
				if (oVScrollbar) {
					oVScrollbar.setScrollPosition(iVPos);
					moveVertical(iVPos);
				}
			}
			var iHPos = oNewPositions.iHPos;
			if (iHPos >= 0) {
				oHScrollbar = oCrosstab.getHScrollbar();
				if (oHScrollbar) {
					oHScrollbar.setScrollPosition(iHPos);
					moveHorizontal(iHPos);
				}
			}
		}
	};
};