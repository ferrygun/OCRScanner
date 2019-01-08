jQuery.sap.declare("sap.zen.crosstab.paging.RequestHandler");
jQuery.sap.require("sap.zen.crosstab.paging.RequestStack");

sap.zen.crosstab.paging.RequestHandler = function(oPageManager) {
	"use strict";

	var oCrosstab = oPageManager.getCrosstab();
	var iPageTileRowCnt = oPageManager.getTileRowCnt();
	var iPageTileColCnt = oPageManager.getTileColCnt();
	var oRequestStack = new sap.zen.crosstab.paging.RequestStack(0);
	var iMaxRequests = 0;
	var iTimeout = 0;

	oRequestStack.addElementRemovedHandler(requestRemovedCallback);

	var oRequestTimer = null;

	this.sendPageRequest = function(oPage) {
		oRequestStack.push(oPage);
		resetTimer();
	};
	
	this.enableTimeout = function(bEnableTimeout) {
		iTimeout = bEnableTimeout ? 1000: 0;
	};

	this.reset = function() {
		oRequestStack.clear();
		iMaxRequests = 0;
		this.enableTimeout(false);
	};

	this.setMaxQueueRequests = function(iMaxRequestCnt) {
		iMaxRequests = iMaxRequestCnt;
	};

	this.getMaxQueueRequests = function() {
		return oRequestStack.getMaxSize();
	};

	this.unlimitStack = function() {
		oRequestStack.unlimitStack();
	};

	function resetTimer() {
		if (oRequestTimer) {
			clearTimeout(oRequestTimer);
		}
		oRequestTimer = setTimeout(handleQueuedRequests.bind(this, oPageManager), iTimeout);
	}

	function sendRequest(oPage, sRequestCommandTemplate) {
		var fReqHandler = oCrosstab.getPageRequestHandler();
		var oPagePos = oPage.getPosition();
		if (fReqHandler) {
			var iRow = Math.floor(oPagePos.iRow);
			var iCol = Math.floor(oPagePos.iCol);
			fReqHandler(iRow, iCol);
		} else {
			var sCommand = buildPageRequestCommand(oPagePos, sRequestCommandTemplate);
			oCrosstab.getUtils().executeCommandAction(sCommand, false, true);
		}
	}

	function handleQueuedRequests(oPageManager) {
		var oPage = null;
		while (oRequestStack.getActualSize() > 0) {
			oPage = oRequestStack.pop();
			// the request template must always be fetched new because it might change
			// depending on the drilldown and the resultset.
			// with some resultsets, either horizontal and/or vertical paging is not available and
			// the request template will reflect this by not including the corresponding sections.
			// However, if then the resultset changes to a larger one that has paging in one or both
			// directions, the initially loaded request template will never get updated and paging
			// will not be possible. Hence, always get the most up-to-date refresh template.
			sendRequest(oPage, oPageManager.getRequestCommandTemplate());
		}
		if (iMaxRequests > 0) {
			oRequestStack.resetStack(iMaxRequests);
			iMaxRequests = 0;
		}
	}

	function requestRemovedCallback(oRemovedPage) {
		oPageManager.removeRequest(oRemovedPage);
	}

	function buildPageRequestCommand(oPagePos, sRequestCommandTemplate) {
		var iRequestedRow = oPagePos.iRow * iPageTileRowCnt + 1;
		var iRequestedCol = oPagePos.iCol * iPageTileColCnt + 1;

		var sCommand = sRequestCommandTemplate.replace("__X__", iRequestedCol);
		sCommand = sCommand.replace("__Y__", iRequestedRow);

		return sCommand;
	}
};