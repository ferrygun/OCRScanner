jQuery.sap.declare("sap.zen.crosstab.PropertyBag");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");

sap.zen.crosstab.PropertyBag = function (oCrosstab) {

	var bDebugMode = false;
	var bMobileMode = false;
	var bPixelScrolling = false;
	var bHasToolbar = false;
	var iToolbarHeight = 0;
	var bDisplayExceptions = false;
	var bEnableColResize = true;
	var bTestMobileMode = false;
	var sContextMenuCommand = null;
	var iUserHeaderWidth = 0;
	var iMaxHeaderWidth = 0;
	var bFireOnSelectedOnlyOnce = false;
	var bDragDropEnabled = false;
	var bIsRtl = false;
	var sZebraMode = sap.zen.crosstab.rendering.RenderingConstants.ZEBRA_FULL;
	var bIsCozyMode = false;
	var bIsRepeatTexts = false;
	var bIsBookmarkProcessing = false;
	
	this.setBookmarkProcessing = function(pbIsBookmarkProcessing) {
		bIsBookmarkProcessing = pbIsBookmarkProcessing;
	};
	
	this.isBookmarkProcessing = function() {
		return bIsBookmarkProcessing;
	};
	
	this.isRepeatTexts = function() {
		return bIsRepeatTexts;
	};
	
	this.setRepeatTexts = function(pbIsRepeatTexts) {
		bIsRepeatTexts = pbIsRepeatTexts;
	};
	
	this.isDragDropEnabled = function() {
		// no drag and drop in planning mode for now!
		// no drag and drop in mobile mode!
		return bDragDropEnabled && !bMobileMode && !oCrosstab.isPlanningMode() && !bTestMobileMode;
	};
	
	this.setDragDropEnabled = function(pbDragDropEnabled) {
		bDragDropEnabled = pbDragDropEnabled;
	};
	
	this.setUserHeaderWidth = function(piUserHeaderWidth) {
		if (isNaN(piUserHeaderWidth)) {
			iUserHeaderWidth = 0;
		} else {
			iUserHeaderWidth = piUserHeaderWidth;
		}
	};
	
	this.getUserHeaderWidth = function() {
		return iUserHeaderWidth;
	};
	
	this.setMaxHeaderWidth = function(piMaxHeaderWidth) {
		if (isNaN(piMaxHeaderWidth)) {
			iMaxHeaderWidth = 0;
		} else {
			iMaxHeaderWidth = piMaxHeaderWidth;
		}
	};
	
	this.getMaxHeaderWidth = function() {
		return iMaxHeaderWidth;
	};
	
	this.isDebugMode = function () {
		return bDebugMode;
	};

	this.setDebugMode = function (pbDebugMode) {
		bDebugMode = pbDebugMode;
	};

	this.isMobileMode = function () {
		return bMobileMode;
	};

	this.isTestMobileMode = function () {
		return bTestMobileMode;
	};

	this.setMobileMode = function (pbMobileMode) {
		bMobileMode = pbMobileMode;
	};

	this.isPixelScrolling = function () {
		return bPixelScrolling;
	};

	this.setPixelScrolling = function (pbPixelScrolling) {
		bPixelScrolling = pbPixelScrolling;
	};


	this.isDisplayExceptions = function () {
		return bDisplayExceptions;
	};

	this.setDisplayExceptions = function (pbDisplayExceptions) {
		bDisplayExceptions = pbDisplayExceptions;
	};

	this.addText = function (sKey, sText) {
		sap.zen.CrosstabTextCache.oTexts[sKey] = sText;
	};

	this.getText = function (sKey) {
		return sap.zen.CrosstabTextCache.oTexts[sKey];
	};

	this.setContextMenuCommand = function (psContextMenuCommand) {
		sContextMenuCommand = psContextMenuCommand;
	};

	this.getContextMenuCommand = function () {
		return sContextMenuCommand;
	};

	this.setHasToolbar = function (pbHasToolbar) {
		bHasToolbar = pbHasToolbar;
	};

	this.hasToolbar = function () {
		return bHasToolbar;
	};

	this.setToolbarHeight = function (piToolbarHeight) {
		iToolbarHeight = piToolbarHeight;
	};

	this.getToolbarHeight = function () {
		var iHeight = 0;
		if (bHasToolbar) {
			iHeight = iToolbarHeight;
		}
		return iHeight;
	};

	this.setEnableColResize = function (pbEnableColResize) {
		bEnableColResize = pbEnableColResize;
	};

	this.isEnableColResize = function () {
		return bEnableColResize;
	};

	this.addSortingTextLookup = function (sKey, oSortingTextLookup) {
		sap.zen.CrosstabTextCache.oSortingTextLookupTable[sKey] = oSortingTextLookup;
	};

	this.getSortingAltText = function (sKey) {
		var sAltText = "";
		if (sap.zen.CrosstabTextCache.oSortingTextLookupTable[sKey]) {
			sAltText = sap.zen.CrosstabTextCache.oSortingTextLookupTable[sKey].alttext;
		}
		return sAltText;
	};

	this.getSortingToolTip = function (sKey) {
		var sTipKey = null;
		var sToolTip = "";
		if (sap.zen.CrosstabTextCache.oSortingTextLookupTable[sKey]) {
			sTipKey = sap.zen.CrosstabTextCache.oSortingTextLookupTable[sKey].tooltipidx;
		}
		if (sTipKey !== undefined) {
			if (sap.zen.CrosstabTextCache.oSortingTextLookupTable[sTipKey]) {
				sToolTip = sap.zen.CrosstabTextCache.oSortingTextLookupTable[sTipKey].alttext;
			}
		}
		return sToolTip;
	};
	
	this.setFireOnSelectedOnlyOnce = function(pbFireOnSelectedOnlyOnce) {
		bFireOnSelectedOnlyOnce = pbFireOnSelectedOnlyOnce;
	};
	
	this.isFireOnSelectedOnlyOnce = function() {
		return bFireOnSelectedOnlyOnce;
	};
	
	this.isRtl = function() {
		return sap.ui.getCore().getConfiguration().getRTL();
	};
	
	this.setZebraMode = function(psZebraMode) {
		sZebraMode = psZebraMode;
	};
	
	this.getZebraMode = function() {
		return sZebraMode;
	};
	
	this.setCozyMode = function(pbIsCozyMode) {
		bIsCozyMode = pbIsCozyMode;
	};
	
	this.isCozyMode = function() {
		return bIsCozyMode;
	};
};
