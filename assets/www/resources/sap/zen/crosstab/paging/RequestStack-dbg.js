jQuery.sap.declare("sap.zen.crosstab.paging.RequestStack");

sap.zen.crosstab.paging.RequestStack = function(iMaxSize) {
	"use strict";

	var aElements = [];
	var aElementRemovedHandlers = [];
	var iMaxElementCnt = iMaxSize;

	this.push = function(oElement) {
		var oRemovedElement = null;
		var bElementRemoved = false;

		var iAlreadyContainedIndex = $.inArray(oElement, aElements);
		if (iAlreadyContainedIndex != -1) {
			aElements.splice(iAlreadyContainedIndex, 1);
		}

		if (iMaxElementCnt) {
			// This is intentional. Stack size shall not be limited
			// unless the length falls below the set max element count.
			// If it did, we might lose requests during a resize which enlarges the crosstab
			if (aElements.length === iMaxElementCnt) {
				oRemovedElement = aElements[0];
				bElementRemoved = true;
				aElements = aElements.splice(1, aElements.length - 1);
			}
			aElements.push(oElement);
			if (bElementRemoved) {
				sendNotification(oRemovedElement);
			}
		} else {
			aElements.push(oElement);
		}
	};

	this.pop = function() {
		return aElements.pop();
	};

	this.peek = function() {
		var oPeekElement = null;
		if (aElements.length > 0) {
			oPeekElement = aElements[aElements.length - 1];
		}
		return oPeekElement;
	};

	this.containsElement = function(oElement) {
		return ($.inArray(oElement, aElements) != -1);
	};

	this.clear = function() {
		aElements = [];
	};

	this.getActualSize = function() {
		return aElements.length;
	};

	this.getMaxSize = function() {
		return iMaxElementCnt;
	};

	this.getElementAt = function(iIndex) {
		var oElement = null;
		if (iIndex >= 0 && iIndex < aElements.length) {
			oElement = aElements[iIndex];
		}
		return oElement;
	};

	this.resetStack = function(iMaxSize) {
		aElements = [];
		iMaxElementCnt = iMaxSize;
	};

	this.unlimitStack = function() {
		iMaxElementCnt = 0;
	};

	this.addElementRemovedHandler = function(fHandler) {
		aElementRemovedHandlers.push(fHandler);
	};

	this.removeElementRemovedHandler = function(fHandler) {
		var iIndex = $.inArray(fHandler, aElementRemovedHandlers);
		if (iIndex !== -1) {
			aElementRemovedHandlers.splice(iIndex, 1);
		}
	};

	this.removeAllElementRemovedHandlers = function() {
		aElementRemovedHandlers = [];
	};

	function sendNotification(oElement) {
		var i = 0;
		var fHandler = null;
		for (i = 0; i < aElementRemovedHandlers.length; i++) {
			fHandler = aElementRemovedHandlers[i];
			if (fHandler) {
				fHandler(oElement);
			}
		}
	}

};