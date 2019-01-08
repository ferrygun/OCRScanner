jQuery.sap.declare("sap.zen.crosstab.DimensionHeaderArea");
jQuery.sap.require("sap.zen.crosstab.BaseArea");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");

sap.zen.crosstab.DimensionHeaderArea = function (oCrosstab) {
	"use strict";
	sap.zen.crosstab.BaseArea.call(this, oCrosstab);
	this.sAreaType = sap.zen.crosstab.rendering.RenderingConstants.TYPE_DIMENSION_HEADER_AREA;
};

sap.zen.crosstab.DimensionHeaderArea.prototype = jQuery.sap.newObject(sap.zen.crosstab.BaseArea.prototype);

sap.zen.crosstab.DimensionHeaderArea.prototype.renderArea = function (oRenderManager) {
	var sClasses = "sapzencrosstab-DimensionHeaderArea";
	if (this.oCrosstab.getPropertyBag().isMobileMode()) {
		sClasses += " sapzencrosstab-MobileHeaderSeparator"; 
	}
	this.renderContainerStructure(oRenderManager, sClasses, false, false);
};

sap.zen.crosstab.DimensionHeaderArea.prototype.getPageManager = function () {
	// runtime contract: dim header will always be completely on the first page.
	// Hence, we don't need a page manager.
	return null;
};
